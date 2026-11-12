// Sends the agreements that need a signature.
//   { kind: "client", token }      - a client requested onboarding: MSA and SOW to the client contact.
//   { kind: "employment", talentId } - an admin approved a professional: employment agreement to them.
// Both are idempotent: a second call for the same placement or person sends nothing new.

const { select, patch, userFromToken } = require('../server/supabase');
const { createSubmission } = require('../server/docuseal');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID = /^[0-9a-f-]{36}$/i;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, error: 'Invalid request' });

  try {
    if (body.kind === 'client') return await sendClientAgreements(body.token, res);
    if (body.kind === 'employment') return await sendEmployment(req, body.talentId, res);
    return res.status(400).json({ ok: false, error: 'Unknown request' });
  } catch (err) {
    console.error('[documents]', err);
    return res.status(502).json({ ok: false, error: 'The agreement could not be sent' });
  }
};

async function sendClientAgreements(token, res) {
  if (typeof token !== 'string' || !/^[0-9a-f]{20,64}$/i.test(token)) {
    return res.status(400).json({ ok: false, error: 'Invalid link' });
  }
  const [e] = await select('engagements', `token=eq.${token}&select=id,status,company,contact_email,msa_envelope_id,sow_envelope_id`);
  if (!e) return res.status(404).json({ ok: false, error: 'Invalid link' });
  if (e.msa_envelope_id) return res.status(200).json({ ok: true, sent: false });
  if (e.status !== 'pending_setup') return res.status(409).json({ ok: false, error: 'Onboarding has not been requested' });
  if (!EMAIL.test(e.contact_email || '')) {
    return res.status(400).json({ ok: false, error: 'The client contact email is missing' });
  }

  const common = { role: 'Client', email: e.contact_email, name: e.company };
  const msa = await createSubmission({ ...common, templateId: process.env.DOCUSEAL_TEMPLATE_MSA, externalId: `msa:${e.id}` });
  const sow = await createSubmission({ ...common, templateId: process.env.DOCUSEAL_TEMPLATE_SOW, externalId: `sow:${e.id}` });
  await patch('engagements', `id=eq.${e.id}`, { msa_envelope_id: msa.submissionId, sow_envelope_id: sow.submissionId });
  return res.status(200).json({ ok: true, sent: true });
}

async function sendEmployment(req, talentId, res) {
  const jwt = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const user = jwt ? await userFromToken(jwt) : null;
  if (!user) return res.status(401).json({ ok: false, error: 'Please sign in again' });

  const [profile] = await select('profiles', `id=eq.${user.id}&select=role`);
  if (profile?.role !== 'admin') return res.status(403).json({ ok: false, error: 'Admins only' });

  if (!UUID.test(talentId || '')) return res.status(400).json({ ok: false, error: 'Invalid professional' });
  const [t] = await select('talents', `id=eq.${talentId}&select=id,name,email,status,employment_envelope_id`);
  if (!t) return res.status(404).json({ ok: false, error: 'Professional not found' });
  if (t.status !== 'approved') return res.status(409).json({ ok: false, error: 'Approve the professional first' });
  if (t.employment_envelope_id) return res.status(200).json({ ok: true, sent: false });
  if (!EMAIL.test(t.email || '')) return res.status(400).json({ ok: false, error: 'The professional has no email' });

  const sub = await createSubmission({
    templateId: process.env.DOCUSEAL_TEMPLATE_EMPLOYMENT,
    role: 'Professional',
    email: t.email,
    name: t.name,
    externalId: `employment:${t.id}`,
  });
  await patch('talents', `id=eq.${t.id}`, { employment_envelope_id: sub.submissionId });
  return res.status(200).json({ ok: true, sent: true });
}

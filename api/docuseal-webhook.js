// DocuSeal calls this when a submission is completed (all signers done).
// Set this URL in DocuSeal (Settings → Webhooks) as:
//   https://solimar-delta.vercel.app/api/docuseal-webhook?secret=<DOCUSEAL_WEBHOOK_SECRET>
// DocuSeal does not document how it signs webhooks, so the shared secret in the URL is
// the check. The signing status is re-read from the DocuSeal API before anything is saved.

const { timingSafeEqual } = require('crypto');
const { patch } = require('../server/supabase');
const { getSubmission } = require('../server/docuseal');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const want = process.env.DOCUSEAL_WEBHOOK_SECRET || '';
  const given = String(req.query?.secret ?? '');
  if (!want || given.length !== want.length || !timingSafeEqual(Buffer.from(given), Buffer.from(want))) {
    return res.status(401).json({ ok: false });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = null;
    }
  }
  if (!body || body.event_type !== 'submission.completed') return res.status(200).json({ ok: true, ignored: true });

  const id = String(body.data?.id ?? '');
  if (!/^\d+$/.test(id)) return res.status(400).json({ ok: false });

  const sub = await getSubmission(id);
  if (sub.status !== 'completed') return res.status(200).json({ ok: true, ignored: true });

  const now = new Date().toISOString();
  await patch('engagements', `msa_envelope_id=eq.${id}&msa_signed_at=is.null`, { msa_signed_at: now });
  await patch('engagements', `sow_envelope_id=eq.${id}&sow_signed_at=is.null`, { sow_signed_at: now });
  await patch('talents', `employment_envelope_id=eq.${id}&employment_signed_at=is.null`, { employment_signed_at: now });
  return res.status(200).json({ ok: true });
};

// DocuSeal Cloud API (https://www.docuseal.com/docs/api). Auth: X-Auth-Token header.
const BASE = process.env.DOCUSEAL_API_BASE || 'https://api.docuseal.com';

function headers() {
  return { 'X-Auth-Token': process.env.DOCUSEAL_API_KEY, 'Content-Type': 'application/json' };
}

/**
 * Sends a template to one signer. DocuSeal emails the signing link itself.
 * Returns the submission id, which we store to match the webhook later.
 */
async function createSubmission({ templateId, role, email, name, externalId }) {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      template_id: Number(templateId),
      send_email: true,
      submitters: [{ role, email, name, external_id: externalId }],
    }),
  });
  if (!res.ok) throw new Error(`DocuSeal create submission failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const first = Array.isArray(json) ? json[0] : json.submitters?.[0];
  const submissionId = first?.submission_id ?? json.id;
  if (!submissionId) throw new Error('DocuSeal returned no submission id');
  return { submissionId: String(submissionId) };
}

async function getSubmission(id) {
  const res = await fetch(`${BASE}/submissions/${encodeURIComponent(id)}`, { headers: headers() });
  if (!res.ok) throw new Error(`DocuSeal get submission failed: ${res.status}`);
  return res.json();
}

module.exports = { createSubmission, getSubmission };

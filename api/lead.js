// Vercel serverless function: receives "Schedule a call" submissions.
// Set LEAD_WEBHOOK_URL (Slack, Zapier, Make, a CRM, etc.) in Vercel project
// settings to have each lead forwarded as JSON. Without it, leads are only
// written to the function logs.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

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
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }

  // Honeypot: real visitors never fill this field. Pretend success for bots.
  if (clean(body.company_site, 200)) {
    return res.status(200).json({ ok: true });
  }

  const lead = {
    name: clean(body.name, 200),
    email: clean(body.email, 320).toLowerCase(),
    notes: clean(body.notes, 4000),
    receivedAt: new Date().toISOString(),
  };

  if (!lead.name || !EMAIL.test(lead.email)) {
    return res.status(400).json({ ok: false, error: 'Name and a valid work email are required' });
  }

  console.log('[lead]', JSON.stringify(lead));

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (webhook) {
    try {
      const r = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...lead,
          text: `New call request: ${lead.name} <${lead.email}>\n${lead.notes || '(no notes)'}`,
        }),
      });
      if (!r.ok) throw new Error(`Webhook responded ${r.status}`);
    } catch (err) {
      console.error('[lead] webhook failed', err);
      return res.status(502).json({ ok: false, error: 'Could not deliver your request' });
    }
  }

  return res.status(200).json({ ok: true });
};

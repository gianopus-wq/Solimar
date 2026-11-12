// Vercel serverless function: forwards app events to your automation (Make.com).
// Set MAKE_WEBHOOK_URL in the Vercel project to a Make.com custom webhook.
// Events:
//   onboarding_requested   - a client clicked "Add to Team / Request Onboarding"
//   talent_confirmed_setup - a professional confirmed they joined the client's systems
//   talent_approved        - an admin approved a professional (Documenso employment agreement is sent)
// Without MAKE_WEBHOOK_URL the event is only written to the function logs and
// the response says `forwarded: false`.

const EVENTS = new Set(['onboarding_requested', 'talent_confirmed_setup', 'talent_approved']);

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
  if (!body || typeof body !== 'object' || !EVENTS.has(body.event)) {
    return res.status(400).json({ ok: false, error: 'Unknown event' });
  }

  const payload = { event: body.event, data: body.data ?? {}, sentAt: new Date().toISOString() };
  if (JSON.stringify(payload).length > 20000) {
    return res.status(413).json({ ok: false, error: 'Payload too large' });
  }
  console.log('[event]', JSON.stringify(payload));

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (!webhook) return res.status(200).json({ ok: true, forwarded: false });

  try {
    const r = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(`Webhook responded ${r.status}`);
  } catch (err) {
    console.error('[event] webhook failed', err);
    return res.status(502).json({ ok: false, error: 'Automation did not respond' });
  }
  return res.status(200).json({ ok: true, forwarded: true });
};

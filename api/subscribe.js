// Vercel serverless function: subscribes an email to Beehiiv.
// The API key lives ONLY in the Vercel dashboard (BEEHIIV_API_KEY env var).
// It must never appear in page code, which is public.
const PUB_ID = 'pub_d9211856-e49d-40fb-9d96-8880290d4ab8';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  const key = process.env.BEEHIIV_API_KEY;
  if (!key) {
    return res.status(500).json({ ok: false, error: 'not_configured' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const email = (body && body.email ? String(body.email) : '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }
  const r = await fetch('https://api.beehiiv.com/v2/publications/' + PUB_ID + '/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({
      email: email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: (body && body.source) || 'free-reset-page'
    })
  });
  if (!r.ok) {
    const text = await r.text().catch(function () { return ''; });
    return res.status(502).json({ ok: false, error: 'beehiiv_error', status: r.status, detail: text.slice(0, 200) });
  }
  return res.status(200).json({ ok: true });
};

/**
 * ══════════════════════════════════════════════════════════════
 * /api/meta-event.js — Vercel Serverless Function
 * SmartSeller · gosmartseller.com
 *
 * Receives hashed event data from the browser and forwards
 * to Meta Conversions API (server-side, deduplication-ready)
 * ══════════════════════════════════════════════════════════════
 */

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      event_name,
      event_time,
      action_source,
      event_source_url,
      user_data,
      custom_data
    } = req.body;

    const PIXEL_ID   = process.env.META_PIXEL_ID   || '971637128917888';
    const API_TOKEN  = process.env.META_CAPI_TOKEN;
    const API_VER    = 'v18.0';

    if (!API_TOKEN) {
      console.warn('[SmartSeller] META_CAPI_TOKEN not set — skipping CAPI.');
      return res.status(200).json({ status: 'skipped', reason: 'not_configured' });
    }

    const payload = {
      data: [{
        event_name:       event_name       || 'Lead',
        event_time:       event_time       || Math.floor(Date.now() / 1000),
        action_source:    action_source    || 'website',
        event_source_url: event_source_url || 'https://gosmartseller.com',
        user_data:        user_data        || {},
        custom_data:      custom_data      || {}
      }]
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/${API_VER}/${PIXEL_ID}/events?access_token=${API_TOKEN}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      }
    );

    const metaData = await metaRes.json();
    console.log(`[SmartSeller] Meta CAPI → ${event_name}:`, JSON.stringify(metaData));

    return res.status(200).json({ status: 'ok', meta_response: metaData });

  } catch (err) {
    console.error('[SmartSeller] meta-event error:', err);
    return res.status(500).json({ error: err.message });
  }
};

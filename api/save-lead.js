/**
 * ══════════════════════════════════════════════════════════════
 * /api/save-lead.js — Vercel Serverless Function
 * SmartSeller Valuation Optimizer · gosmartseller.com
 *
 * Handles:
 *   1. Save lead to Supabase (PostgreSQL)
 *   2. Send plain-text email via SMTP
 *   3. Forward to Google Sheets (Apps Script)
 *
 * Triggered by: quiz form submission (fSubmit) in index.html
 * ══════════════════════════════════════════════════════════════
 */

const nodemailer = require('nodemailer');

// ── CORS preflight ────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Supabase REST insert (no SDK needed — pure fetch) ─────────
async function saveToSupabase(data) {
  const url  = process.env.SUPABASE_URL || 'https://arnkmuxactmghhbgtzgm.supabase.co';
  const key  = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn('[SmartSeller] Supabase not configured — skipping DB save.');
    return null;
  }

  const payload = {
    source:        data.source        || '',
    name:          data.name          || '',
    email:         data.email         || '',
    company:       data.company       || '',
    linkedin:      data.extra         || '',
    business_type: data.businessType  || '',
    revenue:       data.revenue       || '',
    exit_goal:     data.goal          || '',
    biggest_gap:   data.gap           || '',
    answers:       data.answers       || {},
    // Calculator data (optional)
    calc_mode:     data.calcMode      || null,
    calc_arr:      data.calcArr       || null,
    calc_revenue:  data.calcRevenue   || null,
    calc_margin:   data.calcMargin    || null,
    calc_multiple: data.calcMultiple  || null,
    calc_upside:   data.calcUpside    || null,
    created_at:    new Date().toISOString()
  };

  const res = await fetch(`${url}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        key,
      'Authorization': `Bearer ${key}`,
      'Prefer':        'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[SmartSeller] Supabase error:', err);
    return null;
  }

  const result = await res.json();
  console.log('[SmartSeller] Supabase lead saved. ID:', result?.[0]?.id);
  return result?.[0]?.id || null;
}

// ── Send email via SMTP ───────────────────────────────────────
async function sendEmail(data) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, EMAIL_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER) {
    console.warn('[SmartSeller] SMTP not configured — skipping email.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   parseInt(SMTP_PORT) || 587,
    secure: parseInt(SMTP_PORT) === 465,
    auth:   { user: SMTP_USER, pass: SMTP_PASS }
  });

  const sep = '─'.repeat(48);
  const body = [
    'SMARTSELLER — NEW LEAD',
    sep, '',
    `Timestamp:     ${new Date().toISOString()}`,
    `Source:        ${data.source || 'Website'}`, '',
    sep, 'CONTACT', sep, '',
    `Name:          ${data.name    || '—'}`,
    `Email:         ${data.email   || '—'}`,
    `Company:       ${data.company || '—'}`,
    `LinkedIn:      ${data.extra   || '—'}`, '',
    sep, 'ASSESSMENT ANSWERS', sep, '',
    `Business Type: ${data.businessType || '—'}`,
    `Revenue / ARR: ${data.revenue      || '—'}`,
    `Exit Goal:     ${data.goal         || '—'}`,
    `Biggest Gap:   ${data.gap          || '—'}`, '',
  ];

  // Calculator data if present
  if (data.calcMode) {
    body.push(sep, 'CALCULATOR DATA', sep, '');
    body.push(`Mode:          ${data.calcMode}`);
    if (data.calcArr)      body.push(`ARR:           ${data.calcArr}`);
    if (data.calcRevenue)  body.push(`Revenue:       ${data.calcRevenue}`);
    if (data.calcMargin)   body.push(`Margin:        ${data.calcMargin}`);
    if (data.calcMultiple) body.push(`Multiple:      ${data.calcMultiple}`);
    if (data.calcUpside)   body.push(`Upside Est.:   ${data.calcUpside}`);
    body.push('');
  }

  body.push(sep);
  body.push('gosmartseller.com — SmartSeller Valuation Optimizer');
  body.push(sep);

  await transporter.sendMail({
    from:     SMTP_FROM || SMTP_USER,
    to:       EMAIL_TO  || 'cpiccinini93@gmail.com',
    replyTo:  data.email,
    subject:  `[SmartSeller Lead] ${data.name || 'New submission'} — ${data.source || 'Website'} — ${new Date().toLocaleDateString('en-US')}`,
    text:     body.join('\n')
  });

  console.log('[SmartSeller] Email sent to:', EMAIL_TO);
}

// ── Forward to Google Sheets ──────────────────────────────────
async function sendToSheets(data, leadId) {
  const endpoint = process.env.SHEETS_ENDPOINT;
  if (!endpoint || endpoint.includes('YOUR_SCRIPT')) return;

  await fetch(endpoint, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...data, supabase_id: leadId })
  }).catch(e => console.warn('[SmartSeller] Sheets error:', e.message));
}

// ── Main handler ──────────────────────────────────────────────
module.exports = async function handler(req, res) {
  cors(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    if (!data || !data.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Run all three in parallel for speed
    const [leadId] = await Promise.allSettled([
      saveToSupabase(data),
      sendEmail(data),
    ]);

    // Sheets is fire-and-forget (no-cors, no response expected)
    const id = leadId.status === 'fulfilled' ? leadId.value : null;
    sendToSheets(data, id);

    return res.status(200).json({
      status:   'ok',
      lead_id:  id,
      ts:       new Date().toISOString()
    });

  } catch (err) {
    console.error('[SmartSeller] save-lead error:', err);
    return res.status(500).json({ error: err.message });
  }
};

/**
 * ══════════════════════════════════════════════════════════════
 * SMARTSELLER — Backend Node.js (Email via SMTP)
 * ══════════════════════════════════════════════════════════════
 *
 * COMO USAR:
 *
 * 1. Instale Node.js (https://nodejs.org) se ainda não tiver
 * 2. Na pasta deste arquivo, rode no terminal:
 *      npm install
 * 3. Crie um arquivo .env com suas credenciais (veja abaixo)
 * 4. Rode o servidor:
 *      node backend.js
 *      (ou: npm start)
 *
 * HOSPEDAGEM GRATUITA (recomendado para produção):
 * - Render.com: conecte seu GitHub e faça deploy como "Web Service"
 * - Railway.app: similar, plano gratuito disponível
 * - Após deploy, pegue a URL pública e coloque no HTML:
 *   EMAIL_ENDPOINT: 'https://seu-app.onrender.com/send-email'
 *
 * ── Arquivo .env (crie na mesma pasta, NÃO commite no Git) ────
 *
 * SMTP_HOST=smtp.seudominio.com.br
 * SMTP_PORT=587
 * SMTP_USER=cassio@smartseller.com
 * SMTP_PASS=sua_senha_aqui
 * SMTP_FROM=SmartSeller <cassio@smartseller.com>
 * EMAIL_TO=cpiccinini93@gmail.com
 * PORT=3000
 * ALLOWED_ORIGIN=*
 *
 * Para Gmail/Google Workspace:
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=587
 *   SMTP_USER=seu@gmail.com
 *   SMTP_PASS=sua_app_password  (gere em myaccount.google.com/apppasswords)
 *
 * ══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// ── SMTP Transporter ─────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465, // true para porta 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'SmartSeller Email Backend' });
});

// ── Email endpoint ────────────────────────────────────────────
app.post('/send-email', async (req, res) => {
  try {
    const data = req.body;

    // Validate minimum required fields
    if (!data.email) {
      return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    // Build plain-text email body (as requested — no formatting)
    const emailBody = buildEmailBody(data);

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_TO,
      subject: `[SmartSeller Lead] ${data.name || 'New submission'} — ${data.source || 'Website'} — ${new Date().toLocaleDateString('en-US')}`,
      text: emailBody,
      // Optional: also send a reply-to the lead's email for easy follow-up
      replyTo: data.email
    });

    console.log(`[${new Date().toISOString()}] Email sent for: ${data.email}`);
    res.json({ status: 'ok', message: 'Email sent' });

  } catch (err) {
    console.error('[SmartSeller] Email error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Build plain-text email body ───────────────────────────────
function buildEmailBody(data) {
  const separator = '─'.repeat(48);
  const lines = [
    'SMARTSELLER — NEW LEAD',
    separator,
    '',
    `Timestamp: ${data.timestamp || new Date().toISOString()}`,
    `Source: ${data.source || 'Website'}`,
    '',
    separator,
    'CONTACT',
    separator,
    '',
    `Name: ${data.name || '—'}`,
    `Email: ${data.email || '—'}`,
    `Company: ${data.company || '—'}`,
    `LinkedIn: ${data.extra || '—'}`,
    '',
    separator,
    'ASSESSMENT ANSWERS',
    separator,
    '',
    `Business Type / Channel: ${data.businessType || '—'}`,
    `Revenue / ARR: ${data.revenue || '—'}`,
    `Exit Goal: ${data.goal || '—'}`,
    `Biggest Gap: ${data.gap || '—'}`,
    ''
  ];

  // Add all raw answers if available
  if (data.answers && Object.keys(data.answers).length > 0) {
    lines.push(separator);
    lines.push('ALL ANSWERS (RAW)');
    lines.push(separator);
    lines.push('');
    for (const [key, value] of Object.entries(data.answers)) {
      lines.push(`${key}: ${value}`);
    }
    lines.push('');
  }

  lines.push(separator);
  lines.push('SmartSeller Valuation Optimizer');
  lines.push('This email was sent automatically when a visitor completed the Exit Assessment.');
  lines.push(separator);

  return lines.join('\n');
}

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[SmartSeller] Email backend running on port ${PORT}`);
  console.log(`[SmartSeller] SMTP: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
  console.log(`[SmartSeller] Sending to: ${process.env.EMAIL_TO}`);
});

module.exports = app;

// ── Meta Conversions API endpoint ─────────────────────────────
app.post('/meta-event', async (req, res) => {
  try {
    const {
      event_name,
      event_time,
      action_source,
      event_source_url,
      user_data,
      custom_data
    } = req.body;

    // ⚠ Add to your .env:
    //   META_PIXEL_ID=your_pixel_id_here
    //   META_CAPI_TOKEN=EAAbELDHaahQBRfihXDkZBCVguc5BQOq0bilaY9ndwbiupSCiyti1HHZBXLcHOHRrJiEpyBePx8D6jeO6XqHNUvyRo1UhlE98MrZCJWrIejsbyMCxQ881ZAVWzOBss9UufjNR0nSe6oLZAOLOxcPb53xQEWZBVaVBH6q2i44Usw6FTpjCwXfqnKPU5WnTfbVUyDigZDZD
    const PIXEL_ID  = process.env.META_PIXEL_ID;
    const API_TOKEN = process.env.META_CAPI_TOKEN;
    const API_VERSION = 'v18.0';

    if (!PIXEL_ID || !API_TOKEN) {
      console.warn('[SmartSeller] META_PIXEL_ID or META_CAPI_TOKEN not set in .env');
      return res.status(200).json({ status: 'skipped', reason: 'not_configured' });
    }

    const payload = {
      data: [{
        event_name:        event_name || 'Lead',
        event_time:        event_time || Math.floor(Date.now() / 1000),
        action_source:     action_source || 'website',
        event_source_url:  event_source_url || '',
        user_data:         user_data || {},
        custom_data:       custom_data || {}
      }]
    };

    const metaRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const metaData = await metaRes.json();
    console.log(`[${new Date().toISOString()}] Meta CAPI → ${event_name}: `, metaData);
    res.json({ status: 'ok', meta_response: metaData });

  } catch (err) {
    console.error('[SmartSeller] Meta CAPI error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

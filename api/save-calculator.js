/**
 * ══════════════════════════════════════════════════════════════
 * /api/save-calculator.js — Vercel Serverless Function
 * SmartSeller · gosmartseller.com
 *
 * Saves anonymous calculator usage to Supabase
 * for analytics: ARR, margins, upside estimates, mode
 * Triggered when user reaches the qual form after running calc
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
    const data = req.body;
    const url  = process.env.SUPABASE_URL || 'https://arnkmuxactmghhbgtzgm.supabase.co';
    const key  = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
      return res.status(200).json({ status: 'skipped', reason: 'supabase_not_configured' });
    }

    const payload = {
      mode:             data.mode      || 'saas',    // 'saas' | 'ecom'
      // SaaS fields
      arr:              data.arr       || null,
      churn_current:    data.churn     || null,
      churn_target:     data.churnTarget || null,
      gross_margin:     data.grossMargin || null,
      ebitda_margin:    data.ebitdaMargin || null,
      growth_rate:      data.growthRate || null,
      current_multiple: data.multiple  || null,
      ltv_cac:          data.ltvCac    || null,
      // Ecom fields
      revenue:          data.revenue   || null,
      contribution_margin:        data.cm  || null,
      contribution_margin_target: data.cm2 || null,
      overhead:         data.overhead  || null,
      // Output
      current_valuation:  data.currentVal  || null,
      optimized_valuation: data.optimizedVal || null,
      upside_value:       data.upside || null,
      // Meta
      session_id:       data.sessionId || null,
      referrer:         data.referrer  || null,
      created_at:       new Date().toISOString()
    };

    const supaRes = await fetch(`${url}/rest/v1/calculator_sessions`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        key,
        'Authorization': `Bearer ${key}`,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify(payload)
    });

    if (!supaRes.ok) {
      const err = await supaRes.text();
      console.error('[SmartSeller] Supabase calc error:', err);
      return res.status(500).json({ error: err });
    }

    console.log('[SmartSeller] Calculator session saved.');
    return res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('[SmartSeller] save-calculator error:', err);
    return res.status(500).json({ error: err.message });
  }
};

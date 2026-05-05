-- ══════════════════════════════════════════════════════════════
-- SMARTSELLER — Supabase Schema
-- gosmartseller.com · PostgreSQL via Supabase
--
-- HOW TO RUN:
-- 1. Acesse app.supabase.com → seu projeto → SQL Editor
-- 2. Cole todo este arquivo e clique em Run
-- 3. As 3 tabelas serão criadas com índices e RLS
-- ══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- TABLE 1: leads
-- Stores every quiz submission (SaaS, Ecommerce, Calculator)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source tracking
  source          TEXT,        -- 'SaaS Page' | 'E-commerce Page' | 'Calculator Page'

  -- Contact info
  name            TEXT,
  email           TEXT,
  company         TEXT,
  linkedin        TEXT,

  -- Quiz answers
  business_type   TEXT,        -- e.g. 'SaaS / Subscription business'
  revenue         TEXT,        -- e.g. '$2M – $5M'
  exit_goal       TEXT,        -- e.g. 'Full acquisition — 6 to 12 months'
  biggest_gap     TEXT,        -- e.g. 'High churn or low NRR'
  answers         JSONB,       -- Full answers object {key: value}

  -- Calculator data (captured at form time if user ran calc first)
  calc_mode       TEXT,        -- 'saas' | 'ecom'
  calc_arr        NUMERIC,
  calc_revenue    NUMERIC,
  calc_margin     NUMERIC,
  calc_multiple   NUMERIC,
  calc_upside     NUMERIC,

  -- CRM status
  status          TEXT DEFAULT 'new',    -- 'new' | 'contacted' | 'qualified' | 'closed'
  notes           TEXT,
  supabase_id     UUID                   -- self-reference for dedup
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS leads_email_idx      ON leads (email);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_source_idx     ON leads (source);
CREATE INDEX IF NOT EXISTS leads_status_idx     ON leads (status);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow backend (service role) to insert
CREATE POLICY "service_role_all" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- Deny public read (leads are private)
CREATE POLICY "no_public_read" ON leads
  FOR SELECT USING (false);


-- ─────────────────────────────────────────────────────────────
-- TABLE 2: calculator_sessions
-- Anonymous calculator usage for funnel analytics
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calculator_sessions (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id                  TEXT,        -- random client-side ID for dedup

  -- Mode
  mode                        TEXT,        -- 'saas' | 'ecom'

  -- SaaS inputs
  arr                         NUMERIC,
  churn_current               NUMERIC,
  churn_target                NUMERIC,
  gross_margin                NUMERIC,
  ebitda_margin               NUMERIC,
  growth_rate                 NUMERIC,
  current_multiple            NUMERIC,
  ltv_cac                     NUMERIC,

  -- Ecom inputs
  revenue                     NUMERIC,
  contribution_margin         NUMERIC,
  contribution_margin_target  NUMERIC,
  overhead                    NUMERIC,

  -- Outputs (what user saw)
  current_valuation           NUMERIC,
  optimized_valuation         NUMERIC,
  upside_value                NUMERIC,

  -- Attribution
  referrer                    TEXT
);

CREATE INDEX IF NOT EXISTS calc_created_at_idx ON calculator_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS calc_mode_idx       ON calculator_sessions (mode);
CREATE INDEX IF NOT EXISTS calc_session_idx    ON calculator_sessions (session_id);

ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON calculator_sessions
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- TABLE 3: bookings
-- Confirmed scheduling events (user clicked "I've scheduled")
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  lead_id     UUID REFERENCES leads(id) ON DELETE SET NULL,
  name        TEXT,
  email       TEXT,
  company     TEXT,
  source      TEXT,         -- which quiz triggered the booking
  confirmed   BOOLEAN DEFAULT false,
  notes       TEXT
);

CREATE INDEX IF NOT EXISTS bookings_email_idx     ON bookings (email);
CREATE INDEX IF NOT EXISTS bookings_lead_id_idx   ON bookings (lead_id);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings (created_at DESC);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON bookings
  FOR ALL USING (auth.role() = 'service_role');


-- ─────────────────────────────────────────────────────────────
-- HELPER VIEW: lead_dashboard
-- Useful for quick Supabase dashboard queries
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW lead_dashboard AS
SELECT
  l.id,
  l.created_at,
  l.source,
  l.name,
  l.email,
  l.company,
  l.business_type,
  l.revenue,
  l.exit_goal,
  l.biggest_gap,
  l.calc_mode,
  l.calc_upside,
  l.status,
  b.confirmed AS booking_confirmed,
  b.created_at AS booking_date
FROM leads l
LEFT JOIN bookings b ON b.lead_id = l.id
ORDER BY l.created_at DESC;


-- ─────────────────────────────────────────────────────────────
-- CONFIRMATION
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✓ SmartSeller schema created successfully.';
  RAISE NOTICE '  Tables: leads, calculator_sessions, bookings';
  RAISE NOTICE '  View:   lead_dashboard';
  RAISE NOTICE '  Next:   copy your SUPABASE_URL and SUPABASE_SERVICE_KEY to Vercel env vars';
END $$;

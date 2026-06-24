-- 009_enable_rls.sql
-- Enable Row Level Security on all public tables.
--
-- Architecture: all writes go through Next.js API routes using the service role
-- key, which bypasses RLS by design. The only direct anon-key access from the
-- client is a COUNT query on buyer_requests (broker dashboard stats).
--
-- buyer_requests: public SELECT allowed (feed is public, count queries work)
-- All other tables: no public policies → service role only

-- ── buyer_requests ────────────────────────────────────────────────────────────
ALTER TABLE buyer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read requests"
  ON buyer_requests FOR SELECT
  USING (true);

-- ── broker_profiles ───────────────────────────────────────────────────────────
ALTER TABLE broker_profiles ENABLE ROW LEVEL SECURITY;

-- ── buyer_profiles ────────────────────────────────────────────────────────────
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

-- ── lead_purchases ────────────────────────────────────────────────────────────
ALTER TABLE lead_purchases ENABLE ROW LEVEL SECURITY;

-- ── request_reports ───────────────────────────────────────────────────────────
ALTER TABLE request_reports ENABLE ROW LEVEL SECURITY;

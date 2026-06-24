-- 010_featured_requests.sql
-- Add featured_until to buyer_requests for paid highlighting in the feed.
-- featured_until: null = normal, future timestamp = highlighted until that date.

ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_requests_featured
  ON buyer_requests(featured_until)
  WHERE featured_until IS NOT NULL;

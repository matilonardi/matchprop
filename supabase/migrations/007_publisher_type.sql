-- Add publisher type and agency name to buyer_requests
ALTER TABLE buyer_requests
  ADD COLUMN IF NOT EXISTS publisher_type TEXT NOT NULL DEFAULT 'particular'
    CHECK (publisher_type IN ('particular', 'inmobiliaria')),
  ADD COLUMN IF NOT EXISTS agency_name TEXT;

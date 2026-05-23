-- Migration: Add car purchase request support
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

ALTER TABLE buyer_requests
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'property',
  ADD COLUMN IF NOT EXISTS car_brands TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS car_body_styles TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS car_year_min INTEGER,
  ADD COLUMN IF NOT EXISTS car_year_max INTEGER,
  ADD COLUMN IF NOT EXISTS car_condition TEXT,
  ADD COLUMN IF NOT EXISTS car_km_max INTEGER,
  ADD COLUMN IF NOT EXISTS car_fuel_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS car_transmission TEXT;

-- Backfill existing rows as property requests
UPDATE buyer_requests SET request_type = 'property' WHERE request_type IS NULL OR request_type = '';

-- Add check constraint
ALTER TABLE buyer_requests
  DROP CONSTRAINT IF EXISTS request_type_check;

ALTER TABLE buyer_requests
  ADD CONSTRAINT request_type_check CHECK (request_type IN ('property', 'car'));

-- Index for faster tab filtering
CREATE INDEX IF NOT EXISTS idx_buyer_requests_request_type ON buyer_requests (request_type, status, created_at DESC);

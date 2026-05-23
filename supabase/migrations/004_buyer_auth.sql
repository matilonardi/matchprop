-- Migration: Buyer accounts and anti-spam
-- Run AFTER 003_messages.sql

-- 1. Buyer profiles table (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyer_profiles_user_id ON buyer_profiles(user_id);

-- RLS
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;

-- Buyers can read/update their own profile
CREATE POLICY "buyers_manage_own_profile" ON buyer_profiles
  FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "service_role_buyer_profiles" ON buyer_profiles
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- 2. Link buyer_requests to auth.users (nullable for backward compat with old anonymous requests)
ALTER TABLE buyer_requests
  ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_requests_buyer_user_id ON buyer_requests(buyer_user_id);

-- Buyers can see their own requests (in addition to existing public read)
-- (buyer_requests already has RLS; add a policy for authenticated buyers)
CREATE POLICY "buyers_read_own_requests" ON buyer_requests
  FOR SELECT TO authenticated
  USING (buyer_user_id = auth.uid());

-- Buyers can update (close) their own requests
CREATE POLICY "buyers_update_own_requests" ON buyer_requests
  FOR UPDATE TO authenticated
  USING (buyer_user_id = auth.uid());

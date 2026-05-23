-- Migration: In-app messaging between brokers and buyers
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id    UUID NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
  broker_id     UUID REFERENCES broker_profiles(id) ON DELETE SET NULL,
  sender_type   TEXT NOT NULL DEFAULT 'broker' CHECK (sender_type IN ('broker', 'buyer')),
  content       TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_request_id ON messages(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_broker_id  ON messages(broker_id);

-- RLS: brokers can only read/write messages on requests they've unlocked
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Brokers can insert if they have a lead_purchase for this request
CREATE POLICY "brokers_insert_messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    broker_id = (SELECT id FROM broker_profiles WHERE user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM lead_purchases
      WHERE broker_id = (SELECT id FROM broker_profiles WHERE user_id = auth.uid())
        AND request_id = messages.request_id
    )
  );

-- Brokers can read messages on requests they've unlocked
CREATE POLICY "brokers_read_messages" ON messages
  FOR SELECT TO authenticated
  USING (
    broker_id = (SELECT id FROM broker_profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM lead_purchases
      WHERE broker_id = (SELECT id FROM broker_profiles WHERE user_id = auth.uid())
        AND request_id = messages.request_id
    )
  );

-- Service role (API) can do everything
CREATE POLICY "service_role_all" ON messages
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

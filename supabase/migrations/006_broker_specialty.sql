-- Migration: Add specialty field to broker_profiles
-- Identifies whether a broker operates in properties, vehicles, or both
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/aqndahpjtkjgmwyltruy/sql

ALTER TABLE broker_profiles
  ADD COLUMN IF NOT EXISTS specialty TEXT NOT NULL DEFAULT 'propiedades'
    CHECK (specialty IN ('propiedades', 'vehiculos', 'ambos'));

COMMENT ON COLUMN broker_profiles.specialty IS
  'Broker vertical: propiedades | vehiculos | ambos';

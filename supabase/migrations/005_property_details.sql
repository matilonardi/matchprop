-- Migration: Property detail fields (superficie, cocheras, seguridad específica)
-- Run AFTER 004_buyer_auth.sql

ALTER TABLE buyer_requests
  ADD COLUMN IF NOT EXISTS area_cubierta_min   INT,
  ADD COLUMN IF NOT EXISTS area_cubierta_max   INT,
  ADD COLUMN IF NOT EXISTS area_terreno_min    INT,
  ADD COLUMN IF NOT EXISTS area_terreno_max    INT,
  ADD COLUMN IF NOT EXISTS terreno_frente_min  NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS terreno_frente_max  NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS terreno_fondo_min   NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS terreno_fondo_max   NUMERIC(6,1),
  ADD COLUMN IF NOT EXISTS cocheras_min        INT,
  ADD COLUMN IF NOT EXISTS seguridad_tipos     TEXT[] DEFAULT '{}';

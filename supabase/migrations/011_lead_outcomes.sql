-- 011_lead_outcomes.sql
-- Track broker outcome for each unlocked contact (survey at T+10 days).

ALTER TABLE lead_purchases
  ADD COLUMN IF NOT EXISTS outcome TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS outcome_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS survey_email_sent_at TIMESTAMPTZ DEFAULT NULL;

-- Constraint on valid outcome values
ALTER TABLE lead_purchases
  ADD CONSTRAINT IF NOT EXISTS lead_purchases_outcome_check
  CHECK (outcome IS NULL OR outcome IN (
    'nada', 'envie_opciones', 'hubo_visita',
    'hubo_negociacion', 'hubo_reserva', 'hubo_venta'
  ));

CREATE INDEX IF NOT EXISTS idx_lead_purchases_survey
  ON lead_purchases(purchased_at)
  WHERE outcome IS NULL;

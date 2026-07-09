-- Preferencias de alertas por broker.
-- alert_frequency: 'instant' (default) | 'daily' | 'weekly' | 'off'
ALTER TABLE broker_profiles ADD COLUMN IF NOT EXISTS alert_frequency text DEFAULT 'instant';

-- Marca cuándo se envió por email cada alerta (para no repetir en los digests diarios/semanales).
ALTER TABLE broker_alerts ADD COLUMN IF NOT EXISTS emailed_at timestamptz;

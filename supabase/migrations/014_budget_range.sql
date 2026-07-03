-- Presupuesto como rango: "Desde" opcional junto al "Hasta" existente.
-- budget_usd / budget_ars siguen siendo el tope (compatibilidad con filtros y matching).
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS budget_usd_min integer;
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS budget_ars_min integer;

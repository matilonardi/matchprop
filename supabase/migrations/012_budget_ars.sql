-- Add budget_ars column for rental prices in ARS (pesos argentinos)
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS budget_ars integer;

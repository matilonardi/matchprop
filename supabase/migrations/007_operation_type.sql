-- Agregar tipo de operación (compra / alquiler) a buyer_requests
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS operation_type text DEFAULT 'compra';

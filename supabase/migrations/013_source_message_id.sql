-- Anti-duplicado determinístico para el bot de WhatsApp.
-- Guarda el ID único del mensaje de origen (msg.id._serialized).
-- El índice único garantiza que el MISMO mensaje no se cargue dos veces,
-- aunque el parser LLM lo interprete distinto entre corridas.
ALTER TABLE buyer_requests ADD COLUMN IF NOT EXISTS source_message_id text;

-- Índice único parcial: solo aplica a filas con source_message_id (publicaciones del bot).
-- Los pedidos cargados por compradores en el wizard quedan con NULL y no se ven afectados.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_buyer_requests_source_message_id
  ON buyer_requests (source_message_id)
  WHERE source_message_id IS NOT NULL;

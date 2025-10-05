
-- Migration: Adicionar coluna numero aos chamados

-- 1. Criar sequence para numero
CREATE SEQUENCE IF NOT EXISTS chamados_numero_seq;

-- 2. Adicionar coluna numero com default usando a sequence
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS numero INTEGER DEFAULT nextval('chamados_numero_seq') NOT NULL;

-- 3. Associar a sequence à coluna
ALTER SEQUENCE chamados_numero_seq OWNED BY chamados.numero;

-- 4. Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_chamados_numero ON chamados(numero);

-- 5. Comentário na coluna
COMMENT ON COLUMN chamados.numero IS 'Número sequencial do chamado para referência';

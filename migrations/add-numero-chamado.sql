
-- Migration: Adicionar coluna numero aos chamados

-- 1. Adicionar coluna numero (auto-incremento para número do chamado)
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS numero SERIAL;

-- 2. Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_chamados_numero ON chamados(numero);

-- 3. Comentário na coluna
COMMENT ON COLUMN chamados.numero IS 'Número sequencial do chamado para referência';

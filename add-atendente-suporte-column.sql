
-- Adicionar coluna atendente_suporte_id na tabela cliente_historico
ALTER TABLE cliente_historico 
ADD COLUMN IF NOT EXISTS atendente_suporte_id TEXT;

-- Comentário da nova coluna
COMMENT ON COLUMN cliente_historico.atendente_suporte_id IS 'ID do usuário atendente de suporte';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cliente_historico' 
AND column_name = 'atendente_suporte_id';


-- Adicionar coluna numero_chamado na tabela cliente_historico
ALTER TABLE cliente_historico 
ADD COLUMN IF NOT EXISTS numero_chamado TEXT;

-- Comentário da nova coluna
COMMENT ON COLUMN cliente_historico.numero_chamado IS 'Número ou URL do chamado de suporte';

-- Verificar se a coluna foi criada
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cliente_historico' 
AND column_name = 'numero_chamado';

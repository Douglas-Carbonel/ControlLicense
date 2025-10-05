
-- Migration: Adicionar campo solicitante aos chamados

-- 1. Adicionar coluna solicitante_id (permitir NULL temporariamente)
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS solicitante_id INTEGER;

-- 2. Atualizar registros existentes com usuarioAberturaId como solicitante
UPDATE chamados 
SET solicitante_id = usuario_abertura_id 
WHERE solicitante_id IS NULL;

-- 3. Tornar a coluna NOT NULL após popular os dados
ALTER TABLE chamados 
ALTER COLUMN solicitante_id SET NOT NULL;

-- 4. Adicionar índice
CREATE INDEX IF NOT EXISTS idx_chamados_solicitante ON chamados(solicitante_id);

-- 5. Comentário na coluna
COMMENT ON COLUMN chamados.solicitante_id IS 'ID do usuário solicitante do chamado (pode ser diferente do usuário de abertura em casos de admins/internos)';

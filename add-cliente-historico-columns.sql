
-- Adicionar colunas faltantes na tabela cliente_historico
ALTER TABLE cliente_historico 
ADD COLUMN IF NOT EXISTS anexos TEXT[],
ADD COLUMN IF NOT EXISTS checklist_instalacao TEXT,
ADD COLUMN IF NOT EXISTS checklist_atualizacao TEXT,
ADD COLUMN IF NOT EXISTS observacoes_checklist TEXT;

-- Comentários das novas colunas
COMMENT ON COLUMN cliente_historico.anexos IS 'Array de URLs/links para prints e documentos';
COMMENT ON COLUMN cliente_historico.checklist_instalacao IS 'JSON com checklist de instalação';
COMMENT ON COLUMN cliente_historico.checklist_atualizacao IS 'JSON com checklist de atualização';
COMMENT ON COLUMN cliente_historico.observacoes_checklist IS 'Observações específicas do checklist';

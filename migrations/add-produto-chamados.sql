
-- Adicionar campo produto na tabela chamados
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS produto TEXT;

-- Atualizar chamados existentes com um valor padrão
UPDATE chamados 
SET produto = 'CRM_ONE_WEB' 
WHERE produto IS NULL;

-- Tornar o campo obrigatório após popular os existentes
ALTER TABLE chamados 
ALTER COLUMN produto SET NOT NULL;

-- Comentário
COMMENT ON COLUMN chamados.produto IS 'Produto relacionado ao chamado: CRM_ONE_WEB, CRM_ONE_APP, VENDA_RAPIDA, ZEUS';

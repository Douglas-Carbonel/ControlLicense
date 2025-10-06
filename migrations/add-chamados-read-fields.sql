
-- Migration: Adicionar campos de controle de leitura em chamados

-- 1. Adicionar campos de controle de leitura
ALTER TABLE chamados 
ADD COLUMN IF NOT EXISTS lido_por_solicitante BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS lido_por_atendente BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS data_ultima_interacao TIMESTAMP;

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_chamados_lido_solicitante ON chamados(lido_por_solicitante);
CREATE INDEX IF NOT EXISTS idx_chamados_lido_atendente ON chamados(lido_por_atendente);
CREATE INDEX IF NOT EXISTS idx_chamados_data_ultima_interacao ON chamados(data_ultima_interacao);

-- 3. Comentários
COMMENT ON COLUMN chamados.lido_por_solicitante IS 'Indica se o solicitante já visualizou a última resposta';
COMMENT ON COLUMN chamados.lido_por_atendente IS 'Indica se o atendente interno já visualizou o chamado';
COMMENT ON COLUMN chamados.data_ultima_interacao IS 'Data e hora da última interação/resposta no chamado';

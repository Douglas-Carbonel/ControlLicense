
-- Migration: Otimização de Performance para Chamados

-- 1. Índices compostos para queries mais rápidas
CREATE INDEX IF NOT EXISTS idx_chamados_status_prioridade ON chamados(status, prioridade);
CREATE INDEX IF NOT EXISTS idx_chamados_cliente_status ON chamados(cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_chamados_solicitante_status ON chamados(solicitante_id, status);
CREATE INDEX IF NOT EXISTS idx_chamados_data_abertura_status ON chamados(data_abertura DESC, status);

-- 2. Índices para leitura de chamados
CREATE INDEX IF NOT EXISTS idx_chamados_lido_solicitante ON chamados(solicitante_id, lido_por_solicitante) WHERE lido_por_solicitante = false;
CREATE INDEX IF NOT EXISTS idx_chamados_lido_atendente ON chamados(lido_por_atendente) WHERE lido_por_atendente = false;

-- 3. Índices para interações (já existem parciais, mas vamos otimizar)
CREATE INDEX IF NOT EXISTS idx_chamado_interacoes_chamado_created ON chamado_interacoes(chamado_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chamado_interacoes_usuario ON chamado_interacoes(usuario_id);

-- 4. Índices para pendências
CREATE INDEX IF NOT EXISTS idx_chamado_pendencias_chamado_created ON chamado_pendencias(chamado_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chamado_pendencias_resolvido ON chamado_pendencias(chamado_id, resolvido);

-- 5. Análise das tabelas para atualizar estatísticas do PostgreSQL
ANALYZE chamados;
ANALYZE chamado_interacoes;
ANALYZE chamado_pendencias;
ANALYZE users;

-- 6. Comentários de documentação
COMMENT ON INDEX idx_chamados_status_prioridade IS 'Índice composto para filtros de status e prioridade';
COMMENT ON INDEX idx_chamados_cliente_status IS 'Índice para busca por cliente e status';
COMMENT ON INDEX idx_chamados_lido_solicitante IS 'Índice parcial para chamados não lidos pelo solicitante';
COMMENT ON INDEX idx_chamados_lido_atendente IS 'Índice parcial para chamados não lidos pelo atendente';

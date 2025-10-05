
-- Migration: Sistema de Chamados

-- 1. Criar tabela de chamados
CREATE TABLE IF NOT EXISTS chamados (
    id SERIAL PRIMARY KEY,
    categoria TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ABERTO',
    prioridade TEXT NOT NULL DEFAULT 'MEDIA',
    usuario_abertura_id INTEGER NOT NULL,
    solicitante_id INTEGER NOT NULL,
    cliente_id TEXT NOT NULL,
    representante_id INTEGER,
    atendente_id INTEGER,
    data_abertura TIMESTAMP DEFAULT NOW() NOT NULL,
    data_previsao TIMESTAMP,
    data_fechamento TIMESTAMP,
    observacoes TEXT,
    anexos TEXT[],
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Criar tabela de pendências
CREATE TABLE IF NOT EXISTS chamado_pendencias (
    id SERIAL PRIMARY KEY,
    chamado_id INTEGER NOT NULL,
    motivo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    responsavel_id INTEGER NOT NULL,
    resolvido BOOLEAN NOT NULL DEFAULT false,
    data_resolucao TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. Criar tabela de interações
CREATE TABLE IF NOT EXISTS chamado_interacoes (
    id SERIAL PRIMARY KEY,
    chamado_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    mensagem TEXT NOT NULL,
    anexos TEXT[],
    tipo TEXT NOT NULL DEFAULT 'COMENTARIO',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_chamados_usuario_abertura ON chamados(usuario_abertura_id);
CREATE INDEX IF NOT EXISTS idx_chamados_cliente ON chamados(cliente_id);
CREATE INDEX IF NOT EXISTS idx_chamados_status ON chamados(status);
CREATE INDEX IF NOT EXISTS idx_chamados_categoria ON chamados(categoria);
CREATE INDEX IF NOT EXISTS idx_chamado_pendencias_chamado ON chamado_pendencias(chamado_id);
CREATE INDEX IF NOT EXISTS idx_chamado_interacoes_chamado ON chamado_interacoes(chamado_id);

-- 5. Comentários nas tabelas
COMMENT ON TABLE chamados IS 'Tabela de chamados/tickets do sistema';
COMMENT ON TABLE chamado_pendencias IS 'Pendências registradas em chamados';
COMMENT ON TABLE chamado_interacoes IS 'Histórico de interações e comentários em chamados';

COMMENT ON COLUMN chamados.categoria IS 'INSTALACAO, MELHORIA, BUG, ATENDIMENTO';
COMMENT ON COLUMN chamados.status IS 'ABERTO, PENDENTE, SOLUCIONADO, FECHADO';
COMMENT ON COLUMN chamados.prioridade IS 'BAIXA, MEDIA, ALTA, URGENTE';

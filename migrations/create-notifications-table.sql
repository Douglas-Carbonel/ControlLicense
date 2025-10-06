
-- Migration: Sistema de Notificações

CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- 'NOVO_CHAMADO', 'RESPOSTA_CHAMADO', 'STATUS_ALTERADO', 'ATRIBUICAO'
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    chamado_id INTEGER,
    lida BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_chamado_id ON notificacoes(chamado_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at ON notificacoes(created_at);

-- Comentários
COMMENT ON TABLE notificacoes IS 'Tabela de notificações do sistema';
COMMENT ON COLUMN notificacoes.tipo IS 'Tipo da notificação';
COMMENT ON COLUMN notificacoes.lida IS 'Indica se a notificação foi lida pelo usuário';

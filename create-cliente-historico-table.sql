
-- Criar tabela cliente_historico
CREATE TABLE IF NOT EXISTS cliente_historico (
    id SERIAL PRIMARY KEY,
    codigo_cliente TEXT NOT NULL,
    nome_cliente TEXT NOT NULL,
    ambiente TEXT,
    versao_instalada TEXT,
    versao_anterior TEXT,
    tipo_atualizacao TEXT NOT NULL,
    observacoes TEXT,
    responsavel TEXT NOT NULL,
    data_ultimo_acesso TIMESTAMP,
    caso_critico BOOLEAN NOT NULL DEFAULT false,
    status_atual TEXT NOT NULL DEFAULT 'CONCLUIDO',
    tempo_gasto INTEGER,
    problemas TEXT,
    solucoes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cliente_historico_codigo ON cliente_historico(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_status ON cliente_historico(status_atual);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_tipo ON cliente_historico(tipo_atualizacao);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_created ON cliente_historico(created_at);

-- Comentários da tabela
COMMENT ON TABLE cliente_historico IS 'Histórico de atualizações, acessos e suporte aos clientes';
COMMENT ON COLUMN cliente_historico.codigo_cliente IS 'Código do cliente (referência ao licenses.code)';
COMMENT ON COLUMN cliente_historico.tipo_atualizacao IS 'Tipo: INSTALACAO, ATUALIZACAO, MANUTENCAO, ACESSO';
COMMENT ON COLUMN cliente_historico.status_atual IS 'Status: EM_ANDAMENTO, CONCLUIDO, PENDENTE';
COMMENT ON COLUMN cliente_historico.tempo_gasto IS 'Tempo gasto em minutos';

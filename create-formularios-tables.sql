
-- Criação das tabelas para sistema de formulários de cliente

-- Tabela de formulários de cliente
CREATE TABLE IF NOT EXISTS formulario_cliente (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    cod_cliente TEXT NOT NULL,
    nome_cliente TEXT NOT NULL,
    premissas TEXT,
    campos TEXT NOT NULL, -- JSON com os campos do formulário
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, preenchido, expirado
    url_publica TEXT NOT NULL UNIQUE, -- URL única para o cliente
    data_expiracao TIMESTAMP,
    criado_por TEXT NOT NULL, -- Nome do usuário que criou
    criado_por_id INTEGER NOT NULL, -- ID do usuário que criou
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabela de respostas dos formulários
CREATE TABLE IF NOT EXISTS resposta_formulario (
    id SERIAL PRIMARY KEY,
    formulario_id INTEGER NOT NULL REFERENCES formulario_cliente(id) ON DELETE CASCADE,
    respostas TEXT NOT NULL, -- JSON com as respostas
    nome_contato TEXT NOT NULL,
    email_contato TEXT NOT NULL,
    telefone_contato TEXT,
    empresa TEXT NOT NULL,
    observacoes TEXT,
    ip_origem TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_formulario_cliente_status ON formulario_cliente(status);
CREATE INDEX IF NOT EXISTS idx_formulario_cliente_cod_cliente ON formulario_cliente(cod_cliente);
CREATE INDEX IF NOT EXISTS idx_formulario_cliente_url ON formulario_cliente(url_publica);
CREATE INDEX IF NOT EXISTS idx_resposta_formulario_formulario_id ON resposta_formulario(formulario_id);

-- Comentários das tabelas
COMMENT ON TABLE formulario_cliente IS 'Formulários de onboarding para novos clientes';
COMMENT ON TABLE resposta_formulario IS 'Respostas dos clientes aos formulários de onboarding';

-- Comentários das colunas principais
COMMENT ON COLUMN formulario_cliente.campos IS 'JSON com definição dos campos do formulário';
COMMENT ON COLUMN formulario_cliente.premissas IS 'Premissas e informações importantes para o cliente';
COMMENT ON COLUMN formulario_cliente.url_publica IS 'URL única e anônima para acesso do cliente';
COMMENT ON COLUMN resposta_formulario.respostas IS 'JSON com as respostas do cliente aos campos do formulário';

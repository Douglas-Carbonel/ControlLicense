
-- Criar tabela de consultorias/parceiros
CREATE TABLE IF NOT EXISTS consultorias (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    email TEXT,
    telefone TEXT,
    whatsapp TEXT,
    responsavel TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar tabela de relacionamento cliente x consultoria
CREATE TABLE IF NOT EXISTS cliente_consultoria (
    id SERIAL PRIMARY KEY,
    codigo_cliente TEXT NOT NULL,
    consultoria_id INTEGER NOT NULL REFERENCES consultorias(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP DEFAULT NOW() NOT NULL,
    data_fim TIMESTAMP,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Adicionar colunas ao histórico de clientes
ALTER TABLE cliente_historico 
ADD COLUMN IF NOT EXISTS consultoria_id INTEGER REFERENCES consultorias(id),
ADD COLUMN IF NOT EXISTS chamado_consultoria TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_consultorias_ativo ON consultorias(ativo);
CREATE INDEX IF NOT EXISTS idx_cliente_consultoria_cliente ON cliente_consultoria(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_cliente_consultoria_consultoria ON cliente_consultoria(consultoria_id);
CREATE INDEX IF NOT EXISTS idx_cliente_consultoria_ativo ON cliente_consultoria(codigo_cliente, consultoria_id) WHERE data_fim IS NULL;
CREATE INDEX IF NOT EXISTS idx_historico_consultoria ON cliente_historico(consultoria_id);

-- Comentários
COMMENT ON TABLE consultorias IS 'Cadastro de consultorias/parceiros que vendem e dão suporte';
COMMENT ON TABLE cliente_consultoria IS 'Relacionamento entre clientes e suas consultorias';
COMMENT ON COLUMN cliente_historico.consultoria_id IS 'Consultoria que abriu o chamado (se aplicável)';
COMMENT ON COLUMN cliente_historico.chamado_consultoria IS 'Número do chamado na consultoria (ex: UpperTools)';

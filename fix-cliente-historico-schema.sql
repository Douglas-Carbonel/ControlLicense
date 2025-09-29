
-- Script para corrigir completamente a tabela cliente_historico
-- Execute este script no console SQL do Replit

-- Primeiro, vamos verificar se a tabela existe e criar se necessário
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

-- Agora adicionar as colunas que estão faltando uma por uma
DO $$
BEGIN
    -- Adicionar coluna anexos se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente_historico' 
        AND column_name = 'anexos'
    ) THEN
        ALTER TABLE cliente_historico ADD COLUMN anexos TEXT[];
    END IF;

    -- Adicionar coluna checklist_instalacao se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente_historico' 
        AND column_name = 'checklist_instalacao'
    ) THEN
        ALTER TABLE cliente_historico ADD COLUMN checklist_instalacao TEXT;
    END IF;

    -- Adicionar coluna checklist_atualizacao se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente_historico' 
        AND column_name = 'checklist_atualizacao'
    ) THEN
        ALTER TABLE cliente_historico ADD COLUMN checklist_atualizacao TEXT;
    END IF;

    -- Adicionar coluna observacoes_checklist se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente_historico' 
        AND column_name = 'observacoes_checklist'
    ) THEN
        ALTER TABLE cliente_historico ADD COLUMN observacoes_checklist TEXT;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cliente_historico_codigo ON cliente_historico(codigo_cliente);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_status ON cliente_historico(status_atual);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_tipo ON cliente_historico(tipo_atualizacao);
CREATE INDEX IF NOT EXISTS idx_cliente_historico_created ON cliente_historico(created_at);

-- Adicionar comentários
COMMENT ON TABLE cliente_historico IS 'Histórico de atualizações, acessos e suporte aos clientes';
COMMENT ON COLUMN cliente_historico.codigo_cliente IS 'Código do cliente (referência ao licenses.code)';
COMMENT ON COLUMN cliente_historico.tipo_atualizacao IS 'Tipo: INSTALACAO, ATUALIZACAO_MOBILE, ATUALIZACAO_PORTAL, ACESSO_REMOTO, ATENDIMENTO_WHATSAPP, REUNIAO_CLIENTE';
COMMENT ON COLUMN cliente_historico.status_atual IS 'Status: EM_ANDAMENTO, CONCLUIDO, PENDENTE';
COMMENT ON COLUMN cliente_historico.tempo_gasto IS 'Tempo gasto em minutos';
COMMENT ON COLUMN cliente_historico.anexos IS 'Array de URLs/links para prints e documentos';
COMMENT ON COLUMN cliente_historico.checklist_instalacao IS 'JSON com checklist de instalação';
COMMENT ON COLUMN cliente_historico.checklist_atualizacao IS 'JSON com checklist de atualização';
COMMENT ON COLUMN cliente_historico.observacoes_checklist IS 'Observações específicas do checklist';

-- Verificar se todas as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cliente_historico' 
ORDER BY ordinal_position;

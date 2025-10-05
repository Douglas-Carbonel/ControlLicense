
-- Migration: Adicionar campos para usuários internos

-- Adicionar campos de setor e nível
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS setor TEXT,
ADD COLUMN IF NOT EXISTS nivel TEXT;

-- Atualizar comentários
COMMENT ON COLUMN users.role IS 'Tipo de usuário: admin, interno, support, representante, cliente_final';
COMMENT ON COLUMN users.setor IS 'Setor do usuário interno: desenvolvimento, suporte, implantacao, comercial';
COMMENT ON COLUMN users.nivel IS 'Nível/cargo do usuário: analista_n1, analista_n2, analista_n3, gerente, dev_web, dev_app, analista';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_setor ON users(setor) WHERE role = 'interno';
CREATE INDEX IF NOT EXISTS idx_users_nivel ON users(nivel) WHERE role = 'interno';

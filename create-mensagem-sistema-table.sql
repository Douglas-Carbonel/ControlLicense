
-- Script para criar a tabela mensagem_sistema
-- Execute este script no SQL Editor do Supabase ou PostgreSQL

CREATE TABLE IF NOT EXISTS mensagem_sistema (
  id SERIAL PRIMARY KEY,
  mensagem TEXT NOT NULL,
  base TEXT NOT NULL,
  email_usuario TEXT NOT NULL,
  data_validade TIMESTAMP NOT NULL,
  hardware_key TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_mensagem_sistema_base ON mensagem_sistema(base);
CREATE INDEX IF NOT EXISTS idx_mensagem_sistema_hardware_key ON mensagem_sistema(hardware_key);
CREATE INDEX IF NOT EXISTS idx_mensagem_sistema_data_validade ON mensagem_sistema(data_validade);
CREATE INDEX IF NOT EXISTS idx_mensagem_sistema_email_usuario ON mensagem_sistema(email_usuario);

-- Comentários nas colunas
COMMENT ON TABLE mensagem_sistema IS 'Tabela para armazenar mensagens do sistema por base e hardware';
COMMENT ON COLUMN mensagem_sistema.mensagem IS 'Conteúdo da mensagem';
COMMENT ON COLUMN mensagem_sistema.base IS 'Nome da base/database';
COMMENT ON COLUMN mensagem_sistema.email_usuario IS 'Email do usuário destinatário';
COMMENT ON COLUMN mensagem_sistema.data_validade IS 'Data de validade da mensagem';
COMMENT ON COLUMN mensagem_sistema.hardware_key IS 'Chave de hardware associada';

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO mensagem_sistema (mensagem, base, email_usuario, data_validade, hardware_key) VALUES
('Mensagem de teste do sistema', 'SBO_DEMO', 'admin@exemplo.com', '2024-12-31 23:59:59', 'D0950733748'),
('Atualização importante disponível', 'SBO_PROD', 'usuario@exemplo.com', '2024-02-29 23:59:59', 'B1684091176');

-- Verificar se a tabela foi criada com sucesso
SELECT COUNT(*) as total_mensagens FROM mensagem_sistema;

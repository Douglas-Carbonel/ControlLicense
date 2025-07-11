
-- Execute este script no SQL Editor do Supabase para criar as tabelas necessárias

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'support',
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar tabela de licenças
CREATE TABLE IF NOT EXISTS licenses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  linha INTEGER,
  ativo BOOLEAN NOT NULL DEFAULT true,
  cod_cliente TEXT NOT NULL,
  nome_cliente TEXT NOT NULL,
  dados_empresa TEXT,
  hardware_key TEXT,
  install_number TEXT,
  system_number TEXT,
  nome_db TEXT,
  desc_db TEXT,
  end_api TEXT,
  lista_cnpj TEXT,
  qt_licencas INTEGER,
  versao_sap TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Criar índice único para code e linha
CREATE UNIQUE INDEX IF NOT EXISTS unique_code_linha ON licenses(code, linha);

-- Criar tabela de atividades
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  description TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Inserir usuário administrador inicial
INSERT INTO users (username, email, password_hash, role, name, active) 
VALUES (
  'admin', 
  'admin@sistema.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
  'admin', 
  'Administrador do Sistema', 
  true
) ON CONFLICT (username) DO NOTHING;

-- Inserir usuário técnico inicial
INSERT INTO users (username, email, password_hash, role, name, active) 
VALUES (
  'tecnico', 
  'tecnico@sistema.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- tech123
  'support', 
  'Técnico do Sistema', 
  true
) ON CONFLICT (username) DO NOTHING;

-- Mostrar usuários criados
SELECT id, username, email, role, name, active, created_at 
FROM users 
ORDER BY created_at;

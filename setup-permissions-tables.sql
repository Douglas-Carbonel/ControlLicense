
-- Criar tabelas de permissões
CREATE TABLE IF NOT EXISTS permission_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS menu_permissions (
  id SERIAL PRIMARY KEY,
  permission_group_id INTEGER NOT NULL,
  menu_id TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(permission_group_id, menu_id)
);

CREATE TABLE IF NOT EXISTS field_permissions (
  id SERIAL PRIMARY KEY,
  permission_group_id INTEGER NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(permission_group_id, table_name, field_name)
);

-- Adicionar coluna permission_group_id na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS permission_group_id INTEGER;

-- Criar grupo padrão para técnicos
INSERT INTO permission_groups (name, description, is_default) 
VALUES ('Técnicos', 'Grupo padrão para usuários técnicos', true)
ON CONFLICT (name) DO NOTHING;

-- Obter ID do grupo técnicos
DO $$
DECLARE
    group_id INTEGER;
BEGIN
    SELECT id INTO group_id FROM permission_groups WHERE name = 'Técnicos';
    
    -- Permissões de menu para técnicos
    INSERT INTO menu_permissions (permission_group_id, menu_id, can_access, can_create, can_edit, can_delete, can_export)
    VALUES 
        (group_id, 'licenses', true, true, true, false, false)
    ON CONFLICT (permission_group_id, menu_id) DO NOTHING;
    
    -- Permissões de campos para técnicos (restritas para CNPJ e quantidade)
    INSERT INTO field_permissions (permission_group_id, table_name, field_name, can_view, can_edit)
    VALUES 
        (group_id, 'licenses', 'listaCnpj', true, false),
        (group_id, 'licenses', 'qtLicencas', true, false)
    ON CONFLICT (permission_group_id, table_name, field_name) DO NOTHING;
END $$;

-- Atualizar usuários técnicos existentes para usar o grupo padrão
UPDATE users 
SET permission_group_id = (SELECT id FROM permission_groups WHERE name = 'Técnicos')
WHERE role = 'support' AND permission_group_id IS NULL;


-- Renomear tabela consultorias para representantes
ALTER TABLE IF EXISTS consultorias RENAME TO representantes;

-- Renomear coluna consultoria_id para representante_id na tabela cliente_consultoria
ALTER TABLE IF EXISTS cliente_consultoria RENAME COLUMN consultoria_id TO representante_id;

-- Renomear a tabela cliente_consultoria para cliente_representante
ALTER TABLE IF EXISTS cliente_consultoria RENAME TO cliente_representante;

-- Atualizar índices (o PostgreSQL renomeia automaticamente os índices quando a tabela é renomeada)

-- Verificar as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('representantes', 'cliente_representante');

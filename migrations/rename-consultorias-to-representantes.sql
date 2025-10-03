
-- Renomear tabela consultorias para representantes
ALTER TABLE IF EXISTS consultorias RENAME TO representantes;

-- Renomear coluna consultoriaId para representanteId na tabela cliente_consultoria
ALTER TABLE IF EXISTS cliente_consultoria RENAME COLUMN "consultoriaId" TO "representanteId";

-- Renomear a tabela cliente_consultoria para cliente_representante
ALTER TABLE IF EXISTS cliente_consultoria RENAME TO cliente_representante;

-- Atualizar índices e constraints se necessário
-- (O PostgreSQL automaticamente renomeia os índices quando a tabela é renomeada)

-- Verificar as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('representantes', 'cliente_representante');

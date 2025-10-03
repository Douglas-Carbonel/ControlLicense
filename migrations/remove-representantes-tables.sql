
-- Remover colunas de representante da tabela cliente_historico
ALTER TABLE IF EXISTS cliente_historico 
DROP COLUMN IF EXISTS representante_id,
DROP COLUMN IF EXISTS chamado_representante;

-- Remover tabela de relacionamento
DROP TABLE IF EXISTS cliente_representante;

-- Remover tabela de representantes
DROP TABLE IF EXISTS representantes;

-- Remover tabela antiga consultorias se existir
DROP TABLE IF EXISTS cliente_consultoria;
DROP TABLE IF EXISTS consultorias;

-- Verificar tabelas removidas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('representantes', 'cliente_representante', 'consultorias', 'cliente_consultoria');

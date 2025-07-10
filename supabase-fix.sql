-- Script para corrigir as quantidades no Supabase
-- Execute este script diretamente no SQL Editor do Supabase

-- Primeiro, vamos ver os dados atuais
SELECT COUNT(*) as total_registros FROM licenses;
SELECT SUM(qt_licencas) as total_licencas FROM licenses;

-- Limpar dados existentes
DELETE FROM licenses;
DELETE FROM activities;

-- Resetar sequences se necessário
ALTER SEQUENCE licenses_id_seq RESTART WITH 1;
ALTER SEQUENCE activities_id_seq RESTART WITH 1;

-- Agora você precisa reimportar o CSV com as quantidades corretas
-- Use o recurso de importação do Supabase ou execute os INSERTs abaixo

-- Exemplo de alguns registros com quantidades corretas (baseado no CSV):
INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0005', 1, 'CLIENTE EXEMPLO', 50, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0005', 2, 'CLIENTE EXEMPLO', 50, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0015', 1, 'CLIENTE EXEMPLO', 1, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0016', 1, 'CLIENTE EXEMPLO', 3, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0016', 2, 'CLIENTE EXEMPLO', 3, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0021', 3, 'CLIENTE EXEMPLO', 16, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0021', 4, 'CLIENTE EXEMPLO', 16, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0033', 1, 'CLIENTE EXEMPLO', 63, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0033', 2, 'CLIENTE EXEMPLO', 63, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação'),
('C0033', 3, 'CLIENTE EXEMPLO', 63, true, 'Licença Padrão', '2025-01-01', '2025-12-31', 'Observação');

-- Verificar os resultados
SELECT COUNT(*) as total_registros FROM licenses;
SELECT SUM(qt_licencas) as total_licencas FROM licenses;
SELECT code, linha, qt_licencas FROM licenses ORDER BY code, linha LIMIT 10;
-- Script completo para importar todas as licenças no Supabase
-- Execute este script no SQL Editor do Supabase

-- Limpar dados existentes
DELETE FROM licenses;
DELETE FROM activities;

-- Resetar sequences
ALTER SEQUENCE licenses_id_seq RESTART WITH 1;
ALTER SEQUENCE activities_id_seq RESTART WITH 1;

-- Inserir todos os registros

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0005', 1, '', 50, false, '', NULL, NULL, ''),
('C0005', 2, '', 50, false, '', NULL, NULL, ''),
('C0015', 1, '', 1, false, '', NULL, NULL, ''),
('C0016', 1, '', 3, false, '', NULL, NULL, ''),
('C0016', 2, '', 3, false, '', NULL, NULL, ''),
('C0021', 3, '', 16, false, '', NULL, NULL, ''),
('C0021', 4, '', 16, false, '', NULL, NULL, ''),
('C0033', 1, '', 63, false, '', NULL, NULL, ''),
('C0033', 2, '', 63, false, '', NULL, NULL, ''),
('C0033', 3, '', 63, false, '', NULL, NULL, ''),
('C0034', 1, '', 57, false, '', NULL, NULL, ''),
('C0034', 2, '', 57, false, '', NULL, NULL, ''),
('C0036', 1, '', 20, false, '', NULL, NULL, ''),
('C0036', 2, '', 48, false, '', NULL, NULL, ''),
('C0036', 3, '', 15, false, '', NULL, NULL, ''),
('C0038', 1, '', 33, false, '', NULL, NULL, ''),
('C0038', 2, '', 33, false, '', NULL, NULL, ''),
('C0043', 1, '', 35, false, '', NULL, NULL, ''),
('C0043', 2, '', 35, false, '', NULL, NULL, ''),
('C0043', 3, '', 35, false, '', NULL, NULL, ''),
('C0043', 5, '', 35, false, '', NULL, NULL, ''),
('C0043', 8, '', 35, false, '', NULL, NULL, ''),
('C0045', 1, '', 52, false, '', NULL, NULL, ''),
('C0045', 2, '', 52, false, '', NULL, NULL, ''),
('C0045', 3, '', 0, false, '', NULL, NULL, ''),
('C0045', 4, '', 0, false, '', NULL, NULL, ''),
('C0045', 5, '', 52, false, '', NULL, NULL, ''),
('C0045', 6, '', 52, false, '', NULL, NULL, ''),
('C0045', 7, '', 52, false, '', NULL, NULL, ''),
('C0048', 1, '', 1, false, '', NULL, NULL, ''),
('C0062', 1, '', 5, false, '', NULL, NULL, ''),
('C0062', 2, '', 5, false, '', NULL, NULL, ''),
('C0062', 3, '', 5, false, '', NULL, NULL, ''),
('C0062', 4, '', 5, false, '', NULL, NULL, ''),
('C0063', 1, '', 13, false, '', NULL, NULL, ''),
('C0063', 2, '', 13, false, '', NULL, NULL, ''),
('C0063', 3, '', 13, false, '', NULL, NULL, ''),
('C0063', 4, '', 13, false, '', NULL, NULL, ''),
('C0070', 1, '', 11, false, '', NULL, NULL, ''),
('C0070', 2, '', 10, false, '', NULL, NULL, ''),
('C0070', 3, '', 10, false, '', NULL, NULL, ''),
('C0070', 4, '', 10, false, '', NULL, NULL, ''),
('C0074', 1, '', 94, false, '', NULL, NULL, ''),
('C0074', 2, '', 94, false, '', NULL, NULL, ''),
('C0074', 3, '', 94, false, '', NULL, NULL, ''),
('C0074', 4, '', 94, false, '', NULL, NULL, ''),
('C0075', 1, '', 10, false, '', NULL, NULL, ''),
('C0076', 1, '', 40, false, '', NULL, NULL, ''),
('C0076', 2, '', 40, false, '', NULL, NULL, ''),
('C0082', 3, '', 14, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0082', 4, '', 14, false, '', NULL, NULL, ''),
('C0083', 1, '', 33, false, '', NULL, NULL, ''),
('C0083', 2, '', 33, false, '', NULL, NULL, ''),
('C0094', 1, '', 10, false, '', NULL, NULL, ''),
('C0094', 2, '', 10, false, '', NULL, NULL, ''),
('C0096', 1, '', 1, false, '', NULL, NULL, ''),
('C0096', 2, '', 1, false, '', NULL, NULL, ''),
('C0096', 3, '', 1, false, '', NULL, NULL, ''),
('C0096', 4, '', 51, false, '', NULL, NULL, ''),
('C0096', 5, '', 51, false, '', NULL, NULL, ''),
('C0098', 4, '', 13, false, '', NULL, NULL, ''),
('C0098', 5, '', 13, false, '', NULL, NULL, ''),
('C0100', 2, '', 35, false, '', NULL, NULL, ''),
('C0100', 4, '', 35, false, '', NULL, NULL, ''),
('C0103', 1, '', 3, false, '', NULL, NULL, ''),
('C0103', 2, '', 3, false, '', NULL, NULL, ''),
('C0104', 3, '', 30, false, '', NULL, NULL, ''),
('C0104', 4, '', 30, false, '', NULL, NULL, ''),
('C0104', 5, '', 30, false, '', NULL, NULL, ''),
('C0104', 6, '', 30, false, '', NULL, NULL, ''),
('C0105', 1, '', 10, false, '', NULL, NULL, ''),
('C0105', 2, '', 10, false, '', NULL, NULL, ''),
('C0106', 1, '', 50, false, '', NULL, NULL, ''),
('C0106', 2, '', 50, false, '', NULL, NULL, ''),
('C0107', 4, '', 33, false, '', NULL, NULL, ''),
('C0107', 5, '', 33, false, '', NULL, NULL, ''),
('C0107', 6, '', 33, false, '', NULL, NULL, ''),
('C0107', 7, '', 33, false, '', NULL, NULL, ''),
('C0108', 1, '', 61, false, '', NULL, NULL, ''),
('C0108', 2, '', 61, false, '', NULL, NULL, ''),
('C0108', 3, '', 1, false, '', NULL, NULL, ''),
('C0109', 1, '', 5, false, '', NULL, NULL, ''),
('C0109', 2, '', 5, false, '', NULL, NULL, ''),
('C0109', 3, '', 5, false, '', NULL, NULL, ''),
('C0109', 4, '', 5, false, '', NULL, NULL, ''),
('C0110', 1, '', 5, false, '', NULL, NULL, ''),
('C0110', 2, '', 5, false, '', NULL, NULL, ''),
('C0110', 3, '', 5, false, '', NULL, NULL, ''),
('C0114', 1, '', 10, false, '', NULL, NULL, ''),
('C0114', 2, '', 10, false, '', NULL, NULL, ''),
('C0115', 3, '', 145, false, '', NULL, NULL, ''),
('C0115', 5, '', 145, false, '', NULL, NULL, ''),
('C0116', 4, '', 36, false, '', NULL, NULL, ''),
('C0116', 5, '', 36, false, '', NULL, NULL, ''),
('C0116', 6, '', 36, false, '', NULL, NULL, ''),
('C0116', 7, '', 36, false, '', NULL, NULL, ''),
('C0118', 1, '', 16, false, '', NULL, NULL, ''),
('C0118', 2, '', 16, false, '', NULL, NULL, ''),
('C0119', 1, '', 6, false, '', NULL, NULL, ''),
('C0120', 1, '', 5, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0120', 2, '', 5, false, '', NULL, NULL, ''),
('C0121', 1, '', 85, false, '', NULL, NULL, ''),
('C0121', 2, '', 85, false, '', NULL, NULL, ''),
('C0121', 3, '', 10, false, '', NULL, NULL, ''),
('C0123', 1, '', 2, false, '', NULL, NULL, ''),
('C0123', 2, '', 2, false, '', NULL, NULL, ''),
('C0123', 3, '', 10, false, '', NULL, NULL, ''),
('C0123', 4, '', 10, false, '', NULL, NULL, ''),
('C0124', 1, '', 5, false, '', NULL, NULL, ''),
('C0124', 2, '', 5, false, '', NULL, NULL, ''),
('C0124', 3, '', 1, false, '', NULL, NULL, ''),
('C0124', 6, '', 5, false, '', NULL, NULL, ''),
('C0124', 7, '', 5, false, '', NULL, NULL, ''),
('C0125', 1, '', 21, false, '', NULL, NULL, ''),
('C0125', 2, '', 21, false, '', NULL, NULL, ''),
('C0126', 5, '', 1, false, '', NULL, NULL, ''),
('C0126', 6, '', 1, false, '', NULL, NULL, ''),
('C0126', 7, '', 1, false, '', NULL, NULL, ''),
('C0126', 8, '', 1, false, '', NULL, NULL, ''),
('C0126', 9, '', 8, false, '', NULL, NULL, ''),
('C0126', 10, '', 8, false, '', NULL, NULL, ''),
('C0126', 11, '', 6, false, '', NULL, NULL, ''),
('C0126', 12, '', 6, false, '', NULL, NULL, ''),
('C0127', 1, '', 38, false, '', NULL, NULL, ''),
('C0127', 2, '', 38, false, '', NULL, NULL, ''),
('C0127', 3, '', 38, false, '', NULL, NULL, ''),
('C0127', 4, '', 38, false, '', NULL, NULL, ''),
('C0130', 1, '', 15, false, '', NULL, NULL, ''),
('C0130', 2, '', 15, false, '', NULL, NULL, ''),
('C0131', 1, '', 31, false, '', NULL, NULL, ''),
('C0131', 2, '', 31, false, '', NULL, NULL, ''),
('C0132', 3, '', 6, false, '', NULL, NULL, ''),
('C0132', 4, '', 6, false, '', NULL, NULL, ''),
('C0132', 5, '', 6, false, '', NULL, NULL, ''),
('C0132', 7, '', 6, false, '', NULL, NULL, ''),
('C0133', 1, '', 20, false, '', NULL, NULL, ''),
('C0133', 2, '', 20, false, '', NULL, NULL, ''),
('C0133', 3, '', 0, false, '', NULL, NULL, ''),
('C0133', 5, '', 0, false, '', NULL, NULL, ''),
('C0133', 6, '', 0, false, '', NULL, NULL, ''),
('C0133', 7, '', 20, false, '', NULL, NULL, ''),
('C0133', 8, '', 0, false, '', NULL, NULL, ''),
('C0133', 9, '', 0, false, '', NULL, NULL, ''),
('C0133', 10, '', 20, false, '', NULL, NULL, ''),
('C0133', 11, '', 0, false, '', NULL, NULL, ''),
('C0133', 12, '', 0, false, '', NULL, NULL, ''),
('C0134', 2, '', 8, false, '', NULL, NULL, ''),
('C0134', 4, '', 16, false, '', NULL, NULL, ''),
('C0134', 5, '', 16, false, '', NULL, NULL, ''),
('C0134', 6, '', 8, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0135', 1, '', 13, false, '', NULL, NULL, ''),
('C0135', 2, '', 13, false, '', NULL, NULL, ''),
('C0136', 1, '', 82, false, '', NULL, NULL, ''),
('C0136', 2, '', 1, false, '', NULL, NULL, ''),
('C0136', 3, '', 80, false, '', NULL, NULL, ''),
('C0136', 4, '', 80, false, '', NULL, NULL, ''),
('C0136', 5, '', 82, false, '', NULL, NULL, ''),
('C0136', 6, '', 82, false, '', NULL, NULL, ''),
('C0138', 1, '', 7, false, '', NULL, NULL, ''),
('C0138', 2, '', 7, false, '', NULL, NULL, ''),
('C0140', 1, '', 12, false, '', NULL, NULL, ''),
('C0140', 2, '', 12, false, '', NULL, NULL, ''),
('C0142', 1, '', 155, false, '', NULL, NULL, ''),
('C0142', 2, '', 155, false, '', NULL, NULL, ''),
('C0142', 3, '', 155, false, '', NULL, NULL, ''),
('C0142', 4, '', 155, false, '', NULL, NULL, ''),
('C0142', 5, '', 155, false, '', NULL, NULL, ''),
('C0142', 6, '', 155, false, '', NULL, NULL, ''),
('C0142', 7, '', 155, false, '', NULL, NULL, ''),
('C0142', 8, '', 155, false, '', NULL, NULL, ''),
('C0142', 9, '', 155, false, '', NULL, NULL, ''),
('C0142', 10, '', 155, false, '', NULL, NULL, ''),
('C0142', 11, '', 155, false, '', NULL, NULL, ''),
('C0144', 1, '', 6, false, '', NULL, NULL, ''),
('C0144', 2, '', 6, false, '', NULL, NULL, ''),
('C0146', 1, '', 16, false, '', NULL, NULL, ''),
('C0146', 2, '', 16, false, '', NULL, NULL, ''),
('C0147', 1, '', 20, false, '', NULL, NULL, ''),
('C0147', 2, '', 5, false, '', NULL, NULL, ''),
('C0148', 1, '', 38, false, '', NULL, NULL, ''),
('C0148', 2, '', 38, false, '', NULL, NULL, ''),
('C0149', 3, '', 133, false, '', NULL, NULL, ''),
('C0149', 4, '', 133, false, '', NULL, NULL, ''),
('C0150', 1, '', 28, false, '', NULL, NULL, ''),
('C0150', 2, '', 28, false, '', NULL, NULL, ''),
('C0150', 3, '', 28, false, '', NULL, NULL, ''),
('C0150', 4, '', 28, false, '', NULL, NULL, ''),
('C0151', 1, '', 50, false, '', NULL, NULL, ''),
('C0151', 2, '', 50, false, '', NULL, NULL, ''),
('C0151', 3, '', 50, false, '', NULL, NULL, ''),
('C0151', 4, '', 50, false, '', NULL, NULL, ''),
('C0152', 1, '', 5, false, '', NULL, NULL, ''),
('C0152', 2, '', 5, false, '', NULL, NULL, ''),
('C0153', 1, '', 24, false, '', NULL, NULL, ''),
('C0153', 2, '', 6, false, '', NULL, NULL, ''),
('C0153', 3, '', 2, false, '', NULL, NULL, ''),
('C0153', 4, '', 2, false, '', NULL, NULL, ''),
('C0154', 1, '', 10, false, '', NULL, NULL, ''),
('C0154', 2, '', 10, false, '', NULL, NULL, ''),
('C0154', 3, '', 5, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0154', 4, '', 16, false, '', NULL, NULL, ''),
('C0154', 5, '', 16, false, '', NULL, NULL, ''),
('C0154', 6, '', 10, false, '', NULL, NULL, ''),
('C0154', 7, '', 10, false, '', NULL, NULL, ''),
('C0155', 1, '', 5, false, '', NULL, NULL, ''),
('C0155', 4, '', 5, false, '', NULL, NULL, ''),
('C0156', 5, '', 10, false, '', NULL, NULL, ''),
('C0156', 6, '', 10, false, '', NULL, NULL, ''),
('C0156', 7, '', 10, false, '', NULL, NULL, ''),
('C0156', 8, '', 10, false, '', NULL, NULL, ''),
('C0159', 1, '', 6, false, '', NULL, NULL, ''),
('C0159', 2, '', 6, false, '', NULL, NULL, ''),
('c0160', 1, '', 6, false, '', NULL, NULL, ''),
('c0160', 2, '', 6, false, '', NULL, NULL, ''),
('C0161', 1, '', 10, false, '', NULL, NULL, ''),
('C0161', 2, '', 10, false, '', NULL, NULL, ''),
('C0162', 1, '', 30, false, '', NULL, NULL, ''),
('C0162', 2, '', 30, false, '', NULL, NULL, ''),
('C0163', 1, '', 20, false, '', NULL, NULL, ''),
('C0163', 2, '', 20, false, '', NULL, NULL, ''),
('C0163', 3, '', 20, false, '', NULL, NULL, ''),
('C0163', 4, '', 20, false, '', NULL, NULL, ''),
('C0164', 1, '', 25, false, '', NULL, NULL, ''),
('C0164', 2, '', 25, false, '', NULL, NULL, ''),
('C0165', 1, '', 15, false, '', NULL, NULL, ''),
('C0165', 2, '', 15, false, '', NULL, NULL, ''),
('C0165', 3, '', 7, false, '', NULL, NULL, ''),
('C0165', 4, '', 7, false, '', NULL, NULL, ''),
('C0166', 1, '', 25, false, '', NULL, NULL, ''),
('C0166', 2, '', 25, false, '', NULL, NULL, ''),
('C0170', 1, '', 52, false, '', NULL, NULL, ''),
('C0170', 2, '', 52, false, '', NULL, NULL, ''),
('C0170', 3, '', 0, false, '', NULL, NULL, ''),
('C0170', 4, '', 0, false, '', NULL, NULL, ''),
('C0170', 5, '', 52, false, '', NULL, NULL, ''),
('C0170', 6, '', 52, false, '', NULL, NULL, ''),
('C0170', 7, '', 0, false, '', NULL, NULL, ''),
('C0170', 8, '', 0, false, '', NULL, NULL, ''),
('C0171', 1, '', 25, false, '', NULL, NULL, ''),
('C0171', 2, '', 25, false, '', NULL, NULL, ''),
('C0171', 3, '', 0, false, '', NULL, NULL, ''),
('C0171', 4, '', 0, false, '', NULL, NULL, ''),
('C0171', 5, '', 0, false, '', NULL, NULL, ''),
('C0171', 7, '', 0, false, '', NULL, NULL, ''),
('C0172', 1, '', 31, false, '', NULL, NULL, ''),
('C0172', 2, '', 31, false, '', NULL, NULL, ''),
('C0172', 3, '', 31, false, '', NULL, NULL, ''),
('C0172', 4, '', 31, false, '', NULL, NULL, ''),
('C0174', 1, '', 25, false, '', NULL, NULL, ''),
('C0174', 2, '', 25, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0174', 3, '', 25, false, '', NULL, NULL, ''),
('C0174', 4, '', 25, false, '', NULL, NULL, ''),
('C0175', 3, '', 6, false, '', NULL, NULL, ''),
('C0175', 4, '', 6, false, '', NULL, NULL, ''),
('C0176', 1, '', 2, false, '', NULL, NULL, ''),
('C0178', 1, '', 7, false, '', NULL, NULL, ''),
('C0178', 2, '', 7, false, '', NULL, NULL, ''),
('C0179', 1, '', 52, false, '', NULL, NULL, ''),
('C0179', 2, '', 52, false, '', NULL, NULL, ''),
('C0182', 1, '', 5, false, '', NULL, NULL, ''),
('C0182', 2, '', 10, false, '', NULL, NULL, ''),
('C0185', 1, '', 32, false, '', NULL, NULL, ''),
('C0185', 2, '', 32, false, '', NULL, NULL, ''),
('C0186', 1, '', 23, false, '', NULL, NULL, ''),
('C0186', 2, '', 23, false, '', NULL, NULL, ''),
('C0187', 1, '', 21, false, '', NULL, NULL, ''),
('C0187', 2, '', 21, false, '', NULL, NULL, ''),
('C0187', 3, '', 1, false, '', NULL, NULL, ''),
('C0187', 4, '', 21, false, '', NULL, NULL, ''),
('C0187', 5, '', 21, false, '', NULL, NULL, ''),
('C0188', 1, '', 24, false, '', NULL, NULL, ''),
('C0188', 2, '', 24, false, '', NULL, NULL, ''),
('C0188', 3, '', 24, false, '', NULL, NULL, ''),
('C0191', 1, '', 1, false, '', NULL, NULL, ''),
('C0191', 2, '', 1, false, '', NULL, NULL, ''),
('C0192', 1, '', 5, false, '', NULL, NULL, ''),
('C0192', 2, '', 1, false, '', NULL, NULL, ''),
('C0192', 3, '', 5, false, '', NULL, NULL, ''),
('C0192', 4, '', 1, false, '', NULL, NULL, ''),
('C0193', 1, '', 15, false, '', NULL, NULL, ''),
('C0193', 2, '', 15, false, '', NULL, NULL, ''),
('C0195', 1, '', 10, false, '', NULL, NULL, ''),
('C0195', 2, '', 10, false, '', NULL, NULL, ''),
('C0196', 1, '', 44, false, '', NULL, NULL, ''),
('C0196', 2, '', 5, false, '', NULL, NULL, ''),
('C0197', 1, '', 13, false, '', NULL, NULL, ''),
('C0197', 2, '', 13, false, '', NULL, NULL, ''),
('C0198', 3, '', 18, false, '', NULL, NULL, ''),
('C0198', 4, '', 18, false, '', NULL, NULL, ''),
('C0199', 1, '', 5, false, '', NULL, NULL, ''),
('C0199', 2, '', 5, false, '', NULL, NULL, ''),
('C0200', 1, '', 99, false, '', NULL, NULL, ''),
('C0200', 2, '', 99, false, '', NULL, NULL, ''),
('C0200', 3, '', 99, false, '', NULL, NULL, ''),
('C0200', 4, '', 99, false, '', NULL, NULL, ''),
('C0201', 1, '', 13, false, '', NULL, NULL, ''),
('C0201', 2, '', 13, false, '', NULL, NULL, ''),
('C0202', 1, '', 70, false, '', NULL, NULL, ''),
('C0202', 2, '', 70, false, '', NULL, NULL, ''),
('C0202', 3, '', 70, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0204', 1, '', 13, false, '', NULL, NULL, ''),
('C0204', 2, '', 13, false, '', NULL, NULL, ''),
('C0205', 1, '', 40, false, '', NULL, NULL, ''),
('C0205', 2, '', 40, false, '', NULL, NULL, ''),
('C0205', 3, '', 40, false, '', NULL, NULL, ''),
('C0206', 1, '', 20, false, '', NULL, NULL, ''),
('C0206', 2, '', 20, false, '', NULL, NULL, ''),
('C0208', 1, '', 20, false, '', NULL, NULL, ''),
('C0208', 2, '', 20, false, '', NULL, NULL, ''),
('C0211', 1, '', 10, false, '', NULL, NULL, ''),
('C0211', 2, '', 10, false, '', NULL, NULL, ''),
('C0212', 1, '', 26, false, '', NULL, NULL, ''),
('C0212', 2, '', 26, false, '', NULL, NULL, ''),
('C0213', 2, '', 115, false, '', NULL, NULL, ''),
('C0213', 3, '', 115, false, '', NULL, NULL, ''),
('C0214', 1, '', 10, false, '', NULL, NULL, ''),
('C0214', 2, '', 10, false, '', NULL, NULL, ''),
('c0215', 1, '', 10, false, '', NULL, NULL, ''),
('c0215', 2, '', 10, false, '', NULL, NULL, ''),
('C0216', 1, '', 5, false, '', NULL, NULL, ''),
('C0216', 2, '', 5, false, '', NULL, NULL, ''),
('C0217', 1, '', 14, false, '', NULL, NULL, ''),
('C0217', 2, '', 14, false, '', NULL, NULL, ''),
('C0218', 1, '', 8, false, '', NULL, NULL, ''),
('C0218', 2, '', 8, false, '', NULL, NULL, ''),
('C0219', 1, '', 70, false, '', NULL, NULL, ''),
('C0219', 2, '', 70, false, '', NULL, NULL, ''),
('C0221', 1, '', 55, false, '', NULL, NULL, ''),
('C0221', 2, '', 55, false, '', NULL, NULL, ''),
('C0221', 3, '', 1, false, '', NULL, NULL, ''),
('C0221', 4, '', 1, false, '', NULL, NULL, ''),
('C0225', 1, '', 5, false, '', NULL, NULL, ''),
('C0226', 1, '', 23, false, '', NULL, NULL, ''),
('C0226', 2, '', 23, false, '', NULL, NULL, ''),
('C0227', 1, '', 30, false, '', NULL, NULL, ''),
('C0227', 2, '', 30, false, '', NULL, NULL, ''),
('C0228', 1, '', 20, false, '', NULL, NULL, ''),
('C0228', 2, '', 2, false, '', NULL, NULL, ''),
('C0229', 1, '', 34, false, '', NULL, NULL, ''),
('C0229', 2, '', 34, false, '', NULL, NULL, ''),
('C0230', 1, '', 13, false, '', NULL, NULL, ''),
('C0230', 2, '', 13, false, '', NULL, NULL, ''),
('C0231', 1, '', 10, false, '', NULL, NULL, ''),
('C0231', 2, '', 10, false, '', NULL, NULL, ''),
('C0232', 1, '', 5, false, '', NULL, NULL, ''),
('C0232', 2, '', 5, false, '', NULL, NULL, ''),
('C0233', 1, '', 7, false, '', NULL, NULL, ''),
('C0233', 2, '', 7, false, '', NULL, NULL, ''),
('C0236', 1, '', 40, false, '', NULL, NULL, ''),
('C0236', 2, '', 40, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C0237', 1, '', 5, false, '', NULL, NULL, ''),
('C0237', 2, '', 5, false, '', NULL, NULL, ''),
('C0238', 1, '', 9, false, '', NULL, NULL, ''),
('C0238', 2, '', 9, false, '', NULL, NULL, ''),
('C0240', 1, '', 13, false, '', NULL, NULL, ''),
('C0240', 2, '', 13, false, '', NULL, NULL, ''),
('C0241', 1, '', 36, false, '', NULL, NULL, ''),
('C0241', 2, '', 36, false, '', NULL, NULL, ''),
('C0242', 1, '', 42, false, '', NULL, NULL, ''),
('C0242', 2, '', 42, false, '', NULL, NULL, ''),
('C0242', 4, '', 42, false, '', NULL, NULL, ''),
('C0242', 5, '', 42, false, '', NULL, NULL, ''),
('C0245', 1, '', 10, false, '', NULL, NULL, ''),
('C0245', 2, '', 10, false, '', NULL, NULL, ''),
('C0246', 1, '', 6, false, '', NULL, NULL, ''),
('C0246', 2, '', 6, false, '', NULL, NULL, ''),
('C0246', 3, '', 0, false, '', NULL, NULL, ''),
('C0246', 4, '', 0, false, '', NULL, NULL, ''),
('C0247', 1, '', 15, false, '', NULL, NULL, ''),
('C0247', 2, '', 15, false, '', NULL, NULL, ''),
('C0248', 1, '', 10, false, '', NULL, NULL, ''),
('C0248', 2, '', 10, false, '', NULL, NULL, ''),
('C0249', 1, '', 5, false, '', NULL, NULL, ''),
('C0249', 2, '', 5, false, '', NULL, NULL, ''),
('C0250', 1, '', 5, false, '', NULL, NULL, ''),
('C0250', 2, '', 5, false, '', NULL, NULL, ''),
('C0253', 1, '', 24, false, '', NULL, NULL, ''),
('C0253', 2, '', 24, false, '', NULL, NULL, ''),
('C0256', 1, '', 1, false, '', NULL, NULL, ''),
('C0256', 2, '', 1, false, '', NULL, NULL, ''),
('c0257', 1, '', 18, false, '', NULL, NULL, ''),
('c0257', 2, '', 18, false, '', NULL, NULL, ''),
('C0258', 1, '', 11, false, '', NULL, NULL, ''),
('C0258', 2, '', 11, false, '', NULL, NULL, ''),
('C0259', 1, '', 10, false, '', NULL, NULL, ''),
('C0259', 2, '', 10, false, '', NULL, NULL, ''),
('C0260', 1, '', 5, false, '', NULL, NULL, ''),
('C0260', 2, '', 5, false, '', NULL, NULL, ''),
('C0261', 1, '', 25, false, '', NULL, NULL, ''),
('C0261', 2, '', 25, false, '', NULL, NULL, ''),
('C0262', 1, '', 8, false, '', NULL, NULL, ''),
('C0262', 2, '', 8, false, '', NULL, NULL, ''),
('C0263', 1, '', 10, false, '', NULL, NULL, ''),
('C0263', 2, '', 10, false, '', NULL, NULL, ''),
('C0264', 1, '', 17, false, '', NULL, NULL, ''),
('C0264', 2, '', 17, false, '', NULL, NULL, ''),
('C0266', 1, '', 10, false, '', NULL, NULL, ''),
('C9999', 90, '', 99, false, '', NULL, NULL, ''),
('C9999', 91, '', 99, false, '', NULL, NULL, ''),
('C9999', 92, '', 99, false, '', NULL, NULL, '');

INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
('C9999', 93, '', 99, false, '', NULL, NULL, ''),
('C9999', 94, '', 99, false, '', NULL, NULL, ''),
('C9999', 95, '', 10, false, '', NULL, NULL, ''),
('C9999', 96, '', 99, false, '', NULL, NULL, ''),
('C9999', 97, '', 99, false, '', NULL, NULL, ''),
('C9999', 98, '', 99, false, '', NULL, NULL, ''),
('C9999', 99, '', 99, false, '', NULL, NULL, ''),
('C9999', 100, '', 99, false, '', NULL, NULL, ''),
('C9999', 101, '', 99, false, '', NULL, NULL, ''),
('C9999', 102, '', 99, false, '', NULL, NULL, ''),
('C9999', 103, '', 1, false, '', NULL, NULL, ''),
('C9999', 104, '', 1, false, '', NULL, NULL, ''),
('C9999', 105, '', 1, false, '', NULL, NULL, ''),
('C9999', 106, '', 1, false, '', NULL, NULL, ''),
('C99DEV', 1, '', 1, false, '', NULL, NULL, ''),
('DEMO', 1, '', 3, false, '', NULL, NULL, '');

-- Verificar os resultados
SELECT COUNT(*) as total_registros FROM licenses;
SELECT SUM(qt_licencas) as total_licencas FROM licenses;
SELECT 
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM licenses;

-- Registrar atividade
INSERT INTO activities (user_id, user_name, action, resource_type, resource_id, description, timestamp) VALUES
('system', 'System', 'IMPORT', 'license', NULL, 'Imported 416 licenses with 11860 total licenses', NOW());

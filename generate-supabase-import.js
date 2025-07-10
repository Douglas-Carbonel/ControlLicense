import fs from 'fs';
import { parse } from 'csv-parse';

async function generateSupabaseImport() {
  try {
    console.log('Lendo arquivo CSV...');
    const content = fs.readFileSync('attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752180503081.csv', 'utf8');
    
    const records = await new Promise((resolve, reject) => {
      parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      }, (err, records) => {
        if (err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });

    console.log(`Gerando script SQL para ${records.length} registros...`);

    let sqlScript = `-- Script completo para importar todas as licenças no Supabase
-- Execute este script no SQL Editor do Supabase

-- Limpar dados existentes
DELETE FROM licenses;
DELETE FROM activities;

-- Resetar sequences
ALTER SEQUENCE licenses_id_seq RESTART WITH 1;
ALTER SEQUENCE activities_id_seq RESTART WITH 1;

-- Inserir todos os registros
`;

    let totalLicenses = 0;
    let insertStatements = [];

    for (const record of records) {
      const qtLicencas = parseInt(record["Qt. Licenças"] || record["Qt. Licen�as"] || "1");
      
      if (isNaN(qtLicencas)) {
        console.warn(`Quantidade inválida para linha ${record.Linha}: ${record["Qt. Licenças"]}`);
        continue;
      }

      totalLicenses += qtLicencas;

      const code = (record.Code || '').replace(/'/g, "''");
      const nomeCliente = (record["Nome do Cliente"] || '').replace(/'/g, "''");
      const tipoLicenca = (record["Tipo de Licença"] || '').replace(/'/g, "''");
      const observacoes = (record.Observações || '').replace(/'/g, "''");
      const ativo = record.Ativo === 'true' || record.Ativo === true || record.Ativo === 'True';

      const insertStatement = `('${code}', ${record.Linha || 1}, '${nomeCliente}', ${qtLicencas}, ${ativo}, '${tipoLicenca}', NULL, NULL, '${observacoes}')`;
      insertStatements.push(insertStatement);
    }

    // Dividir em lotes para evitar consultas muito longas
    const batchSize = 50;
    for (let i = 0; i < insertStatements.length; i += batchSize) {
      const batch = insertStatements.slice(i, i + batchSize);
      sqlScript += `
INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) VALUES
${batch.join(',\n')};
`;
    }

    sqlScript += `
-- Verificar os resultados
SELECT COUNT(*) as total_registros FROM licenses;
SELECT SUM(qt_licencas) as total_licencas FROM licenses;
SELECT 
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM licenses;

-- Registrar atividade
INSERT INTO activities (user_id, user_name, action, resource_type, resource_id, description, timestamp) VALUES
('system', 'System', 'IMPORT', 'license', NULL, 'Imported ${records.length} licenses with ${totalLicenses} total licenses', NOW());
`;

    // Salvar o script
    fs.writeFileSync('supabase-complete-import.sql', sqlScript);
    
    console.log(`\n=== SCRIPT GERADO ===`);
    console.log(`Total de registros: ${records.length}`);
    console.log(`Total de licenças: ${totalLicenses}`);
    console.log(`Arquivo salvo como: supabase-complete-import.sql`);
    console.log(`\nPara usar:`);
    console.log(`1. Vá ao SQL Editor do Supabase`);
    console.log(`2. Cole o conteúdo do arquivo supabase-complete-import.sql`);
    console.log(`3. Execute o script`);
    
  } catch (error) {
    console.error('Erro ao gerar script:', error);
  }
}

generateSupabaseImport();
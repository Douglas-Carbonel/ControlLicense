import fs from 'fs';
import { parse } from 'csv-parse';

async function generateCompleteSupabaseImport() {
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

    console.log(`Gerando script SQL completo para ${records.length} registros...`);

    let sqlScript = `-- Script COMPLETO para importar todas as licenças no Supabase
-- Execute este script no SQL Editor do Supabase

-- Limpar dados existentes
DELETE FROM licenses;
DELETE FROM activities;

-- Resetar sequences
ALTER SEQUENCE licenses_id_seq RESTART WITH 1;
ALTER SEQUENCE activities_id_seq RESTART WITH 1;

-- Inserir todos os registros com TODOS os campos
`;

    let totalLicenses = 0;
    let insertStatements = [];

    for (const record of records) {
      const qtLicencas = parseInt(record["Qt. Licen�as"] || record["Qt. Licenças"] || "1");
      
      if (isNaN(qtLicencas)) {
        console.warn(`Quantidade inválida para linha ${record.Linha}: ${record["Qt. Licen�as"]}`);
        continue;
      }

      totalLicenses += qtLicencas;

      // Escapar aspas simples
      const escapeString = (str) => (str || '').replace(/'/g, "''");

      const licenseData = {
        code: escapeString(record.Code),
        linha: parseInt(record.Linha) || 1,
        ativo: record.Ativo === 'Y' || record.Ativo === 'y' || record.Ativo === true,
        codCliente: escapeString(record["Cod. Cliente"]),
        nomeCliente: escapeString(record["Nome Cliente"]),
        dadosEmpresa: escapeString(record["Dados da empresa"]),
        hardwareKey: escapeString(record["Hardware key"]),
        installNumber: escapeString(record["Install number"]),
        systemNumber: escapeString(record["System number"]),
        nomeDb: escapeString(record["Nome DB"]),
        descDb: escapeString(record["Desc. DB"]),
        endApi: escapeString(record["End. API"]),
        listaCnpj: escapeString(record["Lista de CNPJ"]),
        qtLicencas: qtLicencas,
        versaoSap: escapeString(record["Vers�o SAP"] || record["Versão SAP"])
      };

      const insertStatement = `('${licenseData.code}', ${licenseData.linha}, ${licenseData.ativo}, '${licenseData.codCliente}', '${licenseData.nomeCliente}', '${licenseData.dadosEmpresa}', '${licenseData.hardwareKey}', '${licenseData.installNumber}', '${licenseData.systemNumber}', '${licenseData.nomeDb}', '${licenseData.descDb}', '${licenseData.endApi}', '${licenseData.listaCnpj}', ${licenseData.qtLicencas}, '${licenseData.versaoSap}')`;
      insertStatements.push(insertStatement);
    }

    // Dividir em lotes para evitar consultas muito longas
    const batchSize = 30;
    for (let i = 0; i < insertStatements.length; i += batchSize) {
      const batch = insertStatements.slice(i, i + batchSize);
      sqlScript += `
INSERT INTO licenses (code, linha, ativo, cod_cliente, nome_cliente, dados_empresa, hardware_key, install_number, system_number, nome_db, desc_db, end_api, lista_cnpj, qt_licencas, versao_sap) VALUES
${batch.join(',\n')};
`;
    }

    sqlScript += `
-- Verificar os resultados finais
SELECT COUNT(*) as total_registros FROM licenses;
SELECT SUM(qt_licencas) as total_licencas FROM licenses;
SELECT 
  COUNT(CASE WHEN ativo = true THEN 1 END) as ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as inativos
FROM licenses;

-- Mostrar alguns exemplos com todos os campos
SELECT code, linha, cod_cliente, nome_cliente, hardware_key, install_number, system_number, qt_licencas 
FROM licenses 
ORDER BY code, linha 
LIMIT 10;

-- Registrar atividade
INSERT INTO activities (user_id, user_name, action, resource_type, resource_id, description) VALUES
('system', 'System', 'IMPORT', 'license', NULL, 'Imported ${records.length} licenses with ${totalLicenses} total licenses and all fields');

-- Estatísticas finais
SELECT 
  'IMPORTAÇÃO CONCLUÍDA' as status,
  COUNT(*) as total_registros,
  SUM(qt_licencas) as total_licencas,
  COUNT(DISTINCT cod_cliente) as clientes_unicos,
  COUNT(CASE WHEN ativo = true THEN 1 END) as registros_ativos,
  COUNT(CASE WHEN ativo = false THEN 1 END) as registros_inativos
FROM licenses;
`;

    // Salvar o script
    fs.writeFileSync('supabase-import-completo.sql', sqlScript);
    
    console.log(`\n=== SCRIPT COMPLETO GERADO ===`);
    console.log(`Total de registros: ${records.length}`);
    console.log(`Total de licenças: ${totalLicenses}`);
    console.log(`Arquivo salvo como: supabase-import-completo.sql`);
    console.log(`\n=== CAMPOS INCLUÍDOS ===`);
    console.log(`✓ Code, Linha, Ativo`);
    console.log(`✓ Cod. Cliente, Nome Cliente`);
    console.log(`✓ Dados da empresa`);
    console.log(`✓ Hardware key, Install number, System number`);
    console.log(`✓ Nome DB, Desc. DB, End. API`);
    console.log(`✓ Lista de CNPJ, Qt. Licenças, Versão SAP`);
    console.log(`\nPara usar:`);
    console.log(`1. Vá ao SQL Editor do Supabase`);
    console.log(`2. Cole o conteúdo do arquivo supabase-import-completo.sql`);
    console.log(`3. Execute o script`);
    console.log(`4. Verifique se todos os campos foram importados corretamente`);
    
  } catch (error) {
    console.error('Erro ao gerar script:', error);
  }
}

generateCompleteSupabaseImport();
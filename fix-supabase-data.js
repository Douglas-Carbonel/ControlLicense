import fs from 'fs';
import { parse } from 'csv-parse';
import { neon } from '@neondatabase/serverless';

const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
console.log('Conectando ao Supabase...');

const client = neon(supabaseUrl);

async function fixSupabaseData() {
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

    console.log(`Processando ${records.length} registros do CSV...`);

    // Limpar dados existentes
    console.log('Limpando dados existentes...');
    await client('DELETE FROM licenses');
    await client('DELETE FROM activities');
    
    // Importar dados corretos
    console.log('Importando dados corretos...');
    let importedCount = 0;
    
    for (const record of records) {
      const qtLicencas = parseInt(record["Qt. Licenças"] || record["Qt. Licen�as"] || "1");
      
      if (isNaN(qtLicencas)) {
        console.warn(`Quantidade inválida para linha ${record.Linha}: ${record["Qt. Licenças"]}`);
        continue;
      }

      const licenseData = {
        code: record.Code?.trim() || '',
        linha: parseInt(record.Linha) || 1,
        nome_cliente: record["Nome do Cliente"]?.trim() || '',
        qt_licencas: qtLicencas,
        ativo: record.Ativo === 'true' || record.Ativo === true || record.Ativo === 'True',
        tipo_licenca: record["Tipo de Licença"]?.trim() || '',
        data_inicio: record["Data de Início"] ? new Date(record["Data de Início"]).toISOString() : null,
        data_fim: record["Data de Fim"] ? new Date(record["Data de Fim"]).toISOString() : null,
        observacoes: record.Observações?.trim() || ''
      };

      try {
        await client(
          `INSERT INTO licenses (code, linha, nome_cliente, qt_licencas, ativo, tipo_licenca, data_inicio, data_fim, observacoes) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            licenseData.code,
            licenseData.linha,
            licenseData.nome_cliente,
            licenseData.qt_licencas,
            licenseData.ativo,
            licenseData.tipo_licenca,
            licenseData.data_inicio,
            licenseData.data_fim,
            licenseData.observacoes
          ]
        );
        
        importedCount++;
        if (importedCount % 50 === 0) {
          console.log(`Importados ${importedCount} registros...`);
        }
      } catch (error) {
        console.error(`Erro ao importar linha ${record.Linha}:`, error);
      }
    }

    // Verificar resultados
    const totalResult = await client('SELECT COUNT(*) as total FROM licenses');
    const totalLicenses = await client('SELECT SUM(qt_licencas) as total FROM licenses');
    
    console.log(`\n=== RESULTADOS ===`);
    console.log(`Total de registros: ${totalResult[0].total}`);
    console.log(`Total de licenças: ${totalLicenses[0].total}`);
    console.log(`Importação concluída com sucesso!`);
    
  } catch (error) {
    console.error('Erro na importação:', error);
  }
}

fixSupabaseData();
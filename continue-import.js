import { neon } from "@neondatabase/serverless";
import fs from "fs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log('Tentando conectar ao banco de dados...');
console.log('Connection string:', connectionString ? 'Configurada' : 'Não configurada');

const client = neon(connectionString);

async function continueImport() {
  try {
    console.log("Iniciando importação dos dados restantes...");
    
    // Testar conexão primeiro
    console.log("Testando conexão com o banco...");
    const testResult = await client`SELECT 1 as test`;
    console.log("✅ Conexão com banco estabelecida:", testResult);

    // Ler o arquivo remaining-batches.sql
    const sqlContent = fs.readFileSync('remaining-batches.sql', 'utf8');

    // Extrair os dados das linhas SQL
    const lines = sqlContent.split('\n');
    let processedCount = 0;
    let errors = 0;

    for (const line of lines) {
      if (line.trim() && (line.includes('INSERT INTO') || line.includes('('))) {
        try {
          // Extrair dados da linha SQL usando regex mais robusta
          const match = line.match(/\('([^']+)',\s*(\d+),\s*(true|false),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*'([^']*)'/);

          if (match) {
            const [, code, linha, ativo, codCliente, nomeCliente, dadosEmpresa, hardwareKey, installNumber, systemNumber, nomeDb, descDb, endApi, listaCnpj, qtLicencas, versaoSap] = match;

            // Verificar se já existe
            const existingCheck = await client`
              SELECT id FROM licenses WHERE code = ${code} AND linha = ${parseInt(linha)}
            `;

            if (existingCheck.length === 0) {
              const insertSQL = `
                INSERT INTO licenses (code, linha, ativo, cod_cliente, nome_cliente, dados_empresa, hardware_key, install_number, system_number, nome_db, desc_db, end_api, lista_cnpj, qt_licencas, versao_sap)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              `;

              await client(insertSQL, [
                code,
                parseInt(linha),
                ativo === 'true',
                codCliente,
                nomeCliente,
                dadosEmpresa,
                hardwareKey,
                installNumber,
                systemNumber,
                nomeDb,
                descDb,
                endApi,
                listaCnpj,
                parseInt(qtLicencas),
                versaoSap
              ]);

              processedCount++;
            } else {
              console.log(`Registro já existe: ${code} linha ${linha}`);
            }

            if (processedCount % 10 === 0) {
              console.log(`Processados ${processedCount} registros...`);
            }
          }
        } catch (error) {
          errors++;
          console.error(`Erro ao processar linha ${processedCount + errors}: ${error.message}`);
          if (line.length > 100) {
            console.error(`Linha: ${line.substring(0, 100)}...`);
          } else {
            console.error(`Linha: ${line}`);
          }
        }
      }
    }

    console.log(`\nImportação concluída!`);
    console.log(`Registros processados com sucesso: ${processedCount}`);
    console.log(`Erros encontrados: ${errors}`);

    // Verificar total de registros na base
    const countResult = await client`SELECT COUNT(*) as count FROM licenses`;
    console.log(`Total de registros na base de dados: ${countResult[0].count}`);

  } catch (error) {
    console.error("Erro durante a importação:", error);
  }
}

continueImport();
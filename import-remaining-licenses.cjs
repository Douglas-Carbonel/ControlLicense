const fs = require('fs');
const { parse } = require('csv-parse');

// Read the CSV file and generate bulk insert statements
function generateBulkInserts() {
  const fileContent = fs.readFileSync('attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752173880898.csv', 'utf-8');
  
  return new Promise((resolve, reject) => {
    parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ';'
    }, (err, records) => {
      if (err) {
        console.error('Failed to parse CSV:', err);
        return reject(err);
      }
      
      // Skip the first 112 records since they're already imported
      const remainingRecords = records.slice(112);
      
      // Group into batches of 100
      const batches = [];
      for (let i = 0; i < remainingRecords.length; i += 100) {
        batches.push(remainingRecords.slice(i, i + 100));
      }
      
      console.log(`Processing ${remainingRecords.length} remaining records in ${batches.length} batches`);
      
      // Generate SQL for each batch
      batches.forEach((batch, batchIndex) => {
        const values = batch.map(record => {
          const licenseData = {
            code: (record.Code || "").replace(/'/g, "''"),
            linha: parseInt(record.Linha || "1"),
            ativo: (record.Ativo || "Y") === "Y",
            codCliente: (record["Cod. Cliente"] || "").replace(/'/g, "''"),
            nomeCliente: (record["Nome Cliente"] || "").replace(/'/g, "''"),
            dadosEmpresa: (record["Dados da empresa"] || "").replace(/'/g, "''"),
            hardwareKey: (record["Hardware key"] || "").replace(/'/g, "''"),
            installNumber: (record["Install number"] || "").replace(/'/g, "''"),
            systemNumber: (record["System number"] || "").replace(/'/g, "''"),
            nomeDb: (record["Nome DB"] || "").replace(/'/g, "''"),
            descDb: (record["Desc. DB"] || "").replace(/'/g, "''"),
            endApi: (record["End. API"] || "").replace(/'/g, "''"),
            listaCnpj: (record["Lista de CNPJ"] || "").replace(/'/g, "''"),
            qtLicencas: parseInt(record["Qt. Licenas"] || "1"),
            versaoSap: (record["Verso SAP"] || "").replace(/'/g, "''")
          };
          
          return `('${licenseData.code}', ${licenseData.linha}, ${licenseData.ativo}, '${licenseData.codCliente}', '${licenseData.nomeCliente}', '${licenseData.dadosEmpresa}', '${licenseData.hardwareKey}', '${licenseData.installNumber}', '${licenseData.systemNumber}', '${licenseData.nomeDb}', '${licenseData.descDb}', '${licenseData.endApi}', '${licenseData.listaCnpj}', ${licenseData.qtLicencas}, '${licenseData.versaoSap}')`;
        });
        
        const sql = `-- Batch ${batchIndex + 1} of ${batches.length} (${batch.length} records)
INSERT INTO licenses (
  code, linha, ativo, cod_cliente, nome_cliente, dados_empresa,
  hardware_key, install_number, system_number, nome_db, desc_db,
  end_api, lista_cnpj, qt_licencas, versao_sap
) VALUES 
${values.join(',\n')};

`;
        
        console.log(sql);
      });
      
      resolve(batches.length);
    });
  });
}

generateBulkInserts().catch(console.error);
const fs = require('fs');
const { parse } = require('csv-parse');

function parseCSVToSQL() {
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
      
      console.log(`-- SQL Insert script for ${records.length} license records`);
      console.log('-- Generated from CSV import');
      console.log('');
      
      let sqlStatements = [];
      
      for (const record of records) {
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
        
        const sql = `INSERT INTO licenses (
          code, linha, ativo, cod_cliente, nome_cliente, dados_empresa,
          hardware_key, install_number, system_number, nome_db, desc_db,
          end_api, lista_cnpj, qt_licencas, versao_sap
        ) VALUES (
          '${licenseData.code}', ${licenseData.linha}, ${licenseData.ativo},
          '${licenseData.codCliente}', '${licenseData.nomeCliente}', '${licenseData.dadosEmpresa}',
          '${licenseData.hardwareKey}', '${licenseData.installNumber}', '${licenseData.systemNumber}',
          '${licenseData.nomeDb}', '${licenseData.descDb}', '${licenseData.endApi}',
          '${licenseData.listaCnpj}', ${licenseData.qtLicencas}, '${licenseData.versaoSap}'
        );`;
        
        sqlStatements.push(sql);
      }
      
      // Write all statements
      console.log('-- Bulk insert start');
      sqlStatements.forEach(stmt => console.log(stmt));
      console.log('-- Bulk insert end');
      
      // Write to file as well
      fs.writeFileSync('import-licenses.sql', sqlStatements.join('\n') + '\n');
      console.log('\n-- SQL file written to import-licenses.sql');
      
      resolve(sqlStatements.length);
    });
  });
}

parseCSVToSQL().catch(console.error);
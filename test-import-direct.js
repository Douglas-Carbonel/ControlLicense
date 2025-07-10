import fs from 'fs';
import { parse } from 'csv-parse';

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';

async function testImportLogic() {
  try {
    const content = fs.readFileSync(csvFile, 'utf8');
    
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

    console.log(`Found ${records.length} records`);
    
    // Test processing logic
    const record = records[0];
    console.log('Testing with first record:', record);
    
    const linha = parseInt(record.Linha || record.linha || "1");
    const qtLicencas = parseInt(record["Qt. Licenças"] || record["Qt. Licen?as"] || record.qtLicencas || record.qt_licencas || "1");
    
    const licenseData = {
      code: (record.Code || record.code || record.codigo || "").toString(),
      linha: isNaN(linha) ? 1 : linha,
      ativo: (record.Ativo || record.ativo || "Y") === "Y",
      codCliente: (record["Cod. Cliente"] || record.codCliente || record.cod_cliente || "").toString(),
      nomeCliente: (record["Nome Cliente"] || record.nomeCliente || record.nome_cliente || "").toString(),
      dadosEmpresa: (record["Dados da empresa"] || record.dadosEmpresa || record.dados_empresa || "").toString(),
      hardwareKey: (record["Hardware key"] || record.hardwareKey || record.hardware_key || "").toString(),
      installNumber: (record["Install number"] || record.installNumber || record.install_number || "").toString(),
      systemNumber: (record["System number"] || record.systemNumber || record.system_number || "").toString(),
      nomeDb: (record["Nome DB"] || record.nomeDb || record.nome_db || "").toString(),
      descDb: (record["Desc. DB"] || record.descDb || record.desc_db || "").toString(),
      endApi: (record["End. API"] || record.endApi || record.end_api || "").toString(),
      listaCnpj: (record["Lista de CNPJ"] || record.listaCnpj || record.lista_cnpj || "").toString(),
      qtLicencas: isNaN(qtLicencas) ? 1 : qtLicencas,
      versaoSap: (record["Versão SAP"] || record["Vers?o SAP"] || record.versaoSap || record.versao_sap || "").toString(),
    };
    
    console.log('Processed license data:', licenseData);
    
    // Test sending to API
    const response = await fetch('http://localhost:5000/api/licenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(licenseData),
    });
    
    const result = await response.json();
    console.log('API Response:', result);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testImportLogic();

import fs from 'fs';

function convertSQLToCSV() {
  try {
    console.log('Convertendo dados SQL para CSV...');
    
    // Ler o arquivo SQL
    const sqlContent = fs.readFileSync('remaining-batches.sql', 'utf8');
    
    // Cabeçalho do CSV
    const csvHeader = 'Code,Linha,Ativo,Cod. Cliente,Nome Cliente,Dados da empresa,Hardware key,Install number,System number,Nome DB,Desc. DB,End. API,Lista de CNPJ,Qt. Licenças,Versão SAP\n';
    
    let csvContent = csvHeader;
    let processedCount = 0;
    
    // Processar cada linha SQL
    const lines = sqlContent.split('\n');
    
    for (const line of lines) {
      if (line.trim() && (line.includes('INSERT INTO') || line.includes('('))) {
        // Extrair dados usando regex
        const match = line.match(/\('([^']+)',\s*(\d+),\s*(true|false),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+),\s*'([^']*)'/);
        
        if (match) {
          const [, code, linha, ativo, codCliente, nomeCliente, dadosEmpresa, hardwareKey, installNumber, systemNumber, nomeDb, descDb, endApi, listaCnpj, qtLicencas, versaoSap] = match;
          
          // Converter para formato CSV
          const csvLine = [
            code,
            linha,
            ativo === 'true' ? 'Y' : 'N',
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
            qtLicencas,
            versaoSap
          ].map(field => `"${field.replace(/"/g, '""')}"`).join(';');
          
          csvContent += csvLine + '\n';
          processedCount++;
        }
      }
    }
    
    // Salvar arquivo CSV
    fs.writeFileSync('remaining-licenses.csv', csvContent);
    
    console.log(`✅ Convertido com sucesso! ${processedCount} licenças exportadas para remaining-licenses.csv`);
    console.log('Agora você pode fazer o upload deste arquivo via interface web em http://localhost:5000/import');
    
  } catch (error) {
    console.error('❌ Erro durante a conversão:', error.message);
  }
}

convertSQLToCSV();

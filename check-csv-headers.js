import fs from 'fs';
import { parse } from 'csv-parse';

async function checkCSVHeaders() {
  try {
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

    console.log('=== CABEÇALHOS DO CSV ===');
    const headers = Object.keys(records[0]);
    headers.forEach((header, index) => {
      console.log(`${index + 1}. "${header}"`);
    });

    console.log('\n=== EXEMPLO DE DADOS (PRIMEIRO REGISTRO) ===');
    const firstRecord = records[0];
    headers.forEach(header => {
      console.log(`${header}: "${firstRecord[header]}"`);
    });

    console.log('\n=== CAMPOS PRINCIPAIS DETECTADOS ===');
    const keyFields = [
      'Code',
      'Linha', 
      'Nome do Cliente',
      'Qt. Licenças',
      'Ativo',
      'System Number',
      'Hardware Key',
      'Install Number',
      'Endpoint'
    ];

    keyFields.forEach(field => {
      const found = headers.find(h => h.includes(field) || h.toLowerCase().includes(field.toLowerCase()));
      if (found) {
        console.log(`✓ ${field} -> "${found}"`);
      } else {
        console.log(`✗ ${field} -> NÃO ENCONTRADO`);
      }
    });

  } catch (error) {
    console.error('Erro:', error);
  }
}

checkCSVHeaders();
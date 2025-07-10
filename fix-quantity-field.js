import fs from 'fs';
import { parse } from 'csv-parse';

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';

async function fixQuantityField() {
  try {
    const content = fs.readFileSync(csvFile, 'utf8');
    const lines = content.split('\n');
    
    console.log('Header line:');
    console.log(lines[0]);
    console.log('\nHeader fields:');
    const headerFields = lines[0].split(';');
    headerFields.forEach((field, index) => {
      console.log(`${index}: "${field}"`);
    });
    
    // Parse to check actual data
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
    
    console.log('\nFirst record keys and values:');
    const firstRecord = records[0];
    Object.keys(firstRecord).forEach(key => {
      console.log(`"${key}": "${firstRecord[key]}"`);
    });
    
    // Test different field name variations
    console.log('\nTesting quantity field variations:');
    const qtVariations = [
      'Qt. Licenças',
      'Qt. Licen?as',
      'Qt. Licen�as',
      'Qt. Licenças',
      'Qt.Licenças',
      'Qt.Licen?as'
    ];
    
    qtVariations.forEach(variation => {
      const value = firstRecord[variation];
      console.log(`"${variation}": "${value}"`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixQuantityField();
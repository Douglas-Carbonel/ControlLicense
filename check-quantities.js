import fs from 'fs';
import { parse } from 'csv-parse';

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752180503081.csv';

async function checkQuantities() {
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

    console.log(`Total records in new CSV: ${records.length}`);
    
    // Check first few records for quantity field
    console.log('\n=== First 10 records quantity check ===');
    records.slice(0, 10).forEach((record, index) => {
      const qtField = record["Qt. Licen�as"] || record["Qt. Licenças"] || record["Qt. Licen?as"];
      console.log(`${index + 1}. Code: ${record.Code}, Linha: ${record.Linha}, Qt: "${qtField}"`);
    });
    
    // Calculate total licenses expected
    let totalExpected = 0;
    records.forEach(record => {
      const qty = parseInt(record["Qt. Licen�as"] || record["Qt. Licenças"] || record["Qt. Licen?as"] || "1");
      if (!isNaN(qty)) {
        totalExpected += qty;
      }
    });
    
    console.log(`\nTotal licenses expected: ${totalExpected}`);
    
    // Check for any differences in quantities vs first import
    const problemRecords = records.filter(record => {
      const qty = parseInt(record["Qt. Licen�as"] || record["Qt. Licenças"] || record["Qt. Licen?as"] || "1");
      return isNaN(qty) || qty === 1; // Records that might have wrong quantities
    });
    
    console.log(`\nRecords with potential quantity issues: ${problemRecords.length}`);
    if (problemRecords.length > 0) {
      console.log('First 5 problem records:');
      problemRecords.slice(0, 5).forEach(record => {
        console.log(`Code: ${record.Code}, Original Qt field: "${record["Qt. Licen�as"]}", Parsed: ${parseInt(record["Qt. Licen�as"] || "1")}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuantities();
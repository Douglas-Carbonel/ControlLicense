import fs from 'fs';
import { parse } from 'csv-parse';

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';

// Test 1: Check if file exists and read it
console.log('=== Testing file reading ===');
try {
  const content = fs.readFileSync(csvFile, 'utf8');
  console.log('File size:', content.length);
  console.log('First 200 chars:', content.substring(0, 200));
  
  // Test 2: Parse CSV
  console.log('\n=== Testing CSV parsing ===');
  parse(content, {
    columns: true,
    skip_empty_lines: true,
    delimiter: ';'
  }, (err, records) => {
    if (err) {
      console.error('Parse error:', err);
    } else {
      console.log('Records found:', records.length);
      console.log('First record keys:', Object.keys(records[0]));
      console.log('First record:', records[0]);
    }
  });
} catch (error) {
  console.error('File reading error:', error);
}
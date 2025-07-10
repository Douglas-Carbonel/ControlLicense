import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import * as XLSX from 'xlsx';

// Check if files exist
const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';
const excelFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025_1752179592436.xlsx';

console.log('Checking files...');

// Try to read CSV with different encodings
if (fs.existsSync(csvFile)) {
  console.log('CSV file found, trying to read...');
  
  // Try different encodings
  const encodings = ['utf8', 'latin1', 'cp1252', 'iso-8859-1'];
  
  for (const encoding of encodings) {
    try {
      console.log(`\nTrying encoding: ${encoding}`);
      const content = fs.readFileSync(csvFile, encoding);
      console.log('First 500 characters:');
      console.log(content.substring(0, 500));
      
      // Try to parse as CSV
      parse(content, {
        columns: true,
        skip_empty_lines: true,
        delimiter: ';'
      }, (err, records) => {
        if (err) {
          console.log(`Parse error with ${encoding}:`, err.message);
        } else {
          console.log(`Successfully parsed ${records.length} records with ${encoding}`);
          console.log('First record:', records[0]);
        }
      });
      
      break;
    } catch (error) {
      console.log(`Error with ${encoding}:`, error.message);
    }
  }
} else {
  console.log('CSV file not found at:', csvFile);
}

// Check Excel file
if (fs.existsSync(excelFile)) {
  console.log('\nExcel file found');
  const stats = fs.statSync(excelFile);
  console.log('Excel file size:', stats.size, 'bytes');
} else {
  console.log('Excel file not found at:', excelFile);
}

// List all files in attached_assets
console.log('\nFiles in attached_assets:');
if (fs.existsSync('attached_assets')) {
  const files = fs.readdirSync('attached_assets');
  files.forEach(file => {
    const stats = fs.statSync(path.join('attached_assets', file));
    console.log(`- ${file} (${stats.size} bytes)`);
  });
} else {
  console.log('attached_assets directory not found');
}
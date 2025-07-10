import fs from 'fs';
import { parse } from 'csv-parse';

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';

async function analyzeImportIssues() {
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

    console.log(`Total records in CSV: ${records.length}`);
    
    // Analyze quantity field issues
    console.log('\n=== Analyzing Qt. Licenças field ===');
    const qtFields = records.map(r => ({
      code: r.Code,
      original: r["Qt. Licen?as"] || r["Qt. Licenças"],
      parsed: parseInt(r["Qt. Licen?as"] || r["Qt. Licenças"] || "1")
    }));
    
    // Show first 10 examples
    console.log('First 10 quantity examples:');
    qtFields.slice(0, 10).forEach(item => {
      console.log(`${item.code}: "${item.original}" -> ${item.parsed}`);
    });
    
    // Check for unique key violations
    console.log('\n=== Checking for duplicate Code+Linha combinations ===');
    const codeLinhaMap = new Map();
    const duplicates = [];
    
    records.forEach((record, index) => {
      const key = `${record.Code}_${record.Linha}`;
      if (codeLinhaMap.has(key)) {
        duplicates.push({
          index: index + 1,
          code: record.Code,
          linha: record.Linha,
          firstIndex: codeLinhaMap.get(key)
        });
      } else {
        codeLinhaMap.set(key, index + 1);
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate Code+Linha combinations:`);
    duplicates.slice(0, 5).forEach(dup => {
      console.log(`  Code: ${dup.code}, Linha: ${dup.linha} (rows ${dup.firstIndex} and ${dup.index})`);
    });
    
    // Check for empty required fields
    console.log('\n=== Checking for empty required fields ===');
    let emptyCodeCount = 0;
    let emptyCodClienteCount = 0;
    let emptyNomeClienteCount = 0;
    
    records.forEach((record, index) => {
      if (!record.Code || record.Code.trim() === '') emptyCodeCount++;
      if (!record['Cod. Cliente'] || record['Cod. Cliente'].trim() === '') emptyCodClienteCount++;
      if (!record['Nome Cliente'] || record['Nome Cliente'].trim() === '') emptyNomeClienteCount++;
    });
    
    console.log(`Empty Code fields: ${emptyCodeCount}`);
    console.log(`Empty Cod. Cliente fields: ${emptyCodClienteCount}`);
    console.log(`Empty Nome Cliente fields: ${emptyNomeClienteCount}`);
    
    // Check actual quantities in original data
    console.log('\n=== Quantity field analysis ===');
    const quantities = records.map(r => r["Qt. Licen?as"] || r["Qt. Licenças"]).filter(q => q);
    const uniqueQuantities = [...new Set(quantities)];
    console.log('Unique quantity values found:', uniqueQuantities.slice(0, 20));
    
    // Calculate total licenses
    let totalLicenses = 0;
    records.forEach(record => {
      const qty = parseInt(record["Qt. Licen?as"] || record["Qt. Licenças"] || "0");
      if (!isNaN(qty)) {
        totalLicenses += qty;
      }
    });
    console.log(`Total licenses in CSV: ${totalLicenses}`);
    
  } catch (error) {
    console.error('Analysis failed:', error);
  }
}

analyzeImportIssues();
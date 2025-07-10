import fs from 'fs';
import { parse } from 'csv-parse';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { licenses, activities } from './shared/schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = neon(connectionString);
const db = drizzle(client);

const csvFile = 'attached_assets/cadastros_Licenças dos clientes_10_07_2025(data)_1752179590133.csv';

async function importCSVData() {
  try {
    console.log('Reading CSV file...');
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

    console.log(`Found ${records.length} records to import`);
    
    let importedCount = 0;
    let errors = [];

    for (const record of records) {
      try {
        // Clean and prepare data
        const licenseData = {
          code: record.Code || '',
          linha: parseInt(record.Linha) || 1,
          ativo: record.Ativo === 'Y',
          codCliente: record['Cod. Cliente'] || '',
          nomeCliente: record['Nome Cliente'] || '',
          dadosEmpresa: record['Dados da empresa'] || '',
          hardwareKey: record['Hardware key'] || '',
          installNumber: record['Install number'] || '',
          systemNumber: record['System number'] || '',
          nomeDb: record['Nome DB'] || '',
          descDb: record['Desc. DB'] || '',
          endApi: record['End. API'] || '',
          listaCnpj: record['Lista de CNPJ'] || '',
          qtLicencas: parseInt(record['Qt. Licenças'] || record['Qt. Licen?as']) || 1,
          versaoSap: record['Versão SAP'] || record['Vers?o SAP'] || '',
        };

        // Insert into database
        await db.insert(licenses).values(licenseData);
        importedCount++;
        
        if (importedCount % 50 === 0) {
          console.log(`Imported ${importedCount} records so far...`);
        }
      } catch (error) {
        errors.push({
          record: record,
          error: error.message
        });
        console.error(`Error importing record ${record.Code}:`, error.message);
      }
    }

    // Log the import activity
    await db.insert(activities).values({
      userId: 'system',
      userName: 'System Import',
      action: 'IMPORT',
      resourceType: 'license',
      resourceId: null,
      description: `Imported ${importedCount} licenses from CSV file`
    });

    console.log(`\n=== Import Summary ===`);
    console.log(`Total records in CSV: ${records.length}`);
    console.log(`Successfully imported: ${importedCount}`);
    console.log(`Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nFirst 5 errors:');
      errors.slice(0, 5).forEach((error, index) => {
        console.log(`${index + 1}. Record ${error.record.Code}: ${error.error}`);
      });
    }

    return { imported: importedCount, errors: errors.length };
  } catch (error) {
    console.error('Failed to import data:', error);
    throw error;
  }
}

// Run the import
importCSVData()
  .then(result => {
    console.log('\nImport completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });
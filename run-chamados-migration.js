
import postgres from 'postgres';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('🔄 Executando migração de campos de leitura em chamados...');
    
    const migrationSQL = readFileSync('migrations/add-chamados-read-fields.sql', 'utf-8');
    
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');
    console.log('✅ Campos adicionados: lido_por_solicitante, lido_por_atendente, data_ultima_interacao');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration();

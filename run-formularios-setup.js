

import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupFormulariosTables() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL ou SUPABASE_DATABASE_URL não encontrada");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  
  try {
    console.log("🔄 Conectando ao banco de dados...");
    
    // Primeiro, remover as tabelas se existirem
    console.log("🗑️ Removendo tabelas existentes...");
    await sql.unsafe(`DROP TABLE IF EXISTS resposta_formulario CASCADE;`);
    await sql.unsafe(`DROP TABLE IF EXISTS formulario_cliente CASCADE;`);
    
    // Ler o arquivo SQL
    const sqlScript = readFileSync(join(__dirname, "create-formularios-tables.sql"), "utf8");
    
    console.log("🔄 Executando script de criação das tabelas...");
    
    // Executar o script
    await sql.unsafe(sqlScript);
    
    // Verificar se as tabelas foram criadas
    console.log("✅ Verificando tabelas criadas...");
    const tabelas = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('formulario_cliente', 'resposta_formulario')
      ORDER BY table_name;
    `;
    
    console.log("✅ Tabelas de formulários criadas com sucesso!");
    console.log("📝 Tabelas confirmadas no banco:");
    tabelas.forEach(t => console.log(`   - ${t.table_name}`));
    
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error.message);
    console.error("❌ Stack:", error.stack);
  } finally {
    await sql.end();
  }
}

setupFormulariosTables();


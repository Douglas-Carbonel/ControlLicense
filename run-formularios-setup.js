
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
    
    // Ler o arquivo SQL
    const sqlScript = readFileSync(join(__dirname, "create-formularios-tables.sql"), "utf8");
    
    console.log("🔄 Executando script de criação das tabelas...");
    
    // Executar o script
    await sql.unsafe(sqlScript);
    
    console.log("✅ Tabelas de formulários criadas com sucesso!");
    console.log("📝 Tabelas criadas:");
    console.log("   - formulario_cliente");
    console.log("   - resposta_formulario");
    
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error.message);
  } finally {
    await sql.end();
  }
}

setupFormulariosTables();

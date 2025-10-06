
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkAndRestart() {
  try {
    console.log('🔍 Verificando estrutura da tabela chamados...');
    
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'chamados' 
      AND column_name IN ('lido_por_solicitante', 'lido_por_atendente', 'data_ultima_interacao')
      ORDER BY column_name
    `;
    
    console.log('✅ Colunas encontradas:', result);
    
    if (result.length === 3) {
      console.log('✅ Todas as colunas necessárias estão presentes!');
      console.log('🔄 Agora REINICIE o servidor (Ctrl+C e npm run dev)');
    } else {
      console.log('❌ Faltam colunas! Execute a migração novamente.');
    }
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

checkAndRestart();


import postgres from 'postgres';

async function fixNumeroChamado() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não está definida');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('🔄 Corrigindo coluna numero...');

    // 1. Remover coluna numero se existir
    await sql`
      ALTER TABLE chamados DROP COLUMN IF EXISTS numero CASCADE;
    `;
    console.log('✅ Coluna numero removida');

    // 2. Remover sequence se existir
    await sql`
      DROP SEQUENCE IF EXISTS chamados_numero_seq CASCADE;
    `;
    console.log('✅ Sequence removida');

    // 3. Criar sequence
    await sql`
      CREATE SEQUENCE chamados_numero_seq;
    `;
    console.log('✅ Sequence criada');

    // 4. Adicionar coluna com default correto
    await sql`
      ALTER TABLE chamados 
      ADD COLUMN numero INTEGER NOT NULL DEFAULT nextval('chamados_numero_seq');
    `;
    console.log('✅ Coluna numero adicionada');

    // 5. Associar sequence à coluna
    await sql`
      ALTER SEQUENCE chamados_numero_seq OWNED BY chamados.numero;
    `;
    console.log('✅ Sequence associada à coluna');

    // 6. Criar índice único
    await sql`
      CREATE UNIQUE INDEX idx_chamados_numero ON chamados(numero);
    `;
    console.log('✅ Índice único criado');

    console.log('✅ Correção concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixNumeroChamado();


import postgres from 'postgres';

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não está definida');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('🔄 Executando migration...');

    // Criar sequence
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'chamados_numero_seq') THEN
          CREATE SEQUENCE chamados_numero_seq;
        END IF;
      END $$;
    `;

    // Adicionar coluna numero
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chamados' AND column_name = 'numero') THEN
          ALTER TABLE chamados ADD COLUMN numero INTEGER DEFAULT nextval('chamados_numero_seq') NOT NULL;
          ALTER SEQUENCE chamados_numero_seq OWNED BY chamados.numero;
          CREATE UNIQUE INDEX idx_chamados_numero ON chamados(numero);
        END IF;
      END $$;
    `;

    console.log('✅ Migration executada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();

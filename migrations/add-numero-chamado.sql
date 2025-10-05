
-- Migration: Adicionar coluna numero aos chamados

-- 1. Criar sequence para numero
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'chamados_numero_seq') THEN
    CREATE SEQUENCE chamados_numero_seq;
  END IF;
END $$;

-- 2. Adicionar coluna numero com default usando a sequence
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chamados' AND column_name = 'numero') THEN
    ALTER TABLE chamados ADD COLUMN numero INTEGER DEFAULT nextval('chamados_numero_seq') NOT NULL;
    ALTER SEQUENCE chamados_numero_seq OWNED BY chamados.numero;
    CREATE UNIQUE INDEX idx_chamados_numero ON chamados(numero);
  END IF;
END $$;

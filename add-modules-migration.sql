
-- Migration to add module columns to licenses table
-- Add modulo1, modulo2, modulo3, modulo4, modulo5 columns

ALTER TABLE licenses 
ADD COLUMN modulo1 BOOLEAN DEFAULT false,
ADD COLUMN modulo2 BOOLEAN DEFAULT false,
ADD COLUMN modulo3 BOOLEAN DEFAULT false,
ADD COLUMN modulo4 BOOLEAN DEFAULT false,
ADD COLUMN modulo5 BOOLEAN DEFAULT false;

-- Update existing records to have default values
UPDATE licenses 
SET modulo1 = false 
WHERE modulo1 IS NULL;

UPDATE licenses 
SET modulo2 = false 
WHERE modulo2 IS NULL;

UPDATE licenses 
SET modulo3 = false 
WHERE modulo3 IS NULL;

UPDATE licenses 
SET modulo4 = false 
WHERE modulo4 IS NULL;

UPDATE licenses 
SET modulo5 = false 
WHERE modulo5 IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN licenses.modulo1 IS 'Módulo 1 ativo/inativo';
COMMENT ON COLUMN licenses.modulo2 IS 'Módulo 2 ativo/inativo';
COMMENT ON COLUMN licenses.modulo3 IS 'Módulo 3 ativo/inativo';
COMMENT ON COLUMN licenses.modulo4 IS 'Módulo 4 ativo/inativo';
COMMENT ON COLUMN licenses.modulo5 IS 'Módulo 5 ativo/inativo';

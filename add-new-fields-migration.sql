
-- Migration to add new fields to licenses table
-- Add qtLicencasAdicionais and observacao columns

ALTER TABLE licenses 
ADD COLUMN qt_licencas_adicionais INTEGER DEFAULT 0,
ADD COLUMN observacao TEXT DEFAULT '';

-- Update existing records to have default values
UPDATE licenses 
SET qt_licencas_adicionais = 0 
WHERE qt_licencas_adicionais IS NULL;

UPDATE licenses 
SET observacao = '' 
WHERE observacao IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN licenses.qt_licencas_adicionais IS 'Quantidade de licenças adicionais';
COMMENT ON COLUMN licenses.observacao IS 'Observações sobre a licença';

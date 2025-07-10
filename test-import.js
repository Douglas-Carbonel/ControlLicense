
const fs = require('fs');

// Verificar se os arquivos SQL existem e contar registros
console.log('Verificando arquivos de importação...');

const files = [
  'batch1.sql',
  'batch2.sql', 
  'batch2-remaining.sql',
  'remaining-batches.sql',
  'complete-import.sql'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    const insertCount = (content.match(/INSERT INTO/g) || []).length;
    const valueCount = (content.match(/VALUES/g) || []).length;
    console.log(`${file}: ${insertCount} comandos INSERT, ${valueCount} blocos VALUES`);
  } else {
    console.log(`${file}: arquivo não encontrado`);
  }
});

console.log('\nPara continuar a importação quando o banco estiver disponível:');
console.log('1. Configure a variável DATABASE_URL no ambiente');
console.log('2. Execute o arquivo complete-import.sql');
console.log('3. Reinicie o servidor');

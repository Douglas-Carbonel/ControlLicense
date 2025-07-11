#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Configuração do Supabase para o Sistema de Licenças');
console.log('===================================================');
console.log('');

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function setupSupabase() {
  try {
    console.log('Para obter sua URL do Supabase:');
    console.log('1. Acesse https://supabase.com/dashboard/projects');
    console.log('2. Selecione seu projeto');
    console.log('3. Clique em "Connect"');
    console.log('4. Copie a URI em "Connection string" → "Transaction pooler"');
    console.log('5. Substitua [YOUR-PASSWORD] pela senha do seu projeto');
    console.log('');
    
    const supabaseUrl = await question('Cole aqui a URL completa do Supabase: ');
    
    if (!supabaseUrl.trim()) {
      console.log('❌ URL não fornecida. Configuração cancelada.');
      rl.close();
      return;
    }
    
    // Ler o arquivo .env atual
    let envContent = readFileSync('.env', 'utf8');
    
    // Substituir a URL do Supabase
    envContent = envContent.replace(
      /SUPABASE_DATABASE_URL=.*/,
      `SUPABASE_DATABASE_URL=${supabaseUrl.trim()}`
    );
    
    // Salvar o arquivo
    writeFileSync('.env', envContent);
    
    console.log('');
    console.log('✅ Configuração do Supabase salva com sucesso!');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Execute: npm run db:push');
    console.log('2. Execute: npx tsx create-admin.ts');
    console.log('3. Execute: npm run dev');
    console.log('');
    console.log('Usuários que serão criados:');
    console.log('- Admin: admin / admin123');
    console.log('- Técnico: tecnico / tech123');
    
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  }
  
  rl.close();
}

setupSupabase();
# Configuração do Sistema de Gerenciamento de Licenças

## 1. Configuração do Banco de Dados

### Opção A: Usar Supabase (Recomendado)
1. Acesse https://supabase.com/dashboard/projects
2. Crie um novo projeto ou use um existente
3. Vá para a seção "Connect"
4. Copie a URI em "Connection string" → "Transaction pooler"
5. Substitua `[YOUR-PASSWORD]` pela senha do seu projeto
6. Configure a variável de ambiente `SUPABASE_DATABASE_URL` no Replit

### Opção B: Usar PostgreSQL Local do Replit
Se não configurar a variável SUPABASE_DATABASE_URL, o sistema usará automaticamente o PostgreSQL local do Replit.

## 2. Inicialização do Banco de Dados

Execute os seguintes comandos no terminal:

```bash
# Criar as tabelas no banco de dados
npm run db:push

# Criar usuários administradores
npx tsx create-admin.ts
```

## 3. Usuários Padrão

Após a execução do script `create-admin.ts`, estarão disponíveis:

- **Admin**: 
  - Usuário: `admin`
  - Senha: `admin123`
  - Permissões: Administrador completo

- **Técnico**:
  - Usuário: `tecnico`
  - Senha: `tech123`
  - Permissões: Suporte técnico

## 4. Execução da Aplicação

```bash
npm run dev
```

A aplicação estará disponível na porta 5000.

## 5. Recursos Principais

- **Gerenciamento de Licenças**: CRUD completo
- **Importação de Dados**: Suporte a CSV e Excel
- **Histórico de Atividades**: Rastreamento de todas as operações
- **Gerenciamento de Usuários**: Sistema de autenticação e autorização
- **Dashboard**: Estatísticas e visão geral do sistema

## 6. Estrutura de Pastas

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Schemas e tipos compartilhados
├── create-admin.ts  # Script para criar usuários
└── replit.md        # Documentação do projeto
```

## 7. Comandos Úteis

```bash
npm run dev          # Executar em desenvolvimento
npm run build        # Construir para produção
npm run start        # Executar produção
npm run db:push      # Aplicar schema no banco
npm run check        # Verificar tipos TypeScript
```
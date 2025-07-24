# License Management System

## Overview

This is a full-stack license management system built with React (frontend) and Express.js (backend). The application allows users to manage software licenses, track their status, import data from CSV/Excel files, and view activity history. It features a modern UI built with shadcn/ui components and uses Supabase PostgreSQL for data persistence.

## Recent Changes (Jan 2025)

✓ Migrated from Replit Agent to Replit environment
✓ Configured Supabase database integration support
✓ Created admin users for system access (admin/admin123, tecnico/tech123)
✓ Fixed CSS styling issues for Replit compatibility
✓ Established database schema with tables: licenses, users, activities
✓ Modernized UI layout based on user-provided templates
✓ Updated sidebar navigation to modern clean design
✓ Improved header with search functionality and user profile display
✓ Enhanced dashboard with modern card layouts and improved table design
✓ Implemented contemporary color scheme with purple primary color
✓ Updated to professional green/blue corporate palette
✓ Created modern login layout matching provided design mockup
✓ Redesigned login with diamond/geometric layout
✓ Implemented teal/coral color scheme from new design mockup
✓ Changed placeholders to Portuguese (Usuário/Senha)
✓ Applied diamond color palette to entire application
✓ Refined color palette to match login design exactly
✓ Applied corporate blue color palette from login throughout entire application
✓ Updated all components (sidebar, header, buttons, cards, tables) to use consistent colors
✓ Implemented gradient effects and modern styling matching login design
✓ Updated entire application post-login to use corporate blue palette from login design
✓ Applied gradient effects and modern styling throughout the interface
✓ Harmonized sidebar, header, cards, and layout with login design colors
✓ Implemented DW IT Solutions official corporate palette (#f4f4f4, #0095da, #313d5a, #3a3a3c, #0c151f)
✓ Updated entire application to use official company brand colors consistently
✓ Refined all modals (nova licença, edição de licença, usuários) with official corporate colors
✓ Added proper styling and descriptions to modal headers with company branding
✓ Enhanced tab navigation in edit modal with corporate blue active states
✓ Completely modernized header/navbar with professional corporate design
✓ Added sophisticated company logo with Building2 icon and Shield badge overlay
✓ Implemented gradient backgrounds for logo and user avatar with corporate colors
✓ Enhanced search bar with rounded corners and improved placeholder text
✓ Added professional dropdown menu for user profile with role badges
✓ Included notification bell with counter badge for system alerts
✓ Implementado sistema robusto de renovação automática de tokens JWT
✓ Corrigido erro "activities?.map is not a function" com verificação de tipo segura
✓ Criado sistema preventivo de renovação de tokens antes do vencimento
✓ Adicionado controle de múltiplas requisições simultâneas para evitar conflitos
✓ Aumentada duração dos tokens de 8h para 24h para maior estabilidade
✓ Implementado endpoint /api/auth/refresh para renovação segura de tokens
✓ Migração completa do Replit Agent para ambiente Replit
✓ Otimizações de performance implementadas (debounce, memoização, cache otimizado)
✓ Sistema de busca otimizado com debounce de 300ms para evitar travamentos
✓ Processamento de importação em lotes de 50 registros para melhor performance
✓ Cache de queries otimizado com staleTime de 5 minutos e gcTime de 10 minutos
✓ Memoização aplicada em filtros e funções callback para reduzir re-renders
✓ CSS otimizado com will-change e transições suaves para melhor UX
✓ Implementado sistema de busca silenciosa para melhor experiência do usuário
✓ Busca global funciona em todos os 417 registros, não apenas na página atual
✓ Campos de filtro permitem digitação livre sem indicadores de "procurando"
✓ Hook personalizado useSilentSearch para busca responsiva e otimizada
✓ Migração para abordagem profissional: carregamento único + busca local instantânea
✓ Otimizações de performance para eliminar travadas durante digitação
✓ Implementado debounce inteligente (400ms) para balance entre responsividade e performance
✓ Adicionadas otimizações CSS específicas para inputs (contain, will-change, transitions)
✓ Reduzido tamanho de página para 25 registros para melhor performance de renderização
✓ Cache otimizado para 15 minutos com garbage collection de 30 minutos
✓ **SUCESSO CONFIRMADO**: Performance da busca e digitação otimizada com aprovação do usuário (Jan 2025)
✓ **MIGRAÇÃO COMPLETA**: Migração do Replit Agent para ambiente Replit finalizada com sucesso (Jan 2025)
✓ Sistema funcionando perfeitamente com login, licenças, atividades e criação de usuários operacionais
✓ **NOVO ENDPOINT**: Criado endpoint POST /api/licenses/hardware-query para consulta externa de licenças
✓ Endpoint recebe hardwareKey, systemNumber, installNumber e database como parâmetros
✓ Retorna quantidade total de licenças e lista de CNPJs para sistemas externos
✓ Implementado com validação Zod e logging de atividades para auditoria
✓ **CRIPTOGRAFIA IMPLEMENTADA**: Endpoint /api/licenses/hardware-query agora usa criptografia AES-256-CBC
✓ Dados sensíveis (CNPJs e quantidades) protegidos com criptografia militar
✓ Implementadas funções encryptData() e decryptData() com algoritmo scrypt
✓ Criado endpoint POST /api/decrypt para testes de descriptografia
✓ Documentação completa em DESCRIPTOGRAFIA_EXEMPLOS.md com códigos para Node.js, Python, Java e C#
✓ Configuração via variável ENCRYPTION_KEY com chave padrão de 32 caracteres
✓ IV único por requisição garantindo segurança total das comunicações

## Configuração Padrão do Supabase

**Configuração Automática**: O sistema usa automaticamente a conexão Supabase pré-configurada!

### Conexão Padrão (Jan 2025):
```
postgresql://postgres.omhogvuxqdodxwfvnzms:IE3Vbr2dO1lp8rO9@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

### Para futuras importações:
1. A conexão Supabase já está configurada no `.env`
2. Execute `npm run db:push` para criar as tabelas
3. Execute `npx tsx create-admin.ts` para criar os usuários admin

### Usuários padrão criados:
- **admin**: admin123 (administrador)
- **tecnico**: tech123 (suporte)

## Paleta de Cores Atual (Design Diamante)

### Cores Principais
- **Teal (Verde-Azulado)**: `hsl(180, 25%, 45%)` - Cor primária do diamante
- **Teal Escuro**: `hsl(180, 30%, 35%)` - Gradiente do diamante
- **Coral**: `hsl(10, 85%, 60%)` - Botão de login
- **Bege Claro**: `hsl(25, 15%, 85%)` - Fundo da página
- **Cinza Escuro**: `hsl(180, 20%, 20%)` - Inputs
- **Cinza Texto**: `hsl(180, 25%, 65%)` - Texto dos placeholders

### Aplicação no Design
- **Fundo**: Bege claro suave
- **Container Diamante**: Gradiente teal com rotação 45°
- **Inputs**: Cinza escuro com ícones e placeholders em cinza claro
- **Botão LOGIN**: Coral vibrante com hover effects
- **Título**: Branco com espaçamento de letras aumentado

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **File Processing**: Multer for file uploads, CSV parsing, and Excel processing
- **API Design**: RESTful endpoints with proper error handling and logging

### Development Environment
- **Development Server**: Vite dev server with HMR
- **Production Build**: Bundled with esbuild for server-side code
- **Environment**: Replit-optimized with runtime error overlay

## Key Components

### Database Schema
- **Licenses Table**: Stores license information including client details, license types, dates, and status
- **Activities Table**: Tracks all system activities for audit purposes
- **Schema Validation**: Zod schemas for runtime type checking and validation

### Core Features
1. **License Management**: CRUD operations for licenses with status tracking
2. **Data Import**: CSV/Excel file import functionality
3. **Activity Logging**: Comprehensive activity tracking for all operations
4. **Statistics Dashboard**: Real-time license statistics and metrics
5. **Search and Filter**: License search and filtering capabilities

### UI Components
- **Dashboard**: Overview with statistics cards, recent licenses, and activity feed
- **License Management**: Complete license CRUD interface
- **Import Interface**: File upload and processing for bulk data import
- **Activity History**: Detailed activity log with filtering
- **Responsive Layout**: Mobile-friendly design with sidebar navigation

## Data Flow

### Client-Server Communication
1. Frontend makes HTTP requests to Express.js API endpoints
2. Server validates requests using Zod schemas
3. Database operations performed through Drizzle ORM
4. Activity logging occurs for all data mutations
5. Responses returned with proper error handling

### File Import Process
1. User uploads CSV/Excel file through web interface
2. Server processes file using appropriate parser (csv-parse/xlsx)
3. Data validated against license schema
4. Bulk insert operations performed
5. Activity logged for import operation

### Real-time Updates
- TanStack Query provides optimistic updates and cache invalidation
- Automatic refetching of data after mutations
- Loading states and error handling throughout the UI

## External Dependencies

### Frontend Dependencies
- **UI Components**: Extensive Radix UI component library
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Data Fetching**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React icon library
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Database**: Neon serverless PostgreSQL driver
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **File Processing**: Multer, csv-parse, and xlsx for file handling
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution, esbuild for production builds

## Deployment Strategy

### Development
- Uses Vite development server with middleware mode
- Express server runs with tsx for TypeScript support
- Hot module replacement enabled for fast development
- Replit-specific optimizations and banner integration

### Production
- Frontend built with Vite and output to `dist/public`
- Backend bundled with esbuild to `dist/index.js`
- Static file serving from built frontend assets
- Environment-based configuration for database connection

### Database Management
- Drizzle Kit for schema migrations
- PostgreSQL connection through environment variables
- Migration files stored in `./migrations` directory
- Schema definitions in shared TypeScript files

### Environment Configuration
- Database URL required through environment variables
- Development/production mode detection
- Replit-specific environment variable handling
- CORS and security headers configured for production
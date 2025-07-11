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

## Importante: Configuração do Supabase

Sempre que importar este projeto para um novo ambiente Replit, será necessário configurar a variável de ambiente `SUPABASE_DATABASE_URL` com a URL de conexão do seu projeto Supabase. Isso é necessário por questões de segurança - credenciais não são salvas no código.

Para configurar:
1. Acesse o dashboard do Supabase (https://supabase.com/dashboard/projects)
2. Vá para o seu projeto
3. Clique em "Connect"
4. Copie a URI em "Connection string" → "Transaction pooler"
5. Substitua `[YOUR-PASSWORD]` pela senha do seu banco
6. Configure esta URL como variável de ambiente no Replit

O sistema funcionará automaticamente com PostgreSQL local se a variável SUPABASE_DATABASE_URL não estiver configurada.

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
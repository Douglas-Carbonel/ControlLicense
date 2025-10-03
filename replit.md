# License Management System

## Overview

This project is a full-stack license management system designed to streamline the process of managing software licenses. It enables users to track license status, import data from various file formats (CSV/Excel), and monitor activity history through a modern, intuitive user interface. The system aims to provide a robust solution for efficient license lifecycle management, enhancing operational oversight and data integrity for businesses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The system features a modern UI built with shadcn/ui components. It incorporates a consistent corporate blue color palette from "DW IT Solutions" (`#f4f4f4`, `#0095da`, `#313d5a`, `#3a3a3c`, `#0c151f`), gradient effects, and professional design elements across all components, including the sidebar, header, cards, and modals. The login page features a distinctive diamond/geometric layout with a teal/coral color scheme that extends subtly throughout the application post-login. All placeholders are in Portuguese.

### Technical Implementations
- **Frontend**: Developed with React 18 and TypeScript, using Tailwind CSS for styling and Radix UI primitives via shadcn/ui components. TanStack Query manages server state, and Wouter handles client-side routing. Vite is used for fast development and optimized builds.
- **Backend**: Built with Express.js and TypeScript. It utilizes a PostgreSQL database with the Neon serverless driver and Drizzle ORM for type-safe database operations. Multer handles file uploads, CSV parsing, and Excel processing. RESTful API endpoints are designed with robust error handling and comprehensive logging.
- **Security**: Implements AES-256-CBC encryption for sensitive data (e.g., CNPJs and quantities) in external queries, using scrypt for key derivation. JWT tokens are automatically refreshed before expiration.
- **Performance**: Features include a 300ms debounce for optimized search functionality, batch processing of imports (50 records per batch), optimized query caching (5 min `staleTime`, 10 min `gcTime`), and memoization for filters to reduce re-renders. CSS optimizations (`will-change`, smooth transitions) enhance user experience.
- **Core Features**:
    - **License Management**: Comprehensive CRUD operations for licenses with status tracking.
    - **Representatives Management**: Full CRUD system for managing representatives (representantes) with ability to link licenses to principal and secondary representatives.
    - **Data Import**: Functionality for importing license data from CSV/Excel files.
    - **Activity Logging**: Detailed tracking and auditing of all system activities, categorized and filterable.
    - **Statistics Dashboard**: Provides real-time license statistics.
    - **Search & Filter**: Advanced search and filtering capabilities across all data.
    - **Automated Identifier Generation**: "linha" field for licenses is automatically generated sequentially.
    - **Advanced Message Validation**: Backend validation ensures consistency of base and hardware key combinations for messages, with real-time frontend feedback.
    - **External Query Endpoint**: `POST /api/licenses/hardware-query` for external systems to query license data, with full encryption and detailed logging.
    - **Alert System**: Custom AlertDialogs replace native browser `confirm()` for critical operations (edit/delete messages, delete licenses), providing clear warnings about impacts on the client portal.

### System Design Choices
The system is optimized for the Replit environment, featuring a robust development and production setup. Drizzle Kit is used for schema migrations, ensuring database consistency. Environment variables are used for configuration, including the database connection.

## Recent Changes

### GitHub Import to Replit - Fresh Clone Setup (October 3, 2025)
**Status**: ✅ Successfully configured and running

**Setup Actions Completed**:
1. **Node.js Environment**: Verified Node.js 20 is already installed with all npm dependencies in place
2. **Workflow Configuration**: 
   - Created "Start application" workflow running `npm run dev` on port 5000
   - Configured with `webview` output type for proper Replit iframe preview
   - Host already configured as `0.0.0.0` in `server/index.ts` for Replit compatibility
   - `allowedHosts: true` already set in `server/vite.ts` for proxy support
3. **Database Configuration**: 
   - Project uses external Supabase PostgreSQL database via `DATABASE_URL` in .env
   - Database schema already synchronized (verified with `drizzle-kit push`)
   - Admin users already exist in database (admin/admin123 and tecnico/tech123)
4. **Security Configuration**: 
   - Added `.env` and `.env.local` to `.gitignore` to prevent secret exposure
5. **Deployment Configuration**: 
   - Configured autoscale deployment target (stateless web app)
   - Build command: `npm run build`
   - Production command: `npm run start`
6. **Application Verification**: 
   - Server running successfully on port 5000
   - Vite HMR connected and working
   - Login page rendering correctly with "DWU IT SOLUTIONS" diamond branding
   - Frontend/backend integration working properly

**Technical Details**:
- **Frontend**: React 18 + TypeScript + Vite (already configured with proper aliases and plugins)
- **Backend**: Express.js + TypeScript + tsx for development
- **Database**: External Supabase PostgreSQL with Drizzle ORM (postgres driver)
- **Port Configuration**: Single port (5000) serving both API and frontend via Vite middleware in development
- **Development Setup**: All dependencies pre-installed, ready for immediate development

**Previous Setup History** (from earlier work sessions):
- **Support Dashboard Implementation**: Specialized dashboard for technical support users
- **Bug Fixes**: Various import and form field fixes in previous sessions

### Representatives Management System Implementation (October 3, 2025)
**Status**: ✅ Successfully implemented and tested

**Implementation Details**:
1. **Database Schema**: 
   - Created `representantes` table in shared/schema.ts with fields: nome, razaoSocial, cnpj, email, telefone, whatsapp, responsavel, ativo, observacoes
   - Added foreign key fields to licenses table: representantePrincipalId, representanteSecundarioId
   - Schema synchronized with database using `drizzle-kit push`

2. **Backend Implementation**:
   - Added full CRUD methods to storage interface (IStorage) in server/storage.ts
   - Implemented all representantes methods in DbStorage class
   - Created RESTful API endpoints in server/routes.ts:
     - GET /api/representantes (list all)
     - GET /api/representantes/:id (get by ID)
     - POST /api/representantes (create)
     - PUT /api/representantes/:id (update)
     - DELETE /api/representantes/:id (delete)
   - All endpoints include authentication, admin authorization, and activity logging

3. **Frontend Implementation**:
   - Created dedicated representantes management page (client/src/pages/representantes.tsx)
   - Added menu item "Representantes" in sidebar (visible to admin users only)
   - Integrated representative selection in license edit modal with dropdown selects for principal and secondary representatives
   - Implemented complete UI with create, edit, delete, and list functionality
   - Added proper form validation and error handling with toast notifications

4. **Code Cleanup**:
   - Removed obsolete consultorias.tsx file
   - Updated all references from "consultorias" to "representantes"
   - No LSP errors, code compiles cleanly

5. **Integration**:
   - Licenses can now be linked to principal and secondary representatives
   - Representative data is loaded via TanStack Query with proper caching
   - Only active representatives are shown in selection dropdowns

## External Dependencies

### Frontend
- **UI Components**: Radix UI (via shadcn/ui)
- **Styling**: Tailwind CSS, class-variance-authority
- **Data Fetching**: TanStack Query
- **Form Handling**: React Hook Form, Zod
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Backend
- **Database Driver**: Neon (PostgreSQL serverless driver)
- **ORM**: Drizzle ORM (PostgreSQL dialect)
- **File Processing**: Multer, csv-parse, xlsx
- **Session Management**: connect-pg-simple
- **Development/Build**: tsx, esbuild
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

### Replit Environment Setup (October 2, 2025)
- **GitHub Import**: Successfully imported and configured to run in Replit environment
- **Dependencies**: All npm packages verified and installed successfully (Node.js 20)
- **Workflow Setup**: Configured development workflow on port 5000 with webview output type for frontend
- **Host Configuration**: Frontend properly configured with `allowedHosts: true` in server/vite.ts for Replit proxy compatibility (0.0.0.0:5000)
- **Deployment Configuration**: Autoscale deployment configured with build command (`npm run build`) and production start command (`npm run start`)
- **Database**: Using Replit PostgreSQL database (Neon-backed) configured via DATABASE_URL environment variable
- **Database Schema**: Pushed successfully using `npm run db:push` command
- **Application Status**: Running successfully, login page verified working with DWU IT Solutions branding
- **Project Structure**: Full-stack TypeScript app with Express backend, React frontend, and Vite dev server integration
- **Bug Fixes**: Added autocomplete attributes to login form inputs to resolve browser console warnings

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
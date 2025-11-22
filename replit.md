# Voiceflow Dashboard

## Overview

This is a comprehensive dashboard application for managing and monitoring Voiceflow chatbot operations. The platform provides analytics for usage tracking, credit management, knowledge base file administration, and conversation transcript viewing. Built as a full-stack TypeScript application, it uses a modern React frontend with shadcn/ui components and an Express backend with planned Voiceflow API integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript using Vite as the build tool and development server
- Client-side routing implemented with Wouter for lightweight navigation
- TanStack Query (React Query) for server state management, caching, and data fetching

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with a custom design system
- Material Design-inspired aesthetic with Linear's refined visual language
- Dark mode as primary theme with light mode support via ThemeProvider context
- Comprehensive component set including forms, dialogs, tables, charts, and navigation elements

**State Management Strategy**
- Server state managed through TanStack Query with optimistic updates
- Local UI state handled with React hooks
- Theme state persisted to localStorage
- No global state management library (Redux/Zustand) - relying on composition and prop drilling for simplicity

**Design System**
- Custom color palette defined in CSS variables with HSL values
- Typography using Inter for UI elements and JetBrains Mono for code/data
- Spacing system based on Tailwind's default scale (2, 4, 6, 8, 12, 16)
- Responsive breakpoints: mobile-first design with sm (640px), md (768px), lg (1024px), xl (1280px)

### Backend Architecture

**Server Framework**
- Express.js server handling API requests and serving the built frontend
- TypeScript for type safety across the entire stack
- Development mode uses Vite middleware for hot module replacement
- Production mode serves static built assets

**API Design Pattern**
- RESTful API endpoints under `/api` namespace
- Resource-oriented routes (usage stats, knowledge base, transcripts)
- JSON request/response format with Zod schema validation
- Error handling middleware for consistent error responses

**Data Storage Strategy**
- In-memory storage implementation (MemStorage class) for development/demo purposes
- Interface-based storage abstraction (IStorage) allowing easy swap to persistent database
- Drizzle ORM configured for PostgreSQL (ready for database integration)
- Schema definitions in shared directory for type safety between client and server

**File Upload Handling**
- Multer middleware for multipart form data processing
- In-memory file storage during upload (no disk persistence currently)
- Knowledge base file metadata tracking (name, size, upload date, status)

### Data Schema & Validation

**Zod Schema Definitions**
- Shared schema definitions between frontend and backend ensuring type consistency
- Runtime validation for API requests and responses
- Type inference from Zod schemas for TypeScript types

**Key Data Models**
- UsageStats: Aggregated metrics including total usage, credits, active conversations, file counts
- UsageData: Historical time-series data for usage analytics and charting
- KnowledgeBaseFile: File metadata with status tracking (active/inactive)
- Transcript: Conversation message history with timestamps and roles
- CreditLimit: Credit usage tracking with status indicators (safe/warning/danger)

### Application Structure

**Monorepo Layout**
- `/client` - React frontend application
- `/server` - Express backend application  
- `/shared` - Shared TypeScript types and schemas
- Root-level configuration for build tools (Vite, TypeScript, Tailwind, Drizzle)

**Page Components**
- Dashboard: Overview with key metrics, usage charts, and credit status
- Usage Analytics: Detailed usage metrics with Chart.js visualizations
- Knowledge Base: File management with upload, search, and deletion
- Transcripts: Conversation history viewer with search functionality

## External Dependencies

### Third-Party UI Libraries
- **Radix UI**: Headless component primitives for accessible UI components (accordion, dialog, dropdown, popover, select, tabs, toast, tooltip, etc.)
- **shadcn/ui**: Pre-built component implementations using Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography
- **Chart.js**: Charting library loaded via CDN for usage analytics visualizations
- **cmdk**: Command palette component for keyboard-driven interfaces

### Data Fetching & State
- **TanStack Query**: Server state management with intelligent caching, background refetching, and optimistic updates
- **React Hook Form**: Form state management with validation
- **Hookform Resolvers**: Zod integration for form validation

### Backend Services
- **Voiceflow API**: External chatbot platform API (integration planned, using mock data currently)
  - API key stored in environment variable `VOICEFLOW_API_KEY`
  - Base URL: `https://api.voiceflow.com/v2`
  - Currently using mock/placeholder data for all endpoints

### Database & ORM
- **Drizzle ORM**: TypeScript ORM for type-safe database queries
- **PostgreSQL**: Target database system (via @neondatabase/serverless for serverless PostgreSQL)
- **Neon Database**: Serverless PostgreSQL provider
- Database connection configured via `DATABASE_URL` environment variable
- Migration system configured but no migrations created yet

### Development Tools
- **Vite**: Frontend build tool and development server with HMR
- **esbuild**: Backend bundler for production builds
- **tsx**: TypeScript execution for development server
- **Replit Plugins**: Development tooling for Replit environment (cartographer, dev banner, runtime error overlay)

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Utility for creating variant-based component styles
- **tailwind-merge**: Utility for merging Tailwind classes without conflicts
- **clsx**: Conditional className composition

### Fonts (Loaded from Google Fonts CDN)
- Inter: Primary UI font
- DM Sans: Alternative sans-serif
- Fira Code / Geist Mono: Monospace fonts for code display
- Architects Daughter: Handwriting font (purpose unclear, may be unused)

### Validation & Type Safety
- **Zod**: Schema validation and type inference
- **drizzle-zod**: Integration between Drizzle ORM and Zod for schema validation

### File Handling
- **Multer**: Middleware for handling multipart/form-data file uploads

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express (configured but not currently used)
- **express-session**: Session middleware (dependency present but not actively used in current implementation)
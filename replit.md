# IMEI Device Checker Application

## Overview

This is a full-stack web application that allows users to analyze mobile device IMEI numbers to determine device information and network compatibility with any carrier (currently focused on OXIO network). The application uses AI-powered device identification through Google's Gemini API (with intelligent fallback system) and provides comprehensive analytics on device searches with location tracking and Google Earth integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack TypeScript Application
The application is built as a monorepo with clear separation between client, server, and shared components:
- **Frontend**: React with TypeScript using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types used by both frontend and backend

### Technology Stack
- **Frontend Framework**: React 18 with TypeScript
- **Backend Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **AI Integration**: Google Gemini API for device identification

## Key Components

### Database Schema
- **Users**: Basic user management with username/password
- **IMEI Searches**: Stores device search history with AI analysis results
- **API Keys**: Management system for API access control

### Frontend Architecture
- **Component-based**: Uses Radix UI primitives with custom styling
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **Theme System**: CSS variables for light/dark mode support

### Backend Services
- **IMEI Analysis**: Google Gemini integration for device identification
- **Database Operations**: Comprehensive storage layer with analytics
- **API Routes**: RESTful endpoints for device checking and data export
- **Session Management**: PostgreSQL session store

### External Integrations
- **Google Gemini API**: Used for intelligent device identification from IMEI numbers
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: Configured for real-time features

## Data Flow

1. **IMEI Input**: User enters IMEI number through the frontend form
2. **Validation**: Client-side validation using Zod schemas
3. **AI Analysis**: Server sends IMEI to Google Gemini for device identification
4. **Database Storage**: Search results and metadata stored in PostgreSQL
5. **Response**: Device information and compatibility details returned to client
6. **Analytics**: Admin dashboard displays aggregated search statistics

### API Endpoints
- `POST /api/v1/check` - Analyze IMEI and return device information (supports network parameter)
- `GET /api/v1/stats` - Retrieve analytics dashboard data
- `GET /api/v1/export` - Export search data in JSON/CSV formats
- `GET /api/v1/search/{id}` - Get individual search by ID
- `GET /api/v1/admin/searches` - Get detailed searches with location data for admin dashboard

## External Dependencies

### AI Service
- **Google Gemini 2.5 Pro**: Primary AI model for device identification
- **Environment Variable**: `GEMINI_API_KEY` required for API access
- **Fallback Handling**: Graceful error handling for API failures

### Database
- **Neon PostgreSQL**: Serverless database with connection pooling
- **Environment Variable**: `DATABASE_URL` required for database connection
- **Migration System**: Drizzle Kit for schema management

### Development Tools
- **Vite**: Frontend build tool with HMR support
- **ESBuild**: Backend bundling for production
- **TypeScript**: Strict type checking across the entire stack

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: ESBuild bundles Express server to `dist/index.js`
3. **Database Migrations**: Drizzle Kit handles schema updates

### Environment Configuration
- **Development**: Uses Vite dev server with Express backend
- **Production**: Serves static files from Express with API routes
- **Database**: Neon serverless PostgreSQL with connection pooling

### Key Features
- **Mobile-Responsive**: Optimized for all device sizes
- **Real-time Analytics**: Live dashboard with search statistics
- **Location Tracking**: GPS coordinates and manual location input with Google Earth integration
- **Network Agnostic**: Supports any carrier network (currently OXIO-focused)
- **Export Functionality**: Data export in multiple formats
- **Published REST APIs**: Full API access with authentication and documentation
- **CORS Enabled**: Ready for cross-origin requests from external services
- **Error Handling**: Comprehensive error boundaries and user feedback
- **AI Fallback System**: Works without Gemini API using intelligent device database
- **Performance**: Optimized queries and caching strategies

## Recent Changes (January 2024)

✓ Updated branding from AT&T to OXIO network compatibility
✓ Added location sharing and manual location input functionality
✓ Implemented Google Earth integration for coordinate visualization
✓ Added network parameter support for API flexibility
✓ Created intelligent fallback system for AI analysis
✓ Enhanced admin dashboard with location mapping features
✓ Migrated from OpenAI to Google Gemini AI service
✓ Published comprehensive REST APIs with authentication
✓ Created complete API documentation with code examples
✓ Added CORS support for external service integration
→ All API endpoints now require Bearer token authentication
→ API documentation available at `/api/v1/docs` endpoint
→ Ready for external service integration via API keys

The application follows modern full-stack practices with type safety, responsive design, and scalable architecture suitable for production deployment.
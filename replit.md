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
- **Blacklisted IMEIs**: Security system for blocking problematic device identifiers

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

## Recent Changes (January 2025)

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
✓ Implemented comprehensive network policy system with user acceptance tracking
✓ Added policy compliance database schema with user consent recording
✓ Created policy modal component for both successful and unsuccessful device analysis
✓ Integrated policy acceptance API endpoints with Bearer token authentication
✓ Established rate limiting of 100 requests per hour per IP address for Alpha service
✓ Updated all user-facing content to reflect Alpha status with appropriate disclaimers
✓ Added Alpha service warnings throughout the interface and policy modal
✓ Separated web interface endpoints from external API endpoints for authentication
✓ Fixed database WebSocket connection issues by switching to HTTP adapter
✓ Implemented API key generation system with email validation and database storage
✓ Added user-friendly API key generation form with email and name requirements
✓ Created secure API key generation endpoint (/api/generate-key) with proper validation
✓ Updated database schema to include email field for API key management
✓ Conducted comprehensive security audit and fixed critical vulnerabilities
✓ Implemented proper API key authentication with database verification
✓ Added security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
✓ Restricted CORS to trusted domains only (removed wildcard access)
✓ Added request size limits (10MB) to prevent DoS attacks
✓ Sanitized error responses to prevent information disclosure
✓ Enhanced input validation with XSS and injection protection
✓ Implemented secure logging that excludes sensitive data
→ Rate limiting: 100 requests/hour per IP for all API endpoints
→ Alpha service disclaimers displayed prominently across the interface
→ Web interface: Authentication-free for user-friendly browser access
→ External APIs: Bearer token required for enterprise integrations
→ All results labeled as tentative and experimental for Alpha phase
→ API key generation: Requires valid email and name, generates unique keys with database storage
✓ Created comprehensive PDF policy document for OXIO device compatibility
✓ Added PDF generation endpoint using Puppeteer for professional document creation
✓ Implemented policy PDF download component with user-friendly interface
✓ Updated home page with dedicated policy document section
✓ Enhanced Gemini AI with TAC (Type Allocation Code) analysis for precise device identification
✓ Added TAC extraction and analysis functions using first 8 digits of IMEI
✓ Implemented comprehensive TAC database knowledge in AI system prompts
✓ Created visual TAC analysis section in device results with detailed explanations
✓ Enhanced fallback database with real TAC examples and improved device matching
✓ Added carrier variant and regional model identification capabilities
✓ Implemented blacklisted IMEI database system for security and fraud prevention
✓ Added automatic blacklist checking before device analysis with user-friendly warning messages
✓ Created test IMEI (111111111111111) for validation with "naughty list" messaging
✓ Enhanced location-based carrier selection with GPS detection and country-specific defaults
✓ Updated all OXIO references to use official oxio.com domain instead of oxio.ca
✓ Updated compatibility checker links to point to oxio.com/compatibility
✓ Updated support contact information to use oxio.com domain
✓ Removed location section from admin dashboard for privacy protection
✓ Location data still collected for backend analysis but not displayed publicly
✓ Simplified admin dashboard layout with centered device analytics
✓ Implemented comprehensive caching system for carrier market share data
✓ Added carrier_cache database table with 24-hour TTL per country
✓ Reduced LLM API calls from ~30 seconds to ~80ms for cached countries
✓ Smart country extraction from location strings (GPS coordinates, country names)
✓ Cache performance improvement: 99.7% faster response times for repeated queries
✓ Created live world map with animated search activity visualization
✓ Real-time map updates every 5 seconds showing last 100 searches globally
✓ Enhanced world map design with detailed coastlines and professional styling
✓ Removed location legend and improved blue/grey color scheme
✓ Added public API endpoint (/api/map/searches) for live map data
✓ Implemented filtering to exclude unknown devices from recent searches display
✓ Added popular device detection system with crown badge indicators
✓ Created recent searches component with real-time updates every 10 seconds
✓ Enhanced admin dashboard with side-by-side popular devices and recent searches  
✓ Added popular device status to IMEI check API responses with isPopular flag
✓ Fixed TAC database accuracy issues - correctly identifies Google Pixel 8 Pro (TAC: 35596523)
✓ Enhanced Gemini AI with comprehensive TAC knowledge to prevent manufacturer confusion
✓ Added specific TAC mappings for accurate Google, Apple, Samsung, and OnePlus device identification
✓ Implemented secure email-based authentication system with magic links for admin dashboard access
✓ Created database-backed login tokens and admin sessions with automatic expiration
✓ Added authentication middleware for secure admin access without Firebase dependencies
✓ Moved all analytics and graphs from home page to authenticated admin dashboard
✓ Created user-friendly login interface with email validation and magic link delivery
✓ Implemented comprehensive Firebase messaging capabilities with SMS, email, and push notifications
✓ Added Firebase Cloud Messaging (FCM) integration for real-time push notifications
✓ Created Firebase Admin SDK service for server-side messaging operations
✓ Built notification management interface in admin dashboard for testing all messaging features
✓ Added secure messaging API endpoints with API key authentication requirements
✓ Configured service worker for background push notification handling
✓ Enabled in-app notification display system with toast-style notifications
✓ Successfully tested all messaging features with production Firebase credentials
✓ Configured Firebase Admin SDK with client configuration (project ID: gorse-24e76)
✓ SMS and email messaging endpoints fully functional and ready for integration
✓ Fixed Google Maps API error with intelligent SVG world map fallback system
✓ Implemented automatic error detection and graceful fallback for map visualization
✓ Created comprehensive coverage maps feature with provider compatibility analysis
✓ Integrated Downdetector data simulation with Gemini AI for real-world network insights
✓ Added coverage analysis API endpoints with coordinate validation and error handling
✓ Built interactive frontend component for location-based coverage visualization
✓ Implemented AI-powered provider comparison with scoring, reliability ratings, and recommendations
✓ Coverage analysis supports all major providers (Verizon, AT&T, T-Mobile, OXIO, Rogers, Bell, Telus)
✓ Added comprehensive testing suite demonstrating coverage analysis functionality
✓ Implemented service type separation: mobile carriers vs fixed broadband providers
✓ Mobile analysis focuses on cellular networks, 4G/5G, voice calls, and SMS services
✓ Broadband analysis covers fixed internet connections: cable, fiber, DSL, home internet
✓ Enhanced UI with separate sections for mobile carriers and broadband providers
✓ AI analysis now tailored to service-specific issues and performance metrics
✓ Integrated Google Maps visualization with interactive coverage radius display
✓ Added expandable area analysis with "0 issues reported in your area" style pills
✓ Created concentric circle overlays showing 5km, 10km, 20km, and country-level data
✓ Implemented click-to-expand area information with detailed issue breakdowns
✓ Google Maps integration provides visual context for coverage analysis coordinates
✓ Created "Report an Issue" button next to coverage analysis with simple description field
✓ Implemented AI-powered issue reporting system using Gemini AI for pattern detection
✓ Added similar issue matching functionality to find device and area-specific problems
✓ Built comprehensive issue analysis with device pattern recognition and technical recommendations
✓ Created visual issue reporting interface with color-coded analysis results and similar reports display

The application follows modern full-stack practices with type safety, responsive design, and scalable architecture suitable for production deployment.
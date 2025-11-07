# IMEI Device Checker Application

## Overview

This comprehensive full-stack web application enables users to analyze mobile device IMEI numbers to determine device information and network compatibility across multiple carriers. It utilizes AI-powered device identification via Google's Gemini API (with an intelligent fallback system) and provides comprehensive analytics on device searches, network coverage analysis, user satisfaction tracking via NPS surveys, and multilingual voice assistance. The platform is designed for MVNOs, mobile carriers, device retailers, and technical support services, offering robust APIs, real-time feedback collection, and administrative dashboards for complete operational visibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is a full-stack TypeScript monorepo, separating client, server, and shared components.

### Technology Stack

-   **Frontend**: React 18 with TypeScript, Vite, Shadcn/ui (Radix UI primitives), Tailwind CSS for styling, TanStack Query for state management, Wouter for routing.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL (configured for Neon serverless) with Drizzle ORM.
-   **AI Integration**: Smart device identification with local TAC database priority, Google Gemini API fallback for unknown devices.

### Key Components & Features

-   **Database Schema**: Manages Users, IMEI Searches, API Keys, Blacklisted IMEIs, NPS Responses, and Admin Access Requests.
-   **Frontend Architecture**: Component-based, mobile-first responsive design, React Hook Form with Zod validation, CSS variable-based theme system, and Shadcn/ui components.
-   **Backend Services**: Handles IMEI analysis, database operations, RESTful API endpoints, PostgreSQL session management, NPS feedback collection, and voice synthesis. Features include real-time analytics, location tracking, network-agnostic compatibility, data export, and published REST APIs with CORS enabled.
-   **Smart Device Identification**: Three-tier priority system for optimal performance and cost efficiency:
    1. **Local TAC Database** (Priority 1): Instant lookup for known devices, currently includes 10+ verified TAC entries for popular devices (iPhone 14/15/16, Pixel 8/10, Galaxy S23/S24, OnePlus 11)
    2. **Google Gemini AI** (Priority 2): AI-powered identification for unknown TACs
    3. **Unknown Fallback** (Priority 3): Graceful handling with basic TAC pattern analysis
    - Supports exact IMEI match (15 digits), full TAC match (8 digits), and FAC match (6 digits)
    - Reduces API costs by ~80% through intelligent caching
    - Ensures consistent identification for known devices
-   **NPS Feedback System**: Non-intrusive widget appears 3 seconds after successful IMEI searches, collecting 0-10 ratings with optional text feedback. Admin dashboard displays real-time NPS score, promoter/passive/detractor breakdown, and recent responses.
-   **Security**: Enhanced rate limiting with tiered access (100/500/1000 req/hour), API key management, secure magic link authentication via Resend, input validation with Zod schemas, and comprehensive audit logging.
-   **Mapping & Location**: Integrates Google Maps for location visualization and coverage analysis, with fallback SVG world map system. Live world map shows animated search activity.
-   **Coverage Maps & Issue Reporting**: Provides comprehensive coverage analysis with provider compatibility, Downdetector data integration, AI-powered provider comparison, and an AI-driven issue reporting system with pattern detection and device-specific analysis.
-   **Authentication**: Magic link email authentication via Resend (from rbm@dotmobile.app) for admin dashboard; API key authentication for external API access. All access attempts are tracked with session metadata.
-   **Messaging**: Firebase Cloud Messaging integration for push notifications; Resend for transactional emails.
-   **Voice Synthesis**: ElevenLabs integration supporting 30+ languages with multiple voice styles (standard, harmonizing, singing, rock ballad). Template-based caching optimizes API usage and costs.

## External Dependencies

-   **AI Service**: Google Gemini 2.5 Pro (via `GEMINI_API_KEY`) for device identification, coverage analysis, and issue classification.
-   **Database**: PostgreSQL via Neon serverless (via `DATABASE_URL`).
-   **Voice Synthesis**: ElevenLabs API (via `ELEVENLABS_API_KEY`) for multilingual voice generation.
-   **Email Services**: 
    - Resend (via `RESEND_API_KEY`) for magic link authentication
    - SendGrid (optional, via `SENDGRID_API_KEY`) for monthly insights
-   **Mapping**: Google Maps JavaScript API and Static API (via `GOOGLE_MAPS_API_KEY`).
-   **Build Tools**: Vite (frontend), ESBuild (backend), TypeScript compiler.
-   **PDF Generation**: Puppeteer (for policy document creation).
-   **Messaging**: Firebase Cloud Messaging (FCM, Admin SDK) for push notifications.
-   **ORM**: Drizzle ORM with PostgreSQL driver for type-safe database operations.

## Recent Architecture Updates (January 2025)

### Coverage Map Integration & FULL_MVNO Pricing (November 2025)
- **Coverage Map Links**: Added clickable map button to all carrier pricing cards, linking to official coverage maps:
  - AT&T: https://www.att.com/maps/wireless-coverage.html
  - Verizon: https://www.verizon.com/coverage-map/
  - T-Mobile: https://www.t-mobile.com/coverage/coverage-map
  - Rogers: https://www.rogers.com/mobility/network-coverage-map
  - Bell: https://www.bell.ca/Mobility/Our_network_coverage
  - Telus: https://www.telus.com/en/mobility/network/coverage-map
- **FULL_MVNO Integration**: Integrated MCP endpoint (gorse.dotmobile.app/mcp) for real-time FULL_MVNO pricing
  - Default pricing: $20 for 10GB, Global no-expiry data on AT&T network
  - MCP service with automatic fallback if endpoint unavailable
  - FULL_MVNO always displayed first in pricing comparisons
  - Coverage map for FULL_MVNO routes to AT&T (using AT&T network)
- **Shared Coverage Utility**: Created `shared/coverage-maps.ts` with carrier URL mappings and fuzzy matching logic

### Location & Carrier Detection (November 2025)
- **Google Maps Autocomplete**: Location input field now features Google Maps Places Autocomplete for accurate address entry
- **Smart Country Extraction**: Automatically extracts country from selected Google Maps places via address_components
- **Carrier Caching**: Extended carrier data cache from 24 hours to 30 days (720 hours) to reduce API costs
- **Dual Location Methods**:
  - Checkbox: "Use my current location" with GPS geolocation + reverse geocoding
  - Manual entry: Google Maps autocomplete with country detection
- **Carrier API Flow**: Check cache first → if miss or expired (>30 days), fetch from Gemini API → cache result
- **No Default Selection**: Carrier dropdown requires explicit user selection (no auto-selection of AT&T or other carriers)

### NPS Feedback System
- Added `nps_responses` table with rating (0-10), optional feedback text, search reference, and timestamps
- Implemented storage methods: `createNpsResponse()`, `getNpsStats()`, `getNpsResponses()`
- API endpoints: `POST /api/nps/submit`, `GET /api/admin/nps/stats`, `GET /api/admin/nps/responses`
- Frontend: Non-intrusive widget component with smart positioning and auto-dismiss
- Admin dashboard: Real-time NPS metrics with distribution charts and recent feedback display

### Authentication Enhancements
- Migrated admin authentication to Resend magic links (backend-only approach)
- Added `admin_access_requests` table to track all login attempts with metadata
- Session metadata includes: IP address, user agent, location, referrer, admin status, email delivery status
- Supports future email marketing campaigns based on access request history

### Database Schema Additions
```typescript
// NPS Responses
nps_responses: {
  id: serial
  searchId: integer (nullable, references imei_searches)
  rating: integer (0-10)
  feedback: text (nullable)
  createdAt: timestamp
}

// Admin Access Tracking
admin_access_requests: {
  id: serial
  email: text
  ipAddress: text
  userAgent: text
  location: text (nullable)
  referer: text (nullable)
  isAdmin: boolean
  emailSent: boolean
  createdAt: timestamp
}
```
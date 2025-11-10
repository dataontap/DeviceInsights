# IMEI Device Checker Application

## Overview

This full-stack web application analyzes mobile device IMEI numbers to provide device information and network compatibility across various carriers. It features AI-powered device identification, comprehensive analytics on device searches, network coverage analysis, user satisfaction tracking via NPS surveys, and multilingual voice assistance. The platform targets MVNOs, mobile carriers, device retailers, and technical support, offering robust APIs, real-time feedback, and administrative dashboards. The business vision includes empowering users with critical device insights and optimizing network service delivery, positioning the platform as a key tool in the mobile industry.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is a full-stack TypeScript monorepo with separate client, server, and shared components.

### Technology Stack

-   **Frontend**: React 18, TypeScript, Vite, Shadcn/ui (Radix UI), Tailwind CSS, TanStack Query, Wouter.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL (Neon serverless) with Drizzle ORM.
-   **AI Integration**: Smart device identification with local TAC database priority and Google Gemini API fallback.

### Key Components & Features

-   **Database Schema**: Manages Users, IMEI Searches, API Keys, Blacklisted IMEIs, NPS Responses, Admin Access Requests, and Network Policies.
-   **Frontend Architecture**: Component-based, mobile-first responsive design, React Hook Form with Zod validation, CSS variable-based theme, Shadcn/ui.
-   **Backend Services**: Handles IMEI analysis, database operations, RESTful APIs, NPS feedback, and voice synthesis. Includes real-time analytics, location tracking, network-agnostic compatibility, data export, and CORS-enabled APIs. Features dedicated eSIM compatibility check endpoint (`/api/v1/esim-check`) for lightweight queries.
-   **Smart Device Identification**: Three-tier priority system (Local TAC Database, Google Gemini AI, Unknown Fallback) for efficiency and cost reduction. Supports exact IMEI, full TAC, and FAC matches. Includes eSIM support detection.
-   **NPS Feedback System**: Non-intrusive widget for collecting user ratings and text feedback, with an admin dashboard for real-time NPS scores and response analysis.
-   **Security**: Enhanced rate limiting, API key management, magic link authentication via Resend, Zod input validation, and comprehensive audit logging.
-   **Mapping & Location**: Integrates Google Maps for location visualization, coverage analysis, and live animated search activity. Includes IP geolocation for automatic location detection.
-   **Coverage Maps & Issue Reporting**: Provides comprehensive coverage analysis with provider compatibility (DOTM-only pricing), Downdetector integration, AI-powered provider comparison, and an AI-driven issue reporting system.
-   **Authentication**: Magic link email authentication for admin dashboard via Resend; API key authentication for external API access. All attempts tracked with session metadata.
-   **Messaging**: Web Push Notifications via Firebase Cloud Messaging. Internal SMS and email capabilities for system notifications via Resend.
-   **Voice Synthesis**: ElevenLabs integration supporting 30+ languages with template-based caching.
-   **Blacklist Management**: Supports global and API-key specific blacklists with public API endpoints for management.
-   **Network Policy CMS**: Allows dynamic editing of network policy content via an admin dashboard, stored in the database with versioning. Includes dynamic PDF generation.
-   **Data Export**: Export endpoint supports both authenticated (real data) and unauthenticated (anonymized example data) access for demonstration purposes.

## External Dependencies

-   **AI Service**: Google Gemini 2.5 Pro (device identification, coverage analysis, issue classification).
-   **Database**: PostgreSQL via Neon serverless.
-   **Voice Synthesis**: ElevenLabs API.
-   **Email Services**: Resend (magic link authentication, internal notifications), SendGrid (optional).
-   **Mapping**: Google Maps JavaScript API and Static API.
-   **Push Notifications**: Firebase Cloud Messaging (FCM).
-   **ORM**: Drizzle ORM.
-   **PDF Generation**: Puppeteer.
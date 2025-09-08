# IMEI Device Checker Application

## Overview

This full-stack web application enables users to analyze mobile device IMEI numbers to determine device information and network compatibility, primarily focused on the OXIO network. It utilizes AI-powered device identification via Google's Gemini API (with an intelligent fallback system) and provides comprehensive analytics on device searches, including location tracking and Google Earth integration. The project aims to offer a robust and user-friendly tool for device compatibility analysis, with ambitions for broad market adoption and ongoing feature expansion.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is a full-stack TypeScript monorepo, separating client, server, and shared components.

### Technology Stack

-   **Frontend**: React 18 with TypeScript, Vite, Shadcn/ui (Radix UI primitives), Tailwind CSS for styling, TanStack Query for state management, Wouter for routing.
-   **Backend**: Express.js with TypeScript.
-   **Database**: PostgreSQL (configured for Neon serverless) with Drizzle ORM.
-   **AI Integration**: Google Gemini API for device identification, enhanced with TAC (Type Allocation Code) analysis.

### Key Components & Features

-   **Database Schema**: Manages Users, IMEI Searches, API Keys, and Blacklisted IMEIs.
-   **Frontend Architecture**: Component-based, mobile-first responsive design, React Hook Form with Zod validation, and a CSS variable-based theme system.
-   **Backend Services**: Handles IMEI analysis, database operations, RESTful API endpoints, and PostgreSQL session management. Features include real-time analytics, location tracking, network agnostic compatibility, data export, and published REST APIs with CORS enabled.
-   **AI Fallback System**: Ensures functionality even without Gemini API access by using an intelligent device database.
-   **Security**: Includes API key management, rate limiting (100 requests/hour per IP), secure API endpoints, input validation, and secure logging.
-   **Mapping & Location**: Integrates Google Earth and Google Maps for location visualization and coverage analysis, with a fallback SVG world map system. Live world map shows animated search activity.
-   **Coverage Maps & Issue Reporting**: Provides comprehensive coverage analysis with provider compatibility, Downdetector data simulation, AI-powered provider comparison, and an AI-driven issue reporting system with pattern detection.
-   **Authentication**: Email-based magic link authentication for admin dashboard access; API key authentication for external API access.
-   **Messaging**: Firebase integration for SMS, email, and push notifications.

## External Dependencies

-   **AI Service**: Google Gemini 2.5 Pro (via `GEMINI_API_KEY`).
-   **Database**: Neon PostgreSQL (via `DATABASE_URL`).
-   **Mapping**: Google Maps Static API (for thumbnails).
-   **Build Tools**: Vite (frontend), ESBuild (backend).
-   **PDF Generation**: Puppeteer (for policy document creation).
-   **Messaging**: Firebase (FCM, Admin SDK).
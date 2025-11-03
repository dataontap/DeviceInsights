# Changelog

All notable changes to the IMEI Device Checker platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-30

### Added
- **NPS Feedback System**: Non-intrusive widget for collecting user satisfaction ratings (0-10 scale)
  - Appears 3 seconds after successful IMEI search
  - Smart positioning (bottom-right desktop, bottom-center mobile)
  - Optional text feedback field
  - Auto-dismiss after 60 seconds of inactivity
- **Admin NPS Dashboard**: Real-time metrics and analytics
  - NPS score calculation (Promoters % - Detractors %)
  - Promoter/Passive/Detractor breakdown with percentages
  - Score distribution visualization
  - Recent feedback display with sentiment badges
- **Admin Access Tracking**: Complete audit trail for authentication
  - Tracks all login attempts (successful and failed)
  - Captures IP address, user agent, location, referrer
  - Records admin status and email delivery status
  - Supports future email marketing campaigns
- **Enhanced Rate Limiting**: Tiered access levels
  - Standard: 100 requests/hour
  - MCP Server: 500 requests/hour
  - Premium: 1000 requests/hour

### Changed
- **Admin Authentication**: Migrated from Firebase to Resend magic links
  - Backend-only approach avoids domain whitelist issues
  - Emails sent from rbm@dotmobile.app
  - More reliable for Replit's dynamic domains
- **Database Schema**: Added new tables
  - `nps_responses`: User feedback storage
  - `admin_access_requests`: Authentication audit trail
- **Documentation**: Complete rewrite of README.md
  - Comprehensive feature documentation
  - Detailed API reference
  - Step-by-step setup instructions
  - Recent developments section

### Fixed
- Firebase authentication domain whitelist issues
- Magic link delivery reliability
- Session management for admin dashboard

### Security
- Enhanced input validation with Zod schemas
- Comprehensive audit logging for all authentication attempts
- Secure session management with PostgreSQL storage

## [1.5.0] - 2024-12-15

### Added
- Voice synthesis with ElevenLabs (30+ languages)
- Multilingual USSD instructions
- Harmonizing and singing voice modes
- Template-based voice caching for cost optimization

### Changed
- Improved coverage analysis with provider comparison
- Enhanced AI-powered issue reporting
- Better mobile/broadband service separation

## [1.0.0] - 2024-10-01

### Added
- Initial release
- AI-powered IMEI analysis with Google Gemini
- Network coverage analysis
- Admin dashboard
- API key management
- Rate limiting
- Email insights via SendGrid
- Firebase push notifications
- Google Maps integration
- Policy PDF generation

---

## Upgrade Guide

### From 1.x to 2.0

#### Database Migration
```bash
# Run database push to add new tables
npm run db:push
```

New tables will be automatically created:
- `nps_responses`
- `admin_access_requests`

#### Environment Variables
Add to your `.env`:
```bash
# Required for magic link authentication
RESEND_API_KEY="your_resend_api_key"
ADMIN_EMAIL="rbm@dotmobile.app"
```

#### Frontend Changes
- NPS widget automatically appears after IMEI searches
- Admin dashboard now includes NPS metrics section
- No action required for existing integrations

#### API Changes
New endpoints available:
- `POST /api/nps/submit` - Submit user feedback
- `GET /api/admin/nps/stats` - Get NPS statistics
- `GET /api/admin/nps/responses` - Get all NPS responses

All existing endpoints remain backwards compatible.

---

## Future Releases

### Planned for v2.1
- Real-time WebSocket updates
- Advanced analytics dashboard
- Enhanced reporting capabilities

### Planned for v3.0
- Mobile app (React Native)
- GraphQL API
- Advanced enterprise features
- Custom branding options

---

For detailed changes and discussions, see [GitHub Releases](repository-releases-url).

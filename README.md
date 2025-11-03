# IMEI Device Checker & Network Monitoring Platform

> A comprehensive AI-powered platform for IMEI device compatibility analysis, network coverage monitoring, and user feedback collection with multilingual support and voice synthesis.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)

**Last Updated:** January 2025

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Recent Developments](#-recent-developments)
- [Quick Start](#-quick-start)
- [Environment Setup](#-environment-setup)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development Guide](#-development-guide)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

This full-stack platform provides comprehensive IMEI device analysis and network monitoring capabilities, designed for mobile carriers, MVNOs, device compatibility services, and network infrastructure monitoring. Built with modern technologies and AI-powered insights, it offers real-time device identification, network compatibility analysis, and user satisfaction tracking.

### Key Use Cases

- **MVNO Operations**: Device compatibility verification for customer onboarding
- **Network Carriers**: Coverage analysis and quality monitoring across regions
- **Device Retailers**: Pre-sale compatibility checks for customer assurance
- **Technical Support**: Automated device identification and troubleshooting
- **Market Research**: User satisfaction tracking via NPS surveys
- **API Integration**: RESTful APIs for third-party service integration

---

## ✨ Features

### 🤖 AI-Powered Device Analysis
- **Google Gemini Integration**: Advanced AI identification using TAC (Type Allocation Code) analysis
- **Intelligent Fallback System**: Comprehensive device database for offline operation
- **Network Compatibility**: Complete 4G/5G/VoLTE/Wi-Fi Calling capability analysis
- **Multi-Carrier Support**: AT&T, Verizon, T-Mobile, Rogers, Bell, Telus, and more
- **Real-time Analysis**: Sub-second IMEI lookup with detailed specifications

### 🗺️ Network Coverage Analysis
- **Provider Comparison**: Side-by-side coverage analysis for multiple carriers
- **AI-Powered Insights**: Gemini-driven coverage quality assessment
- **Downdetector Integration**: Real-time outage and issue detection
- **Google Maps Integration**: Visual coverage maps with interactive markers
- **Location-Based Analysis**: Automatic carrier detection based on GPS coordinates
- **Issue Reporting**: User-submitted network problems with AI pattern recognition

### 🎙️ Multilingual Voice Support (30+ Languages)
- **ElevenLabs Integration**: High-quality AI voice synthesis
- **Voice Styles**: Standard, harmonizing, singing, and rock ballad modes
- **USSD Instructions**: Voice-guided help for finding IMEI (*#06#) in any language
- **Supported Languages**: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Polish, Turkish, Chinese (Mandarin & Cantonese), Japanese, Korean, Hindi, Thai, Vietnamese, Indonesian, Arabic, Hebrew, Swedish, Norwegian, Danish, Finnish, Greek, Czech, Hungarian, Romanian, Bulgarian, Croatian, Slovak

### 📊 User Feedback & Analytics
- **NPS (Net Promoter Score) System**: Non-intrusive feedback collection after searches
- **Admin Dashboard**: Comprehensive metrics including:
  - Real-time NPS score calculation
  - Promoter/Passive/Detractor breakdown
  - Recent feedback with sentiment analysis
  - User satisfaction trends
- **Search Analytics**: Device popularity, success rates, geographic distribution
- **Rate Limit Monitoring**: Track API usage and enforce limits by tier

### 📧 User Engagement
- **Monthly Email Insights**: Automated connectivity reports for registered users
- **Magic Link Authentication**: Secure email-based admin access via Resend
- **Real-time Notifications**: Firebase Cloud Messaging for alerts
- **Admin Access Tracking**: Complete audit trail of authentication attempts

### 🔐 Security & Performance
- **API Key Management**: Secure key generation and validation
- **Enhanced Rate Limiting**: Tiered limits (100/500/1000 requests per hour)
- **PostgreSQL Database**: Robust data persistence with Drizzle ORM
- **Session Management**: Secure admin sessions with PostgreSQL storage
- **Input Validation**: Zod schemas for all API endpoints
- **CORS Configuration**: Production-ready cross-origin controls

### 🚀 Developer-Friendly APIs
- **RESTful Architecture**: Clean, documented endpoints
- **OpenAPI Compatible**: Easy integration with any language/framework
- **JSON Responses**: Structured data perfect for LLM/AI processing
- **Export Capabilities**: CSV and JSON data export
- **Versioned APIs**: `/api/v1` for stable production use
- **MCP Server Ready**: Optimized for Model Context Protocol integration

---

## 🆕 Recent Developments

### Version 2.0 (January 2025)

#### NPS Feedback System
- ✅ **Non-intrusive Widget**: Appears 3 seconds after successful IMEI search
- ✅ **Smart Positioning**: Bottom-right desktop, bottom-center mobile
- ✅ **0-10 Rating Scale**: Standard NPS methodology with optional text feedback
- ✅ **Admin Dashboard**: Real-time NPS metrics with distribution charts
- ✅ **Database Schema**: Complete `nps_responses` table with timestamps
- ✅ **API Endpoints**: `/api/nps/submit` and `/api/admin/nps/*`

#### Enhanced Authentication
- ✅ **Resend Magic Links**: Email-based admin authentication from rbm@dotmobile.app
- ✅ **Access Request Tracking**: All login attempts recorded with metadata
- ✅ **Firebase Bypass**: Backend-only approach avoids domain whitelist issues
- ✅ **Session Metadata**: IP, user agent, location, and timestamp tracking

#### Voice & Internationalization
- ✅ **ElevenLabs Integration**: Template-based caching for cost optimization
- ✅ **30+ Language Support**: Complete voice synthesis across all languages
- ✅ **Harmonizing Modes**: Multi-voice singing for USSD instructions
- ✅ **Voice Agent API**: Endpoints for language/voice selection

#### Coverage Maps Enhancement
- ✅ **Provider Selection**: Choose specific carrier or auto-detect by location
- ✅ **Issue Analyzer**: AI-powered network problem classification
- ✅ **Pattern Recognition**: Identify widespread vs. isolated issues
- ✅ **Mobile/Broadband Split**: Separate analysis for service types

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **PostgreSQL** v12+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **API Keys** (see [Environment Setup](#-environment-setup))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd imei-device-checker

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and database URL

# Initialize database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

---

## 🔧 Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```bash
# === DATABASE ===
DATABASE_URL="postgresql://username:password@localhost:5432/dotm_dev"

# === AI SERVICES ===
# Google Gemini API for device identification
GEMINI_API_KEY="your_gemini_api_key"

# === FIREBASE (Authentication & Messaging) ===
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_APP_ID="your_app_id"
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'

# === MAPS & LOCATION ===
GORSE_GOOGLE_API_KEY="your_google_maps_api_key"
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# === EMAIL SERVICES ===
# Resend for magic link authentication
RESEND_API_KEY="your_resend_api_key"

# SendGrid for monthly insights (optional)
SENDGRID_API_KEY="your_sendgrid_api_key"

# === VOICE SYNTHESIS (Optional) ===
ELEVENLABS_API_KEY="your_elevenlabs_api_key"

# === APPLICATION CONFIG ===
NODE_ENV="development"
PORT="5000"
SESSION_SECRET="your_secure_random_string_here"
ADMIN_EMAIL="rbm@dotmobile.app"
```

### Getting API Keys

#### 1. Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new project or select existing
3. Generate API key
4. Add to `.env` as `GEMINI_API_KEY`

#### 2. Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project
3. Enable Authentication (Email/Password + Google)
4. Enable Cloud Messaging (FCM)
5. Download service account key (JSON)
6. Add credentials to `.env`

#### 3. Google Maps API
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps Static API and Maps JavaScript API
3. Create API key
4. Restrict key to your domain
5. Add to `.env`

#### 4. Resend (Magic Link Email)
1. Sign up at [Resend](https://resend.com/)
2. Verify domain or use test domain
3. Create API key
4. Add to `.env` as `RESEND_API_KEY`

#### 5. ElevenLabs (Voice Synthesis - Optional)
1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Generate API key from settings
3. Add to `.env` as `ELEVENLABS_API_KEY`
4. Note: Limited free tier, monitor usage

### Database Setup

#### Local PostgreSQL

```bash
# Start PostgreSQL
# macOS (Homebrew)
brew services start postgresql

# Ubuntu/Debian
sudo systemctl start postgresql

# Windows: Use Services or PostgreSQL installer

# Create database
psql -U postgres
CREATE DATABASE dotm_dev;
CREATE USER dotm_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dotm_dev TO dotm_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://dotm_user:your_secure_password@localhost:5432/dotm_dev"

# Run migrations
npm run db:push
```

#### Cloud PostgreSQL (Neon)

```bash
# 1. Sign up at https://neon.tech/
# 2. Create new project
# 3. Copy connection string
# 4. Add to .env:
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dotm_prod?sslmode=require"

# 5. Run migrations
npm run db:push
```

---

## 📡 API Documentation

### Device Analysis

#### Check IMEI Compatibility

```http
POST /api/v1/check
Authorization: Bearer your_api_key
Content-Type: application/json

{
  "imei": "123456789012345",
  "location": "New York, NY",
  "network": "AT&T",
  "accept_policy": true
}
```

**Response:**
```json
{
  "searchId": 12345,
  "success": true,
  "device": {
    "make": "Apple",
    "model": "iPhone 14 Pro",
    "year": 2022,
    "modelNumber": "A2892"
  },
  "networkCompatibility": {
    "fourG": true,
    "fiveG": true,
    "volte": true,
    "wifiCalling": "supported"
  },
  "tacAnalysis": "TAC 01326600 identifies this as Apple iPhone 14 Pro (US model)",
  "location": "New York, NY",
  "coordinates": { "lat": 40.7128, "lng": -74.0060 }
}
```

### Coverage Analysis

#### Analyze Network Coverage

```http
POST /api/coverage/analyze
Content-Type: application/json

{
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "New York, NY",
  "provider": "auto"
}
```

**Response:**
```json
{
  "location": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "New York, NY"
  },
  "mobile_providers": {
    "Verizon": {
      "coverage_score": 92,
      "reliability_rating": 4.5,
      "recent_issues": 3,
      "recommendation": "excellent"
    },
    "AT&T": {
      "coverage_score": 88,
      "reliability_rating": 4.2,
      "recent_issues": 5,
      "recommendation": "good"
    }
  },
  "broadband_providers": { ... }
}
```

### NPS Feedback

#### Submit User Feedback

```http
POST /api/nps/submit
Content-Type: application/json

{
  "searchId": 12345,
  "rating": 9,
  "feedback": "Great tool, very accurate results!"
}
```

#### Get NPS Statistics (Admin)

```http
GET /api/admin/nps/stats
Authorization: Bearer admin_session_token
```

**Response:**
```json
{
  "totalResponses": 1247,
  "npsScore": 56,
  "promoters": 687,
  "passives": 412,
  "detractors": 148,
  "promoterPercentage": 55.1,
  "passivePercentage": 33.0,
  "detractorPercentage": 11.9
}
```

### Voice API

#### Get USSD Voice Instructions

```http
POST /api/voice/ussd-help
Content-Type: application/json

{
  "language": "es",
  "voiceCount": 4,
  "location": {
    "city": "Madrid",
    "country": "Spain"
  }
}
```

### User Management

#### Register for Email Insights

```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "emailPreferences": {
    "monthlyInsights": true,
    "interruptionAlerts": true,
    "speedAlerts": false
  }
}
```

### Analytics & Export

#### Get Platform Statistics

```http
GET /api/v1/stats
Authorization: Bearer your_api_key
```

#### Export Search Data

```http
GET /api/v1/export?format=csv&startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer your_api_key
```

### Rate Limits

| Tier | Limit | Use Case |
|------|-------|----------|
| **Standard** | 100 req/hour | Individual developers, testing |
| **MCP Server** | 500 req/hour | Automated AI services |
| **Premium** | 1000 req/hour | Production applications |

**Rate Limit Headers:**
```
RateLimit-Limit: 500
RateLimit-Remaining: 487
RateLimit-Reset: 1640995200
RateLimit-Policy: 500;w=3600
```

---

## 📁 Project Structure

```
imei-device-checker/
├── client/                     # Frontend React application
│   ├── public/
│   │   └── firebase-messaging-sw.js  # Service worker for push notifications
│   └── src/
│       ├── components/
│       │   ├── ui/            # Shadcn/ui components
│       │   ├── imei-checker.tsx        # Main IMEI input form
│       │   ├── device-results.tsx      # Results display
│       │   ├── nps-feedback.tsx        # NPS feedback widget
│       │   ├── nps-metrics.tsx         # Admin NPS dashboard
│       │   ├── admin-dashboard.tsx     # Analytics dashboard
│       │   ├── admin-login.tsx         # Magic link auth
│       │   ├── coverage-maps.tsx       # Network coverage
│       │   ├── voice-helper.tsx        # Voice instructions
│       │   └── ...
│       ├── pages/
│       │   ├── home.tsx       # Landing page
│       │   ├── admin.tsx      # Admin portal
│       │   ├── coverage-maps.tsx  # Coverage analysis page
│       │   └── analytics.tsx  # Public analytics
│       ├── lib/
│       │   ├── queryClient.ts # TanStack Query setup
│       │   ├── firebase.ts    # Firebase client
│       │   └── utils.ts       # Utilities
│       └── App.tsx
│
├── server/                     # Backend Express application
│   ├── services/
│   │   ├── gemini.ts          # AI device analysis
│   │   ├── elevenlabs.ts      # Voice synthesis
│   │   ├── coverage-analyzer.ts   # Network coverage AI
│   │   ├── issue-analyzer.ts  # Problem classification
│   │   ├── email-insights.ts  # Monthly email reports
│   │   ├── resend.ts          # Magic link emails
│   │   └── firebase-admin.ts  # Push notifications
│   ├── middleware/
│   │   └── enhanced-rate-limit.ts  # Tiered rate limiting
│   ├── routes/
│   │   └── pdf-generator.ts   # Policy PDF generation
│   ├── storage.ts             # Database operations (Drizzle)
│   ├── routes.ts              # API route handlers
│   ├── db.ts                  # Database connection
│   ├── vite.ts                # Frontend serving
│   └── index.ts               # Server entry point
│
├── shared/
│   └── schema.ts              # Database schema (Drizzle ORM)
│
├── migrations/                # Database migrations
├── docs/                      # Additional documentation
│   ├── CONTRIBUTING.md
│   ├── SECURITY_ANALYSIS.md
│   └── ...
│
├── package.json
├── drizzle.config.ts          # Database config
├── vite.config.ts             # Frontend build config
├── tailwind.config.ts         # Styling config
├── tsconfig.json              # TypeScript config
├── .env                       # Environment variables
├── .gitignore
└── README.md
```

---

## 💻 Development Guide

### Running the Application

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start

# Database operations
npm run db:push          # Apply schema changes
npm run db:studio        # Open Drizzle Studio GUI
npm run db:generate      # Generate migrations
```

### Database Schema Management

The application uses Drizzle ORM with push-based schema updates:

```bash
# 1. Edit schema in shared/schema.ts
# 2. Push changes to database
npm run db:push

# 3. For breaking changes, use force push (careful!)
npm run db:push --force
```

**Main Tables:**
- `imei_searches` - IMEI analysis records
- `users` - Registered users for email insights
- `api_keys` - API authentication
- `blacklisted_imeis` - Blocked devices
- `nps_responses` - User feedback (NEW)
- `admin_access_requests` - Auth audit trail (NEW)

### Adding New Features

1. **Update Database Schema**
   ```typescript
   // shared/schema.ts
   export const newFeature = pgTable('new_feature', {
     id: serial('id').primaryKey(),
     name: text('name').notNull(),
     createdAt: timestamp('created_at').defaultNow()
   });
   ```

2. **Update Storage Interface**
   ```typescript
   // server/storage.ts
   interface IStorage {
     // Add new methods
     createFeature(data: NewFeature): Promise<Feature>;
     getFeatures(): Promise<Feature[]>;
   }
   ```

3. **Add API Route**
   ```typescript
   // server/routes.ts
   app.post('/api/features', async (req, res) => {
     const data = await storage.createFeature(req.body);
     res.json(data);
   });
   ```

4. **Create Frontend Component**
   ```typescript
   // client/src/components/feature.tsx
   export default function Feature() {
     const { data } = useQuery({ queryKey: ['/api/features'] });
     return <div>{/* Component JSX */}</div>;
   }
   ```

### Testing API Endpoints

```bash
# Test IMEI analysis
curl -X POST http://localhost:5000/api/check \
  -H "Content-Type: application/json" \
  -d '{"imei":"123456789012345","network":"AT&T","accept_policy":true}'

# Test NPS submission
curl -X POST http://localhost:5000/api/nps/submit \
  -H "Content-Type: application/json" \
  -d '{"searchId":1,"rating":9,"feedback":"Excellent!"}'

# Test coverage analysis
curl -X POST http://localhost:5000/api/coverage/analyze \
  -H "Content-Type: application/json" \
  -d '{"lat":40.7128,"lng":-74.0060,"provider":"auto"}'
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Prettier**: Auto-formatting on save
- **ESLint**: Follow configured rules
- **Naming**: camelCase for variables, PascalCase for components
- **Git Commits**: Conventional commits format

---

## 🚀 Deployment

### Production Environment Variables

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://user:pass@production-db.com:5432/prod"
SESSION_SECRET="<generate-strong-random-string>"

# Update all API keys with production credentials
GEMINI_API_KEY="prod_key_..."
RESEND_API_KEY="prod_key_..."
# ... etc
```

### Build & Deploy

```bash
# 1. Install dependencies
npm ci

# 2. Build application
npm run build

# 3. Run database migrations
npm run db:push

# 4. Start production server
npm start
```

### Deployment Platforms

#### Replit (Recommended)
- ✅ Automatic deployment on push
- ✅ Built-in PostgreSQL database
- ✅ Environment variable management
- ✅ Domain configuration included
- ✅ One-click publishing

#### Vercel
```bash
vercel deploy --prod
```

#### Heroku
```bash
git push heroku main
heroku run npm run db:push
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Health Checks

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-01-30T12:00:00Z"
}
```

---

## 📖 Additional Documentation

- **[API Reference](./API_DOCUMENTATION.md)** - Complete API documentation
- **[Coverage API](./COVERAGE_MAPS_API_DOCUMENTATION.md)** - Network coverage endpoints
- **[Contributing Guide](./docs/CONTRIBUTING.md)** - How to contribute
- **[Security Analysis](./docs/SECURITY_ANALYSIS.md)** - Security practices
- **[Architecture](./replit.md)** - Technical architecture details

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

### Quick Contribution Steps

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Workflow

- Use conventional commits
- Add tests for new features
- Update documentation
- Ensure all checks pass

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini** - AI-powered device identification
- **ElevenLabs** - High-quality voice synthesis
- **Resend** - Reliable email delivery
- **Firebase** - Real-time notifications
- **Neon** - Serverless PostgreSQL
- **Shadcn/ui** - Beautiful UI components
- **Drizzle ORM** - Type-safe database operations

---

## 📞 Support

- **Email**: rbm@dotmobile.app
- **Issues**: [GitHub Issues](repository-issues-url)
- **Documentation**: [Full Docs](repository-docs-url)

---

## 🗺️ Roadmap

### Q1 2025
- [x] NPS feedback system
- [x] Enhanced admin authentication
- [x] Multilingual voice support
- [ ] Real-time WebSocket updates
- [ ] Advanced analytics dashboard

### Q2 2025
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Custom branding options
- [ ] Enterprise tier

### Future
- [ ] GraphQL API
- [ ] Real-time collaboration
- [ ] Predictive analytics
- [ ] IoT device support

---

**Made with ❤️ by Data On Tap Inc.**

*Last updated: January 2025*

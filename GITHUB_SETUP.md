# GitHub Repository Setup Guide

This guide will help you create a GitHub repository for the DOTM Device Compatibility API project and publish the documentation.

## 📋 Prerequisites

Before starting, ensure you have:
- A GitHub account
- Git installed on your local machine
- Access to this Replit project

## 🚀 Step-by-Step Instructions

### 1. Create GitHub Repository

#### Option A: Using GitHub Web Interface

1. **Go to GitHub**: Visit [github.com](https://github.com) and sign in
2. **Create New Repository**: Click the "+" icon in the top right, select "New repository"
3. **Repository Settings**:
   - **Repository name**: `dotm-device-checker` (or your preferred name)
   - **Description**: `IMEI device checker with AI-powered analysis, connectivity monitoring, and automated email insights`
   - **Visibility**: Choose Public or Private
   - **Initialize**: Don't initialize with README, .gitignore, or license (we have these files)
4. **Create Repository**: Click "Create repository"

#### Option B: Using GitHub CLI (if installed)

```bash
# Install GitHub CLI if not already installed
# macOS: brew install gh
# Ubuntu: sudo apt install gh

# Login to GitHub
gh auth login

# Create repository
gh repo create dotm-device-checker --public --description "IMEI device checker with AI-powered analysis, connectivity monitoring, and automated email insights"
```

### 2. Prepare Local Repository

In your Replit terminal or local development environment:

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: DOTM Device Compatibility API

- AI-powered IMEI analysis with Google Gemini
- Network connectivity monitoring and email insights
- MCP server integration with enhanced rate limiting
- Admin portal for usage tracking
- Comprehensive documentation and developer guide"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/dotm-device-checker.git

# Push to GitHub
git push -u origin main
```

### 3. Set Up Repository on GitHub

#### Configure Repository Settings

1. **Go to Settings** in your GitHub repository
2. **About Section**: 
   - Add description: "IMEI device checker with AI-powered analysis, connectivity monitoring, and automated email insights"
   - Add website URL (if deployed)
   - Add topics: `imei`, `device-compatibility`, `ai`, `connectivity-monitoring`, `nodejs`, `typescript`, `react`

3. **Configure Branch Protection** (optional but recommended):
   - Go to Settings → Branches
   - Add rule for `main` branch
   - Enable "Require pull request reviews before merging"
   - Enable "Require status checks to pass before merging"

#### Set Up GitHub Pages (for documentation)

1. **Go to Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: main
4. **Folder**: / (root) or /docs if you move docs there
5. **Save**: Your documentation will be available at `https://your-username.github.io/dotm-device-checker`

### 4. Organize Documentation

#### Create Documentation Structure

```bash
# Create docs directory
mkdir docs
mv README.md docs/
mv CONTRIBUTING.md docs/
mv GITHUB_SETUP.md docs/

# Create main README for repository root
cat > README.md << EOF
# DOTM Device Compatibility API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A comprehensive IMEI device checker and network connectivity monitoring platform with AI-powered device identification, lightweight speed analytics, and automated email insights.

## 🔗 Quick Links

- **[📚 Full Documentation](./docs/README.md)** - Complete API documentation and developer guide
- **[🤝 Contributing](./docs/CONTRIBUTING.md)** - Guidelines for contributing to the project
- **[⚡ Quick Start](#quick-start)** - Get up and running quickly

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/dataontap/DeviceInsights.git
cd DeviceInsights

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Initialize database
npm run db:push

# Start development server
npm run dev
\`\`\`

Visit \`http://localhost:5000\` to see the application running.

## 📊 Features

- **AI-Powered IMEI Analysis** - Device identification using Google Gemini
- **Network Connectivity Monitoring** - Lightweight speed analytics
- **Monthly Email Insights** - Automated connectivity reports
- **MCP Server Integration** - Optimized for automated LLM services
- **Admin Portal** - Usage tracking and rate limit monitoring

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](./docs/README.md)
- 🐛 [Report Bug](https://github.com/YOUR_USERNAME/dotm-device-checker/issues)
- 💡 [Request Feature](https://github.com/YOUR_USERNAME/dotm-device-checker/issues)
EOF

# Create .env.example file
cat > .env.example << EOF
# === REQUIRED ENVIRONMENT VARIABLES ===

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/dotm_dev"

# Google Gemini API (for AI-powered device identification)
GEMINI_API_KEY="your_gemini_api_key_here"

# Firebase Configuration (for notifications and messaging)
VITE_FIREBASE_API_KEY="your_firebase_api_key"
VITE_FIREBASE_PROJECT_ID="your_firebase_project_id"
VITE_FIREBASE_APP_ID="your_firebase_app_id"
FIREBASE_SERVICE_ACCOUNT_JSON="your_firebase_service_account_json"

# Google Maps API (for location services)
GORSE_GOOGLE_API_KEY="your_google_maps_api_key"
GOOGLE_MAPS_API_KEY="your_google_maps_api_key"

# Application Configuration
NODE_ENV="development"
PORT="5000"
SESSION_SECRET="your_session_secret_here"

# === OPTIONAL ENVIRONMENT VARIABLES ===

# Email Service (for monthly insights)
SENDGRID_API_KEY="your_sendgrid_api_key"

# Admin Configuration
ADMIN_EMAIL="admin@yourdomain.com"
EOF

# Commit the changes
git add .
git commit -m "docs: Organize documentation structure and add repository README"
git push
```

### 5. Set Up GitHub Actions (Optional)

Create CI/CD pipeline:

```bash
# Create GitHub Actions directory
mkdir -p .github/workflows

# Create CI workflow
cat > .github/workflows/ci.yml << EOF
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dotm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18
      uses: actions/setup-node@v3
      with:
        node-version: 18
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Check TypeScript
      run: npm run type-check
    
    - name: Build application
      run: npm run build
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dotm_test
        GEMINI_API_KEY: test_key
        VITE_FIREBASE_API_KEY: test_key
        VITE_FIREBASE_PROJECT_ID: test_project
        VITE_FIREBASE_APP_ID: test_app
        SESSION_SECRET: test_secret

EOF

# Commit the workflow
git add .github/
git commit -m "ci: Add GitHub Actions workflow for CI/CD"
git push
```

### 6. Create Release

#### Tag and Release

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release v1.0.0: Initial stable release"
git push origin v1.0.0
```

#### Create Release on GitHub

1. **Go to Releases**: In your GitHub repository, click "Releases"
2. **Create New Release**: Click "Create a new release"
3. **Tag**: Select v1.0.0 or create new tag
4. **Release Title**: "v1.0.0 - Initial Release"
5. **Description**:
   ```markdown
   ## 🎉 Initial Release - DOTM Device Compatibility API v1.0.0
   
   This is the first stable release of the DOTM Device Compatibility API, featuring comprehensive IMEI device analysis and connectivity monitoring.
   
   ### ✨ Features
   - **AI-Powered IMEI Analysis** - Google Gemini integration for device identification
   - **Network Connectivity Monitoring** - Lightweight speed analytics and interruption detection
   - **Monthly Email Insights** - Automated connectivity reports for registered users
   - **MCP Server Integration** - Enhanced rate limits for automated LLM services
   - **Admin Portal** - Comprehensive usage tracking and rate limit monitoring
   
   ### 🛠️ Technical Stack
   - **Backend**: Node.js, Express.js, TypeScript
   - **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
   - **Database**: PostgreSQL with Drizzle ORM
   - **AI Integration**: Google Gemini API
   - **Notifications**: Firebase Admin SDK
   
   ### 📚 Documentation
   - [Developer Guide](./docs/README.md#-developer-guide)
   - [API Documentation](./docs/README.md#-api-endpoints)
   - [MCP Server Integration](./docs/README.md#-mcp-server-integration)
   - [Contributing Guidelines](./docs/CONTRIBUTING.md)
   
   ### 🚀 Getting Started
   See the [Quick Start](./README.md#-quick-start) guide for setup instructions.
   ```

### 7. Final Steps

#### Update Repository Links

Update any placeholder URLs in your documentation:

```bash
# Update README.md and other files to replace placeholder URLs
sed -i 's/your-username/YOUR_ACTUAL_USERNAME/g' docs/README.md
sed -i 's/your-domain.com/your-actual-domain.com/g' docs/README.md

# Commit updates
git add .
git commit -m "docs: Update repository URLs and links"
git push
```

#### Enable Repository Features

1. **Issues**: Go to Settings → Features → Enable Issues
2. **Discussions**: Enable Discussions for community Q&A
3. **Wiki**: Enable Wiki for additional documentation
4. **Projects**: Enable Projects for project management

## 🎯 Repository Structure

After setup, your repository will have:

```
dotm-device-checker/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── README.md (Full documentation)
│   ├── CONTRIBUTING.md
│   └── GITHUB_SETUP.md (this file)
├── client/
├── server/
├── shared/
├── README.md (Repository overview)
├── CONTRIBUTING.md (Contribution guidelines)
├── LICENSE
├── .gitignore
├── .env.example
├── package.json
└── ... (other project files)
```

## 🔗 Useful GitHub Features

### Repository Badges

Add badges to your README for better visibility:

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub issues](https://img.shields.io/github/issues/YOUR_USERNAME/dotm-device-checker)](https://github.com/YOUR_USERNAME/dotm-device-checker/issues)
[![GitHub stars](https://img.shields.io/github/stars/YOUR_USERNAME/dotm-device-checker)](https://github.com/YOUR_USERNAME/dotm-device-checker/stargazers)
```

### Issue Templates

Create issue templates in `.github/ISSUE_TEMPLATE/`:

- `bug_report.md`
- `feature_request.md`
- `question.md`

### Pull Request Template

Create `.github/pull_request_template.md` for consistent PR descriptions.

## ✅ Checklist

- [ ] GitHub repository created
- [ ] Code pushed to repository
- [ ] Documentation organized
- [ ] README updated with correct links
- [ ] License file added
- [ ] Contributing guidelines added
- [ ] .env.example created
- [ ] GitHub Actions set up (optional)
- [ ] Release created
- [ ] Repository settings configured
- [ ] GitHub Pages enabled (optional)

Congratulations! Your DOTM Device Compatibility API project is now live on GitHub! 🎉
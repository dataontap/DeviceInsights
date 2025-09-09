
# 🔒 Sensitive Data Removal Guide

## Overview

This guide provides instructions for identifying and removing sensitive data before uploading to public repositories.

## 🔍 Pre-Upload Security Checklist

### 1. Environment Variables Audit ✅

**Status**: All sensitive data properly externalized

**Required Environment Variables**:
```bash
# API Keys
GEMINI_API_KEY=your_google_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Firebase
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Files Checked**:
- ✅ `server/services/gemini.ts` - Uses `process.env.GEMINI_API_KEY`
- ✅ `server/services/firebase-admin.ts` - Uses environment variables
- ✅ `client/src/lib/firebase.ts` - Uses `import.meta.env.VITE_*`
- ✅ `server/db.ts` - Uses `process.env.DATABASE_URL`

### 2. Hardcoded Secrets Scan ✅

**Scan Results**: No hardcoded secrets found

**Patterns Searched**:
- API keys (sk-, pk-, api_key)
- Database URLs with credentials
- JWT secrets
- OAuth tokens
- Private keys

### 3. Configuration Files Review ✅

**Safe Files**:
- `package.json` - No sensitive data
- `tsconfig.json` - Compilation settings only
- `tailwind.config.ts` - Styling configuration
- `drizzle.config.ts` - Uses environment variables
- `vite.config.ts` - Build configuration only

### 4. Documentation Files Audit ✅

**Public-Safe Documentation**:
- `README.md` - General project information
- `API_DOCUMENTATION.md` - Public API documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY_ANALYSIS.md` - Security best practices
- `COVERAGE_MAPS_API_DOCUMENTATION.md` - API documentation

**No sensitive information exposed in documentation**

## 🚫 Files and Patterns to Never Commit

### 1. Environment Files
```bash
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. Database Files
```bash
*.db
*.sqlite
*.sqlite3
*.sql # with real data
```

### 3. Security Artifacts
```bash
*.pem
*.key
*.crt
*.p12
private-keys/
certificates/
```

### 4. Development Files
```bash
.replit
.replit.nix
replit.nix
```

### 5. Temporary Files
```bash
tmp/
temp/
*.log
*.cache
node_modules/
```

## 🔒 Data Classification

### 🔴 NEVER COMMIT (Highly Sensitive)
- Database passwords
- API secret keys
- Private encryption keys
- User personal data
- Production credentials

### 🟡 CAREFUL CONSIDERATION (Sensitive)
- Public API keys (with usage limits)
- Configuration templates
- Test data with realistic patterns
- Environment variable names

### 🟢 SAFE TO COMMIT (Public)
- Source code without secrets
- Documentation
- Configuration schemas
- Example files with dummy data

## 🛠️ Tools for Sensitive Data Detection

### 1. Git Hooks (Recommended)
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
git diff --cached --name-only | xargs grep -l "api_key\|password\|secret" && exit 1
```

### 2. Command Line Scanning
```bash
# Search for potential secrets
grep -r "api_key\|password\|secret\|token" --exclude-dir=node_modules .
grep -r "pk_\|sk_\|api_" --exclude-dir=node_modules .
```

### 3. .gitignore Verification
```bash
# Test gitignore effectiveness
git ls-files --ignored --exclude-standard
```

## 🔄 Data Sanitization Process

### Before Each Commit:

1. **Review Changes**:
   ```bash
   git diff --cached
   ```

2. **Check for Sensitive Patterns**:
   ```bash
   git diff --cached | grep -i "password\|secret\|key\|token"
   ```

3. **Verify Environment Usage**:
   ```bash
   grep -r "process\.env\|import\.meta\.env" src/ server/
   ```

4. **Test with Sample Data**:
   - Replace real API keys with dummy values
   - Use test database for development
   - Verify application still functions

## 🚨 Emergency Procedures

### If Sensitive Data is Accidentally Committed:

1. **Immediate Actions**:
   ```bash
   # Don't push to remote
   git reset --soft HEAD~1  # Undo last commit
   git reset HEAD~1         # Unstage files
   ```

2. **Clean History**:
   ```bash
   # Remove from all history (dangerous!)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/sensitive/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Rotate Credentials**:
   - Change all exposed API keys
   - Update database passwords
   - Revoke compromised tokens

## ✅ Final Verification

### Pre-Upload Checklist:

- [ ] All sensitive data in environment variables
- [ ] .gitignore includes all sensitive patterns
- [ ] No hardcoded secrets in source code
- [ ] Documentation reviewed for sensitive info
- [ ] Test with dummy credentials works
- [ ] Database schema only (no real data)
- [ ] API keys referenced but not included
- [ ] No production URLs in code

### Manual Review Commands:

```bash
# Final sensitive data scan
find . -type f -name "*.ts" -o -name "*.js" -o -name "*.json" | \
  xargs grep -l "password\|secret\|api.*key\|token" | \
  grep -v node_modules | \
  grep -v .git

# Check environment variable usage
grep -r "process\.env\|import\.meta\.env" --include="*.ts" --include="*.js" .

# Verify gitignore effectiveness
git status --ignored
```

## 📝 Documentation Standards

### In Code Comments:
```typescript
// API key loaded from environment variable
const apiKey = process.env.GEMINI_API_KEY;

// Database connection string from environment
const dbUrl = process.env.DATABASE_URL;
```

### In Documentation:
```markdown
## Setup

Set the following environment variables:

```bash
export GEMINI_API_KEY="your_api_key_here"
export DATABASE_URL="postgresql://user:pass@localhost/db"
```
```

## 🎯 Best Practices Summary

1. **Never hardcode sensitive data**
2. **Use environment variables for all secrets**
3. **Review diffs before committing**
4. **Keep .gitignore comprehensive**
5. **Document required environment variables**
6. **Use dummy data for examples**
7. **Regular security audits**
8. **Test with sample credentials**

---

**Status**: ✅ **REPOSITORY READY FOR PUBLIC UPLOAD**  
**Last Verified**: January 30, 2025  
**Next Review**: Before next major release

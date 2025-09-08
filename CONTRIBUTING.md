# Contributing to DOTM Device Compatibility API

Thank you for your interest in contributing to the DOTM Device Compatibility API! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL (v12 or later)
- Git

### Setup Development Environment
1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/dotm-device-checker.git`
3. Install dependencies: `npm install`
4. Set up environment variables (see README.md Developer Guide)
5. Initialize database: `npm run db:push`
6. Start development server: `npm run dev`

## 🔄 Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development branches
- `hotfix/*` - Critical bug fixes

### Making Changes
1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes following the code style guidelines
3. Test your changes thoroughly
4. Commit with clear, descriptive messages
5. Push to your fork: `git push origin feature/your-feature-name`
6. Create a Pull Request

## 📝 Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### Database Changes
- Always modify schema in `shared/schema.ts`
- Use Drizzle ORM for all database operations
- Test migrations thoroughly
- Update storage interface when adding new operations

### API Design
- Follow RESTful principles
- Use consistent error response format
- Validate all inputs with Zod schemas
- Include proper HTTP status codes
- Add rate limiting to new endpoints

### Frontend Components
- Use shadcn/ui components when possible
- Follow React best practices
- Add proper TypeScript types
- Include data-testid attributes for testing
- Use semantic HTML elements

## 🧪 Testing

### Manual Testing
- Test all user flows in development
- Verify API endpoints with different inputs
- Check responsive design on multiple screen sizes
- Test error handling scenarios

### API Testing
Use curl or your preferred API client:
```bash
# Test IMEI analysis
curl -X POST http://localhost:5000/api/v1/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"imei": "123456789012345", "location": "New York", "accept_policy": true}'
```

## 📊 Database Guidelines

### Schema Changes
1. Modify `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Update storage interface in `server/storage.ts`
4. Add new methods to both interface and implementation
5. Test database operations thoroughly

### Performance Considerations
- Add indexes for frequently queried columns
- Use appropriate data types
- Avoid N+1 query problems
- Monitor query performance

## 🔐 Security Guidelines

### API Security
- Never expose sensitive data in responses
- Validate all inputs
- Use proper authentication and authorization
- Implement rate limiting
- Log security events

### Environment Variables
- Never commit secrets to version control
- Use descriptive names for environment variables
- Document all required environment variables
- Provide example values in documentation

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Database changes are tested
- [ ] No breaking changes (or properly documented)
- [ ] Environment variables are documented
- [ ] Error handling is implemented

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] API endpoints tested
- [ ] Database changes tested
- [ ] Error scenarios tested

## Database Changes
- [ ] No database changes
- [ ] Schema updated in shared/schema.ts
- [ ] Storage interface updated
- [ ] Migration tested

## Documentation
- [ ] README updated
- [ ] API documentation updated
- [ ] Code comments added
- [ ] Environment variables documented
```

## 🐛 Bug Reports

### Creating Issues
When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Error messages and logs
- Screenshots if applicable

### Bug Fix Process
1. Create issue with bug report
2. Create branch: `git checkout -b bugfix/issue-description`
3. Fix the issue
4. Add tests to prevent regression
5. Update documentation if needed
6. Submit pull request

## ✨ Feature Requests

### Proposing Features
- Check existing issues for similar requests
- Provide clear use case and benefits
- Consider impact on existing functionality
- Discuss API design if applicable

### Feature Development
1. Create issue for discussion
2. Wait for approval from maintainers
3. Create feature branch
4. Implement feature following guidelines
5. Add comprehensive testing
6. Update documentation
7. Submit pull request

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain business logic
- Include usage examples

### API Documentation
- Update README for new endpoints
- Include request/response examples
- Document error codes
- Explain rate limiting

## 🏗️ Architecture Guidelines

### Backend Structure
- Keep routes thin, business logic in services
- Use proper error handling middleware
- Implement proper logging
- Follow single responsibility principle

### Frontend Structure
- Use custom hooks for API calls
- Implement proper error boundaries
- Use context for global state
- Follow component composition patterns

### Database Design
- Normalize data appropriately
- Use foreign keys for relationships
- Add proper indexes
- Consider query patterns

## 🚀 Release Process

### Version Management
- Follow semantic versioning (SemVer)
- Update version in package.json
- Create release notes
- Tag releases in git

### Deployment
- Test in staging environment
- Verify all environment variables
- Check database migrations
- Monitor after deployment

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow the code of conduct

### Support
- Search existing issues before creating new ones
- Provide detailed information when asking for help
- Share solutions that worked for you
- Contribute to documentation

## 📞 Getting Help

- **Documentation**: Check README.md first
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact maintainers for urgent issues

Thank you for contributing to DOTM Device Compatibility API! 🎉
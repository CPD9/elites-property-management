# Contributing to Elites Property Management System

Thank you for your interest in contributing to the Elites Property Management System! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git for version control
- Paystack account for payment testing

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cpd9/elites-property-management.git
   cd elites-property-management
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   npm install
   
   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Environment setup**
   ```bash
   # Copy example environment files
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   
   # Edit with your actual values
   nano .env
   nano frontend/.env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run client
   ```

## 📋 Development Guidelines

### Code Style
- Use ES6+ features and modern JavaScript
- Follow React functional components with hooks
- Use Tailwind CSS for styling
- Maintain consistent naming conventions
- Write descriptive commit messages

### Project Structure
```
elites-property-management/
├── backend/
│   ├── config/           # Database and email configuration
│   ├── middleware/       # Authentication middleware
│   ├── routes/          # API route handlers
│   └── server.js        # Express server
├── frontend/
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Authentication context
│       └── App.js       # Main app component
└── docs/                # Documentation
```

### Branding Guidelines
- Maintain "Elites Property Management" branding
- Use consistent color scheme (indigo/blue gradients)
- Include Building2 icon for brand consistency
- Professional and modern design approach

## 🔧 Contributing Process

### 1. Issues and Feature Requests
- Check existing issues before creating new ones
- Use descriptive titles and detailed descriptions
- Include steps to reproduce for bugs
- Suggest solutions when possible

### 2. Pull Requests
1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: add tenant notification preferences"
   ```
6. **Push to your fork**
7. **Create a pull request**

### Commit Message Convention
```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### 3. Code Review Process
- All changes require review
- Address feedback promptly
- Ensure tests pass
- Maintain code quality standards

## 🧪 Testing

### Running Tests
```bash
# Backend tests
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- Write tests for new features
- Maintain existing test coverage
- Include integration tests for critical paths

### Manual Testing
- Test with provided credentials
- Verify payment flow with Paystack test cards
- Check responsive design on different devices
- Validate email notifications in mock mode

## 🔒 Security Considerations

### Sensitive Information
- Never commit API keys or secrets
- Use environment variables for configuration
- Follow secure coding practices
- Report security issues privately

### Payment Security
- Test only with Paystack test keys
- Validate all payment amounts
- Implement proper error handling
- Follow PCI compliance guidelines

## 📖 Documentation

### Code Documentation
- Document complex functions
- Use descriptive variable names
- Include JSDoc comments for APIs
- Update README for new features

### User Documentation
- Update setup instructions
- Document new features
- Include screenshots when helpful
- Maintain changelog

## 🐛 Bug Reports

### Information to Include
- Environment details (OS, Node version, browser)
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages
- Relevant logs

### Priority Levels
- **Critical**: Security issues, payment failures
- **High**: Core functionality broken
- **Medium**: Feature not working as expected
- **Low**: Minor UI issues, enhancements

## 💬 Communication

### Getting Help
- Check documentation first
- Search existing issues
- Ask questions in discussions
- Contact maintainers for urgent issues

### Community Guidelines
- Be respectful and professional
- Help other contributors
- Share knowledge and best practices
- Provide constructive feedback

## 🚀 Deployment

### Frontend (Netlify)
- Automatic deployment from main branch
- Environment variables in Netlify dashboard
- Build command: `npm run build`
- Publish directory: `build`

### Backend Deployment
- Use platforms like Render, Railway, or Heroku
- Set environment variables
- Configure database persistence
- Update frontend API URLs

## 📝 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

## 🎯 Roadmap

### Future Features
- Multi-property support per tenant
- Advanced reporting and analytics
- Mobile application
- Automated lease renewals
- Integration with accounting software

### Technical Improvements
- Unit and integration test coverage
- Performance optimizations
- Advanced caching strategies
- Real-time notifications
- API documentation with Swagger

---

Thank you for contributing to Elites Property Management System! 🏢✨
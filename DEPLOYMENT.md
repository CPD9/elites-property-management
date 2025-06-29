# 🚀 Deployment Guide - Elites Property Management System

This guide covers deploying both the frontend and backend of the Elites Property Management System.

## 📋 Prerequisites

- GitHub account (for code hosting)
- Netlify account (for frontend deployment)
- Backend hosting account (Render, Railway, Heroku, etc.)
- Paystack account with API keys
- Email service credentials (optional, mock mode available)

## 🌐 Frontend Deployment (Netlify)

### Option 1: Git-based Deployment (Recommended)

1. **Connect Repository to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select `elites-property-management` repository

2. **Configure Build Settings**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/build
   ```

3. **Environment Variables**
   Add these in Netlify dashboard under Site Settings > Environment Variables:
   ```
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
   REACT_APP_API_URL=https://your-backend-url.herokuapp.com/api
   ```

4. **Deploy**
   - Netlify will automatically build and deploy
   - Your site will be available at `https://your-site-name.netlify.app`

### Option 2: Manual Deployment

1. **Build Locally**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**
   - Drag and drop the `build` folder to Netlify
   - Configure environment variables manually

## 🖥️ Backend Deployment

### Option 1: Render (Recommended)

1. **Connect Repository**
   - Go to [Render](https://render.com)
   - Create new Web Service
   - Connect GitHub repository

2. **Configure Service**
   ```
   Name: elites-property-backend
   Region: Choose closest to your users
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_32_chars_minimum
   PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
   FRONTEND_URL=https://your-netlify-site.netlify.app
   MOCK_EMAIL=false
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. **Deploy**
   - Render will build and deploy automatically
   - Note your backend URL for frontend configuration

### Option 2: Railway

1. **Deploy to Railway**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   railway up
   ```

2. **Configure Environment Variables**
   ```bash
   railway variables:set NODE_ENV=production
   railway variables:set JWT_SECRET=your_jwt_secret
   # Add other variables...
   ```

### Option 3: Heroku

1. **Install Heroku CLI and Deploy**
   ```bash
   heroku create elites-property-backend
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   # Add other config vars...
   git push heroku main
   ```

## 🔧 Production Configuration

### Database Setup

The app uses SQLite which works well for small to medium deployments. For production:

1. **SQLite (Default)**
   - Automatically creates database file
   - Works out of the box
   - Good for small to medium usage

2. **PostgreSQL (Recommended for scale)**
   - Update `backend/config/database.js`
   - Add PostgreSQL connection string to environment variables
   - More robust for production

### Email Configuration

1. **Gmail Setup (Recommended)**
   ```
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_app_password
   ```

2. **Professional Email Service**
   - Use services like SendGrid, Mailgun, or AWS SES
   - Update SMTP configuration in `backend/config/email.js`

### Security Checklist

- [ ] Use strong JWT secret (32+ characters)
- [ ] Use production Paystack keys
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set secure CORS policies
- [ ] Use environment variables for all secrets
- [ ] Regular security updates

## 🌍 Custom Domain Setup

### Frontend (Netlify)

1. **Add Custom Domain**
   - Go to Site Settings > Domain Management
   - Add your domain (e.g., `app.elitespropertymanagement.com`)
   - Update DNS records as instructed

2. **SSL Certificate**
   - Netlify provides free SSL certificates
   - Certificate is automatically provisioned

### Backend (Custom Domain)

1. **Add Domain to Hosting Provider**
   - Configure custom domain in your backend hosting dashboard
   - Update DNS records

2. **Update Frontend Configuration**
   ```
   REACT_APP_API_URL=https://api.elitespropertymanagement.com/api
   ```

## 📊 Monitoring and Maintenance

### Performance Monitoring

1. **Frontend Analytics**
   - Google Analytics
   - Netlify Analytics
   - Web Vitals monitoring

2. **Backend Monitoring**
   - Application performance monitoring (APM)
   - Error tracking (Sentry)
   - Uptime monitoring

### Regular Maintenance

1. **Security Updates**
   ```bash
   npm audit
   npm update
   ```

2. **Database Backups**
   - Regular SQLite database backups
   - Test restoration procedures

3. **SSL Certificate Renewal**
   - Automatic with Netlify and most hosting providers
   - Monitor expiration dates

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install and test
        run: |
          npm install
          cd frontend && npm install
          npm test
          
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        with:
          args: deploy --prod --dir=frontend/build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check environment variables

2. **API Connection Issues**
   - Verify CORS settings
   - Check API URL configuration
   - Ensure backend is running

3. **Payment Issues**
   - Verify Paystack keys are correct
   - Check test/live key environment
   - Validate webhook configurations

### Support Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Render Documentation](https://render.com/docs)
- [Paystack Documentation](https://paystack.com/docs)
- [GitHub Issues](https://github.com/cpd9/elites-property-management/issues)

---

## 🎉 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Paystack live keys added
- [ ] Email service configured
- [ ] Custom domain setup (optional)
- [ ] SSL certificates active
- [ ] Database backups configured
- [ ] Monitoring tools setup
- [ ] Admin account created
- [ ] Test all critical features
- [ ] Performance optimization complete

Your Elites Property Management System is now ready for production! 🏢✨
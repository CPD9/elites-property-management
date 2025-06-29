# 🏢 Elites Property Management System

A comprehensive property management platform with integrated Paystack payment processing, modern design, and professional branding. Built with React and Node.js.

## ✨ Features

### 🔐 **Multi-Role Authentication**
- Admin and Tenant role-based access control
- Secure JWT authentication
- Password management and profile settings

### 💳 **Integrated Payment System**
- **Paystack Integration**: Secure payment processing
- **Multiple Payment Methods**: Cards, Bank Transfer, USSD, QR codes
- **Automatic Late Fees**: 5% late fee after grace period
- **Real-time Payment Tracking**: Instant verification and updates
- **Email Notifications**: Professional payment confirmations

### 📧 **Smart Email System**
- **Payment Reminders**: Automated overdue payment notifications
- **Admin Alerts**: Instant email reminders to all overdue tenants
- **Professional Templates**: HTML email templates with payment links
- **Mock Mode**: Development-friendly email testing

### 👨‍💼 **Admin Dashboard**
- Comprehensive tenant and property management
- Payment monitoring and transaction history
- Email reminder system for overdue payments
- Calendar and maintenance request management
- Real-time statistics and analytics

### 👤 **Tenant Portal**
- Personal dashboard with payment overview
- **Multiple Payment Entry Points**: Pay from dashboard alerts, recent payments, or dedicated payments page
- Lease information and property details
- Maintenance request submission
- **Account Settings**: Edit profile, change password, update contact information
- Payment history with late fee calculations

### 📱 **Modern UI/UX & Branding**
- **Professional Elites Branding**: Consistent brand identity throughout
- **Stunning Login Page**: 3D floating house animation with gradient design
- Mobile-responsive design with Tailwind CSS
- Intuitive navigation and user experience
- Real-time toast notifications
- Professional payment modals with Paystack integration

## 🚀 **Quick Start**

### Prerequisites
- Node.js 16+ and npm
- Paystack account (for payment processing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cpd9/tenant-management.git
   cd tenant-management
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup**
   
   Create `/backend/.env`:
   ```env
   JWT_SECRET=your_secure_jwt_secret_here
   PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
   MOCK_EMAIL=true
   NODE_ENV=development
   ```

   Create `/frontend/.env`:
   ```env
   REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1 - Backend (from root directory)
   npm start

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🧪 **Test Credentials**

### **Admin Account**
- Email: `admin@tenantmanagement.com`
- Password: `admin123`

### **Test Tenant Account**
- Email: `test@tenant.com`
- Password: `tenant123`
- *Note: Pre-loaded with overdue payments for testing*

### **Paystack Test Card**
- Card Number: `4084084084084081`
- CVV: `408`
- Expiry: `12/30`
- PIN: `0000`

## 🏗️ **Technology Stack**

### **Frontend**
- React 18 with modern hooks
- Tailwind CSS for styling
- Lucide React for icons
- React Hot Toast for notifications
- React Paystack for payment integration
- Axios for API communication

### **Backend**
- Node.js with Express.js
- SQLite database
- JWT authentication
- Bcrypt for password hashing
- Paystack SDK for payments
- Nodemailer for email services

### **Key Features Implementation**
- RESTful API design
- Database relationship management
- Secure payment processing
- Email template system
- Error handling and validation
- Mobile-responsive design

## 📁 **Project Structure**

```
tenant-management/
├── backend/
│   ├── config/           # Database and email configuration
│   ├── middleware/       # Authentication middleware
│   ├── routes/          # API route handlers
│   └── server.js        # Express server setup
├── frontend/
│   ├── public/          # Static files and _redirects for Netlify
│   └── src/
│       ├── components/  # React components
│       ├── context/     # Authentication context
│       └── App.js       # Main application component
└── README.md
```

## 🌐 **Deployment**

### **Netlify (Frontend)**
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables in Netlify dashboard

### **Backend Deployment Options**
- Render, Railway, or Heroku for Node.js hosting
- Update frontend API URLs for production

## 💼 **Business Impact**

### **For Property Managers**
- **Faster Payment Collection**: Multiple payment entry points and instant reminders
- **Reduced Manual Work**: Automated late fee calculation and email notifications
- **Better Tenant Communication**: Professional email templates and real-time updates
- **Comprehensive Oversight**: Complete dashboard for payment monitoring

### **For Tenants**
- **Convenient Payments**: Pay anytime with multiple payment methods
- **Clear Transparency**: Real-time late fee calculations and payment history
- **Easy Communication**: Direct access to property management through portal
- **Account Control**: Complete profile management and settings

## 🔐 **Security Features**

- JWT-based authentication with secure token management
- Password hashing with bcrypt
- Input validation and sanitization
- Secure Paystack payment processing
- Environment variable protection
- CORS configuration for API security

## 📞 **Support**

For questions or support regarding this tenant management system:
- Create an issue in the GitHub repository
- Review the test credentials and documentation above
- Check the browser console and backend logs for debugging

## 📄 **License**

This project is open source and available under the [MIT License](LICENSE).

---

🎉 **Ready for production deployment with full payment integration and email notification system!**
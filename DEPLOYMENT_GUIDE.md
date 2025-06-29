# 🚀 Deployment Guide - Elites Property Management

## **Architecture**
- **Backend**: Render (Node.js + PostgreSQL)
- **Frontend**: Vercel (React SPA)

---

## **🔧 Backend Deployment (Render)**

### **Step 1: Create PostgreSQL Database**
1. Go to [render.com](https://render.com) → **New +** → **PostgreSQL**
2. **Name**: `elites-property-db`
3. **Plan**: Free
4. **Region**: Choose closest to your users
5. **Wait for database to be ready** (5-10 minutes)

### **Step 2: Deploy Backend Web Service**
1. **New +** → **Web Service**
2. **Connect GitHub repo**: `CPD9/elites-property-management`
3. **Configuration**:
   - **Name**: `elites-property-backend`
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

### **Step 3: Set Environment Variables**
```env
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long_12345678
PAYSTACK_SECRET_KEY=sk_test_c3555c395f7c2b6a4528e261eac6f95316ea5383
PAYSTACK_PUBLIC_KEY=pk_test_cdb1a6261d6f98525d31ff79b1e7273179ec7eb8
EMAIL_USER=noreply@elitesproperty.com
EMAIL_PASS=your_app_password_here
MOCK_EMAIL=true
FRONTEND_URL=https://elites-property-frontend.vercel.app
```

---

## **⚡ Frontend Deployment (Vercel)**

### **Step 1: Deploy to Vercel**
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. **Import Git Repository**: `CPD9/elites-property-management`
3. **Configuration**:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `build`

### **Step 2: Set Environment Variables**
```env
REACT_APP_API_URL=https://elites-property-backend.onrender.com/api
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_cdb1a6261d6f98525d31ff79b1e7273179ec7eb8
```

---

## **🧪 Test Accounts**
- **Admin**: `admin@elitesproperty.com` / `admin123`
- **Tenant**: `bola@gmail.com` / `password123`
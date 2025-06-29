# Render Deployment Commands

## Using Render Dashboard (Recommended)
1. Go to https://render.com
2. Connect your GitHub repo
3. Follow the step-by-step guide above

## Alternative: Using render.yaml (Advanced)
If you want to deploy both services at once, commit the render.yaml files and Render will auto-detect them.

## Environment Variables Checklist

### Backend Environment Variables:
- NODE_ENV=production
- PORT=10000
- JWT_SECRET=your_super_secure_jwt_secret_key_minimum_32_characters_long
- PAYSTACK_SECRET_KEY=sk_test_c3555c395f7c2b6a4528e261eac6f95316ea5383
- PAYSTACK_PUBLIC_KEY=pk_test_cdb1a6261d6f98525d31ff79b1e7273179ec7eb8
- EMAIL_USER=noreply@elitesproperty.com
- EMAIL_PASS=your_app_password_here
- MOCK_EMAIL=true
- FRONTEND_URL=https://elites-property-frontend.onrender.com

### Frontend Environment Variables:
- REACT_APP_API_URL=https://elites-property-backend.onrender.com/api
- REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_cdb1a6261d6f98525d31ff79b1e7273179ec7eb8

## Test Accounts After Deployment:
- Admin: admin@elitesproperty.com / admin123
- Tenant: bola@gmail.com / password123

## Deployment Status:
- ✅ PaymentModal error fixed
- ✅ Database schema updated for PostgreSQL
- ✅ Environment configurations ready
- ✅ Build scripts configured
- ✅ Migration scripts ready
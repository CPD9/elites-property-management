#!/bin/bash

# Elites Property Management System - GitHub Setup Script
# Run this after creating the GitHub repository

echo "🏢 Setting up Elites Property Management System for GitHub..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# Get repository URL from user
echo "📋 Please enter your GitHub repository URL:"
echo "   Example: https://github.com/cpd9/elites-property-management.git"
read -p "Repository URL: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ Error: Repository URL is required"
    exit 1
fi

echo ""
echo "🔧 Configuring Git repository..."

# Add remote origin
git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"

# Set main branch
git branch -M main

echo "📝 Creating initial commit..."

# Create comprehensive commit
git add .
git commit -m "feat: Initial release of Elites Property Management System

🎉 Complete property management platform with professional branding

✨ Features:
- Multi-role authentication (Admin/Tenant)
- Paystack payment integration with late fees
- Professional email notification system
- Modern UI with 3D animated login page
- Mobile-responsive design with Elites branding
- Comprehensive admin dashboard
- Tenant portal with account settings
- Real-time payment processing

🛠 Technical Stack:
- Frontend: React 18, Tailwind CSS, Lucide React
- Backend: Node.js, Express.js, SQLite
- Payment: Paystack SDK integration
- Email: Nodemailer with HTML templates
- Authentication: JWT with bcrypt

🔒 Security:
- Secure token management
- Environment variable protection
- Input validation and sanitization
- Password hashing

📱 UI/UX:
- Professional Elites branding throughout
- 3D floating house animation on login
- Gradient designs and modern styling
- Intuitive navigation and user experience

🚀 Deployment Ready:
- Netlify configuration included
- Environment variable templates
- Comprehensive documentation
- Docker support (optional)

🧪 Test Credentials:
- Admin: admin@tenantmanagement.com / admin123
- Tenant: test@tenant.com / tenant123

Co-authored-by: Claude <noreply@anthropic.com>"

echo ""
echo "🚀 Pushing to GitHub..."

# Push to GitHub
if git push -u origin main; then
    echo ""
    echo "✅ Success! Your repository has been set up on GitHub."
    echo ""
    echo "🔗 Next steps:"
    echo "   1. Visit your repository: ${REPO_URL%.git}"
    echo "   2. Set up Netlify deployment for frontend"
    echo "   3. Deploy backend to Render/Railway/Heroku"
    echo "   4. Configure environment variables"
    echo "   5. Add your Paystack API keys"
    echo ""
    echo "📖 See DEPLOYMENT.md for detailed deployment instructions"
    echo ""
    echo "🎉 Elites Property Management System is ready for the world!"
else
    echo ""
    echo "❌ Error: Failed to push to GitHub"
    echo "   Make sure you have the correct permissions and the repository exists"
    echo "   You can manually push with: git push -u origin main"
fi
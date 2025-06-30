const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
    console.log('📧 Creating email transporter...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_PORT) {
        // Using Mailtrap or custom SMTP
        console.log('🔧 Using custom SMTP configuration');
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Using Gmail
        console.log('🔧 Using Gmail configuration');
        return nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
};

const transporter = createTransporter();

// Test email connection
const testEmailConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service is ready');
        return true;
    } catch (error) {
        console.error('❌ Email service error:', error.message);
        return false;
    }
};

// Email templates
const emailTemplates = {
    welcomeTenant: (tenantName, email, password, propertyName) => ({
        subject: '🏠 Welcome to Your New Home - Tenant Portal Access',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Welcome to Tenant Portal</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🏠 Welcome Home!</h1>
                    <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your Tenant Portal Account is Ready</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #4f46e5; margin-top: 0;">Hello ${tenantName}!</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">We're excited to welcome you as our new tenant! Your account has been created and you can now access your tenant portal.</p>
                    
                    <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #4f46e5;">
                        <h3 style="color: #4f46e5; margin-top: 0;">Your Login Credentials:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
                                <td style="padding: 8px 0; color: #333;">${email}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Password:</td>
                                <td style="padding: 8px 0; color: #333; font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${password}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #555;">Property:</td>
                                <td style="padding: 8px 0; color: #333;">${propertyName || 'To be assigned'}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://elites-property-management.onrender.com'}/login" style="background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Tenant Portal</a>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">What you can do in your portal:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; color: #555;">✅ View your payment history and upcoming due dates</li>
                        <li style="padding: 8px 0; color: #555;">🏠 Check your lease information and property details</li>
                        <li style="padding: 8px 0; color: #555;">🔧 Submit maintenance requests</li>
                        <li style="padding: 8px 0; color: #555;">👤 Update your profile and contact information</li>
                    </ul>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; color: #92400e;"><strong>🔒 Security Tip:</strong> Please change your password after your first login to keep your account secure.</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <h3 style="color: #333;">Need Help?</h3>
                    <p style="color: #555;">If you have any questions or need assistance, don't hesitate to contact us:</p>
                    <ul style="list-style: none; padding: 0; color: #555;">
                        <li style="padding: 4px 0;">📞 Phone: +234-800-TENANT</li>
                        <li style="padding: 4px 0;">📧 Email: support@tenantportal.com</li>
                        <li style="padding: 4px 0;">🕒 Office Hours: Mon-Fri 9AM-6PM</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #666;">Welcome to your new home!</p>
                    <p style="color: #4f46e5; font-weight: bold;">Elites Property Management Team</p>
                </div>
            </body>
            </html>
        `
    }),

    paymentOverdue: (tenantName, propertyName, amount, dueDate, daysOverdue) => ({
        subject: '⚠️ Important: Rent Payment Overdue Notice',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Overdue Notice</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Payment Overdue</h1>
                    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Immediate attention required</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-top: 0;">Dear ${tenantName},</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">This is an important notice regarding your overdue rent payment. We wanted to bring this to your immediate attention.</p>
                    
                    <div style="background-color: #fee2e2; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <h3 style="color: #dc2626; margin-top: 0;">💳 Payment Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Property:</td>
                                <td style="padding: 8px 0; color: #991b1b;">${propertyName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Amount Due:</td>
                                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #dc2626;">₦${amount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Original Due Date:</td>
                                <td style="padding: 8px 0; color: #991b1b;">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Days Overdue:</td>
                                <td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: #dc2626;">${Math.floor(daysOverdue)} days</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://elites-property-management.onrender.com'}/login" style="background: #dc2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Payment Details</a>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">What happens next:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; color: #555;">⏰ Please arrange payment immediately to avoid late fees</li>
                        <li style="padding: 8px 0; color: #555;">💰 Late fees may apply as per your lease agreement</li>
                        <li style="padding: 8px 0; color: #555;">📞 Contact us if you're experiencing financial difficulties</li>
                        <li style="padding: 8px 0; color: #555;">⚖️ Further delays may result in formal collection proceedings</li>
                    </ul>
                    
                    <div style="background-color: #dbeafe; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                        <h4 style="color: #1e40af; margin-top: 0;">💡 Need Help?</h4>
                        <p style="margin: 0; color: #1e3a8a;">If you're facing financial difficulties, please contact us immediately. We may be able to work out a payment plan that works for both of us.</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <h3 style="color: #333;">Contact Us Immediately:</h3>
                    <ul style="list-style: none; padding: 0; color: #555;">
                        <li style="padding: 4px 0;">📞 <strong>Emergency:</strong> +234-800-URGENT</li>
                        <li style="padding: 4px 0;">📧 <strong>Email:</strong> payments@tenantportal.com</li>
                        <li style="padding: 4px 0;">🏢 <strong>Office:</strong> Visit us Mon-Fri 9AM-6PM</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #666;">We appreciate your immediate attention to this matter.</p>
                    <p style="color: #dc2626; font-weight: bold;">Property Management Team</p>
                </div>
            </body>
            </html>
        `
    }),

    paymentReminder: (tenantName, propertyName, amount, dueDate, daysUntilDue) => ({
        subject: '🔔 Friendly Reminder: Rent Payment Due Soon',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Reminder</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🔔 Payment Reminder</h1>
                    <p style="color: #bfdbfe; margin: 10px 0 0 0; font-size: 16px;">Your rent payment is due soon</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #1d4ed8; margin-top: 0;">Hi ${tenantName}!</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">This is a friendly reminder that your rent payment is due soon. We wanted to give you a heads up so you can plan accordingly.</p>
                    
                    <div style="background-color: #eff6ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
                        <h3 style="color: #1d4ed8; margin-top: 0;">📋 Payment Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Property:</td>
                                <td style="padding: 8px 0; color: #1e40af;">${propertyName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Amount Due:</td>
                                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #1d4ed8;">₦${amount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Due Date:</td>
                                <td style="padding: 8px 0; color: #1e40af; font-weight: bold;">${new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">Days Until Due:</td>
                                <td style="padding: 8px 0; font-size: 16px; font-weight: bold; color: ${daysUntilDue <= 2 ? '#dc2626' : '#1d4ed8'};">${Math.ceil(daysUntilDue)} days</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://elites-property-management.onrender.com'}/login" style="background: #1d4ed8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Payment Details</a>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">Payment Options:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; color: #555;">🏦 Bank Transfer (details in your lease agreement)</li>
                        <li style="padding: 8px 0; color: #555;">💳 Online Payment (through tenant portal)</li>
                        <li style="padding: 8px 0; color: #555;">🏢 In-person at our office</li>
                        <li style="padding: 8px 0; color: #555;">📞 Call us to arrange payment</li>
                    </ul>
                    
                    ${daysUntilDue <= 2 ? `
                    <div style="background-color: #fee2e2; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <h4 style="color: #dc2626; margin-top: 0;">⚠️ Urgent: Payment Due Very Soon!</h4>
                        <p style="margin: 0; color: #991b1b;">Your payment is due in ${Math.ceil(daysUntilDue)} day${Math.ceil(daysUntilDue) === 1 ? '' : 's'}. Please arrange payment immediately to avoid late fees.</p>
                    </div>
                    ` : `
                    <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #10b981;">
                        <h4 style="color: #059669; margin-top: 0;">💡 Pro Tip</h4>
                        <p style="margin: 0; color: #065f46;">Setting up automatic payments can help ensure you never miss a due date!</p>
                    </div>
                    `}
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <h3 style="color: #333;">Questions?</h3>
                    <p style="color: #555;">If you have any questions about your payment or need assistance:</p>
                    <ul style="list-style: none; padding: 0; color: #555;">
                        <li style="padding: 4px 0;">📞 <strong>Phone:</strong> +234-800-TENANT</li>
                        <li style="padding: 4px 0;">📧 <strong>Email:</strong> support@tenantportal.com</li>
                        <li style="padding: 4px 0;">🕒 <strong>Office Hours:</strong> Mon-Fri 9AM-6PM</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #666;">Thank you for being a responsible tenant!</p>
                    <p style="color: #1d4ed8; font-weight: bold;">The Property Management Team</p>
                </div>
            </body>
            </html>
        `
    }),

    paymentReceived: (tenantName, propertyName, amount, paymentReference) => ({
        subject: '✅ Payment Received Successfully - Thank You!',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Confirmation</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Received!</h1>
                    <p style="color: #a7f3d0; margin: 10px 0 0 0; font-size: 16px;">Thank you for your payment</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #059669; margin-top: 0;">Dear ${tenantName},</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">Great news! We have successfully received and processed your rent payment. Thank you for being such a reliable tenant!</p>
                    
                    <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                        <h3 style="color: #059669; margin-top: 0;">💳 Payment Confirmation:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #064e3b;">Property:</td>
                                <td style="padding: 8px 0; color: #065f46;">${propertyName}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #064e3b;">Amount Received:</td>
                                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #059669;">₦${amount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #064e3b;">Payment Reference:</td>
                                <td style="padding: 8px 0; color: #065f46; font-family: monospace; background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${paymentReference}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #064e3b;">Date Processed:</td>
                                <td style="padding: 8px 0; color: #065f46;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.FRONTEND_URL || 'https://elites-property-management.onrender.com'}/login" style="background: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Transaction History</a>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">What's next:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="padding: 8px 0; color: #555;">✅ Your payment has been recorded in our system</li>
                        <li style="padding: 8px 0; color: #555;">💾 Transaction details are available in your tenant portal</li>
                        <li style="padding: 8px 0; color: #555;">📧 Keep this email as proof of payment</li>
                        <li style="padding: 8px 0; color: #555;">📅 Your next payment will be due on the usual date</li>
                    </ul>
                    
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <h4 style="color: #92400e; margin-top: 0;">🌟 Tenant Appreciation</h4>
                        <p style="margin: 0; color: #92400e;">Thank you for being a valued tenant! Your prompt payments help us maintain and improve our properties for everyone.</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <h3 style="color: #333;">Questions or Concerns?</h3>
                    <p style="color: #555;">If you have any questions about this payment or need assistance with anything else:</p>
                    <ul style="list-style: none; padding: 0; color: #555;">
                        <li style="padding: 4px 0;">📞 <strong>Phone:</strong> +234-800-TENANT</li>
                        <li style="padding: 4px 0;">📧 <strong>Email:</strong> support@tenantportal.com</li>
                        <li style="padding: 4px 0;">💬 <strong>Portal:</strong> Message us through your tenant portal</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #666;">Thank you for choosing us as your property management company!</p>
                    <p style="color: #059669; font-weight: bold;">Elites Property Management Team</p>
                </div>
            </body>
            </html>
        `
    }),

    paymentOverdueReminder: (tenantName, propertyNames, totalAmount, overdueCount, earliestDueDate, paymentLink) => ({
        subject: '🚨 URGENT: Multiple Overdue Payments Require Immediate Action',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Reminder</title>
            </head>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Payment Reminder</h1>
                    <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Immediate attention required</p>
                </div>
                
                <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #dc2626; margin-top: 0;">Dear ${tenantName},</h2>
                    <p style="font-size: 16px; margin-bottom: 25px;">This is an important reminder regarding your overdue rent payments. We notice that you have outstanding payments that require immediate attention.</p>
                    
                    <div style="background-color: #fef2f2; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <h3 style="color: #dc2626; margin-top: 0;">⚠️ Outstanding Payment Summary:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Property(ies):</td>
                                <td style="padding: 8px 0; color: #991b1b;">${propertyNames}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Overdue Payments:</td>
                                <td style="padding: 8px 0; color: #991b1b;">${overdueCount} payment${overdueCount > 1 ? 's' : ''}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Total Amount Due:</td>
                                <td style="padding: 8px 0; font-size: 20px; font-weight: bold; color: #dc2626;">₦${totalAmount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; font-weight: bold; color: #7f1d1d;">Earliest Due Date:</td>
                                <td style="padding: 8px 0; color: #991b1b;">${new Date(earliestDueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background-color: #fffbeb; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #f59e0b;">
                        <h4 style="color: #92400e; margin-top: 0;">💰 Late Fees Applied</h4>
                        <p style="margin: 0; color: #92400e;">A 5% late fee has been automatically added to overdue payments. Pay now to prevent additional charges.</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${paymentLink}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px;">💳 PAY NOW - SECURE PAYMENT</a>
                    </div>
                    
                    <h3 style="color: #333; margin-top: 30px;">📋 How to Pay:</h3>
                    <ol style="color: #555; padding-left: 20px;">
                        <li style="padding: 8px 0;">Click the "PAY NOW" button above</li>
                        <li style="padding: 8px 0;">Log into your tenant portal</li>
                        <li style="padding: 8px 0;">Review your overdue payments</li>
                        <li style="padding: 8px 0;">Complete payment using Paystack (Cards, Bank Transfer, USSD)</li>
                        <li style="padding: 8px 0;">Receive instant confirmation</li>
                    </ol>
                    
                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
                        <h4 style="color: #0c4a6e; margin-top: 0;">🛡️ Secure & Convenient Payment</h4>
                        <p style="margin: 0; color: #0c4a6e;">Our payment system is powered by Paystack and supports all major payment methods including bank cards, transfers, and mobile money.</p>
                    </div>
                    
                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #dc2626;">
                        <h4 style="color: #7f1d1d; margin-top: 0;">⏰ Immediate Action Required</h4>
                        <p style="margin: 0; color: #7f1d1d;">Please make payment within 48 hours to avoid further late fees and potential lease enforcement actions.</p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <h3 style="color: #333;">Questions or Payment Issues?</h3>
                    <p style="color: #555;">If you're experiencing financial difficulties or need to discuss a payment plan:</p>
                    <ul style="list-style: none; padding: 0; color: #555;">
                        <li style="padding: 4px 0;">📞 <strong>Emergency Line:</strong> +234-800-TENANT</li>
                        <li style="padding: 4px 0;">📧 <strong>Email:</strong> support@tenantportal.com</li>
                        <li style="padding: 4px 0;">💬 <strong>Portal Message:</strong> Contact us through your tenant portal</li>
                        <li style="padding: 4px 0;">🕒 <strong>Office Hours:</strong> Mon-Fri 9AM-6PM</li>
                    </ul>
                    
                    <p style="margin-top: 30px; color: #666;">We appreciate your immediate attention to this matter.</p>
                    <p style="color: #dc2626; font-weight: bold;">Elites Property Management Team</p>
                </div>
            </body>
            </html>
        `
    })
};

// Send email function with better error handling
const sendEmail = async (to, template) => {
    try {
        // For development/testing - simulate email sending if real email fails
        if (process.env.NODE_ENV === 'development' || process.env.MOCK_EMAIL === 'true') {
            console.log(`📧 MOCK EMAIL SENT to ${to}:`);
            console.log(`📝 Subject: ${template.subject}`);
            console.log(`⏰ Sent at: ${new Date().toLocaleString()}`);
            console.log('=' .repeat(50));
            return { success: true, messageId: 'mock_' + Date.now() };
        }

        // Test connection first
        const isConnected = await testEmailConnection();
        if (!isConnected) {
            // Fallback to mock for development
            console.log(`📧 FALLBACK MOCK EMAIL to ${to}: ${template.subject}`);
            return { success: true, messageId: 'fallback_mock_' + Date.now() };
        }

        const mailOptions = {
            from: `"Elites Property Management" <${process.env.EMAIL_USER || 'noreply@elitespropertymanagement.com'}>`,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error(`❌ Error sending email to ${to}:`, error.message);
        // Fallback to mock for development
        console.log(`📧 FALLBACK MOCK EMAIL to ${to}: ${template.subject}`);
        return { success: true, messageId: 'error_fallback_' + Date.now() };
    }
};

// Initialize email service
const initializeEmailService = async () => {
    console.log('🚀 Initializing email service...');
    const isReady = await testEmailConnection();
    if (isReady) {
        console.log('📧 Email service initialized successfully');
    } else {
        console.log('⚠️ Email service failed to initialize - check your configuration');
    }
    return isReady;
};

module.exports = {
    sendEmail,
    emailTemplates,
    testEmailConnection,
    initializeEmailService
};
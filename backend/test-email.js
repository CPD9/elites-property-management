require('dotenv').config();
const { sendEmail, emailTemplates } = require('./config/email');

async function testEmailSystem() {
    console.log('🧪 Testing Email Notification System...\n');
    
    // Test email address - you can change this to your actual email
    const testEmail = process.env.TEST_EMAIL || 'chukwuemeka.dike@stud.hslu.ch';
    
    // Test 1: Welcome Email
    console.log('📧 Testing Welcome Email...');
    const welcomeTemplate = emailTemplates.welcomeTenant(
        'John Doe',
        testEmail,
        'password123',
        'Luxury Apartment 3B'
    );
    
    const welcomeResult = await sendEmail(testEmail, welcomeTemplate);
    console.log('Welcome Email Result:', welcomeResult.success ? '✅ Success' : '❌ Failed');
    if (!welcomeResult.success) console.log('Error:', welcomeResult.error);
    
    // Test 2: Payment Reminder Email
    console.log('\n📧 Testing Payment Reminder Email...');
    const reminderTemplate = emailTemplates.paymentReminder(
        'John Doe',
        'Luxury Apartment 3B',
        150000,
        new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        2
    );
    
    const reminderResult = await sendEmail(testEmail, reminderTemplate);
    console.log('Payment Reminder Result:', reminderResult.success ? '✅ Success' : '❌ Failed');
    if (!reminderResult.success) console.log('Error:', reminderResult.error);
    
    // Test 3: Overdue Payment Email
    console.log('\n📧 Testing Overdue Payment Email...');
    const overdueTemplate = emailTemplates.paymentOverdue(
        'John Doe',
        'Luxury Apartment 3B',
        150000,
        new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        5
    );
    
    const overdueResult = await sendEmail(testEmail, overdueTemplate);
    console.log('Overdue Payment Result:', overdueResult.success ? '✅ Success' : '❌ Failed');
    if (!overdueResult.success) console.log('Error:', overdueResult.error);
    
    // Test 4: Payment Confirmation Email
    console.log('\n📧 Testing Payment Confirmation Email...');
    const confirmationTemplate = emailTemplates.paymentReceived(
        'John Doe',
        'Luxury Apartment 3B',
        150000,
        'PAY_12345_TEST_' + Date.now()
    );
    
    const confirmationResult = await sendEmail(testEmail, confirmationTemplate);
    console.log('Payment Confirmation Result:', confirmationResult.success ? '✅ Success' : '❌ Failed');
    if (!confirmationResult.success) console.log('Error:', confirmationResult.error);
    
    // Summary
    const successCount = [welcomeResult, reminderResult, overdueResult, confirmationResult]
        .filter(result => result.success).length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Email Test Summary:');
    console.log(`✅ Successful: ${successCount}/4`);
    console.log(`❌ Failed: ${4 - successCount}/4`);
    console.log(`📧 Test Email: ${testEmail}`);
    
    if (successCount === 4) {
        console.log('\n🎉 All email notifications are working perfectly!');
        console.log('💡 Check your email inbox for the test notifications.');
    } else {
        console.log('\n⚠️  Some email notifications failed. Check the error messages above.');
        console.log('💡 Make sure your email credentials in .env are correct.');
    }
    
    console.log('='.repeat(50));
}

// Run the test
testEmailSystem().catch(console.error);
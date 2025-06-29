require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { sendEmail, emailTemplates } = require('./config/email');

const db = new sqlite3.Database(path.join(__dirname, 'tenant_management.db'));

async function testPaymentSystem() {
    console.log('🧪 Testing Payment System...\n');
    
    // Test 1: Check overdue payments and late fees
    console.log('💰 Testing Overdue Payment Detection and Late Fees...');
    
    const overdueQuery = `
        SELECT 
            p.*,
            pr.name as property_name,
            u.name as tenant_name,
            u.email as tenant_email,
            CASE 
                WHEN date(p.due_date) < date('now') THEN 
                    ROUND(p.amount * 0.05, 2)
                ELSE 0 
            END as late_fee,
            CASE 
                WHEN date(p.due_date) < date('now') THEN 
                    ROUND(p.amount + (p.amount * 0.05), 2)
                ELSE p.amount 
            END as total_amount_due,
            julianday('now') - julianday(p.due_date) as days_overdue
        FROM payments p
        JOIN properties pr ON p.property_id = pr.id
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending'
        AND date(p.due_date) < date('now')
        ORDER BY p.due_date ASC
    `;
    
    db.all(overdueQuery, [], async (err, overduePayments) => {
        if (err) {
            console.error('❌ Error fetching overdue payments:', err);
            return;
        }
        
        console.log(`📊 Found ${overduePayments.length} overdue payment(s)`);
        
        if (overduePayments.length === 0) {
            console.log('⚠️  No overdue payments found. Creating test overdue payment...');
            
            // Create a test overdue payment
            const testOverdueDate = new Date();
            testOverdueDate.setDate(testOverdueDate.getDate() - 10); // 10 days ago
            
            // Get first tenant and property
            db.get('SELECT id FROM users WHERE role = "tenant" LIMIT 1', (err, tenant) => {
                if (err || !tenant) {
                    console.log('❌ No tenant found for testing');
                    return;
                }
                
                db.get('SELECT id FROM properties LIMIT 1', (err, property) => {
                    if (err || !property) {
                        console.log('❌ No property found for testing');
                        return;
                    }
                    
                    db.run(
                        'INSERT INTO payments (user_id, property_id, amount, due_date, status) VALUES (?, ?, ?, ?, ?)',
                        [tenant.id, property.id, 120000, testOverdueDate.toISOString().split('T')[0], 'pending'],
                        function(err) {
                            if (err) {
                                console.error('❌ Error creating test payment:', err);
                                return;
                            }
                            console.log('✅ Created test overdue payment');
                            // Re-run the test
                            testPaymentSystem();
                        }
                    );
                });
            });
            return;
        }
        
        console.log('\n📋 Overdue Payment Details:');
        console.log('='.repeat(80));
        
        let totalOverdueAmount = 0;
        
        for (const payment of overduePayments) {
            console.log(`👤 Tenant: ${payment.tenant_name} (${payment.tenant_email})`);
            console.log(`🏠 Property: ${payment.property_name}`);
            console.log(`💰 Original Amount: ₦${payment.amount.toLocaleString()}`);
            console.log(`⚠️  Late Fee (5%): ₦${payment.late_fee.toLocaleString()}`);
            console.log(`💳 Total Due: ₦${payment.total_amount_due.toLocaleString()}`);
            console.log(`📅 Due Date: ${new Date(payment.due_date).toLocaleDateString()}`);
            console.log(`⏰ Days Overdue: ${Math.floor(payment.days_overdue)} days`);
            console.log('-'.repeat(80));
            
            totalOverdueAmount += payment.total_amount_due;
            
            // Test sending overdue notification email
            console.log(`📧 Sending overdue notification to ${payment.tenant_name}...`);
            const overdueTemplate = emailTemplates.paymentOverdue(
                payment.tenant_name,
                payment.property_name,
                payment.total_amount_due,
                payment.due_date,
                payment.days_overdue
            );
            
            const emailResult = await sendEmail(payment.tenant_email, overdueTemplate);
            console.log(`📧 Email Result: ${emailResult.success ? '✅ Sent' : '❌ Failed'}`);
            console.log('');
        }
        
        console.log(`💰 Total Overdue Amount: ₦${totalOverdueAmount.toLocaleString()}`);
        console.log('='.repeat(80));
        
        // Test 2: Check payment status detection
        console.log('\n🔍 Testing Payment Status Detection...');
        
        const statusQuery = `
            SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_payments,
                SUM(CASE WHEN status = 'pending' AND date(due_date) >= date('now') THEN 1 ELSE 0 END) as upcoming_payments,
                SUM(CASE WHEN status = 'pending' AND date(due_date) < date('now') THEN 1 ELSE 0 END) as overdue_payments,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
                SUM(CASE WHEN status = 'pending' AND date(due_date) < date('now') THEN amount * 1.05 ELSE 0 END) as total_overdue_with_fees
            FROM payments
        `;
        
        db.get(statusQuery, [], (err, stats) => {
            if (err) {
                console.error('❌ Error fetching payment stats:', err);
                return;
            }
            
            console.log('📊 Payment Statistics:');
            console.log(`📈 Total Payments: ${stats.total_payments}`);
            console.log(`✅ Paid Payments: ${stats.paid_payments}`);
            console.log(`⏳ Upcoming Payments: ${stats.upcoming_payments}`);
            console.log(`⚠️  Overdue Payments: ${stats.overdue_payments}`);
            console.log(`💰 Total Paid: ₦${(stats.total_paid || 0).toLocaleString()}`);
            console.log(`💸 Total Overdue (with fees): ₦${(stats.total_overdue_with_fees || 0).toLocaleString()}`);
            
            // Test 3: Test payment reminders for upcoming payments
            console.log('\n🔔 Testing Payment Reminders...');
            
            const upcomingQuery = `
                SELECT 
                    p.*,
                    pr.name as property_name,
                    u.name as tenant_name,
                    u.email as tenant_email,
                    julianday(p.due_date) - julianday('now') as days_until_due
                FROM payments p
                JOIN properties pr ON p.property_id = pr.id
                JOIN users u ON p.user_id = u.id
                WHERE p.status = 'pending'
                AND date(p.due_date) > date('now')
                AND julianday(p.due_date) - julianday('now') <= 7
                ORDER BY p.due_date ASC
            `;
            
            db.all(upcomingQuery, [], async (err, upcomingPayments) => {
                if (err) {
                    console.error('❌ Error fetching upcoming payments:', err);
                    return;
                }
                
                console.log(`📋 Found ${upcomingPayments.length} upcoming payment(s) in next 7 days`);
                
                for (const payment of upcomingPayments) {
                    console.log(`👤 ${payment.tenant_name} - ₦${payment.amount.toLocaleString()} due in ${Math.ceil(payment.days_until_due)} days`);
                    
                    // Test sending payment reminder
                    const reminderTemplate = emailTemplates.paymentReminder(
                        payment.tenant_name,
                        payment.property_name,
                        payment.amount,
                        payment.due_date,
                        payment.days_until_due
                    );
                    
                    const emailResult = await sendEmail(payment.tenant_email, reminderTemplate);
                    console.log(`📧 Reminder Email: ${emailResult.success ? '✅ Sent' : '❌ Failed'}`);
                }
                
                console.log('\n🎉 Payment System Test Complete!');
                console.log('='.repeat(80));
                
                db.close();
            });
        });
    });
}

// Run the test
testPaymentSystem().catch(console.error);
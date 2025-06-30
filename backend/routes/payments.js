const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');
const router = express.Router();
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);

// Initialize payment with Paystack
router.post('/initialize', auth, async (req, res) => {
    const { paymentIds, totalAmount } = req.body;
    const userId = req.user.user.id;
    const userEmail = req.user.user.email;
    
    
    // Validate payment IDs belong to the authenticated user
    const placeholders = paymentIds.map((_, index) => `$${index + 1}`).join(',');
    const paymentQuery = `
        SELECT p.*, pr.name as property_name 
        FROM payments p 
        JOIN properties pr ON p.property_id = pr.id 
        WHERE p.id IN (${placeholders}) 
        AND p.user_id = $${paymentIds.length + 1}
        AND p.status = 'pending'
    `;
    
    try {
        const payments = await db.all(paymentQuery, [...paymentIds, userId]);
        
        if (payments.length === 0) {
            return res.status(404).json({ message: 'No valid payments found' });
        }
        
        // Calculate actual total amount from database with late fees
        const actualTotal = payments.reduce((sum, payment) => {
            const baseAmount = payment.amount;
            const lateFee = new Date(payment.due_date) < new Date() ? Math.round(baseAmount * 0.05 * 100) / 100 : 0;
            return sum + baseAmount + lateFee;
        }, 0);
        
        // Round both amounts to 2 decimal places for comparison
        const roundedActual = Math.round(actualTotal * 100) / 100;
        const roundedTotal = Math.round(totalAmount * 100) / 100;
        
        console.log('💰 Payment Amount Validation:');
        console.log('Frontend Total:', roundedTotal);
        console.log('Backend Calculated:', roundedActual);
        console.log('Difference:', Math.abs(roundedActual - roundedTotal));
        
        if (Math.abs(roundedActual - roundedTotal) > 0.01) {
            return res.status(400).json({ 
                message: 'Amount mismatch',
                frontend_amount: roundedTotal,
                backend_amount: roundedActual,
                difference: Math.abs(roundedActual - roundedTotal)
            });
        }
        
        // Create Paystack transaction
        try {
            
            const paystackResponse = await Paystack.transaction.initialize({
                email: userEmail,
                amount: Math.round(actualTotal * 100), // Convert to kobo
                reference: `TM_${Date.now()}_${userId}`,
                callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/callback`,
                metadata: {
                    custom_fields: [
                        {
                            display_name: "Payment IDs",
                            variable_name: "payment_ids",
                            value: paymentIds.join(',')
                        },
                        {
                            display_name: "Properties",
                            variable_name: "properties",
                            value: payments.map(p => p.property_name).join(', ')
                        }
                    ]
                }
            });
            
            
            // Store transaction in database
            const transactionQuery = `
                INSERT INTO payment_transactions 
                (reference, user_id, amount, payment_ids, status, paystack_data) 
                VALUES ($1, $2, $3, $4, 'pending', $5)
                RETURNING id
            `;
            
            const result = await db.run(transactionQuery, [
                paystackResponse.data.reference,
                userId,
                actualTotal,
                paymentIds.join(','),
                JSON.stringify(paystackResponse.data)
            ]);
            
            
            res.json({
                success: true,
                authorization_url: paystackResponse.data.authorization_url,
                access_code: paystackResponse.data.access_code,
                reference: paystackResponse.data.reference
            });
            
        } catch (error) {
            console.error('Paystack initialization error:', error);
            res.status(500).json({ 
                error: 'Payment initialization failed',
                details: error.message 
            });
        }
        
    } catch (error) {
        console.error('Database error in payment initialization:', error);
        res.status(500).json({ 
            error: 'Database error',
            details: error.message 
        });
    }
});

// Verify payment from Paystack
router.post('/verify/:reference', auth, async (req, res) => {
    const { reference } = req.params;
    const userId = req.user.user.id;
    
    try {
        // Verify with Paystack
        const verification = await Paystack.transaction.verify(reference);
        
        if (verification.data.status === 'success') {
            // Get transaction from our database
            const transactionQuery = `
                SELECT * FROM payment_transactions 
                WHERE reference = ? AND user_id = ?
            `;
            
            db.get(transactionQuery, [reference, userId], (err, transaction) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (!transaction) {
                    return res.status(404).json({ message: 'Transaction not found' });
                }
                
                if (transaction.status === 'completed') {
                    return res.json({ 
                        success: true, 
                        message: 'Payment already processed' 
                    });
                }
                
                // Update payment status
                const paymentIds = transaction.payment_ids.split(',');
                const updatePaymentQuery = `
                    UPDATE payments 
                    SET status = 'paid', 
                        payment_date = datetime('now'),
                        payment_reference = ?,
                        paystack_reference = ?,
                        payment_method = 'paystack',
                        transaction_fee = ?
                    WHERE id IN (${paymentIds.map(() => '?').join(',')})
                `;
                
                const transactionFee = verification.data.fees / 100; // Convert from kobo
                
                db.run(updatePaymentQuery, [
                    reference,
                    verification.data.reference,
                    transactionFee,
                    ...paymentIds
                ], function(err) {
                    if (err) {
                        console.error('Error updating payments:', err);
                        return res.status(500).json({ error: 'Failed to update payments' });
                    }
                    
                    // Update transaction status
                    const updateTransactionQuery = `
                        UPDATE payment_transactions 
                        SET status = 'completed', 
                            verified_at = datetime('now'),
                            verification_data = ?
                        WHERE reference = ?
                    `;
                    
                    db.run(updateTransactionQuery, [
                        JSON.stringify(verification.data),
                        reference
                    ], async function(err) {
                        if (err) {
                            console.error('Error updating transaction:', err);
                        }
                        
                        // Send payment confirmation email
                        try {
                            // Get user and payment details for email
                            const userQuery = `
                                SELECT u.name, u.email, GROUP_CONCAT(pr.name, ', ') as property_names
                                FROM users u
                                JOIN payments p ON u.id = p.user_id
                                JOIN properties pr ON p.property_id = pr.id
                                WHERE u.id = ? AND p.id IN (${paymentIds.map(() => '?').join(',')})
                                GROUP BY u.id
                            `;
                            
                            db.get(userQuery, [userId, ...paymentIds], async (err, userInfo) => {
                                if (!err && userInfo) {
                                    const emailTemplate = emailTemplates.paymentReceived(
                                        userInfo.name,
                                        userInfo.property_names,
                                        verification.data.amount / 100, // Convert from kobo
                                        verification.data.reference
                                    );
                                    
                                    const emailResult = await sendEmail(userInfo.email, emailTemplate);
                                    if (emailResult.success) {
                                        console.log(`✅ Payment confirmation email sent to ${userInfo.email}`);
                                    } else {
                                        console.error(`❌ Failed to send payment confirmation email: ${emailResult.error}`);
                                    }
                                }
                            });
                        } catch (emailError) {
                            console.error('Error sending payment confirmation email:', emailError);
                        }
                        
                        res.json({
                            success: true,
                            message: 'Payment verified and updated successfully',
                            amount: verification.data.amount / 100,
                            reference: verification.data.reference
                        });
                    });
                });
            });
        } else {
            res.json({
                success: false,
                message: 'Payment verification failed',
                status: verification.data.status
            });
        }
        
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ 
            error: 'Verification failed',
            details: error.message 
        });
    }
});

// Get user's overdue payments
router.get('/overdue', auth, (req, res) => {
    const userId = req.user.user.id;
    
    const query = `
        SELECT 
            p.*,
            pr.name as property_name,
            CASE 
                WHEN date(p.due_date) < date('now') THEN 
                    ROUND(p.amount * 0.05, 2)
                ELSE 0 
            END as late_fee,
            CASE 
                WHEN date(p.due_date) < date('now') THEN 
                    ROUND((p.amount + (p.amount * 0.05)) * 100) / 100
                ELSE p.amount 
            END as total_amount_due
        FROM payments p
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.user_id = ? 
        AND p.status = 'pending'
        AND date(p.due_date) < date('now')
        ORDER BY p.due_date ASC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        const totalOverdue = rows.reduce((sum, payment) => sum + payment.total_amount_due, 0);
        
        res.json({
            payments: rows,
            totalOverdue,
            count: rows.length
        });
    });
});

// Get user's pending payments (not yet due)
router.get('/pending', auth, (req, res) => {
    const userId = req.user.user.id;
    
    const query = `
        SELECT 
            p.*,
            pr.name as property_name
        FROM payments p
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.user_id = ? 
        AND p.status = 'pending'
        AND date(p.due_date) >= date('now')
        ORDER BY p.due_date ASC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        res.json(rows);
    });
});

// Webhook endpoint for Paystack
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
                      .update(JSON.stringify(req.body))
                      .digest('hex');
    
    if (hash === req.headers['x-paystack-signature']) {
        const event = req.body;
        
        if (event.event === 'charge.success') {
            const { reference } = event.data;
            
            // Update transaction status
            const query = `
                UPDATE payment_transactions 
                SET status = 'completed', 
                    webhook_data = ?, 
                    verified_at = datetime('now')
                WHERE reference = ? AND status = 'pending'
            `;
            
            db.run(query, [JSON.stringify(event.data), reference], function(err) {
                if (err) {
                    console.error('Webhook processing error:', err);
                }
            });
        }
    }
    
    res.sendStatus(200);
});

// Get payment transaction history
router.get('/transactions', auth, (req, res) => {
    const userId = req.user.user.id;
    
    const query = `
        SELECT 
            pt.*,
            GROUP_CONCAT(pr.name, ', ') as property_names
        FROM payment_transactions pt
        LEFT JOIN payments p ON p.id IN (
            SELECT value FROM json_each('[' || REPLACE(pt.payment_ids, ',', '","') || ']')
        )
        LEFT JOIN properties pr ON p.property_id = pr.id
        WHERE pt.user_id = ?
        GROUP BY pt.id
        ORDER BY pt.created_at DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Send payment reminders to all overdue tenants (Admin only)
router.post('/send-reminders', auth, async (req, res) => {
    const userRole = req.user.user.role;
    
    // Only allow admins to send reminders
    if (userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    
    try {
        // Get all overdue payments with tenant details
        const overdueQuery = `
            SELECT 
                u.id as user_id,
                u.name as tenant_name,
                u.email as tenant_email,
                COUNT(p.id) as overdue_count,
                SUM(
                    CASE 
                        WHEN date(p.due_date) < date('now') THEN 
                            ROUND((p.amount + (p.amount * 0.05)) * 100) / 100
                        ELSE p.amount 
                    END
                ) as total_overdue_amount,
                GROUP_CONCAT(pr.name, ', ') as property_names,
                MIN(p.due_date) as earliest_due_date
            FROM users u
            JOIN payments p ON u.id = p.user_id
            JOIN properties pr ON p.property_id = pr.id
            WHERE u.role = 'tenant' 
            AND p.status = 'pending'
            AND date(p.due_date) < date('now')
            GROUP BY u.id, u.name, u.email
            ORDER BY earliest_due_date ASC
        `;
        
        db.all(overdueQuery, [], async (err, overdueUsers) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (overdueUsers.length === 0) {
                return res.json({
                    success: true,
                    message: 'No overdue payments found',
                    sentCount: 0
                });
            }
            
            let successCount = 0;
            let failureCount = 0;
            const results = [];
            
            // Send reminder email to each overdue tenant
            for (const tenant of overdueUsers) {
                try {
                    const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?tab=payments`;
                    
                    const emailTemplate = emailTemplates.paymentOverdueReminder(
                        tenant.tenant_name,
                        tenant.property_names,
                        tenant.total_overdue_amount,
                        tenant.overdue_count,
                        tenant.earliest_due_date,
                        paymentLink
                    );
                    
                    const emailResult = await sendEmail(tenant.tenant_email, emailTemplate);
                    
                    if (emailResult.success) {
                        successCount++;
                        results.push({
                            tenant: tenant.tenant_name,
                            email: tenant.tenant_email,
                            status: 'sent',
                            amount: tenant.total_overdue_amount
                        });
                        console.log(`✅ Payment reminder sent to ${tenant.tenant_name} (${tenant.tenant_email})`);
                    } else {
                        failureCount++;
                        results.push({
                            tenant: tenant.tenant_name,
                            email: tenant.tenant_email,
                            status: 'failed',
                            error: emailResult.error,
                            amount: tenant.total_overdue_amount
                        });
                        console.error(`❌ Failed to send reminder to ${tenant.tenant_name}: ${emailResult.error}`);
                    }
                } catch (emailError) {
                    failureCount++;
                    results.push({
                        tenant: tenant.tenant_name,
                        email: tenant.tenant_email,
                        status: 'failed',
                        error: emailError.message,
                        amount: tenant.total_overdue_amount
                    });
                    console.error(`❌ Error sending reminder to ${tenant.tenant_name}:`, emailError);
                }
            }
            
            res.json({
                success: true,
                message: `Payment reminders processed: ${successCount} sent, ${failureCount} failed`,
                sentCount: successCount,
                failureCount: failureCount,
                totalTenants: overdueUsers.length,
                results: results
            });
        });
        
    } catch (error) {
        console.error('Error sending payment reminders:', error);
        res.status(500).json({ 
            error: 'Failed to send payment reminders',
            details: error.message 
        });
    }
});

module.exports = router;
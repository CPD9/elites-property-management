const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();
// email
const { sendEmail, emailTemplates } = require('../config/email');


// Get all tenants and their payment status
router.get('/dashboard', auth, async (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    try {
        const query = `
            SELECT 
                u.id, u.name, u.email, u.phone,
                p.name as property_name, p.rent_amount,
                l.start_date, l.end_date,
                pay.payment_date, pay.due_date, pay.status as payment_status, pay.amount
            FROM users u
            LEFT JOIN leases l ON u.id = l.user_id
            LEFT JOIN properties p ON l.property_id = p.id
            LEFT JOIN payments pay ON u.id = pay.user_id
            WHERE u.role = 'tenant'
            ORDER BY u.name
        `;
        
        const rows = await db.all(query, []);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update to the create tenant route 
router.post('/tenants', auth, async (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
        'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, phone, hashedPassword, 'tenant'],
        async function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Send welcome email to new tenant
            try {
                const welcomeTemplate = emailTemplates.welcomeTenant(name, email, password, null);
                await sendEmail(email, welcomeTemplate);
                console.log(`Welcome email sent to ${email}`);
            } catch (emailError) {
                console.log('Failed to send welcome email:', emailError);
                // Don't fail the tenant creation if email fails
            }
            
            res.json({
                message: 'Tenant created successfully and welcome email sent',
                tenantId: this.lastID
            });
        }
    );
});

// Add property
router.post('/properties', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, type, rent_amount } = req.body;
    
    db.run(
        'INSERT INTO properties (name, type, rent_amount) VALUES (?, ?, ?)',
        [name, type, rent_amount],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Property added successfully',
                propertyId: this.lastID
            });
        }
    );
});

// Update rent amount
router.put('/properties/:id/rent', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { rent_amount } = req.body;
    const propertyId = req.params.id;
    
    db.run(
        'UPDATE properties SET rent_amount = ? WHERE id = ?',
        [rent_amount, propertyId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Rent updated successfully' });
        }
    );
});

// Create lease (assign tenant to property)
router.post('/leases', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { user_id, property_id, start_date, end_date } = req.body;
    
    db.run(
        'INSERT INTO leases (user_id, property_id, start_date, end_date) VALUES (?, ?, ?, ?)',
        [user_id, property_id, start_date, end_date],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Lease created successfully',
                leaseId: this.lastID
            });
        }
    );
});

// Update the mark payment as paid route (around line 120)
router.put('/payments/:id/paid', auth, async (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const paymentId = req.params.id;
    const { payment_reference } = req.body;
    
    // First, get payment details for email
    db.get(
        `SELECT p.amount, u.name as tenant_name, u.email, pr.name as property_name
         FROM payments p
         JOIN users u ON p.user_id = u.id
         JOIN properties pr ON p.property_id = pr.id
         WHERE p.id = ?`,
        [paymentId],
        async (err, paymentInfo) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            // Update payment status
            db.run(
                'UPDATE payments SET status = "paid", payment_date = date("now"), payment_reference = ? WHERE id = ?',
                [payment_reference, paymentId],
                async function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    
                    // Send payment confirmation email
                    if (paymentInfo) {
                        try {
                            const confirmationTemplate = emailTemplates.paymentReceived(
                                paymentInfo.tenant_name,
                                paymentInfo.property_name,
                                paymentInfo.amount,
                                payment_reference
                            );
                            await sendEmail(paymentInfo.email, confirmationTemplate);
                            console.log(`Payment confirmation email sent to ${paymentInfo.email}`);
                        } catch (emailError) {
                            console.log('Failed to send payment confirmation email:', emailError);
                        }
                    }
                    
                    res.json({ message: 'Payment marked as paid and confirmation email sent' });
                }
            );
        }
    );
});


// Add this route to routes/admin.js
router.post('/send-overdue-notifications', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            p.id as payment_id,
            u.name as tenant_name,
            u.email,
            pr.name as property_name,
            p.amount,
            p.due_date,
            julianday('now') - julianday(p.due_date) as days_overdue
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.status = 'pending' AND p.due_date < date('now')
    `;
    
    db.all(query, [], async (err, overduePayments) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const payment of overduePayments) {
            try {
                const overdueTemplate = emailTemplates.paymentOverdue(
                    payment.tenant_name,
                    payment.property_name,
                    payment.amount,
                    payment.due_date,
                    payment.days_overdue
                );
                
                const result = await sendEmail(payment.email, overdueTemplate);
                if (result.success) {
                    emailsSent++;
                } else {
                    emailsFailed++;
                }
            } catch (error) {
                emailsFailed++;
                console.log(`Failed to send overdue notice to ${payment.email}:`, error);
            }
        }
        
        res.json({
            message: `Overdue notifications processed`,
            totalOverdue: overduePayments.length,
            emailsSent,
            emailsFailed
        });
    });
});

// Get all payments with overdue status
router.get('/payments', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            p.id as payment_id,
            u.name as tenant_name,
            u.email,
            u.phone,
            pr.name as property_name,
            p.amount,
            p.due_date,
            p.payment_date,
            p.status,
            CASE 
                WHEN p.status = 'pending' AND p.due_date < date('now') THEN 'overdue'
                ELSE p.status
            END as payment_status,
            julianday('now') - julianday(p.due_date) as days_overdue
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN properties pr ON p.property_id = pr.id
        ORDER BY p.due_date DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Add this route to routes/admin.js
router.post('/send-payment-reminders', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { days_ahead = 3 } = req.body; // Default 3 days ahead
    
    const query = `
        SELECT 
            p.id as payment_id,
            u.name as tenant_name,
            u.email,
            pr.name as property_name,
            p.amount,
            p.due_date,
            julianday(p.due_date) - julianday('now') as days_until_due
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.status = 'pending' 
        AND p.due_date > date('now')
        AND julianday(p.due_date) - julianday('now') <= ?
        AND julianday(p.due_date) - julianday('now') > 0
    `;
    
    db.all(query, [days_ahead], async (err, upcomingPayments) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        let emailsSent = 0;
        let emailsFailed = 0;
        
        for (const payment of upcomingPayments) {
            try {
                const reminderTemplate = emailTemplates.paymentReminder(
                    payment.tenant_name,
                    payment.property_name,
                    payment.amount,
                    payment.due_date,
                    payment.days_until_due
                );
                
                const result = await sendEmail(payment.email, reminderTemplate);
                if (result.success) {
                    emailsSent++;
                } else {
                    emailsFailed++;
                }
            } catch (error) {
                emailsFailed++;
                console.log(`Failed to send reminder to ${payment.email}:`, error);
            }
        }
        
        res.json({
            message: `Payment reminders processed`,
            totalUpcoming: upcomingPayments.length,
            emailsSent,
            emailsFailed,
            daysAhead: days_ahead
        });
    });
});

// Get upcoming payments for preview
router.get('/upcoming-payments', auth, async (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { days_ahead = 7 } = req.query;
    
    try {
        const query = `
            SELECT 
                p.id as payment_id,
                u.name as tenant_name,
                u.email,
                pr.name as property_name,
                p.amount,
                p.due_date,
                EXTRACT(EPOCH FROM (p.due_date::date - CURRENT_DATE)) / 86400 as days_until_due
            FROM payments p
            JOIN users u ON p.user_id = u.id
            JOIN properties pr ON p.property_id = pr.id
            WHERE p.status = 'pending' 
            AND p.due_date > CURRENT_DATE
            AND EXTRACT(EPOCH FROM (p.due_date::date - CURRENT_DATE)) / 86400 <= $1
            ORDER BY p.due_date ASC
        `;
        
        const upcomingPayments = await db.all(query, [days_ahead]);
        res.json(upcomingPayments);
    } catch (error) {
        console.error('Error fetching upcoming payments:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark payment as paid
router.put('/payments/:id/paid', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const paymentId = req.params.id;
    const { payment_reference } = req.body;
    
    db.run(
        'UPDATE payments SET status = "paid", payment_date = date("now"), payment_reference = ? WHERE id = ?',
        [payment_reference, paymentId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Payment marked as paid' });
        }
    );
});

// Update tenant
router.put('/tenants/:id', auth, async (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { name, email, phone, password } = req.body;
    const tenantId = req.params.id;
    
    try {
        let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?';
        let params = [name, email, phone];
        
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            params.push(hashedPassword);
        }
        
        updateQuery += ' WHERE id = ? AND role = "tenant"';
        params.push(tenantId);
        
        db.run(updateQuery, params, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Tenant not found' });
            }
            
            res.json({ message: 'Tenant updated successfully' });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete tenant
router.delete('/tenants/:id', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const tenantId = req.params.id;
    
    db.run('DELETE FROM users WHERE id = ? AND role = "tenant"', [tenantId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        
        res.json({ message: 'Tenant deleted successfully' });
    });
});

// Delete property
router.delete('/properties/:id', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const propertyId = req.params.id;
    
    db.run('DELETE FROM properties WHERE id = ?', [propertyId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }
        
        res.json({ message: 'Property deleted successfully' });
    });
});

// Generate recurring payments (next month's rent)
router.post('/generate-recurring-payments', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all active tenant-property assignments
    const query = `
        SELECT DISTINCT
            u.id as user_id,
            u.name as tenant_name,
            u.email,
            p.id as property_id,
            p.name as property_name,
            p.rent_amount
        FROM users u
        JOIN leases la ON u.id = la.user_id AND la.status = 'active'
        JOIN properties p ON la.property_id = p.id
        WHERE u.role = 'tenant'
    `;
    
    db.all(query, [], (err, tenantProperties) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        let paymentsGenerated = 0;
        let errors = 0;
        
        // Calculate next month's due date (first day of next month)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        const dueDate = nextMonth.toISOString().split('T')[0];
        
        const generatePayment = (tenantProperties, index) => {
            if (index >= tenantProperties.length) {
                return res.json({
                    message: 'Recurring payments generated successfully',
                    paymentsGenerated,
                    errors,
                    dueDate
                });
            }
            
            const tenant = tenantProperties[index];
            
            // Check if payment already exists for this month
            db.get(
                'SELECT id FROM payments WHERE user_id = ? AND property_id = ? AND due_date = ?',
                [tenant.user_id, tenant.property_id, dueDate],
                (err, existing) => {
                    if (err) {
                        errors++;
                        return generatePayment(tenantProperties, index + 1);
                    }
                    
                    if (existing) {
                        // Payment already exists for this tenant/property/month
                        return generatePayment(tenantProperties, index + 1);
                    }
                    
                    // Create new payment
                    db.run(
                        'INSERT INTO payments (user_id, property_id, amount, due_date, status) VALUES (?, ?, ?, ?, "pending")',
                        [tenant.user_id, tenant.property_id, tenant.rent_amount, dueDate],
                        function(err) {
                            if (err) {
                                errors++;
                            } else {
                                paymentsGenerated++;
                            }
                            generatePayment(tenantProperties, index + 1);
                        }
                    );
                }
            );
        };
        
        if (tenantProperties.length === 0) {
            return res.json({
                message: 'No active tenant-property assignments found',
                paymentsGenerated: 0,
                errors: 0
            });
        }
        
        generatePayment(tenantProperties, 0);
    });
});

// Create payment (manual payment entry)
router.post('/payments', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const { user_id, property_id, amount, due_date } = req.body;
    
    db.run(
        'INSERT INTO payments (user_id, property_id, amount, due_date, status) VALUES (?, ?, ?, ?, "pending")',
        [user_id, property_id, amount, due_date],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Payment created successfully',
                paymentId: this.lastID
            });
        }
    );
});

// Get all tenants
router.get('/tenants', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            u.id, u.name, u.email, u.phone,
            p.name as property_name
        FROM users u
        LEFT JOIN leases l ON u.id = l.user_id AND l.status = 'active'
        LEFT JOIN properties p ON l.property_id = p.id
        WHERE u.role = 'tenant'
        ORDER BY u.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all properties
router.get('/properties', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            p.*,
            CASE WHEN l.id IS NOT NULL THEN 'occupied' ELSE 'available' END as status
        FROM properties p
        LEFT JOIN leases l ON p.id = l.property_id AND l.status = 'active'
        ORDER BY p.name
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all Paystack transactions (admin only)
router.get('/paystack-transactions', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const query = `
        SELECT 
            pt.*,
            u.name as tenant_name,
            u.email as tenant_email,
            GROUP_CONCAT(pr.name, ', ') as property_names
        FROM payment_transactions pt
        JOIN users u ON pt.user_id = u.id
        LEFT JOIN payments p ON p.id IN (
            SELECT TRIM(value) FROM (
                SELECT SUBSTR(pt.payment_ids, 
                    CASE WHEN instr(pt.payment_ids, ',') = 0 THEN 1 
                         ELSE 1 END,
                    CASE WHEN instr(pt.payment_ids, ',') = 0 THEN length(pt.payment_ids)
                         ELSE instr(pt.payment_ids, ',') - 1 END
                ) as value
                UNION ALL
                SELECT TRIM(SUBSTR(pt.payment_ids, instr(pt.payment_ids, ',') + 1)) as value 
                WHERE instr(pt.payment_ids, ',') > 0
            )
            WHERE value != ''
        )
        LEFT JOIN properties pr ON p.property_id = pr.id
        GROUP BY pt.id
        ORDER BY pt.created_at DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get payment statistics for admin dashboard
router.get('/payment-stats', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const queries = [
        // Total payments this month
        `SELECT COUNT(*) as total_payments, SUM(amount) as total_amount 
         FROM payments 
         WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
        
        // Paystack transactions this month
        `SELECT COUNT(*) as paystack_transactions, SUM(amount) as paystack_amount 
         FROM payment_transactions 
         WHERE status = 'completed' 
         AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
        
        // Overdue payments
        `SELECT COUNT(*) as overdue_count, SUM(amount) as overdue_amount 
         FROM payments 
         WHERE status = 'pending' AND date(due_date) < date('now')`,
        
        // Success rate
        `SELECT 
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
            COUNT(*) as total
         FROM payment_transactions`
    ];
    
    Promise.all(queries.map(query => {
        return new Promise((resolve, reject) => {
            db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }))
    .then(results => {
        const stats = {
            totalPayments: results[0].total_payments || 0,
            totalAmount: results[0].total_amount || 0,
            paystackTransactions: results[1].paystack_transactions || 0,
            paystackAmount: results[1].paystack_amount || 0,
            overdueCount: results[2].overdue_count || 0,
            overdueAmount: results[2].overdue_amount || 0,
            successRate: results[3].total > 0 ? 
                ((results[3].successful / results[3].total) * 100).toFixed(1) : 0
        };
        res.json(stats);
    })
    .catch(err => {
        res.status(500).json({ error: err.message });
    });
});

module.exports = router;
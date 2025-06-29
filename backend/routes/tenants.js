const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get tenant's payment history and current status
router.get('/my-payments', auth, (req, res) => {
    const userId = req.user.user.id;
    
    const query = `
        SELECT 
            p.id as payment_id,
            pr.name as property_name,
            p.amount,
            p.due_date,
            p.payment_date,
            p.status,
            p.payment_reference,
            CASE 
                WHEN p.status = 'pending' AND p.due_date < date('now') THEN 'overdue'
                ELSE p.status
            END as payment_status,
            julianday('now') - julianday(p.due_date) as days_overdue
        FROM payments p
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.user_id = ?
        ORDER BY p.due_date DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get tenant's lease information
router.get('/my-lease', auth, (req, res) => {
    const userId = req.user.user.id;
    
    const query = `
        SELECT 
            l.id,
            p.name as property_name,
            p.type,
            p.rent_amount,
            l.start_date,
            l.end_date,
            l.status
        FROM leases l
        JOIN properties p ON l.property_id = p.id
        WHERE l.user_id = ?
    `;
    
    db.get(query, [userId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.json({ message: 'No active lease found' });
        }
        res.json(row);
    });
});

// Update tenant profile
router.put('/update-profile', auth, async (req, res) => {
    const userId = req.user.user.id;
    const { name, email, phone, currentPassword, newPassword } = req.body;
    
    // Validate required fields
    if (!name || !email) {
        return res.status(400).json({ 
            success: false,
            message: 'Name and email are required' 
        });
    }
    
    try {
        // If changing password, verify current password first
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Current password is required to change password' 
                });
            }
            
            // Get current user data
            const userQuery = 'SELECT password FROM users WHERE id = ?';
            const userData = await new Promise((resolve, reject) => {
                db.get(userQuery, [userId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (!userData) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }
            
            // Verify current password
            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Current password is incorrect' 
                });
            }
            
            // Validate new password
            if (newPassword.length < 6) {
                return res.status(400).json({ 
                    success: false,
                    message: 'New password must be at least 6 characters long' 
                });
            }
        }
        
        // Check if email is already taken by another user
        const emailCheckQuery = 'SELECT id FROM users WHERE email = ? AND id != ?';
        const existingUser = await new Promise((resolve, reject) => {
            db.get(emailCheckQuery, [email, userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is already in use by another account' 
            });
        }
        
        // Prepare update query and values
        let updateQuery = 'UPDATE users SET name = ?, email = ?, phone = ?';
        let updateValues = [name, email, phone || null];
        
        // Add password update if provided
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateQuery += ', password = ?';
            updateValues.push(hashedPassword);
        }
        
        updateQuery += ' WHERE id = ?';
        updateValues.push(userId);
        
        // Execute update
        await new Promise((resolve, reject) => {
            db.run(updateQuery, updateValues, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                name,
                email,
                phone
            }
        });
        
    } catch (error) {
        console.error('Error updating tenant profile:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update profile',
            error: error.message 
        });
    }
});

module.exports = router;
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    try {
        const user = await db.get('SELECT * FROM users WHERE email = $1', [email]);
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const payload = {
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create user route (for admin to create tenants)
router.post('/create-user', async (req, res) => {
    const { name, email, password, phone, role = 'tenant' } = req.body;
    
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        db.run(
            'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, phone, role],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ message: 'User with this email already exists' });
                    }
                    return res.status(500).json({ error: err.message });
                }
                
                res.json({
                    message: 'User created successfully',
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user route
router.get('/me', auth, async (req, res) => {
    const userId = req.user.user.id;
    
    try {
        const user = await db.get('SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1', [userId]);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            created_at: user.created_at
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
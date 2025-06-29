const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeEmailService } = require('./config/email');

// Import database
const db = require('./config/database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize email service
initializeEmailService();

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Tenant Management API is running!' });
});

// Test database route
app.get('/api/test-db', (req, res) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table'", (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ message: 'Database connected!', tables: row });
        }
    });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/payments', require('./routes/payments'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
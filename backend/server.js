const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initializeEmailService } = require('./config/email');

// Import database
const db = require('./config/database');

const app = express();

// Middleware
const corsOptions = {
    origin: [
        'https://elitesproject.netlify.app',
        /https:\/\/.*--elitesproject\.netlify\.app$/,  // Allow all deploy previews
        'https://elites-property-management.onrender.com',  // Render frontend
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json());

// Initialize email service
initializeEmailService();

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Tenant Management API is running!' });
});

// Test database route
app.get('/api/test-db', async (req, res) => {
    try {
        // Check if PostgreSQL or SQLite
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
            // PostgreSQL query
            const result = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
            res.json({ 
                message: 'PostgreSQL Database connected!', 
                database: 'PostgreSQL',
                tables: result.rows.map(row => row.table_name)
            });
        } else {
            // SQLite query
            const row = await db.get("SELECT name FROM sqlite_master WHERE type='table'");
            res.json({ 
                message: 'SQLite Database connected!', 
                database: 'SQLite',
                tables: row 
            });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
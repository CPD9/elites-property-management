const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../tenant_management.db'));

// Initialize tables
db.serialize(() => {
    // Users table (tenants + admin)
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(10) DEFAULT 'tenant',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Properties table
    db.run(`CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255),
        type VARCHAR(50),
        rent_amount DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Leases table
    db.run(`CREATE TABLE IF NOT EXISTS leases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        property_id INTEGER,
        start_date DATE,
        end_date DATE,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
    )`);

    // Payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        property_id INTEGER,
        amount DECIMAL(10,2),
        payment_date DATE,
        due_date DATE,
        status VARCHAR(20) DEFAULT 'pending',
        payment_reference VARCHAR(255),
        paystack_reference VARCHAR(255),
        paystack_status VARCHAR(50),
        payment_method VARCHAR(50),
        transaction_fee DECIMAL(10,2),
        late_fee DECIMAL(10,2) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
    )`);

    // Calendar Events table
    db.run(`CREATE TABLE IF NOT EXISTS calendar_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        property_id INTEGER,
        title VARCHAR(255),
        description TEXT,
        start_date DATETIME,
        end_date DATETIME,
        event_type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled',
        google_event_id VARCHAR(255),
        created_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
    )`);

    // Maintenance Requests table
    db.run(`CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        property_id INTEGER,
        title VARCHAR(255),
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        scheduled_date DATETIME,
        completed_date DATETIME,
        assigned_to VARCHAR(255),
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
    )`);

    // Payment Transactions table (for Paystack integration)
    db.run(`CREATE TABLE IF NOT EXISTS payment_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference VARCHAR(255) UNIQUE,
        user_id INTEGER,
        amount DECIMAL(10,2),
        payment_ids TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        paystack_data TEXT,
        verification_data TEXT,
        webhook_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        verified_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title VARCHAR(255),
        message TEXT,
        type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'unread',
        scheduled_for DATETIME,
        sent_at DATETIME,
        channels TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // User Notification Preferences table
    db.run(`CREATE TABLE IF NOT EXISTS user_notification_preferences (
        user_id INTEGER PRIMARY KEY,
        email_enabled BOOLEAN DEFAULT 1,
        sms_enabled BOOLEAN DEFAULT 1,
        payment_reminders BOOLEAN DEFAULT 1,
        maintenance_updates BOOLEAN DEFAULT 1,
        system_announcements BOOLEAN DEFAULT 1,
        phone_number VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
});

module.exports = db;
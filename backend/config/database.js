const path = require('path');

// Check if we're in production (Render) or development
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseURL = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

let db;

if (isProduction && hasDatabaseURL) {
  // PostgreSQL for production (Render)
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Create a wrapper to make PostgreSQL interface similar to SQLite
  db = {
    query: (text, params) => pool.query(text, params),
    
    get: async (sql, params = []) => {
      try {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
      } catch (error) {
        throw error;
      }
    },
    
    all: async (sql, params = []) => {
      try {
        const result = await pool.query(sql, params);
        return result.rows;
      } catch (error) {
        throw error;
      }
    },
    
    run: async (sql, params = []) => {
      try {
        const result = await pool.query(sql, params);
        return {
          lastID: result.rows[0]?.id,
          changes: result.rowCount
        };
      } catch (error) {
        throw error;
      }
    }
  };

  console.log('🐘 Using PostgreSQL database for production');

} else {
  // SQLite for development
  const sqlite3 = require('sqlite3').verbose();
  
  const sqliteDb = new sqlite3.Database(path.join(__dirname, '../tenant_management.db'));
  
  // Promisify SQLite methods to match PostgreSQL async interface
  db = {
    query: (text, params) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve({ rows });
        });
      });
    },
    
    get: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row || null);
        });
      });
    },
    
    all: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    },
    
    run: (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    },
    
    serialize: (callback) => sqliteDb.serialize(callback),
    close: () => sqliteDb.close()
  };

  console.log('📦 Using SQLite database for development');
  
  // Initialize SQLite tables
  initializeSQLiteTables();
}

function initializeSQLiteTables() {
  if (!isProduction) {
    const sqlite3 = require('sqlite3').verbose();
    const sqliteDb = new sqlite3.Database(path.join(__dirname, '../tenant_management.db'));
    
    sqliteDb.serialize(() => {
      // Users table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        name VARCHAR(255),
        phone VARCHAR(20),
        role VARCHAR(10) DEFAULT 'tenant',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Properties table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255),
        type VARCHAR(50),
        rent_amount DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Leases table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS leases (
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
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS payments (
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

      // Payment Transactions table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS payment_transactions (
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

      // Maintenance Requests table
      sqliteDb.run(`CREATE TABLE IF NOT EXISTS maintenance_requests (
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
    });
  }
}

module.exports = db;
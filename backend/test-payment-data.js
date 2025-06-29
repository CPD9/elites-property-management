const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'tenant_management.db'));

// Add some test overdue payments
db.serialize(() => {
    // First, let's check if we have users and properties
    db.all("SELECT * FROM users WHERE role = 'tenant'", (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return;
        }
        
        if (users.length === 0) {
            console.log('No tenant users found. Please create some tenant users first.');
            return;
        }
        
        db.all("SELECT * FROM properties", (err, properties) => {
            if (err) {
                console.error('Error fetching properties:', err);
                return;
            }
            
            if (properties.length === 0) {
                console.log('No properties found. Please create some properties first.');
                return;
            }
            
            console.log('Found users:', users.length, 'properties:', properties.length);
            
            // Create overdue payments for the first tenant
            const tenant = users[0];
            const property = properties[0];
            
            // Create an overdue payment (due 10 days ago)
            const overdueDate = new Date();
            overdueDate.setDate(overdueDate.getDate() - 10);
            
            const query = `
                INSERT INTO payments (user_id, property_id, amount, due_date, status)
                VALUES (?, ?, ?, ?, 'pending')
            `;
            
            db.run(query, [tenant.id, property.id, 100000, overdueDate.toISOString().split('T')[0]], function(err) {
                if (err) {
                    console.error('Error creating overdue payment:', err);
                } else {
                    console.log('Created overdue payment with ID:', this.lastID);
                }
            });
            
            // Create another overdue payment (due 5 days ago)
            const overdueDate2 = new Date();
            overdueDate2.setDate(overdueDate2.getDate() - 5);
            
            db.run(query, [tenant.id, property.id, 50000, overdueDate2.toISOString().split('T')[0]], function(err) {
                if (err) {
                    console.error('Error creating second overdue payment:', err);
                } else {
                    console.log('Created second overdue payment with ID:', this.lastID);
                    db.close();
                }
            });
        });
    });
});
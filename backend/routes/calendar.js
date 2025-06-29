const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all calendar events (admin sees all, tenants see their own)
router.get('/events', auth, (req, res) => {
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        // Admin sees all events
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            ORDER BY ce.start_date ASC
        `;
        params = [];
    } else {
        // Tenants see only their events
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            WHERE ce.user_id = ? OR ce.user_id IS NULL
            ORDER BY ce.start_date ASC
        `;
        params = [userId];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get events for a specific date range
router.get('/events/range', auth, (req, res) => {
    const { start, end } = req.query;
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            WHERE date(ce.start_date) >= date(?) AND date(ce.end_date) <= date(?)
            ORDER BY ce.start_date ASC
        `;
        params = [start, end];
    } else {
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            WHERE (ce.user_id = ? OR ce.user_id IS NULL)
            AND date(ce.start_date) >= date(?) AND date(ce.end_date) <= date(?)
            ORDER BY ce.start_date ASC
        `;
        params = [userId, start, end];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Create a new calendar event (admin only)
router.post('/events', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const {
        title,
        description,
        start_date,
        end_date,
        event_type,
        user_id,
        property_id
    } = req.body;
    
    const created_by = req.user.user.id;
    
    db.run(
        `INSERT INTO calendar_events 
         (title, description, start_date, end_date, event_type, user_id, property_id, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description, start_date, end_date, event_type, user_id || null, property_id || null, created_by],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                message: 'Event created successfully',
                eventId: this.lastID
            });
        }
    );
});

// Update a calendar event (admin only)
router.put('/events/:id', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const eventId = req.params.id;
    const {
        title,
        description,
        start_date,
        end_date,
        event_type,
        user_id,
        property_id,
        status
    } = req.body;
    
    db.run(
        `UPDATE calendar_events 
         SET title = ?, description = ?, start_date = ?, end_date = ?, 
             event_type = ?, user_id = ?, property_id = ?, status = ?
         WHERE id = ?`,
        [title, description, start_date, end_date, event_type, user_id || null, property_id || null, status || 'scheduled', eventId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Event not found' });
            }
            
            res.json({ message: 'Event updated successfully' });
        }
    );
});

// Delete a calendar event (admin only)
router.delete('/events/:id', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const eventId = req.params.id;
    
    db.run('DELETE FROM calendar_events WHERE id = ?', [eventId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    });
});

// Auto-generate payment due events from existing payments
router.post('/sync-payment-events', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    // Get all pending payments that don't have calendar events
    const query = `
        SELECT 
            p.id, p.user_id, p.property_id, p.amount, p.due_date,
            u.name as tenant_name,
            pr.name as property_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN properties pr ON p.property_id = pr.id
        WHERE p.status = 'pending'
        AND NOT EXISTS (
            SELECT 1 FROM calendar_events ce 
            WHERE ce.event_type = 'payment' 
            AND ce.user_id = p.user_id 
            AND ce.property_id = p.property_id
            AND date(ce.start_date) = date(p.due_date)
        )
    `;
    
    db.all(query, [], (err, payments) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        let eventsCreated = 0;
        let errors = 0;
        
        const createEvent = (payments, index) => {
            if (index >= payments.length) {
                return res.json({
                    message: 'Payment events synchronized',
                    eventsCreated,
                    errors
                });
            }
            
            const payment = payments[index];
            const title = `Rent Payment Due - ${payment.property_name}`;
            const description = `Payment of ₦${payment.amount.toLocaleString()} due for ${payment.tenant_name}`;
            const start_date = payment.due_date + ' 09:00:00';
            const end_date = payment.due_date + ' 10:00:00';
            
            db.run(
                `INSERT INTO calendar_events 
                 (title, description, start_date, end_date, event_type, user_id, property_id, created_by) 
                 VALUES (?, ?, ?, ?, 'payment', ?, ?, ?)`,
                [title, description, start_date, end_date, payment.user_id, payment.property_id, req.user.user.id],
                function(err) {
                    if (err) {
                        errors++;
                    } else {
                        eventsCreated++;
                    }
                    createEvent(payments, index + 1);
                }
            );
        };
        
        if (payments.length === 0) {
            return res.json({
                message: 'No new payment events to create',
                eventsCreated: 0,
                errors: 0
            });
        }
        
        createEvent(payments, 0);
    });
});

// Get upcoming events (for dashboard widgets)
router.get('/upcoming', auth, (req, res) => {
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    const { days = 7 } = req.query;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            WHERE date(ce.start_date) >= date('now') 
            AND date(ce.start_date) <= date('now', '+${days} days')
            AND ce.status = 'scheduled'
            ORDER BY ce.start_date ASC
            LIMIT 10
        `;
        params = [];
    } else {
        query = `
            SELECT 
                ce.*,
                u.name as tenant_name,
                p.name as property_name
            FROM calendar_events ce
            LEFT JOIN users u ON ce.user_id = u.id
            LEFT JOIN properties p ON ce.property_id = p.id
            WHERE (ce.user_id = ? OR ce.user_id IS NULL)
            AND date(ce.start_date) >= date('now') 
            AND date(ce.start_date) <= date('now', '+${days} days')
            AND ce.status = 'scheduled'
            ORDER BY ce.start_date ASC
            LIMIT 10
        `;
        params = [userId];
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;
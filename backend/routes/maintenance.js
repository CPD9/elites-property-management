const express = require('express');
const db = require('../config/database');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all maintenance requests (admin sees all, tenants see their own)
router.get('/requests', auth, (req, res) => {
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        query = `
            SELECT 
                mr.*,
                u.name as tenant_name,
                u.email as tenant_email,
                u.phone as tenant_phone,
                p.name as property_name
            FROM maintenance_requests mr
            JOIN users u ON mr.user_id = u.id
            JOIN properties p ON mr.property_id = p.id
            ORDER BY 
                CASE mr.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                END,
                mr.created_at DESC
        `;
        params = [];
    } else {
        query = `
            SELECT 
                mr.*,
                u.name as tenant_name,
                u.email as tenant_email,
                p.name as property_name
            FROM maintenance_requests mr
            JOIN users u ON mr.user_id = u.id
            JOIN properties p ON mr.property_id = p.id
            WHERE mr.user_id = ?
            ORDER BY mr.created_at DESC
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

// Get maintenance request by ID
router.get('/requests/:id', auth, (req, res) => {
    const requestId = req.params.id;
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        query = `
            SELECT 
                mr.*,
                u.name as tenant_name,
                u.email as tenant_email,
                u.phone as tenant_phone,
                p.name as property_name
            FROM maintenance_requests mr
            JOIN users u ON mr.user_id = u.id
            JOIN properties p ON mr.property_id = p.id
            WHERE mr.id = ?
        `;
        params = [requestId];
    } else {
        query = `
            SELECT 
                mr.*,
                u.name as tenant_name,
                u.email as tenant_email,
                p.name as property_name
            FROM maintenance_requests mr
            JOIN users u ON mr.user_id = u.id
            JOIN properties p ON mr.property_id = p.id
            WHERE mr.id = ? AND mr.user_id = ?
        `;
        params = [requestId, userId];
    }
    
    db.get(query, params, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (!row) {
            return res.status(404).json({ message: 'Maintenance request not found' });
        }
        
        res.json(row);
    });
});

// Create maintenance request (tenants can create, admin can create on behalf)
router.post('/requests', auth, (req, res) => {
    const {
        title,
        description,
        priority = 'medium',
        property_id,
        user_id
    } = req.body;
    
    const currentUserId = req.user.user.id;
    const userRole = req.user.user.role;
    
    // Determine the user_id for the request
    let requestUserId;
    if (userRole === 'admin' && user_id) {
        requestUserId = user_id; // Admin creating on behalf of tenant
    } else {
        requestUserId = currentUserId; // Tenant creating their own request
    }
    
    // Validate that tenant has access to the property
    if (userRole === 'tenant') {
        const leaseQuery = `
            SELECT id FROM leases 
            WHERE user_id = ? AND property_id = ? AND status = 'active'
        `;
        
        db.get(leaseQuery, [requestUserId, property_id], (err, lease) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            
            if (!lease) {
                return res.status(403).json({ message: 'You do not have access to this property' });
            }
            
            createMaintenanceRequest();
        });
    } else {
        createMaintenanceRequest();
    }
    
    function createMaintenanceRequest() {
        db.run(
            `INSERT INTO maintenance_requests 
             (user_id, property_id, title, description, priority) 
             VALUES (?, ?, ?, ?, ?)`,
            [requestUserId, property_id, title, description, priority],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                // Create calendar event for the maintenance request
                const eventTitle = `Maintenance: ${title}`;
                const eventDescription = `Priority: ${priority.toUpperCase()}\n\n${description}`;
                const scheduledDate = new Date();
                scheduledDate.setHours(scheduledDate.getHours() + 24); // Schedule for next day by default
                
                const startDate = scheduledDate.toISOString();
                const endDate = new Date(scheduledDate.getTime() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours duration
                
                db.run(
                    `INSERT INTO calendar_events 
                     (title, description, start_date, end_date, event_type, user_id, property_id, created_by) 
                     VALUES (?, ?, ?, ?, 'maintenance', ?, ?, ?)`,
                    [eventTitle, eventDescription, startDate, endDate, requestUserId, property_id, currentUserId],
                    function(eventErr) {
                        if (eventErr) {
                            console.error('Error creating calendar event:', eventErr);
                        }
                    }
                );
                
                res.json({
                    message: 'Maintenance request created successfully',
                    requestId: this.lastID
                });
            }
        );
    }
});

// Update maintenance request (admin only for status updates)
router.put('/requests/:id', auth, (req, res) => {
    const requestId = req.params.id;
    const {
        title,
        description,
        priority,
        status,
        scheduled_date,
        assigned_to,
        estimated_cost,
        actual_cost
    } = req.body;
    
    const userRole = req.user.user.role;
    
    // Tenants can only update their own requests and limited fields
    if (userRole === 'tenant') {
        const userId = req.user.user.id;
        
        db.run(
            `UPDATE maintenance_requests 
             SET title = ?, description = ?, priority = ?
             WHERE id = ? AND user_id = ? AND status IN ('pending', 'assigned')`,
            [title, description, priority, requestId, userId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Maintenance request not found or cannot be updated' });
                }
                
                res.json({ message: 'Maintenance request updated successfully' });
            }
        );
    } else {
        // Admin can update all fields
        let updateFields = [];
        let updateValues = [];
        
        if (title !== undefined) {
            updateFields.push('title = ?');
            updateValues.push(title);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (priority !== undefined) {
            updateFields.push('priority = ?');
            updateValues.push(priority);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
            
            // If marking as completed, set completed_date
            if (status === 'completed') {
                updateFields.push('completed_date = ?');
                updateValues.push(new Date().toISOString());
            }
        }
        if (scheduled_date !== undefined) {
            updateFields.push('scheduled_date = ?');
            updateValues.push(scheduled_date);
        }
        if (assigned_to !== undefined) {
            updateFields.push('assigned_to = ?');
            updateValues.push(assigned_to);
        }
        if (estimated_cost !== undefined) {
            updateFields.push('estimated_cost = ?');
            updateValues.push(estimated_cost);
        }
        if (actual_cost !== undefined) {
            updateFields.push('actual_cost = ?');
            updateValues.push(actual_cost);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        updateValues.push(requestId);
        
        db.run(
            `UPDATE maintenance_requests SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues,
            function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                
                if (this.changes === 0) {
                    return res.status(404).json({ message: 'Maintenance request not found' });
                }
                
                // Update calendar event if scheduled_date is provided
                if (scheduled_date) {
                    const endDate = new Date(new Date(scheduled_date).getTime() + 2 * 60 * 60 * 1000).toISOString();
                    
                    db.run(
                        `UPDATE calendar_events 
                         SET start_date = ?, end_date = ?, status = ?
                         WHERE event_type = 'maintenance' 
                         AND EXISTS (
                             SELECT 1 FROM maintenance_requests mr 
                             WHERE mr.id = ? AND mr.user_id = calendar_events.user_id 
                             AND mr.property_id = calendar_events.property_id
                         )`,
                        [scheduled_date, endDate, status || 'scheduled', requestId],
                        function(eventErr) {
                            if (eventErr) {
                                console.error('Error updating calendar event:', eventErr);
                            }
                        }
                    );
                }
                
                res.json({ message: 'Maintenance request updated successfully' });
            }
        );
    }
});

// Delete maintenance request (admin only, or tenant for pending requests)
router.delete('/requests/:id', auth, (req, res) => {
    const requestId = req.params.id;
    const userId = req.user.user.id;
    const userRole = req.user.user.role;
    
    let query;
    let params;
    
    if (userRole === 'admin') {
        query = 'DELETE FROM maintenance_requests WHERE id = ?';
        params = [requestId];
    } else {
        // Tenants can only delete their own pending requests
        query = 'DELETE FROM maintenance_requests WHERE id = ? AND user_id = ? AND status = "pending"';
        params = [requestId, userId];
    }
    
    db.run(query, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Maintenance request not found or cannot be deleted' });
        }
        
        // Delete associated calendar event
        db.run(
            `DELETE FROM calendar_events 
             WHERE event_type = 'maintenance' 
             AND title LIKE 'Maintenance:%'
             AND created_at = (
                 SELECT created_at FROM maintenance_requests 
                 WHERE id = ? LIMIT 1
             )`,
            [requestId],
            function(eventErr) {
                if (eventErr) {
                    console.error('Error deleting calendar event:', eventErr);
                }
            }
        );
        
        res.json({ message: 'Maintenance request deleted successfully' });
    });
});

// Get maintenance statistics (admin only)
router.get('/stats', auth, (req, res) => {
    if (req.user.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    
    const queries = [
        'SELECT COUNT(*) as total FROM maintenance_requests',
        'SELECT COUNT(*) as pending FROM maintenance_requests WHERE status = "pending"',
        'SELECT COUNT(*) as in_progress FROM maintenance_requests WHERE status = "in_progress"',
        'SELECT COUNT(*) as completed FROM maintenance_requests WHERE status = "completed"',
        'SELECT COUNT(*) as urgent FROM maintenance_requests WHERE priority = "urgent" AND status != "completed"',
        'SELECT AVG(actual_cost) as avg_cost FROM maintenance_requests WHERE actual_cost IS NOT NULL',
        `SELECT COUNT(*) as overdue FROM maintenance_requests 
         WHERE scheduled_date < datetime('now') AND status IN ('pending', 'assigned')`
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
        res.json({
            total: results[0].total,
            pending: results[1].pending,
            in_progress: results[2].in_progress,
            completed: results[3].completed,
            urgent: results[4].urgent,
            average_cost: results[5].avg_cost || 0,
            overdue: results[6].overdue
        });
    })
    .catch(err => {
        res.status(500).json({ error: err.message });
    });
});

module.exports = router;
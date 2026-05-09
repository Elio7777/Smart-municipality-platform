// controllers/adminContact.js
// Admin endpoints for managing all contact info

const db = require('../config/db');

// =============== MUNICIPALITY INFO (singleton) ===============

exports.getInfo = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM municipality_info LIMIT 1');
        res.json({ info: rows[0] || null });
    } catch (error) {
        console.error('getInfo error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateInfo = async (req, res) => {
    try {
        const { name, about, address, latitude, longitude, main_phone, main_email, website } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Get existing row id (singleton — only one row)
        const [existing] = await db.query('SELECT id FROM municipality_info LIMIT 1');

        if (existing.length === 0) {
            // No row yet, insert
            await db.query(
                `INSERT INTO municipality_info (name, about, address, latitude, longitude, main_phone, main_email, website)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [name.trim(), about || null, address || null, latitude || null, longitude || null,
                 main_phone || null, main_email || null, website || null]
            );
        } else {
            // Update existing
            await db.query(
                `UPDATE municipality_info
                 SET name = ?, about = ?, address = ?, latitude = ?, longitude = ?,
                     main_phone = ?, main_email = ?, website = ?, updated_at = NOW()
                 WHERE id = ?`,
                [name.trim(), about || null, address || null, latitude || null, longitude || null,
                 main_phone || null, main_email || null, website || null, existing[0].id]
            );
        }

        res.json({ message: 'Municipality info updated' });
    } catch (error) {
        console.error('updateInfo error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== WORKING HOURS ===============

exports.getHours = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM working_hours ORDER BY sort_order ASC');
        res.json({ hours: rows });
    } catch (error) {
        console.error('getHours error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateHours = async (req, res) => {
    try {
        const { hours } = req.body;

        if (!Array.isArray(hours)) {
            return res.status(400).json({ message: 'Hours array is required' });
        }

        // Update each day individually
        for (const h of hours) {
            await db.query(
                `UPDATE working_hours
                 SET open_time = ?, close_time = ?, is_closed = ?
                 WHERE day_of_week = ?`,
                [h.is_closed ? null : (h.open_time || null),
                 h.is_closed ? null : (h.close_time || null),
                 h.is_closed ? 1 : 0,
                 h.day_of_week]
            );
        }

        res.json({ message: 'Working hours updated' });
    } catch (error) {
        console.error('updateHours error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== DEPARTMENTS (full CRUD) ===============

exports.getDepartments = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM departments ORDER BY sort_order ASC, id ASC');
        res.json({ departments: rows });
    } catch (error) {
        console.error('getDepartments error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createDepartment = async (req, res) => {
    try {
        const { name, description, phone, email, sort_order } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Department name is required' });
        }

        const [result] = await db.query(
            `INSERT INTO departments (name, description, phone, email, sort_order)
             VALUES (?, ?, ?, ?, ?)`,
            [name.trim(), description || null, phone || null, email || null, sort_order || 0]
        );

        res.status(201).json({ message: 'Department created', id: result.insertId });
    } catch (error) {
        console.error('createDepartment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, phone, email, sort_order } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ message: 'Department name is required' });
        }

        const [result] = await db.query(
            `UPDATE departments
             SET name = ?, description = ?, phone = ?, email = ?, sort_order = ?
             WHERE id = ?`,
            [name.trim(), description || null, phone || null, email || null, sort_order || 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json({ message: 'Department updated' });
    } catch (error) {
        console.error('updateDepartment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM departments WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Department not found' });
        }

        res.json({ message: 'Department deleted' });
    } catch (error) {
        console.error('deleteDepartment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== EMERGENCY CONTACTS (full CRUD) ===============

exports.getEmergency = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM emergency_contacts ORDER BY sort_order ASC, id ASC');
        res.json({ emergency: rows });
    } catch (error) {
        console.error('getEmergency error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createEmergency = async (req, res) => {
    try {
        const { name, number, icon, sort_order } = req.body;

        if (!name || !number) {
            return res.status(400).json({ message: 'Name and number are required' });
        }

        const [result] = await db.query(
            `INSERT INTO emergency_contacts (name, number, icon, sort_order)
             VALUES (?, ?, ?, ?)`,
            [name.trim(), number.trim(), icon || '🚨', sort_order || 0]
        );

        res.status(201).json({ message: 'Emergency contact created', id: result.insertId });
    } catch (error) {
        console.error('createEmergency error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, number, icon, sort_order } = req.body;

        if (!name || !number) {
            return res.status(400).json({ message: 'Name and number are required' });
        }

        const [result] = await db.query(
            `UPDATE emergency_contacts
             SET name = ?, number = ?, icon = ?, sort_order = ?
             WHERE id = ?`,
            [name.trim(), number.trim(), icon || '🚨', sort_order || 0, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }

        res.json({ message: 'Emergency contact updated' });
    } catch (error) {
        console.error('updateEmergency error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteEmergency = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM emergency_contacts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Emergency contact not found' });
        }

        res.json({ message: 'Emergency contact deleted' });
    } catch (error) {
        console.error('deleteEmergency error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


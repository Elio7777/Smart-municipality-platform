// controllers/serviceRequests.js
// Handles service requests — citizens submit, admins respond with files

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper to delete a file from /uploads
function deleteFileByPath(publicPath) {
    if (!publicPath || !publicPath.startsWith('/uploads/')) return;
    const filename = publicPath.replace('/uploads/', '');
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') console.warn('File cleanup:', err.message);
    });
}

// =============== CITIZEN: SUBMIT REQUEST ===============
exports.submitRequest = async (req, res) => {
    try {
        const citizenId = req.citizen.id;
        const { description } = req.body;

        if (!description || description.trim().length < 5) {
            return res.status(400).json({ message: 'Please describe what you need (at least 5 characters)' });
        }

        const [result] = await db.query(
            'INSERT INTO service_requests (citizen_id, description, status) VALUES (?, ?, ?)',
            [citizenId, description.trim(), 'pending']
        );

        res.status(201).json({
            message: 'Request submitted successfully',
            request_id: result.insertId
        });
    } catch (error) {
        console.error('submitRequest error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== CITIZEN: LIST MY REQUESTS ===============
exports.getMyRequests = async (req, res) => {
    try {
        const citizenId = req.citizen.id;

        const [rows] = await db.query(
            `SELECT
                sr.id, sr.description, sr.status,
                sr.document_file, sr.document_filename,
                sr.admin_message, sr.created_at, sr.updated_at,
                a.first_name AS admin_first_name, a.last_name AS admin_last_name,
                a.position AS admin_position
             FROM service_requests sr
             LEFT JOIN admins a ON sr.handled_by = a.id
             WHERE sr.citizen_id = ?
             ORDER BY sr.created_at DESC`,
            [citizenId]
        );

        res.json({ requests: rows });
    } catch (error) {
        console.error('getMyRequests error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== CITIZEN: DELETE OWN PENDING REQUEST ===============
exports.deleteMyRequest = async (req, res) => {
    try {
        const citizenId = req.citizen.id;
        const { id } = req.params;

        // Only allow delete if status is pending
        const [check] = await db.query(
            'SELECT status FROM service_requests WHERE id = ? AND citizen_id = ?',
            [id, citizenId]
        );

        if (check.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }
        if (check[0].status !== 'pending') {
            return res.status(403).json({ message: 'Cannot delete: admin has already responded' });
        }

        await db.query('DELETE FROM service_requests WHERE id = ?', [id]);
        res.json({ message: 'Request deleted' });
    } catch (error) {
        console.error('deleteMyRequest error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== ADMIN: LIST ALL REQUESTS ===============
exports.getAllRequests = async (req, res) => {
    try {
        const { status, search } = req.query;

        let where = '1=1';
        const params = [];

        if (status) {
            where += ' AND sr.status = ?';
            params.push(status);
        }
        if (search) {
            where += ' AND (sr.description LIKE ? OR cit.first_name LIKE ? OR cit.last_name LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }

        const [rows] = await db.query(
            `SELECT
                sr.id, sr.description, sr.status,
                sr.document_file, sr.document_filename,
                sr.admin_message, sr.created_at, sr.updated_at,
                cit.first_name AS citizen_first_name,
                cit.last_name AS citizen_last_name,
                cit.email AS citizen_email,
                cit.phone AS citizen_phone
             FROM service_requests sr
             JOIN citizens cit ON sr.citizen_id = cit.id
             WHERE ${where}
             ORDER BY
                CASE WHEN sr.status = 'pending' THEN 0 ELSE 1 END,
                sr.created_at DESC`,
            params
        );

        res.json({ requests: rows });
    } catch (error) {
        console.error('getAllRequests error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== ADMIN: GET ONE REQUEST ===============
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(
            `SELECT
                sr.*,
                cit.first_name AS citizen_first_name,
                cit.last_name AS citizen_last_name,
                cit.email AS citizen_email,
                cit.phone AS citizen_phone
             FROM service_requests sr
             JOIN citizens cit ON sr.citizen_id = cit.id
             WHERE sr.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.json({ request: rows[0] });
    } catch (error) {
        console.error('getRequestById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// =============== ADMIN: RESPOND WITH DOCUMENT ===============
exports.respondToRequest = async (req, res) => {
    try {
        const adminId = req.admin.id;
        const { id } = req.params;
        const { admin_message } = req.body;

        // File is required for the response
        if (!req.file) {
            return res.status(400).json({ message: 'Please attach a document file' });
        }

        // Get current document so we can clean it up if replacing
        const [existing] = await db.query(
            'SELECT document_file FROM service_requests WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            // Clean up the just-uploaded file
            deleteFileByPath(`/uploads/${req.file.filename}`);
            return res.status(404).json({ message: 'Request not found' });
        }

        // Delete old file if any
        if (existing[0].document_file) {
            deleteFileByPath(existing[0].document_file);
        }

        const newFilePath = `/uploads/${req.file.filename}`;
        const originalFilename = req.file.originalname;

        await db.query(
            `UPDATE service_requests
             SET status = 'ready',
                 document_file = ?,
                 document_filename = ?,
                 admin_message = ?,
                 handled_by = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newFilePath, originalFilename, admin_message ? admin_message.trim() : null, adminId, id]
        );

        res.json({ message: 'Response sent — request marked as ready' });
    } catch (error) {
        console.error('respondToRequest error:', error);
        if (req.file) deleteFileByPath(`/uploads/${req.file.filename}`);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
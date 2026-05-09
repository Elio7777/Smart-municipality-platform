// controllers/reports.js
// Handles report submission, listing, single view, and deletion

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// ================ GET ALL CATEGORIES (for the form dropdown) ================
exports.getCategories = async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, name, description, icon FROM categories ORDER BY name ASC'
        );
        res.json({ categories: rows });
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ SUBMIT A NEW REPORT ================
exports.submitReport = async (req, res) => {
    try {
        const citizen_id = req.citizen.id;
        const { category_id, title, description, latitude, longitude, severity } = req.body;
        const photo = req.file ? `/uploads/${req.file.filename}` : null;

        // 1. Validate required fields
        if (!category_id || !title || !description || !latitude || !longitude) {
            // If a photo was uploaded but other validation fails, delete it (no orphan files)
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Validate photo (required per project spec)
        if (!photo) {
            return res.status(400).json({ message: 'Photo is required' });
        }

        // 3. Validate title length
        if (title.length > 100) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Title too long (max 100 chars)' });
        }

        // 4. Validate severity
        const validSeverity = ['low', 'medium', 'high'];
        const finalSeverity = severity && validSeverity.includes(severity) ? severity : 'medium';

        // 5. Verify category exists
        const [categoryCheck] = await db.query(
            'SELECT id FROM categories WHERE id = ?',
            [category_id]
        );
        if (categoryCheck.length === 0) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid category' });
        }

        // 6. Insert into database
        const [result] = await db.query(
            `INSERT INTO reports (citizen_id, category_id, title, description, photo, latitude, longitude, severity)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [citizen_id, category_id, title.trim(), description.trim(), photo, latitude, longitude, finalSeverity]
        );

        res.status(201).json({
            message: 'Report submitted successfully',
            report: {
                id: result.insertId,
                title: title.trim(),
                photo
            }
        });

    } catch (error) {
        console.error('submitReport error:', error);
        // Clean up uploaded file if DB operation failed
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch { /* swallow cleanup error */ }
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET MY REPORTS (citizen's own reports with filters) ================
exports.getMyReports = async (req, res) => {
    try {
        const citizen_id = req.citizen.id;
        const { status, category_id, search } = req.query;

        // Build dynamic WHERE clause
        let where = 'r.citizen_id = ?';
        const params = [citizen_id];

        if (status) {
            where += ' AND r.status = ?';
            params.push(status);
        }
        if (category_id) {
            where += ' AND r.category_id = ?';
            params.push(category_id);
        }
        if (search) {
            where += ' AND (r.title LIKE ? OR r.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const [rows] = await db.query(
            `SELECT
                r.id, r.title, r.description, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at, r.updated_at,
                c.name AS category_name, c.icon AS category_icon
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json({ reports: rows });

    } catch (error) {
        console.error('getMyReports error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET MY REPORT STATS (for the home sidebar) ================
exports.getMyStats = async (req, res) => {
    try {
        const citizen_id = req.citizen.id;

        const [rows] = await db.query(
            `SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status IN ('review', 'progress') THEN 1 ELSE 0 END) AS in_progress,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
             FROM reports
             WHERE citizen_id = ?`,
            [citizen_id]
        );

        const stats = rows[0];
        res.json({
            total: parseInt(stats.total) || 0,
            pending: parseInt(stats.pending) || 0,
            in_progress: parseInt(stats.in_progress) || 0,
            resolved: parseInt(stats.resolved) || 0
        });

    } catch (error) {
        console.error('getMyStats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET SINGLE REPORT (with admin responses) ================
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;
        const citizen_id = req.citizen.id;

        // 1. Fetch report (only if it belongs to this citizen)
        const [reportRows] = await db.query(
            `SELECT
                r.id, r.title, r.description, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at, r.updated_at,
                c.name AS category_name, c.icon AS category_icon
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             WHERE r.id = ? AND r.citizen_id = ?`,
            [id, citizen_id]
        );

        if (reportRows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // 2. Fetch admin responses for this report
        const [responses] = await db.query(
            `SELECT
                rr.id, rr.message, rr.created_at,
                a.first_name, a.last_name, a.position
             FROM report_responses rr
             JOIN admins a ON rr.admin_id = a.id
             WHERE rr.report_id = ?
             ORDER BY rr.created_at ASC`,
            [id]
        );

        res.json({
            report: reportRows[0],
            responses: responses
        });

    } catch (error) {
        console.error('getReportById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ DELETE REPORT (only if status is still 'submitted') ================
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const citizen_id = req.citizen.id;

        // 1. Find the report and check ownership + status
        const [rows] = await db.query(
            'SELECT photo, status, citizen_id FROM reports WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const report = rows[0];

        if (report.citizen_id !== citizen_id) {
            return res.status(403).json({ message: 'You can only delete your own reports' });
        }

        if (report.status !== 'submitted') {
            return res.status(403).json({
                message: 'You can only delete reports that are still in submitted status'
            });
        }

        // 2. Delete the report (responses cascade automatically? — actually no, no cascade set)
        // First delete dependent responses, then the report
        await db.query('DELETE FROM report_responses WHERE report_id = ?', [id]);
        await db.query('DELETE FROM reports WHERE id = ?', [id]);

        // 3. Delete the photo file from disk
        if (report.photo) {
            const photoPath = path.join(__dirname, '..', report.photo);
            if (fs.existsSync(photoPath)) {
                try { fs.unlinkSync(photoPath); } catch (e) {
                    console.warn('Failed to delete photo file:', e.message);
                }
            }
        }

        res.json({ message: 'Report deleted' });

    } catch (error) {
        console.error('deleteReport error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// ================ GET ALL PUBLIC REPORTS (everyone's reports for the map) ================
exports.getPublicReports = async (req, res) => {
    try {
        const { status, category_id } = req.query;

        let where = '1=1';
        const params = [];

        if (status) {
            where += ' AND r.status = ?';
            params.push(status);
        }
        if (category_id) {
            where += ' AND r.category_id = ?';
            params.push(category_id);
        }

        const [rows] = await db.query(
            `SELECT
                r.id, r.title, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at,
                c.name AS category_name, c.icon AS category_icon
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json({ reports: rows });
    } catch (error) {
        console.error('getPublicReports error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET PUBLIC REPORT BY ID ================
exports.getPublicReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const [reportRows] = await db.query(
            `SELECT
                r.id, r.title, r.description, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at, r.updated_at,
                c.name AS category_name, c.icon AS category_icon,
                cit.first_name AS author_first_name, cit.last_name AS author_last_name
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             JOIN citizens cit ON r.citizen_id = cit.id
             WHERE r.id = ?`,
            [id]
        );

        if (reportRows.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const [responses] = await db.query(
            `SELECT
                rr.id, rr.message, rr.created_at,
                a.first_name, a.last_name, a.position
             FROM report_responses rr
             JOIN admins a ON rr.admin_id = a.id
             WHERE rr.report_id = ?
             ORDER BY rr.created_at ASC`,
            [id]
        );

        res.json({
            report: reportRows[0],
            responses: responses
        });
    } catch (error) {
        console.error('getPublicReportById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
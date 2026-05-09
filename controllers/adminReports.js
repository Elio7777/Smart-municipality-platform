// controllers/adminReports.js
// Admin endpoints for managing reports

const db = require('../config/db');

// ================ GET ALL REPORTS (with filters) ================
exports.getAllReports = async (req, res) => {
    try {
        const { status, category_id, search } = req.query;

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
        if (search) {
            where += ' AND (r.title LIKE ? OR r.description LIKE ? OR cit.first_name LIKE ? OR cit.last_name LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }

        const [rows] = await db.query(
            `SELECT
                r.id, r.title, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at,
                c.name AS category_name, c.icon AS category_icon,
                cit.first_name AS citizen_first_name, cit.last_name AS citizen_last_name,
                cit.email AS citizen_email
             FROM reports r
             JOIN categories c ON r.category_id = c.id
             JOIN citizens cit ON r.citizen_id = cit.id
             WHERE ${where}
             ORDER BY r.created_at DESC`,
            params
        );

        res.json({ reports: rows });
    } catch (error) {
        console.error('getAllReports error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET ONE REPORT BY ID (with full details) ================
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        const [reportRows] = await db.query(
            `SELECT
                r.id, r.title, r.description, r.photo, r.latitude, r.longitude,
                r.status, r.severity, r.created_at, r.updated_at,
                c.id AS category_id, c.name AS category_name, c.icon AS category_icon,
                cit.id AS citizen_id, cit.first_name AS citizen_first_name,
                cit.last_name AS citizen_last_name, cit.email AS citizen_email,
                cit.phone AS citizen_phone
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
        console.error('getReportById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ UPDATE REPORT STATUS ================
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['submitted', 'review', 'progress', 'resolved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [result] = await db.query(
            'UPDATE reports SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        res.json({ message: 'Status updated', status });
    } catch (error) {
        console.error('updateStatus error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ ADD ADMIN RESPONSE ================
exports.addResponse = async (req, res) => {
    try {
        const { id } = req.params;     // report id
        const { message } = req.body;
        const adminId = req.admin.id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ message: 'Response message is required' });
        }

        // Verify the report exists
        const [reportCheck] = await db.query('SELECT id FROM reports WHERE id = ?', [id]);
        if (reportCheck.length === 0) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Insert the response
        const [result] = await db.query(
            'INSERT INTO report_responses (report_id, admin_id, message) VALUES (?, ?, ?)',
            [id, adminId, message.trim()]
        );

        res.status(201).json({
            message: 'Response added',
            response_id: result.insertId
        });
    } catch (error) {
        console.error('addResponse error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
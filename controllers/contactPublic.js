// controllers/contactPublic.js
// Public read-only endpoint — citizens fetch all contact info in one call

const db = require('../config/db');

exports.getAllInfo = async (req, res) => {
    try {
        // Run all queries in parallel for speed
        const [
            [infoRows],
            [hoursRows],
            [deptRows],
            [emergencyRows]
        ] = await Promise.all([
            db.query('SELECT * FROM municipality_info LIMIT 1'),
            db.query('SELECT * FROM working_hours ORDER BY sort_order ASC'),
            db.query('SELECT * FROM departments ORDER BY sort_order ASC, id ASC'),
            db.query('SELECT * FROM emergency_contacts ORDER BY sort_order ASC, id ASC')
        ]);

        res.json({
            info: infoRows[0] || null,
            hours: hoursRows,
            departments: deptRows,
            emergency: emergencyRows
        });
    } catch (error) {
        console.error('getAllInfo error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
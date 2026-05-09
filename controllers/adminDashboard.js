// controllers/adminDashboard.js
// Aggregated platform stats for the admin dashboard

const db = require('../config/db');

exports.getStats = async (req, res) => {
    try {
        // Run all stat queries in parallel for speed
        const [
            [reportsByStatus],
            [citizensCount],
            [newsCount]
        ] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) AS pending,
                    SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS reviewing,
                    SUM(CASE WHEN status = 'progress' THEN 1 ELSE 0 END) AS in_progress,
                    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved
                FROM reports
            `),
            db.query('SELECT COUNT(*) AS count FROM citizens'),
            db.query('SELECT COUNT(*) AS count FROM news')
        ]);

        const reportStats = reportsByStatus[0] || {};

        res.json({
            total_reports: Number(reportStats.total || 0),
            pending_reports: Number(reportStats.pending || 0),
            reviewing_reports: Number(reportStats.reviewing || 0),
            in_progress_reports: Number(reportStats.in_progress || 0),
            resolved_reports: Number(reportStats.resolved || 0),
            total_citizens: Number(citizensCount[0]?.count || 0),
            total_news: Number(newsCount[0]?.count || 0)
        });

    } catch (error) {
        console.error('getStats error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
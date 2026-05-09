// controllers/news.js
// Handles news listing, single news with comments, and comment management

const db = require('../config/db');

// ================ GET ALL NEWS ================
exports.getAllNews = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, title, content, image, category, department, created_at
             FROM news
             ORDER BY created_at DESC`
        );
        res.json({ news: rows });
    } catch (error) {
        console.error('getAllNews error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET SINGLE NEWS (with comments) ================
exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Fetch the news article
        const [newsRows] = await db.query(
            `SELECT id, title, content, image, category, department, created_at
             FROM news
             WHERE id = ?`,
            [id]
        );

        if (newsRows.length === 0) {
            return res.status(404).json({ message: 'News article not found' });
        }

        // 2. Fetch comments + citizen info (JOIN)
        const [comments] = await db.query(
            `SELECT
                nc.id,
                nc.content,
                nc.created_at,
                nc.citizen_id,
                c.first_name,
                c.last_name
             FROM news_comments nc
             JOIN citizens c ON nc.citizen_id = c.id
             WHERE nc.news_id = ?
             ORDER BY nc.created_at DESC`,
            [id]
        );

        res.json({
            news: newsRows[0],
            comments: comments
        });
    } catch (error) {
        console.error('getNewsById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ ADD COMMENT (auth required) ================
exports.addComment = async (req, res) => {
    try {
        const { id } = req.params; // news id
        const { content } = req.body;
        const citizen_id = req.citizen.id; // from JWT middleware

        // Validate
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: 'Comment cannot be empty' });
        }

        if (content.length > 1000) {
            return res.status(400).json({ message: 'Comment too long (max 1000 chars)' });
        }

        // Verify news exists
        const [newsCheck] = await db.query(
            'SELECT id FROM news WHERE id = ?',
            [id]
        );
        if (newsCheck.length === 0) {
            return res.status(404).json({ message: 'News article not found' });
        }

        // Insert comment
        const [result] = await db.query(
            `INSERT INTO news_comments (news_id, citizen_id, content)
             VALUES (?, ?, ?)`,
            [id, citizen_id, content.trim()]
        );

        // Fetch the new comment with citizen info to return
        const [newComment] = await db.query(
            `SELECT
                nc.id,
                nc.content,
                nc.created_at,
                nc.citizen_id,
                c.first_name,
                c.last_name
             FROM news_comments nc
             JOIN citizens c ON nc.citizen_id = c.id
             WHERE nc.id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Comment added',
            comment: newComment[0]
        });
    } catch (error) {
        console.error('addComment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ DELETE COMMENT (own only) ================
exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const citizen_id = req.citizen.id;

        // Check the comment belongs to this citizen
        const [comment] = await db.query(
            'SELECT citizen_id FROM news_comments WHERE id = ?',
            [commentId]
        );

        if (comment.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment[0].citizen_id !== citizen_id) {
            return res.status(403).json({ message: 'You can only delete your own comments' });
        }

        // Delete
        await db.query('DELETE FROM news_comments WHERE id = ?', [commentId]);

        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('deleteComment error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
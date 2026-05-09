// controllers/adminNews.js
// Admin endpoints for managing news articles

const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper: convert uploaded file to a public URL path
function fileToPath(file) {
    if (!file) return null;
    // file.filename is like "image-1234567890-123.jpg"
    return `/uploads/${file.filename}`;
}

// Helper: delete a file by its public path (e.g., "/uploads/foo.jpg")
function deleteFileByPath(publicPath) {
    if (!publicPath || !publicPath.startsWith('/uploads/')) return;
    const filename = publicPath.replace('/uploads/', '');
    const fullPath = path.join(__dirname, '..', 'uploads', filename);
    fs.unlink(fullPath, (err) => {
        if (err && err.code !== 'ENOENT') console.warn('Couldn\'t delete file:', err.message);
    });
}

// ================ GET ALL NEWS ================
exports.getAllNews = async (req, res) => {
    try {
        const { search } = req.query;
        let where = '1=1';
        const params = [];

        if (search) {
            where += ' AND (title LIKE ? OR content LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like);
        }

        const [rows] = await db.query(
            `SELECT id, title, excerpt, image, category, created_at, updated_at
             FROM news WHERE ${where}
             ORDER BY created_at DESC`,
            params
        );
        res.json({ news: rows });
    } catch (error) {
        console.error('getAllNews error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ GET ONE ================
exports.getNewsById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM news WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'News article not found' });
        }
        res.json({ article: rows[0] });
    } catch (error) {
        console.error('getNewsById error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ CREATE ================
exports.createNews = async (req, res) => {
    try {
        const { title, content, excerpt, category } = req.body;

        if (!title || !content) {
            // Clean up uploaded file if validation fails
            if (req.file) deleteFileByPath(fileToPath(req.file));
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const imagePath = fileToPath(req.file);

        const [result] = await db.query(
            `INSERT INTO news (title, content, excerpt, image, category)
             VALUES (?, ?, ?, ?, ?)`,
            [
                title.trim(),
                content.trim(),
                excerpt ? excerpt.trim() : null,
                imagePath,
                category ? category.trim() : null
            ]
        );

        res.status(201).json({
            message: 'News article created',
            article_id: result.insertId
        });
    } catch (error) {
        console.error('createNews error:', error);
        if (req.file) deleteFileByPath(fileToPath(req.file));
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ UPDATE ================
exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, excerpt, category, remove_image } = req.body;

        if (!title || !content) {
            if (req.file) deleteFileByPath(fileToPath(req.file));
            return res.status(400).json({ message: 'Title and content are required' });
        }

        // Get current image to know what to clean up
        const [existing] = await db.query('SELECT image FROM news WHERE id = ?', [id]);
        if (existing.length === 0) {
            if (req.file) deleteFileByPath(fileToPath(req.file));
            return res.status(404).json({ message: 'News article not found' });
        }

        const oldImage = existing[0].image;

        // Determine the new image path:
        let newImage = oldImage;     // keep existing by default
        if (req.file) {
            newImage = fileToPath(req.file);   // new upload replaces old
            if (oldImage) deleteFileByPath(oldImage);
        } else if (remove_image === 'true') {
            newImage = null;                   // user removed without replacing
            if (oldImage) deleteFileByPath(oldImage);
        }

        await db.query(
            `UPDATE news
             SET title = ?, content = ?, excerpt = ?, image = ?, category = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                title.trim(),
                content.trim(),
                excerpt ? excerpt.trim() : null,
                newImage,
                category ? category.trim() : null,
                id
            ]
        );

        res.json({ message: 'News article updated' });
    } catch (error) {
        console.error('updateNews error:', error);
        if (req.file) deleteFileByPath(fileToPath(req.file));
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ DELETE ================
exports.deleteNews = async (req, res) => {
    try {
        const { id } = req.params;

        // Get image path so we can delete the file too
        const [existing] = await db.query('SELECT image FROM news WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'News article not found' });
        }

        const [result] = await db.query('DELETE FROM news WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'News article not found' });
        }

        // Clean up associated file
        if (existing[0].image) deleteFileByPath(existing[0].image);

        res.json({ message: 'News article deleted' });
    } catch (error) {
        console.error('deleteNews error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
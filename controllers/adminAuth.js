// controllers/adminAuth.js
// Handles admin login (no public registration — admins are pre-created)

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ================ LOGIN ================
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // 1. Validate input
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Email/employee ID and password are required' });
        }

        // 2. Find admin by email OR employee_id (admins can log in with either)
        const [rows] = await db.query(
            'SELECT * FROM admins WHERE email = ? OR employee_id = ?',
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = rows[0];

        // 3. Compare passwords with bcrypt
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Create JWT with role: 'admin' baked in
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                employee_id: admin.employee_id,
                role: 'admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 5. Send token + admin info (NEVER send the password back)
        res.json({
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                employee_id: admin.employee_id,
                first_name: admin.first_name,
                last_name: admin.last_name,
                email: admin.email,
                position: admin.position
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
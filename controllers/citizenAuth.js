// controllers/citizenAuth.js
// Handles citizen registration and login

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ================ REGISTER ================
// Validation rules below mirror the frontend (Register.jsx) so direct
// API calls (Postman, curl, etc.) cannot bypass them.
const NAME_RE = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidInternationalPhone(value) {
    if (typeof value !== 'string') return false;
    if (!/^\+[\d\s\-()]+$/.test(value)) return false;
    const digits = value.slice(1).replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
}

exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password } = req.body;

        // 1. Basic validation: all fields required
        if (!first_name || !last_name || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // 2. Validate names: letters only, 2-50 chars
        const fn = String(first_name).trim();
        const ln = String(last_name).trim();
        if (fn.length < 2 || fn.length > 50 || !NAME_RE.test(fn)) {
            return res.status(400).json({
                message: 'First name must be 2-50 letters only'
            });
        }
        if (ln.length < 2 || ln.length > 50 || !NAME_RE.test(ln)) {
            return res.status(400).json({
                message: 'Last name must be 2-50 letters only'
            });
        }

        // 3. Validate email format
        if (!EMAIL_RE.test(String(email).trim())) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // 4. Validate phone: international format (+countrycode + 8-15 digits)
        if (!isValidInternationalPhone(String(phone).trim())) {
            return res.status(400).json({
                message: 'Phone must be in international format (e.g. +961 70 123 456)'
            });
        }

        // 5. Validate password length (min 8 chars)
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // 6. Check if email or phone already exists
        const [existing] = await db.query(
            'SELECT id FROM citizens WHERE email = ? OR phone = ?',
            [email, phone]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email or phone already registered' });
        }

        // 7. Hash the password (10 rounds = good balance)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 8. Insert into database
        // Note: is_verified set to TRUE for now (we'll add email verification later)
        const [result] = await db.query(
            `INSERT INTO citizens (first_name, last_name, email, phone, password, is_verified)
             VALUES (?, ?, ?, ?, ?, TRUE)`,
            [fn, ln, String(email).trim(), String(phone).trim(), hashedPassword]
        );

        // 9. Send success response
        res.status(201).json({
            message: 'Registration successful',
            citizen: {
                id: result.insertId,
                first_name: fn,
                last_name: ln,
                email: String(email).trim()
            }
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ LOGIN ================
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        // identifier can be email or phone (with or without country code)

        // 1. Validate input
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Email/phone and password are required' });
        }

        const id = String(identifier).trim();

        // 2. Find the citizen.
        // Email match is exact. Phone match is flexible: we strip non-digits
        // from both sides and accept either an exact match or a trailing
        // match (so "70123456" finds the user stored as "+961 70 123 456").
        let citizen = null;

        // Try exact email match first
        const [emailRows] = await db.query(
            'SELECT * FROM citizens WHERE email = ?',
            [id]
        );
        if (emailRows.length > 0) {
            citizen = emailRows[0];
        } else {
            // Phone match: extract digits and look for any phone whose
            // digits equal them or end with them (length >= 6 to avoid
            // ridiculously short matches).
            const digits = id.replace(/\D/g, '');
            if (digits.length >= 6) {
                // Pull all citizens (small table for a municipality app)
                // and compare digit-only forms.
                const [allRows] = await db.query(
                    'SELECT * FROM citizens WHERE phone IS NOT NULL'
                );
                citizen = allRows.find((c) => {
                    const stored = String(c.phone || '').replace(/\D/g, '');
                    return stored === digits || stored.endsWith(digits);
                }) || null;
            }
        }

        if (!citizen) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 3. Compare passwords
        const isMatch = await bcrypt.compare(password, citizen.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 4. Check if account is verified (for future email verification)
        if (!citizen.is_verified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        // 5. Create JWT token
        const token = jwt.sign(
            { id: citizen.id, email: citizen.email, role: 'citizen' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // 6. Send token + basic citizen info (NEVER send password, even hashed)
        res.json({
            message: 'Login successful',
            token,
            citizen: {
                id: citizen.id,
                first_name: citizen.first_name,
                last_name: citizen.last_name,
                email: citizen.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ================ RESET PASSWORD (forgot password) ================
// Identity-check reset: caller must supply BOTH the registered email
// and registered phone for the same account. If both match an existing
// citizen, the password is replaced. We use a single generic error
// message on failure to avoid leaking which field was wrong.
exports.resetPassword = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!email || !phone || !password) {
            return res.status(400).json({
                message: 'Email, phone, and new password are required'
            });
        }

        // Format checks (same rules as register)
        if (!EMAIL_RE.test(String(email).trim())) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        if (!isValidInternationalPhone(String(phone).trim())) {
            return res.status(400).json({
                message: 'Phone must be in international format (e.g. +961 70 123 456)'
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters'
            });
        }

        const cleanEmail = String(email).trim();

        // Find by email (exact). We then verify the phone matches by
        // digit-only comparison so user-entered formatting variations
        // don't cause false negatives.
        const [rows] = await db.query(
            'SELECT id, phone FROM citizens WHERE email = ?',
            [cleanEmail]
        );
        if (rows.length === 0) {
            return res.status(404).json({
                message: 'No account matches the provided email and phone'
            });
        }

        const inputDigits = String(phone).replace(/\D/g, '');
        const match = rows.find((c) => {
            const stored = String(c.phone || '').replace(/\D/g, '');
            return stored === inputDigits || stored.endsWith(inputDigits);
        });

        if (!match) {
            return res.status(404).json({
                message: 'No account matches the provided email and phone'
            });
        }

        // Hash the new password and update
        const hashed = await bcrypt.hash(password, 10);
        await db.query(
            'UPDATE citizens SET password = ? WHERE id = ?',
            [hashed, match.id]
        );

        res.json({ message: 'Password reset successful. You can now log in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
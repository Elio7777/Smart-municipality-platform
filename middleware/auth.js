// middleware/auth.js
// Verifies JWT and attaches citizen info to req

const jwt = require('jsonwebtoken');

exports.requireCitizen = (req, res, next) => {
    try {
        // Get token from Authorization header: "Bearer eyJ..."
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify and decode
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'citizen') {
            return res.status(403).json({ message: 'Citizen access only' });
        }

        // Attach citizen info to the request
        req.citizen = { id: decoded.id, email: decoded.email };

        next(); // pass to next handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.requireAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        // Verify signature + decode payload
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // CRITICAL: must be admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access only' });
        }

        // Attach admin info to the request for the next handler
        req.admin = {
            id: decoded.id,
            email: decoded.email,
            employee_id: decoded.employee_id
        };

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
};
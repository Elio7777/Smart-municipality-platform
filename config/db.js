// config/db.js
// Database connection for Smart Municipality Platform

const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool — better than a single connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use promise-based queries (async/await friendly)
const db = pool.promise();

// Test the connection on startup
db.getConnection()
    .then(connection => {
        console.log('✅ Connected to MySQL database:', process.env.DB_NAME);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = db;
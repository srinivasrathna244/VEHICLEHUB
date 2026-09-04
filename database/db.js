require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bikehub",
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

const promisePool = pool.promise();

// Test initial connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL Pool Connection Failed:", err.message);
    } else {
        console.log("✅ MySQL Connection Pool initialized successfully");
        connection.release();
    }
});

module.exports = {
    pool,
    promisePool,
    query: (sql, params) => promisePool.query(sql, params),
    execute: (sql, params) => promisePool.execute(sql, params)
};
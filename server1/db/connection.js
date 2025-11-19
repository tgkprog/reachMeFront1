/**
 * Database Connection and Query Functions
 * MariaDB connection using mysql2
 */

const mysql = require("mysql2/promise");

let pool = null;

/**
 * Initialize database connection pool
 */
function initDB() {
  if (pool) return pool;

  pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "reachme_user",
    password: process.env.DB_PWD, // DB_PWD from environment-specific .env
    database: process.env.DB_NAME || "reachme_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: "+00:00", // Use UTC for all timestamp operations
  });

  console.log("✅ Database connection pool initialized");
  return pool;
}

/**
 * Get database connection
 */
function getDB() {
  if (!pool) {
    return initDB();
  }
  return pool;
}

/**
 * Execute query
 */
async function query(sql, params = []) {
  const db = getDB();
  return await db.execute(sql, params);
}

/**
 * Close database connection
 */
async function closeDB() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connection closed");
  }
}

module.exports = {
  initDB,
  getDB,
  query,
  closeDB,
};

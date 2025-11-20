// src/db/sqlite.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { promisify } = require("util");

let db = null;

async function initSqlite() {
  if (db) return db;
  const filename =
    process.env.SQLITE_FILE ||
    path.join(__dirname, "..", "..", "db", "reachme.sqlite");

  // Create sqlite3 Database and promisify its methods to match the `sqlite` open() API used elsewhere
  const conn = new sqlite3.Database(filename);

  // Promisified helpers
  conn.getAsync = promisify(conn.get).bind(conn);
  conn.allAsync = promisify(conn.all).bind(conn);
  conn.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      conn.run(sql, params, function (err) {
        if (err) return reject(err);
        // mimic sqlite `run` result with lastID and changes
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };

  // Expose promise-style methods
  db = {
    get: conn.getAsync,
    all: conn.allAsync,
    run: conn.runAsync,
  };

  return db;
}

// Generic execute/query wrappers to emulate mysql2 behaviour
async function execute(sql, params = []) {
  const d = await initSqlite();
  const trimmed = sql.trim().toLowerCase();
  if (trimmed.startsWith("select") || trimmed.startsWith("with")) {
    const rows = await d.all(sql, params);
    return [rows, undefined];
  }
  // run for insert/update/delete
  const res = await d.run(sql, params);
  // emulate mysql2 result shape
  const result = { insertId: res.lastID, affectedRows: res.changes };
  return [result, undefined];
}

async function query(sql, params = []) {
  // query behaves same as execute for our usage
  return execute(sql, params);
}

async function getUserByEmail(email) {
  const d = await initSqlite();
  const row = await d.get("SELECT * FROM users WHERE email = ? LIMIT 1", [
    email,
  ]);
  return row || null;
}

async function getUserById(id) {
  const d = await initSqlite();
  const row = await d.get(
    "SELECT id, email, first_name, last_name, account_status, pwdLogin, googleOauth, USER_GOOGLE_EMAIL, admin FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return row || null;
}

async function createUser(user) {
  const d = await initSqlite();
  const res = await d.run(
    `INSERT INTO users (email, password_hash, first_name, last_name, admin, pwdLogin, account_status, googleOauth, USER_GOOGLE_EMAIL) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.email,
      user.password_hash,
      user.first_name,
      user.last_name,
      user.admin || "no",
      Boolean(user.pwdLogin),
      user.account_status || "active",
      Boolean(user.googleOauth) || false,
      user.googleEmail || null,
    ]
  );
  return res.lastID;
}

// Messages helpers (sqlite)
async function getMessageById(id) {
  const [rows] = await execute(
    `SELECT * FROM reach_me_messages WHERE id = ? LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function getMessagesForUser(userId) {
  const [rows] = await execute(
    `SELECT id, public_reachme_id, message, datetime_alarm, is_ack_app, is_ack_all, sender_info, created_at FROM reach_me_messages WHERE user_id = ? ORDER BY datetime_alarm DESC`,
    [userId]
  );
  return rows;
}

// Public reachme helpers by id
async function getPublicReachMeById(id) {
  const [rows] = await execute(
    `SELECT p.id, p.user_id, p.url_code, p.is_active, p.deactivate_at, u.email as user_email FROM pblcRechms p JOIN users u ON p.user_id = u.id WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function updatePublicReachMeById(id, userId, updates = {}) {
  const fields = [];
  const values = [];
  if (typeof updates.is_active !== "undefined") {
    fields.push("is_active = ?");
    values.push(updates.is_active);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "deactivate_at")) {
    fields.push("deactivate_at = ?");
    values.push(updates.deactivate_at === null ? null : updates.deactivate_at);
  }
  if (fields.length === 0) return 0;
  values.push(id, userId);
  const sql = `UPDATE pblcRechms SET ${fields.join(
    ", "
  )}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`;
  const [result] = await execute(sql, values);
  return result.affectedRows || 0;
}

// User listing and updates (sqlite)
async function listUsers(options = {}) {
  const params = [];
  let where = "(admin IS NULL OR admin <> ?)";
  params.push("yes");
  if (Array.isArray(options.statuses) && options.statuses.length > 0) {
    where += ` AND account_status IN (${options.statuses
      .map(() => "?")
      .join(",")})`;
    params.push(...options.statuses);
  }
  const [rows] = await execute(
    `SELECT id, email, first_name, last_name, account_status, pwdLogin, googleOauth, USER_GOOGLE_EMAIL FROM users WHERE ${where} ORDER BY created_at DESC`,
    params
  );
  return rows;
}

async function updateUserById(id, updates = {}) {
  const fields = [];
  const values = [];
  if (typeof updates.account_status !== "undefined") {
    fields.push("account_status = ?");
    values.push(updates.account_status);
  }
  if (typeof updates.pwdLogin !== "undefined") {
    fields.push("pwdLogin = ?");
    values.push(Boolean(updates.pwdLogin));
  }
  if (typeof updates.googleOauth !== "undefined") {
    fields.push("googleOauth = ?");
    values.push(Boolean(updates.googleOauth));
  }
  if (typeof updates.admin !== "undefined") {
    fields.push("admin = ?");
    values.push(updates.admin);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "googleEmail")) {
    if (updates.googleEmail) {
      fields.push("USER_GOOGLE_EMAIL = ?");
      values.push(updates.googleEmail);
    } else {
      fields.push("USER_GOOGLE_EMAIL = NULL");
    }
  }
  if (typeof updates.password_hash !== "undefined") {
    fields.push("password_hash = ?");
    values.push(updates.password_hash);
  }
  if (fields.length === 0) return 0;
  values.push(id);
  const sql = `UPDATE users SET ${fields.join(
    ", "
  )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  const [result] = await execute(sql, values);
  return result.affectedRows || 0;
}

async function getUserByGoogleEmail(googleEmail) {
  const d = await initSqlite();
  const row = await d.get(
    "SELECT * FROM users WHERE USER_GOOGLE_EMAIL = ? LIMIT 1",
    [googleEmail]
  );
  return row || null;
}

module.exports = {
  initSqlite,
  execute,
  query,
  getUserByEmail,
  createUser,
};

// Public ReachMe and messages API (sqlite)
async function getPublicReachMeCounts(userId) {
  const [rows] = await execute(
    "SELECT COUNT(*) AS totalCount FROM pblcRechms WHERE user_id = ?",
    [userId]
  );
  const totalCount = Array.isArray(rows) && rows[0] ? rows[0].totalCount : 0;
  const [rows2] = await execute(
    "SELECT COUNT(*) AS activeCount FROM pblcRechms WHERE user_id = ? AND is_active = TRUE",
    [userId]
  );
  const activeCount =
    Array.isArray(rows2) && rows2[0] ? rows2[0].activeCount : 0;
  return { totalCount: totalCount || 0, activeCount: activeCount || 0 };
}

async function createPublicReachMe(userId, urlCode, deactivateAt = null) {
  const [result] = await execute(
    `INSERT INTO pblcRechms (user_id, url_code, is_active, deactivate_at) VALUES (?, ?, TRUE, ?)`,
    [userId, urlCode, deactivateAt]
  );
  return result.insertId;
}

async function getPublicReachMeByCode(urlCode) {
  const [rows] = await execute(
    `SELECT p.id, p.user_id, p.is_active, p.deactivate_at, u.email as user_email FROM pblcRechms p JOIN users u ON p.user_id = u.id WHERE p.url_code = ? LIMIT 1`,
    [urlCode]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function deactivatePublicReachMeByCode(urlCode) {
  const [result] = await execute(
    "UPDATE pblcRechms SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE url_code = ?",
    [urlCode]
  );
  return result.affectedRows || 0;
}

async function updatePublicReachMeDeactivateAt(urlCode, deactivateAt) {
  const [result] = await execute(
    "UPDATE pblcRechms SET deactivate_at = ?, updated_at = CURRENT_TIMESTAMP WHERE url_code = ?",
    [deactivateAt, urlCode]
  );
  return result.affectedRows || 0;
}

async function listPublicReachMesForUser(userId) {
  const [rows] = await execute(
    `SELECT id, url_code, is_active, deactivate_at, created_at, updated_at FROM pblcRechms WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function insertReachMessage({
  user_id,
  public_reachme_id,
  message,
  datetime_alarm,
  sender_info,
  reached_client = false,
  sent_details = {},
  auto_deactivate_at = null,
}) {
  const [result] = await execute(
    `INSERT INTO reach_me_messages (user_id, public_reachme_id, message, datetime_alarm, sender_info, reached_client, sent_details, auto_deactivate_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      public_reachme_id,
      message,
      datetime_alarm,
      JSON.stringify(sender_info || {}),
      reached_client ? 1 : 0,
      JSON.stringify(sent_details || {}),
      auto_deactivate_at,
    ]
  );
  return result.insertId;
}

async function getRecentUnacknowledgedMessagesForUser(userId, limit = 10) {
  const [rows] = await execute(
    `SELECT m.* FROM reach_me_messages m WHERE m.user_id = ? AND m.is_ack_app = FALSE ORDER BY m.datetime_alarm DESC LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

async function acknowledgeMessageById(id, type = "app") {
  if (type === "app") {
    const [result] = await execute(
      "UPDATE reach_me_messages SET is_ack_app = TRUE WHERE id = ?",
      [id]
    );
    return result.affectedRows || 0;
  }
  if (type === "all") {
    const [result] = await execute(
      "UPDATE reach_me_messages SET is_ack_all = TRUE WHERE id = ?",
      [id]
    );
    return result.affectedRows || 0;
  }
  return 0;
}

module.exports.getPublicReachMeCounts = getPublicReachMeCounts;
module.exports.createPublicReachMe = createPublicReachMe;
module.exports.getPublicReachMeByCode = getPublicReachMeByCode;
module.exports.deactivatePublicReachMeByCode = deactivatePublicReachMeByCode;
module.exports.updatePublicReachMeDeactivateAt =
  updatePublicReachMeDeactivateAt;
module.exports.listPublicReachMesForUser = listPublicReachMesForUser;
module.exports.insertReachMessage = insertReachMessage;
module.exports.getRecentUnacknowledgedMessagesForUser =
  getRecentUnacknowledgedMessagesForUser;
module.exports.acknowledgeMessageById = acknowledgeMessageById;
module.exports.getUserByGoogleEmail = getUserByGoogleEmail;
module.exports.getMessageById = getMessageById;
module.exports.getMessagesForUser = getMessagesForUser;
module.exports.getPublicReachMeById = getPublicReachMeById;
module.exports.updatePublicReachMeById = updatePublicReachMeById;
module.exports.listUsers = listUsers;
module.exports.updateUserById = updateUserById;
async function listActivePublicReachMes() {
  const [rows] = await execute(
    `SELECT p.id, p.user_id, p.url_code, p.is_active, p.deactivate_at, u.email FROM pblcRechms p JOIN users u ON p.user_id = u.id WHERE p.is_active = TRUE`,
    []
  );
  return rows;
}

async function findDuePublicReachMes(now) {
  const [rows] = await execute(
    `SELECT url_code FROM pblcRechms WHERE is_active = TRUE AND deactivate_at IS NOT NULL AND deactivate_at <= ?`,
    [now]
  );
  return rows;
}

module.exports.listActivePublicReachMes = listActivePublicReachMes;
module.exports.findDuePublicReachMes = findDuePublicReachMes;

// Cascade delete helper for test teardown: removes messages, public reachmes, invites, and user
async function deleteUserCascade(userId) {
  // fetch user email for invites cleanup
  const user = await getUserById(userId);
  const email = user ? user.email : null;

  // remove messages and public reachmes tied to the user
  await execute("DELETE FROM reach_me_messages WHERE user_id = ?", [userId]);
  await execute("DELETE FROM pblcRechms WHERE user_id = ?", [userId]);

  // remove invites by email if available
  if (email) {
    await execute("DELETE FROM invites WHERE email = ?", [email]);
  }

  // finally remove user row
  const [result] = await execute("DELETE FROM users WHERE id = ?", [userId]);
  return result && result.affectedRows ? result.affectedRows : 0;
}

module.exports.deleteUserCascade = deleteUserCascade;

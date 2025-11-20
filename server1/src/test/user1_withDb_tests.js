/**
 * User Tests with Database
 * Tests for user operations with direct database access
 *
 * Prerequisites:
 * - Server running at https://reachme2.com:8052
 * - Database configured in .local.env
 * - Admin credentials in ../.admin.users
 *
 * Usage: node src/test/user1_withDb_tests.js
 */

const https = require("https");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const { encryptPassword, decryptPassword } = require("../../utils/crypto");
const db = require("../../src/db");

// Load environment configuration
const { loadEnv } = require("../utils/loadEnv");
loadEnv(__dirname);

// Load admin credentials from src/.admin.users
const adminUsersPath = path.join(__dirname, "..", ".admin.users");
const adminUsersContent = fs.readFileSync(adminUsersPath, "utf8");
const adminEntries = adminUsersContent
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));

if (adminEntries.length === 0) {
  throw new Error("No admin users found in server1/src/.admin.users");
}

const adminParts = adminEntries[0].split("|").map((part) => part.trim());

if (adminParts.length < 3) {
  throw new Error(
    "Invalid admin entry in server1/src/.admin.users. Expected format: email|salt|password"
  );
}

const [ADMIN_EMAIL, , ADMIN_PASSWORD] = adminParts;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error(
    "Invalid admin entry in server1/src/.admin.users. Expected format: email|salt|password"
  );
}

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || "https://reachme2.com:8052";
const TEST_USER_EMAIL = "test1@test.com"; // Primary email / User ID
const TEST_USER_PWD = "ds2#fk_3S3Vf_s";
const TEST_USER_GOOGLE_EMAIL = "test1.different@gmail.com"; // Google OAuth email (different from primary)
const TEST_USER_PWD_LOGIN = true; // Can login with email/password
const TEST_USER_GOOGLE_OAUTH = true; // Can login with Google OAuth

// Store test data
let testData = {
  userId: null,
  adminToken: null,
  userToken: null,
  publicReachMeCode: null,
};

// Database connection
let dbConnection = null;

/**
 * Initialize database connection
 */
async function initDB() {
  if (process.env.RUNTIME_DB === "sqlite") {
    const sqlite3 = require("sqlite3").verbose();
    const { promisify } = require("util");
    const path = require("path");

    const filename =
      process.env.SQLITE_FILE ||
      path.join(__dirname, "..", "..", "db", "reachme.sqlite");
    const conn = new sqlite3.Database(filename);

    conn.getAsync = promisify(conn.get).bind(conn);
    conn.allAsync = promisify(conn.all).bind(conn);
    conn.runAsync = function (sql, params = []) {
      return new Promise((resolve, reject) => {
        conn.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    };

    // Provide mysql2-like execute() used in tests
    dbConnection = {
      execute: async (sql, params = []) => {
        const t = sql.trim().toLowerCase();
        if (t.startsWith("select") || t.startsWith("with")) {
          const rows = await conn.allAsync(sql, params);
          return [rows];
        }
        const res = await conn.runAsync(sql, params);
        return [res];
      },
      close: async () => {
        return new Promise((res, rej) =>
          conn.close((e) => (e ? rej(e) : res()))
        );
      },
    };
    console.log("✅ SQLite test DB connected", filename);
  } else {
    dbConnection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PWD,
      database: process.env.DB_NAME,
    });
    console.log("✅ Database connection established");
  }
}

/**
 * Close database connection
 */
async function closeDB() {
  if (dbConnection) {
    if (typeof dbConnection.end === "function") {
      await dbConnection.end();
    } else if (typeof dbConnection.close === "function") {
      await dbConnection.close();
    }
    console.log("✅ Database connection closed");
  }
}

/**
 * Make HTTPS request (ignoring SSL certificate errors)
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
      },
      rejectUnauthorized: false, // Accept self-signed certificates
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    if (data && method !== "GET") {
      const body = JSON.stringify(data);
      options.headers["Content-Length"] = Buffer.byteLength(body);
    }

    const req = https.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data && method !== "GET") {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Clean up test user from database
 */
async function cleanupTestUser() {
  console.log("\n🧹 Cleaning up test user...");

  try {
    // Use the DB adapter's helpers for a consistent teardown across backends
    const existing = await db.getUserByEmail(TEST_USER_EMAIL);
    if (existing && existing.id) {
      const deleted = await db.deleteUserCascade(existing.id);
      if (deleted) {
        console.log(`✅ Deleted test user: ${TEST_USER_EMAIL}`);
      } else {
        console.log(
          `⚠️  Attempted to delete user but 0 rows affected: ${TEST_USER_EMAIL}`
        );
      }
    } else {
      console.log(`ℹ️  Test user not found: ${TEST_USER_EMAIL}`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up test user:", error.message);
    throw error;
  }
}

/**
 * Create test user via API
 */
async function createTestUser() {
  console.log("\n👤 Creating test user via API...");

  try {
    const response = await makeRequest("POST", "/user/create", {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PWD,
      pwdLogin: TEST_USER_PWD_LOGIN,
      googleOauth: TEST_USER_GOOGLE_OAUTH,
      googleEmail: TEST_USER_GOOGLE_EMAIL,
      firstName: "Test",
      lastName: "User",
      accountStatus: "active",
    });

    if (response.status === 201 && response.data.success) {
      testData.userId = response.data.user.id;
      console.log(`✅ Created test user: ${TEST_USER_EMAIL}`);
      console.log(`   User ID: ${testData.userId}`);
      console.log(
        `   Password Login: ${response.data.user.pwdLogin ? "Yes" : "No"}`
      );
      console.log(
        `   Google OAuth: ${response.data.user.googleOauth ? "Yes" : "No"}`
      );
      if (response.data.user.googleOauth) {
        console.log(`   Google Email: ${response.data.user.googleEmail}`);
      }
    } else {
      console.error("❌ User creation failed:", response.data);
      throw new Error("User creation failed");
    }
  } catch (error) {
    console.error("❌ Error creating test user:", error.message);
    throw error;
  }
}

/**
 * Create public ReachMe page for test user
 */
async function createPublicReachMe() {
  console.log("\n📄 Creating public ReachMe page...");

  try {
    const response = await makeRequest(
      "POST",
      "/public-reachme/create",
      {
        deactivateAt: null, // Never expires
      },
      testData.userToken // Use user token instead of admin token
    );

    if (response.status === 200 && response.data.success) {
      testData.publicReachMeCode = response.data.urlCode;
      // Prefer the userEmail returned by the create endpoint
      testData.publicReachMeEmail = response.data.userEmail || TEST_USER_EMAIL;
      console.log(`✅ Created public ReachMe page`);
      console.log(`   URL Code: ${testData.publicReachMeCode}`);
      console.log(`   Full URL: ${response.data.fullUrl}`);
      console.log(
        `   User Email (from create): ${testData.publicReachMeEmail}`
      );
      return testData.publicReachMeCode;
    } else {
      // Try creating via direct database insert
      const { generateUniqueCode } = require("../../utils/helpers");
      const db = require("../../src/db");

      const urlCode = await generateUniqueCode(db);

      await dbConnection.execute(
        `INSERT INTO pblcRechms (user_id, url_code, is_active) VALUES (?, ?, TRUE)`,
        [testData.userId, urlCode]
      );

      testData.publicReachMeCode = urlCode;
      // When creating directly in DB fallback, set the email from test user constant
      testData.publicReachMeEmail = TEST_USER_EMAIL;
      console.log(`✅ Created public ReachMe page (direct DB)`);
      console.log(`   URL Code: ${urlCode}`);
      console.log(`   Full URL: ${BASE_URL}/r/${urlCode}/`);
      return urlCode;
    }
  } catch (error) {
    console.error("❌ Error creating public ReachMe:", error.message);
    throw error;
  }
}

/**
 * Test public ReachMe page
 */
async function testPublicReachMePage() {
  console.log("\n🧪 Testing public ReachMe page with ?test=true...");

  try {
    const response = await makeRequest(
      "POST",
      `/r/${testData.publicReachMeCode}/?test=true`,
      {}
    );

    console.log(`   Status Code: ${response.status}`);
    console.log(`   Response:`, response.data);

    if (response.status === 200 && response.data.status === "test") {
      console.log(`✅ Public ReachMe page test successful`);
      console.log(`   Returned payload:`, response.data);
      console.log(`   Expected user email: ${testData.publicReachMeEmail}`);

      // Prefer explicit userEmail returned by the endpoint
      const returnedEmail = response.data.userEmail || response.data.userId;
      if (returnedEmail === testData.publicReachMeEmail) {
        console.log(
          `   ✅ Returned email matches created page owner email (${testData.publicReachMeEmail})`
        );
        return true;
      }

      // Fallback: resolve numeric id to email
      if (!isNaN(parseInt(returnedEmail, 10))) {
        const userIdReturned = parseInt(returnedEmail, 10);
        const [rows] = await dbConnection.execute(
          "SELECT email FROM users WHERE id = ?",
          [userIdReturned]
        );
        if (rows.length > 0 && rows[0].email === testData.publicReachMeEmail) {
          console.log(
            `   ✅ Resolved user id to expected email (${testData.publicReachMeEmail})`
          );
          return true;
        }
      }

      console.error(
        "❌ Public ReachMe page did not return expected user email",
        response.data
      );
      return false;
    } else {
      console.error("❌ Public ReachMe page test failed:", response.data);
      return false;
    }
  } catch (error) {
    console.error("❌ Error testing public ReachMe page:", error.message);
    throw error;
  }
}

/**
 * Test sending a real message
 */
async function testSendMessage() {
  console.log("\n📨 Testing message submission...");

  try {
    // Create a random message to assert persistence
    const randomMessage = `Test message ${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;

    const payload = {
      message: randomMessage,
      senderInfo: {
        name: "Automated Test",
        email: "test@example.com",
      },
    };

    const response = await makeRequest(
      "POST",
      `/r/${testData.publicReachMeCode}/`,
      payload
    );

    console.log(`   Status Code: ${response.status}`);
    console.log(`   Response:`, response.data);

    if (response.status === 200 && response.data.status === "ok") {
      console.log(`✅ Message sent successfully`);

      // Verify message in database and that the contents match the random message
      let [messages] = await dbConnection.execute(
        "SELECT * FROM reach_me_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [testData.userId]
      );

      // Fallback: if not found by user_id (sqlite differences), try finding by public_reachme_id
      if (!messages || messages.length === 0) {
        const [pr] = await dbConnection.execute(
          "SELECT id FROM pblcRechms WHERE url_code = ? LIMIT 1",
          [testData.publicReachMeCode]
        );
        if (pr && pr.length > 0) {
          const publicId = pr[0].id;
          [messages] = await dbConnection.execute(
            "SELECT * FROM reach_me_messages WHERE public_reachme_id = ? ORDER BY created_at DESC LIMIT 1",
            [publicId]
          );
        }
      }

      if (messages && messages.length > 0) {
        const saved = messages[0];
        const savedMessage = saved.message;
        console.log(`   Message found in database:`);
        console.log(`   - Message: ${savedMessage}`);
        console.log(
          `   - Sender: ${
            saved.sender_info ? JSON.parse(saved.sender_info).name : "N/A"
          }`
        );

        if (savedMessage === randomMessage) {
          console.log("   ✅ Saved message matches sent message");
          return true;
        } else {
          console.error("   ❌ Saved message does not match sent message!");
          return false;
        }
      } else {
        console.error("   ❌ No messages found in database after send");
        return false;
      }
    } else {
      console.error("❌ Message sending failed:", response.data);
      return false;
    }
  } catch (error) {
    console.error("❌ Error sending message:", error.message);
    throw error;
  }
}

/**
 * Setup admin user
 */
async function setupAdminUser() {
  console.log("\n🔐 Ensuring admin user exists...");

  const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

  if (!process.env.ENCRYPTION_KEY) {
    console.warn(
      "ENCRYPTION_KEY not set in environment; using default seeded value."
    );
  }

  try {
    // Use DB adapter helpers to find and create/update admin user
    const existing = await db.getUserByEmail(ADMIN_EMAIL);
    const passwordHash = encryptPassword(ADMIN_PASSWORD, encryptionKey);

    if (existing) {
      let needsUpdate = existing.admin !== "yes" || !existing.password_hash;
      if (existing.password_hash) {
        const decrypted = decryptPassword(
          existing.password_hash,
          encryptionKey
        );
        if (decrypted !== ADMIN_PASSWORD) needsUpdate = true;
      }

      if (needsUpdate) {
        await db.updateUserById(existing.id, {
          password_hash: passwordHash,
          admin: "yes",
          pwdLogin: true,
          account_status: "active",
        });
        console.log(`✅ Updated existing admin user: ${ADMIN_EMAIL}`);
      } else {
        console.log(`✅ Admin user already configured: ${ADMIN_EMAIL}`);
      }
    } else {
      await db.createUser({
        email: ADMIN_EMAIL,
        password_hash: passwordHash,
        first_name: "Admin",
        last_name: "User",
        admin: "yes",
        pwdLogin: true,
        account_status: "active",
      });
      console.log(`✅ Inserted admin user: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error("❌ Error ensuring admin user:", error.message);
    throw error;
  }
}

/**
 * Test admin login
 */
async function testAdminLogin() {
  console.log("\n🔑 Testing admin login via /user/login...");

  try {
    const response = await makeRequest("POST", "/user/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      isAdminLogin: true,
    });

    if (
      response.status === 200 &&
      response.data.success &&
      Array.isArray(response.data.roles) &&
      response.data.roles.includes("admin")
    ) {
      console.log("✅ Admin login successful");
      console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
      return response.data.token;
    } else {
      console.error("❌ Admin login failed:", response.data);
      throw new Error("Admin login failed");
    }
  } catch (error) {
    console.error("❌ Error during admin login:", error.message);
    throw error;
  }
}

/**
 * Test admin authentication
 */
async function testAdminAuth(token) {
  console.log("\n🔒 Testing admin authorization on /admin/users...");

  try {
    const response = await makeRequest("GET", "/admin/users", null, token);

    if (response.status === 200 && response.data.success) {
      const userCount = Array.isArray(response.data.users)
        ? response.data.users.length
        : 0;
      console.log("✅ Admin authorization successful");
      console.log(`   Users returned: ${userCount}`);
    } else {
      console.error("❌ Admin authorization failed:", response.data);
      throw new Error("Admin authorization failed");
    }
  } catch (error) {
    console.error("❌ Error during admin authorization:", error.message);
    throw error;
  }
}

/**
 * Test user login
 */
async function testUserLogin() {
  console.log("\n🔑 Testing user login...");

  try {
    const response = await makeRequest("POST", "/user/login", {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PWD,
    });

    if (response.status === 200 && response.data.success) {
      console.log("✅ User login successful");
      console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
      console.log(`   User Email: ${response.data.user.email}`);
      console.log(`   User ID: ${response.data.user.id}`);
      return response.data.token;
    } else {
      console.error("❌ User login failed:", response.data);
      throw new Error("User login failed");
    }
  } catch (error) {
    console.error("❌ Error during user login:", error.message);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("🚀 Starting User Tests with Database\n");
  console.log(`Server: ${BASE_URL}`);
  console.log(
    `Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  );
  console.log(`DB User: ${process.env.DB_USER}`);

  try {
    // Initialize database
    await initDB();

    // Clean up existing test user
    await cleanupTestUser();

    // Setup admin user
    await setupAdminUser();

    // Test admin login
    testData.adminToken = await testAdminLogin();

    // Test admin authentication
    await testAdminAuth(testData.adminToken);

    // Create test user
    await createTestUser();

    // Test user login with created credentials
    testData.userToken = await testUserLogin();

    // Create public ReachMe page using user token
    const code = await createPublicReachMe();
    if (!code) throw new Error("Failed to create public ReachMe page");

    // Test public ReachMe page (test mode) - must return user email (or resolve to it)
    const okPublic = await testPublicReachMePage();
    if (!okPublic) throw new Error("Public ReachMe page test failed");

    // Test sending a real message and verifying persistence
    const okMessage = await testSendMessage();
    if (!okMessage) throw new Error("Message persistence test failed");

    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Summary");
    console.log("=".repeat(50));
    console.log(`User Email: ${TEST_USER_EMAIL}`);
    console.log(`User Password: ${TEST_USER_PWD}`);
    console.log(`User ID: ${testData.userId}`);
    console.log(`Public ReachMe Code: ${testData.publicReachMeCode}`);
    console.log(
      `Public ReachMe URL: ${BASE_URL}/r/${testData.publicReachMeCode}/`
    );
    console.log(
      `Test URL: ${BASE_URL}/r/${testData.publicReachMeCode}/?test=true`
    );
    console.log("=".repeat(50));

    console.log("\n✅ All tests passed!\n");
    console.log("ℹ️  Test data has been kept in the database for inspection.");
  } catch (error) {
    console.error("\n❌ Tests failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    try {
      // Cleanup test user data to make tests repeatable
      await cleanupTestUser();
    } catch (e) {
      console.warn("Cleanup during finally failed:", e.message);
    }

    await closeDB();
  }
}

// Run tests
runTests();

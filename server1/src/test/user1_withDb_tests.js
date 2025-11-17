/**
 * User Tests with Database
 * Tests for user operations with direct database access
 *
 * Prerequisites:
 * - Server running at https://reachme2.com:8052
 * - Database configured in .local.env
 * - Admin credentials in src/test/admin.env
 *
 * Usage: node src/test/user1_withDb_tests.js
 */

const https = require("https");
const http = require("http");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Load environment configuration
const { loadEnv } = require("../utils/loadEnv");
loadEnv(__dirname);

// Load admin credentials
const adminEnvPath = path.join(__dirname, "admin.env");
const adminEnvContent = fs.readFileSync(adminEnvPath, "utf8");
const adminCreds = {};
adminEnvContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    adminCreds[key.trim()] = value.trim();
  }
});

const ADMIN_EMAIL = adminCreds.u;
const ADMIN_PASSWORD = adminCreds.p;

// Test configuration
const BASE_URL = "https://reachme2.com:8052";
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
  dbConnection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    database: process.env.DB_NAME,
  });
  console.log("✅ Database connection established");
}

/**
 * Close database connection
 */
async function closeDB() {
  if (dbConnection) {
    await dbConnection.end();
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
    const [rows] = await dbConnection.execute(
      "SELECT id FROM users WHERE email = ?",
      [TEST_USER_EMAIL]
    );

    if (rows.length > 0) {
      const userId = rows[0].id;

      // Delete related records
      await dbConnection.execute(
        "DELETE FROM reach_me_messages WHERE user_id = ?",
        [userId]
      );
      await dbConnection.execute("DELETE FROM pblcRechms WHERE user_id = ?", [
        userId,
      ]);
      await dbConnection.execute("DELETE FROM invites WHERE email = ?", [
        TEST_USER_EMAIL,
      ]);
      await dbConnection.execute("DELETE FROM users WHERE id = ?", [userId]);

      console.log(`✅ Deleted test user: ${TEST_USER_EMAIL}`);
    } else {
      console.log(`ℹ️  Test user not found: ${TEST_USER_EMAIL}`);
    }
  } catch (error) {
    console.error("❌ Error cleaning up test user:", error.message);
    throw error;
  }
}

/**
 * Hash password using the same encryption as admin passwords
 */
function encryptPassword(password) {
  const crypto = require("crypto");
  const ADMIN_ENCRYPTION_KEY =
    process.env.ADMIN_ENCRYPTION_KEY || "hFsd934mcW7jKp2qRt8vYz";
  const ALGORITHM = "aes-256-cbc";

  const key = crypto.createHash("sha256").update(ADMIN_ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Create test user
 */
async function createTestUser() {
  console.log("\n👤 Creating test user...");

  try {
    // Encrypt password using same method as admin
    const passwordHash = encryptPassword(TEST_USER_PWD);

    const [result] = await dbConnection.execute(
      `INSERT INTO users (
        email, 
        password_hash, 
        pwdLogin, 
        googleOauth, 
        USER_GOOGLE_EMAIL,
        first_name,
        last_name,
        account_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        TEST_USER_EMAIL,
        passwordHash,
        TEST_USER_PWD_LOGIN,
        TEST_USER_GOOGLE_OAUTH,
        TEST_USER_GOOGLE_EMAIL,
        "Test",
        "User",
        "active",
      ]
    );

    testData.userId = result.insertId;
    console.log(`✅ Created test user: ${TEST_USER_EMAIL}`);
    console.log(`   User ID: ${testData.userId}`);
    console.log(`   Password Login: ${TEST_USER_PWD_LOGIN ? "Yes" : "No"}`);
    console.log(`   Google OAuth: ${TEST_USER_GOOGLE_OAUTH ? "Yes" : "No"}`);
    if (TEST_USER_GOOGLE_OAUTH) {
      console.log(`   Google Email: ${TEST_USER_GOOGLE_EMAIL}`);
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
      console.log(`✅ Created public ReachMe page`);
      console.log(`   URL Code: ${testData.publicReachMeCode}`);
      console.log(`   Full URL: ${response.data.fullUrl}`);
      return testData.publicReachMeCode;
    } else {
      // Try creating via direct database insert
      const { generateUniqueCode } = require("../../utils/helpers");
      const { getDB } = require("../../db/connection");
      const db = getDB();

      const urlCode = await generateUniqueCode(db);

      await dbConnection.execute(
        `INSERT INTO pblcRechms (user_id, url_code, is_active) VALUES (?, ?, TRUE)`,
        [testData.userId, urlCode]
      );

      testData.publicReachMeCode = urlCode;
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
      console.log(`   User ID returned: ${response.data.userId}`);
      console.log(`   Expected User ID: ${TEST_USER_EMAIL}`);

      if (response.data.userId === TEST_USER_EMAIL) {
        console.log(`   ✅ User ID matches!`);
      } else {
        console.log(`   ⚠️  User ID mismatch!`);
      }

      return true;
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
    const response = await makeRequest(
      "POST",
      `/r/${testData.publicReachMeCode}/`,
      {
        message: "Test message from automated test",
        senderInfo: {
          name: "Automated Test",
          email: "test@example.com",
        },
      }
    );

    console.log(`   Status Code: ${response.status}`);
    console.log(`   Response:`, response.data);

    if (response.status === 200 && response.data.status === "ok") {
      console.log(`✅ Message sent successfully`);

      // Verify message in database
      const [messages] = await dbConnection.execute(
        "SELECT * FROM reach_me_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
        [testData.userId]
      );

      if (messages.length > 0) {
        console.log(`   Message found in database:`);
        console.log(`   - Message: ${messages[0].message}`);
        console.log(`   - Sender: ${JSON.parse(messages[0].sender_info).name}`);
      }

      return true;
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
  console.log("\n🔐 Setting up admin user...");

  const { setAdminUser } = require("../../utils/adminAuth");
  const encryptionKey =
    process.env.ADMIN_ENCRYPTION_KEY || "hFsd934mcW7jKp2qRt8vYz";

  try {
    const result = setAdminUser(ADMIN_EMAIL, ADMIN_PASSWORD, encryptionKey);
    console.log(`✅ Admin user configured: ${ADMIN_EMAIL}`);
    console.log(`   Salt: ${result.salt.substring(0, 10)}...`);
    console.log(`   Encrypted: ${result.encrypted.substring(0, 20)}...`);
  } catch (error) {
    console.error("❌ Error setting up admin user:", error.message);
    throw error;
  }
}

/**
 * Test admin login
 */
async function testAdminLogin() {
  console.log("\n🔑 Testing admin login...");

  try {
    const response = await makeRequest("POST", "/admin/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.status === 200 && response.data.success) {
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
  console.log("\n🔒 Testing admin authentication...");

  try {
    const response = await makeRequest("GET", "/admin/test", null, token);

    if (response.status === 200 && response.data.success) {
      console.log("✅ Admin authentication successful");
      console.log(`   User: ${response.data.user.email}`);
      console.log(`   Role: ${response.data.user.role}`);
    } else {
      console.error("❌ Admin authentication failed:", response.data);
      throw new Error("Admin authentication failed");
    }
  } catch (error) {
    console.error("❌ Error during admin authentication:", error.message);
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
    await createPublicReachMe();

    // Test public ReachMe page (test mode)
    await testPublicReachMePage();

    // Test sending a real message
    await testSendMessage();

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
    await closeDB();
  }
}

// Run tests
runTests();

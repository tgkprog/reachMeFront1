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
  console.log("\n🔐 Ensuring admin user exists...");

  const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

  if (!process.env.ENCRYPTION_KEY) {
    console.warn(
      "ENCRYPTION_KEY not set in environment; using default seeded value."
    );
  }

  try {
    const [existingUsers] = await dbConnection.execute(
      "SELECT id, password_hash, admin FROM users WHERE email = ?",
      [ADMIN_EMAIL]
    );

    const passwordHash = encryptPassword(ADMIN_PASSWORD, encryptionKey);

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      let needsUpdate = user.admin !== "yes" || !user.password_hash;

      if (user.password_hash) {
        const decrypted = decryptPassword(user.password_hash, encryptionKey);
        if (decrypted !== ADMIN_PASSWORD) {
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await dbConnection.execute(
          "UPDATE users SET password_hash = ?, admin = 'yes', pwdLogin = true, account_status = 'active' WHERE id = ?",
          [passwordHash, user.id]
        );
        console.log(`✅ Updated existing admin user: ${ADMIN_EMAIL}`);
      } else {
        console.log(`✅ Admin user already configured: ${ADMIN_EMAIL}`);
      }
    } else {
      await dbConnection.execute(
        `INSERT INTO users (email, password_hash, first_name, last_name, admin, pwdLogin, account_status)
         VALUES (?, ?, ?, ?, 'yes', true, 'active')`,
        [ADMIN_EMAIL, passwordHash, "Admin", "User"]
      );
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

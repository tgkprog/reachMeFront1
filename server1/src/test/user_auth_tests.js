/**
 * User Authentication Tests
 * Tests for user login via email/password and Google OAuth
 *
 * Prerequisites:
 * - Server running at https://reachme2.com:8052
 * - Test user created (run user1_withDb_tests.js first)
 *
 * Usage: node src/test/user_auth_tests.js
 */

const https = require("https");

// Test configuration
const BASE_URL = "https://reachme2.com:8052";
const TEST_USER_EMAIL = "test1@test.com"; // Primary email
const TEST_USER_PWD = "ds2#fk_3S3Vf_s";//ds2#fk_3S3Vf_s
const TEST_USER_GOOGLE_EMAIL = "test1.different@gmail.com";

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
 * Test 1: User login with email/password
 */
async function testUserPasswordLogin() {
  console.log("\n🔑 Test 1: User Password Login");
  console.log("=".repeat(50));

  try {
    const response = await makeRequest("POST", "/user/login", {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PWD,
    });

    console.log(`Status Code: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.success) {
      console.log("✅ User password login successful");
      console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
      console.log(`   User Email: ${response.data.user.email}`);
      console.log(`   User ID: ${response.data.user.id}`);
      return response.data.token;
    } else {
      console.error("❌ User password login failed");
      return null;
    }
  } catch (error) {
    console.error("❌ Error during user password login:", error.message);
    return null;
  }
}

/**
 * Test 2: Get user info with token
 */
async function testGetUserInfo(token) {
  console.log("\n👤 Test 2: Get User Info");
  console.log("=".repeat(50));

  try {
    const response = await makeRequest("GET", "/user/me", null, token);

    console.log(`Status Code: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.success) {
      console.log("✅ Get user info successful");
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Password Login: ${response.data.user.pwdLogin}`);
      console.log(`   Google OAuth: ${response.data.user.googleOauth}`);
      console.log(`   Google Email: ${response.data.user.googleEmail}`);
      return true;
    } else {
      console.error("❌ Get user info failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error getting user info:", error.message);
    return false;
  }
}

/**
 * Test 3: Login with wrong password
 */
async function testWrongPassword() {
  console.log("\n🚫 Test 3: Login with Wrong Password");
  console.log("=".repeat(50));

  try {
    const response = await makeRequest("POST", "/user/login", {
      email: TEST_USER_EMAIL,
      password: "wrongpassword123",
    });

    console.log(`Status Code: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 401 && !response.data.success) {
      console.log("✅ Correctly rejected wrong password");
      return true;
    } else {
      console.error("❌ Should have rejected wrong password");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during wrong password test:", error.message);
    return false;
  }
}

/**
 * Test 4: Login with non-existent user
 */
async function testNonExistentUser() {
  console.log("\n🚫 Test 4: Login with Non-existent User");
  console.log("=".repeat(50));

  try {
    const response = await makeRequest("POST", "/user/login", {
      email: "nonexistent@example.com",
      password: "anypassword",
    });

    console.log(`Status Code: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 401 && !response.data.success) {
      console.log("✅ Correctly rejected non-existent user");
      return true;
    } else {
      console.error("❌ Should have rejected non-existent user");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during non-existent user test:", error.message);
    return false;
  }
}

/**
 * Test 5: Logout
 */
async function testLogout(token) {
  console.log("\n🚪 Test 5: Logout");
  console.log("=".repeat(50));

  try {
    const response = await makeRequest("POST", "/user/logout", null, token);

    console.log(`Status Code: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));

    if (response.status === 200 && response.data.success) {
      console.log("✅ Logout successful");
      return true;
    } else {
      console.error("❌ Logout failed");
      return false;
    }
  } catch (error) {
    console.error("❌ Error during logout:", error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("\n🚀 Starting User Authentication Tests");
  console.log(`Server: ${BASE_URL}`);
  console.log(`Test User: ${TEST_USER_EMAIL}\n`);

  let passedTests = 0;
  let totalTests = 5;
  let userToken = null;

  try {
    // Test 1: User password login
    userToken = await testUserPasswordLogin();
    if (userToken) passedTests++;

    if (userToken) {
      // Test 2: Get user info
      if (await testGetUserInfo(userToken)) passedTests++;
    }

    // Test 3: Wrong password
    if (await testWrongPassword()) passedTests++;

    // Test 4: Non-existent user
    if (await testNonExistentUser()) passedTests++;

    // Test 5: Logout
    if (userToken && (await testLogout(userToken))) passedTests++;

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Test Summary");
    console.log("=".repeat(50));
    console.log(`Passed: ${passedTests}/${totalTests}`);
    console.log("=".repeat(50));

    if (passedTests === totalTests) {
      console.log("\n✅ All tests passed!\n");
    } else {
      console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Tests failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();

/**
 * User Authentication Routes
 * Handles user login via email/password and Google OAuth
 */

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../src/db");

/**
 * Decrypt password using AES-256-CBC (matching admin encryption)
 */
function decryptPassword(encryptedData, encryptionKey) {
  try {
    const ALGORITHM = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(encryptionKey).digest();

    // Split IV and encrypted data
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting password:", error.message);
    return null;
  }
}

/**
 * Encrypt password using AES-256-CBC (matching admin encryption)
 */
function encryptPassword(password, encryptionKey) {
  const ALGORITHM = "aes-256-cbc";
  const key = crypto.createHash("sha256").update(encryptionKey).digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * POST /user/create
 * Create a new user
 */
router.post("/create", async (req, res) => {
  try {
    const {
      email,
      password,
      pwdLogin,
      googleOauth,
      googleEmail,
      firstName,
      lastName,
      accountStatus,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "First name and last name are required",
      });
    }

    // Validate password login requirements
    if (pwdLogin && !password) {
      return res.status(400).json({
        success: false,
        error: "Password is required when pwdLogin is enabled",
      });
    }

    // Validate Google OAuth requirements
    if (googleOauth && !googleEmail) {
      return res.status(400).json({
        success: false,
        error: "Google email is required when googleOauth is enabled",
      });
    }

    // using src/db adapter
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "ENCRYPTION_KEY not set in environment; using default seeded value."
      );
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      });
    }

    // Check if Google email is already in use
    if (googleEmail) {
      const existingGoogle = await db.getUserByGoogleEmail(googleEmail);
      if (existingGoogle) {
        return res.status(409).json({
          success: false,
          error: "This Google email is already associated with another user",
        });
      }
    }

    // Encrypt password if provided
    let passwordHash = null;
    if (password) {
      passwordHash = encryptPassword(password, encryptionKey);
    }

    // Create user via adapter
    const userId = await db.createUser({
      email,
      password_hash: passwordHash,
      pwdLogin: pwdLogin || false,
      googleOauth: googleOauth || false,
      googleEmail: googleEmail || null,
      first_name: firstName,
      last_name: lastName,
      account_status: accountStatus || "active",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        pwdLogin: pwdLogin || false,
        googleOauth: googleOauth || false,
        googleEmail: googleEmail || null,
        accountStatus: accountStatus || "active",
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create user",
    });
  }
});

/**
 * POST /user/login
 * User login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password, isAdminLogin } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required",
      });
    }

    // using src/db adapter
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "ENCRYPTION_KEY not set in environment; using default seeded value."
      );
    }

    // Search for user by primary email
    const user = await db.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if password login is enabled for this user
    if (!user.pwdLogin) {
      return res.status(403).json({
        success: false,
        message: "Password login is not enabled for this account",
      });
    }

    // Check account status
    if (user.account_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    // Verify password
    if (!user.password_hash) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const decryptedPassword = decryptPassword(
      user.password_hash,
      encryptionKey
    );
    if (!decryptedPassword || decryptedPassword !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // --- Role-based JWT generation ---
    const userRoles = user.admin === "yes" ? ["admin"] : [];

    if (isAdminLogin && !userRoles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "User is not an administrator.",
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    // Add roles to payload only if they exist
    if (userRoles.length > 0) {
      tokenPayload.roles = userRoles;
    }

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "your-jwt-secret",
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    // Set cookie
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    const responseJson = {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    };

    // Add roles to the final response JSON only if they exist
    if (userRoles.length > 0) {
      responseJson.roles = userRoles;
    }

    res.json(responseJson);
  } catch (error) {
    console.error("User login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

/**
 * User authentication middleware
 */
function authenticateUser(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.authToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "No authentication token provided",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-jwt-secret",
    (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: "Invalid or expired token",
        });
      }

      req.user = user;
      next();
    }
  );
}

/**
 * GET /user/me
 * Get current user info
 */
router.get("/me", authenticateUser, async (req, res) => {
  try {
    // using src/db adapter

    const user = await db.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountStatus: user.account_status,
        pwdLogin: user.pwdLogin,
        googleOauth: user.googleOauth,
        googleEmail: user.USER_GOOGLE_EMAIL,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get user info",
    });
  }
});

/**
 * POST /user/logout
 * Logout endpoint
 */
router.post("/logout", (req, res) => {
  res.clearCookie("authToken");
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

module.exports = router;
module.exports.authenticateUser = authenticateUser;

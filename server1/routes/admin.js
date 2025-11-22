const express = require("express");
const router = express.Router();
const db = require("../src/db");
const { encryptPassword } = require("../utils/crypto");
const { authenticateUser } = require("./userAuth");

function requireAdmin(req, res, next) {
  const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];
  if (!roles.includes("admin")) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }
  next();
}

router.use(authenticateUser, requireAdmin);

// Create user (admin)
router.post("/users", async (req, res) => {
  try {
    const {
      email,
      password,
      pwdLogin = false,
      googleOauth = false,
      googleEmail = null,
      firstName,
      lastName,
      accountStatus = "active",
    } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({
          success: false,
          message: "First name and last name are required",
        });
    }
    if (pwdLogin && !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password is required when pwdLogin is enabled",
        });
    }
    if (googleOauth && !googleEmail) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Google email is required when googleOauth is enabled",
        });
    }

    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";
    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "ENCRYPTION_KEY not set in environment; using default seeded value."
      );
    }

    // Check uniqueness
    const existing = await db.getUserByEmail(email);
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          message: "User with this email already exists",
        });
    if (googleEmail) {
      const existingGoogle = await db.getUserByGoogleEmail(googleEmail);
      if (existingGoogle)
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This Google email is already associated with another user",
          });
    }

    const passwordHash =
      pwdLogin && password ? encryptPassword(password, encryptionKey) : null;

    const newUserId = await db.createUser({
      email,
      password_hash: passwordHash,
      pwdLogin: Boolean(pwdLogin),
      googleOauth: Boolean(googleOauth),
      googleEmail: googleEmail || null,
      first_name: firstName,
      last_name: lastName,
      admin: "no",
      account_status: accountStatus,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUserId,
        email,
        firstName,
        lastName,
        accountStatus,
        pwdLogin: Boolean(pwdLogin),
        googleOauth: Boolean(googleOauth),
        googleEmail: googleEmail || null,
      },
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ success: false, message: "Failed to create user" });
  }
});

// List users
router.get("/users", async (req, res) => {
  try {
    const statusFilter = req.query.account_status;
    let statuses = [];
    if (statusFilter) {
      const arr = Array.isArray(statusFilter)
        ? statusFilter
        : statusFilter.split(",").map((s) => s.trim());
      statuses = arr.filter((s) =>
        ["active", "suspended", "deleted"].includes(s)
      );
    }

    const users = await db.listUsers({ statuses });
    res.json({
      success: true,
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        accountStatus: user.account_status,
        pwdLogin: Boolean(user.pwdLogin),
        googleOauth: Boolean(user.googleOauth),
        googleEmail: user.USER_GOOGLE_EMAIL,
      })),
    });
  } catch (error) {
    console.error("Admin list users error:", error);
    res.status(500).json({ success: false, message: "Failed to list users" });
  }
});

// Update user
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, pwdLogin, googleOauth, googleEmail, password } =
      req.body;

    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });

    const targetUser = await db.getUserById(id);
    if (!targetUser)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    if (targetUser.admin === "yes")
      return res
        .status(403)
        .json({
          success: false,
          message: "Cannot modify admin users via this endpoint",
        });

    if (typeof googleEmail !== "undefined" && googleEmail) {
      const existingGoogle = await db.getUserByGoogleEmail(googleEmail);
      if (existingGoogle && String(existingGoogle.id) !== String(id)) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This Google email is already associated with another user",
          });
      }
    }

    const updates = {
      account_status:
        typeof accountStatus !== "undefined" ? accountStatus : undefined,
      pwdLogin: typeof pwdLogin !== "undefined" ? pwdLogin : undefined,
      googleOauth: typeof googleOauth !== "undefined" ? googleOauth : undefined,
      googleEmail: typeof googleEmail !== "undefined" ? googleEmail : undefined,
      password_hash:
        typeof password !== "undefined" && password
          ? encryptPassword(
              password,
              process.env.ENCRYPTION_KEY || "dfJKDF98034DF"
            )
          : undefined,
    };

    await db.updateUserById(id, updates);
    const updatedUser = await db.getUserById(id);

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        accountStatus: updatedUser.account_status,
        pwdLogin: Boolean(updatedUser.pwdLogin),
        googleOauth: Boolean(updatedUser.googleOauth),
        googleEmail: updatedUser.USER_GOOGLE_EMAIL,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
});

module.exports = router;

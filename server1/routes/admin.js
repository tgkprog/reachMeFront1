const express = require("express");
const router = express.Router();
const { getDB } = require("../db/connection");
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
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    if (pwdLogin && !password) {
      return res.status(400).json({
        success: false,
        message: "Password is required when pwdLogin is enabled",
      });
    }

    if (googleOauth && !googleEmail) {
      return res.status(400).json({
        success: false,
        message: "Google email is required when googleOauth is enabled",
      });
    }

    const db = getDB();
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "ENCRYPTION_KEY not set in environment; using default seeded value."
      );
    }

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    if (googleEmail) {
      const [existingGoogle] = await db.execute(
        "SELECT id FROM users WHERE USER_GOOGLE_EMAIL = ?",
        [googleEmail]
      );

      if (existingGoogle.length > 0) {
        return res.status(409).json({
          success: false,
          message: "This Google email is already associated with another user",
        });
      }
    }

    let passwordHash = null;
    if (pwdLogin && password) {
      passwordHash = encryptPassword(password, encryptionKey);
    }

    const [result] = await db.execute(
      `INSERT INTO users (
        email,
        password_hash,
        pwdLogin,
        googleOauth,
        USER_GOOGLE_EMAIL,
        first_name,
        last_name,
        admin,
        account_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'no', ?)`,
      [
        email,
        passwordHash,
        Boolean(pwdLogin),
        Boolean(googleOauth),
        googleEmail || null,
        firstName,
        lastName,
        accountStatus,
      ]
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: result.insertId,
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
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
});

router.get("/users", async (req, res) => {
  try {
    const db = getDB();

    // Parse account_status filter from query params
    const statusFilter = req.query.account_status;
    let statusConditions = [];
    let queryParams = [];

    if (statusFilter) {
      const statuses = Array.isArray(statusFilter)
        ? statusFilter
        : statusFilter.split(",").map((s) => s.trim());

      const validStatuses = statuses.filter((s) =>
        ["active", "suspended", "deleted"].includes(s)
      );

      if (validStatuses.length > 0) {
        statusConditions = validStatuses.map(() => "?");
        queryParams = validStatuses;
      }
    }

    let whereClause = "(admin IS NULL OR admin <> ?)";
    queryParams.unshift("yes");

    if (statusConditions.length > 0) {
      whereClause += ` AND account_status IN (${statusConditions.join(", ")})`;
    }

    const [users] = await db.execute(
      `SELECT id, email, first_name, last_name, account_status, pwdLogin, googleOauth, USER_GOOGLE_EMAIL
       FROM users
       WHERE ${whereClause}
       ORDER BY created_at DESC`,
      queryParams
    );

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
    res.status(500).json({
      success: false,
      message: "Failed to list users",
    });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, pwdLogin, googleOauth, googleEmail, password } =
      req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const updates = [];
    const values = [];

    if (typeof accountStatus !== "undefined") {
      const allowedStatuses = ["active", "suspended", "deleted"];
      if (!allowedStatuses.includes(accountStatus)) {
        return res.status(400).json({
          success: false,
          message: "Invalid account status",
        });
      }
      updates.push("account_status = ?");
      values.push(accountStatus);
    }

    if (typeof pwdLogin !== "undefined") {
      updates.push("pwdLogin = ?");
      values.push(Boolean(pwdLogin));
    }

    if (typeof googleOauth !== "undefined") {
      updates.push("googleOauth = ?");
      values.push(Boolean(googleOauth));
    }

    if (typeof googleEmail !== "undefined") {
      if (googleEmail) {
        updates.push("USER_GOOGLE_EMAIL = ?");
        values.push(googleEmail);
      } else {
        updates.push("USER_GOOGLE_EMAIL = NULL");
      }
    }

    // Handle password update if provided
    if (typeof password !== "undefined" && password) {
      const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

      if (!process.env.ENCRYPTION_KEY) {
        console.warn(
          "ENCRYPTION_KEY not set in environment; using default seeded value."
        );
      }

      const passwordHash = encryptPassword(password, encryptionKey);
      updates.push("password_hash = ?");
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const db = getDB();

    const [targetUsers] = await db.execute(
      "SELECT id, admin FROM users WHERE id = ?",
      [id]
    );

    if (targetUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (targetUsers[0].admin === "yes") {
      return res.status(403).json({
        success: false,
        message: "Cannot modify admin users via this endpoint",
      });
    }

    if (typeof googleEmail !== "undefined" && googleEmail) {
      const [existingGoogle] = await db.execute(
        "SELECT id FROM users WHERE USER_GOOGLE_EMAIL = ? AND id <> ?",
        [googleEmail, id]
      );

      if (existingGoogle.length > 0) {
        return res.status(409).json({
          success: false,
          message: "This Google email is already associated with another user",
        });
      }
    }

    const updateQuery = `UPDATE users SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(id);
    await db.execute(updateQuery, values);

    const [updatedUsers] = await db.execute(
      `SELECT id, email, first_name, last_name, account_status, pwdLogin, googleOauth, USER_GOOGLE_EMAIL
       FROM users
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        id: updatedUsers[0].id,
        email: updatedUsers[0].email,
        firstName: updatedUsers[0].first_name,
        lastName: updatedUsers[0].last_name,
        accountStatus: updatedUsers[0].account_status,
        pwdLogin: Boolean(updatedUsers[0].pwdLogin),
        googleOauth: Boolean(updatedUsers[0].googleOauth),
        googleEmail: updatedUsers[0].USER_GOOGLE_EMAIL,
      },
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

module.exports = router;

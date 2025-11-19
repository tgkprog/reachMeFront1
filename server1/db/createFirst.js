const fs = require("fs").promises;
const path = require("path");
const { getDB } = require("./connection");
const { encryptPassword, decryptPassword } = require("../utils/crypto");

async function seedAdminUsers() {
  try {
    const db = getDB();
    const encryptionKey = process.env.ENCRYPTION_KEY || "dfJKDF98034DF";

    if (!process.env.ENCRYPTION_KEY) {
      console.warn(
        "ENCRYPTION_KEY not set in environment; using default seeded value."
      );
    }

    const adminUsersFilePath = path.join(
      __dirname,
      "..",
      "src",
      ".admin.users"
    );
    const data = await fs.readFile(adminUsersFilePath, "utf8");
    const lines = data.split("\n");

    let usersProcessed = 0;
    for (const line of lines) {
      if (usersProcessed >= 2) {
        break;
      }
      if (line.startsWith("#") || line.trim() === "") {
        continue;
      }

      const [email, salt, password] = line.split("|");
      if (!email || !password) {
        console.warn(`Skipping invalid line in .admin.users: ${line}`);
        continue;
      }

      const [existingUsers] = await db.execute(
        "SELECT id, password_hash, admin, pwdLogin FROM users WHERE email = ?",
        [email]
      );

      const passwordHash = encryptPassword(password, encryptionKey);

      if (existingUsers.length > 0) {
        // User exists, check if password needs update
        const user = existingUsers[0];
        const decryptedPassword = user.password_hash
          ? decryptPassword(user.password_hash, encryptionKey)
          : null;

        const passwordMatches = decryptedPassword === password;

        if (!passwordMatches) {
          // Password mismatch (likely due to key change) - update stored hash
          await db.execute(
            "UPDATE users SET password_hash = ?, admin = 'yes', pwdLogin = true WHERE id = ?",
            [passwordHash, user.id]
          );
          console.log(`Updated admin user password: ${email}`);
        } else if (user.admin !== "yes" || !user.pwdLogin) {
          console.warn(
            `Admin user ${email} exists with password synced but flags differ (admin=${user.admin}, pwdLogin=${user.pwdLogin}). No automatic update performed.`
          );
        }
      } else {
        // User does not exist, insert new user
        await db.execute(
          `INSERT INTO users (email, password_hash, first_name, last_name, admin, pwdLogin, account_status) 
           VALUES (?, ?, ?, ?, 'yes', true, 'active')`,
          [email, passwordHash, "Admin", "User"]
        );
        console.log(`Inserted new admin user: ${email}`);
      }
      usersProcessed++;
    }
  } catch (error) {
    console.error("Error seeding admin users:", error);
  }
}

module.exports = { seedAdminUsers };

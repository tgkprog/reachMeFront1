const fs = require("fs").promises;
const path = require("path");
const db = require("../src/db");
const { encryptPassword, decryptPassword } = require("../utils/crypto");

async function seedAdminUsers() {
  try {
    // using src/db adapter
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

      const existingUser = await db.getUserByEmail(email);

      const passwordHash = encryptPassword(password, encryptionKey);

      if (existingUsers.length > 0) {
        // User exists, check if password needs update
        const user = existingUser;
        const decryptedPassword = user.password_hash
          ? decryptPassword(user.password_hash, encryptionKey)
          : null;

        const passwordMatches = decryptedPassword === password;

        if (!passwordMatches) {
          // Password mismatch (likely due to key change) - update stored hash
          await db.updateUserById(user.id, {
            password_hash: passwordHash,
            admin: "yes",
            pwdLogin: true,
          });
          console.log(`Updated admin user password: ${email}`);
        } else if (user.admin !== "yes" || !user.pwdLogin) {
          console.warn(
            `Admin user ${email} exists with password synced but flags differ (admin=${user.admin}, pwdLogin=${user.pwdLogin}). No automatic update performed.`
          );
        }
      } else {
        // User does not exist, insert new user
        await db.createUser({
          email,
          password_hash: passwordHash,
          first_name: "Admin",
          last_name: "User",
          admin: "yes",
          pwdLogin: true,
          account_status: "active",
        });
        console.log(`Inserted new admin user: ${email}`);
      }
      usersProcessed++;
    }
  } catch (error) {
    console.error("Error seeding admin users:", error);
  }
}

module.exports = { seedAdminUsers };

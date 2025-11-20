#!/usr/bin/env node
/**
 * Quick integration test for DB adapter helper functions
 * - createUser
 * - createPublicReachMe
 * - insertReachMessage
 * - getMessageById
 * - getPublicReachMeById
 * - deleteUserCascade
 *
 * Usage: node src/test/adapter_helpers_tests.js
 */

const { loadEnv } = require("../utils/loadEnv");
loadEnv(__dirname);

const db = require("../../src/db");

async function run() {
  let userId = null;
  try {
    const unique =
      Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const email = `adapter-test-${unique}@example.com`;

    console.log("⏳ Creating test user...", email);
    userId = await db.createUser({
      email,
      password_hash: null,
      first_name: "Adapter",
      last_name: "Tester",
      admin: "no",
      pwdLogin: false,
      account_status: "active",
    });
    console.log("✅ User created id=", userId);

    console.log("⏳ Creating public reachme...");
    // Use a short url code (<=10 chars) to satisfy MySQL column length constraints
    const urlCode = `adpt${Math.random().toString(36).slice(2, 4)}`;
    const publicId = await db.createPublicReachMe(userId, urlCode, null);
    console.log("✅ PublicReachMe id=", publicId, "code=", urlCode);

    console.log("⏳ Inserting message...");
    const msgId = await db.insertReachMessage({
      user_id: userId,
      public_reachme_id: publicId,
      message: "adapter helper test message",
      // some schemas require a non-null datetime_alarm; use MySQL-compatible format
      datetime_alarm: new Date().toISOString().slice(0, 19).replace("T", " "),
      sender_info: { name: "adapter" },
    });
    console.log("✅ Message id=", msgId);

    console.log("⏳ Fetching message by id...");
    const fetched = await db.getMessageById(msgId);
    if (!fetched) throw new Error("getMessageById returned null");
    if (String(fetched.id) !== String(msgId))
      throw new Error("Fetched message id mismatch");
    if (fetched.message !== "adapter helper test message")
      throw new Error("Fetched message content mismatch");
    console.log("✅ getMessageById OK");

    console.log("⏳ Fetching public reachme by id...");
    const fetchedP = await db.getPublicReachMeById(publicId);
    if (!fetchedP) throw new Error("getPublicReachMeById returned null");
    if (Number(fetchedP.user_id) !== Number(userId))
      throw new Error("PublicReachMe user_id mismatch");
    if (!fetchedP.user_email)
      throw new Error("PublicReachMe missing user_email");
    console.log(
      "✅ getPublicReachMeById OK (user_email=",
      fetchedP.user_email,
      ")"
    );

    console.log("🎉 Adapter helpers assertions passed.");

    // cleanup
    console.log("🧹 Cleaning up test user via deleteUserCascade...");
    const del = await db.deleteUserCascade(userId);
    console.log("✅ deleteUserCascade affected=", del);

    process.exit(0);
  } catch (err) {
    console.error(
      "❌ Adapter helper test failed:",
      err && err.message ? err.message : err
    );
    try {
      if (userId) {
        await db.deleteUserCascade(userId);
      }
    } catch (e) {
      console.warn("Cleanup failed:", e && e.message ? e.message : e);
    }
    process.exit(1);
  }
}

run();

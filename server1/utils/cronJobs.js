/**
 * Cron Jobs for ReachMe Server
 */

const cron = require("node-cron");
const { getDB } = require("../db/connection");
const publicReachMeCache = require("../utils/cache");

/**
 * Deactivate expired public ReachMe URLs
 * Runs every minute
 */
function startDeactivationCron() {
  cron.schedule("* * * * *", async () => {
    try {
      const db = getDB();
      const now = new Date();

      // Find URLs that need to be deactivated
      const [rows] = await db.execute(
        `SELECT url_code FROM pblcRechms 
         WHERE is_active = TRUE 
         AND deactivate_at IS NOT NULL 
         AND deactivate_at <= ?`,
        [now]
      );

      if (rows.length > 0) {
        console.log(
          `⏰ Deactivating ${rows.length} expired public ReachMe URLs`
        );

        for (const row of rows) {
          // Deactivate in database
          await db.execute(
            "UPDATE pblcRechms SET is_active = FALSE WHERE url_code = ?",
            [row.url_code]
          );

          // Deactivate in cache
          publicReachMeCache.deactivate(row.url_code);
        }

        console.log(`✅ Deactivated ${rows.length} URLs`);
      }
    } catch (error) {
      console.error("❌ Error in deactivation cron job:", error);
    }
  });

  console.log("✅ Deactivation cron job started (runs every minute)");
}

/**
 * Reload cache from database
 * Runs every hour
 */
function startCacheReloadCron() {
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("🔄 Reloading public ReachMe cache from database");

      const db = getDB();
      const [rows] = await db.execute(
        `SELECT p.id, p.user_id, p.url_code, p.is_active, p.deactivate_at, u.email 
         FROM pblcRechms p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.is_active = TRUE`
      );

      // Clear and rebuild cache
      publicReachMeCache.clear();

      for (const row of rows) {
        publicReachMeCache.set(row.url_code, {
          userId: row.user_id,
          userEmail: row.email,
          publicReachMeId: row.id,
          isActive: Boolean(row.is_active),
          deactivateAt: row.deactivate_at,
        });
      }

      const stats = publicReachMeCache.getStats();
      console.log(
        `✅ Cache reloaded: ${stats.totalUrls} URLs, ${stats.activeUrls} active`
      );
    } catch (error) {
      console.error("❌ Error in cache reload cron job:", error);
    }
  });

  console.log("✅ Cache reload cron job started (runs every hour)");
}

/**
 * Initialize all cron jobs
 */
function initCronJobs() {
  startDeactivationCron();
  startCacheReloadCron();
}

module.exports = {
  initCronJobs,
  startDeactivationCron,
  startCacheReloadCron,
};

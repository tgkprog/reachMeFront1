/**
 * Cron Jobs for ReachMe Server
 */

const cron = require("node-cron");
const db = require("../src/db");
const publicReachMeCache = require("../utils/cache");

/**
 * Deactivate expired public ReachMe URLs
 * Runs every minute
 */
function startDeactivationCron() {
  cron.schedule("* * * * *", async () => {
    try {
      // using src/db adapter
      const now = new Date();

      // Find URLs that need to be deactivated using adapter helper
      const rows = await db.findDuePublicReachMes(now);

      if (rows && rows.length > 0) {
        console.log(
          `⏰ Deactivating ${rows.length} expired public ReachMe URLs`
        );

        for (const row of rows) {
          // Deactivate in database via adapter
          await db.deactivatePublicReachMeByCode(row.url_code);

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

      // Load active public reachmes via adapter helper
      const rows = await db.listActivePublicReachMes();

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

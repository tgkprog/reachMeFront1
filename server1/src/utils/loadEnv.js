/**
 * Environment Loading Utility
 * Loads base .env and environment-specific overrides
 */

const path = require("path");
const fs = require("fs");
require("dotenv").config();

/**
 * Load environment-specific configuration
 * @param {string} baseDir - Base directory (usually __dirname from calling file)
 * @returns {object} - Loaded environment variables
 */
function loadEnv(baseDir = process.cwd()) {
  // Determine the server root directory
  let serverRoot = baseDir;

  // If we're in a subdirectory, navigate up to server1 root
  while (!fs.existsSync(path.join(serverRoot, ".env")) && serverRoot !== "/") {
    serverRoot = path.dirname(serverRoot);
  }

  // Load base .env first
  const baseEnvPath = path.join(serverRoot, ".env");
  if (fs.existsSync(baseEnvPath)) {
    require("dotenv").config({ path: baseEnvPath });
  }

  // Get environment type from env variable
  const env = process.env.env || "local";
  const envFile = `.${env}.env`;
  const envPath = path.join(serverRoot, envFile);

  // Load environment-specific overrides
  if (fs.existsSync(envPath)) {
    require("dotenv").config({ path: envPath, override: true });
    console.log(`✅ Loaded environment config from ${envFile}`);
  } else {
    console.log(`⚠️  Environment file ${envFile} not found, using base .env`);
  }

  return process.env;
}

module.exports = { loadEnv };

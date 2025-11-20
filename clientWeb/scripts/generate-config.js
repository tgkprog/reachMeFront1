#!/usr/bin/env node

/**
 * Generate public/config.js from environment variables
 * This script reads VITE_API_BASE_URL and creates a config file
 * that can be used by static HTML files in the public folder
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variable (Vite will inject this during build)
const apiBaseUrl = process.env.VITE_API_BASE_URL || "https://reachme2.com:8052";

const configContent = `// Auto-generated config file
// This file is generated during build/dev by reading environment variables
// DO NOT EDIT MANUALLY - Changes will be overwritten
window.APP_CONFIG = {
  API_BASE_URL: '${apiBaseUrl}'
};
`;

const outputPath = path.join(__dirname, "..", "public", "config.js");

fs.writeFileSync(outputPath, configContent, "utf8");

console.log(`✅ Generated config.js with API_BASE_URL: ${apiBaseUrl}`);

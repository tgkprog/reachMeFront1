/**
 * ReachMe Backend Server
 *
 * Express server with SSL/HTTPS support and Google OAuth integration
 * Supports both development (https://b.c.sel2in.com) and production (https://reachme2.com:8088)
 */

const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

// Load environment variables
const { loadEnv } = require("./src/utils/loadEnv");
loadEnv(__dirname);

// Import routes
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const publicReachMeRoutes = require("./routes/publicReachMe");
const adminRoutes = require("./routes/admin");
const userAuthRoutes = require("./routes/userAuth");

// Import database and cache
const { initDB } = require("./db/connection");
const { seedAdminUsers } = require("./db/createFirst");
const publicReachMeCache = require("./utils/cache");

const app = express();

// ===================================
// View Engine Configuration
// ===================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/main/templates"));

// ===================================
// Environment Configuration
// ===================================
const isDev = process.env.NODE_ENV === "development";
const PORT = isDev ? process.env.PORT || 8052 : process.env.PROD_PORT || 8088;
const BASE_URL = isDev ? process.env.DEV_BASE_URL : process.env.PROD_BASE_URL;

console.log(
  `🚀 Starting server in ${isDev ? "DEVELOPMENT" : "PRODUCTION"} mode`
);
console.log(`📍 Base URL: ${BASE_URL}`);

// ===================================
// Security Middleware
// ===================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development, enable in production
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// ===================================
// CORS Configuration
// ===================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",")
      : ["http://localhost:8080"];

    // Allow requests with no origin (mobile apps, Postman, curl, same-origin)
    if (!origin) return callback(null, true);

    // Trim whitespace from allowed origins
    const trimmedOrigins = allowedOrigins.map((o) => o.trim());

    if (trimmedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`   Allowed origins:`, trimmedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ===================================
// Basic Middleware
// ===================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(isDev ? "dev" : "combined"));

// ===================================
// Static Files
// ===================================
app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "public/admin")));

// ===================================
// Session Configuration
// ===================================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // HTTPS only
      httpOnly: true,
      maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

// ===================================
// Routes
// ===================================

// Favicon
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "images", "favicon.ico"));
});

// About page
app.get("/about.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "about.html"));
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    environment: isDev ? "development" : "production",
    baseUrl: BASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// Ping endpoint
app.get("/ping", (req, res) => {
  const version = fs
    .readFileSync(path.join(__dirname, "res", "version.txt"), "utf8")
    .trim();
  const dateTime = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  res.send(`pong ${dateTime} build 001 version ${version}`);
});

// Test endpoint with addition
app.get("/test", (req, res) => {
  const version = fs
    .readFileSync(path.join(__dirname, "res", "version.txt"), "utf8")
    .trim();
  const dateTime = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });

  const a = req.query.a;
  const s = req.query.s;

  let result;
  try {
    if (!a || !s) {
      throw new Error("Missing parameters");
    }

    const numA = parseInt(a, 10);
    const numS = parseInt(s, 10);

    if (isNaN(numA) || isNaN(numS)) {
      throw new Error("Invalid numbers");
    }

    const sum = numA + numS;
    result = `${a} + ${s} = ${sum} ${dateTime} build 001 version ${version}`;
  } catch (error) {
    result = `${a || "N/A"} + ${
      s || "N/A"
    } = N/A ${dateTime} build 001 version ${version}`;
  }

  res.send(result);
});

// OAuth routes
app.use("/oauth", authRoutes);

// Admin routes - protected by middleware defined in admin.js
app.use("/admin", adminRoutes);

// User authentication routes
app.use("/user", userAuthRoutes);

// API routes
app.use("/api", apiRoutes);

// ReachMe specific endpoints
app.use("/reachme", apiRoutes);

// Public ReachMe routes
app.use("/public-reachme", publicReachMeRoutes);
app.use("/r", publicReachMeRoutes);
app.use("/", publicReachMeRoutes); // Mount at root for /user/reach endpoint

// File download endpoint
app.get("/getFile", (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "File ID is required" });
  }

  // TODO: Implement file serving logic
  // For now, return a placeholder
  res.status(404).json({ error: "File not found" });
});

// ===================================
// Error Handling
// ===================================
app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: isDev ? err.message : "Internal server error",
    stack: isDev ? err.stack : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ===================================
// SSL/HTTPS Configuration
// ===================================
async function startServer() {
  try {
    // Initialize database
    console.log("🔌 Initializing database connection...");
    initDB();

    // Seed admin users
    console.log("👤 Seeding admin users...");
    await seedAdminUsers();

    // Load active public ReachMe URLs into cache
    console.log("📦 Loading public ReachMe URLs into cache...");
    const db = require("./db/connection").getDB();
    const [rows] = await db.execute(
      `SELECT p.id, p.user_id, p.url_code, p.is_active, p.deactivate_at, u.email 
       FROM pblcRechms p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.is_active = TRUE`
    );

    for (const row of rows) {
      publicReachMeCache.set(row.url_code, {
        userId: row.user_id,
        userEmail: row.email,
        publicReachMeId: row.id,
        isActive: Boolean(row.is_active),
        deactivateAt: row.deactivate_at,
      });
    }

    const cacheStats = publicReachMeCache.getStats();
    console.log(
      `✅ Loaded ${cacheStats.totalUrls} public ReachMe URLs into cache`
    );

    // Start cron jobs
    console.log("⏰ Starting cron jobs...");
    const { initCronJobs } = require("./utils/cronJobs");
    initCronJobs();

    // Check if SSL certificates exist
    const certPath = path.join(
      __dirname,
      process.env.SSL_CERT_PATH || "./cert/rentpay.com+3.pem"
    );
    const keyPath = path.join(
      __dirname,
      process.env.SSL_KEY_PATH || "./cert/rentpay.com+3-key.pem"
    );

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      // HTTPS Server
      const httpsOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      };

      const httpsServer = https.createServer(httpsOptions, app);

      httpsServer.listen(PORT, () => {
        console.log(`✅ HTTPS Server running on ${BASE_URL}:${PORT}`);
        console.log(`🔒 SSL enabled with certificates from ${certPath}`);
        console.log(
          `📝 Google OAuth callback: ${BASE_URL}${
            PORT !== 443 && PORT !== 8088 ? `:${PORT}` : ""
          }/oauth/google/callback`
        );
      });

      // Also start HTTP server for redirects (optional)
      if (isDev) {
        const httpServer = http.createServer((req, res) => {
          res.writeHead(301, {
            Location: `https://${req.headers.host}${req.url}`,
          });
          res.end();
        });

        httpServer.listen(8080, () => {
          console.log(`🔄 HTTP redirect server running on port 8080`);
        });
      }
    } else {
      console.warn("⚠️  SSL certificates not found. Starting HTTP server...");
      console.warn(`   Expected cert: ${certPath}`);
      console.warn(`   Expected key: ${keyPath}`);

      // Fallback to HTTP
      const httpServer = http.createServer(app);
      httpServer.listen(PORT, () => {
        console.log(`✅ HTTP Server running on http://localhost:${PORT}`);
        console.log(`⚠️  Running without SSL - not recommended for production`);
      });
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// ===================================
// Graceful Shutdown
// ===================================
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

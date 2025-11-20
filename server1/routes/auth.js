/**
 * Authentication Routes
 *
 * Handles Google OAuth authentication with environment-specific callback URLs
 */

const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");

const isDev = process.env.NODE_ENV === "development";
const BASE_URL = isDev ? process.env.DEV_BASE_URL : process.env.PROD_BASE_URL;
const PORT = isDev ? process.env.PORT || 8052 : process.env.PROD_PORT || 8088;

// Construct callback URL based on environment
const getCallbackURL = () => {
  if (isDev) {
    return `${BASE_URL}/oauth/google/callback`;
  } else {
    // Production uses port 8088
    return `${BASE_URL}:${PORT}/oauth/google/callback`;
  }
};

console.log(`🔑 Google OAuth Callback URL: ${getCallbackURL()}`);

// ===================================
// Passport Google OAuth Strategy
// ===================================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: getCallbackURL(),
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const db = require("../src/db");

        const googleEmail = profile.emails[0].value;

        // Search for user by Google OAuth email via adapter
        const user = await db.getUserByGoogleEmail(googleEmail);
        if (!user) {
          return done(null, false, {
            message: "No account found with this Google email",
          });
        }

        // Check if Google OAuth is enabled for this user
        if (!user.googleOauth) {
          return done(null, false, {
            message: "Google OAuth is not enabled for this account",
          });
        }

        // Check account status
        if (user.account_status !== "active") {
          return done(null, false, { message: "Account is not active" });
        }

        // Return user data with primary email (not Google email)
        const userData = {
          id: user.id,
          email: user.email, // Primary email
          googleEmail: user.USER_GOOGLE_EMAIL, // Google OAuth email
          firstName: user.first_name,
          lastName: user.last_name,
          photoUrl:
            profile.photos && profile.photos[0]
              ? profile.photos[0].value
              : null,
          accessToken,
        };

        return done(null, userData);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Initialize Passport
const passportInitialized = passport.initialize();
const passportSession = passport.session();

router.use(passportInitialized);
router.use(passportSession);

// ===================================
// OAuth Routes
// ===================================

/**
 * GET /oauth/google
 * Initiates Google OAuth flow
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
  })
);

/**
 * GET /oauth/google/callback
 * Google OAuth callback handler
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/oauth/login/failed",
    session: false,
  }),
  (req, res) => {
    try {
      // Generate JWT token with primary email
      const token = jwt.sign(
        {
          userId: req.user.id,
          email: req.user.email, // Primary email
          googleEmail: req.user.googleEmail, // Google OAuth email
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: "user",
        },
        process.env.JWT_SECRET || "your-jwt-secret",
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "24h",
        }
      );

      // Set JWT as HTTP-only cookie
      res.cookie("authToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return success with user data and token
      res.json({
        success: true,
        message: "Authentication successful",
        user: {
          id: req.user.id,
          email: req.user.email, // Primary email
          googleEmail: req.user.googleEmail, // Google OAuth email
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          photoUrl: req.user.photoUrl,
        },
        token,
      });
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).json({
        success: false,
        error: "Authentication failed",
      });
    }
  }
);

/**
 * GET /oauth/login/failed
 * OAuth failure handler
 */
router.get("/login/failed", (req, res) => {
  res.status(401).json({
    success: false,
    error: "Authentication failed",
    message: "Google OAuth authentication failed",
  });
});

/**
 * POST /oauth/logout
 * Logout endpoint
 */
router.post("/logout", (req, res) => {
  res.clearCookie("authToken");
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
});

module.exports = router;

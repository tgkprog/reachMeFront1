**User tokens, refresh token, security and stay logged in app**

in a server that supports a android app; android app wants user to remain logged in unless they explicitly log out; so on login - give two tokens - auth token and refresh token? and ahve a different endpoint /user/token/refresh that takes refresh-token and gives back a new refresh token and user - token? and on app save email and tokens so when app is launcjhed it auto logs in and if needed refreshes token in background with server

Yes, this is the standard and clean approach.

**Flow:**

1. **On login (email + password):**
   Server returns:

   * `access_token` (short expiry, e.g. 60 min)
   * `refresh_token` (long expiry, e.g. 90 days)

2. **App stores:**

   * email
   * access_token
   * refresh_token
     (Secure storage only. Not SharedPreferences if possible.)

3. **API calls:**

   * App sends `Authorization: Bearer <access_token>`
   * If server replies “expired token”, app silently calls `/user/token/refresh`.

4. **Refresh endpoint:**

   * POST `/user/token/refresh`
   * Body: `{ refresh_token: "..." }`
     Server returns new pair:
   * new access_token
   * new refresh_token
     (Rotate refresh token each time for safety.)

5. **App workflow on launch:**

   * Check if refresh token exists
   * Try refreshing once
   * If refresh works → user stays logged in
   * If refresh fails → ask user to login again

6. **On logout:**

   * App calls logout and sends tokens and email to /user/logout api, deletes both tokens on app. But on login screen by email - populates last email
   * Optionally server invalidates refresh token in DB/memory

**This keeps user logged in indefinitely unless they logout themselves, and is the correct modern mobile pattern.**

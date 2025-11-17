# Changelog

## [Unreleased] - 2025-01-18

### Changed

#### URL Pattern Update
- **Old Pattern:** `/public/contact/<urlCode>`
- **New Pattern:** `/r/<urlCode>/`
- **Reason:** Shorter, cleaner URLs that are easier to share

#### Token Generation Strategy
- **Old Logic:** 5 chars (200 attempts) → 6 chars (200 attempts)
- **New Logic:** Progressive collision handling with multiple lengths
  - 3 chars: 50 attempts
  - 4 chars: 200 attempts
  - 5 chars: 200 attempts
  - 6 chars: 200 attempts
  - 7 chars: 200 attempts
- **Reason:** Start with shorter codes, expand only when needed

### Modified Files

1. **server1/utils/helpers.js**
   - Updated `generateUniqueCode()` function
   - Implemented progressive collision handling
   - Added console logging for debugging

2. **server1/routes/publicReachMe.js**
   - Updated route paths: `/contact/:urlCode` → `/:urlCode/`
   - Updated all URL construction in responses
   - Updated HTML form fetch endpoint

3. **server1/server.js**
   - Updated route mounting: `/public` → `/r`
   - Kept `/public-reachme` for management APIs

4. **server1/docs/PUBLIC_REACHME_API.md**
   - Updated all examples to use `/r/` pattern
   - Updated token generation documentation
   - Updated collision handling details

### Example URLs

**Before:**
```
https://reachme2.com:8052/public/contact/b3k7n
```

**After:**
```
https://reachme2.com:8052/r/b3k/
```

### API Compatibility

- Management endpoints (`/public-reachme/*`) remain unchanged
- Public access endpoints moved to `/r/` for brevity
- All authenticated endpoints still work the same way

### Testing Checklist

- [ ] Create new public ReachMe URL via API
- [ ] Verify URL format is `/r/<code>/`
- [ ] Check token starts at 3 characters
- [ ] Access public contact form at new URL
- [ ] Submit message through new endpoint
- [ ] Verify caching still works correctly
- [ ] Test deactivation functionality
- [ ] Verify list endpoint returns correct URLs

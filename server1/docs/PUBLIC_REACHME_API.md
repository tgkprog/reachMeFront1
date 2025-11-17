# Public ReachMe API Documentation

## Overview

Public ReachMe allows users to create temporary, shareable URLs where people can send them urgent messages.

**URL Format:** `/r/{urlCode}/`  
Example: `https://reachme2.com:8052/r/b3k/`

## Authentication

Most endpoints require JWT authentication via Bearer token or cookie.

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## API Endpoints

### 1. Create Public ReachMe URL

**POST** `/public-reachme/create`

**Auth:** Required

**Body:**
```json
{
  "deactivateAt": "2025-11-18T15:30:00Z"  // Optional, ISO 8601 format
}
```

**Response:**
```json
{
  "success": true,
  "urlCode": "b3k",
  "publicReachMeId": 123,
  "url": "/r/b3k/",
  "fullUrl": "https://reachme2.com:8052/r/b3k/",
  "isActive": true,
  "deactivateAt": "2025-11-18T15:30:00Z",
  "createdAt": "2025-11-18T10:00:00Z"
}
```

**Rules:**
- URL code starts at 3 characters
- Progressive collision handling: 3→4→5→6→7 chars (50, 200, 200, 200, 200 attempts)
- Uses consonants and numbers only (no vowels to avoid accidental words)
- If `deactivateAt` is null, URL never expires automatically
- If set, must be at least 30 minutes in the future

---

### 2. Deactivate Public ReachMe URL

**POST** `/public-reachme/deactivate/:urlCode`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "Public ReachMe URL deactivated",
  "urlCode": "b3k"
}
```

**Rules:**
- Only the owner can deactivate
- Once deactivated, URL cannot be reactivated
- Deactivated URLs return 400 error when accessed

---

### 3. Update Deactivation Time

**PUT** `/public-reachme/update-deactivate/:urlCode`

**Auth:** Required

**Body:**
```json
{
  "deactivateAt": "2025-11-19T10:00:00Z"  // Or null to remove expiration
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deactivation time updated",
  "urlCode": "b3k",
  "deactivateAt": "2025-11-19T10:00:00Z"
}
```

**Rules:**
- Only works for active URLs
- New time must be at least 30 minutes from now
- If current deactivation exists, new time must be later
- Can set to `null` to remove expiration

---

### 4. List User's Public URLs

**GET** `/public-reachme/list`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "count": 2,
  "urls": [
    {
      "id": 123,
      "urlCode": "b3k",
      "url": "/r/b3k/",
      "fullUrl": "https://reachme2.com:8052/r/b3k/",
      "isActive": true,
      "deactivateAt": "2025-11-18T15:30:00Z",
      "createdAt": "2025-11-18T10:00:00Z",
      "updatedAt": "2025-11-18T10:00:00Z"
    }
  ]
}
```

---

### 5. View Contact Form (Public)

**GET** `/r/:urlCode/`

**Auth:** Not required (public)

**Response:** HTML contact form

**Errors:**
- 404 if URL doesn't exist
- 400 if URL is deactivated

---

### 6. Submit Message (Public)

**POST** `/r/:urlCode/`

**Auth:** Not required (public)

**Body:**
```json
{
  "message": "Urgent: Your car is parked in a tow-away zone!",
  "senderInfo": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your message has been sent successfully"
}
```

**Rules:**
- `message` is required
- `senderInfo` is optional
- URL must be active
- Creates alarm for URL owner

---

### 7. Get User's Messages/Alarms

**GET** `/api/reachme/messages`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "count": 5,
  "messages": [
    {
      "id": 456,
      "publicReachMeId": 123,
      "message": "Urgent: Your car is parked in a tow-away zone!",
      "datetimeAlarm": "2025-11-18T12:00:00Z",
      "isAckApp": false,
      "isAckAll": false,
      "senderInfo": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2025-11-18T12:00:00Z"
    }
  ]
}
```

**Available on:**
- Web app (authenticated)
- Android app (authenticated)

---

### 8. Acknowledge Message

**PUT** `/api/reachme/messages/:id/acknowledge`

**Auth:** Required

**Body:**
```json
{
  "ackType": "app"  // or "all"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message acknowledged"
}
```

**Ack Types:**
- `app` - Acknowledged in mobile app
- `all` - Fully acknowledged (won't show anywhere)

---

## Database Schema

### pblcRechms Table
```sql
id              INT (primary key)
user_id         INT (foreign key to users)
url_code        VARCHAR(10) (unique)
is_active       BOOLEAN
deactivate_at   TIMESTAMP (nullable)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### reach_me_messages Table
```sql
id                 INT (primary key)
user_id            INT (foreign key to users)
public_reachme_id  INT (foreign key to pblcRechms)
message            TEXT
datetime_alarm     TIMESTAMP
is_ack_app         BOOLEAN
is_ack_all         BOOLEAN
sender_info        JSON
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

---

## Cron Jobs

### Deactivation Job
- **Schedule:** Every minute
- **Function:** Deactivates URLs where `deactivate_at <= NOW()`
- **Updates:** Both database and runtime cache

### Cache Reload Job
- **Schedule:** Every hour
- **Function:** Reloads all active URLs from database into cache
- **Purpose:** Ensures cache stays in sync with database

---

## Runtime Cache

All active public ReachMe URLs are cached in memory to avoid database lookups.

**Cache Operations:**
- Automatically updated on create/update/deactivate
- Reloaded hourly from database
- Checked before database on incoming requests

**Cache Stats Endpoint:**
```javascript
// Available in code
const stats = publicReachMeCache.getStats();
// Returns: { totalUrls, totalUsers, activeUrls }
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request (validation error, URL inactive) |
| 401 | Not authenticated |
| 403 | Forbidden (not owner) |
| 404 | URL not found |
| 500 | Server error |

---

## Example Usage Flow

1. **User creates URL:**
   ```bash
   curl -X POST https://reachme2.com:8052/public-reachme/create \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"deactivateAt": "2025-11-18T23:59:59Z"}'
   ```

2. **User shares URL:** 
   `https://reachme2.com:8052/r/b3k/`

3. **Someone sends message:**
   ```bash
   curl -X POST https://reachme2.com:8052/r/b3k/ \
     -H "Content-Type: application/json" \
     -d '{"message": "Emergency!", "senderInfo": {"name": "Friend"}}'
   ```

4. **User checks messages:**
   ```bash
   curl https://reachme2.com:8052/api/reachme/messages \
     -H "Authorization: Bearer TOKEN"
   ```

5. **User acknowledges:**
   ```bash
   curl -X PUT https://reachme2.com:8052/api/reachme/messages/456/acknowledge \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"ackType": "all"}'
   ```

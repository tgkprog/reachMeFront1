# Reach Me System Requirements

## 1. Overview

The Reach Me system allows a user to be contacted by others through controlled priority messages. The user may share private or public forms to receive messages. The system ensures controlled priority, sender identity (optional), spam protection, and appropriate notification channels.

The application is free to use, with optional paid features (SMS/WhatsApp). Users can sign up via Google. The app works in India and USA, supporting different payment gateways based on region.

User can also install mobile android app, and allow it to call another number on certain calls/ urgent notifications - custom call forwarding. Example when you need to go inside a secure area where personal mobiles are not allowed but have a company mobile or landline. Security guard phone outside but one of them will come get you.

User's can also be configured to receive notifications/ messages from another user (both users need to concent, can be initiated by either). Example for a support team or of a family member so more than one user is notified by one event.

Depending on the sender and priority the user can configure the server to send them in app alarm, whatsapp, sms, email and other messages.

## 2. User Accounts

* Users sign up using Google login.
* Each user has a unique user ID.                                                                                                       
* Each user may configure notification priorities, channels and rules.
* Users may have an account balance.

## 3. Notification Channels

A user defines which channels to use depending on priority levels:

* Priority 1–5 range.
* For each priority level, allowed channels may include:

  * In-app (client polls Reach Me API periodically)
  * Email
  * WhatsApp (only if user has sufficient balance)
  * SMS (only if user has sufficient balance)
  * calls
  * other to be added like telegram message and call

Costs for WhatsApp, SMS, etc are stored in a configuration table.

## 4. Payments & Balance

* Users can add balance.
* Payment must support India and US users.
* Payment gateway selection depends on user region or configuration.
* SMS/WhatsApp notifications consume balance according to cost-per-message defined in database.
* If a user lacks sufficient balance, those channels are skipped.

## 5. Contacts (Private Reach)

Users can define contacts who are allowed to send messages with a defined maximum priority.

* Contact record includes:

  * userId (receiver)
  * contactId (sender)
  * maxAllowedPriority
  * status (active or inactive)
* Contact must be verified before becoming active.
* Verification may be through phone OTP or email confirmation.

## 6. Public Reach-Me Form

A user may generate a shareable public reach form.

* Form URL format:
  `https://<base>/reachme/form/<publicFormId>`
* `<publicFormId>` is a random 10-character token, allowed chars: `a-z`, `0-9`, `-`, `_`, `;`.
* The form displays:

  * Title: "Contact <UserName>"
  * Sender Name (optional input)
  * Priority dropdown — allowed priority levels for this form
  * Message input (free text or predefined messages)
  * CAPTCHA

## 7. Priority Rules

* A user can globally set priority rules.
* For private contacts:

  * Contact cannot send priority higher than `maxAllowedPriority` assigned.
* For public forms:

  * The form defines allowed priority range.

## 8. Rate Limiting & Abuse Protection

Each public form enforces message submission limits:

* Max submissions per 10 minutes
* Max submissions per hour
* Max submissions per day
* Max total submissions lifetime
* The user can lower these numbers on a per-form basis but cannot raise above global system defaults.
* If any limit is exceeded, message is rejected and user is not notified.
* A CAPTCHA must be solved to send.

## 9. Message Handling

When a message is submitted (private or public):

* Validate allowed priority.
* Validate CAPTCHA (for public forms).
* Store message in database.
* Insert or update in-memory cache for quick retrieval.
* Trigger notifications based on priority and channel configuration.

## 10. In-Memory Cache

* Cache maps userId -> current active/recent message.
* Cache is updated at time of message creation.
* Client polls the `/reachme/check` endpoint to retrieve messages.
* On acknowledgment, the message is cleared from cache and marked delivered in DB.

## 11. Client Polling

* Client calls `/reachme/check?userId=...&token=...`.
* If no message, returns empty data.
* If message exists, returns caller, message, priority.

## 12. Acknowledgment

* Client acknowledges after displaying message.
* System removes the message from cache.
* System updates message status in DB (delivered/seen).

## 13. Database Notes (Structure direction only, not final schema)

* Users table
* Contacts table
* PublicForms table
* Messages table
* Config table (SMS/WhatsApp costs, system default rate limits)
* FormRateLimits table (or counters stored and periodically persisted)

## 14. Geographic / Payment Considerations

* Detect user region at signup or via IP or profile choice.
* Use appropriate gateway (e.g., Razorpay for India, Stripe for USA).
* Balance is stored in a common format (e.g., in local currency per user).

## 15. Startup Behavior

* On server start, load:

  * Users
  * Contacts
  * Public form configurations
  * Notification settings
* Do not load messages into cache; cache is only for active/pending messages.

## 16. Security Notes

* All key operations require authentication.
* Public form only submits with CAPTCHA.
* Throttling prevents spam.
* Messages stored permanently until acknowledged.

---

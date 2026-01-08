# Push Notifications System Guide

## How Push Notifications Work

### 1. **Basic Flow**

```
[Your Server] → [Push Service] → [User's Device/Browser] → [Notification Appears]
```

### 2. **Components**

#### **A. Web Push Notifications (Browser)**
- **Service Worker**: JavaScript file that runs in the background
- **Push Service**: Browser vendor's push service (Firebase Cloud Messaging, etc.)
- **VAPID Keys**: Public/private key pair for authentication
- **Subscription**: Unique endpoint for each user's browser

#### **B. Mobile Push Notifications**
- **APNs** (Apple Push Notification service) for iOS
- **FCM** (Firebase Cloud Messaging) for Android
- **Device Tokens**: Unique identifiers for each device

### 3. **Step-by-Step Process**

#### **Step 1: User Subscribes**
1. User visits your website/app
2. Browser/App requests permission to send notifications
3. User grants permission
4. Service Worker registers with push service
5. Push service returns a **subscription object** (contains endpoint URL)
6. Subscription is sent to your server and stored in database

#### **Step 2: Server Sends Notification**
1. Event occurs (e.g., new incident, detention assigned)
2. Your server creates notification in database
3. Server retrieves user's subscription/device token
4. Server sends push payload to push service
5. Push service delivers to user's device/browser

#### **Step 3: Device Receives & Displays**
1. Device receives push message
2. Service Worker (web) or App (mobile) handles it
3. Notification appears even if app is closed
4. User clicks notification → app opens to relevant page

## Implementation Options for Your PDS System

### Option 1: Web Push (Browser) - Recommended for Web App

**Technologies:**
- **Service Worker API** (built into browsers)
- **Web Push Protocol** (standard)
- **VAPID keys** (for authentication)

**Libraries:**
- `web-push` (Node.js backend)
- `serviceworker` (frontend)

**Flow:**
```
1. User logs in → Request notification permission
2. Generate subscription → Store in database
3. When event occurs → Send push via web-push library
4. Browser shows notification
```

### Option 2: Firebase Cloud Messaging (FCM) - Cross-platform

**Technologies:**
- Firebase Cloud Messaging
- Works for both web and mobile

**Flow:**
```
1. Register app with Firebase
2. Get FCM tokens for each user/device
3. Store tokens in database
4. Send notifications via FCM API
```

### Option 3: Hybrid Approach
- Web Push for browser users
- FCM for mobile app (if you build one later)

## Database Schema Addition

You'll need to add a table to store push subscriptions:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    device_type TEXT, -- 'web', 'ios', 'android'
    device_token TEXT, -- For mobile
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, endpoint) -- One subscription per user/device
);
```

## Implementation Steps

### Backend Changes

1. **Install web-push library**
   ```bash
   npm install web-push
   ```

2. **Generate VAPID keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Create subscription endpoint**
   ```javascript
   POST /api/push/subscribe
   - Store subscription in database
   ```

4. **Create send notification endpoint**
   ```javascript
   POST /api/push/send
   - Send push notification to user
   ```

5. **Modify existing notification creation**
   - When creating in-app notification, also send push

### Frontend Changes

1. **Request permission**
   ```javascript
   Notification.requestPermission()
   ```

2. **Register Service Worker**
   ```javascript
   navigator.serviceWorker.register('/sw.js')
   ```

3. **Subscribe to push**
   ```javascript
   registration.pushManager.subscribe()
   ```

4. **Handle incoming notifications**
   ```javascript
   self.addEventListener('push', (event) => {
     // Show notification
   })
   ```

## Example Use Cases in Your System

1. **New Behavior Incident**
   - Parent receives: "New incident reported for [Child Name]"

2. **Detention Assigned**
   - Parent receives: "[Child Name] has been assigned detention on [Date]"

3. **Merit Awarded**
   - Parent receives: "Congratulations! [Child Name] received a merit"

4. **Attendance Alert**
   - Parent receives: "[Child Name] was marked absent today"

5. **New Message**
   - User receives: "New message from [Teacher/Admin]"

## Security Considerations

1. **VAPID Keys**: Keep private key secure on server
2. **HTTPS Required**: Push notifications only work over HTTPS
3. **User Consent**: Always request permission first
4. **Subscription Validation**: Verify subscriptions before sending

## Benefits for Your System

✅ **Real-time alerts** even when users aren't logged in
✅ **Better engagement** - parents stay informed
✅ **Reduced missed notifications** - system-level alerts
✅ **Professional appearance** - modern feature
✅ **Mobile-friendly** - works on phones/tablets

## Current vs Push Notifications

| Feature | Current (In-App) | Push Notifications |
|---------|------------------|-------------------|
| Works offline | ❌ | ✅ |
| Shows when app closed | ❌ | ✅ |
| Requires login | ✅ | ❌ |
| System-level alert | ❌ | ✅ |
| Sound/Badge | ❌ | ✅ |
| Click to open app | ❌ | ✅ |

## Next Steps

1. Decide on approach (Web Push vs FCM)
2. Set up HTTPS (required for push)
3. Generate VAPID keys
4. Implement subscription storage
5. Create Service Worker
6. Add send notification logic
7. Test with real devices












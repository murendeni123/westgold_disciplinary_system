# iOS Notification Troubleshooting Guide

## Why Notifications Don't Work on iOS

### Common Issues:

1. **Notification Permission Not Granted**
   - iOS requires explicit permission
   - Must be granted through user interaction
   - Check: Settings → Safari → [Your Site] → Notifications

2. **Socket.io Not Connected**
   - Check browser console for connection status
   - Should see "✅ Socket.io connected successfully"
   - If not, check network/firewall

3. **App Not Added to Home Screen**
   - iOS notifications work better when app is added to home screen
   - Safari → Share → Add to Home Screen

4. **iOS Settings Blocking Notifications**
   - Settings → [App Name] → Notifications → Allow Notifications must be ON
   - Check notification styles (Banners, Sounds, etc.)

5. **Focus/Do Not Disturb Mode**
   - Check if Focus mode is blocking notifications
   - Settings → Focus → Check active modes

## Step-by-Step Debugging

### Step 1: Check Notification Permission

**On iPhone:**
1. Open Safari
2. Go to your app: `http://192.168.18.160:3000`
3. Open browser console (if possible) or check in Settings

**Check Permission Status:**
- Open browser console and type: `Notification.permission`
- Should return: `"granted"`, `"denied"`, or `"default"`

**If not granted:**
1. Go to Settings → Push Notifications
2. Click "Enable Push Notifications"
3. Tap "Allow" when iOS asks

### Step 2: Check Socket.io Connection

**On iPhone (if you can access console):**
- Look for: "✅ Socket.io connected successfully"
- If you see "❌ Socket.io connection error", there's a connection problem

**Check Backend:**
- Backend terminal should show: "User X connected"
- If not, Socket.io isn't connecting

### Step 3: Check iOS Notification Settings

1. **Settings → [App Name] → Notifications**
   - "Allow Notifications" must be ON
   - Check notification styles:
     - Lock Screen: ON
     - Notification Center: ON
     - Banners: ON (or Alerts)
     - Sounds: ON (optional)
     - Badges: ON (optional)

2. **Settings → Focus**
   - Make sure no Focus mode is blocking notifications
   - Check "Do Not Disturb" is OFF

### Step 4: Test Notification Creation

**Send a test message:**
1. From computer, send a message to the parent account on iPhone
2. Check backend console for: "Notification created for message"
3. Check if Socket.io event is emitted

**Check Frontend:**
- Browser console should show: "New notification received via Socket.io"
- Should show: "Showing browser notification for: [title]"

### Step 5: Verify App Setup

**For iOS:**
1. ✅ App added to Home Screen
2. ✅ Opened from Home Screen (not Safari)
3. ✅ iOS 16.4+ (for Web Push)
4. ✅ Notification permission granted
5. ✅ Socket.io connected

## Quick Test Checklist

- [ ] Notification permission is "granted"
- [ ] Socket.io shows "connected"
- [ ] Backend shows "User X connected"
- [ ] iOS Settings → [App] → Notifications → Allow is ON
- [ ] No Focus/Do Not Disturb mode active
- [ ] App added to Home Screen (recommended)
- [ ] Test message sent from another device
- [ ] Backend console shows "Notification created"
- [ ] Browser console shows "New notification received"

## Common Fixes

### Fix 1: Request Permission Manually
```javascript
// In browser console:
Notification.requestPermission().then(permission => {
  console.log('Permission:', permission);
});
```

### Fix 2: Check Socket.io Connection
```javascript
// In browser console:
// Should see socket connection logs
```

### Fix 3: Verify iOS Settings
- Settings → [App Name] → Notifications → Allow Notifications: ON
- Settings → Focus → Check active modes

### Fix 4: Add to Home Screen
- Safari → Share → Add to Home Screen
- Open app from Home Screen icon

## Debugging Commands

**In Browser Console (if accessible):**
```javascript
// Check notification permission
Notification.permission

// Request permission
Notification.requestPermission()

// Test notification
new Notification('Test', { body: 'This is a test' })

// Check Socket.io
// Look for connection logs in console
```

**Backend Console:**
- Should see: "User X connected" when user logs in
- Should see: "Notification created for message" when message is sent
- Should see Socket.io events being emitted

## Still Not Working?

1. **Check browser console for errors**
2. **Check backend console for errors**
3. **Verify Socket.io is connecting**
4. **Test with a simple notification:**
   ```javascript
   new Notification('Test', { body: 'Test notification' })
   ```
5. **Check iOS version** (must be 16.4+)
6. **Try different browser** (Safari is required for iOS)

## Expected Behavior

**When working correctly:**
1. User logs in → Socket.io connects
2. Message sent → Backend creates notification
3. Socket.io emits "new-notification" event
4. Frontend receives event
5. Browser shows notification popup
6. Notification appears in notification center

**If any step fails, check the logs for that step.**











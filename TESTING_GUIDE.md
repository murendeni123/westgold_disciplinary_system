# Testing Guide: Two-Device Setup

## Your Network Setup
- **Computer IP Address:** `192.168.18.160`
- **Frontend Port:** `3000`
- **Backend Port:** `5000`

## Step-by-Step Testing Instructions

### 1. Start the Servers on Your Computer

Make sure both servers are running:

**Terminal 1 - Backend:**
```bash
cd "/Users/wow/Documents/pds system/backend"
npm start
```

**Terminal 2 - Frontend:**
```bash
cd "/Users/wow/Documents/pds system/frontend"
npm run dev
```

You should see:
- Backend: `Server running on http://localhost:5000`
- Frontend: `Local: http://localhost:3000`

### 2. Connect Your Phone to the Same WiFi Network

- Make sure your phone is connected to the **same WiFi network** as your computer
- Check WiFi network name on both devices

### 3. Access the App from Your Phone

Open your phone's browser (Chrome, Safari, etc.) and go to:

```
http://192.168.18.160:3000
```

**Important:** Use `http://` (not `https://`) and include the port `:3000`

### 4. Test Messaging Between Devices

#### Setup Test Accounts:
1. **On Computer:** Login as one user (e.g., Admin or Teacher)
2. **On Phone:** Login as another user (e.g., Parent or different Teacher)

#### Test Scenarios:

**A. Send Message from Computer to Phone:**
1. On computer, go to Messages page
2. Select the user logged in on phone
3. Send a message
4. **Expected on Phone:**
   - Browser notification popup appears
   - Message appears in real-time in the chat
   - Notification appears in notification center

**B. Send Message from Phone to Computer:**
1. On phone, go to Messages page
2. Select the user logged in on computer
3. Send a message
4. **Expected on Computer:**
   - Browser notification popup appears
   - Message appears in real-time in the chat
   - Notification appears in notification center

### 5. Test Notifications

**Browser Notification Permission:**
- When you first access the app, the browser will ask for notification permission
- Click "Allow" on both devices
- To check permission status, open browser console and type: `Notification.permission`

**What to Test:**
- ✅ Real-time message delivery (messages appear instantly)
- ✅ Browser notification popups
- ✅ Notification in notification center/bell icon
- ✅ Unread message count updates
- ✅ Typing indicators (if typing)
- ✅ File attachments (if sending files)

### 6. Troubleshooting

**If you can't access the app from phone:**

1. **Check Firewall:**
   - macOS: System Settings → Network → Firewall
   - Make sure ports 3000 and 5000 are allowed

2. **Verify IP Address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   - Make sure it matches `192.168.18.160`

3. **Check Both Devices on Same Network:**
   - Verify WiFi network name is the same
   - Try pinging from phone: Open terminal app and type: `ping 192.168.18.160`

4. **Check Backend is Accessible:**
   - From phone browser, try: `http://192.168.18.160:5000/api/health`
   - Should return: `{"status":"OK","message":"PDS Backend API is running"}`

5. **Check Console Logs:**
   - Browser console (F12 or Inspect) on both devices
   - Backend terminal for any errors
   - Look for Socket.io connection messages

**If notifications don't work:**

1. **Check Permission:**
   - Browser console: `Notification.permission` should be "granted"

2. **Check Socket.io Connection:**
   - Browser console should show "Socket connected"
   - Backend terminal should show "User X connected"

3. **Check Browser Settings:**
   - Make sure browser notifications are enabled
   - Check "Do Not Disturb" mode is off

### 7. Testing Checklist

- [ ] Can access app from phone at `http://192.168.18.160:3000`
- [ ] Can login on both devices
- [ ] Can send messages from computer to phone
- [ ] Can send messages from phone to computer
- [ ] Messages appear in real-time (no refresh needed)
- [ ] Browser notifications appear when receiving messages
- [ ] Notifications appear in notification center
- [ ] Unread count updates correctly
- [ ] Can send file attachments
- [ ] Typing indicators work (if implemented)

### 8. Network IP Address (If Changed)

If your computer's IP address changes, update these files:

1. `frontend/src/services/api.ts` - Line 10
2. `frontend/src/hooks/useSocket.ts` - Line 9
3. `frontend/vite.config.ts` - Line 11

Replace `192.168.18.160` with your new IP address.

## Quick Test Commands

**Check if backend is accessible:**
```bash
curl http://192.168.18.160:5000/api/health
```

**Check if frontend is accessible:**
```bash
curl http://192.168.18.160:3000
```

**Find your IP address:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1
```











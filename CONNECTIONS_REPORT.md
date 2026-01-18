# Frontend-Backend Connections Report
## Westgold Disciplinary System
**Generated:** January 18, 2026

---

## Table of Contents
1. [System Overview](#system-overview)
2. [API Endpoints](#api-endpoints)
3. [WebSocket Connections](#websocket-connections)
4. [Authentication Flows](#authentication-flows)
5. [Database Schema](#database-schema)
6. [Frontend-Backend Mapping](#frontend-backend-mapping)
7. [Third-Party Integrations](#third-party-integrations)
8. [Security Configuration](#security-configuration)
9. [Known Issues & Recommendations](#known-issues--recommendations)

---

## 1. System Overview

### Architecture
- **Backend:** Node.js + Express.js (Port 5000)
- **Frontend:** React + TypeScript + Vite (Port 3000)
- **Database:** PostgreSQL (Supabase hosted)
- **Real-time:** Socket.io for WebSocket connections
- **Authentication:** JWT (JSON Web Tokens)

### Communication Flow
```
Frontend (React) --> Vite Proxy (/api) --> Backend (Express) --> PostgreSQL (Supabase)
                                      --> Socket.io (Real-time)
```

---

## 2. API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/login` | No | Any | User login, returns JWT token |
| GET | `/me` | Yes | Any | Get current user info |
| PUT | `/profile` | Yes | Any | Update user profile |
| PUT | `/change-password` | Yes | Any | Change password |
| POST | `/signup` | No | Parent | Parent registration |

### Platform Routes (`/api/platform`) - Super Admin Portal
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/login` | No | Platform Admin | Platform admin login |
| GET | `/settings` | Yes | Platform Admin | Get platform settings |
| PUT | `/settings` | Yes | Platform Admin | Update platform settings (incl. Goldie Badge) |
| GET | `/plans` | Yes | Platform Admin | Get subscription plans |
| POST | `/plans` | Yes | Platform Admin | Create subscription plan |
| PUT | `/plans/:id` | Yes | Platform Admin | Update subscription plan |
| GET | `/schools` | Yes | Platform Admin | List all schools |
| GET | `/schools/:id` | Yes | Platform Admin | Get school details |
| POST | `/schools` | Yes | Platform Admin | Create school |
| PUT | `/schools/:id` | Yes | Platform Admin | Update school |
| DELETE | `/schools/:id` | Yes | Platform Admin | Delete school |
| PUT | `/schools/bulk/status` | Yes | Platform Admin | Bulk update school status |
| PUT | `/schools/:id/subscription` | Yes | Platform Admin | Update school subscription |
| GET | `/analytics` | Yes | Platform Admin | Get platform analytics |
| GET | `/billing` | Yes | Platform Admin | Get billing information |
| GET | `/logs` | Yes | Platform Admin | Get activity logs |
| GET | `/users` | Yes | Platform Admin | List platform users |
| GET | `/users/profile` | Yes | Platform Admin | Get current admin profile |
| PUT | `/users/profile` | Yes | Platform Admin | Update admin profile |
| PUT | `/users/password` | Yes | Platform Admin | Change admin password |
| POST | `/users` | Yes | Platform Admin | Create platform user |
| PUT | `/users/:id` | Yes | Platform Admin | Update platform user |
| DELETE | `/users/:id` | Yes | Platform Admin | Delete platform user |

### Students Routes (`/api/students`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List all students |
| GET | `/:id` | Yes | Any | Get student by ID |
| POST | `/` | Yes | Admin | Create student |
| PUT | `/:id` | Yes | Admin | Update student |
| DELETE | `/:id` | Yes | Admin | Delete student |
| POST | `/:id/photo` | Yes | Admin/Teacher | Upload student photo |
| POST | `/:id/generate-link` | Yes | Admin | Generate parent link code |

### Classes Routes (`/api/classes`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List all classes |
| GET | `/:id` | Yes | Any | Get class with students |
| POST | `/` | Yes | Admin | Create class |
| PUT | `/:id` | Yes | Admin | Update class |
| DELETE | `/:id` | Yes | Admin | Delete class |

### Teachers Routes (`/api/teachers`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List all teachers |
| GET | `/:id` | Yes | Any | Get teacher by ID |
| POST | `/` | Yes | Admin | Create teacher |
| PUT | `/:id` | Yes | Admin | Update teacher |
| DELETE | `/:id` | Yes | Admin | Delete teacher |
| POST | `/:id/photo` | Yes | Admin | Upload teacher photo |

### Behaviour Routes (`/api/behaviour`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List incidents (with filters) |
| GET | `/:id` | Yes | Any | Get incident by ID |
| POST | `/` | Yes | Teacher/Admin | Create incident |
| PUT | `/:id` | Yes | Teacher/Admin | Update incident |
| DELETE | `/:id` | Yes | Teacher/Admin | Delete incident |
| GET | `/timeline/:studentId` | Yes | Any | Get student behaviour timeline |

### Merits Routes (`/api/merits`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List merits (with filters) |
| POST | `/` | Yes | Teacher/Admin | Create merit |
| PUT | `/:id` | Yes | Teacher/Admin | Update merit |
| DELETE | `/:id` | Yes | Teacher/Admin | Delete merit |

### Goldie Badge Routes (`/api/goldie-badge`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/status` | Yes | Any | Get feature status (enabled/threshold) |
| GET | `/qualified` | Yes | Admin | Get qualified students |
| GET | `/flagged` | Yes | Admin | Get flagged students |
| POST | `/flag/:studentId` | Yes | Admin | Flag student for badge |
| DELETE | `/flag/:studentId` | Yes | Admin | Unflag student |
| PUT | `/award/:studentId` | Yes | Admin | Award badge to student |

### Attendance Routes (`/api/attendance`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List attendance records |
| GET | `/:id` | Yes | Any | Get attendance record |
| POST | `/` | Yes | Teacher/Admin | Create attendance |
| POST | `/bulk` | Yes | Teacher/Admin | Bulk create attendance |
| PUT | `/:id` | Yes | Teacher/Admin | Update attendance |
| DELETE | `/:id` | Yes | Admin | Delete attendance |

### Detentions Routes (`/api/detentions`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/rules` | Yes | Admin | Get detention rules |
| POST | `/rules` | Yes | Admin | Save detention rule |
| GET | `/` | Yes | Any | List detentions |
| GET | `/:id` | Yes | Any | Get detention by ID |
| POST | `/` | Yes | Admin | Create detention |
| PUT | `/:id` | Yes | Admin | Update detention |
| POST | `/:id/assign` | Yes | Admin | Assign student to detention |
| POST | `/auto-assign` | Yes | Admin | Auto-assign detention |
| PUT | `/assignments/:id` | Yes | Admin | Update detention attendance |
| DELETE | `/:id` | Yes | Admin | Delete detention |

### Messages Routes (`/api/messages`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List messages (sent/received) |
| GET | `/:id` | Yes | Any | Get message by ID |
| POST | `/` | Yes | Any | Send message (with attachment) |
| PUT | `/:id/read` | Yes | Any | Mark message as read |
| DELETE | `/:id` | Yes | Any | Delete message |

### Parents Routes (`/api/parents`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Admin | List all parents |
| GET | `/:id` | Yes | Admin | Get parent by ID |
| GET | `/profile/me` | Yes | Parent | Get own profile |
| PUT | `/profile/me` | Yes | Parent | Update own profile |
| POST | `/link-child` | Yes | Parent | Link child via code |
| POST | `/link-school` | Yes | Parent | Link to school |
| GET | `/linked-schools` | Yes | Parent | Get linked schools |
| POST | `/switch-school` | Yes | Parent | Switch active school |

### Notifications Routes (`/api/notifications`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List notifications |
| GET | `/unread-count` | Yes | Any | Get unread count |
| PUT | `/:id/read` | Yes | Any | Mark as read |
| PUT | `/read-all` | Yes | Any | Mark all as read |
| DELETE | `/:id` | Yes | Any | Delete notification |

### Analytics Routes (`/api/analytics`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/dashboard` | Yes | Any | Get dashboard stats (role-based) |

### Incident Types Routes (`/api/incident-types`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List incident types |
| GET | `/:id` | Yes | Any | Get incident type |
| POST | `/` | Yes | Admin | Create incident type |
| PUT | `/:id` | Yes | Admin | Update incident type |
| DELETE | `/:id` | Yes | Admin | Delete incident type |

### Merit Types Routes (`/api/merit-types`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List merit types |
| GET | `/:id` | Yes | Any | Get merit type |
| POST | `/` | Yes | Admin | Create merit type |
| PUT | `/:id` | Yes | Admin | Update merit type |
| DELETE | `/:id` | Yes | Admin | Delete merit type |

### Interventions Routes (`/api/interventions`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Any | List interventions |
| GET | `/:id` | Yes | Any | Get intervention |
| POST | `/` | Yes | Admin | Create intervention |
| PUT | `/:id` | Yes | Admin | Update intervention |
| DELETE | `/:id` | Yes | Admin | Delete intervention |
| GET | `/types/list` | Yes | Any | List intervention types |
| POST | `/types` | Yes | Admin | Create intervention type |
| PUT | `/types/:id` | Yes | Admin | Update intervention type |
| DELETE | `/types/:id` | Yes | Admin | Delete intervention type |
| GET | `/:id/sessions` | Yes | Any | Get intervention sessions |
| POST | `/:id/sessions` | Yes | Admin | Create session |

### Consequences Routes (`/api/consequences`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/definitions` | Yes | Any | List consequence definitions |
| POST | `/definitions` | Yes | Admin | Create definition |
| PUT | `/definitions/:id` | Yes | Admin | Update definition |
| DELETE | `/definitions/:id` | Yes | Admin | Delete definition |
| GET | `/` | Yes | Any | List assigned consequences |
| GET | `/:id` | Yes | Any | Get consequence |
| GET | `/student/:studentId` | Yes | Any | Get student's consequences |
| POST | `/assign` | Yes | Admin | Assign consequence |
| PUT | `/:id` | Yes | Admin | Update consequence |
| PUT | `/:id/complete` | Yes | Admin | Mark complete |
| PUT | `/:id/acknowledge` | Yes | Parent | Parent acknowledge |
| DELETE | `/:id` | Yes | Admin | Delete consequence |

### Exports Routes (`/api/exports`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/students/:id` | Yes | Admin | Export student record (PDF/Excel) |
| GET | `/class/:id` | Yes | Admin | Export class records (PDF/Excel) |

### Bulk Import Routes (`/api/bulk-import`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| POST | `/students` | Yes | Admin | Import students from file |
| POST | `/teachers` | Yes | Admin | Import teachers from file |
| POST | `/classes` | Yes | Admin | Import classes from file |
| GET | `/template/students` | Yes | Admin | Download students template |
| GET | `/template/teachers` | Yes | Admin | Download teachers template |
| GET | `/template/classes` | Yes | Admin | Download classes template |

### Push Notifications Routes (`/api/push`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/public-key` | Yes | Any | Get VAPID public key |
| POST | `/subscribe` | Yes | Any | Subscribe to push |
| POST | `/unsubscribe` | Yes | Any | Unsubscribe from push |

### School Customizations Routes (`/api/school-customizations`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/:schoolId` | Yes | Platform Admin | Get customizations |
| PUT | `/:schoolId` | Yes | Platform Admin | Update customizations |
| POST | `/:schoolId/logo` | Yes | Platform Admin | Upload logo |
| POST | `/:schoolId/favicon` | Yes | Platform Admin | Upload favicon |
| POST | `/:schoolId/login-background` | Yes | Platform Admin | Upload login bg |
| POST | `/:schoolId/dashboard-background` | Yes | Platform Admin | Upload dashboard bg |
| DELETE | `/:schoolId/logo` | Yes | Platform Admin | Delete logo |
| DELETE | `/:schoolId/favicon` | Yes | Platform Admin | Delete favicon |
| DELETE | `/:schoolId/login-background` | Yes | Platform Admin | Delete login bg |
| DELETE | `/:schoolId/dashboard-background` | Yes | Platform Admin | Delete dashboard bg |

### Users Routes (`/api/users`)
| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|-------------|
| GET | `/` | Yes | Admin | List all users |
| GET | `/:id` | Yes | Admin | Get user by ID |
| PUT | `/:id/role` | Yes | Admin | Update user role |
| DELETE | `/:id` | Yes | Admin | Delete user |

### Health Check
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/health` | No | API health check |

---

## 3. WebSocket Connections

### Socket.io Configuration
- **Server:** `http://localhost:5000`
- **CORS Origin:** Configured via `FRONTEND_URL` env variable
- **Authentication:** JWT token via `socket.handshake.auth.token`

### Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Client → Server | User connects with JWT |
| `disconnect` | Client → Server | User disconnects |

### User Socket Tracking
- Server maintains `userSockets` Map for real-time notifications
- Socket ID mapped to `userId` from JWT

---

## 4. Authentication Flows

### Admin Portal Authentication
```
1. User enters credentials at /login
2. POST /api/auth/login
3. Backend validates against 'users' table
4. Returns JWT token (24h expiry)
5. Token stored in localStorage as 'token'
6. All subsequent requests include Authorization: Bearer <token>
```

### Super Admin Portal Authentication
```
1. Platform admin enters credentials at /platform/login
2. POST /api/platform/login
3. Backend checks:
   a. 'platform_users' table first
   b. Falls back to env vars (PLATFORM_ADMIN_EMAIL/PASSWORD)
4. Returns JWT token with role: 'platform_admin'
5. Token stored in localStorage as 'platform_token'
6. All platform requests include Authorization: Bearer <platform_token>
```

### Token Structure
```javascript
// Regular User Token
{
  userId: number,
  role: 'admin' | 'teacher' | 'parent',
  iat: timestamp,
  exp: timestamp (24h)
}

// Platform Admin Token
{
  userId: number | 'platform',
  role: 'platform_admin',
  iat: timestamp,
  exp: timestamp (24h)
}
```

### Middleware
- `authenticateToken`: Validates JWT, attaches `req.user`
- `requireRole(role)`: Checks user role
- `requirePlatformAdmin`: Validates platform admin token
- `getSchoolId(req)`: Extracts school_id for multi-tenant queries

---

## 5. Database Schema

### Core Tables
| Table | Description |
|-------|-------------|
| `users` | All users (admin, teacher, parent) |
| `platform_users` | Super admin users |
| `platform_settings` | Global platform config (incl. Goldie Badge) |
| `schools` | School records |
| `students` | Student records |
| `classes` | Class records |
| `teachers` | Teacher profiles |
| `parents` | Parent profiles |

### Behaviour Tables
| Table | Description |
|-------|-------------|
| `behaviour_incidents` | Demerit/incident records |
| `merits` | Merit records |
| `incident_types` | Incident type definitions |
| `merit_types` | Merit type definitions |
| `consequences` | Consequence definitions |
| `student_consequences` | Assigned consequences |
| `interventions` | Intervention records |
| `intervention_types` | Intervention type definitions |
| `intervention_sessions` | Intervention session logs |

### Attendance & Scheduling
| Table | Description |
|-------|-------------|
| `attendance` | Daily attendance records |
| `detentions` | Detention sessions |
| `detention_assignments` | Student detention assignments |
| `timetables` | Class timetables |

### Communication
| Table | Description |
|-------|-------------|
| `messages` | User messages |
| `notifications` | System notifications |
| `push_subscriptions` | Push notification subscriptions |

### Feature-Specific
| Table | Description |
|-------|-------------|
| `goldie_badge_flags` | Goldie Badge student flags |
| `school_customizations` | Per-school branding |
| `subscription_plans` | Platform subscription plans |
| `school_subscriptions` | School subscription records |
| `platform_logs` | Platform activity logs |

---

## 6. Frontend-Backend Mapping

### Admin Portal Pages
| Page | API Calls |
|------|-----------|
| Dashboard | `GET /analytics/dashboard` |
| Students | `GET /students`, `POST/PUT/DELETE /students/:id` |
| Classes | `GET /classes`, `POST/PUT/DELETE /classes/:id` |
| Teachers | `GET /teachers`, `POST/PUT/DELETE /teachers/:id` |
| Behaviour | `GET /behaviour`, `POST/PUT/DELETE /behaviour/:id` |
| Merits | `GET /merits`, `POST/PUT/DELETE /merits/:id` |
| Goldie Badge | `GET /goldie-badge/status`, `GET /goldie-badge/qualified`, `POST /goldie-badge/flag/:id` |
| Attendance | `GET /attendance`, `POST /attendance/bulk` |
| Detentions | `GET /detentions`, `POST/PUT/DELETE /detentions/:id` |
| Messages | `GET /messages`, `POST /messages` |
| Settings | `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/change-password` |
| User Management | `GET /users`, `PUT /users/:id/role`, `DELETE /users/:id` |

### Super Admin Portal Pages
| Page | API Calls |
|------|-----------|
| Dashboard | `GET /platform/analytics` |
| Schools | `GET /platform/schools`, `POST/PUT/DELETE /platform/schools/:id` |
| Platform Users | `GET /platform/users`, `POST/PUT/DELETE /platform/users/:id` |
| Feature Flags | `GET /platform/settings`, `PUT /platform/settings` |
| Subscriptions | `GET /platform/plans`, `POST/PUT /platform/plans/:id` |
| Analytics | `GET /platform/analytics` |
| Billing | `GET /platform/billing` |
| Logs | `GET /platform/logs` |
| Settings | `GET /platform/settings`, `PUT /platform/settings` |

### Teacher Portal Pages
| Page | API Calls |
|------|-----------|
| Dashboard | `GET /analytics/dashboard` |
| My Classes | `GET /classes` |
| Log Incident | `GET /students`, `GET /incident-types`, `POST /behaviour` |
| Award Merit | `GET /students`, `GET /merit-types`, `POST /merits` |
| Attendance | `GET /classes/:id`, `POST /attendance/bulk` |

### Parent Portal Pages
| Page | API Calls |
|------|-----------|
| Dashboard | `GET /analytics/dashboard`, `GET /parents/profile/me` |
| Children | `GET /students` (filtered by parent_id) |
| Messages | `GET /messages`, `POST /messages` |
| Link Child | `POST /parents/link-child` |

---

## 7. Third-Party Integrations

### Supabase (PostgreSQL)
- **Purpose:** Database hosting
- **Connection:** Via `DATABASE_URL` environment variable
- **SSL:** Required for Supabase connections
- **Pooling:** Connection pool with max 20 clients

### Web Push (VAPID)
- **Purpose:** Browser push notifications
- **Keys:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- **Subject:** `VAPID_SUBJECT` (mailto: email)

---

## 8. Security Configuration

### CORS
```javascript
app.use(cors()); // Currently open - NEEDS RESTRICTION IN PRODUCTION
```

### JWT Configuration
- **Secret:** `JWT_SECRET` environment variable
- **Expiry:** 24 hours
- **Algorithm:** HS256 (default)

### Password Hashing
- **Library:** bcryptjs
- **Salt Rounds:** 10

### File Uploads
- **Middleware:** multer
- **Storage:** Local filesystem (`/uploads/`)
- **Types:** Images for photos, Excel/CSV for imports

### Recommendations
1. **CORS:** Restrict to specific origins in production
2. **Rate Limiting:** Add rate limiting middleware
3. **Input Validation:** Add express-validator
4. **SQL Injection:** Using parameterized queries ✓
5. **XSS:** React escapes by default ✓
6. **HTTPS:** Required in production

---

## 9. Known Issues & Recommendations

### Current Issues

| Issue | Severity | Description | Recommendation |
|-------|----------|-------------|----------------|
| Database Timeout | High | Supabase connection timeout (10s may not be enough) | Increase timeout, add retry logic |
| Token Expiry UX | Medium | No automatic token refresh | Implement refresh token flow |
| CORS Open | Medium | CORS allows all origins | Restrict to specific domains |
| No Rate Limiting | Medium | API vulnerable to abuse | Add express-rate-limit |
| Platform Admin Fallback | Low | Falls back to env vars if DB fails | Ensure platform_users table exists |

### Connection Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend → Backend (Proxy) | ✓ Working | Via Vite proxy on localhost |
| Backend → Database | ⚠ Intermittent | Supabase timeout issues |
| WebSocket | ✓ Working | JWT authenticated |
| Push Notifications | ✓ Configured | Requires VAPID keys |
| File Uploads | ✓ Working | Local storage |

### Test Commands

```bash
# Health check
curl http://localhost:5000/api/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'

# Test platform login
curl -X POST http://localhost:5000/api/platform/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@pds.com","password":"superadmin123"}'

# Test authenticated endpoint
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <token>"
```

---

## Appendix: Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port |
| `NODE_ENV` | No | development | Environment |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `FRONTEND_URL` | No | http://localhost:5173 | Frontend URL for CORS |
| `PLATFORM_ADMIN_EMAIL` | No | superadmin@pds.com | Default super admin email |
| `PLATFORM_ADMIN_PASSWORD` | No | superadmin123 | Default super admin password |
| `VAPID_PUBLIC_KEY` | No | - | Push notification public key |
| `VAPID_PRIVATE_KEY` | No | - | Push notification private key |
| `VAPID_SUBJECT` | No | - | Push notification subject |

---

**Report End**

require('dotenv').config();

// SECURITY: Validate JWT secret on startup
const { validateAndEnforce } = require('./utils/jwtSecretValidator');
const environment = process.env.NODE_ENV || 'development';
validateAndEnforce(process.env.JWT_SECRET, environment);

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase } = require('./database/db');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration for Socket.io
// Get frontend URL from environment variable or use default
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

const allowedOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.onrender\.com$/,
  frontendUrl, // Dynamic frontend URL from environment variable
];

const socketCors = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOriginPatterns.some((rule) =>
      rule instanceof RegExp ? rule.test(origin) : rule === origin
    );
    return ok ? cb(null, true) : cb(new Error("Socket CORS blocked"));
  },
  methods: ["GET", "POST"],
  credentials: true
};

const io = new Server(server, { cors: socketCors });

const PORT = process.env.PORT || 5000;

// Store user sockets
const userSockets = new Map();

// Socket.io connection handling
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.userId;
        next();
    } catch (error) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);
    
    if (socket.userId) {
        userSockets.set(socket.userId, socket);
    }
    
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.userId);
        if (socket.userId) {
            userSockets.delete(socket.userId);
        }
    });
});

// Make io and userSockets available to routes
app.set('io', io);
app.set('userSockets', userSockets);

// Middleware
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOriginPatterns.some((rule) =>
      rule instanceof RegExp ? rule.test(origin) : rule === origin
    );
    return ok ? cb(null, true) : cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Id', 'X-Schema-Name']
}));

app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SECURITY: Input sanitization middleware
const { sanitizeAll } = require('./middleware/inputSanitizer');
app.use(sanitizeAll);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Schema context and security middleware
const { setSchemaFromToken } = require('./middleware/schemaContext');
const { enforceSchemaAccess } = require('./utils/schemaHelper');
const { authenticateToken } = require('./middleware/auth');
const { strictLimiter, uploadLimiter } = require('./middleware/rateLimiter');

// Routes - Public (no schema context needed)
app.use('/api/auth', require('./routes/auth'));

// Password Management (requires auth)
app.use('/api/password', require('./routes/password'));

// TEMPORARY: Emergency password reset (requires auth, no current password needed)
app.use('/api/emergency-password-reset', require('./routes/emergency-password-reset'));

// Routes - Platform Admin (school onboarding)
app.use('/api/schools', require('./routes/schoolOnboarding'));

// Routes - School Information (requires auth but not schema context)
app.use('/api/school-info', authenticateToken, require('./routes/schoolInfo'));

// Routes - School-specific (schema context + security enforcement applied)
// SECURITY: enforceSchemaAccess prevents cross-schema access attacks
app.use('/api/students', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/students'));
app.use('/api/classes', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/classes'));
app.use('/api/teachers', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/teachers'));
app.use('/api/behaviour', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/behaviour'));
app.use('/api/attendance', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/attendance'));
app.use('/api/messages', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/messages'));
app.use('/api/parents', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/parents'));
app.use('/api/analytics', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/analytics'));
app.use('/api/timetables', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/timetables'));
app.use('/api/period-timetables', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/periodTimetables'));
app.use('/api/subjects', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/subjects'));
app.use('/api/period-register', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/periodRegister'));
app.use('/api/detentions', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/detentions'));
app.use('/api/merits', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/merits'));
app.use('/api/exports', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/exports'));
app.use('/api/bulk-import', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/bulkImport'));
app.use('/api/bulk-import-v2', authenticateToken, setSchemaFromToken, enforceSchemaAccess, strictLimiter, require('./routes/bulkImportV2'));
app.use('/api/notifications', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/notifications').router);
app.use('/api/incident-types', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/incidentTypes'));
app.use('/api/merit-types', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/meritTypes'));
app.use('/api/interventions', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/interventions'));
app.use('/api/guided-interventions', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/guidedInterventions'));
app.use('/api/consequences', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/consequences'));
app.use('/api/consequence-assignments', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/consequence_assignments'));
app.use('/api/push', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/push').router);
app.use('/api/platform', require('./routes/platform'));
app.use('/api/school-customizations', require('./routes/schoolCustomizations'));
app.use('/api/users', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/users'));
app.use('/api/feature-flags', require('./routes/featureFlags'));
app.use('/api/goldie-badge', authenticateToken, setSchemaFromToken, enforceSchemaAccess, require('./routes/goldieBadge'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/billing-schedules', require('./routes/billingSchedules'));
app.use('/api/school-admins', require('./routes/schoolAdmins'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'PDS Backend API is running' });
});

// Initialize database on startup
initDatabase()
    .then(() => {
        console.log('Database initialized');
        
        // Seed script is not needed for PostgreSQL - data should be managed through migrations
        console.log('PostgreSQL database ready - use migrations to seed data if needed');
    })
    .catch((err) => {
        console.error('Database initialization error:', err);
        console.error('Make sure DATABASE_URL is set correctly in your .env file');
        process.exit(1);
    });

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Socket.io server ready`);
});


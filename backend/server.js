require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase } = require('./database/db');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/behaviour', require('./routes/behaviour'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/parents', require('./routes/parents'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/timetables', require('./routes/timetables'));
app.use('/api/detentions', require('./routes/detentions'));
app.use('/api/merits', require('./routes/merits'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/bulk-import', require('./routes/bulkImport'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/incident-types', require('./routes/incidentTypes'));
app.use('/api/merit-types', require('./routes/meritTypes'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/consequences', require('./routes/consequences'));
app.use('/api/push', require('./routes/push').router);
app.use('/api/platform', require('./routes/platform'));
app.use('/api/school-customizations', require('./routes/schoolCustomizations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/medical-info', require('./routes/medicalInfo'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

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


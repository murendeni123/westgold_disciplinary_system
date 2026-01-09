# Positive Discipline System (PDS)

A comprehensive full-stack school disciplinary management system built with React, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL (Supabase).

## Recent Updates

### Mandatory Field Validation
- **Incident Logging**: Teachers must now provide descriptions for all behaviour incidents
- **Merit Awards**: Descriptions are now required for all merit awards  
- **Enhanced Data Quality**: Server-side validation ensures complete incident and merit records

### Improved Parent Signup Flow
- **Two-Step Registration**: Streamlined signup with basic info first, contact details second
- **Better User Experience**: Progressive information collection improves signup conversion
- **Comprehensive Contact Data**: Collection of emergency contacts and detailed parent information

## Features

### Admin Portal
- Dashboard with analytics and statistics
- Student management (CRUD operations)
- Class management
- Teacher management
- Behaviour incident tracking and approval
- Attendance overview and reports
- Messaging system
- Settings configuration

### Teacher Portal
- Dashboard with class and incident overview
- Class management and student lists
- Daily and period-based attendance tracking
- **Behaviour incident logging with mandatory descriptions**
- **Merit awards with required descriptions**
- Incident history review
- Messaging with parents and admin
- Profile management

### Parent Portal
- Dashboard with child overview
- **Two-step signup process for better onboarding**
- Link child using unique code
- View children's attendance records
- View behaviour reports and incidents
- Messaging with teachers and admin
- Account settings with comprehensive contact information

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Recharts (for analytics)
- Axios (for API calls)
- Lucide React (icons)

### Backend
- Node.js
- Express
- PostgreSQL (Supabase)
- JWT Authentication
- bcryptjs (password hashing)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Database

The system uses PostgreSQL (Supabase) as the database. The database schema is automatically initialized when the backend starts.

### Setup

1. Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
FRONTEND_URL=http://localhost:5173
```

2. The `DATABASE_URL` should be your PostgreSQL connection string (e.g., Supabase connection string).

### Default Credentials

**Admin:**
- Email: `admin@school.com`
- Password: `admin123`

**Teacher:**
- Email: `teacher1@school.com`
- Password: `teacher123`

**Parent:**
- Email: `parent1@email.com`
- Password: `parent123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/generate-link` - Generate parent link code

### Classes
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class
- `PUT /api/classes/:id` - Update class
- `DELETE /api/classes/:id` - Delete class

### Teachers
- `GET /api/teachers` - Get all teachers
- `GET /api/teachers/:id` - Get teacher by ID
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `DELETE /api/teachers/:id` - Delete teacher

### Behaviour
- `GET /api/behaviour` - Get incidents (with filters)
- `GET /api/behaviour/:id` - Get incident by ID
- `POST /api/behaviour` - Create incident
- `PUT /api/behaviour/:id` - Update incident
- `DELETE /api/behaviour/:id` - Delete incident

### Attendance
- `GET /api/attendance` - Get attendance records (with filters)
- `GET /api/attendance/:id` - Get attendance by ID
- `POST /api/attendance` - Create attendance record
- `POST /api/attendance/bulk` - Bulk create attendance
- `PUT /api/attendance/:id` - Update attendance
- `DELETE /api/attendance/:id` - Delete attendance

### Messages
- `GET /api/messages` - Get messages (sent/received)
- `GET /api/messages/:id` - Get message by ID
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message

### Parents
- `POST /api/parents/link-child` - Link child using code

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics

## Project Structure

```
pds system/
├── backend/
│   ├── database/
│   │   ├── init_postgres.sql # PostgreSQL database schema
│   │   ├── seed.js           # Deprecated (was for SQLite)
│   │   └── db.js             # PostgreSQL database connection
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── students.js      # Student routes
│   │   ├── classes.js       # Class routes
│   │   ├── teachers.js      # Teacher routes
│   │   ├── behaviour.js     # Behaviour routes
│   │   ├── attendance.js    # Attendance routes
│   │   ├── messages.js      # Message routes
│   │   ├── parents.js       # Parent routes
│   │   └── analytics.js     # Analytics routes
│   ├── server.js            # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── contexts/        # React contexts
    │   ├── layouts/         # Layout components
    │   ├── pages/           # Page components
    │   │   ├── admin/       # Admin pages
    │   │   ├── teacher/     # Teacher pages
    │   │   └── parent/      # Parent pages
    │   ├── services/        # API services
    │   ├── App.tsx          # Main app component
    │   └── main.tsx         # Entry point
    ├── package.json
    └── vite.config.ts
```

## Features

- ✅ Full CRUD operations for all entities
- ✅ Role-based access control (Admin, Teacher, Parent)
- ✅ JWT authentication
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Modern UI with Tailwind CSS
- ✅ Charts and analytics (Recharts)
- ✅ CSV export functionality
- ✅ Real-time data updates
- ✅ **Mandatory field validation for incidents and merits**
- ✅ **Two-step parent signup process**
- ✅ Enhanced form validation with real-time feedback
- ✅ Modal dialogs
- ✅ Data tables with sorting and filtering

## Development

The project uses:
- Vite for frontend bundling
- Nodemon for backend auto-reload
- PostgreSQL (Supabase) for database - requires DATABASE_URL in .env

## License

This project is for educational purposes.














-- Add medical and emergency contact information to students

-- Student Medical Information table
CREATE TABLE IF NOT EXISTS student_medical_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL UNIQUE,
    blood_type TEXT CHECK(blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
    chronic_illnesses TEXT, -- JSON array or comma-separated
    allergies TEXT, -- JSON array or comma-separated
    medications TEXT, -- Current medications
    medical_conditions TEXT, -- Other medical conditions
    dietary_restrictions TEXT,
    special_needs TEXT,
    doctor_name TEXT,
    doctor_phone TEXT,
    hospital_preference TEXT,
    medical_notes TEXT, -- Additional important notes
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Emergency Contacts table (can have multiple per student)
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    contact_name TEXT NOT NULL,
    relationship TEXT NOT NULL, -- Parent, Guardian, Grandparent, etc.
    phone_primary TEXT NOT NULL,
    phone_secondary TEXT,
    email TEXT,
    address TEXT,
    is_primary INTEGER DEFAULT 0, -- Primary emergency contact
    can_pickup INTEGER DEFAULT 1, -- Authorized to pick up student
    priority_order INTEGER DEFAULT 1, -- 1 = first to call, 2 = second, etc.
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_medical_info_student ON student_medical_info(student_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student ON emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(student_id, is_primary);

-- PostgreSQL version (for init_postgres.sql)
-- 
-- CREATE TABLE IF NOT EXISTS student_medical_info (
--     id SERIAL PRIMARY KEY,
--     student_id INTEGER NOT NULL UNIQUE,
--     blood_type TEXT CHECK(blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown')),
--     chronic_illnesses JSONB, -- Store as JSON array
--     allergies JSONB, -- Store as JSON array
--     medications TEXT,
--     medical_conditions TEXT,
--     dietary_restrictions TEXT,
--     special_needs TEXT,
--     doctor_name TEXT,
--     doctor_phone TEXT,
--     hospital_preference TEXT,
--     medical_notes TEXT,
--     last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_by INTEGER,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
--     FOREIGN KEY (updated_by) REFERENCES users(id)
-- );
-- 
-- CREATE TABLE IF NOT EXISTS emergency_contacts (
--     id SERIAL PRIMARY KEY,
--     student_id INTEGER NOT NULL,
--     contact_name TEXT NOT NULL,
--     relationship TEXT NOT NULL,
--     phone_primary TEXT NOT NULL,
--     phone_secondary TEXT,
--     email TEXT,
--     address TEXT,
--     is_primary INTEGER DEFAULT 0,
--     can_pickup INTEGER DEFAULT 1,
--     priority_order INTEGER DEFAULT 1,
--     notes TEXT,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
-- );

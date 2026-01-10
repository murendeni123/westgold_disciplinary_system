const express = require('express');
const { dbAll, dbGet, dbRun } = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get medical info for a student
router.get('/:studentId', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Check permissions: admin, teacher, or parent of the student
        if (req.user.role === 'parent') {
            const student = await dbGet('SELECT parent_id FROM students WHERE id = ?', [studentId]);
            if (!student || student.parent_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const medicalInfo = await dbGet(
            'SELECT * FROM student_medical_info WHERE student_id = ?',
            [studentId]
        );

        // Parse JSON fields if they exist
        if (medicalInfo) {
            try {
                if (medicalInfo.chronic_illnesses) {
                    medicalInfo.chronic_illnesses = JSON.parse(medicalInfo.chronic_illnesses);
                }
                if (medicalInfo.allergies) {
                    medicalInfo.allergies = JSON.parse(medicalInfo.allergies);
                }
            } catch (e) {
                // If not JSON, keep as string
            }
        }

        res.json(medicalInfo || {});
    } catch (error) {
        console.error('Error fetching medical info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create or update medical info
router.post('/:studentId', authenticateToken, requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const {
            blood_type,
            chronic_illnesses,
            allergies,
            medications,
            medical_conditions,
            dietary_restrictions,
            special_needs,
            doctor_name,
            doctor_phone,
            hospital_preference,
            medical_notes
        } = req.body;

        // Convert arrays to JSON strings
        const chronicIllnessesStr = Array.isArray(chronic_illnesses) 
            ? JSON.stringify(chronic_illnesses) 
            : chronic_illnesses;
        const allergiesStr = Array.isArray(allergies) 
            ? JSON.stringify(allergies) 
            : allergies;

        // Check if medical info exists
        const existing = await dbGet(
            'SELECT id FROM student_medical_info WHERE student_id = ?',
            [studentId]
        );

        if (existing) {
            // Update
            await dbRun(
                `UPDATE student_medical_info 
                 SET blood_type = ?, chronic_illnesses = ?, allergies = ?, 
                     medications = ?, medical_conditions = ?, dietary_restrictions = ?,
                     special_needs = ?, doctor_name = ?, doctor_phone = ?,
                     hospital_preference = ?, medical_notes = ?,
                     last_updated = CURRENT_TIMESTAMP, updated_by = ?
                 WHERE student_id = ?`,
                [
                    blood_type || null,
                    chronicIllnessesStr || null,
                    allergiesStr || null,
                    medications || null,
                    medical_conditions || null,
                    dietary_restrictions || null,
                    special_needs || null,
                    doctor_name || null,
                    doctor_phone || null,
                    hospital_preference || null,
                    medical_notes || null,
                    req.user.id,
                    studentId
                ]
            );
        } else {
            // Create
            await dbRun(
                `INSERT INTO student_medical_info 
                 (student_id, blood_type, chronic_illnesses, allergies, medications,
                  medical_conditions, dietary_restrictions, special_needs, doctor_name,
                  doctor_phone, hospital_preference, medical_notes, updated_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    studentId,
                    blood_type || null,
                    chronicIllnessesStr || null,
                    allergiesStr || null,
                    medications || null,
                    medical_conditions || null,
                    dietary_restrictions || null,
                    special_needs || null,
                    doctor_name || null,
                    doctor_phone || null,
                    hospital_preference || null,
                    medical_notes || null,
                    req.user.id
                ]
            );
        }

        const medicalInfo = await dbGet(
            'SELECT * FROM student_medical_info WHERE student_id = ?',
            [studentId]
        );

        res.json(medicalInfo);
    } catch (error) {
        console.error('Error saving medical info:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get emergency contacts for a student
router.get('/:studentId/emergency-contacts', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Check permissions
        if (req.user.role === 'parent') {
            const student = await dbGet('SELECT parent_id FROM students WHERE id = ?', [studentId]);
            if (!student || student.parent_id !== req.user.id) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const contacts = await dbAll(
            'SELECT * FROM emergency_contacts WHERE student_id = ? ORDER BY priority_order, is_primary DESC',
            [studentId]
        );

        res.json(contacts);
    } catch (error) {
        console.error('Error fetching emergency contacts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add emergency contact
router.post('/:studentId/emergency-contacts', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { studentId } = req.params;
        const {
            contact_name,
            relationship,
            phone_primary,
            phone_secondary,
            email,
            address,
            is_primary,
            can_pickup,
            priority_order,
            notes
        } = req.body;

        if (!contact_name || !relationship || !phone_primary) {
            return res.status(400).json({ error: 'Name, relationship, and phone are required' });
        }

        // If setting as primary, unset other primary contacts
        if (is_primary) {
            await dbRun(
                'UPDATE emergency_contacts SET is_primary = 0 WHERE student_id = ?',
                [studentId]
            );
        }

        const result = await dbRun(
            `INSERT INTO emergency_contacts 
             (student_id, contact_name, relationship, phone_primary, phone_secondary,
              email, address, is_primary, can_pickup, priority_order, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentId,
                contact_name,
                relationship,
                phone_primary,
                phone_secondary || null,
                email || null,
                address || null,
                is_primary ? 1 : 0,
                can_pickup !== undefined ? (can_pickup ? 1 : 0) : 1,
                priority_order || 1,
                notes || null
            ]
        );

        const contact = await dbGet('SELECT * FROM emergency_contacts WHERE id = ?', [result.id]);
        res.status(201).json(contact);
    } catch (error) {
        console.error('Error adding emergency contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update emergency contact
router.put('/emergency-contacts/:contactId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { contactId } = req.params;
        const {
            contact_name,
            relationship,
            phone_primary,
            phone_secondary,
            email,
            address,
            is_primary,
            can_pickup,
            priority_order,
            notes
        } = req.body;

        // Get student_id for this contact
        const contact = await dbGet('SELECT student_id FROM emergency_contacts WHERE id = ?', [contactId]);
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }

        // If setting as primary, unset other primary contacts
        if (is_primary) {
            await dbRun(
                'UPDATE emergency_contacts SET is_primary = 0 WHERE student_id = ? AND id != ?',
                [contact.student_id, contactId]
            );
        }

        await dbRun(
            `UPDATE emergency_contacts 
             SET contact_name = ?, relationship = ?, phone_primary = ?, phone_secondary = ?,
                 email = ?, address = ?, is_primary = ?, can_pickup = ?, priority_order = ?, notes = ?
             WHERE id = ?`,
            [
                contact_name,
                relationship,
                phone_primary,
                phone_secondary || null,
                email || null,
                address || null,
                is_primary ? 1 : 0,
                can_pickup ? 1 : 0,
                priority_order || 1,
                notes || null,
                contactId
            ]
        );

        const updated = await dbGet('SELECT * FROM emergency_contacts WHERE id = ?', [contactId]);
        res.json(updated);
    } catch (error) {
        console.error('Error updating emergency contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete emergency contact
router.delete('/emergency-contacts/:contactId', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        await dbRun('DELETE FROM emergency_contacts WHERE id = ?', [req.params.contactId]);
        res.json({ message: 'Emergency contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting emergency contact:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

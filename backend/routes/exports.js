const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { schemaAll, schemaGet, getSchema } = require('../utils/schemaHelper');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Export student records
router.get('/students/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { format = 'pdf' } = req.query;
    const studentId = req.params.id;

    const student = await schemaAll(req, `
      SELECT s.*, c.class_name, u.name as parent_name, u.email as parent_email
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN public.users u ON s.parent_id = u.id
      WHERE s.id = $1
    `, [studentId]);

    if (student.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const incidents = await schemaAll(req, `
      SELECT bi.*, u.name as teacher_name
      FROM behaviour_incidents bi
      INNER JOIN teachers t ON bi.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
      WHERE bi.student_id = $1
      ORDER BY bi.created_at DESC
    `, [studentId]);

    const merits = await schemaAll(req, `
      SELECT m.*, u.name as teacher_name
      FROM merits m
      INNER JOIN teachers t ON m.teacher_id = t.id
            LEFT JOIN public.users u ON t.user_id = u.id
      WHERE m.student_id = $1
      ORDER BY m.created_at DESC
    `, [studentId]);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Student Record');

      // Student info
      worksheet.addRow(['Student Information']);
      worksheet.addRow(['Student ID', student[0].student_id]);
      worksheet.addRow(['Name', `${student[0].first_name} ${student[0].last_name}`]);
      worksheet.addRow(['Class', student[0].class_name || 'N/A']);
      worksheet.addRow(['Grade', student[0].grade_level || 'N/A']);
      worksheet.addRow([]);

      // Demerits
      worksheet.addRow(['Demerits']);
      worksheet.addRow(['Date', 'Type', 'Severity', 'Points', 'Description', 'Teacher']);
      incidents.forEach(inc => {
        worksheet.addRow([inc.created_at, inc.incident_type, inc.severity, inc.points_deducted, inc.description, inc.teacher_name]);
      });
      worksheet.addRow([]);

      // Merits
      worksheet.addRow(['Merits']);
      worksheet.addRow(['Date', 'Type', 'Points', 'Description', 'Teacher']);
      merits.forEach(merit => {
        worksheet.addRow([merit.created_at, merit.merit_type, merit.points, merit.description, merit.teacher_name]);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=student_${student[0].student_id}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      // PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=student_${student[0].student_id}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text('Student Record', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Student ID: ${student[0].student_id}`);
      doc.text(`Name: ${student[0].first_name} ${student[0].last_name}`);
      doc.text(`Class: ${student[0].class_name || 'N/A'}`);
      doc.text(`Grade: ${student[0].grade_level || 'N/A'}`);
      doc.moveDown();

      doc.fontSize(16).text('Demerits');
      incidents.forEach(inc => {
        doc.fontSize(12).text(`${inc.created_at} - ${inc.incident_type || 'Incident'} (${inc.severity}, ${inc.points_deducted} pts)`);
        doc.fontSize(10).text(inc.description || 'No description');
        doc.moveDown(0.5);
      });

      doc.addPage();
      doc.fontSize(16).text('Merits');
      merits.forEach(merit => {
        doc.fontSize(12).text(`${merit.created_at} - ${merit.merit_type || 'Merit'} (${merit.points} pts)`);
        doc.fontSize(10).text(merit.description || 'No description');
        doc.moveDown(0.5);
      });

      doc.end();
    }
  } catch (error) {
    console.error('Error exporting student record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export class records
router.get('/class/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const schema = getSchema(req);
    if (!schema) {
      return res.status(403).json({ error: 'School context required' });
    }

    const { format = 'excel' } = req.query;
    const classId = req.params.id;

    const students = await schemaAll(req, `
      SELECT s.*, 
             (SELECT COALESCE(SUM(points_deducted), 0) FROM behaviour_incidents WHERE student_id = s.id) as demerit_points,
             (SELECT COALESCE(SUM(points), 0) FROM merits WHERE student_id = s.id) as merit_points
      FROM students s
      WHERE s.class_id = $1 AND s.is_active = 1
      ORDER BY s.last_name, s.first_name
    `, [classId]);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Class Records');

      worksheet.addRow(['Student ID', 'Name', 'Demerit Points', 'Merit Points', 'Net Points']);
      students.forEach(s => {
        const netPoints = (parseInt(s.merit_points) || 0) - (parseInt(s.demerit_points) || 0);
        worksheet.addRow([s.student_id, `${s.first_name} ${s.last_name}`, s.demerit_points || 0, s.merit_points || 0, netPoints]);
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=class_records.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Error exporting class records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

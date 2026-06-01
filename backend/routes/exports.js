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

    const detentions = await schemaAll(req, `
      SELECT da.status, da.notes,
             ds.detention_date, ds.detention_time, ds.duration, ds.location,
             ds.status as session_status
      FROM detention_assignments da
      INNER JOIN detention_sessions ds ON da.detention_id = ds.id
      WHERE da.student_id = $1
      ORDER BY ds.detention_date DESC
    `, [studentId]).catch(() => []);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Student Record');

      const thinBorder = {
        top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };

      const addSectionHeader = (label, argb) => {
        const r = worksheet.addRow([label]);
        r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } };
        r.height = 22;
        r.getCell(1).alignment = { vertical: 'middle' };
      };

      const addColHeader = (cols) => {
        const r = worksheet.addRow(cols);
        r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
        r.height = 22;
        r.eachCell(cell => {
          cell.border = thinBorder;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
      };

      const addDataRow = (vals) => {
        const r = worksheet.addRow(vals);
        const maxLen = Math.max(...vals.map(v => String(v || '').length));
        r.height = Math.max(18, Math.min(Math.ceil(maxLen / 48) * 15 + 3, 90));
        r.eachCell(cell => {
          cell.border = thinBorder;
          cell.alignment = { vertical: 'top', wrapText: true };
        });
        return r;
      };

      // Student information
      addSectionHeader('STUDENT INFORMATION', 'FF059669');
      addDataRow(['Student ID', student[0].student_id]);
      addDataRow(['Name', `${student[0].first_name} ${student[0].last_name}`]);
      addDataRow(['Class', student[0].class_name || 'N/A']);
      addDataRow(['Grade', student[0].grade_level || 'N/A']);
      worksheet.addRow([]);

      // Demerits
      addSectionHeader('DEMERITS', 'FFDC2626');
      addColHeader(['Date', 'Type', 'Severity', 'Points', 'Description', 'Teacher']);
      if (incidents.length === 0) {
        worksheet.addRow(['No demerit records found']);
      } else {
        incidents.forEach(inc => {
          addDataRow([
            inc.created_at ? new Date(inc.created_at).toLocaleDateString('en-ZA') : '',
            inc.incident_type || '',
            inc.severity || '',
            inc.points_deducted || 0,
            inc.description || '',
            inc.teacher_name || '',
          ]);
        });
      }
      worksheet.addRow([]);

      // Merits
      addSectionHeader('MERITS', 'FF059669');
      addColHeader(['Date', 'Type', 'Points', 'Description', 'Teacher']);
      if (merits.length === 0) {
        worksheet.addRow(['No merit records found']);
      } else {
        merits.forEach(merit => {
          addDataRow([
            merit.created_at ? new Date(merit.created_at).toLocaleDateString('en-ZA') : '',
            merit.merit_type || '',
            merit.points || 0,
            merit.description || '',
            merit.teacher_name || '',
          ]);
        });
      }
      worksheet.addRow([]);

      // Detention history
      addSectionHeader('DETENTION HISTORY', 'FF4B5563');
      addColHeader(['Date', 'Time', 'Location', 'Duration (min)', 'Attendance', 'Served', 'Notes']);
      if (detentions.length === 0) {
        worksheet.addRow(['No detention records found']);
      } else {
        const attendanceLabel = {
          attended: 'Present', present: 'Present', absent: 'Absent',
          late: 'Late', excused: 'Excused', assigned: 'Pending', rescheduled: 'Rescheduled',
        };
        detentions.forEach(det => {
          const served = (det.status === 'attended' || det.status === 'present') ? 'Yes' : 'No';
          addDataRow([
            det.detention_date ? new Date(det.detention_date).toLocaleDateString('en-ZA') : '',
            det.detention_time || '',
            det.location || 'N/A',
            det.duration || 60,
            attendanceLabel[det.status] || det.status || 'Pending',
            served,
            det.notes || '',
          ]);
        });
      }

      // Column widths
      worksheet.getColumn(1).width = 22;  // Date / Label
      worksheet.getColumn(2).width = 30;  // Type / Value / Name
      worksheet.getColumn(3).width = 18;  // Severity / Time / Grade
      worksheet.getColumn(4).width = 12;  // Points / Duration
      worksheet.getColumn(5).width = 55;  // Description / Attendance
      worksheet.getColumn(6).width = 22;  // Teacher / Served
      worksheet.getColumn(7).width = 45;  // Notes

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

      if (detentions.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Detention History');
        doc.moveDown(0.5);
        detentions.forEach(det => {
          const served = (det.status === 'attended' || det.status === 'present') ? 'Yes' : 'No';
          doc.fontSize(12).text(`${det.detention_date} ${det.detention_time || ''} — ${det.location || 'N/A'} (${det.duration || 60} min)`);
          doc.fontSize(10).text(`Attendance: ${det.status || 'Pending'} | Served: ${served}${det.notes ? ' | ' + det.notes : ''}`);
          doc.moveDown(0.5);
        });
      }

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
      WHERE s.class_id = $1 AND s.is_active = true
      ORDER BY s.last_name, s.first_name
    `, [classId]);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Class Records');

      const thinBorder = {
        top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
        right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };

      // Header row
      const headerRow = worksheet.addRow(['Student ID', 'Name', 'Demerit Points', 'Merit Points', 'Net Points']);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      headerRow.height = 24;
      headerRow.eachCell(cell => {
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });

      // Data rows
      students.forEach((s, idx) => {
        const netPoints = (parseInt(s.merit_points) || 0) - (parseInt(s.demerit_points) || 0);
        const r = worksheet.addRow([
          s.student_id,
          `${s.first_name} ${s.last_name}`,
          s.demerit_points || 0,
          s.merit_points || 0,
          netPoints,
        ]);
        if (idx % 2 === 1) r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        r.height = 18;
        r.eachCell(cell => {
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle', wrapText: true };
        });
      });

      // Column widths
      worksheet.getColumn(1).width = 18;  // Student ID
      worksheet.getColumn(2).width = 32;  // Name
      worksheet.getColumn(3).width = 18;  // Demerit Points
      worksheet.getColumn(4).width = 15;  // Merit Points
      worksheet.getColumn(5).width = 15;  // Net Points

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

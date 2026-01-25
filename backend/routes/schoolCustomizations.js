const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbGet, dbRun } = require('../database/db');

const router = express.Router();

// Check if user is platform admin
const requirePlatformAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'platform_admin') {
      return res.status(403).json({ error: 'Platform admin access required' });
    }
    req.platformAdmin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Create uploads directory for school customizations
const customizationsDir = path.join(__dirname, '../uploads/schools');
if (!fs.existsSync(customizationsDir)) {
  fs.mkdirSync(customizationsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolId = req.params.schoolId || req.body.school_id;
    const schoolDir = path.join(customizationsDir, String(schoolId));
    if (!fs.existsSync(schoolDir)) {
      fs.mkdirSync(schoolDir, { recursive: true });
    }
    cb(null, schoolDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/x-icon'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  },
});

// Get school customizations
router.get('/:schoolId', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    // Verify school exists
    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Get customizations
    let customizations = await dbGet(
      'SELECT * FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    // If no customizations exist, return defaults
    if (!customizations) {
      customizations = {
        school_id: Number(schoolId),
        primary_color: '#3b82f6',
        secondary_color: '#8b5cf6',
        success_color: '#10b981',
        warning_color: '#f59e0b',
        danger_color: '#ef4444',
        background_color: '#f9fafb',
        text_primary_color: '#111827',
        text_secondary_color: '#6b7280',
        primary_font: 'Inter',
        secondary_font: 'Inter',
        base_font_size: '16px',
        button_border_radius: '8px',
        card_border_radius: '12px',
        sidebar_background: '#ffffff',
        header_background: '#ffffff',
        login_background_color: '#ffffff',
      };
    }

    res.json(customizations);
  } catch (error) {
    console.error('Error fetching customizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update school customizations
router.put('/:schoolId', requirePlatformAdmin, async (req, res) => {
  try {
    const { schoolId } = req.params;
    const {
      primary_color,
      secondary_color,
      success_color,
      warning_color,
      danger_color,
      background_color,
      text_primary_color,
      text_secondary_color,
      primary_font,
      secondary_font,
      base_font_size,
      button_border_radius,
      card_border_radius,
      sidebar_background,
      header_background,
      login_welcome_message,
      login_tagline,
      login_background_color,
      contact_email,
      contact_phone,
      support_email,
      terms_url,
      privacy_url,
      custom_css,
      custom_js,
      email_header_html,
      email_footer_html,
      email_signature,
    } = req.body;

    const parsedSchoolId = parseInt(schoolId);
    
    // Verify school exists
    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [parsedSchoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Check if customizations exist
    const existing = await dbGet(
      'SELECT id FROM public.school_customizations WHERE school_id = $1',
      [parsedSchoolId]
    );

    if (existing) {
      // Update existing
      await dbRun(
        `UPDATE public.school_customizations SET
          primary_color = $1,
          secondary_color = $2,
          success_color = $3,
          warning_color = $4,
          danger_color = $5,
          background_color = $6,
          text_primary_color = $7,
          text_secondary_color = $8,
          primary_font = $9,
          secondary_font = $10,
          base_font_size = $11,
          button_border_radius = $12,
          card_border_radius = $13,
          sidebar_background = $14,
          header_background = $15,
          login_welcome_message = $16,
          login_tagline = $17,
          login_background_color = $18,
          contact_email = $19,
          contact_phone = $20,
          support_email = $21,
          terms_url = $22,
          privacy_url = $23,
          custom_css = $24,
          custom_js = $25,
          email_header_html = $26,
          email_footer_html = $27,
          email_signature = $28,
          updated_at = CURRENT_TIMESTAMP
        WHERE school_id = $29`,
        [
          primary_color,
          secondary_color,
          success_color,
          warning_color,
          danger_color,
          background_color,
          text_primary_color,
          text_secondary_color,
          primary_font,
          secondary_font,
          base_font_size,
          button_border_radius,
          card_border_radius,
          sidebar_background,
          header_background,
          login_welcome_message,
          login_tagline,
          login_background_color,
          contact_email,
          contact_phone,
          support_email,
          terms_url,
          privacy_url,
          custom_css,
          custom_js,
          email_header_html,
          email_footer_html,
          email_signature,
          parsedSchoolId,
        ]
      );
    } else {
      // Create new
      await dbRun(
        `INSERT INTO public.school_customizations (
          school_id,
          primary_color,
          secondary_color,
          success_color,
          warning_color,
          danger_color,
          background_color,
          text_primary_color,
          text_secondary_color,
          primary_font,
          secondary_font,
          base_font_size,
          button_border_radius,
          card_border_radius,
          sidebar_background,
          header_background,
          login_welcome_message,
          login_tagline,
          login_background_color,
          contact_email,
          contact_phone,
          support_email,
          terms_url,
          privacy_url,
          custom_css,
          custom_js,
          email_header_html,
          email_footer_html,
          email_signature
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)`,
        [
          parsedSchoolId,
          primary_color || '#3b82f6',
          secondary_color || '#8b5cf6',
          success_color || '#10b981',
          warning_color || '#f59e0b',
          danger_color || '#ef4444',
          background_color || '#f9fafb',
          text_primary_color || '#111827',
          text_secondary_color || '#6b7280',
          primary_font || 'Inter',
          secondary_font || 'Inter',
          base_font_size || '16px',
          button_border_radius || '8px',
          card_border_radius || '12px',
          sidebar_background || '#ffffff',
          header_background || '#ffffff',
          login_welcome_message,
          login_tagline,
          login_background_color || '#ffffff',
          contact_email,
          contact_phone,
          support_email,
          terms_url,
          privacy_url,
          custom_css,
          custom_js,
          email_header_html,
          email_footer_html,
          email_signature,
        ]
      );
    }

    const updated = await dbGet(
      'SELECT * FROM public.school_customizations WHERE school_id = $1',
      [parsedSchoolId]
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating customizations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload logo
router.post('/:schoolId/logo', requirePlatformAdmin, upload.single('logo'), async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify school exists
    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const logoPath = `/uploads/schools/${schoolId}/${req.file.filename}`;

    // Update or create customizations
    const existing = await dbGet(
      'SELECT id FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (existing) {
      // Delete old logo if exists
      const oldCustomizations = await dbGet(
        'SELECT logo_path FROM public.school_customizations WHERE school_id = $1',
        [schoolId]
      );
      if (oldCustomizations?.logo_path) {
        const oldPath = path.join(__dirname, '..', oldCustomizations.logo_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await dbRun(
        'UPDATE public.school_customizations SET logo_path = $1, updated_at = CURRENT_TIMESTAMP WHERE school_id = $2',
        [logoPath, schoolId]
      );
    } else {
      await dbRun(
        `INSERT INTO public.school_customizations (school_id, logo_path) VALUES ($1, $2)`,
        [schoolId, logoPath]
      );
    }

    res.json({ logo_path: logoPath, message: 'Logo uploaded successfully' });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload favicon
router.post('/:schoolId/favicon', requirePlatformAdmin, upload.single('favicon'), async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const faviconPath = `/uploads/schools/${schoolId}/${req.file.filename}`;

    const existing = await dbGet(
      'SELECT id FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (existing) {
      const oldCustomizations = await dbGet(
        'SELECT favicon_path FROM public.school_customizations WHERE school_id = $1',
        [schoolId]
      );
      if (oldCustomizations?.favicon_path) {
        const oldPath = path.join(__dirname, '..', oldCustomizations.favicon_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await dbRun(
        'UPDATE public.school_customizations SET favicon_path = $1, updated_at = CURRENT_TIMESTAMP WHERE school_id = $2',
        [faviconPath, schoolId]
      );
    } else {
      await dbRun(
        `INSERT INTO public.school_customizations (school_id, favicon_path) VALUES ($1, $2)`,
        [schoolId, faviconPath]
      );
    }

    res.json({ favicon_path: faviconPath, message: 'Favicon uploaded successfully' });
  } catch (error) {
    console.error('Error uploading favicon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload login background
router.post('/:schoolId/login-background', requirePlatformAdmin, upload.single('background'), async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const backgroundPath = `/uploads/schools/${schoolId}/${req.file.filename}`;

    const existing = await dbGet(
      'SELECT id FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (existing) {
      const oldCustomizations = await dbGet(
        'SELECT login_background_path FROM public.school_customizations WHERE school_id = $1',
        [schoolId]
      );
      if (oldCustomizations?.login_background_path) {
        const oldPath = path.join(__dirname, '..', oldCustomizations.login_background_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await dbRun(
        'UPDATE public.school_customizations SET login_background_path = $1, updated_at = CURRENT_TIMESTAMP WHERE school_id = $2',
        [backgroundPath, schoolId]
      );
    } else {
      await dbRun(
        `INSERT INTO public.school_customizations (school_id, login_background_path) VALUES ($1, $2)`,
        [schoolId, backgroundPath]
      );
    }

    res.json({ login_background_path: backgroundPath, message: 'Login background uploaded successfully' });
  } catch (error) {
    console.error('Error uploading login background:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload dashboard background
router.post('/:schoolId/dashboard-background', requirePlatformAdmin, upload.single('background'), async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const school = await dbGet('SELECT id FROM public.schools WHERE id = $1', [schoolId]);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const backgroundPath = `/uploads/schools/${schoolId}/${req.file.filename}`;

    const existing = await dbGet(
      'SELECT id FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (existing) {
      const oldCustomizations = await dbGet(
        'SELECT dashboard_background_path FROM public.school_customizations WHERE school_id = $1',
        [schoolId]
      );
      if (oldCustomizations?.dashboard_background_path) {
        const oldPath = path.join(__dirname, '..', oldCustomizations.dashboard_background_path);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      await dbRun(
        'UPDATE public.school_customizations SET dashboard_background_path = $1, updated_at = CURRENT_TIMESTAMP WHERE school_id = $2',
        [backgroundPath, schoolId]
      );
    } else {
      await dbRun(
        `INSERT INTO public.school_customizations (school_id, dashboard_background_path) VALUES ($1, $2)`,
        [schoolId, backgroundPath]
      );
    }

    res.json({ dashboard_background_path: backgroundPath, message: 'Dashboard background uploaded successfully' });
  } catch (error) {
    console.error('Error uploading dashboard background:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete logo
router.delete('/:schoolId/logo', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    const customizations = await dbGet(
      'SELECT logo_path FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (customizations?.logo_path) {
      const filePath = path.join(__dirname, '..', customizations.logo_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await dbRun(
        'UPDATE public.school_customizations SET logo_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
        [schoolId]
      );
    }

    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    console.error('Error deleting logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete favicon
router.delete('/:schoolId/favicon', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    const customizations = await dbGet(
      'SELECT favicon_path FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (customizations?.favicon_path) {
      const filePath = path.join(__dirname, '..', customizations.favicon_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await dbRun(
        'UPDATE public.school_customizations SET favicon_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
        [schoolId]
      );
    }

    res.json({ message: 'Favicon deleted successfully' });
  } catch (error) {
    console.error('Error deleting favicon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete login background
router.delete('/:schoolId/login-background', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    const customizations = await dbGet(
      'SELECT login_background_path FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (customizations?.login_background_path) {
      const filePath = path.join(__dirname, '..', customizations.login_background_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await dbRun(
        'UPDATE public.school_customizations SET login_background_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
        [schoolId]
      );
    }

    res.json({ message: 'Login background deleted successfully' });
  } catch (error) {
    console.error('Error deleting login background:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete dashboard background
router.delete('/:schoolId/dashboard-background', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    const customizations = await dbGet(
      'SELECT dashboard_background_path FROM public.school_customizations WHERE school_id = $1',
      [schoolId]
    );

    if (customizations?.dashboard_background_path) {
      const filePath = path.join(__dirname, '..', customizations.dashboard_background_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await dbRun(
        'UPDATE public.school_customizations SET dashboard_background_path = NULL, updated_at = CURRENT_TIMESTAMP WHERE school_id = $1',
        [schoolId]
      );
    }

    res.json({ message: 'Dashboard background deleted successfully' });
  } catch (error) {
    console.error('Error deleting dashboard background:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


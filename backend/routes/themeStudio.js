const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { dbGet, dbRun } = require('../database/db');

const router = express.Router();

// Default theme configuration
const DEFAULT_THEME = {
  brand: {
    schoolName: '',
    logoUrl: null
  },
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827'
  },
  login: {
    headline: 'Welcome Back',
    subtext: 'Sign in to access your disciplinary management dashboard',
    bannerUrl: null
  },
  ui: {
    radius: 12,
    density: 'comfortable'
  }
};

// Validation helpers
const isValidHexColor = (color) => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

const validateTheme = (theme) => {
  const errors = [];
  
  if (!theme.colors) {
    errors.push('colors object is required');
  } else {
    const requiredColors = ['primary', 'secondary', 'accent', 'background', 'surface', 'text'];
    requiredColors.forEach(color => {
      if (!theme.colors[color]) {
        errors.push(`colors.${color} is required`);
      } else if (!isValidHexColor(theme.colors[color])) {
        errors.push(`colors.${color} must be a valid hex color`);
      }
    });
  }
  
  if (theme.ui) {
    if (theme.ui.radius !== undefined && (theme.ui.radius < 0 || theme.ui.radius > 24)) {
      errors.push('ui.radius must be between 0 and 24');
    }
    if (theme.ui.density && !['compact', 'comfortable'].includes(theme.ui.density)) {
      errors.push('ui.density must be either "compact" or "comfortable"');
    }
  }
  
  return errors;
};

const mergeWithDefaults = (theme) => {
  if (!theme) return DEFAULT_THEME;
  
  return {
    brand: {
      ...DEFAULT_THEME.brand,
      ...(theme.brand || {})
    },
    colors: {
      ...DEFAULT_THEME.colors,
      ...(theme.colors || {})
    },
    login: {
      ...DEFAULT_THEME.login,
      ...(theme.login || {})
    },
    ui: {
      ...DEFAULT_THEME.ui,
      ...(theme.ui || {})
    }
  };
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const schoolSlug = req.params.schoolSlug;
    const uploadDir = path.join(__dirname, '../uploads/schools', schoolSlug, 'branding');
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const type = req.params.type || 'logo';
    const ext = path.extname(file.originalname);
    const filename = type === 'logo' ? `logo${ext}` : `login-banner${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// GET /api/platform/schools/:schoolSlug/theme
router.get('/:schoolSlug/theme', async (req, res) => {
  try {
    const { schoolSlug } = req.params;
    
    // Find school by slug (subdomain or code)
    let school = await dbGet(
      `SELECT id, name, subdomain, code, active_theme_json, draft_theme_json 
       FROM public.schools 
       WHERE subdomain = $1 OR code = $2 OR LOWER(code) = $3`,
      [schoolSlug, schoolSlug.toUpperCase(), schoolSlug.toLowerCase()]
    );
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    const activeTheme = mergeWithDefaults(school.active_theme_json);
    const draftTheme = school.draft_theme_json ? mergeWithDefaults(school.draft_theme_json) : null;
    
    // Update brand.schoolName with actual school name if not set
    if (activeTheme.brand) {
      activeTheme.brand.schoolName = activeTheme.brand.schoolName || school.name;
    }
    if (draftTheme && draftTheme.brand) {
      draftTheme.brand.schoolName = draftTheme.brand.schoolName || school.name;
    }
    
    res.json({
      activeTheme,
      draftTheme,
      defaults: DEFAULT_THEME,
      schoolName: school.name,
      schoolId: school.id
    });
  } catch (error) {
    console.error('Error fetching theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/platform/schools/:schoolSlug/theme/draft
router.put('/:schoolSlug/theme/draft', async (req, res) => {
  try {
    const { schoolSlug } = req.params;
    const draftTheme = req.body;
    
    // Validate theme
    const errors = validateTheme(draftTheme);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', errors });
    }
    
    // Find school
    let school = await dbGet(
      `SELECT id FROM public.schools 
       WHERE subdomain = $1 OR code = $2 OR LOWER(code) = $3`,
      [schoolSlug, schoolSlug.toUpperCase(), schoolSlug.toLowerCase()]
    );
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    // Merge with defaults and save
    const mergedTheme = mergeWithDefaults(draftTheme);
    
    await dbRun(
      `UPDATE public.schools 
       SET draft_theme_json = $1, updated_at = NOW() 
       WHERE id = $2`,
      [JSON.stringify(mergedTheme), school.id]
    );
    
    res.json({ success: true, draftTheme: mergedTheme });
  } catch (error) {
    console.error('Error saving draft theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/platform/schools/:schoolSlug/theme/publish
router.post('/:schoolSlug/theme/publish', async (req, res) => {
  try {
    const { schoolSlug } = req.params;
    
    // Find school
    let school = await dbGet(
      `SELECT id, draft_theme_json FROM public.schools 
       WHERE subdomain = $1 OR code = $2 OR LOWER(code) = $3`,
      [schoolSlug, schoolSlug.toUpperCase(), schoolSlug.toLowerCase()]
    );
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    if (!school.draft_theme_json) {
      return res.status(400).json({ error: 'No draft theme to publish' });
    }
    
    // Validate draft theme before publishing
    const errors = validateTheme(school.draft_theme_json);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Draft theme validation failed', errors });
    }
    
    // Publish: copy draft to active and clear draft
    await dbRun(
      `UPDATE public.schools 
       SET active_theme_json = draft_theme_json, 
           draft_theme_json = NULL, 
           updated_at = NOW() 
       WHERE id = $1`,
      [school.id]
    );
    
    res.json({ success: true, activeTheme: school.draft_theme_json });
  } catch (error) {
    console.error('Error publishing theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/platform/schools/:schoolSlug/theme/draft
router.delete('/:schoolSlug/theme/draft', async (req, res) => {
  try {
    const { schoolSlug } = req.params;
    
    // Find school
    let school = await dbGet(
      `SELECT id FROM public.schools 
       WHERE subdomain = $1 OR code = $2 OR LOWER(code) = $3`,
      [schoolSlug, schoolSlug.toUpperCase(), schoolSlug.toLowerCase()]
    );
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    await dbRun(
      `UPDATE public.schools 
       SET draft_theme_json = NULL, updated_at = NOW() 
       WHERE id = $1`,
      [school.id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error discarding draft theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/platform/schools/:schoolSlug/theme/revert
router.post('/:schoolSlug/theme/revert', async (req, res) => {
  try {
    const { schoolSlug } = req.params;
    
    // Find school
    let school = await dbGet(
      `SELECT id FROM public.schools 
       WHERE subdomain = $1 OR code = $2 OR LOWER(code) = $3`,
      [schoolSlug, schoolSlug.toUpperCase(), schoolSlug.toLowerCase()]
    );
    
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    
    // Set draft to default theme (don't publish automatically)
    await dbRun(
      `UPDATE public.schools 
       SET draft_theme_json = $1, updated_at = NOW() 
       WHERE id = $2`,
      [JSON.stringify(DEFAULT_THEME), school.id]
    );
    
    res.json({ success: true, draftTheme: DEFAULT_THEME });
  } catch (error) {
    console.error('Error reverting theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/platform/schools/:schoolSlug/theme/upload/:type (logo or banner)
router.post('/:schoolSlug/theme/upload/:type', upload.single('file'), async (req, res) => {
  try {
    const { schoolSlug, type } = req.params;
    
    if (!['logo', 'banner'].includes(type)) {
      return res.status(400).json({ error: 'Invalid upload type. Must be "logo" or "banner"' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Generate URL for the uploaded file
    const fileUrl = `/uploads/schools/${schoolSlug}/branding/${req.file.filename}`;
    
    res.json({ 
      success: true, 
      url: fileUrl,
      filename: req.file.filename,
      type
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// DELETE /api/platform/schools/:schoolSlug/theme/upload/:type
router.delete('/:schoolSlug/theme/upload/:type', async (req, res) => {
  try {
    const { schoolSlug, type } = req.params;
    
    if (!['logo', 'banner'].includes(type)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }
    
    const uploadDir = path.join(__dirname, '../uploads/schools', schoolSlug, 'branding');
    const files = await fs.readdir(uploadDir).catch(() => []);
    
    const fileToDelete = files.find(f => {
      if (type === 'logo') return f.startsWith('logo.');
      if (type === 'banner') return f.startsWith('login-banner.');
      return false;
    });
    
    if (fileToDelete) {
      await fs.unlink(path.join(uploadDir, fileToDelete));
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

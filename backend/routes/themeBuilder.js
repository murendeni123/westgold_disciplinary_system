const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { dbGet, dbRun, dbAll } = require('../database/db');
const sharp = require('sharp');

const router = express.Router();

// =====================================================
// MIDDLEWARE
// =====================================================

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

// =====================================================
// FILE UPLOAD CONFIGURATION
// =====================================================

const themeAssetsDir = path.join(__dirname, '../uploads/theme-assets');
if (!fs.existsSync(themeAssetsDir)) {
  fs.mkdirSync(themeAssetsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const schoolId = req.params.schoolId || req.body.school_id;
    const schoolDir = path.join(themeAssetsDir, String(schoolId));
    if (!fs.existsSync(schoolDir)) {
      fs.mkdirSync(schoolDir, { recursive: true });
    }
    cb(null, schoolDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const assetType = req.body.asset_type || 'custom';
    cb(null, `${assetType}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  },
});

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

const getDefaultTokens = () => ({
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#f9fafb',
    surface: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    border: '#e5e7eb',
    focusRing: '#3b82f6',
  },
  typography: {
    fontPrimary: 'Inter',
    fontSecondary: 'Inter',
    baseFontSize: '16px',
    headingScale: {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      h4: '1.25rem',
      h5: '1rem',
      h6: '0.875rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  components: {
    buttonRadius: '8px',
    cardRadius: '12px',
    inputRadius: '8px',
    shadowLevel: 'medium',
    borderWidth: '1px',
    spacingScale: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
    },
  },
  layout: {
    sidebarWidth: '280px',
    headerHeight: '64px',
    density: 'normal',
    cornerStyle: 'rounded',
  },
});

const logThemeChange = async (schoolId, themeVersionId, action, changes, userId, validationResult = null) => {
  try {
    await dbRun(
      `INSERT INTO public.theme_change_history 
       (school_id, theme_version_id, action, changes, validation_passed, validation_warnings, changed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        schoolId,
        themeVersionId,
        action,
        JSON.stringify(changes),
        validationResult?.isValid ?? null,
        validationResult?.warnings ? JSON.stringify(validationResult.warnings) : null,
        userId,
      ]
    );
  } catch (error) {
    console.error('Error logging theme change:', error);
  }
};

// =====================================================
// GET PUBLISHED THEME (Public endpoint)
// =====================================================

router.get('/public/:schoolId/published', async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    const theme = await dbGet(
      `SELECT * FROM public.theme_versions 
       WHERE school_id = $1 AND status = 'published'
       ORDER BY version_number DESC LIMIT 1`,
      [schoolId]
    );

    if (!theme) {
      return res.json({
        theme: null,
        hasPublished: false,
        hasDraft: false,
      });
    }

    const hasDraft = await dbGet(
      `SELECT id FROM public.theme_versions 
       WHERE school_id = $1 AND status = 'draft' LIMIT 1`,
      [schoolId]
    );

    res.json({
      theme,
      hasPublished: true,
      hasDraft: !!hasDraft,
    });
  } catch (error) {
    console.error('Error fetching published theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GET DRAFT THEME (Platform admin only)
// =====================================================

router.get('/:schoolId/draft', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);

    let draft = await dbGet(
      `SELECT * FROM public.theme_versions 
       WHERE school_id = $1 AND status = 'draft'
       ORDER BY version_number DESC LIMIT 1`,
      [schoolId]
    );

    if (!draft) {
      // Get published theme as base for new draft
      const published = await dbGet(
        `SELECT * FROM public.theme_versions 
         WHERE school_id = $1 AND status = 'published'
         ORDER BY version_number DESC LIMIT 1`,
        [schoolId]
      );

      if (published) {
        draft = { ...published, id: null, status: 'draft' };
      } else {
        draft = {
          school_id: schoolId,
          status: 'draft',
          tokens: getDefaultTokens(),
          assets: {},
          content: {},
          email_templates: {},
          advanced_overrides: {},
          portal_overrides: {},
        };
      }
    }

    res.json({ theme: draft });
  } catch (error) {
    console.error('Error fetching draft theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// SAVE DRAFT THEME
// =====================================================

router.post('/:schoolId/draft', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const {
      tokens,
      assets,
      content,
      email_templates,
      advanced_overrides,
      portal_overrides,
      name,
      description,
    } = req.body;

    // Check if draft exists
    const existing = await dbGet(
      `SELECT id, version_number FROM public.theme_versions 
       WHERE school_id = $1 AND status = 'draft'
       ORDER BY version_number DESC LIMIT 1`,
      [schoolId]
    );

    let themeId;
    let versionNumber;

    if (existing) {
      // Update existing draft
      await dbRun(
        `UPDATE public.theme_versions SET
         tokens = $1,
         assets = $2,
         content = $3,
         email_templates = $4,
         advanced_overrides = $5,
         portal_overrides = $6,
         name = $7,
         description = $8,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          JSON.stringify(tokens),
          JSON.stringify(assets || {}),
          JSON.stringify(content || {}),
          JSON.stringify(email_templates || {}),
          JSON.stringify(advanced_overrides || {}),
          JSON.stringify(portal_overrides || {}),
          name,
          description,
          existing.id,
        ]
      );
      themeId = existing.id;
      versionNumber = existing.version_number;
    } else {
      // Create new draft
      const maxVersion = await dbGet(
        `SELECT COALESCE(MAX(version_number), 0) as max_version 
         FROM public.theme_versions WHERE school_id = $1`,
        [schoolId]
      );
      versionNumber = (maxVersion?.max_version || 0) + 1;

      const result = await dbRun(
        `INSERT INTO public.theme_versions 
         (school_id, version_number, status, tokens, assets, content, 
          email_templates, advanced_overrides, portal_overrides, name, description, created_by)
         VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          schoolId,
          versionNumber,
          JSON.stringify(tokens),
          JSON.stringify(assets || {}),
          JSON.stringify(content || {}),
          JSON.stringify(email_templates || {}),
          JSON.stringify(advanced_overrides || {}),
          JSON.stringify(portal_overrides || {}),
          name,
          description,
          req.platformAdmin.id,
        ]
      );
      themeId = result.id;
    }

    await logThemeChange(schoolId, themeId, existing ? 'updated' : 'created', req.body, req.platformAdmin.id);

    const updated = await dbGet(
      `SELECT * FROM public.theme_versions WHERE id = $1`,
      [themeId]
    );

    res.json({
      success: true,
      theme: updated,
      message: 'Draft saved successfully',
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// PUBLISH THEME
// =====================================================

router.post('/:schoolId/publish', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const { theme_version_id, force } = req.body;

    // Get the draft to publish
    const draft = await dbGet(
      `SELECT * FROM public.theme_versions WHERE id = $1 AND school_id = $2 AND status = 'draft'`,
      [theme_version_id, schoolId]
    );

    if (!draft) {
      return res.status(404).json({ error: 'Draft theme not found' });
    }

    // Validate theme (basic validation)
    const validationWarnings = [];
    
    // Check for missing assets
    const assets = draft.assets || {};
    if (!assets.logo) {
      validationWarnings.push({
        type: 'missing_asset',
        severity: 'warning',
        message: 'No logo uploaded',
        field: 'assets.logo',
      });
    }

    // Archive current published version
    await dbRun(
      `UPDATE public.theme_versions SET status = 'archived' 
       WHERE school_id = $1 AND status = 'published'`,
      [schoolId]
    );

    // Publish the draft
    await dbRun(
      `UPDATE public.theme_versions SET 
       status = 'published',
       published_at = CURRENT_TIMESTAMP,
       published_by = $1
       WHERE id = $2`,
      [req.platformAdmin.id, theme_version_id]
    );

    await logThemeChange(
      schoolId,
      theme_version_id,
      'published',
      { from_draft: true },
      req.platformAdmin.id,
      { isValid: true, warnings: validationWarnings }
    );

    const published = await dbGet(
      `SELECT * FROM public.theme_versions WHERE id = $1`,
      [theme_version_id]
    );

    res.json({
      success: true,
      published_version: published,
      validation_warnings: validationWarnings,
      message: 'Theme published successfully',
    });
  } catch (error) {
    console.error('Error publishing theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// ROLLBACK TO VERSION
// =====================================================

router.post('/:schoolId/rollback', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const { target_version_number } = req.body;

    // Get the target version
    const targetVersion = await dbGet(
      `SELECT * FROM public.theme_versions 
       WHERE school_id = $1 AND version_number = $2`,
      [schoolId, target_version_number]
    );

    if (!targetVersion) {
      return res.status(404).json({ error: 'Target version not found' });
    }

    // Archive current published
    await dbRun(
      `UPDATE public.theme_versions SET status = 'archived' 
       WHERE school_id = $1 AND status = 'published'`,
      [schoolId]
    );

    // Create new version from target
    const maxVersion = await dbGet(
      `SELECT COALESCE(MAX(version_number), 0) as max_version 
       FROM public.theme_versions WHERE school_id = $1`,
      [schoolId]
    );
    const newVersionNumber = (maxVersion?.max_version || 0) + 1;

    const result = await dbRun(
      `INSERT INTO public.theme_versions 
       (school_id, version_number, status, tokens, assets, content, 
        email_templates, advanced_overrides, portal_overrides, name, description, 
        created_by, published_at, published_by)
       VALUES ($1, $2, 'published', $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, $11)
       RETURNING id`,
      [
        schoolId,
        newVersionNumber,
        JSON.stringify(targetVersion.tokens),
        JSON.stringify(targetVersion.assets),
        JSON.stringify(targetVersion.content),
        JSON.stringify(targetVersion.email_templates),
        JSON.stringify(targetVersion.advanced_overrides),
        JSON.stringify(targetVersion.portal_overrides),
        `Rollback to v${target_version_number}`,
        `Rolled back from version ${target_version_number}`,
        req.platformAdmin.id,
      ]
    );

    await logThemeChange(
      schoolId,
      result.id,
      'rolled_back',
      { target_version: target_version_number },
      req.platformAdmin.id
    );

    const newVersion = await dbGet(
      `SELECT * FROM public.theme_versions WHERE id = $1`,
      [result.id]
    );

    res.json({
      success: true,
      new_version: newVersion,
      message: `Rolled back to version ${target_version_number}`,
    });
  } catch (error) {
    console.error('Error rolling back theme:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// UPLOAD ASSET
// =====================================================

router.post('/:schoolId/assets', requirePlatformAdmin, upload.single('file'), async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const { asset_type } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = `/uploads/theme-assets/${schoolId}/${req.file.filename}`;
    
    // Get image dimensions if it's an image
    let width, height;
    try {
      const metadata = await sharp(req.file.path).metadata();
      width = metadata.width;
      height = metadata.height;
    } catch (err) {
      // Not an image or error reading metadata
    }

    // Save asset record
    const result = await dbRun(
      `INSERT INTO public.theme_assets 
       (school_id, asset_type, file_path, file_name, file_size, mime_type, width, height, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        schoolId,
        asset_type,
        filePath,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        width,
        height,
        req.platformAdmin.id,
      ]
    );

    const asset = await dbGet(
      `SELECT * FROM public.theme_assets WHERE id = $1`,
      [result.id]
    );

    res.json({
      success: true,
      asset,
      url: filePath,
      message: 'Asset uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GET VERSION HISTORY
// =====================================================

router.get('/:schoolId/history', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    const versions = await dbAll(
      `SELECT * FROM public.theme_versions 
       WHERE school_id = $1 
       ORDER BY version_number DESC 
       LIMIT $2 OFFSET $3`,
      [schoolId, pageSize, offset]
    );

    const total = await dbGet(
      `SELECT COUNT(*) as count FROM public.theme_versions WHERE school_id = $1`,
      [schoolId]
    );

    res.json({
      versions,
      total: total.count,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// GET CHANGE HISTORY
// =====================================================

router.get('/:schoolId/changes', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;
    const offset = (page - 1) * pageSize;

    const history = await dbAll(
      `SELECT * FROM public.theme_change_history 
       WHERE school_id = $1 
       ORDER BY changed_at DESC 
       LIMIT $2 OFFSET $3`,
      [schoolId, pageSize, offset]
    );

    const total = await dbGet(
      `SELECT COUNT(*) as count FROM public.theme_change_history WHERE school_id = $1`,
      [schoolId]
    );

    res.json({
      history,
      total: total.count,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching change history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =====================================================
// DELETE ASSET
// =====================================================

router.delete('/:schoolId/assets/:assetId', requirePlatformAdmin, async (req, res) => {
  try {
    const schoolId = parseInt(req.params.schoolId);
    const assetId = parseInt(req.params.assetId);

    const asset = await dbGet(
      `SELECT * FROM public.theme_assets WHERE id = $1 AND school_id = $2`,
      [assetId, schoolId]
    );

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // Delete file
    const fullPath = path.join(__dirname, '..', asset.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Delete record
    await dbRun(
      `DELETE FROM public.theme_assets WHERE id = $1`,
      [assetId]
    );

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

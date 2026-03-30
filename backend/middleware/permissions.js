const { schemaGet } = require('../utils/schemaHelper');

// Define permission sets for different roles
const PERMISSIONS = {
  admin: [
    'view_dashboard',
    'view_students',
    'manage_students',
    'view_classes',
    'manage_classes',
    'view_teachers',
    'manage_teachers',
    'view_parents',
    'manage_parents',
    'manage_behavior',
    'view_reports',
    'manage_detention',
    'manage_consequences',
    'manage_merits',
    'view_discipline_center',
    'manage_users',
    'manage_bulk_import',
    'manage_discipline_rules',
    'view_notifications',
    'manage_settings'
  ],
  grade_head: [
    'view_dashboard',
    'view_students',
    'manage_students',
    'view_classes',
    'manage_classes',
    'view_teachers_limited',
    'view_parents_limited',
    'manage_behavior',
    'view_reports',
    'manage_detention',
    'manage_consequences',
    'manage_merits',
    'view_discipline_center',
    'view_notifications',
    'manage_settings_personal'
  ],
  teacher: [
    'view_dashboard',
    'view_students_limited',
    'manage_behavior',
    'view_reports_limited',
    'manage_detention_limited',
    'manage_consequences_limited',
    'manage_merits',
    'view_notifications',
    'manage_settings_personal'
  ],
  parent: [
    'view_dashboard',
    'view_children',
    'view_behavior',
    'view_reports_limited',
    'view_notifications',
    'manage_settings_personal'
  ]
};

// Get permissions for a user based on their role
const getUserPermissions = (user) => {
  if (!user) return [];
  
  // Admin has all permissions
  if (user.role === 'admin') {
    return PERMISSIONS.admin;
  }
  
  // Grade Head has grade head permissions
  if (user.isGradeHead) {
    return PERMISSIONS.grade_head;
  }
  
  // Default to role-based permissions
  return PERMISSIONS[user.role] || [];
};

// Middleware to check if user has required permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userPermissions = getUserPermissions(req.user);
    
    if (!userPermissions.includes(permission)) {
      console.log(`❌ Permission denied: User ${req.user.id} lacks '${permission}'`);
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permission,
        userRole: req.user.role,
        isGradeHead: req.user.isGradeHead || false
      });
    }
    
    next();
  };
};

// Middleware to check if user has ANY of the required permissions
const requireAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userPermissions = getUserPermissions(req.user);
    const hasPermission = permissions.some(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      console.log(`❌ Permission denied: User ${req.user.id} lacks any of [${permissions.join(', ')}]`);
      return res.status(403).json({ 
        error: 'Permission denied',
        required: permissions,
        userRole: req.user.role,
        isGradeHead: req.user.isGradeHead || false
      });
    }
    
    next();
  };
};

// Middleware to check if user is Grade Head or Admin
const requireGradeHeadOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin' || req.user.isGradeHead) {
    return next();
  }
  
  console.log(`❌ Access denied: User ${req.user.id} is not admin or grade head`);
  return res.status(403).json({ 
    error: 'Admin or Grade Head access required',
    userRole: req.user.role,
    isGradeHead: req.user.isGradeHead || false
  });
};

// Middleware to require admin only (not grade head)
const requireAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role === 'admin') {
    return next();
  }
  
  console.log(`❌ Access denied: User ${req.user.id} is not admin`);
  return res.status(403).json({ 
    error: 'Admin access required',
    userRole: req.user.role
  });
};

// Apply grade-level filtering to queries for grade heads
const applyGradeFilter = (query, params, req) => {
  // Admins see everything - no filter
  if (req.user.role === 'admin') {
    return { query, params };
  }
  
  // Grade heads only see their grade
  if (req.user.isGradeHead && req.user.gradeHeadFor) {
    const gradeParam = `$${params.length + 1}`;
    
    // Add grade filter - handles both class-based and student-based grade_level
    query += ` AND (c.grade_level = ${gradeParam} OR s.grade_level = ${gradeParam})`;
    params.push(req.user.gradeHeadFor);
  }
  
  return { query, params };
};

module.exports = {
  PERMISSIONS,
  getUserPermissions,
  requirePermission,
  requireAnyPermission,
  requireGradeHeadOrAdmin,
  requireAdminOnly,
  applyGradeFilter
};

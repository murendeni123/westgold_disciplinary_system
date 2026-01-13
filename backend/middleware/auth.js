const { dbGet } = require('../database/db');
const { supabaseAdmin } = require('../lib/supabaseClient');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured');
      return res.status(500).json({ error: 'Auth service unavailable' });
    }

    // ✅ VERIFY SUPABASE TOKEN (ONLY METHOD)
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      console.log('Supabase auth failed:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const supabaseUser = data.user;

    // ✅ FETCH PROFILE (REQUIRED)
    const profile = await dbGet(
      'SELECT * FROM user_profiles WHERE id = $1',
      [supabaseUser.id]
    );

    if (!profile) {
      return res.status(403).json({
        error: 'User profile not found. Please complete onboarding.'
      });
    }

    // ✅ SINGLE SOURCE OF TRUTH
    req.user = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: profile.role,
      full_name: profile.full_name,
      school_id: profile.school_id
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(403).json({ error: 'Authentication failed' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const getSchoolId = (req) => {
  return req.user?.school_id || null;
};

module.exports = {
  authenticateToken,
  requireRole,
  getSchoolId
};

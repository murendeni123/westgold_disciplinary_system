/**
 * Plan Expiry Middleware
 *
 * Blocks write operations (POST, PUT, PATCH, DELETE) for schools whose
 * free trial plan has expired. Read operations are always allowed.
 *
 * Usage: apply after authenticateToken + setSchemaFromToken on school routes.
 */

const { getSchoolPlan, isFreePlan, isPlanExpired } = require('../utils/planEnforcement');
const { dbRun } = require('../database/db');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Middleware: enforce that the school's plan is still active before allowing
 * any state-mutating request.
 */
const enforceActivePlan = async (req, res, next) => {
  try {
    // Platform admins bypass all plan checks
    if (req.user?.isPlatformAdmin || req.user?.role === 'platform_admin') {
      return next();
    }

    // Only gate write operations; reads are always allowed
    if (!WRITE_METHODS.has(req.method)) {
      return next();
    }

    const schoolId = req.schoolId || req.user?.schoolId;
    if (!schoolId) return next();

    const school = await getSchoolPlan(schoolId);
    if (!school || !isFreePlan(school)) return next();

    if (isPlanExpired(school)) {
      // Auto-suspend if not already suspended
      if (school.status !== 'suspended') {
        try {
          await dbRun(
            `UPDATE public.schools SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND plan_type = 'free_trial'`,
            [schoolId]
          );
        } catch {
          // Non-fatal — proceed to return the error anyway
        }
      }

      return res.status(403).json({
        error: 'Free trial expired',
        code: 'PLAN_EXPIRED',
        message: 'Your free trial has expired. All write operations are disabled. Please contact the platform administrator to upgrade your plan.',
      });
    }

    next();
  } catch (err) {
    console.error('enforceActivePlan middleware error:', err.message);
    next(); // Fail-open: don't block the request on unexpected errors
  }
};

module.exports = { enforceActivePlan };

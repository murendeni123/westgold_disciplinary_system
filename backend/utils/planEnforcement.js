/**
 * Plan Enforcement Utilities
 *
 * Centralised logic for Free Trial Plan limits.
 * All create/insert operations in school-specific routes should call
 * checkResourceLimit() before proceeding to ensure plan limits are respected.
 */

const { dbGet } = require('../database/db');
const cache = require('./cache');

// ============================================================================
// FREE PLAN LIMITS
// ============================================================================

const FREE_PLAN_LIMITS = {
  students:    200,
  teachers:    5,
  admins:      1,
  gradeHeads:  1,
  parentsAllowed: false,
};

// ============================================================================
// SCHOOL PLAN HELPERS
// ============================================================================

/**
 * Fetch school plan info from public.schools.
 * @param {number} schoolId
 * @returns {Promise<object|null>}
 */
const getSchoolPlan = async (schoolId) => {
  if (!schoolId) return null;
  const cacheKey = `school_plan_${schoolId}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const result = await dbGet(
    'SELECT id, plan_type, trial_ends_at, max_students, max_teachers, status FROM public.schools WHERE id = $1',
    [schoolId]
  );
  if (result) cache.set(cacheKey, result, 2 * 60 * 1000);
  return result;
};

/**
 * Returns true if the school is on a free trial plan.
 * @param {object} school
 * @returns {boolean}
 */
const isFreePlan = (school) => school?.plan_type === 'free_trial';

/**
 * Returns true if the school's free trial has expired.
 * @param {object} school
 * @returns {boolean}
 */
const isPlanExpired = (school) => {
  if (!isFreePlan(school)) return false;
  if (!school.trial_ends_at) return false;
  return new Date() > new Date(school.trial_ends_at);
};

/**
 * Returns the free plan limit object, or null for non-free-plan schools.
 * @param {object} school
 * @returns {object|null}
 */
const getPlanLimits = (school) => {
  if (!isFreePlan(school)) return null;
  return { ...FREE_PLAN_LIMITS };
};

/**
 * Returns the number of days remaining in the free trial, or null.
 * @param {object} school
 * @returns {number|null}
 */
const getDaysRemaining = (school) => {
  if (!isFreePlan(school) || !school.trial_ends_at) return null;
  const diff = Math.ceil((new Date(school.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
};

// ============================================================================
// LIMIT CHECKS
// ============================================================================

/**
 * Check if creating one more resource would violate the free plan limits.
 *
 * @param {number} schoolId         - School ID
 * @param {string} schemaName       - Already-validated school schema name
 * @param {'student'|'teacher'|'admin'|'grade_head'|'parent'} resourceType
 * @returns {Promise<{allowed: boolean, current?: number, limit?: number, message?: string}>}
 */
const checkResourceLimit = async (schoolId, schemaName, resourceType) => {
  const school = await getSchoolPlan(schoolId);

  if (!school || !isFreePlan(school)) {
    return { allowed: true };
  }

  if (isPlanExpired(school)) {
    return {
      allowed: false,
      message: 'Your free trial has expired. Please contact the platform administrator to upgrade your plan.',
    };
  }

  switch (resourceType) {
    case 'student': {
      const row = await dbGet(
        `SELECT COUNT(*) AS count FROM ${schemaName}.students WHERE is_active = true`,
        []
      );
      const current = parseInt(row?.count || 0, 10);
      const limit = FREE_PLAN_LIMITS.students;
      if (current >= limit) {
        return {
          allowed: false, current, limit,
          message: `Free plan limit reached: maximum ${limit} active students allowed (current: ${current}).`,
        };
      }
      return { allowed: true, current, limit };
    }

    case 'teacher': {
      const row = await dbGet(
        `SELECT COUNT(*) AS count FROM ${schemaName}.teachers WHERE is_active = true`,
        []
      );
      const current = parseInt(row?.count || 0, 10);
      const limit = FREE_PLAN_LIMITS.teachers;
      if (current >= limit) {
        return {
          allowed: false, current, limit,
          message: `Free plan limit reached: maximum ${limit} active teachers allowed (current: ${current}).`,
        };
      }
      return { allowed: true, current, limit };
    }

    case 'admin': {
      const row = await dbGet(
        `SELECT COUNT(*) AS count FROM public.user_schools WHERE school_id = $1 AND role_in_school = 'admin'`,
        [schoolId]
      );
      const current = parseInt(row?.count || 0, 10);
      const limit = FREE_PLAN_LIMITS.admins;
      if (current >= limit) {
        return {
          allowed: false, current, limit,
          message: `Free plan limit reached: maximum ${limit} admin user allowed (current: ${current}).`,
        };
      }
      return { allowed: true, current, limit };
    }

    case 'grade_head': {
      const row = await dbGet(
        `SELECT COUNT(*) AS count FROM ${schemaName}.teachers WHERE is_grade_head = true`,
        []
      );
      const current = parseInt(row?.count || 0, 10);
      const limit = FREE_PLAN_LIMITS.gradeHeads;
      if (current >= limit) {
        return {
          allowed: false, current, limit,
          message: `Free plan limit reached: maximum ${limit} grade head allowed (current: ${current}).`,
        };
      }
      return { allowed: true, current, limit };
    }

    case 'parent': {
      return {
        allowed: false,
        message: 'Parent accounts are not permitted on the Free Trial plan. Please upgrade to add parents.',
      };
    }

    default:
      return { allowed: true };
  }
};

/**
 * Check whether a bulk import operation would exceed free plan limits.
 * Call this BEFORE processing the import file.
 *
 * @param {number} schoolId
 * @param {string} schemaName
 * @param {'student'|'teacher'} resourceType
 * @param {number} incomingCount  - Number of new records in the file (not updates)
 * @returns {Promise<{allowed: boolean, current?: number, limit?: number, message?: string}>}
 */
const checkBulkImportLimit = async (schoolId, schemaName, resourceType, incomingCount) => {
  const school = await getSchoolPlan(schoolId);

  if (!school || !isFreePlan(school)) {
    return { allowed: true };
  }

  if (isPlanExpired(school)) {
    return {
      allowed: false,
      message: 'Your free trial has expired. Please contact the platform administrator to upgrade your plan.',
    };
  }

  if (resourceType === 'student') {
    const row = await dbGet(
      `SELECT COUNT(*) AS count FROM ${schemaName}.students WHERE is_active = true`,
      []
    );
    const current = parseInt(row?.count || 0, 10);
    const limit = FREE_PLAN_LIMITS.students;
    const projected = current + incomingCount;
    if (projected > limit) {
      return {
        allowed: false, current, limit, incomingCount,
        message: `Import would exceed the free plan limit: ${current} existing + ${incomingCount} new = ${projected} students (limit is ${limit}).`,
      };
    }
    return { allowed: true, current, limit };
  }

  if (resourceType === 'teacher') {
    const row = await dbGet(
      `SELECT COUNT(*) AS count FROM ${schemaName}.teachers WHERE is_active = true`,
      []
    );
    const current = parseInt(row?.count || 0, 10);
    const limit = FREE_PLAN_LIMITS.teachers;
    const projected = current + incomingCount;
    if (projected > limit) {
      return {
        allowed: false, current, limit, incomingCount,
        message: `Import would exceed the free plan limit: ${current} existing + ${incomingCount} new = ${projected} teachers (limit is ${limit}).`,
      };
    }
    return { allowed: true, current, limit };
  }

  return { allowed: true };
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  FREE_PLAN_LIMITS,
  getSchoolPlan,
  isFreePlan,
  isPlanExpired,
  getPlanLimits,
  getDaysRemaining,
  checkResourceLimit,
  checkBulkImportLimit,
};

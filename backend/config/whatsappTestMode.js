/**
 * WhatsApp Test Mode Configuration
 * 
 * PHASE 5 — TEST MODE (IMPORTANT)
 * 
 * Before going live:
 * - Use Meta test numbers
 * - One school only
 * - One parent only
 * - One template
 * - No bulk sends yet
 * 
 * This configuration controls test mode behavior for WhatsApp notifications.
 */

// Test mode is enabled by default for safety
const TEST_MODE_ENABLED = process.env.WHATSAPP_TEST_MODE !== 'false';

// Test mode configuration
const TEST_CONFIG = {
  // Only allow sending to these phone numbers in test mode
  allowedPhones: (process.env.WHATSAPP_TEST_PHONES || '').split(',').filter(Boolean),
  
  // Only allow these schools to send in test mode
  allowedSchoolIds: (process.env.WHATSAPP_TEST_SCHOOL_IDS || '').split(',').filter(Boolean),
  
  // Only allow these templates in test mode
  allowedTemplates: (process.env.WHATSAPP_TEST_TEMPLATES || 'student_absent,student_late').split(',').filter(Boolean),
  
  // Maximum messages per day in test mode
  maxDailyMessages: parseInt(process.env.WHATSAPP_TEST_MAX_DAILY || '10', 10),
  
  // Log all messages without sending (dry run)
  dryRun: process.env.WHATSAPP_DRY_RUN === 'true',
};

/**
 * Check if test mode is enabled
 */
const isTestModeEnabled = () => TEST_MODE_ENABLED;

/**
 * Check if a phone number is allowed in test mode
 * @param {string} phone - Phone number to check
 * @returns {boolean}
 */
const isPhoneAllowed = (phone) => {
  if (!TEST_MODE_ENABLED) return true;
  if (TEST_CONFIG.allowedPhones.length === 0) return true; // No restrictions if not configured
  
  // Normalize phone number for comparison
  const normalizedPhone = phone.replace(/[\s\-\+]/g, '');
  return TEST_CONFIG.allowedPhones.some(allowed => 
    normalizedPhone.includes(allowed.replace(/[\s\-\+]/g, ''))
  );
};

/**
 * Check if a school is allowed in test mode
 * @param {string} schoolId - School ID to check
 * @returns {boolean}
 */
const isSchoolAllowed = (schoolId) => {
  if (!TEST_MODE_ENABLED) return true;
  if (TEST_CONFIG.allowedSchoolIds.length === 0) return true; // No restrictions if not configured
  
  return TEST_CONFIG.allowedSchoolIds.includes(String(schoolId));
};

/**
 * Check if a template is allowed in test mode
 * @param {string} templateName - Template name to check
 * @returns {boolean}
 */
const isTemplateAllowed = (templateName) => {
  if (!TEST_MODE_ENABLED) return true;
  if (TEST_CONFIG.allowedTemplates.length === 0) return true; // No restrictions if not configured
  
  return TEST_CONFIG.allowedTemplates.includes(templateName);
};

/**
 * Check if we've exceeded daily message limit in test mode
 * @param {Function} getMessageCount - Async function to get today's message count
 * @returns {Promise<boolean>}
 */
const isDailyLimitExceeded = async (getMessageCount) => {
  if (!TEST_MODE_ENABLED) return false;
  
  const count = await getMessageCount();
  return count >= TEST_CONFIG.maxDailyMessages;
};

/**
 * Check if dry run mode is enabled (log only, don't send)
 * @returns {boolean}
 */
const isDryRun = () => TEST_CONFIG.dryRun;

/**
 * Validate a send request against test mode restrictions
 * @param {Object} params - Send parameters
 * @param {string} params.phone - Recipient phone
 * @param {string} params.schoolId - School ID
 * @param {string} params.templateName - Template name
 * @param {Function} params.getMessageCount - Function to get today's count
 * @returns {Promise<{allowed: boolean, reason?: string}>}
 */
const validateTestModeRequest = async ({ phone, schoolId, templateName, getMessageCount }) => {
  if (!TEST_MODE_ENABLED) {
    return { allowed: true };
  }

  // Check phone number
  if (!isPhoneAllowed(phone)) {
    return { 
      allowed: false, 
      reason: `Phone number ${phone} is not in the test mode allowed list` 
    };
  }

  // Check school
  if (!isSchoolAllowed(schoolId)) {
    return { 
      allowed: false, 
      reason: `School ${schoolId} is not in the test mode allowed list` 
    };
  }

  // Check template
  if (!isTemplateAllowed(templateName)) {
    return { 
      allowed: false, 
      reason: `Template ${templateName} is not in the test mode allowed list` 
    };
  }

  // Check daily limit
  if (getMessageCount && await isDailyLimitExceeded(getMessageCount)) {
    return { 
      allowed: false, 
      reason: `Daily message limit (${TEST_CONFIG.maxDailyMessages}) exceeded in test mode` 
    };
  }

  return { allowed: true };
};

/**
 * Get test mode status for admin dashboard
 */
const getTestModeStatus = () => ({
  enabled: TEST_MODE_ENABLED,
  dryRun: TEST_CONFIG.dryRun,
  config: {
    allowedPhones: TEST_CONFIG.allowedPhones.length > 0 
      ? TEST_CONFIG.allowedPhones.map(p => p.slice(-4).padStart(p.length, '*'))
      : 'All phones allowed',
    allowedSchools: TEST_CONFIG.allowedSchoolIds.length > 0 
      ? TEST_CONFIG.allowedSchoolIds 
      : 'All schools allowed',
    allowedTemplates: TEST_CONFIG.allowedTemplates.length > 0 
      ? TEST_CONFIG.allowedTemplates 
      : 'All templates allowed',
    maxDailyMessages: TEST_CONFIG.maxDailyMessages,
  },
});

module.exports = {
  isTestModeEnabled,
  isPhoneAllowed,
  isSchoolAllowed,
  isTemplateAllowed,
  isDailyLimitExceeded,
  isDryRun,
  validateTestModeRequest,
  getTestModeStatus,
  TEST_CONFIG,
};

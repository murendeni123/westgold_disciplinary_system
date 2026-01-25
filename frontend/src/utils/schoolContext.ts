/**
 * School Context Utilities
 * Helper functions to check if school context is ready before making tenant-scoped API calls
 */

/**
 * Check if school context is available in localStorage
 * This should be called before making any tenant-scoped API requests
 */
export const isSchoolContextReady = (): boolean => {
  const schoolId = localStorage.getItem('schoolId');
  const schemaName = localStorage.getItem('schemaName');
  
  return !!(schoolId && schemaName);
};

/**
 * Get school context from localStorage
 */
export const getSchoolContext = () => {
  return {
    schoolId: localStorage.getItem('schoolId'),
    schemaName: localStorage.getItem('schemaName'),
    schoolName: localStorage.getItem('schoolName'),
    schoolCode: localStorage.getItem('schoolCode'),
  };
};

/**
 * Wait for school context to be ready
 * Useful for components that need to wait for auth initialization
 */
export const waitForSchoolContext = (maxWaitMs: number = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkContext = () => {
      if (isSchoolContextReady()) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > maxWaitMs) {
        console.warn('School context not ready after', maxWaitMs, 'ms');
        resolve(false);
        return;
      }
      
      setTimeout(checkContext, 100);
    };
    
    checkContext();
  });
};

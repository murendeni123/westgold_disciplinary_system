import { useEffect, useRef } from 'react';

/**
 * A custom hook that creates an interval that pauses when the page is hidden
 * This prevents unnecessary API calls and memory issues on mobile devices
 * when the app is backgrounded or the browser tab is inactive
 */
export const useVisibilityAwareInterval = (
  callback: () => void,
  delay: number | null,
  options: { runImmediately?: boolean; pauseWhenHidden?: boolean } = {}
) => {
  const { runImmediately = false, pauseWhenHidden = true } = options;
  const savedCallback = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    // Don't schedule if no delay is specified
    if (delay === null) {
      return;
    }

    const tick = () => {
      // Only run if page is visible or if we're not pausing when hidden
      if (isVisibleRef.current || !pauseWhenHidden) {
        savedCallback.current();
      }
    };

    // Run immediately if requested
    if (runImmediately) {
      tick();
    }

    // Set up the interval
    intervalRef.current = setInterval(tick, delay);

    // Handle visibility change
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      // If page becomes visible again, run the callback immediately
      if (!document.hidden && pauseWhenHidden) {
        savedCallback.current();
      }
    };

    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (pauseWhenHidden) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [delay, pauseWhenHidden, runImmediately]);
};

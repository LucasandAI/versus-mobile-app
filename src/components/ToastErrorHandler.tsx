import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Component that listens for error events and shows appropriate toasts
 * This centralizes error handling for read status operations
 */
const ToastErrorHandler: React.FC = () => {
  // Keep track of errors to avoid showing duplicate toasts
  const errorTracker = useRef<Record<string, { count: number, timeout?: NodeJS.Timeout, lastShown?: number }>>({});
  
  useEffect(() => {
    const handleReadStatusError = (event: CustomEvent) => {
      const { type, id, error } = event.detail;
      if (!type || !id) return;
      
      const errorKey = `${type}-${id}`;
      const now = Date.now();
      
      // If this is the first error for this item, initialize tracking
      if (!errorTracker.current[errorKey]) {
        errorTracker.current[errorKey] = { count: 0 };
      }
      
      // Increment error count
      errorTracker.current[errorKey].count += 1;
      
      // Check if we've shown a toast for this item recently (in the last 30 seconds)
      const lastShown = errorTracker.current[errorKey].lastShown || 0;
      const timeSinceLastShown = now - lastShown;
      
      // Only show toast if:
      // 1. We've had multiple errors for this item (at least 3)
      // 2. We haven't shown a toast recently (to avoid spamming)
      if (errorTracker.current[errorKey].count >= 3 && timeSinceLastShown > 30000) {
        // Show a toast only once, even if we get multiple errors
        toast.error(
          type === 'club' 
            ? "Failed to mark club messages as read" 
            : "Failed to mark conversation as read",
          {
            id: errorKey,
            duration: 3000
          }
        );
        
        // Update the last shown timestamp
        errorTracker.current[errorKey].lastShown = now;
        
        // Reset the counter after showing toast
        errorTracker.current[errorKey].count = 0;
        
        // Clear any existing timeout
        if (errorTracker.current[errorKey].timeout) {
          clearTimeout(errorTracker.current[errorKey].timeout);
        }
        
        // Set a timeout to clean up this entry
        errorTracker.current[errorKey].timeout = setTimeout(() => {
          delete errorTracker.current[errorKey];
        }, 60000); // Clean up after 1 minute of no errors
      }
    };
    
    window.addEventListener('read-status-error', handleReadStatusError as EventListener);
    
    return () => {
      window.removeEventListener('read-status-error', handleReadStatusError as EventListener);
      
      // Clean up any remaining timeouts
      Object.values(errorTracker.current).forEach(entry => {
        if (entry.timeout) {
          clearTimeout(entry.timeout);
        }
      });
    };
  }, []);
  
  // This component doesn't render anything, just handles events
  return null;
};

export default ToastErrorHandler;

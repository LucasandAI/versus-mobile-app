
/**
 * Utility for debouncing functions to avoid excessive operations
 */

type DebouncedFunction = (...args: any[]) => void;

interface DebouncedFunctions {
  [key: string]: {
    timeoutId: ReturnType<typeof setTimeout> | null;
    lastArgs: any[];
    fn: (...args: any[]) => void;
    delay: number;
    lastExecuted: number;
  };
}

// Keep track of all debounced functions
const debouncedFunctions: DebouncedFunctions = {};

/**
 * Debounce a function to avoid calling it too frequently
 * 
 * @param key A unique identifier for this debounced function
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the function
 */
export const debounce = (key: string, fn: (...args: any[]) => void, delay: number): DebouncedFunction => {
  // Store the original function for later use with flush
  if (!debouncedFunctions[key]) {
    debouncedFunctions[key] = { 
      timeoutId: null, 
      lastArgs: [], 
      fn,
      delay,
      lastExecuted: 0
    };
  } else {
    // Update the function reference and delay
    debouncedFunctions[key].fn = fn;
    debouncedFunctions[key].delay = delay;
  }
  
  return (...args: any[]) => {
    // If we already have a pending execution for this key, cancel it
    if (debouncedFunctions[key]?.timeoutId) {
      clearTimeout(debouncedFunctions[key].timeoutId);
    }
    
    // Store the latest arguments
    debouncedFunctions[key].lastArgs = args;
    
    // Schedule a new execution
    debouncedFunctions[key].timeoutId = setTimeout(() => {
      // Execute the function and mark as executed
      fn(...debouncedFunctions[key].lastArgs);
      debouncedFunctions[key].lastExecuted = Date.now();
      debouncedFunctions[key].timeoutId = null;
    }, delay);
  };
};

/**
 * Cancel a debounced function
 * 
 * @param key The unique identifier for the debounced function
 */
export const cancelDebounce = (key: string): void => {
  if (debouncedFunctions[key]?.timeoutId) {
    clearTimeout(debouncedFunctions[key].timeoutId);
    debouncedFunctions[key].timeoutId = null;
  }
};

/**
 * Execute a debounced function immediately, canceling any pending timeout
 * Returns true if execution happened, false otherwise
 * 
 * @param key The unique identifier for the debounced function
 * @returns boolean indicating if execution occurred
 */
export const flushDebounce = (key: string): boolean => {
  if (debouncedFunctions[key]) {
    // Cancel any pending execution
    cancelDebounce(key);
    
    // Get the minimum time that should have passed since last execution
    const minTimeBetweenExecutions = Math.min(debouncedFunctions[key].delay / 2, 500); // At least 500ms or half the delay
    
    // Check if enough time has passed since last execution
    const timeSinceLastExecution = Date.now() - debouncedFunctions[key].lastExecuted;
    if (timeSinceLastExecution < minTimeBetweenExecutions) {
      console.log(`[debounceUtils] Skipping flush for ${key}, last executed ${timeSinceLastExecution}ms ago`);
      return false;
    }
    
    // Execute the function immediately with the last arguments
    console.log(`[debounceUtils] Flushing debounced function: ${key}`);
    debouncedFunctions[key].fn(...debouncedFunctions[key].lastArgs);
    debouncedFunctions[key].lastExecuted = Date.now();
    return true;
  }
  return false;
};

/**
 * Force execute a debounced function immediately regardless of timing
 * 
 * @param key The unique identifier for the debounced function
 */
export const forceFlushDebounce = (key: string): void => {
  if (debouncedFunctions[key]) {
    // Cancel any pending execution
    cancelDebounce(key);
    
    // Execute the function immediately with the last arguments
    console.log(`[debounceUtils] Force flushing debounced function: ${key}`);
    debouncedFunctions[key].fn(...debouncedFunctions[key].lastArgs);
    debouncedFunctions[key].lastExecuted = Date.now();
  }
};

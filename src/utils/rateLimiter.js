/**
 * Client-side Rate Limiter Utility
 * 
 * Prevents excessive API calls from the frontend by throttling requests
 */

class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a request can be made
   * @returns {boolean} - true if request can be made, false if rate limited
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Remove requests outside the time window
    this.requests = this.requests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    // Check if we've exceeded the limit
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    // Record this request
    this.requests.push(now);
    return true;
  }

  /**
   * Get time until next request can be made (in ms)
   * @returns {number} - milliseconds until next request allowed
   */
  getTimeUntilNextRequest() {
    if (this.requests.length === 0) return 0;
    
    const oldestRequest = this.requests[0];
    const now = Date.now();
    const elapsed = now - oldestRequest;
    
    return Math.max(0, this.windowMs - elapsed);
  }

  /**
   * Reset the rate limiter
   */
  reset() {
    this.requests = [];
  }
}

// Check if rate limiting is disabled via environment variable
const RATE_LIMIT_DISABLED = import.meta.env.VITE_RATE_LIMIT_ENABLED === 'false';

// Create rate limiters for different API call types
// If disabled, set very high limits (effectively unlimited)
const API_MAX = RATE_LIMIT_DISABLED ? 999999 : (parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS, 10) || 90);
const AUTH_MAX = RATE_LIMIT_DISABLED ? 999999 : (parseInt(import.meta.env.VITE_AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 4);
const WRITE_MAX = RATE_LIMIT_DISABLED ? 999999 : (parseInt(import.meta.env.VITE_WRITE_RATE_LIMIT_MAX_REQUESTS, 10) || 90);

export const apiRateLimiter = new RateLimiter(API_MAX, 15 * 60 * 1000);
export const authRateLimiter = new RateLimiter(AUTH_MAX, 15 * 60 * 1000);
export const writeRateLimiter = new RateLimiter(WRITE_MAX, 15 * 60 * 1000);

/**
 * Throttle function to limit function calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  
  return function (...args) {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

/**
 * Debounce function to delay function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise} - Promise that resolves with function result
 */
export async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on rate limit errors (429) - wait for the retryAfter time
      if (error?.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] || 60;
        const waitTime = parseInt(retryAfter, 10) * 1000;
        console.warn(`Rate limited. Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Don't retry on client errors (4xx) except 429
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
        throw error;
      }
      
      // Calculate exponential backoff delay
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Request failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

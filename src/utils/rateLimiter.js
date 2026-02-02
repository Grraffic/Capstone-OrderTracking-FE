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

// Create rate limiters for different API call types
// Aligned with backend: 300 requests per 15 minutes (900000ms) in production
// Keep frontend slightly below backend so the browser-side limiter trips first
// Use environment variables if available (Vite exposes them via import.meta.env)
const getEnvInt = (key, defaultValue) => {
  const value = import.meta.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

// Check if rate limiting is disabled via environment variable
const RATE_LIMIT_DISABLED = import.meta.env.VITE_RATE_LIMIT_ENABLED === 'false';

const API_WINDOW_MS = getEnvInt('VITE_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const API_MAX_REQUESTS = RATE_LIMIT_DISABLED ? 999999 : getEnvInt('VITE_RATE_LIMIT_MAX_REQUESTS', 260);
const AUTH_WINDOW_MS = getEnvInt('VITE_AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const AUTH_MAX_REQUESTS = RATE_LIMIT_DISABLED ? 999999 : getEnvInt('VITE_AUTH_RATE_LIMIT_MAX_REQUESTS', 4);
const WRITE_WINDOW_MS = getEnvInt('VITE_WRITE_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
const WRITE_MAX_REQUESTS = RATE_LIMIT_DISABLED ? 999999 : getEnvInt('VITE_WRITE_RATE_LIMIT_MAX_REQUESTS', 260);

export const apiRateLimiter = new RateLimiter(API_MAX_REQUESTS, API_WINDOW_MS);
export const authRateLimiter = new RateLimiter(AUTH_MAX_REQUESTS, AUTH_WINDOW_MS);
export const writeRateLimiter = new RateLimiter(WRITE_MAX_REQUESTS, WRITE_WINDOW_MS);

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

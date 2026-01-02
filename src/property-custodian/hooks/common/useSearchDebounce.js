import { useState, useEffect } from 'react';

/**
 * useSearchDebounce Hook
 *
 * Custom hook to debounce search input to prevent excessive API calls
 * and reduce page shaking during typing.
 *
 * @param {string} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms for smoother experience)
 * @returns {string} - Debounced value
 *
 * Usage:
 * const [searchQuery, setSearchQuery] = useState("");
 * const debouncedSearchQuery = useSearchDebounce(searchQuery, 500);
 */
export const useSearchDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


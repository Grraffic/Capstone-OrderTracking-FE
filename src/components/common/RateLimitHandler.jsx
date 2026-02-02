import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

/**
 * RateLimitHandler Component
 * 
 * Listens for rate limit errors and displays user-friendly notifications with countdown
 */
const RateLimitHandler = () => {
  const [rateLimited, setRateLimited] = useState(false);
  const [resetTime, setResetTime] = useState(null);

  useEffect(() => {
    const handleRateLimitError = (event) => {
      const { retryAfter, message, resetTime: resetTimeFromEvent } = event.detail;
      
      // Parse reset time
      let resetTimeDate = null;
      if (resetTimeFromEvent) {
        try {
          resetTimeDate = new Date(resetTimeFromEvent);
          // Validate the date
          if (isNaN(resetTimeDate.getTime())) {
            resetTimeDate = null;
          }
        } catch (e) {
          console.warn("Invalid resetTime format:", resetTimeFromEvent);
          resetTimeDate = null;
        }
      }
      
      // Fallback: parse retryAfter if resetTime is not available
      if (!resetTimeDate && retryAfter) {
        // Parse retryAfter string (e.g., "15 minutes" or just "15")
        const match = retryAfter.match(/(\d+)/);
        const minutes = match ? parseInt(match[1]) : 15;
        resetTimeDate = new Date(Date.now() + minutes * 60 * 1000);
      }

      setRateLimited(true);
      setResetTime(resetTimeDate);

      // Format time remaining
      const formatTimeRemaining = (resetDate) => {
        if (!resetDate) return "";
        const now = new Date();
        const diff = resetDate - now;
        if (diff <= 0) return "now";
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        if (minutes > 0) {
          return `${minutes} minute${minutes !== 1 ? "s" : ""} and ${seconds} second${seconds !== 1 ? "s" : ""}`;
        }
        return `${seconds} second${seconds !== 1 ? "s" : ""}`;
      };

      const timeRemaining = formatTimeRemaining(resetTimeDate);
      
      toast.error(
        `⏱️ Rate limit exceeded. ${message || "Please try again later."}${timeRemaining ? ` You can retry in ${timeRemaining}.` : ""}`,
        {
          duration: 10000, // Show for 10 seconds
          icon: "⏱️",
          style: {
            background: "#fee2e2",
            color: "#991b1b",
            border: "1px solid #fca5a5",
            minWidth: "400px",
          },
        }
      );
    };

    // Listen for rate limit events
    window.addEventListener("rate-limit-exceeded", handleRateLimitError);

    // Check if rate limit has expired
    const checkRateLimitExpiry = setInterval(() => {
      if (resetTime && new Date() >= resetTime) {
        setRateLimited(false);
        setResetTime(null);
      }
    }, 1000);

    return () => {
      window.removeEventListener("rate-limit-exceeded", handleRateLimitError);
      clearInterval(checkRateLimitExpiry);
    };
  }, [resetTime]);

  return null; // This component doesn't render anything
};

export default RateLimitHandler;

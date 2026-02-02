import { useState, useEffect } from "react";
import transactionService from "../../services/transaction.service";
import { format } from "date-fns";

/**
 * Hook to fetch and format recent audit transactions
 * @param {number} limit - Maximum number of transactions to fetch (default: 5)
 * @returns {object} { audits, loading, error, refetch }
 */
const useRecentAudits = (limit = 5) => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecentAudits = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await transactionService.getTransactions({
        limit: limit,
      });

      if (result.success && result.data) {
        // Format transactions for display
        const formattedAudits = result.data.map((tx) => ({
          id: tx.id,
          dateTime: format(new Date(tx.created_at), "MMM d, h:mm a"),
          user: tx.user_name || "System",
          action: tx.action || "Unknown Action",
          details: tx.details || "No details available",
          type: tx.type || "Unknown",
        }));

        setAudits(formattedAudits);
      } else {
        setAudits([]);
      }
    } catch (err) {
      console.error("Error fetching recent audits:", err);
      setError(err.message || "Failed to fetch recent audits");
      setAudits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentAudits();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentAudits, 30000);
    
    return () => clearInterval(interval);
  }, [limit]);

  return {
    audits,
    loading,
    error,
    refetch: fetchRecentAudits,
  };
};

export default useRecentAudits;

import { useState, useEffect } from "react";
import transactionService from "../../services/transaction.service";
import { format } from "date-fns";

/**
 * Hook to fetch and format student audit transactions
 * @param {number} limit - Maximum number of transactions to fetch (default: 10)
 * @returns {object} { transactions, loading, error, refetch }
 */
const useStudentAudits = (limit = 10) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudentAudits = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await transactionService.getTransactions({
        userRole: "student",
        limit: limit,
      });

      if (result.success && result.data) {
        // Format transactions for display
        const formattedTransactions = result.data.map((tx) => ({
          id: tx.id,
          dateTime: format(new Date(tx.created_at), "MMM d, yyyy h:mm a"),
          user: tx.user_name || "Unknown",
          action: tx.action || "Unknown Action",
          details: tx.details || "No details available",
          status: tx.type || "Unknown",
        }));

        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Error fetching student audits:", err);
      setError(err.message || "Failed to fetch student audits");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentAudits();
  }, [limit]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchStudentAudits,
  };
};

export default useStudentAudits;

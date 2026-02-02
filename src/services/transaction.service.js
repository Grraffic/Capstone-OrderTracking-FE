import { API_BASE_URL } from "./api";

/**
 * Transaction Service
 * 
 * Handles API calls for transaction data
 */
class TransactionService {
  /**
   * Get authorization header
   * @returns {object} Headers with Authorization token
   */
  getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Get all transactions with optional filters
   * @param {object} filters - Filter options
   * @param {string} filters.type - Filter by transaction type
   * @param {string} filters.action - Filter by action
   * @param {string} filters.userId - Filter by user ID
   * @param {string} filters.userRole - Filter by user role
   * @param {Date} filters.startDate - Start date for date range
   * @param {Date} filters.endDate - End date for date range
   * @param {number} filters.limit - Maximum number of results
   * @param {number} filters.offset - Offset for pagination
   * @returns {Promise} Transactions list
   */
  async getTransactions(filters = {}) {
    try {
      console.log("[TransactionService] 🚀 getTransactions called with filters:", {
        type: filters.type,
        action: filters.action,
        userId: filters.userId,
        userRole: filters.userRole,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
        limit: filters.limit,
        offset: filters.offset,
      });
      
      const queryParams = new URLSearchParams();
      
      if (filters.type) queryParams.append("type", filters.type);
      if (filters.action) queryParams.append("action", filters.action);
      if (filters.userId) queryParams.append("userId", filters.userId);
      if (filters.userRole) queryParams.append("userRole", filters.userRole);
      if (filters.startDate) queryParams.append("startDate", filters.startDate.toISOString());
      if (filters.endDate) queryParams.append("endDate", filters.endDate.toISOString());
      if (filters.limit) queryParams.append("limit", filters.limit.toString());
      if (filters.offset) queryParams.append("offset", filters.offset.toString());

      const url = `${API_BASE_URL}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      console.log("[TransactionService] 📡 Making API call to:", url);
      
      const headers = this.getAuthHeaders();
      console.log("[TransactionService] 🔐 Auth headers:", {
        hasAuth: !!headers.Authorization,
        authPrefix: headers.Authorization?.substring(0, 20) + "...",
      });
      
      const response = await fetch(url, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      console.log("[TransactionService] 📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json();
        console.error("[TransactionService] ❌ API error response:", error);
        
        // Include details in error message if available
        const errorMessage = error.message || "Failed to fetch transactions";
        const errorDetails = error.details ? ` - ${error.details}` : "";
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const data = await response.json();
      console.log("[TransactionService] ✅ API response data:", {
        success: data.success,
        dataLength: data.data?.length || 0,
        sample: data.data?.[0] ? {
          id: data.data[0].id,
          type: data.data[0].type,
          action: data.data[0].action,
        } : null,
      });

      return data;
    } catch (error) {
      console.error("[TransactionService] ❌ Get transactions error:", error);
      console.error("[TransactionService] Error details:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get transactions by type
   * @param {string} type - Transaction type
   * @param {number} limit - Maximum number of results
   * @returns {Promise} Transactions list
   */
  async getTransactionsByType(type, limit = 100) {
    return this.getTransactions({ type, limit });
  }

  /**
   * Get recent transactions
   * @param {number} limit - Maximum number of results
   * @returns {Promise} Recent transactions
   */
  async getRecentTransactions(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/recent?limit=${limit}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch recent transactions");
      }

      return await response.json();
    } catch (error) {
      console.error("Get recent transactions error:", error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise} Transaction
   */
  async getTransactionById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch transaction");
      }

      return await response.json();
    } catch (error) {
      console.error("Get transaction by ID error:", error);
      throw error;
    }
  }
}

export default new TransactionService();

import { useMemo } from "react";

/**
 * Custom hook to calculate orders statistics
 * 
 * Calculates various statistics from orders data:
 * - Total cost summary
 * - Status counts (pending, processing, claimed, cancelled)
 * - Unreleased quantity
 * - Released quantity
 * - Processing count
 * - Claimed count
 * 
 * @param {Array} orders - Array of order objects
 * @returns {Object} Statistics object with all calculated values
 */
const useOrdersStats = (orders) => {
  const stats = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        totalCost: 0,
        pendingCount: 0,
        processingCount: 0,
        claimedCount: 0,
        cancelledCount: 0,
        unreleasedQuantity: 0,
        releasedQuantity: 0,
      };
    }

    // Calculate total cost
    // Check both totalAmount (transformed) and total_amount (raw API)
    const totalCost = orders.reduce((sum, order) => {
      const amount = order.totalAmount || order.total_amount || order.originalOrder?.total_amount || 0;
      return sum + (parseFloat(amount) || 0);
    }, 0);

    // Helper function to get order status (check both order.status and originalOrder.status)
    const getOrderStatus = (order) => {
      return (order.status?.toLowerCase() || 
              order.originalOrder?.status?.toLowerCase() || 
              "").toLowerCase();
    };

    // Count orders by status
    const pendingCount = orders.filter(
      (order) => getOrderStatus(order) === "pending"
    ).length;

    const processingCount = orders.filter(
      (order) => getOrderStatus(order) === "processing"
    ).length;

    const claimedCount = orders.filter((order) => {
      const status = getOrderStatus(order);
      return status === "claimed" || status === "completed";
    }).length;

    const cancelledCount = orders.filter(
      (order) => getOrderStatus(order) === "cancelled"
    ).length;

    // Calculate unreleased quantity (pending + processing)
    const unreleasedQuantity = orders.filter((order) => {
      const status = getOrderStatus(order);
      return status === "pending" || status === "processing";
    }).length;

    // Calculate released quantity (claimed)
    // Check both order.status and originalOrder.status (for transformed orders)
    const releasedQuantity = orders.filter((order) => {
      const status = order.status?.toLowerCase() || 
                    order.originalOrder?.status?.toLowerCase() || 
                    "";
      return status === "claimed" || status === "completed";
    }).length;

    return {
      totalCost,
      pendingCount,
      processingCount,
      claimedCount,
      cancelledCount,
      unreleasedQuantity,
      releasedQuantity,
    };
  }, [orders]);

  return stats;
};

export default useOrdersStats;


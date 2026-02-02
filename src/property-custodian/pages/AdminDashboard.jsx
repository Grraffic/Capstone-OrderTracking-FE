import { useState } from "react";
import AdminLayout from "../components/layouts/AdminLayout";
import {
  InventoryHealth,
  InventoryAlerts,
  OrderTracking,
  RecentAudits,
} from "../components/shared";
import DateRangePicker from "../components/common/DateRangePicker";
import { useAdminDashboardData } from "../hooks";
import { DashboardSkeleton } from "../components/Skeleton";
import { subDays, startOfDay, endOfDay } from "date-fns";

const AdminDashboard = () => {
  // Date range state - default to last 30 days
  const today = new Date();
  const defaultStartDate = startOfDay(subDays(today, 29));
  const defaultEndDate = endOfDay(today);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const {
    inventoryHealth,
    outOfStockItems,
    orderTracking,
    recentAudits,
    loading,
  } = useAdminDashboardData(startDate, endDate);

  const handleDateRangeChange = (newStartDate, newEndDate) => {
    if (newStartDate) {
      setStartDate(startOfDay(newStartDate));
    }
    if (newEndDate) {
      setEndDate(endOfDay(newEndDate));
    } else if (newStartDate && !newEndDate) {
      // If only start date is selected, set end date to same day
      setEndDate(endOfDay(newStartDate));
    }
  };

  return (
    <AdminLayout
      title={
        <h1 className="text-4xl font-bold">
          <span className="text-[#0C2340]">Dash</span>
          <span className="text-[#e68b00]">board</span>
        </h1>
      }
    >
      {/* Show skeleton while loading */}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Inventory Health Section */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-sf-semibold font-semibold tracking-tight text-[#0C2340]">
                Inventory <span className="text-[#e68b00]">Health</span>
              </h2>
            </div>
            <InventoryHealth 
              stats={inventoryHealth}
              dateRangePicker={
                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDateRangeChange={handleDateRangeChange}
                  className="w-full"
                />
              }
            />
          </div>

          {/* Inventory Alerts and Order Tracking - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left: Inventory Alerts */}
            <div>
              <InventoryAlerts items={outOfStockItems} />
            </div>

            {/* Right: Order Tracking */}
            <div>
              <OrderTracking stats={orderTracking} />
            </div>
          </div>

          {/* Recent Audits */}
          <div>
            <RecentAudits transactions={recentAudits} />
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;

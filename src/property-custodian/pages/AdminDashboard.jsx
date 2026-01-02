import AdminLayout from "../components/layouts/AdminLayout";
import {
  InventoryHealth,
  InventoryAlerts,
  OrderTracking,
  RecentAudits,
} from "../components/shared";
import { useAdminDashboardData } from "../hooks";
import { DashboardSkeleton } from "../components/Skeleton";

const AdminDashboard = () => {
  const {
    activeTab,
    handleTabChange,
    inventoryHealth,
    outOfStockItems,
    orderTracking,
    recentAudits,
    loading,
  } = useAdminDashboardData();

  const tabs = ["Week", "Month", "Year"];

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
            <div className="flex items-center gap-8 mb-4">
              <h2 className="text-lg font-semibold text-[#0C2340]">
                Inventory <span className="text-[#e68b00]">Health</span>
              </h2>
              {/* Tabs */}
              <div className="flex gap-6">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => handleTabChange(tab)}
                    className={`pb-0 font-medium transition-colors relative text-sm ${
                      activeTab === tab
                        ? "text-[#e68b00]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#e68b00] rounded-t-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <InventoryHealth stats={inventoryHealth} />
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

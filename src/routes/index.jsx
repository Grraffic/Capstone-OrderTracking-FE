import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AdminOutletLayout from "../property-custodian/components/layouts/AdminOutletLayout";
import SystemAdminOutletLayout from "../system-admin/components/layouts/SystemAdminOutletLayout";
import MaintenanceBlock from "../components/auth/MaintenanceBlock";
import StudentOnboardingGuard from "../components/auth/StudentOnboardingGuard";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import AuthCallback from "../pages/AuthCallback";

// Property Custodian Pages
import AdminDashboard from "../property-custodian/pages/AdminDashboard";
import Items from "../property-custodian/pages/Items";
import Inventory from "../property-custodian/pages/Inventory";
import Orders from "../property-custodian/pages/Orders";
import Settings from "../property-custodian/pages/Settings";
import StudentList from "../property-custodian/pages/StudentList";
import EligibilityManagement from "../property-custodian/pages/EligibilityManagement";

// System Admin Pages
import SystemAdminDashboard from "../system-admin/pages/SystemAdminDashboard";
import ItemApproval from "../system-admin/pages/ItemApproval";
import SystemSettings from "../system-admin/pages/SystemSettings";
import ArchiveUsers from "../system-admin/pages/ArchiveUsers";
import RecentAudits from "../system-admin/pages/RecentAudits";

// Student Pages - lazy-loaded for smaller initial bundle
const StudentDashboard = lazy(() => import("../student/pages/StudentDashboard"));
const AllProducts = lazy(() => import("../student/pages/AllProducts"));
const ProductDetailsPage = lazy(() => import("../student/pages/ProductDetailsPage"));
const MyCart = lazy(() => import("../student/pages/MyCart"));
const CheckoutPage = lazy(() => import("../student/pages/CheckoutPage"));
const StudentProfile = lazy(() => import("../student/pages/StudentProfile"));
const StudentSettings = lazy(() => import("../student/pages/StudentSettings"));
const OrderSuccessPage = lazy(() => import("../student/pages/OrderSuccessPage"));

/**
 * Application Routes
 *
 * Centralized route configuration for the application.
 * Separated from App.jsx for better organization and maintainability.
 */
const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
    Loading…
  </div>
);

const PROPERTY_CUSTODIAN_ROLES = [
  "property_custodian",
  "admin",
  "finance_staff",
  "accounting_staff",
  "department_head",
];

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Property custodian: one persistent layout + nested routes (sidebar state survives navigation) */}
      <Route
        path="/property-custodian"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <AdminOutletLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="items"
          handle={{ noPadding: true }}
          element={<Items />}
        />
        <Route
          path="inventory"
          handle={{ noPadding: true }}
          element={<Inventory />}
        />
        <Route
          path="orders"
          handle={{ noPadding: true }}
          element={<Orders />}
        />
        <Route path="settings" element={<Settings />} />
        <Route path="students" element={<StudentList />} />
        <Route path="eligibility" element={<EligibilityManagement />} />
      </Route>

      {/* Legacy /admin → /property-custodian (same auth) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <Navigate to="/property-custodian" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/items"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <Navigate to="/property-custodian/items" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <Navigate to="/property-custodian/inventory" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <Navigate to="/property-custodian/orders" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRoles={PROPERTY_CUSTODIAN_ROLES}>
            <Navigate to="/property-custodian/settings" replace />
          </ProtectedRoute>
        }
      />

      {/* System admin: one persistent layout + nested routes */}
      <Route
        path="/system-admin"
        element={
          <ProtectedRoute requiredRoles={["system_admin"]}>
            <SystemAdminOutletLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<SystemAdminDashboard />} />
        <Route path="archive-users" element={<ArchiveUsers />} />
        <Route path="item-approval" element={<ItemApproval />} />
        <Route path="recent-audits" element={<RecentAudits />} />
        <Route path="settings" element={<SystemSettings />} />
      </Route>

      {/* Student Routes - Protected to student role and blocked during maintenance */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentDashboard />
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-products"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentOnboardingGuard>
                <AllProducts />
              </StudentOnboardingGuard>
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentOnboardingGuard>
                <ProductDetailsPage />
              </StudentOnboardingGuard>
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/cart"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentOnboardingGuard>
                <MyCart />
              </StudentOnboardingGuard>
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/checkout"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentOnboardingGuard>
                <CheckoutPage />
              </StudentOnboardingGuard>
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentProfile />
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <StudentSettings />
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/order-success"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MaintenanceBlock>
              <OrderSuccessPage />
            </MaintenanceBlock>
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;

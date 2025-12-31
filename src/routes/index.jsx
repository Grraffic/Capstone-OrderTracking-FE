import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import AuthCallback from "../pages/AuthCallback";

// Admin Pages
import AdminDashboard from "../admin/pages/AdminDashboard";
import Items from "../admin/pages/Items";
import Inventory from "../admin/pages/Inventory";
import Orders from "../admin/pages/Orders";
import Settings from "../admin/pages/Settings";

// Student Pages
import StudentDashboard from "../student/pages/StudentDashboard";
import AllProducts from "../student/pages/AllProducts";
import ProductDetailsPage from "../student/pages/ProductDetailsPage";
import MyCart from "../student/pages/MyCart";
import CheckoutPage from "../student/pages/CheckoutPage";
import StudentProfile from "../student/pages/StudentProfile";
import StudentSettings from "../student/pages/StudentSettings";
import OrderSuccessPage from "../student/pages/OrderSuccessPage";

/**
 * Application Routes
 *
 * Centralized route configuration for the application.
 * Separated from App.jsx for better organization and maintainability.
 */
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Admin Routes - Protected to admin role */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/items"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Items />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/inventory"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Inventory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRoles={["admin"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Student Routes - Protected to student role */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/all-products"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <AllProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <ProductDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/cart"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <MyCart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/checkout"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/settings"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <StudentSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/order-success"
        element={
          <ProtectedRoute requiredRoles={["student"]}>
            <OrderSuccessPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;

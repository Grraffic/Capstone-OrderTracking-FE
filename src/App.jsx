import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboard from "./admin/pages/AdminDashboard";
import Inventory from "./admin/pages/Inventory";
import Orders from "./admin/pages/Orders";
import AuthCallback from "./pages/AuthCallback";
import ProductCategories from "./student/pages/ProductCategories";
import StudentDashboard from "./student/pages/StudentDashboard";
import AllProducts from "./student/pages/AllProducts";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Product Categories - protected for students */}
            <Route
              path="/product-categories"
              element={
                <ProtectedRoute requiredRoles={["student"]}>
                  <ProductCategories />
                </ProtectedRoute>
              }
            />

            {/* Admin routes - protected to admin role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={["admin"]}>
                  <AdminDashboard />
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

            {/* Student dashboard - protected */}
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute requiredRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* All Products page - protected for students */}
            <Route
              path="/all-products"
              element={
                <ProtectedRoute requiredRoles={["student"]}>
                  <AllProducts />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

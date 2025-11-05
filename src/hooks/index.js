/**
 * Hooks Index
 *
 * Central export point for all custom hooks
 *
 * Usage:
 * import { useLogin, useDashboardData, useProductCategories } from '../hooks';
 */

// Authentication Hooks
export { useLogin } from "./useLogin";
export { useLoginRedirect } from "./useLoginRedirect";
export { useLoginForm } from "./useLoginForm";
export { useRoleSelection } from "./useRoleSelection";

// Dashboard Hooks
export { useDashboardData } from "./useDashboardData";
export { useOrderStatus } from "./useOrderStatus";
export { useAdminDashboardData } from "./useAdminDashboardData";

// Inventory Hooks
export { useInventory } from "./useInventory";

// Product Hooks
export { useProductCategories } from "./useProductCategories";
export { useProductPagination } from "./useProductPagination";

// UI Hooks
export { useScrollOnState } from "./useScrollOnState";
export { useNavigateToSection } from "./useNavigateToSection";

// Student Hooks (now in /student module)
export { useProducts } from "../student/hooks/useProducts";
export { useSearchDebounce } from "../student/hooks/useSearchDebounce";
export { useProductFilter } from "../student/hooks/useProductFilter";
export { useProductPagination as useStudentProductPagination } from "../student/hooks/useProductPagination";

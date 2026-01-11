/**
 * Admin Hooks Index
 *
 * Central export file for all admin-specific custom hooks.
 * This file provides easy access to admin business logic hooks.
 *
 * Organized by feature domain:
 * - common: Shared hooks used across multiple features
 * - items: Items management hooks
 * - orders: Order management hooks
 * - settings: Settings and profile hooks
 *
 * Usage:
 * import { useItemsStats, useAdminSidebar, useQRScanner, useItemAdjustmentForm, useItemsModalForm, useOrdersStats, useOrdersFilters, useAdminProfile } from '../hooks';
 */

// Common Hooks
export { useAdminSidebar } from "./common/useAdminSidebar";
export { useSearchDebounce } from "./common/useSearchDebounce";

// Dashboard Hooks
export { useAdminDashboardData } from "./dashboard/useAdminDashboardData";
export { useInventoryHealthStats } from "./dashboard/useInventoryHealthStats";
export { useInventoryDetail } from "./dashboard/useInventoryDetail";
export { useInventoryAtReorderPoint } from "./dashboard/useInventoryAtReorderPoint";
export { useInventoryOutOfStock } from "./dashboard/useInventoryOutOfStock";

// Items Hooks
export { useItemsStats } from "./items/useItemsStats";
export { useItemAdjustmentForm } from "./items/useItemAdjustmentForm";
export { useItemsModalForm } from "./items/useItemsModalForm";
export { useItemDetailsModal } from "./items/useItemDetailsModal";
export { useQRScanner } from "./items/useQRScanner";
export { useItems } from "./items/useItems";

// Orders Hooks
export { default as useOrdersStats } from "./orders/useOrdersStats";
export { default as useOrdersFilters } from "./orders/useOrdersFilters";
export { useOrders } from "./orders/useOrders";
export { useOrderQRScanner } from "./orders/useOrderQRScanner";
export { useSocketOrderUpdates } from "./orders/useSocketOrderUpdates";

// Settings Hooks
export { useAdminProfile } from "./settings/useAdminProfile";

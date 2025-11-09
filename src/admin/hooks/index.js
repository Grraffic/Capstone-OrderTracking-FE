/**
 * Admin Hooks Index
 *
 * Central export file for all admin-specific custom hooks.
 * This file provides easy access to admin business logic hooks.
 *
 * Usage:
 * import { useInventoryStats, useAdminSidebar, useQRScanner, useItemAdjustmentForm, useInventoryModalForm, useOrdersStats, useOrdersFilters, useAdminProfile } from '../hooks';
 */

// Inventory Hooks
export { useInventoryStats } from "./useInventoryStats";
export { useItemAdjustmentForm } from "./useItemAdjustmentForm";
export { useInventoryModalForm } from "./useInventoryModalForm";

// Orders Hooks
export { default as useOrdersStats } from "./useOrdersStats";
export { default as useOrdersFilters } from "./useOrdersFilters";
export { useOrders } from "./useOrders";
export { useOrderQRScanner } from "./useOrderQRScanner";

// Profile Hooks
export { useAdminProfile } from "./useAdminProfile";

// UI State Hooks
export { useAdminSidebar } from "./useAdminSidebar";
export { useQRScanner } from "./useQRScanner";

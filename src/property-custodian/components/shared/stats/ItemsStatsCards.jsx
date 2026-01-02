import React from "react";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import StatsCardGrid from "./StatsCardGrid";

/**
 * ItemsStatsCards Component
 *
 * Displays items statistics in a responsive grid of cards:
 * - Total Items
 * - Above Threshold (stock >= 50)
 * - At Reorder Point (stock 20-49)
 * - Critical (stock 1-19)
 * - Out of Stock (stock = 0)
 *
 * Responsive Layout:
 * - Mobile (<640px): 1 column (stacked)
 * - Tablet (640px-1023px): 2 columns
 * - Desktop (≥1024px): 5 columns (single row)
 *
 * Props:
 * - stats: Object containing { totalItems, aboveThreshold, atReorderPoint, critical, outOfStock }
 */
const ItemsStatsCards = ({ stats }) => {
  const cards = [
    {
      id: 1,
      title: "Total Items",
      value: stats.totalItems || 0,
      icon: Package,
      color: "text-[#0C2340]",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 2,
      title: "Above Threshold",
      value: stats.aboveThreshold || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      id: 3,
      title: "At Reorder Point",
      value: stats.atReorderPoint || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      id: 4,
      title: "Critical",
      value: stats.critical || 0,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      id: 5,
      title: "Out of Stock",
      value: stats.outOfStock || 0,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];

  return <StatsCardGrid cards={cards} />;
};

export default ItemsStatsCards;



import React from "react";
import StatsCard from "./StatsCard";

/**
 * StatsCardGrid Component
 *
 * A grid container for displaying multiple stat cards in a responsive layout.
 *
 * Props:
 * - cards: Array of card configuration objects
 *   Each card object should have:
 *   - id: unique identifier
 *   - title: string
 *   - value: number|string
 *   - icon: React component
 *   - color: string (optional)
 *   - bgColor: string (optional)
 *   - iconColor: string (optional)
 *   - subtitle: string (optional)
 *   - formatValue: function (optional)
 * - columns: Object with responsive column classes
 *   - mobile: string (default: "grid-cols-1")
 *   - tablet: string (default: "sm:grid-cols-2")
 *   - desktop: string (default: "lg:grid-cols-5")
 */
const StatsCardGrid = ({
  cards,
  columns = {
    mobile: "grid-cols-1",
    tablet: "sm:grid-cols-2",
    desktop: "lg:grid-cols-5",
  },
}) => {
  const gridClasses = `grid ${columns.mobile} ${columns.tablet} ${columns.desktop} gap-4`;

  return (
    <div className={gridClasses}>
      {cards.map((card) => (
        <StatsCard key={card.id} {...card} />
      ))}
    </div>
  );
};

export default StatsCardGrid;



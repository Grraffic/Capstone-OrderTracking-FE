import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useActivity } from "../../../context/ActivityContext";
import { useLocation } from "react-router-dom";
import api from "../../../services/api";

/**
 * useActivityFeed Hook
 *
 * Manages student activity feed data:
 * - Fetches activity history (cart additions, orders, claims)
 * - Handles tab switching (Activities, Orders, History)
 * - Manages filtering (Show All, Newest, Oldest)
 * - Handles pagination
 *
 * @returns {Object} Activity feed state and functions
 */
export const useActivityFeed = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { activities: allActivities, getActivities } = useActivity();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Tab state: 'activities', 'orders', 'history'
  // Initialize from location state if available (e.g. from notification click)
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || "activities");
  
  // Filter state: 'all', 'newest', 'oldest'
  const [filter, setFilter] = useState("newest");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user, activeTab, allActivities]);

  const fetchActivities = () => {
    try {
      setLoading(true);
      setError(null);

      // Get activities from ActivityContext
      const userActivities = getActivities();
      
      // Filter based on active tab
      let filtered = userActivities;
      if (activeTab === 'orders') {
        filtered = userActivities.filter(a => a.type === 'checkout' || a.type === 'order_placed');
      } else if (activeTab === 'history') {
        filtered = userActivities.filter(a => a.type === 'claimed' || a.type === 'order_released');
      }
      
      setActivities(filtered);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message || "Failed to load activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Sort based on filter
    if (filter === "newest") {
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else if (filter === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    return filtered;
  }, [activities, filter]);

  // Paginate activities
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    activities: paginatedActivities,
    loading,
    error,
    activeTab,
    filter,
    currentPage,
    totalPages,
    handleTabChange,
    handleFilterChange,
    nextPage,
    prevPage,
    canGoNext: currentPage < totalPages,
    canGoPrev: currentPage > 1,
    refetch: fetchActivities,
  };
};


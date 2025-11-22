import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab state: 'activities', 'orders', 'history'
  const [activeTab, setActiveTab] = useState("activities");
  
  // Filter state: 'all', 'newest', 'oldest'
  const [filter, setFilter] = useState("newest");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user, activeTab]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, we'll use mock data since the backend endpoint might not exist yet
      // In production, replace with actual API call based on activeTab
      // const response = await api.get(`/activities/${user.id}?type=${activeTab}`);
      
      // Mock activity data
      const mockActivities = generateMockActivities();
      
      setActivities(mockActivities);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message || "Failed to load activities");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock activities for demonstration
  const generateMockActivities = () => {
    const now = new Date();
    const activities = [
      {
        id: "1",
        type: "cart_add",
        description: "Added Basic Education Uniform (Senior High School) to cart",
        productName: "Basic Education Uniform",
        educationLevel: "Senior High School",
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: "2",
        type: "checkout",
        description: "Checked out order #ORD-2024-001",
        orderNumber: "ORD-2024-001",
        timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      },
      {
        id: "3",
        type: "claimed",
        description: "Claimed order #ORD-2024-002",
        orderNumber: "ORD-2024-002",
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
      {
        id: "4",
        type: "cart_add",
        description: "Added PE Uniform (College) to cart",
        productName: "PE Uniform",
        educationLevel: "College",
        timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
      },
    ];

    return activities;
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


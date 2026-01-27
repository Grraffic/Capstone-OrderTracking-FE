import { useState, useCallback, useMemo, useEffect } from "react";
import { useSocket } from "../../../context/SocketContext";

// API base URL - adjust based on your environment
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * useItems Hook
 *
 * Manages items state and operations including:
 * - Items data
 * - CRUD operations (Create, Read, Update, Delete)
 * - Search and filter functionality
 * - Modal state management
 * - Stock status calculations
 *
 * Usage:
 * const {
 *   items,
 *   filteredItems,
 *   searchTerm,
 *   setSearchTerm,
 *   selectedItem,
 *   modalState,
 *   openAddModal,
 *   openEditModal,
 *   openViewModal,
 *   openDeleteModal,
 *   closeModal,
 *   addItem,
 *   updateItem,
 *   deleteItem,
 * } = useItems();
 */
export const useItems = () => {
  // State for items (fetched from API)
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: null, // 'add', 'edit', 'view', 'delete'
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for filters
  const [educationLevelFilter, setEducationLevelFilter] =
    useState("All");
  const [itemTypeFilter, setItemTypeFilter] = useState("All Types");
  const [gradeLevelFilter, setGradeLevelFilter] = useState("All");

  // State for item adjustment modal
  const [adjustmentModalState, setAdjustmentModalState] = useState({
    isOpen: false,
  });
  const [adjustmentData, setAdjustmentData] = useState({
    adjustmentType: "Quantity Adjustment",
    educationLevel: "",
    itemCategory: "",
    description: "",
    materialType: "",
    itemType: "",
  });

  /**
   * Fetch items from API
   * @param {string} userEducationLevel - Optional user education level for eligibility filtering
   */
  const fetchItems = useCallback(async (userEducationLevel = null) => {
    try {
      setLoading(true);
      setError(null);

      // Build URL with optional userEducationLevel parameter for eligibility filtering
      let url = `${API_BASE_URL}/items`;
      if (userEducationLevel) {
        url += `?userEducationLevel=${encodeURIComponent(userEducationLevel)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform snake_case from backend to camelCase for frontend
        const transformedData = result.data.map((item) => ({
          id: item.id,
          name: item.name,
          educationLevel: item.education_level,
          category: item.category,
          itemType: item.item_type,
          description: item.description,
          descriptionText: item.description_text,
          material: item.material,
          size: item.size,
          stock: item.stock,
          price: item.price,
          image: item.image,
          physicalCount: item.physical_count,
          available: item.available,
          reorderPoint: item.reorder_point,
          note: item.note,
          status: item.status,
          isActive: item.is_active,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          // Include purchases and beginning_inventory for inventory tracking
          purchases: item.purchases || 0,
          beginning_inventory: item.beginning_inventory || 0,
          beginningInventory: item.beginning_inventory || 0, // Also include camelCase version
        }));
        setItems(transformedData);
      } else {
        throw new Error(result.message || "Failed to fetch items");
      }
    } catch (err) {
      console.error("Fetch items error:", err);
      setError(err.message);
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch items on component mount
   * Note: Components that need eligibility filtering should call fetchItems(userEducationLevel) explicitly
   * This auto-fetch is for components that don't need filtering (like property custodian views)
   */
  useEffect(() => {
    // Auto-fetch items on mount for components that don't need eligibility filtering
    // Components that need filtering (like student AllProducts) should call fetchItems(userEducationLevel) manually
    fetchItems();
  }, [fetchItems]);

  /**
   * Listen for real-time item updates via Socket.IO
   * This refreshes items when stock is reduced due to orders
   */
  const { on, off, isConnected } = useSocket();
  
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Listen for item updates (when stock is reduced from orders)
    const handleItemUpdate = (data) => {
      console.log("📡 Received item update via Socket.IO:", data);
      // Refresh items list to show updated stock
      fetchItems();
    };

    // Listen for order created events (which may trigger item updates)
    const handleOrderCreated = (data) => {
      console.log("📡 Received order created event:", data);
      // Refresh items list to show updated stock
      fetchItems();
    };

    on("item:updated", handleItemUpdate);
    on("order:created", handleOrderCreated);

    // Cleanup on unmount
    return () => {
      off("item:updated", handleItemUpdate);
      off("order:created", handleOrderCreated);
    };
  }, [isConnected, on, off, fetchItems]);

  /**
   * Calculate stock status based on quantity
   * NOTE: This is now handled by the backend automatically.
   * Status is calculated based on stock levels:
   * - "Out of Stock": stock = 0
   * - "Critical": stock 1-19
   * - "At Reorder Point": stock 20-49
   * - "Above Threshold": stock >= 50
   *
   * @param {number} stock - Stock quantity
   * @returns {string} - Status label
   */
  const getStockStatus = useCallback((stock) => {
    if (stock === 0) return "Out of Stock";
    if (stock >= 1 && stock < 20) return "Critical";
    if (stock >= 20 && stock < 50) return "At Reorder Point";
    return "Above Threshold";
  }, []);

  /**
   * Map tab labels to database education level values
   * This handles the mismatch between UI labels and stored values
   */
  const mapTabLabelToEducationLevel = useCallback((tabLabel) => {
    const mapping = {
      "All": "All Levels",
      Preschool: "Kindergarten", // UI says "Preschool" but DB stores "Kindergarten"
      Elementary: "Elementary",
      "Junior Highschool": "Junior High School", // UI has no space, DB has space
      "Senior Highschool": "Senior High School", // UI has no space, DB has space
      College: "College",
    };
    return mapping[tabLabel] || tabLabel; // Return mapped value or original if not found
  }, []);

  /**
   * Get grade level options based on selected education level tab
   */
  const getGradeLevelOptions = useCallback((educationLevel) => {
    const map = {
      "All": [
        "All",
        "Prekindergarten",
        "Kindergarten",
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
        "Grade 7",
        "Grade 8",
        "Grade 9",
        "Grade 10",
        "Grade 11",
        "Grade 12",
        "1st yr",
        "2nd yr",
        "3rd yr",
        "4th yr",
      ],
      Preschool: ["All", "Prekindergarten", "Kindergarten"],
      Elementary: ["All", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
      "Junior Highschool": ["All", "Grade 7", "Grade 8", "Grade 9", "Grade 10"],
      "Senior Highschool": ["All", "Grade 11", "Grade 12"],
      College: ["All", "1st yr", "2nd yr", "3rd yr", "4th yr"],
      Accessories: ["All"], // Accessories don't have grade levels
    };
    return map[educationLevel] || ["All"];
  }, []);

  /**
   * Filter items based on search term and filters
   */
  const filteredItems = useMemo(() => {
    let result = items;

    // Handle "Accessories" tab - filter by item type instead of education level
    if (educationLevelFilter === "Accessories") {
      result = result.filter((item) => item.itemType === "Accessories");
    } else if (educationLevelFilter !== "All") {
      // Apply education level filter - show both uniforms and accessories for this level
      // Map the filter value to the actual database value
      const mappedFilter = mapTabLabelToEducationLevel(educationLevelFilter);
      result = result.filter((item) => {
        // Check both educationLevel and education_level fields for compatibility
        // Use case-insensitive comparison to handle any case mismatches
        const itemEducationLevel = (item.educationLevel || item.education_level || "").trim();
        const normalizedFilter = (mappedFilter || "").trim();
        return itemEducationLevel.toLowerCase() === normalizedFilter.toLowerCase();
      });
    }
    // When "All" is selected, show all items including accessories

    // Apply item type filter - this will narrow down to uniforms or accessories if selected
    if (itemTypeFilter !== "All Types") {
      result = result.filter((item) => item.itemType === itemTypeFilter);
    }

    // Apply grade level filter (filter by category)
    if (gradeLevelFilter !== "All") {
      result = result.filter((item) => {
        // Map grade level filter to possible category values
        const categoryMap = {
          "1st yr": ["1st Year", "1st yr"],
          "2nd yr": ["2nd Year", "2nd yr"],
          "3rd yr": ["3rd Year", "3rd yr"],
          "4th yr": ["4th Year", "4th yr"],
        };
        
        // For college years, check if category matches (case-insensitive partial match)
        if (categoryMap[gradeLevelFilter]) {
          const categoryLower = item.category?.toLowerCase() || "";
          const yearNumber = gradeLevelFilter.split(" ")[0]; // "1st", "2nd", etc.
          return categoryMap[gradeLevelFilter].some(val => 
            item.category === val || 
            categoryLower.includes(yearNumber.toLowerCase())
          );
        }
        
        // For other grade levels, do exact match
        return item.category === gradeLevelFilter;
      });
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.category.toLowerCase().includes(lowerSearch) ||
          item.description.toLowerCase().includes(lowerSearch) ||
          item.itemType.toLowerCase().includes(lowerSearch) ||
          item.educationLevel.toLowerCase().includes(lowerSearch)
      );
    }

    return result;
  }, [
    items,
    searchTerm,
    educationLevelFilter,
    itemTypeFilter,
    gradeLevelFilter,
    mapTabLabelToEducationLevel,
  ]);

  /**
   * Open Add Item Modal
   */
  const openAddModal = useCallback(() => {
    setSelectedItem(null);
    setModalState({ isOpen: true, mode: "add" });
  }, []);

  /**
   * Open Edit Item Modal
   * @param {Object} item - Item to edit
   */
  const openEditModal = useCallback((item) => {
    setSelectedItem(item);
    setModalState({ isOpen: true, mode: "edit" });
  }, []);

  /**
   * Open View Item Modal
   * @param {Object} item - Item to view
   */
  const openViewModal = useCallback((item) => {
    setSelectedItem(item);
    setModalState({ isOpen: true, mode: "view" });
  }, []);

  /**
   * Open Delete Confirmation Modal
   * @param {Object} item - Item to delete
   */
  const openDeleteModal = useCallback((item) => {
    setSelectedItem(item);
    setModalState({ isOpen: true, mode: "delete" });
  }, []);

  /**
   * Close Modal
   */
  const closeModal = useCallback(() => {
    setModalState({ isOpen: false, mode: null });
    setSelectedItem(null);
  }, []);

  /**
   * Add new item
   * @param {Object} newItem - New item data
   */
  const addItem = useCallback(
    async (newItem) => {
      try {
        setLoading(true);
        setError(null);

        // Transform camelCase to snake_case for backend
        const transformedItem = {
          name: newItem.name,
          education_level: newItem.educationLevel,
          category: newItem.category,
          item_type: newItem.itemType,
          size:
            newItem.size && newItem.size.trim() !== ""
              ? newItem.size.trim()
              : "N/A",
          description: newItem.description,
          description_text: newItem.descriptionText,
          material: newItem.material,
          stock: Number(newItem.stock) || 0,
          price: Number(newItem.price) || 0,
          image: newItem.image || "/assets/image/card1.png",
          physical_count: Number(newItem.physicalCount) || 0,
          available: Number(newItem.available) || 0,
          reorder_point: Number(newItem.reorderPoint) || 0,
          note: newItem.note || "",
        };

        // Debug log to verify size is being sent
        console.log("Adding item with size:", transformedItem.size);

        const response = await fetch(`${API_BASE_URL}/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transformedItem),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add item");
        }

        const result = await response.json();

        // Log the response to see if duplicate was detected
        console.log("[addItem] Backend response:", {
          success: result.success,
          isExisting: result.isExisting,
          message: result.message,
          data: result.data ? {
            id: result.data.id,
            name: result.data.name,
            size: result.data.size,
            stock: result.data.stock,
            beginning_inventory: result.data.beginning_inventory,
            purchases: result.data.purchases
          } : null
        });

        if (result.success && result.data) {
          // Transform snake_case back to camelCase for frontend state
          const transformedData = {
            id: result.data.id,
            name: result.data.name,
            educationLevel: result.data.education_level,
            category: result.data.category,
            itemType: result.data.item_type,
            size: result.data.size || "N/A",
            description: result.data.description,
            descriptionText: result.data.description_text,
            material: result.data.material,
            stock: result.data.stock,
            price: result.data.price,
            image: result.data.image,
            physicalCount: result.data.physical_count,
            available: result.data.available,
            reorderPoint: result.data.reorder_point,
            note: result.data.note,
            status: result.data.status,
            isActive: result.data.is_active,
            createdAt: result.data.created_at,
            updatedAt: result.data.updated_at,
          };

          // If item already existed (duplicate), refresh the items list instead of adding
          // This ensures we get the updated purchases value
          if (result.isExisting) {
            console.log("[addItem] ✅ Item was existing - refreshing items list to get updated purchases");
            console.log("[addItem] Response data:", {
              id: result.data?.id,
              purchases: result.data?.purchases,
              stock: result.data?.stock,
              beginning_inventory: result.data?.beginning_inventory
            });
            // Refresh items to get updated data with purchases
            await fetchItems();
            console.log("[addItem] ✅ Items list refreshed after duplicate detection");
          } else {
            // Add the new item to the local state
            setItems((prev) => [transformedData, ...prev]);
          }

          // Show notification info if students were notified
          if (result.notificationInfo && result.notificationInfo.notified > 0) {
            console.log(
              `✅ ${result.notificationInfo.notified} students notified about new item availability`
            );
            // You can add a toast notification here if you have a toast system
          }

          closeModal();
        } else {
          throw new Error(result.message || "Failed to add item");
        }
      } catch (err) {
        console.error("Add item error:", err);
        setError(err.message);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setLoading(false);
      }
    },
    [closeModal]
  );

  /**
   * Update existing item
   * @param {Object} updatedItem - Updated item data
   */
  const updateItem = useCallback(
    async (updatedItem) => {
      try {
        setLoading(true);
        setError(null);

        // Transform camelCase to snake_case for backend
        const transformedItem = {
          name: updatedItem.name,
          education_level: updatedItem.educationLevel,
          category: updatedItem.category,
          item_type: updatedItem.itemType,
          size: updatedItem.size || "N/A",
          description: updatedItem.description,
          description_text: updatedItem.descriptionText,
          material: updatedItem.material,
          stock: Number(updatedItem.stock) || 0,
          price: Number(updatedItem.price) || 0,
          image: updatedItem.image,
          physical_count: Number(updatedItem.physicalCount) || 0,
          available: Number(updatedItem.available) || 0,
          reorder_point: Number(updatedItem.reorderPoint) || 0,
          note: updatedItem.note || "",
        };

        const response = await fetch(
          `${API_BASE_URL}/items/${updatedItem.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transformedItem),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update item");
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Transform snake_case back to camelCase for frontend state
          const transformedData = {
            id: result.data.id,
            name: result.data.name,
            educationLevel: result.data.education_level,
            category: result.data.category,
            itemType: result.data.item_type,
            size: result.data.size || "N/A",
            description: result.data.description,
            descriptionText: result.data.description_text,
            material: result.data.material,
            stock: result.data.stock,
            price: result.data.price,
            image: result.data.image,
            physicalCount: result.data.physical_count,
            available: result.data.available,
            reorderPoint: result.data.reorder_point,
            note: result.data.note,
            status: result.data.status,
            isActive: result.data.is_active,
            createdAt: result.data.created_at,
            updatedAt: result.data.updated_at,
          };

          // Update the item in local state
          setItems((prev) =>
            prev.map((item) =>
              item.id === updatedItem.id ? transformedData : item
            )
          );
          closeModal();
        } else {
          throw new Error(result.message || "Failed to update item");
        }
      } catch (err) {
        console.error("Update item error:", err);
        setError(err.message);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setLoading(false);
      }
    },
    [closeModal]
  );

  /**
   * Delete item
   * @param {string} itemId - ID of item to delete
   */
  const deleteItem = useCallback(
    async (itemId) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete item");
        }

        const result = await response.json();

        if (result.success) {
          // Remove the item from local state
          setItems((prev) => prev.filter((item) => item.id !== itemId));
          closeModal();
        } else {
          throw new Error(result.message || "Failed to delete item");
        }
      } catch (err) {
        console.error("Delete item error:", err);
        setError(err.message);
        throw err; // Re-throw to allow caller to handle
      } finally {
        setLoading(false);
      }
    },
    [closeModal]
  );

  // Calculate paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredItems.length / itemsPerPage);
  }, [filteredItems.length, itemsPerPage]);

  // Handle page change
  const goToPage = useCallback(
    (page) => {
      const pageNum = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNum);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  /**
   * Open Item Adjustment Modal
   * @param {Object} item - Item to adjust
   */
  const openAdjustmentModal = useCallback((item) => {
    setSelectedItem(item);
    setAdjustmentModalState({ isOpen: true });
    setAdjustmentData({
      adjustmentType: "Quantity Adjustment",
      educationLevel: item.educationLevel || "",
      itemCategory: item.category || "",
      description: item.description || "",
      materialType: item.material || "",
      itemType: item.itemType || "",
    });
  }, []);

  /**
   * Close Item Adjustment Modal
   */
  const closeAdjustmentModal = useCallback(() => {
    setAdjustmentModalState({ isOpen: false });
    setSelectedItem(null);
    setAdjustmentData({
      adjustmentType: "Quantity Adjustment",
      educationLevel: "",
      itemCategory: "",
      description: "",
      materialType: "",
      itemType: "",
    });
  }, []);

  return {
    items,
    filteredItems,
    paginatedItems,
    searchTerm,
    setSearchTerm,
    selectedItem,
    modalState,
    openAddModal,
    gradeLevelFilter,
    setGradeLevelFilter,
    getGradeLevelOptions,
    openEditModal,
    openViewModal,
    openDeleteModal,
    closeModal,
    addItem,
    updateItem,
    deleteItem,
    getStockStatus,
    // API state
    loading,
    error,
    fetchItems,
    // Pagination
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    // Filters
    educationLevelFilter,
    setEducationLevelFilter,
    mapTabLabelToEducationLevel,
    itemTypeFilter,
    setItemTypeFilter,
    // Item Adjustment Modal
    adjustmentModalState,
    adjustmentData,
    setAdjustmentData,
    openAdjustmentModal,
    closeAdjustmentModal,
  };
};

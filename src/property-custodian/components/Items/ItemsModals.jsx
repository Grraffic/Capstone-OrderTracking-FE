import {
  X,
  AlertTriangle,
  Pencil,
  Plus,
  Users,
  ChevronLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignRight,
  Palette,
  RemoveFormatting,
  Trash2,
} from "lucide-react";
import { useItemsModalForm } from "../../hooks";
import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { EDUCATION_LEVELS, ITEM_TYPES } from "../../constants/inventoryOptions";
import { orderAPI } from "../../../services/api";
import { HexColorPicker, HexColorInput } from "react-colorful";

/**
 * ItemsModals Component
 *
 * Handles all modal dialogs for items management:
 * - Add Item Modal (form to add new item with 2-column layout)
 * - Edit Item Modal (form to edit existing item)
 * - View Item Modal (read-only view of item details)
 * - Delete Confirmation Modal (confirmation dialog)
 *
 * Props:
 * - modalState: Object with { isOpen, mode }
 * - selectedItem: Currently selected item (for edit/view/delete)
 * - onClose: Function to close modal
 * - onAdd: Function to add new item
 * - onUpdate: Function to update item
 * - onDelete: Function to delete item
 */
const ItemsModals = ({
  modalState,
  selectedItem,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [focusedSection, setFocusedSection] = useState(null);
  const [preOrderCount, setPreOrderCount] = useState(0);
  const [checkingPreOrders, setCheckingPreOrders] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#E68B00");
  // Local-only UI state for variants
  const [variants, setVariants] = useState([
    {
      name: "",
      values: ["", ""],
    },
  ]);
  const [variantPrices, setVariantPrices] = useState(["", ""]);
  const [variantStocks, setVariantStocks] = useState(["", ""]); // Stock per variant
  const [selectedVariantIndices, setSelectedVariantIndices] = useState([0]); // Multiple selection
  // State for accessories (no sizes)
  const [accessoryStocks, setAccessoryStocks] = useState([""]);
  const [accessoryPrices, setAccessoryPrices] = useState([""]);
  const [selectedAccessoryIndices, setSelectedAccessoryIndices] = useState([0]);
  const editorRef = useRef(null);
  const isEditorInitialized = useRef(false);
  const colorPickerRef = useRef(null);

  const {
    formData,
    errors,
    imagePreview,
    isDragging,
    handleInputChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleBrowseClick,
    handleSubmit: handleFormSubmit,
  } = useItemsModalForm(
    modalState.mode === "edit" ? selectedItem : null,
    (data) => {
      if (modalState.mode === "add") {
        onAdd(data);
      } else if (modalState.mode === "edit") {
        onUpdate(data);
      }
    },
    onClose,
    modalState
  );

  // Grade level options override (use existing values, custom labels)
  const gradeLevelOptions = useMemo(
    () =>
      EDUCATION_LEVELS.filter(
        (level) => level.value !== "All Education Levels"
      ).map((level) => {
        if (level.value === "Kindergarten") {
          return { ...level, label: "Preschool" };
        }
        if (level.value === "Junior High School") {
          return { ...level, label: "Junior Highschool" };
        }
        if (level.value === "Senior High School") {
          return { ...level, label: "Senior Highschool" };
        }
        return level;
      }),
    []
  );

  // Conditional logic for item type
  const isAccessories = useMemo(
    () => formData.itemType === "Accessories",
    [formData.itemType]
  );
  const isUniforms = useMemo(
    () => formData.itemType === "Uniforms",
    [formData.itemType]
  );

  // Grade level category options mapping
  const gradeLevelCategoryOptions = useMemo(() => {
    const map = {
      "All Education Levels": [
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
        "College",
      ],
      Kindergarten: ["Prekindergarten", "Kindergarten"],
      Elementary: [
        "Grade 1",
        "Grade 2",
        "Grade 3",
        "Grade 4",
        "Grade 5",
        "Grade 6",
      ],
      "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
      "Senior High School": ["Grade 11", "Grade 12"],
      College: ["College"],
    };

    const key = formData.educationLevel || "All Education Levels";
    return map[key] || [];
  }, [formData.educationLevel]);

  // Check for pre-orders when adding a new item with stock > 0
  useEffect(() => {
    const checkPreOrders = async () => {
      // Only check when adding new items with stock > 0
      if (
        modalState.mode !== "add" ||
        !formData.name ||
        !formData.educationLevel ||
        parseInt(formData.stock || 0) <= 0
      ) {
        setPreOrderCount(0);
        return;
      }

      try {
        setCheckingPreOrders(true);

        // Query orders for pre-orders matching this item
        const response = await orderAPI.getOrders({
          order_type: "pre-order",
          status: "pending",
        });

        if (response.data.success) {
          // Count students who have pre-ordered this specific item
          const matchingOrders = response.data.data.filter((order) => {
            return order.items.some((item) => {
              const nameMatch =
                item.name.toLowerCase() === formData.name.toLowerCase();
              const levelMatch =
                item.education_level === formData.educationLevel;
              const sizeMatch = !formData.size || item.size === formData.size;
              return nameMatch && levelMatch && sizeMatch;
            });
          });

          setPreOrderCount(matchingOrders.length);
        }
      } catch (error) {
        console.error("Failed to check pre-orders:", error);
        setPreOrderCount(0);
      } finally {
        setCheckingPreOrders(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkPreOrders, 500);
    return () => clearTimeout(timeoutId);
  }, [
    modalState.mode,
    formData.name,
    formData.educationLevel,
    formData.size,
    formData.stock,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Handle Accessories (no sizes)
    if (
      isAccessories &&
      modalState.mode === "add" &&
      selectedAccessoryIndices.length > 0
    ) {
      // Calculate total stock from all accessory entries
      const totalStock = selectedAccessoryIndices.reduce((sum, index) => {
        return sum + (Number(accessoryStocks[index]) || 0);
      }, 0);

      // Use the first selected entry's price, or formData.price as fallback
      const firstSelectedIndex = selectedAccessoryIndices[0];
      const itemPrice =
        accessoryPrices[firstSelectedIndex] || formData.price || 0;

      // Store all accessory entries in note field as JSON (no size field)
      const accessoryEntries = selectedAccessoryIndices.map((index) => {
        return {
          stock: Number(accessoryStocks[index]) || 0,
          price: Number(accessoryPrices[index]) || Number(itemPrice) || 0,
        };
      });

      // Create item without size field
      const itemToAdd = {
        ...formData,
        // Don't include size field for accessories
        stock: totalStock,
        price: Number(itemPrice) || 0,
        note: JSON.stringify({
          accessoryEntries: accessoryEntries,
          _type: "accessoryEntries", // Marker to identify this as accessory entry data
        }),
      };

      // Remove size from the item data
      delete itemToAdd.size;

      // Add the item
      try {
        onAdd(itemToAdd);
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        console.error("Error adding item:", error);
      }
    }
    // Handle Uniforms with sizes (existing logic)
    else if (
      isUniforms &&
      modalState.mode === "add" &&
      selectedVariantIndices.length > 0
    ) {
      // Calculate total stock from all selected variants
      const totalStock = selectedVariantIndices.reduce((sum, index) => {
        return sum + (Number(variantStocks[index]) || 0);
      }, 0);

      // Use the first selected variant's price, or formData.price as fallback
      const firstSelectedIndex = selectedVariantIndices[0];
      const itemPrice =
        variantPrices[firstSelectedIndex] || formData.price || 0;

      // The size field is already set by the checkbox handler with comma-separated values
      // But ensure it's properly formatted
      const sizeValues = selectedVariantIndices
        .map((index) => {
          const val = variants[0].values[index];
          return (
            val || (index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : "")
          );
        })
        .filter(Boolean);
      const sizeString = sizeValues.join(", ");

      // Store per-size stock and price information in note field as JSON
      const sizeVariations = selectedVariantIndices.map((index) => {
        const sizeValue =
          variants[0].values[index] ||
          (index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : "");
        const variantStock = Number(variantStocks[index]) || 0;
        return {
          size: sizeValue.trim(),
          stock: variantStock,
          price: Number(variantPrices[index]) || Number(itemPrice) || 0,
          // Set beginning_inventory equal to stock for each variant
          // This ensures each size has its own beginning inventory, not the sum
          beginning_inventory: variantStock,
        };
      });

      // Create a single item with all selected sizes
      const itemToAdd = {
        ...formData,
        size: sizeString || formData.size || "N/A",
        stock: totalStock, // Total stock for backward compatibility
        price: Number(itemPrice) || 0, // Default price for backward compatibility
        note: JSON.stringify({
          sizeVariations: sizeVariations,
          _type: "sizeVariations", // Marker to identify this as size variation data
        }),
      };

      // Add the single item
      try {
        onAdd(itemToAdd);
        // Close modal after a short delay to allow item to be added
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        console.error("Error adding item:", error);
        // Don't close modal on error so user can see the issue
      }
    } else {
      // For edit mode or single item, use normal submission
      handleFormSubmit(e);
    }
  };

  // Initialize editor content only once when modal opens for add/edit modes
  useEffect(() => {
    // Small delay to ensure the editor ref is available after render
    const timeoutId = setTimeout(() => {
      if (
        editorRef.current &&
        !isEditorInitialized.current &&
        modalState.isOpen &&
        (modalState.mode === "add" || modalState.mode === "edit")
      ) {
        const initialContent =
          formData.descriptionText ||
          "Complete Set<br/>This uniform is for Senior High School students only.";
        editorRef.current.innerHTML = initialContent;
        isEditorInitialized.current = true;
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [formData.descriptionText, modalState.isOpen, modalState.mode]);

  // Reset initialization flag when modal closes or mode changes
  useEffect(() => {
    if (!modalState.isOpen) {
      isEditorInitialized.current = false;
    }
  }, [modalState.isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalState.isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Lock body scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";

      return () => {
        // Restore body scroll
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [modalState.isOpen]);

  // Initialize variant prices and stocks when editing an item
  useEffect(() => {
    if (
      modalState.isOpen &&
      modalState.mode === "edit" &&
      selectedItem
    ) {
      // Try to parse sizeVariations from note field
      let sizeVariations = null;
      if (selectedItem.note) {
        try {
          const parsedNote = JSON.parse(selectedItem.note);
          if (
            parsedNote?._type === "sizeVariations" &&
            Array.isArray(parsedNote.sizeVariations)
          ) {
            sizeVariations = parsedNote.sizeVariations;
          }
        } catch (e) {
          // Not JSON or parse error, continue with fallback
        }
      }

      if (sizeVariations && sizeVariations.length > 0) {
        // Initialize from sizeVariations data
        const maxLength = Math.max(sizeVariations.length, 2);
        const initialPrices = [];
        const initialStocks = [];
        const initialValues = [];
        const selectedIndices = [];

        sizeVariations.forEach((variant, index) => {
          initialPrices[index] = String(variant.price || selectedItem.price || "");
          initialStocks[index] = String(variant.stock || "");
          initialValues[index] = variant.size || "";
          selectedIndices.push(index);
        });

        // Fill remaining slots with empty strings
        while (initialPrices.length < maxLength) {
          initialPrices.push("");
          initialStocks.push("");
          initialValues.push("");
        }

        setVariantPrices(initialPrices);
        setVariantStocks(initialStocks);
        setSelectedVariantIndices(selectedIndices);

        // Update variants with the size values
        setVariants([
          {
            name: "",
            values: initialValues.length > 0 ? initialValues : ["", ""],
          },
        ]);
      } else {
        // Fallback: Initialize first variant price with the item's price
        setVariantPrices((prev) => {
          if (prev[0] === "" && selectedItem.price) {
            return [String(selectedItem.price), prev[1] || ""];
          }
          return prev;
        });
        // Initialize selected indices based on size field
        if (selectedItem.size && selectedItem.size !== "N/A") {
          const sizes = selectedItem.size.split(",").map((s) => s.trim());
          const selectedIndices = variants[0].values
            .map((val, idx) => {
              const normalizedVal =
                val || (idx === 0 ? "Small (S)" : idx === 1 ? "Medium (M)" : "");
              return sizes.some(
                (size) =>
                  normalizedVal.includes(size) || size.includes(normalizedVal)
              )
                ? idx
                : null;
            })
            .filter((idx) => idx !== null);
          setSelectedVariantIndices(
            selectedIndices.length > 0 ? selectedIndices : [0]
          );
        } else {
          setSelectedVariantIndices([0]);
        }
      }
    } else if (modalState.isOpen && modalState.mode === "add") {
      // Reset variant prices and stocks for add mode
      setVariantPrices(["", ""]);
      setVariantStocks(["", ""]);
      setSelectedVariantIndices([0]);
      setVariants([
        {
          name: "",
          values: ["", ""],
        },
      ]);
    }
  }, [
    modalState.isOpen,
    modalState.mode,
    selectedItem?.price,
    selectedItem?.size,
    selectedItem?.note,
    // Note: variants is intentionally not in dependencies to avoid loops
    // We update variants inside this effect when needed
  ]);

  // Initialize accessory entries when editing an Accessories item
  useEffect(() => {
    if (
      modalState.isOpen &&
      modalState.mode === "edit" &&
      isAccessories &&
      selectedItem?.note
    ) {
      try {
        const noteData = JSON.parse(selectedItem.note);
        if (
          noteData._type === "accessoryEntries" &&
          noteData.accessoryEntries
        ) {
          const entries = noteData.accessoryEntries;
          setAccessoryStocks(entries.map((e) => String(e.stock || "")));
          setAccessoryPrices(entries.map((e) => String(e.price || "")));
          setSelectedAccessoryIndices(
            entries.map((_, idx) => idx).length > 0
              ? entries.map((_, idx) => idx)
              : [0]
          );
        }
      } catch (error) {
        console.error("Error parsing accessory entries:", error);
        // Fallback: initialize with item's stock and price
        setAccessoryStocks([String(selectedItem.stock || "")]);
        setAccessoryPrices([String(selectedItem.price || "")]);
        setSelectedAccessoryIndices([0]);
      }
    } else if (
      modalState.isOpen &&
      modalState.mode === "add" &&
      isAccessories
    ) {
      // Reset accessory entries for add mode
      setAccessoryStocks([""]);
      setAccessoryPrices([""]);
      setSelectedAccessoryIndices([0]);
    }
  }, [
    modalState.isOpen,
    modalState.mode,
    isAccessories,
    selectedItem?.note,
    selectedItem?.stock,
    selectedItem?.price,
  ]);

  // Reset state when item type changes
  useEffect(() => {
    if (modalState.isOpen) {
      if (isAccessories) {
        // Reset variant-related state when switching to Accessories
        setVariantPrices(["", ""]);
        setVariantStocks(["", ""]);
        setSelectedVariantIndices([0]);
        // Initialize accessory state if not already set
        if (accessoryStocks.length === 0) {
          setAccessoryStocks([""]);
          setAccessoryPrices([""]);
          setSelectedAccessoryIndices([0]);
        }
      } else if (isUniforms) {
        // Reset accessory-related state when switching to Uniforms
        setAccessoryStocks([""]);
        setAccessoryPrices([""]);
        setSelectedAccessoryIndices([0]);
        // Initialize variant state if not already set
        if (variantPrices.length === 0) {
          setVariantPrices(["", ""]);
          setVariantStocks(["", ""]);
          setSelectedVariantIndices([0]);
        }
      }
    }
  }, [isAccessories, isUniforms, modalState.isOpen]);

  if (!modalState.isOpen) return null;

  // Delete Confirmation Modal
  if (modalState.mode === "delete") {
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => {
          // Close modal when clicking backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Item
              </h3>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{selectedItem?.name}</span>
            {selectedItem?.description && (
              <span> ({selectedItem.description})</span>
            )}
            ? This will permanently remove the item from your inventory.
          </p>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(selectedItem.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Item
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // View Item Modal
  if (modalState.mode === "view") {
    return createPortal(
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
        onClick={(e) => {
          // Close modal when clicking backdrop
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-[#0C2340]">
              Item Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image */}
              <div className="flex-shrink-0">
                <img
                  src={selectedItem?.image}
                  alt={selectedItem?.name}
                  className="w-48 h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/192";
                  }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Education Level
                    </label>
                    <p className="text-gray-900">
                      {selectedItem?.educationLevel}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Category
                    </label>
                    <p className="text-gray-900">{selectedItem?.category}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Size
                    </label>
                    <p className="text-gray-900">
                      {selectedItem?.description || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p className="text-gray-900">
                      {selectedItem?.material || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Item Type
                    </label>
                    <p className="text-gray-900">{selectedItem?.itemType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Stock
                    </label>
                    <p className="text-gray-900">{selectedItem?.stock} units</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Price
                  </label>
                  <p className="text-2xl font-bold text-[#e68b00]">
                    ₱{selectedItem?.price.toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedItem?.status === "Above Threshold"
                        ? "bg-green-100 text-green-800"
                        : selectedItem?.status === "At Reorder Point"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedItem?.status === "Critical"
                        ? "bg-orange-100 text-orange-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedItem?.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0C2340] text-white rounded-lg hover:bg-[#0a1d33] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Helpers for Variants UI (local-only, not persisted yet)
  const handleVariantNameChange = (index, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  };

  const handleVariantValueChange = (variantIndex, valueIndex, value) => {
    setVariants((prev) => {
      const next = [...prev];
      const values = [...next[variantIndex].values];
      values[valueIndex] = value;
      next[variantIndex] = { ...next[variantIndex], values };
      return next;
    });

    // Keep prices array length in sync with values
    setVariantPrices((prev) => {
      const next = [...prev];
      while (next.length < next.length) {
        next.push("");
      }
      return next;
    });
  };

  const handleAddVariantValue = (variantIndex) => {
    setVariants((prev) => {
      const next = [...prev];
      const values = [...next[variantIndex].values, ""];
      next[variantIndex] = { ...next[variantIndex], values };
      return next;
    });

    // Preserve existing prices and stocks when adding new values
    // Use functional updates to ensure we're working with the latest state
    setVariantPrices((prev) => {
      const newPrices = [...prev];
      // Add empty string for the new value
      newPrices.push("");
      return newPrices;
    });

    setVariantStocks((prev) => {
      const newStocks = [...prev];
      // Add empty string for the new value
      newStocks.push("");
      return newStocks;
    });
  };

  const handleRemoveVariantValue = (variantIndex, valueIndex) => {
    // Don't allow removing if there's only one value
    if (variants[variantIndex].values.length <= 1) {
      return;
    }

    setVariants((prev) => {
      const next = [...prev];
      const values = next[variantIndex].values.filter(
        (_, idx) => idx !== valueIndex
      );
      next[variantIndex] = { ...next[variantIndex], values };
      return next;
    });

    // Remove corresponding price and stock
    setVariantPrices((prev) => {
      const newPrices = prev.filter((_, idx) => idx !== valueIndex);
      return newPrices;
    });

    setVariantStocks((prev) => {
      const newStocks = prev.filter((_, idx) => idx !== valueIndex);
      return newStocks;
    });

    // Update selected indices if the removed value was selected
    setSelectedVariantIndices((prev) => {
      const newIndices = prev
        .filter((idx) => idx !== valueIndex)
        .map((idx) => (idx > valueIndex ? idx - 1 : idx));
      return newIndices.length > 0 ? newIndices : [0];
    });
  };

  // Handler functions for accessories (no sizes)
  const handleAddAccessoryEntry = () => {
    setAccessoryStocks((prev) => [...prev, ""]);
    setAccessoryPrices((prev) => [...prev, ""]);
    setSelectedAccessoryIndices((prev) => [...prev, prev.length]);
  };

  const handleRemoveAccessoryEntry = (index) => {
    // Don't allow removing if there's only one entry
    if (accessoryStocks.length <= 1) {
      return;
    }

    setAccessoryStocks((prev) => prev.filter((_, idx) => idx !== index));
    setAccessoryPrices((prev) => prev.filter((_, idx) => idx !== index));
    setSelectedAccessoryIndices((prev) => {
      const newIndices = prev
        .filter((idx) => idx !== index)
        .map((idx) => (idx > index ? idx - 1 : idx));
      return newIndices.length > 0 ? newIndices : [0];
    });
  };

  // Rich text editor helpers for Description / Note
  const syncEditorToForm = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    handleInputChange({
      target: { name: "descriptionText", value: html },
    });
  };

  const handleRichTextInput = () => {
    syncEditorToForm();
  };

  const applyEditorCommand = (command, value = null) => {
    if (!editorRef.current || typeof document === "undefined") return;

    // Save the current selection
    const selection = window.getSelection();
    const range =
      selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    // Ensure editor has focus
    editorRef.current.focus();

    // Restore selection if it was lost
    if (range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    try {
      document.execCommand(command, false, value);
    } catch {
      // Silently ignore if execCommand is not available
    }
    syncEditorToForm();
  };

  // Add/Edit Item Modal
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pre-Order Notification Banner - Only for Add mode */}
        {modalState.mode === "add" &&
          preOrderCount > 0 &&
          parseInt(formData.stock || 0) > 0 && (
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Users size={18} />
                <p className="text-sm font-medium">
                  {checkingPreOrders ? (
                    "Checking for pre-orders..."
                  ) : (
                    <>
                      {preOrderCount}{" "}
                      {preOrderCount === 1 ? "student" : "students"} will be
                      notified when you add this item
                    </>
                  )}
                </p>
              </div>
            </div>
          )}

        {/* Content - Single Column Centered Card */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto bg-gray-50 px-6 pt-4 pb-8"
        >
          {/* Breadcrumb (outside white card) */}
          <div className="max-w-2xl mx-auto mb-4">
            <div className="text-xs text-gray-500">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 hover:text-gray-700"
              >
                <ChevronLeft size={16} />
                <span className="font-medium">Items</span>
              </button>
              <p className="mt-1 font-medium">Item Details</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {/* Header: Title, Size Guide, and Centered Image Upload */}
            <div className="space-y-4">
              {/* Item name + item type with size info on the right */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-[#0C2340] truncate">
                    {formData.name || "Item Name"}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-orange-500">
                    {formData.itemType || "Item Type"}
                  </p>
                </div>

                <button
                  type="button"
                  className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                  aria-label="Size information"
                  title="Size information"
                >
                  <span className="text-[11px] font-semibold text-blue-600">
                    i
                  </span>
                </button>
              </div>

              {/* Centered upload image under item name/type */}
              <div className="flex justify-center">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                  className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition bg-gray-50 overflow-hidden ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-dashed border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-2">
                      <Plus size={20} className="mx-auto text-gray-400 mb-1" />
                      <p className="text-[11px] leading-tight text-gray-600">
                        Upload image
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {errors.image && (
                <p className="mt-1 text-[11px] text-red-500 text-center">
                  {errors.image}
                </p>
              )}
            </div>

            {/* Item Details Form */}
            <div
              className={`space-y-5 rounded-xl border border-gray-100 bg-gray-50/60 p-5 transition-colors duration-200 ${
                focusedSection === "Item Details" ? "ring-1 ring-blue-200" : ""
              }`}
              onFocus={() => setFocusedSection("Item Details")}
              onBlur={() => setFocusedSection(null)}
            >
              <div className="space-y-4">
                {/* Row: Grade Level & Grade Level Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Grade Level
                    </label>
                    <select
                      name="educationLevel"
                      value={formData.educationLevel}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Grade Level</option>
                      {gradeLevelOptions.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    {errors.educationLevel && (
                      <p className="text-red-500 text-xs">
                        {errors.educationLevel}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Grade Level Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Grade Level Category</option>
                      {gradeLevelCategoryOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs">{errors.category}</p>
                    )}
                  </div>
                </div>

                {/* Row: Item Name & Item Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Kinder Dress"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Item Type
                    </label>
                    <select
                      name="itemType"
                      value={formData.itemType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Item Type</option>
                      {ITEM_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.itemType && (
                      <p className="text-red-500 text-xs">{errors.itemType}</p>
                    )}
                  </div>
                </div>

                {/* Description / Note */}
                <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Description / Note
                    </label>
                    <div className="rounded-xl border border-gray-300 bg-white overflow-visible">
                      {/* Rich text toolbar (Google Docs–style basic controls) */}
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 text-gray-600 relative">
                        {/* Remove Formatting */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyEditorCommand("removeFormat")}
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Remove formatting"
                        >
                          <RemoveFormatting size={18} />
                        </button>
                        {/* Bold */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyEditorCommand("bold")}
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Bold"
                        >
                          <Bold size={18} />
                        </button>
                        {/* Italic */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyEditorCommand("italic")}
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Italic"
                        >
                          <Italic size={18} />
                        </button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        {/* Numbered List */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            applyEditorCommand("insertOrderedList")
                          }
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Numbered list"
                        >
                          <ListOrdered size={18} />
                        </button>
                        {/* Bulleted List */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() =>
                            applyEditorCommand("insertUnorderedList")
                          }
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Bulleted list"
                        >
                          <List size={18} />
                        </button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        {/* Align Left */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyEditorCommand("justifyLeft")}
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Align left"
                        >
                          <AlignLeft size={18} />
                        </button>
                        {/* Align Right */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyEditorCommand("justifyRight")}
                          className="p-1.5 hover:bg-gray-100 rounded transition"
                          title="Align right"
                        >
                          <AlignRight size={18} />
                        </button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        {/* Text Color */}
                        <div className="relative" ref={colorPickerRef}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="p-1.5 hover:bg-gray-100 rounded transition flex flex-col items-center"
                            title="Text color"
                          >
                            <Palette size={18} />
                            <div
                              className="w-4 h-1 rounded-sm mt-0.5"
                              style={{ backgroundColor: selectedColor }}
                            />
                          </button>
                        </div>
                      </div>
                      {/* Color Picker - Positioned outside overflow containers */}
                      {showColorPicker && (
                        <div
                          className="fixed inset-0 z-[9999]"
                          onClick={() => setShowColorPicker(false)}
                        >
                          <div
                            className="absolute bg-white border border-gray-200 rounded-lg shadow-2xl p-3"
                            style={{
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <div className="text-sm font-medium text-gray-700 mb-2">
                              Select Color
                            </div>
                            <HexColorPicker
                              color={selectedColor}
                              onChange={setSelectedColor}
                              className="!w-[200px] !h-[160px]"
                            />
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Hex:
                              </span>
                              <HexColorInput
                                color={selectedColor}
                                onChange={setSelectedColor}
                                prefixed
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <div
                                className="w-7 h-7 rounded border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: selectedColor }}
                              />
                            </div>
                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setShowColorPicker(false)}
                                className="px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded transition border border-gray-300"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  applyEditorCommand(
                                    "foreColor",
                                    selectedColor
                                  );
                                  setShowColorPicker(false);
                                }}
                                className="px-4 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded transition"
                              >
                                OK
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div
                        ref={editorRef}
                        className="w-full px-3 py-2.5 text-sm min-h-[96px] outline-none rich-text-editor"
                        contentEditable
                        onInput={handleRichTextInput}
                        suppressContentEditableWarning={true}
                      />
                    </div>
                  </div>
                </div>
                {/* Variants - Only show for Uniforms */}
                {isUniforms && (
                  <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Variants
                    </p>

                    {/* Top card: Option Name / Option Value */}
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 space-y-3">
                      {variants.slice(0, 1).map((variant, vIndex) => (
                        <div
                          key={vIndex}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">
                              Option Name
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) =>
                                handleVariantNameChange(vIndex, e.target.value)
                              }
                              placeholder="Size Choices"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-600">
                              Option Value
                            </label>
                            <div className="space-y-2">
                              {variant.values.map((value, valIndex) => (
                                <div
                                  key={valIndex}
                                  className="flex items-center gap-2"
                                >
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) =>
                                      handleVariantValueChange(
                                        vIndex,
                                        valIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder={
                                      valIndex === 0
                                        ? "Small (S)"
                                        : "Medium (M)"
                                    }
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                  {variant.values.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveVariantValue(
                                          vIndex,
                                          valIndex
                                        )
                                      }
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Remove this option value"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddVariantValue(vIndex)}
                              className="mt-1 text-xs font-medium text-orange-500 hover:text-orange-600"
                            >
                              + Add another option value
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom card: Option Value / Stock / Unit Price */}
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                        <span>Option Value</span>
                        <span>Stock</span>
                        <span>Unit Price</span>
                      </div>
                      <div className="px-4 py-3 space-y-2 text-sm">
                        {variants[0].values.map((value, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedVariantIndices.includes(index)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    // Add to selected indices
                                    setSelectedVariantIndices((prev) => {
                                      const newIndices = [...prev, index];
                                      // Update size field with selected sizes
                                      const updatedSizes = newIndices
                                        .map((idx) => {
                                          const val = variants[0].values[idx];
                                          return (
                                            val ||
                                            (idx === 0
                                              ? "Small (S)"
                                              : idx === 1
                                              ? "Medium (M)"
                                              : "")
                                          );
                                        })
                                        .filter(Boolean)
                                        .join(", ");
                                      if (updatedSizes) {
                                        handleInputChange({
                                          target: {
                                            name: "size",
                                            value: updatedSizes,
                                          },
                                        });
                                      }
                                      // Sync this variant's price to the item's price field if it's the first selected
                                      if (
                                        variantPrices[index] &&
                                        prev.length === 0
                                      ) {
                                        handleInputChange({
                                          target: {
                                            name: "price",
                                            value: variantPrices[index],
                                          },
                                        });
                                      }
                                      return newIndices;
                                    });
                                  } else {
                                    // Remove from selected indices
                                    setSelectedVariantIndices((prev) => {
                                      const newIndices = prev.filter(
                                        (i) => i !== index
                                      );
                                      // Update size field
                                      const updatedSizes = newIndices
                                        .map((idx) => {
                                          const val = variants[0].values[idx];
                                          return (
                                            val ||
                                            (idx === 0
                                              ? "Small (S)"
                                              : idx === 1
                                              ? "Medium (M)"
                                              : "")
                                          );
                                        })
                                        .filter(Boolean)
                                        .join(", ");
                                      handleInputChange({
                                        target: {
                                          name: "size",
                                          value: updatedSizes || "N/A",
                                        },
                                      });
                                      return newIndices;
                                    });
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-gray-800">
                                {value ||
                                  (index === 0 ? "Small (S)" : "Medium (M)")}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={variantStocks[index] ?? ""}
                              onChange={(e) => {
                                const next = [...variantStocks];
                                next[index] = e.target.value;
                                setVariantStocks(next);
                              }}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={variantPrices[index] ?? ""}
                              onChange={(e) => {
                                const next = [...variantPrices];
                                next[index] = e.target.value;
                                setVariantPrices(next);
                                // If this is one of the selected variants and it's the first one, sync its price
                                if (
                                  selectedVariantIndices.includes(index) &&
                                  selectedVariantIndices[0] === index &&
                                  e.target.value
                                ) {
                                  handleInputChange({
                                    target: {
                                      name: "price",
                                      value: e.target.value,
                                    },
                                  });
                                }
                              }}
                              placeholder="Php 0.00"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {/* Accessories Stock & Price Entries - Only show for Accessories */}
                {isAccessories && (
                  <div className="space-y-4 pt-2 border-t border-dashed border-gray-200">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Stock & Price Entries
                      </p>
                      <span className="text-xs text-gray-400 italic">
                        (No sizes required)
                      </span>
                    </div>

                    {/* Stock & Price Entries Card */}
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                        <span>Entry</span>
                        <span>Stock</span>
                        <span>Unit Price</span>
                      </div>
                      <div className="px-4 py-3 space-y-2 text-sm">
                        {accessoryStocks.map((_, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-3 gap-4 items-center"
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAccessoryIndices.includes(
                                  index
                                )}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAccessoryIndices((prev) => {
                                      const newIndices = [...prev, index];
                                      return newIndices;
                                    });
                                    // Sync first entry's price to formData.price
                                    if (
                                      accessoryPrices[index] &&
                                      selectedAccessoryIndices.length === 0
                                    ) {
                                      handleInputChange({
                                        target: {
                                          name: "price",
                                          value: accessoryPrices[index],
                                        },
                                      });
                                    }
                                  } else {
                                    setSelectedAccessoryIndices((prev) => {
                                      const newIndices = prev.filter(
                                        (i) => i !== index
                                      );
                                      return newIndices.length > 0
                                        ? newIndices
                                        : [0];
                                    });
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                              />
                              <span className="text-gray-800">
                                Entry {index + 1}
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={accessoryStocks[index] ?? ""}
                              onChange={(e) => {
                                const next = [...accessoryStocks];
                                next[index] = e.target.value;
                                setAccessoryStocks(next);
                              }}
                              placeholder="0"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={accessoryPrices[index] ?? ""}
                                onChange={(e) => {
                                  const next = [...accessoryPrices];
                                  next[index] = e.target.value;
                                  setAccessoryPrices(next);
                                  // If this is one of the selected entries and it's the first one, sync its price
                                  if (
                                    selectedAccessoryIndices.includes(index) &&
                                    selectedAccessoryIndices[0] === index &&
                                    e.target.value
                                  ) {
                                    handleInputChange({
                                      target: {
                                        name: "price",
                                        value: e.target.value,
                                      },
                                    });
                                  }
                                }}
                                placeholder="Php 0.00"
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {accessoryStocks.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveAccessoryEntry(index)
                                  }
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove this entry"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 pb-3">
                        <button
                          type="button"
                          onClick={handleAddAccessoryEntry}
                          className="text-xs font-medium text-orange-500 hover:text-orange-600"
                        >
                          + Add another entry
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-5 border-t bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ItemsModals;

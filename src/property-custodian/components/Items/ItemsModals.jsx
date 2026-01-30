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
import {
  ITEM_MASTER_LIST,
  EDUCATION_LEVEL_ITEM_NAMES,
  EDUCATION_LEVEL_LABELS,
} from "../../constants/itemMasterList";
import { orderAPI, itemsAPI } from "../../../services/api";
import { HexColorPicker, HexColorInput } from "react-colorful";

/** Suggested sizes for option value (size) inputs, like item name suggestions */
const SUGGESTED_SIZES = [
  "XSmall (XS)",
  "Small (S)",
  "Medium (M)",
  "Large (L)",
  "XLarge (XL)",
  "2XLarge (2XL)",
  "3XLarge (3XL)",
  "N/A",
];

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
  const [itemNameDropdownOpen, setItemNameDropdownOpen] = useState(false);
  const [curatedNameSuggestions, setCuratedNameSuggestions] = useState([]);
  const [loadingNameSuggestions, setLoadingNameSuggestions] = useState(false);
  const itemNameDropdownRef = useRef(null);
  const [openSizeDropdownIndex, setOpenSizeDropdownIndex] = useState(null);
  const sizeDropdownRef = useRef(null);
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
  const [existingVariantCount, setExistingVariantCount] = useState(0); // In edit mode, number of variants loaded from item (these are disabled)
  // State for accessories (no sizes)
  const [accessoryStocks, setAccessoryStocks] = useState([""]);
  const [accessoryPrices, setAccessoryPrices] = useState([""]);
  const [selectedAccessoryIndices, setSelectedAccessoryIndices] = useState([0]);
  const editorRef = useRef(null);
  const isEditorInitialized = useRef(false);
  const colorPickerRef = useRef(null);
  // Only run edit-form init once per modal open per item so user-added rows (e.g. XSmall) are not wiped when effect re-runs
  const lastInitializedItemIdRef = useRef(null);
  // Keep latest variant state so edit submit always sends what the user sees (avoids stale closure)
  const variantStateRef = useRef({ values: [], stocks: [], prices: [] });

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

  // Fetch curated item name suggestions from backend (admin-approved list)
  useEffect(() => {
    let cancelled = false;

    const fetchSuggestions = async () => {
      // Only relevant for Add mode (Edit is read-only for name)
      if (!modalState.isOpen || modalState.mode !== "add") return;

      try {
        setLoadingNameSuggestions(true);
        const res = await itemsAPI.getNameSuggestions({
          educationLevel: formData.educationLevel || undefined,
          limit: 500,
        });

        const names = res?.data?.data;
        if (!cancelled) {
          setCuratedNameSuggestions(Array.isArray(names) ? names : []);
        }
      } catch (err) {
        // Safe fallback to static lists if backend is unavailable or table doesn't exist yet
        if (!cancelled) setCuratedNameSuggestions([]);
      } finally {
        if (!cancelled) setLoadingNameSuggestions(false);
      }
    };

    fetchSuggestions();
    return () => {
      cancelled = true;
    };
  }, [modalState.isOpen, modalState.mode, formData.educationLevel]);

  // Education level options (include "All Education Levels" for items like Logo Patch, ID Lace)
  const gradeLevelOptions = useMemo(
    () =>
      EDUCATION_LEVELS.map((level) => {
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

  // Item name suggestions: merge static defaults + curated admin suggestions
  const suggestedItemNames = useMemo(() => {
    const level = formData.educationLevel;

    const staticNames =
      level && EDUCATION_LEVEL_ITEM_NAMES[level]
        ? EDUCATION_LEVEL_ITEM_NAMES[level]
        : ITEM_MASTER_LIST;

    const combined = [...staticNames, ...(curatedNameSuggestions || [])];

    const seen = new Map(); // normalized -> original
    for (const n of combined) {
      const name = (n || "").toString().trim();
      if (!name) continue;
      const key = name.toLowerCase().trim().replace(/\s+/g, " ");
      if (!seen.has(key)) seen.set(key, name);
    }

    return Array.from(seen.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [formData.educationLevel, curatedNameSuggestions]);

  // Close item name dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (
        itemNameDropdownRef.current &&
        !itemNameDropdownRef.current.contains(e.target)
      ) {
        setItemNameDropdownOpen(false);
      }
    };
    if (itemNameDropdownOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [itemNameDropdownOpen]);

  // Close size dropdown on click outside
  useEffect(() => {
    const handler = (e) => {
      if (
        sizeDropdownRef.current &&
        !sizeDropdownRef.current.contains(e.target)
      ) {
        setOpenSizeDropdownIndex(null);
      }
    };
    if (openSizeDropdownIndex !== null) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [openSizeDropdownIndex]);

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
    // Handle Uniforms add: same logic as edit — all rows with option value or stock/price, merge by size, so ItemDetailsModal displays correctly
    else if (isUniforms && modalState.mode === "add") {
      const normalizedSize = (s) =>
        (s || "").toLowerCase().trim().replace(/\s*\([^)]*\)\s*/g, "").trim();
      const valuesForSubmit = variants[0]?.values?.length
        ? variants[0].values
        : ["", ""];
      const len = valuesForSubmit.length;
      const stocksForSubmit = Array.from(
        { length: len },
        (_, i) => variantStocks[i] ?? ""
      );
      const pricesForSubmit = Array.from(
        { length: len },
        (_, i) => variantPrices[i] ?? ""
      );

      // Only include variants that are checked (selectedVariantIndices); unchecked sizes like Medium must not be submitted
      const rawVariations = valuesForSubmit
        .map((sizeVal, index) => {
          if (!selectedVariantIndices.includes(index)) return null;
          const stock = Number(stocksForSubmit[index]) || 0;
          const price =
            Number(pricesForSubmit[index]) || Number(formData.price) || 0;
          let size = (
            sizeVal ||
            (index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : "")
          ).trim();
          if (!size && (stock > 0 || price > 0)) {
            size = `Size ${index + 1}`;
          }
          const beginning_inventory = stock;
          const purchases = 0;
          return size
            ? { size, stock, price, beginning_inventory, purchases }
            : null;
        })
        .filter(Boolean);

      if (rawVariations.length === 0) {
        handleFormSubmit(e);
        return;
      }

      const mergedBySize = new Map();
      rawVariations.forEach((v) => {
        const key = normalizedSize(v.size);
        if (!mergedBySize.has(key)) {
          mergedBySize.set(key, {
            size: v.size,
            stock: Number(v.stock) || 0,
            price: v.price,
            beginning_inventory: Number(v.beginning_inventory) ?? 0,
            purchases: Math.max(
              0,
              (Number(v.stock) || 0) - (Number(v.beginning_inventory) ?? 0)
            ),
          });
        } else {
          const prev = mergedBySize.get(key);
          const combinedStock = (Number(prev.stock) || 0) + (Number(v.stock) || 0);
          const begInv = Number(prev.beginning_inventory) ?? 0;
          mergedBySize.set(key, {
            ...prev,
            stock: combinedStock,
            purchases: Math.max(0, combinedStock - begInv),
          });
        }
      });

      const sizeVariations = Array.from(mergedBySize.values());
      const sizeString = sizeVariations.map((v) => v.size).join(", ");
      const totalStock = sizeVariations.reduce(
        (s, v) => s + (Number(v.stock) || 0),
        0
      );
      const firstPrice = sizeVariations[0]?.price ?? formData.price ?? 0;

      const itemToAdd = {
        ...formData,
        size: sizeString || "N/A",
        stock: totalStock,
        price: Number(firstPrice) || 0,
        note: JSON.stringify({
          sizeVariations,
          _type: "sizeVariations",
        }),
      };

      try {
        onAdd(itemToAdd);
        setTimeout(() => onClose(), 500);
      } catch (error) {
        console.error("Error adding item:", error);
      }
    }
    // Edit mode + Uniforms: same logic as add (all rows, fallback size, merge by size, purchases) so new option values show in ItemDetailsModal
    else if (
      isUniforms &&
      modalState.mode === "edit" &&
      selectedItem
    ) {
      syncEditorToForm();
      // Sync ref from current state so payload always includes latest rows (e.g. XSmall) even if closure was stale
      const currentValues = variants[0]?.values ?? [];
      const currentStocks = Array.isArray(variantStocks) ? variantStocks : [];
      const currentPrices = Array.isArray(variantPrices) ? variantPrices : [];
      variantStateRef.current = {
        values: [...currentValues],
        stocks: [...currentStocks],
        prices: [...currentPrices],
      };
      const refState = variantStateRef.current;
      const normalizedSize = (s) =>
        (s || "").toLowerCase().trim().replace(/\s*\([^)]*\)\s*/g, "").trim();
      let existingNoteData = null;
      if (selectedItem.note) {
        try {
          const p = JSON.parse(selectedItem.note);
          if (
            p?._type === "sizeVariations" &&
            Array.isArray(p.sizeVariations)
          ) {
            existingNoteData = p.sizeVariations;
          }
        } catch (_) {}
      }
      const findExistingBySize = (sizeStr) => {
        if (!existingNoteData || !sizeStr) return null;
        const target = normalizedSize(sizeStr);
        return existingNoteData.find(
          (v) => normalizedSize(v.size) === target
        ) || null;
      };

      const valuesForSubmit = refState.values?.length ? refState.values : currentValues.length ? currentValues : ["", ""];
      const len = valuesForSubmit.length;
      const stocksForSubmit = Array.from(
        { length: len },
        (_, i) => refState.stocks[i] ?? currentStocks[i] ?? ""
      );
      const pricesForSubmit = Array.from(
        { length: len },
        (_, i) => refState.prices[i] ?? currentPrices[i] ?? ""
      );

      // Only include variants that are checked (selectedVariantIndices); unchecked sizes must not be saved
      const rawVariations = valuesForSubmit
        .map((sizeVal, index) => {
          if (!selectedVariantIndices.includes(index)) return null;
          const stock = Number(stocksForSubmit[index]) || 0;
          const price =
            Number(pricesForSubmit[index]) || Number(formData.price) || 0;
          let size = (
            sizeVal ||
            (index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : "")
          ).trim();
          if (!size && (stock > 0 || price > 0)) {
            size = `Size ${index + 1}`;
          }
          const existing = findExistingBySize(size);
          const beginning_inventory =
            existing?.beginning_inventory != null
              ? Number(existing.beginning_inventory) || 0
              : stock;
          const purchases = Math.max(
            0,
            (Number(stock) || 0) - (Number(beginning_inventory) || 0)
          );
          return size
            ? { size, stock, price, beginning_inventory, purchases }
            : null;
        })
        .filter(Boolean);

      if (rawVariations.length === 0) {
        handleFormSubmit(e);
        return;
      }

      const mergedBySize = new Map();
      rawVariations.forEach((v) => {
        const key = normalizedSize(v.size);
        if (!mergedBySize.has(key)) {
          mergedBySize.set(key, {
            size: v.size,
            stock: Number(v.stock) || 0,
            price: v.price,
            beginning_inventory: Number(v.beginning_inventory) ?? 0,
            purchases: Math.max(
              0,
              (Number(v.stock) || 0) - (Number(v.beginning_inventory) ?? 0)
            ),
          });
        } else {
          const prev = mergedBySize.get(key);
          const combinedStock = (Number(prev.stock) || 0) + (Number(v.stock) || 0);
          const begInv = Number(prev.beginning_inventory) ?? 0;
          mergedBySize.set(key, {
            ...prev,
            stock: combinedStock,
            purchases: Math.max(0, combinedStock - begInv),
          });
        }
      });

      const sizeVariations = Array.from(mergedBySize.values());
      const sizeString = sizeVariations.map((v) => v.size).join(", ");
      const totalStock = sizeVariations.reduce(
        (s, v) => s + (Number(v.stock) || 0),
        0
      );
      const firstPrice = sizeVariations[0]?.price ?? formData.price ?? 0;
      const itemToUpdate = {
        ...formData,
        id: selectedItem.id,
        descriptionText:
          editorRef.current?.innerHTML ?? formData.descriptionText,
        size: sizeString || "N/A",
        stock: totalStock,
        price: Number(firstPrice) || 0,
        note: JSON.stringify({
          sizeVariations,
          _type: "sizeVariations",
        }),
      };
      try {
        await onUpdate(itemToUpdate);
        onClose();
      } catch (err) {
        console.error("Error updating item:", err);
      }
    } else {
      // For edit (non-Uniforms) or single item, use normal submission
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

  // Keep ref in sync so edit submit always has latest variant state (including new option value rows)
  useEffect(() => {
    if (variants[0]?.values && Array.isArray(variants[0].values)) {
      variantStateRef.current = {
        values: [...variants[0].values],
        stocks: Array.isArray(variantStocks) ? [...variantStocks] : [],
        prices: Array.isArray(variantPrices) ? [...variantPrices] : [],
      };
    }
  }, [variants, variantStocks, variantPrices]);

  // Initialize variant prices and stocks when editing an item (only once per open per item so user-added rows are not wiped)
  useEffect(() => {
    if (!modalState.isOpen) {
      lastInitializedItemIdRef.current = null;
      return;
    }
    if (
      modalState.mode === "edit" &&
      selectedItem &&
      selectedItem.id !== lastInitializedItemIdRef.current
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
        setExistingVariantCount(sizeVariations.length);
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
        // Fallback: if item has comma-separated sizes in size field but no JSON sizeVariations,
        // prefill variant values so Small, Medium, etc. all show in the Variants section
        if (
          selectedItem.size &&
          selectedItem.size !== "N/A" &&
          selectedItem.size.includes(",")
        ) {
          const sizes = selectedItem.size.split(",").map((s) => s.trim()).filter(Boolean);
          if (sizes.length > 0) {
            setExistingVariantCount(sizes.length);
            const maxLength = Math.max(sizes.length, 2);
            const initialValues = [...sizes];
            while (initialValues.length < maxLength) initialValues.push("");
            const initialPrices = sizes.map(
              () => String(selectedItem.price || "")
            );
            while (initialPrices.length < maxLength) initialPrices.push("");
            const stockPerSize = sizes.length > 0
              ? Math.floor((Number(selectedItem.stock) || 0) / sizes.length)
              : 0;
            const initialStocks = sizes.map(() => String(stockPerSize));
            while (initialStocks.length < maxLength) initialStocks.push("");
            setVariantPrices(initialPrices);
            setVariantStocks(initialStocks);
            setSelectedVariantIndices(sizes.map((_, i) => i));
            setVariants([
              { name: "", values: initialValues.length > 0 ? initialValues : ["", ""] },
            ]);
          } else {
            setExistingVariantCount(0);
            setVariantPrices((prev) =>
              prev[0] === "" && selectedItem.price
                ? [String(selectedItem.price), prev[1] || ""]
                : prev
            );
            setSelectedVariantIndices([0]);
          }
        } else {
          setExistingVariantCount(0);
          setVariantPrices((prev) => {
            if (prev[0] === "" && selectedItem.price) {
              return [String(selectedItem.price), prev[1] || ""];
            }
            return prev;
          });
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
      }
      lastInitializedItemIdRef.current = selectedItem.id;
    } else if (modalState.isOpen && modalState.mode === "add") {
      setExistingVariantCount(0);
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
    selectedItem?.id,
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

  const isEditMode = modalState.mode === "edit";
  const isExistingVariant = (index) => isEditMode && index < existingVariantCount;

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

  // Add/Edit Item Modal - responsive: Mobile M 375, Mobile L 425, Tablet 768, Laptop 1024
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] py-2 pl-[5.5rem] pr-3 mobile-m:pl-[5.5rem] mobile-m:pr-3 mobile-l:py-3 mobile-l:pl-[5.75rem] mobile-l:pr-4 tablet:p-6 tablet:pl-10 tablet:pt-10 tablet:pr-6 tablet:pb-6 laptop:p-5 laptop:pl-5 laptop:pt-5"
      onClick={(e) => {
        // Close modal when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl mobile-l:rounded-2xl shadow-2xl w-full max-w-full mobile-l:max-w-[405px] tablet:max-w-[600px] laptop:max-w-3xl max-h-[90vh] mobile-l:max-h-[82vh] tablet:max-h-[82vh] laptop:max-h-[90vh] overflow-hidden flex flex-col mt-5 mobile-m:mt-6 mobile-l:mt-6 tablet:mt-8 laptop:mt-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pre-Order Notification Banner - Only for Add mode */}
        {modalState.mode === "add" &&
          preOrderCount > 0 &&
          parseInt(formData.stock || 0) > 0 && (
            <div className="px-3 py-2 mobile-m:px-4 mobile-l:px-4 mobile-l:py-2.5 tablet:px-6 tablet:py-3 bg-blue-50 border-b border-blue-200">
              <div className="flex items-center gap-1.5 mobile-l:gap-2 text-blue-800">
                <Users size={14} className="mobile-l:w-[18px] mobile-l:h-[18px] shrink-0" />
                <p className="text-xs font-medium mobile-l:text-sm">
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
          className="flex-1 overflow-y-auto min-h-0 bg-gray-50 px-3 pt-3 pb-6 mobile-m:px-4 mobile-m:pt-4 mobile-l:px-4 mobile-l:pt-4 mobile-l:pb-6 tablet:px-5 tablet:pt-4 tablet:pb-8 laptop:px-6 laptop:pb-8"
        >
          {/* Breadcrumb (outside white card) */}
          <div className="max-w-2xl mx-auto mb-3 mobile-l:mb-4">
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

          <div className="max-w-2xl mx-auto bg-white rounded-xl mobile-l:rounded-2xl shadow-sm border border-gray-100 p-3 mobile-m:p-4 mobile-l:p-4 tablet:p-5 laptop:p-6 space-y-4 mobile-l:space-y-5 tablet:space-y-6">
            {/* Header: Title, Size Guide, and Centered Image Upload */}
            <div className="space-y-3 mobile-l:space-y-4">
              {/* Item name + item type with size info on the right */}
              <div className="flex items-center justify-between gap-2 mobile-l:gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#0C2340] truncate mobile-m:text-lg mobile-l:text-lg tablet:text-xl">
                    {formData.name || "Item Name"}
                  </h3>
                  <p className="mt-0.5 mobile-l:mt-1 text-xs font-medium text-orange-500 mobile-l:text-sm">
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
                  onDragOver={isEditMode ? undefined : handleDragOver}
                  onDragLeave={isEditMode ? undefined : handleDragLeave}
                  onDrop={isEditMode ? undefined : handleDrop}
                  onClick={isEditMode ? undefined : handleBrowseClick}
                  className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center transition bg-gray-50 overflow-hidden ${
                    isEditMode
                      ? "border-gray-200 cursor-not-allowed opacity-60"
                      : isDragging
                        ? "border-blue-500 bg-blue-50 cursor-pointer"
                        : "border-dashed border-gray-300 hover:border-gray-400 cursor-pointer"
                  }`}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain bg-gray-100"
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
                {/* Education Level only (e.g. All Education Levels for Logo Patch, ID Lace) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">
                    Education Level
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleInputChange}
                    required
                    disabled={isEditMode}
                    className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">Select Education Level</option>
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

                {/* Row: Item Name & Item Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
                  <div className="space-y-1.5 relative" ref={itemNameDropdownRef}>
                    <label className="text-sm font-medium text-gray-700">
                      Item Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onFocus={() => !isEditMode && setItemNameDropdownOpen(true)}
                      placeholder={
                        formData.educationLevel
                          ? "e.g. Kinder Dress"
                          : "Select education level first for suggestions"
                      }
                      disabled={isEditMode}
                      readOnly={isEditMode}
                      className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    />
                    {(() => {
                      const filtered = suggestedItemNames.filter((n) =>
                        (formData.name || "").trim() === ""
                          ? true
                          : n
                              .toLowerCase()
                              .includes(
                                (formData.name || "").toLowerCase().trim()
                              )
                      );
                      return (
                        itemNameDropdownOpen &&
                        filtered.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                            {loadingNameSuggestions && (
                              <div className="px-3 py-2 text-xs text-gray-500">
                                Loading suggestions...
                              </div>
                            )}
                            {filtered.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleInputChange({
                                  target: { name: "name", value: n },
                                });
                                setItemNameDropdownOpen(false);
                              }}
                            >
                              {n}
                            </button>
                            ))}
                          </div>
                        )
                      );
                    })()}
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
                      disabled={isEditMode}
                      className={`w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEditMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
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

                {/* Row: Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-gray-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Gender
                    </label>
                    <select
                      name="forGender"
                      value={formData.forGender || "Unisex"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Unisex">For Both (Male & Female)</option>
                      <option value="Female">For Female</option>
                      <option value="Male">For Male</option>
                    </select>
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

                    {/* Bottom card: Size / Stock / Unit Price + Add another option value */}
                    <div className="rounded-xl border border-gray-200 bg-white">
                      <div className="grid grid-cols-3 gap-4 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-600">
                        <span>Size</span>
                        <span>Stock</span>
                        <span>Unit Price</span>
                      </div>
                      <div
                        className="px-4 py-3 space-y-2 text-sm"
                        ref={sizeDropdownRef}
                      >
                        {variants[0].values.map((value, index) => {
                          const existing = isExistingVariant(index);
                          return (
                            <div
                              key={index}
                              className="grid grid-cols-3 gap-4 items-center"
                            >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={selectedVariantIndices.includes(index)}
                                onChange={(e) => {
                                  if (existing) return;
                                  if (e.target.checked) {
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
                                    setSelectedVariantIndices((prev) => {
                                      const newIndices = prev.filter(
                                        (i) => i !== index
                                      );
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
                                disabled={existing}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                              {existing ? (
                                <span className="text-gray-800">
                                  {value ||
                                    (index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : `Size ${index + 1}`)}
                                </span>
                              ) : (
                                <div className="relative flex-1 min-w-0 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) =>
                                      handleVariantValueChange(0, index, e.target.value)
                                    }
                                    onFocus={() =>
                                      setOpenSizeDropdownIndex(index)
                                    }
                                    placeholder={
                                      index === 0 ? "Small (S)" : index === 1 ? "Medium (M)" : "e.g. Large (L), XSmall (XS)"
                                    }
                                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  {openSizeDropdownIndex === index && (() => {
                                    const filtered = SUGGESTED_SIZES.filter(
                                      (s) =>
                                        (value || "").trim() === "" ||
                                        s
                                          .toLowerCase()
                                          .includes(
                                            (value || "").toLowerCase().trim()
                                          )
                                    );
                                    return (
                                      filtered.length > 0 && (
                                        <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                                          {filtered.map((s) => (
                                            <button
                                              key={s}
                                              type="button"
                                              className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleVariantValueChange(
                                                  0,
                                                  index,
                                                  s
                                                );
                                                setOpenSizeDropdownIndex(null);
                                              }}
                                            >
                                              {s}
                                            </button>
                                          ))}
                                        </div>
                                      )
                                    );
                                  })()}
                                  {variants[0].values.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariantValue(0, index)}
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg shrink-0"
                                      title="Remove this option value"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              )}
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
                              disabled={existing}
                              readOnly={existing}
                              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${existing ? "bg-gray-50 cursor-not-allowed border-gray-200" : "border-gray-300 bg-white"}`}
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
                              disabled={existing}
                              readOnly={existing}
                              className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${existing ? "bg-gray-50 cursor-not-allowed border-gray-200" : "border-gray-300 bg-white"}`}
                            />
                          </div>
                          );
                        })}
                      </div>
                      <div className="px-4 pb-3">
                        <button
                          type="button"
                          onClick={() => handleAddVariantValue(0)}
                          className="text-xs font-medium text-orange-500 hover:text-orange-600"
                        >
                          + Add another option value
                        </button>
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

        {/* Footer - responsive padding */}
        <div className="flex items-center justify-end gap-2 mobile-l:gap-3 px-3 py-4 mobile-m:px-4 mobile-l:px-4 tablet:px-6 tablet:py-5 border-t bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 mobile-l:px-4 mobile-l:py-2 text-xs mobile-l:text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium"
          >
            Back
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-1.5 mobile-l:px-6 mobile-l:py-2.5 text-xs mobile-l:text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 shadow-sm font-semibold transition"
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

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignRight,
  RemoveFormatting,
} from "lucide-react";
import { getSizeGuideNote } from "../../../utils/sizeMeasurements";

/**
 * ItemVariantEditModal
 *
 * Edit-per-variant modal opened from Item Details when user clicks Edit on a variation.
 * Two-column layout: left = "Uniform" + image + Sizes Available; right = Option, Size Choices,
 * Note, Unit Price, On Hand. Footer: Back, Save Variant.
 *
 * Props:
 * - isOpen, parentItem, variation, variations, onClose, onSave
 */
const getVariationKey = (v) =>
  v?._variationKey || (v?.id && v?.created_at ? `${v.id}-${v.created_at}` : null) || v?.id;

const ItemVariantEditModal = ({
  isOpen,
  parentItem,
  variation,
  variations = [],
  onClose,
  onSave,
}) => {
  const [currentVariation, setCurrentVariation] = useState(variation || null);
  const [sizeChoices, setSizeChoices] = useState("");
  const [note, setNote] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [onHand, setOnHand] = useState("");
  const noteEditorRef = useRef(null);

  // Sync form state when the active variation or props change.
  // Note: use only human-readable chest/shirt length text; ignore sizeVariations JSON.
  useEffect(() => {
    if (!currentVariation) return;
    setSizeChoices(currentVariation.size ?? "");
    const raw = currentVariation.note;
    const noteStr = typeof raw === "string" ? raw.trim() : "";
    const isJson = noteStr.startsWith("{") || noteStr.startsWith("[");
    const baseNote = isJson ? "" : noteStr;

    // If there is no saved note, auto-fill a guide based on size (XS/S/M/L/XL/2XL)
    const sizeGuide = getSizeGuideNote(currentVariation.size);
    const noteContent = baseNote || sizeGuide || "";

    setNote(noteContent);

    // Sync to rich-text editor when it's mounted (defer so ref is set after open)
    const id = setTimeout(() => {
      const el = noteEditorRef.current;
      if (el) {
        el.innerHTML = noteContent;
      }
    }, 0);
    setUnitPrice(
      currentVariation.price != null ? String(currentVariation.price) : ""
    );
    setOnHand(
      currentVariation.stock != null ? String(currentVariation.stock) : ""
    );
    return () => clearTimeout(id);
  }, [currentVariation]);

  // When modal opens or variation/parent changes, set current variation
  useEffect(() => {
    if (isOpen && variation) {
      setCurrentVariation(variation);
    }
  }, [isOpen, variation?.id, variation?._variationKey]);

  const handleSwitchSize = (v) => {
    setCurrentVariation(v);
  };

  const applyNoteEditorCommand = (command, value = null) => {
    if (!noteEditorRef.current || typeof document === "undefined") return;
    noteEditorRef.current.focus();
    try {
      document.execCommand(command, false, value);
    } catch {
      // ignore
    }
    setNote(noteEditorRef.current.innerHTML);
  };

  const handleNoteInput = () => {
    if (!noteEditorRef.current) return;
    const html = noteEditorRef.current.innerHTML;
    setNote(html);
  };

  const handleNoteBlur = () => {
    if (!noteEditorRef.current) return;
    const textContent =
      noteEditorRef.current.textContent || noteEditorRef.current.innerText || "";
    // Treat pure whitespace as empty so CSS placeholder can appear
    if (!textContent.trim()) {
      noteEditorRef.current.innerHTML = "";
      setNote("");
    } else {
      setNote(noteEditorRef.current.innerHTML);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentVariation || !parentItem) return;
    const source = { ...parentItem, ...currentVariation };
    const payload = {
      id: currentVariation.id,
      name: parentItem.name ?? currentVariation.name ?? "",
      educationLevel:
        parentItem.educationLevel ?? parentItem.education_level ?? "",
      category: parentItem.category ?? source.category ?? "",
      itemType: parentItem.itemType ?? parentItem.item_type ?? "",
      image: parentItem.image ?? currentVariation.image ?? "",
      size: sizeChoices.trim() || "N/A",
      note: note.trim() || "",
      price: Number(unitPrice) || 0,
      stock: Number(onHand) || 0,
      description: source.description ?? "",
      descriptionText: source.descriptionText ?? source.description_text ?? "",
      material: source.material ?? "",
      physicalCount: source.physicalCount ?? source.physical_count ?? 0,
      available: source.available ?? 0,
      reorderPoint: source.reorderPoint ?? source.reorder_point ?? 0,
    };
    onSave(payload);
  };

  if (!isOpen) return null;

  const displaySize = currentVariation?.size || variation?.size || "Small";
  const imageUrl =
    parentItem?.image || variation?.image || currentVariation?.image;
  const isCurrent = (v) =>
    getVariationKey(v) === getVariationKey(currentVariation);
  
  // Get placeholder text based on current size (default to Small if not found)
  const placeholderText = (() => {
    const sizeGuide = getSizeGuideNote(displaySize);
    if (sizeGuide) {
      // Extract just the measurement part (without the size name)
      const lines = sizeGuide.split('\n');
      return lines.length > 1 ? lines[1] : sizeGuide;
    }
    // Fallback to Small (S) measurements
    return "Chest: 32–34 in / 81–86 cm; Shirt Length: 24–26 in / 61–66 cm";
  })();

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Breadcrumb + Title */}
        <div className="border-b border-gray-100 px-6 pt-4 pb-3">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-1"
          >
            <ChevronLeft size={16} />
            <span className="font-medium">Items</span>
          </button>
          <h2
            className="text-xl font-semibold"
            style={{ color: "#003363" }}
          >
            Item Variant Details / {displaySize}
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto flex flex-col"
        >
          <div className="p-6 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 min-w-0">
              {/* Left column: no right padding so size buttons' orange border closes to the right corner */}
              <div className="space-y-4 min-w-0 md:border-r md:border-gray-200">
                <p className="text-sm font-medium text-gray-700" style={{ color: "#E68B00" }}>
                  Uniform
                </p>
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 grid place-items-center aspect-square max-h-64 min-h-[200px]">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={parentItem?.name || "Item"}
                      className="max-w-full max-h-full w-auto h-auto object-contain object-center"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
                      }}
                    />
                  ) : (
                    <span className="text-sm text-gray-400">No image</span>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Sizes Available
                  </p>
                  <div className="flex flex-col gap-2 min-w-0 w-full">
                    {variations.map((v) => {
                      const active = isCurrent(v);
                      return (
                        <button
                          key={getVariationKey(v) ?? Math.random()}
                          type="button"
                          onClick={() => handleSwitchSize(v)}
                          className={`w-full min-w-0 px-4 py-2 text-xs font-medium transition-colors text-left flex items-center justify-start border-2 ${
                            active
                              ? "bg-[#FFEBCC] text-[#0C2340] border-[#E68B00]"
                              : "bg-white text-gray-700 hover:bg-gray-100 border-transparent"
                          }`}
                        >
                          {v.size || "Standard"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right column: Option, Size Choices, Note, Unit Price + On Hand */}
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Option</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Size Choices
                  </label>
                  <input
                    type="text"
                    value={sizeChoices}
                    readOnly
                    placeholder="e.g. Small, Medium (M)"
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    Note
                  </label>
                  <div className="rounded-xl border border-gray-300 bg-white overflow-visible">
                    {/* Rich text toolbar — same as ItemsModals Description/Note */}
                    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 text-gray-600 relative">
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyNoteEditorCommand("removeFormat")}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Remove formatting"
                      >
                        <RemoveFormatting size={18} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyNoteEditorCommand("bold")}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Bold"
                      >
                        <Bold size={18} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyNoteEditorCommand("italic")}
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Italic"
                      >
                        <Italic size={18} />
                      </button>
                      <div className="w-px h-5 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          applyNoteEditorCommand("insertOrderedList")
                        }
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Numbered list"
                      >
                        <ListOrdered size={18} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          applyNoteEditorCommand("insertUnorderedList")
                        }
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Bulleted list"
                      >
                        <List size={18} />
                      </button>
                      <div className="w-px h-5 bg-gray-300 mx-1" />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          applyNoteEditorCommand("justifyLeft")
                        }
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Align left"
                      >
                        <AlignLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          applyNoteEditorCommand("justifyRight")
                        }
                        className="p-1.5 hover:bg-gray-100 rounded transition"
                        title="Align right"
                      >
                        <AlignRight size={18} />
                      </button>
                    </div>
                    <div
                      ref={noteEditorRef}
                      className="w-full px-3 py-2.5 text-sm min-h-[100px] outline-none rich-text-editor"
                      contentEditable
                      onInput={handleNoteInput}
                      onBlur={handleNoteBlur}
                      suppressContentEditableWarning
                      data-placeholder={placeholderText}
                    />
                  </div>
                </div>
                {/* Unit Price (left) and On hand (right) in same row — read-only */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Unit Price
                    </label>
                    <input
                      type="text"
                      value={unitPrice ? `Php ${Number(unitPrice).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "Php 0.00"}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      On hand
                    </label>
                    <input
                      type="text"
                      value={onHand}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer: Back, Save Variant */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#E68B00] text-white hover:bg-[#d67a00] transition-colors shadow-sm"
            >
              Save Variant
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ItemVariantEditModal;

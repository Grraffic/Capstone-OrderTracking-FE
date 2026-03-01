import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * SearchableSelect - A dropdown that supports typing to filter options
 * @param {Object} props
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - (value) => void
 * @param {string[]} props.options - List of option values
 * @param {string} props.placeholder - Placeholder when empty
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.required - HTML required attribute
 * @param {boolean} props.disabled - Disable the input
 */
const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Type or select...",
  className = "",
  required = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);

  const normalizedOptions = [...new Set(options)].filter(Boolean).sort();
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.toLowerCase().includes((inputValue || "").toLowerCase().trim())
  );

  // Sync inputValue when value prop changes (e.g. form reset, external selection)
  // Only overwrite when value is set - avoid clearing while user is typing a partial match
  useEffect(() => {
    if (value) setInputValue(value);
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Revert to selected value if user clicked away without selecting
        if (value) setInputValue(value);
        else setInputValue("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    setIsOpen(true);
    setHighlightedIndex(0);
    // Allow typing; selection happens on blur or option click
    if (normalizedOptions.includes(v)) {
      onChange(v);
    } else {
      onChange("");
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleSelect = (opt) => {
    setInputValue(opt);
    onChange(opt);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen && e.key !== "Escape") {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, filteredOptions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        if (value) setInputValue(value);
        else setInputValue("");
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="searchable-select-listbox"
        aria-activedescendant={
          isOpen && filteredOptions[highlightedIndex]
            ? `searchable-option-${highlightedIndex}`
            : undefined
        }
        className={`${className} pr-9`}
      />
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          aria-hidden
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul
          id="searchable-select-listbox"
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
        >
          {filteredOptions.map((opt, i) => (
            <li
              key={opt}
              id={`searchable-option-${i}`}
              role="option"
              aria-selected={opt === value}
              className={`px-3 py-2 text-sm cursor-pointer ${
                i === highlightedIndex ? "bg-[#E68B00]/10 text-[#0C2340]" : "text-gray-700 hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(opt);
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
      {isOpen && inputValue && filteredOptions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          No matching items
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

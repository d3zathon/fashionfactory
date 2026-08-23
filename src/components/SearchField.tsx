"use client";

import { Search } from "lucide-react";
import type { ReactNode, RefObject } from "react";

interface SearchFieldProps {
  /** Ties the label to the input; must be unique on the page. */
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Trailing control inside the frame — a clear button, or a submit button. */
  trailing?: ReactNode;
  /**
   * Hide the label visually (it stays available to assistive tech). For places
   * where a nearby heading already says what the field is.
   */
  labelHidden?: boolean;
}

/**
 * The search input, shared by the homepage and the collection page.
 *
 * Presentational only — it holds no query state and knows nothing about
 * matching. The homepage submits its value as a URL, the collection filters
 * with it live, and the actual matching lives in src/lib/productSearch.ts. What
 * is worth sharing is the frame: a real <label>, the icon, the focus ring and
 * the trailing slot, so the two fields cannot drift apart visually or in how
 * they are announced.
 *
 * A real <label> rather than a placeholder-as-label: placeholders disappear on
 * focus, are not reliably announced, and fail contrast in most browsers.
 */
export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  inputRef,
  trailing,
  labelHidden = false,
}: SearchFieldProps) {
  return (
    <div className="collection-search">
      <label className={labelHidden ? "sr-only" : "collection-search-label"} htmlFor={id}>
        {label}
      </label>
      <div className="collection-search-field">
        <Search size={15} aria-hidden="true" />
        <input
          id={id}
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
        />
        {trailing}
      </div>
    </div>
  );
}

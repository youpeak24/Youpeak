import React from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { setToast } from "../../util/toast";

const invalidCopyValues = new Set(["-", "—"]);

const isValidCopyValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (invalidCopyValues.has(trimmed)) return false;
  }
  return true;
};

const copyToClipboard = async (value) => {
  const text = String(value ?? "");
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // Fall back below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    return false;
  }
};

/**
 * Copy-to-clipboard helper for any unique ID rendered in tables.
 * - Disables copy for empty/null/placeholder values
 * - Shows a `Copied!` toast on success
 */
const UniqueIdCopy = ({ value, placeholder = "-", wrapperStyle }) => {
  const valid = isValidCopyValue(value);
  const display = valid ? value : placeholder;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        // gap: 8,
        
      }}
    >
      <div className="text-muted small text-start text-capitalize">{display}</div>
      <button
        type="button"
        className="btn btn-sm"
        style={{ padding: "2px 6px" }}
        onClick={async (e) => {
          e.stopPropagation();
          if (!valid) return;
          const copied = await copyToClipboard(value);
          if (copied) setToast("success", "Copied!");
        }}
        disabled={!valid}
        aria-label="Copy unique id"
        title={valid ? "Copy" : "No ID to copy"}
      >
        <ContentCopyIcon className="text-secondary" sx={{ fontSize: 14 }} />
      </button>
    </span>
  );
};

export default UniqueIdCopy;


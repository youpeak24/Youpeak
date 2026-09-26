import React, { useEffect, useRef, useState } from "react";

/**
 * Confirmation for a destructive moderation action, with an optional reason
 * that is stored on the video and sent to its owner.
 */
export default function ActionDialog({ title, body, confirmLabel, danger = true, askReason = false, defaultReason = "", onConfirm, onClose }) {
  const [reason, setReason] = useState(defaultReason);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal show d-block" role="dialog" aria-modal="true" aria-labelledby="pc-action-title" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="pc-action-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} disabled={busy} />
          </div>
          <div className="modal-body">
            <p className="mb-2">{body}</p>
            {askReason ? (
              <>
                <label htmlFor="pc-action-reason" className="pc-label">Reason (sent to the creator)</label>
                <textarea
                  id="pc-action-reason"
                  ref={inputRef}
                  className="form-control"
                  rows={3}
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            ) : null}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`}
              onClick={confirm}
              disabled={busy || (askReason && !reason.trim())}
            >
              {busy ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

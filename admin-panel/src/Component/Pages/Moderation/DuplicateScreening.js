import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { fmtDateTime } from "../PlatformConfig/format";
import ActionDialog from "./ActionDialog";
import "../PlatformConfig/platformConfig.css";

function MatchSummary({ v }) {
  if (v.copyrightMatchVia === "audio") {
    return <span className="pc-chip pc-chip-danger">Audio {Math.round(Number(v.copyrightMatchScore) * 100)}% similar</span>;
  }
  if (v.copyrightMatchVia === "frames") {
    return <span className="pc-chip pc-chip-danger">{v.copyrightMatchScore} matching frames</span>;
  }
  return <span className="pc-chip">Flagged manually</span>;
}

function VideoState({ v }) {
  if (v.isActive === false) return <span className="pc-chip">Taken down</span>;
  if (v.audioMuted) return <span className="pc-chip pc-chip-warning">Audio muted · earning paused</span>;
  return <span className="pc-chip pc-chip-warning">Earning paused</span>;
}

/**
 * Videos the fingerprint worker matched against an earlier upload (Chromaprint
 * audio similarity or frame pHash distance). Token earning stays off until an
 * admin clears the flag.
 */
export default function DuplicateScreening() {
  const [status, setStatus] = useState("open");
  const [rows, setRows] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    axios
      .get("admin/copyrightModeration/flagged", { params: { start: 1, limit: 100, status } })
      .then((r) => setRows(r.data.status ? r.data.queue : []))
      .catch(() => {
        setRows([]);
        setToast("error", "Couldn't load flagged videos.");
      });
  }, [status]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  const act = async (video, action, reason) => {
    const res = await axios.post("admin/copyrightModeration/action", { videoId: video._id, action, reason }).then((r) => r.data);
    setToast(res.status ? "success" : "error", res.message);
    setDialog(null);
    load();
  };

  return (
    <div className="pc-page">
      <div className="pc-page-head">
        <h4 className="pc-page-title">Duplicate Screening</h4>
        <div className="pc-page-sub">
          Uploads that match an earlier video by audio fingerprint or video frames. Earning is paused on every flagged video until you decide. Thresholds are under Moderation &amp; Anti-Fraud Settings.
        </div>
      </div>
      <div className="pc-tabs" role="tablist">
        <button type="button" role="tab" className="pc-tab" aria-selected={status === "open"} onClick={() => setStatus("open")}>
          Open
        </button>
        <button type="button" role="tab" className="pc-tab" aria-selected={status === "all"} onClick={() => setStatus("all")}>
          All, incl. taken down
        </button>
      </div>

      {!rows ? (
        <div className="pc-muted">Loading…</div>
      ) : !rows.length ? (
        <div className="pc-card pc-card-body pc-muted">No flagged videos.</div>
      ) : (
        <div className="pc-card">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Flagged video</th>
                  <th scope="col">Matches</th>
                  <th scope="col">Uploader</th>
                  <th scope="col">State</th>
                  <th scope="col" className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div className="fw-semibold">{v.title || "Untitled video"}</div>
                      <small className="pc-muted">Flagged {fmtDateTime(v.copyrightFlaggedAt)}</small>
                    </td>
                    <td>
                      <MatchSummary v={v} />
                      <small className="pc-muted d-block">
                        {v.matchedVideo ? `Original: ${v.matchedVideo.title || v.matchedVideo._id}` : v.copyrightFlagReason || "—"}
                      </small>
                    </td>
                    <td>
                      <div>{v.owner ? v.owner.fullName || v.owner.email : "Unknown"}</div>
                      <small className="pc-muted">
                        {v.owner?.copyrightStrikes ? `${v.owner.copyrightStrikes} strike${v.owner.copyrightStrikes === 1 ? "" : "s"}` : "No strikes"}
                        {v.owner?.isBlock ? " · account banned" : ""}
                      </small>
                    </td>
                    <td>
                      <VideoState v={v} />
                    </td>
                    <td>
                      {v.isActive === false ? null : (
                        <div className="pc-row-actions">
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => act(v, "override")}>
                            Approve override
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            title={v.copyrightMatchVia === "audio" ? "Silences the audio and resumes earning" : "Silences the audio; a frame match stays flagged"}
                            onClick={() => act(v, "muteAudio")}
                            disabled={v.audioMuted}
                          >
                            Mute audio
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              setDialog({
                                video: v,
                                body: `“${v.title || "Untitled video"}” will be removed and ${v.owner ? v.owner.fullName || v.owner.email : "its uploader"}'s account banned. This also adds a copyright strike.`,
                              })
                            }
                          >
                            Takedown &amp; ban
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dialog ? (
        <ActionDialog
          title="Take down and ban?"
          body={dialog.body}
          confirmLabel="Take down & ban"
          askReason
          defaultReason="Copyright violation"
          onConfirm={(reason) => act(dialog.video, "takedownBan", reason)}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

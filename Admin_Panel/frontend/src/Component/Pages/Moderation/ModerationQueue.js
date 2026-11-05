import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { fetchPlatformConfig } from "../PlatformConfig/configApi";
import { fmtDateTime } from "../PlatformConfig/format";
import ActionDialog from "./ActionDialog";
import "../PlatformConfig/platformConfig.css";

const CATEGORY_LABEL = {
  anti_national: "Anti-national",
  hate_speech: "Hate speech",
  violence: "Violence",
  defamation: "Defamation",
};

const SOURCE_LABEL = {
  reports: "User reports",
  text: "Title / description",
  "transcript+text": "Audio transcript",
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Transcript excerpts around each blacklisted keyword, keywords highlighted.
function TranscriptMatches({ transcript, keywords }) {
  const parts = useMemo(() => {
    if (!transcript || !keywords?.length) return [];
    const re = new RegExp(keywords.map(escapeRe).join("|"), "gi");
    const out = [];
    let m;
    while ((m = re.exec(transcript)) && out.length < 3) {
      const start = Math.max(0, m.index - 60);
      const end = Math.min(transcript.length, m.index + m[0].length + 60);
      out.push({
        key: m.index,
        before: (start > 0 ? "…" : "") + transcript.slice(start, m.index),
        hit: m[0],
        after: transcript.slice(m.index + m[0].length, end) + (end < transcript.length ? "…" : ""),
      });
    }
    return out;
  }, [transcript, keywords]);
  if (!parts.length) return null;
  return (
    <div className="pc-transcript">
      {parts.map((p) => (
        <div key={p.key}>
          {p.before}
          <mark>{p.hit}</mark>
          {p.after}
        </div>
      ))}
    </div>
  );
}

// IT Rules 2021 takedown deadline, counted from when the video was held.
function SlaChip({ flaggedAt, slaHours }) {
  if (!flaggedAt) return null;
  const hoursLeft = (Date.parse(flaggedAt) + slaHours * 3600e3 - Date.now()) / 3600e3;
  if (!Number.isFinite(hoursLeft)) return null;
  if (hoursLeft < 0) return <span className="pc-chip pc-chip-danger">Overdue by {Math.ceil(-hoursLeft)}h</span>;
  return <span className={`pc-chip ${hoursLeft < 6 ? "pc-chip-danger" : "pc-chip-warning"}`}>Decide within {Math.floor(hoursLeft)}h</span>;
}

function ReviewQueue({ slaHours }) {
  const [rows, setRows] = useState(null);
  const [dialog, setDialog] = useState(null);

  const load = useCallback(() => {
    axios
      .get("admin/contentModeration/queue", { params: { start: 1, limit: 100 } })
      .then((r) => setRows(r.data.status ? r.data.queue : []))
      .catch(() => {
        setRows([]);
        setToast("error", "Couldn't load the moderation queue.");
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (video, action, reason) => {
    const res = await axios.post("admin/contentModeration/moderate", { videoId: video._id, action, reason }).then((r) => r.data);
    setToast(res.status ? "success" : "error", res.message);
    setDialog(null);
    load();
  };

  if (!rows) return <div className="pc-muted">Loading…</div>;
  if (!rows.length) return <div className="pc-card pc-card-body pc-muted">Nothing waiting for review.</div>;

  return (
    <div className="pc-card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">Video</th>
              <th scope="col">Why it's held</th>
              <th scope="col">Deadline</th>
              <th scope="col" className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v._id}>
                <td>
                  <div className="fw-semibold">{v.title || "Untitled video"}</div>
                  <small className="pc-muted">
                    {v.owner ? v.owner.fullName || v.owner.nickName || v.owner.email : "Unknown owner"} · held {fmtDateTime(v.moderationFlaggedAt)}
                  </small>
                </td>
                <td>
                  <div>
                    <span className="pc-chip">{SOURCE_LABEL[v.moderationFlagSource] || "Flagged"}</span>
                    {v.reportCount ? <span className="pc-chip pc-chip-warning">{v.reportCount} reports</span> : null}
                    {(v.moderationFlagCategories || (v.isFlaggedAntiNational ? ["anti_national"] : [])).map((c) => (
                      <span key={c} className="pc-chip pc-chip-danger">{CATEGORY_LABEL[c] || c}</span>
                    ))}
                  </div>
                  {v.flaggedKeywords?.length ? (
                    <small className="pc-muted d-block">Keywords: {v.flaggedKeywords.join(", ")}</small>
                  ) : null}
                  <TranscriptMatches transcript={v.moderationTranscript} keywords={v.flaggedKeywords} />
                </td>
                <td>
                  <SlaChip flaggedAt={v.moderationFlaggedAt} slaHours={slaHours} />
                </td>
                <td>
                  <div className="pc-row-actions">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => act(v, "approve")}>
                      Approve
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => act(v, "muteAudio")}>
                      Mute audio
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() =>
                        setDialog({
                          video: v,
                          title: "Take down this video?",
                          body: `“${v.title || "Untitled video"}” will be removed and demonetised. The creator is notified with your reason.`,
                        })
                      }
                    >
                      Take down
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {dialog ? (
        <ActionDialog
          title={dialog.title}
          body={dialog.body}
          confirmLabel="Take down"
          askReason
          defaultReason="IT Rules 2021 violation"
          onConfirm={(reason) => act(dialog.video, "reject", reason)}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

function KeywordBlacklist() {
  const [rows, setRows] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("anti_national");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    axios
      .get("admin/contentModeration/keywords")
      .then((r) => setRows(r.data.status ? r.data.keywords : []))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setSaving(true);
    try {
      const res = await axios.post("admin/contentModeration/keywords/add", { keyword: keyword.trim(), category }).then((r) => r.data);
      setToast(res.status ? "success" : "error", res.message);
      if (res.status) {
        setKeyword("");
        load();
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    const res = await axios.delete("admin/contentModeration/keywords/delete", { params: { keywordId: row._id } }).then((r) => r.data);
    setToast(res.status ? "success" : "error", res.message);
    load();
  };

  return (
    <div className="pc-card">
      <form className="pc-card-head" onSubmit={add}>
        <div className="d-flex gap-2 flex-wrap align-items-end w-100">
          <div className="flex-grow-1">
            <label htmlFor="pc-kw" className="pc-label">Keyword or phrase</label>
            <input id="pc-kw" className="form-control form-control-sm" value={keyword} onChange={(e) => setKeyword(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label htmlFor="pc-kw-cat" className="pc-label">Category</label>
            <select id="pc-kw-cat" className="form-select form-select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABEL).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-sm btn-primary" disabled={saving || !keyword.trim()}>
            Add keyword
          </button>
        </div>
      </form>
      <div className="pc-card-body">
        {!rows ? (
          <div className="pc-muted">Loading…</div>
        ) : !rows.length ? (
          <div className="pc-muted">No keywords yet. Titles, descriptions and transcripts matching a keyword are held for review.</div>
        ) : (
          <div className="d-flex flex-wrap gap-2">
            {rows.map((r) => (
              <span key={r._id} className="pc-chip">
                {r.keyword} · {CATEGORY_LABEL[r.category] || r.category}{" "}
                <button type="button" className="btn btn-link btn-sm p-0 text-danger align-baseline" aria-label={`Remove ${r.keyword}`} onClick={() => remove(r)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModerationQueue() {
  const [tab, setTab] = useState("queue");
  const [slaHours, setSlaHours] = useState(36);

  useEffect(() => {
    fetchPlatformConfig()
      .then((d) => {
        const sla = d.sections?.find((s) => s.key === "moderation")?.values.grievanceSlaHours;
        if (sla) setSlaHours(Number(sla));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="pc-page">
      <div className="pc-page-head">
        <h4 className="pc-page-title">Content Moderation</h4>
        <div className="pc-page-sub">
          Videos held by keyword screening (title, description, audio transcript) or by user reports. IT Rules 2021 require a decision within {slaHours} hours.
        </div>
      </div>
      <div className="pc-tabs" role="tablist">
        <button type="button" role="tab" className="pc-tab" aria-selected={tab === "queue"} onClick={() => setTab("queue")}>
          Review queue
        </button>
        <button type="button" role="tab" className="pc-tab" aria-selected={tab === "keywords"} onClick={() => setTab("keywords")}>
          Keyword blacklist
        </button>
      </div>
      {tab === "queue" ? <ReviewQueue slaHours={slaHours} /> : <KeywordBlacklist />}
    </div>
  );
}

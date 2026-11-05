import React, { useEffect, useState } from "react";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { PageHeader, StatCard, ReferralTable, inr } from "../PartnerNetwork/networkUi";

const PAGE = 20;

// District Franchise: every referral made by its Digital Partners.
export default function FranchiseReferrals() {
  const [data, setData] = useState({ referrals: [], total: 0, summary: null, partners: [] });
  const [stage, setStage] = useState("");
  const [partner, setPartner] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`admin/franchisePortal/referrals?stage=${stage}&partnerUserId=${partner}&start=${page}&limit=${PAGE}`)
      .then((res) => {
        setLoading(false);
        if (res.data.status) setData(res.data);
        else setToast("error", res.data.message);
      })
      .catch(() => {
        setLoading(false);
        setToast("error", "Couldn't load referrals.");
      });
  }, [stage, partner, page]);

  const s = data.summary;
  const pages = Math.max(1, Math.ceil((data.total || 0) / PAGE));

  return (
    <div className="pn-page">
      <PageHeader title="Referrals" subtitle="New users who joined with your Digital Partners' referral codes, and where each one is in the reward workflow." />

      {s && (
        <div className="pn-stats">
          <StatCard tone="info" label="Total referrals" value={s.total} hint={`${s.valid} valid`} />
          <StatCard tone="warning" label="Awaiting watch time" value={s.awaitingWatchTime} />
          <StatCard tone="accent" label="Completed" value={s.completed} />
          <StatCard label="Rewards paid" value={inr(s.rewardInrReleased)} hint={`${inr(s.rewardInrOnHold)} on hold`} />
          <StatCard tone="danger" label="Flagged / missed" value={s.flagged + s.expired} hint={`${s.flagged} flagged · ${s.expired} missed`} />
        </div>
      )}

      <div className="pn-panel">
        <div className="pn-panel-head">
          <h6>Referral log</h6>
          <div className="pn-filters">
            <select className="form-control" value={partner} onChange={(e) => { setPartner(e.target.value); setPage(1); }} aria-label="Filter by partner">
              <option value="">All partners</option>
              {(data.partners || []).map((p) => <option key={p.userId} value={p.userId}>{p.fullName}</option>)}
            </select>
            <select className="form-control" value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }} aria-label="Filter by stage">
              <option value="">All stages</option>
              <option value="AWAITING_WATCH_TIME">Awaiting watch time</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Window missed</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>
        <ReferralTable referrals={data.referrals} loading={loading} emptyText={stage || partner ? "No referrals match these filters." : "No referrals yet. They appear here as soon as someone signs up with a partner's code."} />
        {data.total > PAGE && (
          <div className="d-flex justify-content-between align-items-center p-3">
            <small className="pn-muted">Page {page} of {pages} · {data.total} referrals</small>
            <div className="pn-actions">
              <button className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <button className="btn btn-outline-secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

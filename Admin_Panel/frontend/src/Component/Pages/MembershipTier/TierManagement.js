import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import Button from "../../extra/Button";
import axios from "axios";
import { setToast } from "../../../util/toast";

const emptyForm = {
  tierName: "",
  level: 1,
  tierType: "TASKER",
  membershipPrice: 0,
  description: "",
  isDefault: false,
  isActive: true,
  // TASKER fields
  dailyEarningCapInCoins: 1000,
  dailyEarningCapInINR: 100,
  dailyAdLimit: 20,
  dailyLikeLimit: 5,
  dailyCommentLimit: 2,
  coinMultiplier: 1.0,
  adCreditsGranted: 0,
  // CREATOR fields
  creatorRevenueSharePercentage: 70,
  companyRevenueSharePercentage: 30,
  minSubscribersRequired: 0,
  maxSubscribers: 0,
  maxEarningPerVideoInINR: 1000,
  upgradeFeeInINR: 0,
};

export default function TierManagement() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingTierId, setEditingTierId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchTiers = () => {
    setLoading(true);
    axios
      .get("admin/membershipTier/getTiers")
      .then((res) => {
        setLoading(false);
        if (res.data.status) setTiers(res.data.tiers);
      })
      .catch((err) => {
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const setField = (key) => (e) => {
    const raw = e && e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => ({ ...f, [key]: raw }));
  };

  const openAddModal = (tierType) => {
    setEditingTierId(null);
    setForm({ ...emptyForm, tierType: tierType || "TASKER" });
    setOpenModal(true);
  };

  const openEditModal = (tier) => {
    setEditingTierId(tier._id);
    setForm({ ...emptyForm, ...tier });
    setOpenModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.tierName) {
      setToast("warning", "Tier name is required!");
      return;
    }

    // store() upserts on {tierType, level} — tierType is fixed once a tier
    // exists (previously this form never sent tierType at all, so it
    // silently defaulted to TASKER server-side: every "edit" from this page
    // actually created/overwrote a TASKER tier, and Creator VIP tiers were
    // completely unreachable from the admin panel).
    axios
      .post("admin/membershipTier/store", {
        tierName: form.tierName,
        level: Number(form.level),
        tierType: form.tierType === "CREATOR" ? "CREATOR" : "TASKER",
        membershipPrice: Number(form.membershipPrice),
        description: form.description,
        isDefault: !!form.isDefault,
        isActive: form.isActive !== false,
        dailyEarningCapInCoins: Number(form.dailyEarningCapInCoins),
        dailyEarningCapInINR: Number(form.dailyEarningCapInINR),
        dailyAdLimit: Number(form.dailyAdLimit),
        dailyLikeLimit: Number(form.dailyLikeLimit),
        dailyCommentLimit: Number(form.dailyCommentLimit),
        coinMultiplier: Number(form.coinMultiplier),
        adCreditsGranted: Number(form.adCreditsGranted),
        creatorRevenueSharePercentage: Number(form.creatorRevenueSharePercentage),
        companyRevenueSharePercentage: Number(form.companyRevenueSharePercentage),
        minSubscribersRequired: Number(form.minSubscribersRequired),
        maxSubscribers: Number(form.maxSubscribers),
        maxEarningPerVideoInINR: Number(form.maxEarningPerVideoInINR),
        upgradeFeeInINR: Number(form.upgradeFeeInINR),
      })
      .then((res) => {
        if (res.data.status) {
          setToast("success", res.data.message);
          setOpenModal(false);
          fetchTiers();
        } else {
          setToast("error", res.data.message);
        }
      })
      .catch((err) => {
        console.error(err);
        setToast("error", "Failed to save tier");
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this membership tier?")) {
      axios
        .delete(`admin/membershipTier/destroy?tierId=${id}`)
        .then((res) => {
          if (res.data.status) {
            setToast("success", res.data.message);
            fetchTiers();
          }
        })
        .catch((err) => console.error(err));
    }
  };

  const creatorTiers = tiers.filter((t) => t.tierType === "CREATOR");
  const taskerTiers = tiers.filter((t) => t.tierType !== "CREATOR");

  const TierCard = ({ tier }) => (
    <div className="col-md-6 col-lg-3" key={tier._id}>
      <div className={`card h-100 shadow-sm border-0 ${tier.isDefault ? "border-primary border-2" : ""}`}>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="card-title fw-bold">{tier.tierName}</h5>
            <span className="badge bg-secondary">Level {tier.level}</span>
          </div>
          {tier.isDefault && <span className="badge bg-primary mb-3">Default Tier</span>}
          {tier.isActive === false && <span className="badge bg-danger mb-3 ms-1">Inactive</span>}
          <h4 className="text-primary fw-bold mb-3">
            {tier.membershipPrice === 0 ? "Free" : `₹ ${tier.membershipPrice}`}
          </h4>
          {tier.tierType === "CREATOR" ? (
            <ul className="list-unstyled text-muted small">
              <li className="mb-2"><strong>Creator Revenue Share:</strong> {tier.creatorRevenueSharePercentage}%</li>
              <li className="mb-2"><strong>Platform Share:</strong> {tier.companyRevenueSharePercentage}%</li>
              <li className="mb-2"><strong>Min Subscribers:</strong> {tier.minSubscribersRequired}</li>
              <li className="mb-2"><strong>Max Earning / Video:</strong> ₹{tier.maxEarningPerVideoInINR}</li>
            </ul>
          ) : (
            <ul className="list-unstyled text-muted small">
              <li className="mb-2"><strong>Daily Earning Cap:</strong> {tier.dailyEarningCapInCoins} coins (₹{tier.dailyEarningCapInINR})</li>
              <li className="mb-2"><strong>Daily Ad Watch Limit:</strong> {tier.dailyAdLimit} Ads</li>
              <li className="mb-2"><strong>Coin Multiplier:</strong> {tier.coinMultiplier}x</li>
              <li className="mb-2"><strong>Ad Credits Granted:</strong> {tier.adCreditsGranted} credits</li>
            </ul>
          )}
          <p className="text-muted small">{tier.description}</p>
        </div>
        <div className="card-footer bg-transparent border-0 text-end">
          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEditModal(tier)}>Edit</button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(tier._id)}>Delete</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mainPage p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Title name="User Membership Tiers & Ad Credit Caps" />
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Creator VIP Tiers</h6>
        <Button btnName="Add Creator Tier" newClass="btn-theme" onClick={() => openAddModal("CREATOR")} />
      </div>
      <div className="row g-4 mb-4">
        {loading ? (
          <div className="col-12 text-center py-3">Loading Tiers...</div>
        ) : creatorTiers.length === 0 ? (
          <div className="col-12 text-center py-3">No Creator tiers configured yet.</div>
        ) : (
          creatorTiers.map((tier) => <TierCard tier={tier} key={tier._id} />)
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="mb-0">Tasker Tiers</h6>
        <Button btnName="Add Tasker Tier" newClass="btn-theme" onClick={() => openAddModal("TASKER")} />
      </div>
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-3">Loading Tiers...</div>
        ) : taskerTiers.length === 0 ? (
          <div className="col-12 text-center py-3">No Tasker tiers configured yet.</div>
        ) : (
          taskerTiers.map((tier) => <TierCard tier={tier} key={tier._id} />)
        )}
      </div>

      {openModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTierId ? "Edit" : "Add"} {form.tierType === "CREATOR" ? "Creator" : "Tasker"} Tier
                </h5>
                <button type="button" className="btn-close" onClick={() => setOpenModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {!editingTierId && (
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tier Category *</label>
                        <select className="form-control" value={form.tierType} onChange={setField("tierType")}>
                          <option value="TASKER">Tasker (viewer/earner ladder)</option>
                          <option value="CREATOR">Creator (VIP Pass ladder)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="row">
                    <div className="col-md-8 mb-3">
                      <label className="form-label">Tier Name *</label>
                      <input type="text" className="form-control" value={form.tierName} onChange={setField("tierName")} required />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">Level *</label>
                      <input type="number" className="form-control" value={form.level} onChange={setField("level")} required />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Price (INR)</label>
                      <input type="number" className="form-control" value={form.membershipPrice} onChange={setField("membershipPrice")} />
                    </div>
                    <div className="col-md-3 mb-3 d-flex align-items-center mt-3">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={!!form.isDefault} onChange={setField("isDefault")} id="isDefaultCheck" />
                        <label className="form-check-label" htmlFor="isDefaultCheck">Default Tier</label>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3 d-flex align-items-center mt-3">
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={form.isActive !== false} onChange={setField("isActive")} id="isActiveCheck" />
                        <label className="form-check-label" htmlFor="isActiveCheck">Active</label>
                      </div>
                    </div>
                  </div>

                  {form.tierType === "CREATOR" ? (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Creator Revenue Share (%)</label>
                          <input type="number" className="form-control" value={form.creatorRevenueSharePercentage} onChange={setField("creatorRevenueSharePercentage")} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Platform Revenue Share (%)</label>
                          <input type="number" className="form-control" value={form.companyRevenueSharePercentage} onChange={setField("companyRevenueSharePercentage")} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Min Subscribers Required</label>
                          <input type="number" className="form-control" value={form.minSubscribersRequired} onChange={setField("minSubscribersRequired")} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Max Subscribers</label>
                          <input type="number" className="form-control" value={form.maxSubscribers} onChange={setField("maxSubscribers")} />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Max Earning / Video (INR)</label>
                          <input type="number" className="form-control" value={form.maxEarningPerVideoInINR} onChange={setField("maxEarningPerVideoInINR")} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Upgrade Fee (INR)</label>
                          <input type="number" className="form-control" value={form.upgradeFeeInINR} onChange={setField("upgradeFeeInINR")} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Daily Cap (Coins)</label>
                          <input type="number" className="form-control" value={form.dailyEarningCapInCoins} onChange={setField("dailyEarningCapInCoins")} />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Daily Cap (INR)</label>
                          <input type="number" className="form-control" value={form.dailyEarningCapInINR} onChange={setField("dailyEarningCapInINR")} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Daily Ad Limit</label>
                          <input type="number" className="form-control" value={form.dailyAdLimit} onChange={setField("dailyAdLimit")} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Daily Like Limit</label>
                          <input type="number" className="form-control" value={form.dailyLikeLimit} onChange={setField("dailyLikeLimit")} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Daily Comment Limit</label>
                          <input type="number" className="form-control" value={form.dailyCommentLimit} onChange={setField("dailyCommentLimit")} />
                        </div>
                        <div className="col-md-3 mb-3">
                          <label className="form-label">Multiplier</label>
                          <input type="number" step="0.1" className="form-control" value={form.coinMultiplier} onChange={setField("coinMultiplier")} />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Ad Credits Granted</label>
                          <input type="number" className="form-control" value={form.adCreditsGranted} onChange={setField("adCreditsGranted")} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="row">
                    <div className="col-12 mb-3">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="2" value={form.description} onChange={setField("description")} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setOpenModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Tier</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Title from "../../extra/Title";
import Input from "../../extra/Input";
import Button from "../../extra/Button";
import axios from "axios";
import { setToast } from "../../../util/toast";
import { uploadFile } from "../../../util/AwsFunction";

const initialForm = {
  businessName: "",
  businessContact: "",
  category: "",
  targetState: "",
  targetDistrict: "",
  adBudgetInr: "",
  durationDays: "",
};

const folderStructure = "localBusinessAd";

export default function PartnerLocalBusinessAds() {
  const [form, setForm] = useState(initialForm);
  const [creativeFile, setCreativeFile] = useState(null);
  const [creativeType, setCreativeType] = useState("image");
  const [submitting, setSubmitting] = useState(false);
  const [ads, setAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  useEffect(() => {
    fetchMyAds();
  }, []);

  const fetchMyAds = () => {
    setLoadingAds(true);
    axios
      .get("admin/partnerPortal/localBusinessAd/myAds")
      .then((res) => {
        setLoadingAds(false);
        if (res.data.status) setAds(res.data.ads || []);
      })
      .catch((err) => {
        setLoadingAds(false);
        console.error(err);
      });
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleCreativeChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setCreativeFile(file);
    setCreativeType(file.type.startsWith("video") ? "video" : "image");
  };

  const resetForm = () => {
    setForm(initialForm);
    setCreativeFile(null);
    setCreativeType("image");
  };

  const handleSubmit = async () => {
    if (!form.businessName || !form.adBudgetInr || !form.durationDays) {
      setToast("error", "Business Name, Ad Budget and Duration are required.");
      return;
    }
    if (!creativeFile) {
      setToast("error", "Please choose an ad creative (image or video).");
      return;
    }

    setSubmitting(true);
    try {
      const { resDataUrl } = await uploadFile(creativeFile, folderStructure);
      const res = await axios.post("admin/partnerPortal/localBusinessAd/submit", {
        ...form,
        adBudgetInr: Number(form.adBudgetInr),
        durationDays: Number(form.durationDays),
        creativeUrl: resDataUrl,
        creativeType,
      });
      if (res.data.status) {
        setToast("success", res.data.message || "Ad submitted for review.");
        resetForm();
        fetchMyAds();
      } else {
        setToast("error", res.data.message);
      }
    } catch (err) {
      console.error(err);
      setToast("error", err.response?.data?.message || err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING_REVIEW: "bg-warning",
      ACTIVE: "bg-success",
      REJECTED: "bg-danger",
    };
    return <span className={`badge ${map[status] || "bg-secondary"}`}>{status}</span>;
  };

  return (
    <div className="mainPage p-4">
      <Title name="Local Business Ads" />

      <div className="card shadow-sm border-0 p-3 mb-4">
        <h5 className="mb-3">Submit a New Local Business Ad</h5>
        <p className="text-muted small">
          Source a local business ad in your area. Our team reviews every submission before it goes live.
        </p>
        <div className="row">
          <div className="col-md-6">
            <Input
              label="Business Name"
              placeholder="Enter business name..."
              value={form.businessName}
              onChange={handleChange("businessName")}
            />
          </div>
          <div className="col-md-6">
            <Input
              label="Business Contact"
              placeholder="Phone / email..."
              value={form.businessContact}
              onChange={handleChange("businessContact")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              label="Category"
              placeholder="e.g. Restaurant, Retail..."
              value={form.category}
              onChange={handleChange("category")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              type="number"
              label="Ad Budget (INR)"
              placeholder="Enter budget..."
              value={form.adBudgetInr}
              onChange={handleChange("adBudgetInr")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              label="Target State"
              placeholder="Defaults to your own state if left blank"
              value={form.targetState}
              onChange={handleChange("targetState")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              label="Target District"
              placeholder="Defaults to your own district if left blank"
              value={form.targetDistrict}
              onChange={handleChange("targetDistrict")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              type="number"
              label="Duration (Days)"
              placeholder="1 - 90 days"
              value={form.durationDays}
              onChange={handleChange("durationDays")}
            />
          </div>
          <div className="col-md-6 mt-2">
            <Input
              type="file"
              label="Ad Creative"
              accept="image/*,video/*"
              onChange={handleCreativeChange}
            />
            {creativeFile && (
              <p className="extention-show mb-0">
                Selected: {creativeFile.name} ({creativeType})
              </p>
            )}
          </div>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <Button
            btnName={submitting ? "Submitting..." : "Submit Ad"}
            newClass="submit-btn"
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
          />
        </div>
      </div>

      <div className="card shadow-sm border-0 p-3">
        <h5 className="mb-3">My Submitted Ads</h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>No.</th>
                <th>Business Name</th>
                <th>Category</th>
                <th>Budget (₹)</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Impressions</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {loadingAds ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">Loading your ads...</td>
                </tr>
              ) : ads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">You haven't submitted any local business ads yet.</td>
                </tr>
              ) : (
                ads.map((item, idx) => (
                  <tr key={item._id}>
                    <td>{idx + 1}</td>
                    <td>{item.businessName}</td>
                    <td>{item.category || "—"}</td>
                    <td>{item.adBudgetInr}</td>
                    <td>{item.durationDays} day(s)</td>
                    <td>{statusBadge(item.status)}</td>
                    <td>{item.impressionCount || 0}</td>
                    <td>{item.clickCount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

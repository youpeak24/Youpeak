import React, { useEffect, useState } from "react";
import "../../../assets/css/setting.css";
import AppSetting from "./AppSetting";
import PaymentSetting from "./PaymentSetting";
import PaymentGatewaySetting from "./PaymentGatewaySetting";
import MonetizationSetting from "./MonetizationSetting";
import StorageSettingPage from "./StorageSettingPage";
import Button from "../../extra/Button";

const TAB_LABELS = [
  "Setting",
  "Storage Setting",
  "Payment Setting",
  "Monetize & Ads Setting",
  "Withdraw Setting",
];

const ManageSetting = () => {
  const [multiButtonSelect, setMultiButtonSelect] = useState("Setting");
  const [appSubmitTrigger, setAppSubmitTrigger] = useState(0);
  const [storageSubmitTrigger, setStorageSubmitTrigger] = useState(0);
  const [paymentSubmitTrigger, setPaymentSubmitTrigger] = useState(0);
  const [monetizationSubmitTrigger, setMonetizationSubmitTrigger] = useState(0);
  const [withdrawSubmitTrigger, setWithdrawSubmitTrigger] = useState(0);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("multiButton");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (TAB_LABELS.includes(parsed)) {
          setMultiButtonSelect(parsed);
        }
      }
    } catch (_) {
      /* ignore */
    }
  }, []);

  const handleTabClick = (tab) => {
    setMultiButtonSelect(tab);
    sessionStorage.setItem("multiButton", JSON.stringify(tab));
  };

  const isActive = (tab) => multiButtonSelect === tab;
  const handleHeaderSubmit = () => {
    if (multiButtonSelect === "Setting") {
      setAppSubmitTrigger((prev) => prev + 1);
    } else if (multiButtonSelect === "Storage Setting") {
      setStorageSubmitTrigger((prev) => prev + 1);
    } else if (multiButtonSelect === "Payment Setting") {
      setPaymentSubmitTrigger((prev) => prev + 1);
    } else if (multiButtonSelect === "Monetize & Ads Setting") {
      setMonetizationSubmitTrigger((prev) => prev + 1);
    } else if (multiButtonSelect === "Withdraw Setting") {
      setWithdrawSubmitTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="userPage mainAdminGrid">
      <div className="settings-shell">
        <div className="settings-toolbar settings-toolbar-sticky">
          <header className="settings-page-header">
            <div className="d-flex justify-content-between align-items-start gap-3 w-100">
              <div>
                <h1 className="settings-page-title">Setting</h1>
                <p className="settings-page-subtitle">
                  Manage your application configuration and preferences.
                </p>
              </div>
              {TAB_LABELS.includes(multiButtonSelect) && (
                <Button
                  btnName={"Submit"}
                  type={"button"}
                  onClick={handleHeaderSubmit}
                  newClass={"submit-btn"}
                />
              )}
            </div>
          </header>

          <div className="settings-toolbar-row settings-toolbar-row--tabs">
            <nav className="settings-nav" aria-label="Settings sections">
              <button
                type="button"
                className={`settings-nav-link ${isActive("Setting") ? "active" : ""}`}
                onClick={() => handleTabClick("Setting")}
              >
                <span className="settings-nav-link-inner">
                  <i className="bi bi-gear settings-nav-icon" aria-hidden />
                  Setting
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-link ${isActive("Storage Setting") ? "active" : ""}`}
                onClick={() => handleTabClick("Storage Setting")}
              >
                <span className="settings-nav-link-inner">
                  <i className="bi bi-hdd-stack settings-nav-icon" aria-hidden />
                  Storage Setting
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-link ${isActive("Payment Setting") ? "active" : ""}`}
                onClick={() => handleTabClick("Payment Setting")}
              >
                <span className="settings-nav-link-inner">
                  <i className="bi bi-credit-card settings-nav-icon" aria-hidden />
                  Payment Setting
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-link ${isActive("Monetize & Ads Setting") ? "active" : ""}`}
                onClick={() => handleTabClick("Monetize & Ads Setting")}
              >
                <span className="settings-nav-link-inner">
                  <i className="bi bi-megaphone settings-nav-icon" aria-hidden />
                  Monetize &amp; Ads Setting
                </span>
              </button>

              <button
                type="button"
                className={`settings-nav-link ${isActive("Withdraw Setting") ? "active" : ""}`}
                onClick={() => handleTabClick("Withdraw Setting")}
              >
                <span className="settings-nav-link-inner">
                  <i className="bi bi-wallet2 settings-nav-icon" aria-hidden />
                  Withdraw Setting
                </span>
              </button>
            </nav>
          </div>
        </div>

        <div className="settings-shell-body">
          <div className="settings-page">
            <div className="settings-layout">
              <div className="settings-tab-panel settings-content">
                {multiButtonSelect === "Setting" && (
                  <AppSetting submitTrigger={appSubmitTrigger} />
                )}
                {multiButtonSelect === "Storage Setting" && (
                  <StorageSettingPage submitTrigger={storageSubmitTrigger} />
                )}
                {multiButtonSelect === "Payment Setting" && (
                  <PaymentSetting submitTrigger={paymentSubmitTrigger} />
                )}
                {multiButtonSelect === "Withdraw Setting" && (
                  <PaymentGatewaySetting submitTrigger={withdrawSubmitTrigger} />
                )}
                {multiButtonSelect === "Monetize & Ads Setting" && (
                  <MonetizationSetting submitTrigger={monetizationSubmitTrigger} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ManageSetting;

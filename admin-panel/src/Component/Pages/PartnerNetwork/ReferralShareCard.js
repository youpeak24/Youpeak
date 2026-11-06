import React, { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { setToast } from "../../../util/toast";

// Same link the Youpeak app shares for a referral code
// (youpeak/lib/core/settings/app_settings.dart → DeepLinkServices.onGenerateLink):
// opening it in the app / web app applies the code at sign-up automatically.
const APP_DOMAIN = process.env.REACT_APP_APP_DOMAIN || "youpeak.app";

export const referralLink = (code) =>
  `https://${APP_DOMAIN}/share?${new URLSearchParams({ pageRoutes: "referralCode", referralCode: code }).toString()}`;

export default function ReferralShareCard({ code, name }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState("");
  if (!code) return null;
  const link = referralLink(code);

  const copy = (text, what) => {
    const done = () => {
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done, () => setToast("error", "Copy failed — select the text instead."));
    } else {
      setToast("info", text);
    }
  };

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `youpeak-referral-${code}.png`;
    a.click();
  };

  const shareText = `Join me on Youpeak! Sign up with my referral code ${code}: ${link}`;

  return (
    <div className="pn-share">
      <div className="pn-share-qr">
        <QRCodeCanvas ref={canvasRef} value={link} size={148} marginSize={2} level="M" title={`Referral QR for ${name || code}`} />
      </div>
      <div className="pn-share-body">
        <div className="pn-stat-label">Referral code</div>
        <div className="d-flex align-items-center gap-2 flex-wrap mt-1">
          <span className="pn-share-code">{code}</span>
          <button className="btn btn-sm btn-outline-success" onClick={() => copy(code, "code")}>{copied === "code" ? "Copied" : "Copy code"}</button>
        </div>
        <div className="pn-stat-label mt-3">Referral link</div>
        <div className="pn-share-link">
          <input className="form-control" value={link} readOnly aria-label="Referral link" onFocus={(e) => e.target.select()} />
          <button className="btn btn-outline-success" onClick={() => copy(link, "link")}>{copied === "link" ? "Copied" : "Copy link"}</button>
        </div>
        <div className="pn-actions mt-2">
          <a className="btn btn-outline-success" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a>
          <button className="btn btn-outline-secondary" onClick={downloadQr}>Download QR</button>
        </div>
        <small className="pn-muted d-block mt-2">
          The link opens the Youpeak app (or web app) and applies this code when the person signs up. They can also type the code in the app.
        </small>
      </div>
    </div>
  );
}

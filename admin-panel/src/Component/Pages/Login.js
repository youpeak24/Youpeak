import { useEffect, useState } from "react";
import Button from "../extra/Button";
import Input from "../extra/Input";
import Logo from "../../assets/images/logo.png";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../store/admin/admin.action";
import { connect, useSelector } from "react-redux";
import { projectName } from "../../util/config";
import { setToast } from "../../util/toast";

const Login = (props) => {
  let navigate = useNavigate();
  const isAuth = useSelector((state) => state.admin.isAuth);

  useEffect(() => {
    isAuth && navigate("/admin");
  }, [isAuth]);

  // Set by util/AxiosInterceptor.js when a franchise/partner account was
  // disabled mid-session.
  useEffect(() => {
    try {
      const reason = sessionStorage.getItem("logoutReason");
      if (reason) {
        sessionStorage.removeItem("logoutReason");
        setToast("error", reason);
      }
    } catch (e) { /* ignore */ }
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ email: "", password: "" });

  const handleSubmit = async () => {
    if (!email || !password) {
      let error = {};
      if (!email) error.email = "Email Is Required !";
      if (!password) error.password = "Password is required !";
      return setError({ ...error });
    } else {
      let login = { email, password };
      setLoading(true);
      props.loginAdmin(login, navigate, () => {
        setLoading(false);
      });
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ─── Left Panel ─── */}
      <div
        className="d-lg-flex d-none"
        style={{
          width: "50%",
          background: "#111827",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          borderRight: "1px solid #1f2937",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={Logo} alt="Logo" width={32} height={32} />
          <span
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "-0.02em",
            }}
          >
            {projectName}
          </span>
        </div>

        {/* Center content */}
        <div>
          <div
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#fff",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 8px",
              marginBottom: "20px",
            }}
          >
            Admin Console
          </div>
          <h1
            style={{
              color: "#fff",
              fontSize: "2rem",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              marginBottom: "16px",
            }}
          >
            Control Center &amp;
            <br />
            Platform Management
          </h1>
          <p
            style={{
              color: "#9ca3af",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              maxWidth: "360px",
            }}
          >
            Manage users, live broadcasts, monetization, coin transactions,
            and app settings for the {projectName} platform.
          </p>

          {/* Feature list */}
          <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {["User & Content Management", "Financial Controls & Plans", "Real-time Analytics", "Fraud & Security"].map((item) => (
              <div
                key={item}
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    background: "#16a34a",
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#d1d5db", fontSize: "0.8rem" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: "#4b5563", fontSize: "0.72rem" }}>
          © {new Date().getFullYear()} {projectName}. All rights reserved.
        </p>
      </div>

      {/* ─── Right Panel ─── */}
      <div
        style={{
          flex: 1,
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>
          {/* Mobile logo */}
          <div className="d-flex d-lg-none align-items-center gap-2 mb-4">
            <img src={Logo} alt="Logo" width={28} height={28} />
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
              {projectName}
            </span>
          </div>

          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}
          >
            Sign in
          </h2>
          <p style={{ color: "#6b7280", fontSize: "0.8rem", marginBottom: "28px" }}>
            Enter your credentials to access the admin console.
          </p>

          {/* Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            <Input
              label="Email"
              name="email"
              id="loginEmail"
              placeholder="you@example.com"
              type="email"
              value={email}
              errorMessage={error.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError({ ...error, email: e.target.value ? "" : "Email Is Required" });
              }}
              autoComplete="username"
              onKeyPress={handleKeyPress}
            />
            <Input
              label="Password"
              name="password"
              id="loginPassword"
              placeholder="••••••••"
              type="password"
              value={password}
              errorMessage={error.password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError({ ...error, password: e.target.value ? "" : "Password Is Required" });
              }}
              autoComplete="current-password"
              onKeyPress={handleKeyPress}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "20px",
                marginTop: "-6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#16a34a",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/forgotPassword")}
              >
                Forgot password?
              </span>
            </div>

            <Button
              btnName={loading ? "Signing in..." : "Sign in"}
              newClass="submit-btn w-100"
              onClick={handleSubmit}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(null, { loginAdmin })(Login);

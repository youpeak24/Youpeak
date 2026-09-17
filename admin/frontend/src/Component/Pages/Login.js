import { useEffect, useState } from "react";
import Button from "../extra/Button";
import Input from "../extra/Input";
import Logo from "../../assets/images/logo.svg";
import LoginContain from "../../assets/images/LoginContain.png";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../store/admin/admin.action";
import LoginImg from "../../assets/images/login2.png";
import { connect, useSelector } from "react-redux";
import { projectName } from "../../util/config";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { setToast } from "../../util/toast";

const Login = (props) => {
  let navigate = useNavigate();

  const isAuth = useSelector((state) => state.admin.isAuth);

  // Commented out to prevent navigation race condition
  useEffect(() => {
    isAuth && navigate("/admin");
  }, [isAuth]);

 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  

  const [error, setError] = useState({
    email: "",
    password: "",
  });

  const copyToClipboard = async (text) => {
    const value = String(text ?? "");
    if (!value) return false;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (err) {
      // Fall back below.
    }

    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
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

  

  const handleSubmit = async () => {
    if (!email || !password) {
      let error = {};
      if (!email) error.email = "Email Is Required !";
      if (!password) error.password = "password is required !";
      return setError({ ...error });
    } else {
      let login = {
        email,
        password,
      };

      setLoading(true)
      props.loginAdmin(login, navigate, () => {
        setLoading(false)
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
    <>

      <div className="d-flex overflow-hidden" style={{ height: "100vh" }}>
        <div className="d-lg-flex d-none col-lg-7 col-xl-6 p-5 h-100 flex-column justify-content-between align-items-start" style={{
          background: "var(--new-color-gradient)",
          color: "#ffffff"
        }}>
          <div>
            <div className="d-flex align-items-center gap-3 mb-5">
              <img src={Logo} alt="YouPeak" height={55} width={55} />
              <h1 className="fw-bold m-0" style={{ fontSize: "2.2rem", letterSpacing: "0.5px" }}>YouPeak</h1>
            </div>
            <h2 className="fw-bold mt-5" style={{ fontSize: "2.6rem", lineHeight: "1.2" }}>
              Control Center & Platform Management
            </h2>
            <p style={{ opacity: 0.9, fontSize: "1.15rem", maxWidth: "480px", marginTop: "1.2rem" }}>
              Manage users, live video broadcasts, monetization rewards, coin transactions, and app settings dynamically on YouPeak.
            </p>
          </div>
          <div style={{ opacity: 0.85, fontSize: "0.95rem" }}>
            © {new Date().getFullYear()} YouPeak Platform. All rights reserved.
          </div>
        </div>
        <div className="col-12 col-lg-5 col-xl-6 h-100 overflow-auto" style={{ backgroundColor: "#F8FAFC", color: "#1C1C1E" }}>
          <div className="p-4 p-md-5 d-flex align-items-center justify-content-center min-vh-100">
            <div className="w-100 mx-auto" style={{ maxWidth: "440px" }}>
              <div>
                <img
                  src={Logo}
                  alt="Logo"
                  className="mb-2"
                  height={75}
                  width={75}
                />
              </div>
              <h2 className="fw-bold" style={{ color: "#1C1C1E" }}>Login to your account</h2>
              <p style={{ color: "#55606E", fontSize: "0.95rem" }}>
                Enter your credentials to access your {projectName} admin console.
              </p>
              <Input
                label={`Email`}
                name={"email"}
                id={`loginEmail`}
                placeholder={"Enter Email"}
                type={`email`}
                value={email}
                errorMessage={error.email && error.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      email: `Email Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      email: "",
                    });
                  }
                }}
                autoComplete="username"
                onKeyPress={handleKeyPress}
              />
              <Input
                label={`Password`}
                name={"password"}
                id={`loginPassword`}
                placeholder={"Enter Password"}
                type={`password`}
                value={password}
                errorMessage={error.password && error.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      password: `Password Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      password: "",
                    });
                  }
                }}
                autoComplete="current-password"
                onKeyPress={handleKeyPress}
              />

              <div className="w-100" >
                <h4
                  className="cursor-pointer fs-6 text-end text-secondary"
                  style={{ fontWeight: 600, fontSize: "small", color: "var(--new-color)" }}
                  onClick={() => navigate("/forgotPassword")}
                >
                  Forgot Password ?
                </h4>
              </div>
              <div className="d-flex flex-column justify-content-center w-100 gap-3 mt-4">
                <Button
                  btnName={loading ? "Loading..." : "Login"}
                  newClass={"submit-btn w-100 fw-medium"}
                  onClick={handleSubmit}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default connect(null, { loginAdmin })(Login);

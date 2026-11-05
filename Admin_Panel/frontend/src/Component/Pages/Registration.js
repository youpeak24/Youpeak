import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { signupAdmin } from "../store/admin/admin.action";
import LoginImg from "../../assets/images/login2.png";
import Logo from "../../assets/images/logo.png";
import Input from "../extra/Input";
import Button from "../extra/Button";
import { projectName } from "../../util/config";
import { useNavigate } from "react-router-dom";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

const Registration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState({
    email: "",
    password: "",
    code: "",
    newPassword: "",
  });

  const handleSubmit = async () => {
    if (
      !email ||
      !password ||
      !code ||
      !newPassword ||
      newPassword !== password
    ) {
      let error = {};
      if (!email) error.email = "Email Is Required !";
      if (!password) error.password = "password is required !";
      if (!code) error.code = "Purchase code is required !";
      if (!newPassword) error.newPassword = "Confirm password is required !";
      if (newPassword !== password)
        error.newPassword = "Doesn't match password to confirm password !";
      return setError({ ...error });
    } else {
      let login = {
        email,
        newPassword,
        password,
        code,
      };

      try {
        setLoading(true); // ✅ disable button immediately
        await dispatch(signupAdmin(login, navigate)); // ✅ wait for API
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // ✅ enable again only after API finishes
      }
    }
  };

  const [type, setType] = useState("password");
  const hideShow = () => {
    type === "password" ? setType("text") : setType("password");
  };

  return (
    <>
      <div className="d-flex overflow-hidden" style={{ height: "100vh" }}>
        <div className="d-lg-block d-none col-lg-7 col-xl-6 p-0 h-100">
          <img src={LoginImg} alt="Login" className=" w-100 h-100" style={{ objectFit: "cover" }} />
        </div>
        <div className="col-12 col-lg-5 col-xl-6 h-100 overflow-auto bg-white">
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
              <h2 className="fw-semibold">Sign Up to your account</h2>
              <p className="text-secondary">
                Let's connect, chat, and spark real connections. Enter your
                credentials to continue your journey on {projectName}.
              </p>
              <Input
                label={`Email`}
                placeholder={"Enter Email"}
                id={`loginEmail`}
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
              />
              <div className="custom-input">
                <label>Password</label>
                <div className="input-group">
                  <input
                    type={type}
                    value={password}

                    className="form-control border border-end-0 password-input"
                    placeholder="Enter Password"
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
                  />
                  <span
                    className="input-group-text border border-start-0"
                    id="basic-addon2"
                  >
                    {type === "password" ? (
                      <IconEyeOff
                      onClick={hideShow}
                      className="text-secondary cursor-pointer"
                      />
                    ) : (
                      <IconEye
                        onClick={hideShow}
                        className="text-secondary cursor-pointer"
                      />
                    )}
                  </span>
                </div>
                <p className="errorMessage">
                  {error.password && error.password}
                </p>
              </div>
              <div className="custom-input">
                <label>Confirm Password</label>
                <div className="input-group">
                  <input
                    type={type}
                    value={newPassword}
                    className="form-control border border-end-0 password-input"
                    placeholder="Enter Confirm Password"
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          newPassword: `Confirm Password Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          newPassword: "",
                        });
                      }
                    }}
                  />
                  <span
                    className="input-group-text border border-start-0"
                    id="basic-addon2"
                  >
                    {type === "password" ? (
                      <IconEye
                        onClick={hideShow}
                        className="text-secondary cursor-pointer"
                      />
                    ) : (
                      <IconEyeOff
                        onClick={hideShow}
                        className="text-secondary cursor-pointer"
                      />
                    )}
                  </span>
                </div>
                <p className="errorMessage">
                  {error.newPassword && error.newPassword}
                </p>
              </div>

              <Input
                label={`Purchase Code`}
                id={`loginpurachse Code`}
                type={`text`}
                placeholder={"Enter purchase code"}
                value={code}
                errorMessage={error.code && error.code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      code: `code Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      code: "",
                    });
                  }
                }}
              />
              <div className="d-flex flex-column justify-content-center w-100 gap-3 mt-4">
                <button
                  className='themeBtn text-center login-btn login w-100 py-2 fw-medium'
                  onClick={handleSubmit}
                  disabled={loading} >{loading ? "Loading..." : "Sign Up"}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Registration;

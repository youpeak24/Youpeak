import React, { useState } from "react";
import { updateCode } from "../store/admin/admin.action";
import { useDispatch } from "react-redux";
import LoginImg from "../../assets/images/loginPage.png";
import Logo from "../../assets/images/logo.png";
import Input from "../extra/Input";
import Button from "../extra/Button";
import { projectName } from "../../util/config";

const Updatecode = () => {
    const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [error, setError] = useState({
    email: "",
    password: "",
    code: "",
  });
  

  const handleSubmit = () => {
    if (!email || !password || !code ) {
      let error = {};
      if (!email) error.email = "Email Is Required !";
      if (!password) error.password = "password is required !";
      if (!code) error.code = "Purchase code is required !";
     
      return setError({ ...error });
    } else {
      let login = {
        email,
        password,
        code,
      };


      dispatch(updateCode(login));
    }
  };
  return (
    <>
      <div className="login-page-content">
        <div className="bg-login">
          <div className="login-page-box">
            <div className="row">
              <div className="col-12 col-md-6 right-login-img d-flex justify-content-center">
                <img src={LoginImg} />
              </div>
              <div className="col-12 col-md-6 text-login">
                <div className="heading-login">
                  <img src={Logo} />
                  <h6>{projectName}</h6>
                </div>
                <div className="login-left-form">
                  <span>Welcome back !!!</span>
                  <h5>Update Code</h5>
                  <Input
                    label={`Email`}
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
                  <Input
                    label={`Password`}
                    id={`loginPassword`}
                    type={`password`}
                    value={password}
                    className={`form-control`}
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
                  />
                
                  <Input
                    label={`Purchase Code`}
                    id={`loginpurachse Code`}
                    type={`text`}
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

                  <div
                    className="d-flex justify-content-center w-100"
                    style={{ width: "400px" }}
                  >
                    <Button
                      btnName={"Sign In"}
                      newClass={"login-btn ms-2"}
                      onClick={handleSubmit}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Updatecode;

import React, { useState } from "react";
import NewTitle from "../extra/Title";
import Button from "../extra/Button";
import Logo from "../../assets/images/logo.png";
import { sendEmail } from "../store/admin/admin.action";
import Input from "../extra/Input";
import { connect } from "react-redux";
import { projectName } from "../../util/config";
import forgetPassword from "../../assets/images/forgetpassword.png";

function ForgotPassword(props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState({
    email: "",
  });

  const isEmail = (value) => {
    const val = value === "" ? 0 : value;
    const validNumber = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);
    return validNumber;
  };

  const handleSubmit = () => {
    const validEmail = isEmail(email);
    if (!email || !validEmail) {
      let error = {};
      if (!email) {
        error.email = "Email Is Required !";
      } else if (!validEmail) {
        error.email = "Email Is Invalid !";
      }
      return setError({ ...error });
    } else {
      let forgotPasswordData = {
        email: email,
      };
      props.sendEmail(forgotPasswordData);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="reset-password">
      <div className="dashboardHeader primeHeader mb-3 p-0">
        <div className="login-page" style={{backgroundImage : `url(${forgetPassword})`}}>
          <div className="bg-login"></div>
          <div className="row">
            <div className="col-12 d-flex justify-content-center align-items-center">
              <div className="login-page-box ">
                <div className="login-box-img">
                  <img src={Logo} />
                  <h5>{projectName}</h5>
                </div>
                <div className="login-form">
                  <h6>Forgot Password...</h6>
                  <Input
                    label={`Email`}
                    id={`loginEmail`}
                    type={`email`}
                    value={email}
                    placeholder={"Enter Email"}
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
                    onKeyPress={handleKeyPress}
                  />
                  <div
                    className="d-flex justify-content-center"
                    style={{ width: "100%" }}
                  >
                    <Button
                      btnName={"Send Email"}
                      onClick={handleSubmit}
                      newClass={"themeBtn text-center login-btn mt-2 p-2 rounded-1 text-center themeBtn w-100 "}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default connect(null, { sendEmail })(ForgotPassword);

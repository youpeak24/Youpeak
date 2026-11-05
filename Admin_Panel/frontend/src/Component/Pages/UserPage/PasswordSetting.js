import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import Input from "../../extra/Input";
import { connect, useDispatch, useSelector } from "react-redux";
import { passwordChange, getUserProfile } from "../../store/user/user.action";


function ProfileSetting(props) {
  const { multiButtonSelectNavigateSet, multiButtonSelectNavigate } = props;
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState();
  const [newPassword, setNewPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [userId, setUserId] = useState("");
  const [isChannel, setIsChannel] = useState("");
  const [error, setError] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { userProfile, countryData } = useSelector((state) => state.user);
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  useEffect(() => {
    dispatch(getUserProfile(dialogueData?._id, dialogueData?.isChannel));
  }, [dispatch, dialogueData]);

  useEffect(() => {
    multiButtonSelectNavigate === "Password"
      ? sessionStorage.setItem(
        "multiButton",
        JSON.stringify(multiButtonSelectNavigate)
      )
      : sessionStorage.removeItem("multiButton");
  }, [multiButtonSelectNavigate]);
  useEffect(() => {
    setUserId(userProfile?._id);
    setIsChannel(userProfile?.isChannel);
    setCurrentPassword(userProfile?.password);
  }, [userProfile]);

  const handleSubmit = () => {

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      newPassword !== confirmPassword
    ) {
      let error = {};
      if (!currentPassword)
        error.currentPassword = "Current Password Is Required !";
      if (!newPassword) error.newPassword = "New Password Is Required !";
      if (!confirmPassword)
        error.confirmPassword = "Confirm Password Is Required !";
      if (newPassword !== confirmPassword)
        error.confirmPassword = "Confirm Password Is Not Same !";
      return setError({ ...error });
    } else {
      let passwordChangeData = {
        oldPass: currentPassword,
        newPass: newPassword,
        confirmPass: confirmPassword,
        userId: userId,
      };
      props.passwordChange(dialogueData?._id, passwordChangeData);
    }
  };

  return (
    <div className="card1 mt-2">
      <div className="cardHeader p-3 ">
        <div className="row d-flex  align-items-center">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-1 mb-sm-0">
            <h5 className="mb-0">Password Setting</h5>
          </div>
        </div>
      </div>
      <div className=" userSettingBox">
        <div className="row d-flex  align-items-center">
          {/* <div className="col-6">
            <h5>Password Setting</h5>
          </div> */}
          <form>
            {/* <div className="col-12 d-flex justify-content-end align-items-center">
              <Button
                newClass={"submit-btn"}
                type={"button"}
                btnName={"Submit"}
                onClick={handleSubmit}
              />
            </div> */}
            <div className="row cardBody p-3">
              <div className="col-6 mt-2">
                <Input
                  label={"Current Password"}
                  name={"currentPassword"}
                  placeholder={"Enter Details..."}
                  value={currentPassword}
                  errorMessage={error.currentPassword && error.currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        currentPassword: `Current Password Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        currentPassword: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-6 mt-2">
                <Input
                  label={"New Password"}
                  name={"newPassword"}
                  placeholder={"Enter Details..."}
                  value={newPassword}
                  errorMessage={error.newPassword && error.newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        newPassword: `New Password Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        newPassword: "",
                      });
                    }
                  }}
                />
              </div>
              <div className="col-6 mt-2">
                <Input
                  label={"Confirm New Password"}
                  name={"confirmNewPassword"}
                  placeholder={"Enter Details..."}
                  value={confirmPassword}
                  errorMessage={error.confirmPassword && error.confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        confirmPassword: `ConfirmNewPassword Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        confirmPassword: "",
                      });
                    }
                  }}
                />
              </div>
            </div>

            <div className="cadrFooter p-2 d-flex justify-content-end align-items-center">
              <Button
                newClass={"submit-btn"}
                type={"button"}
                btnName={"Submit"}
                onClick={handleSubmit}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  passwordChange,
  getUserProfile,
})(ProfileSetting);

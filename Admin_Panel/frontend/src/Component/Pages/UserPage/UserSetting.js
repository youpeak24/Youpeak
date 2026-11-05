import React, { useEffect, useState } from "react";
import NewTitle from "../../extra/Title";
import MultiButton from "../../extra/MultiButton";
import UserProfileSetting from "./UserProfileSetting";
import PasswordSetting from "./PasswordSetting";
import AvatarSetting from "./AvatarSetting";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../../extra/Button";
import { getUserProfile } from "../../store/user/user.action";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { useLocation, useNavigate } from "react-router-dom";
import { Tooltip } from "@mui/material";
import { IconArrowNarrowLeft } from "@tabler/icons-react";

function UserSetting() {
  const [multiButtonSelect, setMultiButtonSelect] = useState("Profile");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const location = useLocation();
  const { userProfile, countryData } = useSelector((state) => state.user);

  const handleClose = () => {
    if (dialogueData) {
      dispatch({
        type: CLOSE_DIALOGUE,
        payload: {
          dialogue: false,
        },
      });

      let dialogueData_ = {
        dialogue: false,
      };
      sessionStorage.setItem("dialogueData", JSON.stringify(dialogueData_));
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (dialogueData?._id) {
      dispatch(getUserProfile(dialogueData._id));
    } else if (location?.state?.id) {
      dispatch(getUserProfile(location.state.id));
    } else {
      navigate("/admin/userTable");
    }
  }, [dispatch, location?.state?.id, dialogueData, navigate]);
  return (
    <div className="userSetting">
      <div className="d-flex justify-content-between align-content-center">
        <div className="w-100">
          <div className="multi-user-btn">
            <NewTitle
              dayAnalyticsShow={false}
              // titleShow={true}
              setMultiButtonSelect={setMultiButtonSelect}
              multiButtonSelect={multiButtonSelect}
              name={`User Profile`}
              labelData={["Profile", "Password", "Avatar"]}
            />
          </div>
        </div>
        <div className="w-100 d-flex justify-content-end align-items-center">
          {/* <Button
            btnName={"Back"}
            newClass={"submit-btn"}
            onClick={handleClose}
          /> */}
          <Tooltip title="Back" placement="top" arrow>
            <div className="submit-btn-multipleSelect" onClick={handleClose}>
              <IconArrowNarrowLeft size={25} className="text-secondary" />
            </div>
          </Tooltip>
        </div>
      </div>

      {multiButtonSelect == "Profile" && (
        <UserProfileSetting multiButtonSelectNavigate={multiButtonSelect} />
      )}
      {multiButtonSelect == "Password" && (
        <PasswordSetting multiButtonSelectNavigate={multiButtonSelect} />
      )}
      {multiButtonSelect == "Avatar" && (
        <AvatarSetting multiButtonSelectNavigate={multiButtonSelect} />
      )}
    </div>
  );
}
export default connect(null, {
  getUserProfile,
})(UserSetting);

import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import AvtarImg from "../../../assets/images/defaultUserImage.avif";
import $ from "jquery";
import CoverImg from "../../../assets/images/userSettingCover.png";
import Input from "../../extra/Input";
import { uploadFile } from "../../../util/AwsFunction";
import { editUserProfile, getUserProfile } from "../../store/user/user.action";
import EditIcon from "@mui/icons-material/Edit";
import { connect, useDispatch, useSelector } from "react-redux";
import UserImage from "../../../assets/images/8.jpg";
import { Skeleton } from "@mui/material";

import { baseURL } from "../../../util/config";
import { IconEdit } from "@tabler/icons-react";

function AvatarSetting(props) {
  const { multiButtonSelectNavigateSet, multiButtonSelectNavigate } = props;
  $("input[type='image']").click(function () {
    $("input[id='my_file']").click();
  });

  const [image, setImage] = useState("");
  const [imageShow, setImageShow] = useState("");
  const [userId, setUserId] = useState("");
  const [isChannel, setIsChannel] = useState("");
  const { userProfile, countryData } = useSelector((state) => state.user);
  console.log("userProfile", userProfile);

  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const dispatch = useDispatch();
  useEffect(() => {
    multiButtonSelectNavigate === "Avatar"
      ? localStorage.setItem(
        "multiButton",
        JSON.stringify(multiButtonSelectNavigate)
      )
      : localStorage.removeItem("multiButton");
  }, [multiButtonSelectNavigate]);

  useEffect(() => {
    if (userProfile?.image) {
      setImageShow(userProfile.image); // Directly use URL from backend
    }
  }, [userProfile]);

  let folderStructure = "userImage";
  const handleFileUpload = async (event) => {


    const { resDataUrl } = await uploadFile(
      event.target.files[0],
      folderStructure
    );

    if (resDataUrl) {
      setImageShow(resDataUrl);
      let editImage = {
        image: resDataUrl,
        userId: userId,
      };
      props.editUserProfile(dialogueData?._id, editImage, isChannel);
    }
  };

  useEffect(() => {
    dispatch(getUserProfile(dialogueData?._id, dialogueData?.isChannel));
  }, [dispatch, dialogueData]);

  useEffect(() => {
    setUserId(userProfile?._id);
    setIsChannel(userProfile?.isChannel);
    setImage(userProfile?.image);
  }, [userProfile]);

  return (
    <div className="card1 mt-2">
      <div className="cardHeader p-3 ">
        <div className="row d-flex  align-items-center">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-1 mb-sm-0">
            <h5 className="mb-0">Avatar & Cover</h5>
          </div>
        </div>
      </div>
      <div className=" cardBody">

        <div className="image-avatar-box cardBody p-3">

          <div className="avatar-img-user">
            <label for="image" onChange={handleFileUpload}>
              <div className="avatar-img-icon-profile bg-white">

                <IconEdit className="text-white p-2" />
              </div>
              <input
                type="file"
                name="image"
                id="image"
                style={{ display: "none" }}
              />
              {imageShow && (
                <img
                  src={image}
                  style={{ objectFit: "cover", borderRadius: "5px", border: "2px solid #eee" }}
                  onError={(e) => {
                    e.target.error = null;
                    e.target.src = AvtarImg;
                  }}
                  width={350}
                  height={350}
                />
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default connect(null, {
  editUserProfile,
  getUserProfile,
})(AvatarSetting);

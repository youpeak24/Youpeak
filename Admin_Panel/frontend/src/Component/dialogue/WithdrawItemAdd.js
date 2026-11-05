import { Box, Modal, Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Selector from "../extra/Selector";
import Input from "../extra/Input";
import Button from "../extra/Button";
import {
  addPaymentGateway,
  editPaymentGateway,
} from "../store/setting/setting.action";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { connect, useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import { uploadFile } from "../../util/AwsFunction";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import TagFacesIcon from "@mui/icons-material/TagFaces";


const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
  p: "19px",
};

const ListItem = styled("li")(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

function WithdrawItemAdd(props) {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [addCategory, setAddCategory] = useState(false);
  const [name, setName] = useState();
  const [imgApi, setImgApi] = useState();
  const [image, setImage] = useState();
  const [imageFileData, setImageFileData] = useState();
  const [detail, setDetail] = useState("");
  const [addChip, setAddChip] = useState([]);
  const [error, setError] = useState({
    name: "",
    image,
    detail: "",
  });

  const dispatch = useDispatch();
  useEffect(() => {
    setAddCategory(dialogue);
    if (dialogueData) {
      setName(dialogueData?.name);
      setDetail(dialogueData?.details);
      setImage(dialogueData?.image);      // ✅ Image URL direct backend se aayi
      setImgApi(dialogueData?.image);     // ✅ Show image preview
    }
  }, [dialogue, dialogueData]);

  const handleCloseAddCategory = () => {
    setAddCategory(false);
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
  };

  const handleImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImgApi(URL.createObjectURL(e.target.files[0]));
      setImageFileData([e.target.files[0]])
    }
  };

  let folderStructure = "WithdrawImage"; const handleFileUpload = async (imageData) => {


    if (!imageData || !imageData[0]) {
      return setError((prev) => ({
        ...prev,
        image: "Image Is Required",
      }));
    }

    try {
      const { resDataUrl } = await uploadFile(imageData[0], folderStructure);

      // 🟢 Upload ke baad image preview aur backend URL dono set karo
      setImgApi(resDataUrl);
      setImage(resDataUrl);

      // 🔁 Validation clear
      setError((prev) => ({
        ...prev,
        image: "",
      }));

      return resDataUrl;
    } catch (error) {
      console.error("Image upload failed:", error);
      setError((prev) => ({
        ...prev,
        image: "Failed to upload image",
      }));
      return null;
    }
  };




  const handleSubmit = async () => {

    if (!name || (dialogueData ? "" : !image) || !detail) {
      let error = {};
      if (!name) error.name = "Name Is Required !";
      if (!image) error.image = "Image Is Required !";
      if (!detail) error.detail = "Detail Is Required !";
      return setError({ ...error });
    } else {

      let url = image; // 🟢 Default: jo image already set hai (edit case)

      if (imageFileData) {
        // 🟢 New image selected hai to upload karni padegi
        url = await handleFileUpload(imageFileData);
      }

      const addWithdrawItem = {
        name: name?.trim(),
        // image: url,
        details: detail,
      };
      if (imageFileData) addWithdrawItem.image = url;

      if (dialogueData) {
        props.editPaymentGateway(dialogueData?._id, addWithdrawItem);
      } else {
        props.addPaymentGateway(addWithdrawItem);
      }
      handleCloseAddCategory();
    }
  };
  return (
    <div>
      <Modal
        open={addCategory}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="model-style">

          <div className="model-header">
            <p className="m-0">
              {dialogueData
                ? "Update Payment Gateway"
                : "Create Payment Gateway"}
            </p>
          </div>
          <div className="model-body">
            <form>
              <Input
                label={"Name"}
                name={"name"}
                placeholder={"Enter Details..."}
                value={name}
                errorMessage={error.name && error.name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      name: `Name Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      name: "",
                    });
                  }
                }}
              />
              <div className="mt-2 add-details">
                <Input
                  label={"Detail"}
                  name={"detail"}
                  placeholder={"Enter Details..."}
                  value={detail}
                  onChange={(e) => {
                    setDetail(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        detail: `Details Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        detail: "",
                      });
                    }
                  }}
                />
              </div>
              <div>
                {error?.detail && <p className="errorMessage">{error?.detail}</p>}
              </div>
              <div className="mt-2 ">
                <Input
                  type={"file"}
                  label={"Image"}
                  accept=".png, .jpg, .jpeg"
                  errorMessage={error.image && error.image}
                  onChange={handleImage}
                />
                <p className="extention-show">Accept only .jpg, .jpeg, .png</p>
              </div>
              <div className=" mt-2 fake-create-img mb-2">
                {image && (
                  <img src={imgApi} style={{ width: "96px", height: "auto" }} />
                )}
              </div>

            </form>
          </div>
          <div className="model-footer">
            <div className="m-3 d-flex justify-content-end">
              <Button
                onClick={handleCloseAddCategory}
                btnName={"Close"}
                newClass={"close-model-btn me-2"}
              />
              <Button
                onClick={handleSubmit}
                btnName={"Submit"}
                type={"button"}
                newClass={"submit-btn"}
              />
            </div>
          </div>
        </Box>
      </Modal>
    </div>
  );
}
export default connect(null, {
  addPaymentGateway,
  editPaymentGateway,
})(WithdrawItemAdd);

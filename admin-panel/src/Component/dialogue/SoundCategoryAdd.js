import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Selector from "../extra/Selector";
import Input from "../extra/Input";
import noImageFrom from "../../assets/images/noimage.png";
import Button from "../extra/Button";
import {
  addSoundCategory,
  editSoundCategory,
} from "../store/sound/sound.action";
import { connect, useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import { uploadFile } from "../../util/AwsFunction";


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

function SoundCategoryAdd(props) {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [addCategory, setAddCategory] = useState(false);
  const [name, setName] = useState();
  const [userSelect, setUserSelect] = useState();
  const [imageFile, setImageFile] = useState();
  const [imgApi, setImgApi] = useState();
  const [image, setImage] = useState();
  const [error, setError] = useState({
    name: "",
    image,
  });
  const { getFakeUserData } = useSelector((state) => state.user);

  const dispatch = useDispatch();
  useEffect(() => {
    setAddCategory(dialogue);
    if (dialogueData) {
      setName(dialogueData?.name);
      setImgApi(dialogueData?.image)
    }
  }, [dialogue]);

  useEffect(() => {
    setUserSelect(dialogueData?.fullName);
  }, [dialogueData]);

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


  const handleSubmit = async () => {

    if (!name || (dialogueData ? "" : !image)) {
      let error = {};
      if (!name) error.channelName = "Name Is Required !";
      if (!image) error.image = "Image Is Required !";
      return setError({ ...error });
    } else {

      let url
      if (imageFile) {
        url = await handleFileUpload(image);
      }



      const addCategoryData = {
        name: name?.trim(),
        image: url,
      };
      if (dialogueData) {
        props.editSoundCategory(dialogueData?._id, addCategoryData);
      } else {
        props.addSoundCategory(addCategoryData);
      }
      handleCloseAddCategory();
    }
  };

  const handleImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setImgApi(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0])
    }
  };

  let folderStructure = "userImage";
  const handleFileUpload = async (imageData) => {


    const { resDataUrl } = await uploadFile(
      imageData, // ✅ directly File object
      folderStructure
    );

    setImgApi(resDataUrl);

    if (!imageData) {
      return setError({
        ...error,
        image: `Image Is Required`,
      });
    } else {
      setError({
        ...error,
        image: "",
      });
    }

    return resDataUrl;
  };


  useEffect(() => {
    if (dialogueData) {
      setImgApi(dialogueData.image); // for showing preview in <img src={imgApi} />
      setImage(dialogueData.image);  // for using this in upload logic (optional now)
    }
  }, [dialogueData]);


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
              {dialogueData ? "Edit Sound Category" : "Add Sound Category"}
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
              <div className="mt-2 ">
                <Input
                  type={"file"}
                  label={"Image"}
                  accept={"image/png, image/jpeg"}
                  errorMessage={error.image && error.image}
                  onChange={handleImage}
                />
                <p className="extention-show">Accept only .png, .jpg, .jpeg</p>
              </div>
              <div className=" mt-2 fake-create-img mb-2">
                {imgApi && (
                  <img
                    src={imgApi}
                    onError={(e) => {
                      e.target.src = noImageFrom;
                    }}
                  />
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
  addSoundCategory,
  editSoundCategory,
})(SoundCategoryAdd);

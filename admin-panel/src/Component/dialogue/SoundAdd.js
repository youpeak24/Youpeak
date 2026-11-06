import { Box, CircularProgress, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import Selector from "../extra/Selector";
import Input from "../extra/Input";
import Button from "../extra/Button";
import {
  addSound,
  editSound,
  getSoundCategory,
} from "../store/sound/sound.action";
import noImageFrom from "../../assets/images/noimage.png";
import { connect, useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";
import { uploadFile } from "../../util/AwsFunction";
import ReactAudioPlayer from "react-audio-player";
import SmallLoader from "../extra/SmallLoader";




function SoundAdd(props) {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const { soundCategoryData } = useSelector((state) => state.sound);

  const { uploadFilePercent, loaderType } = useSelector(
    (state) => state.dialogue
  );


  const [videoUploadLoader, setVideoUploadLoader] = useState(false);
  const [imageUploadLoader, setImageUploadLoader] = useState(false);
  const [addSoundOpen, setAddSoundOpen] = useState(false);
  const [name, setName] = useState();
  const [userSelect, setUserSelect] = useState();
  const [imgApi, setImgApi] = useState();
  const [image, setImage] = useState();
  const [soundTitle, setSoundTitle] = useState();
  const [soundTime, setSoundTime] = useState();
  const [soundLink, setSoundLink] = useState();
  const [soundCategoryId, setSoundCategoryId] = useState();
  const [soundCategoryDataGet, setSoundCategoryDataGet] = useState();
  const [soundLinkFile, setSoundLinkFile] = useState();
  const [showSound, setShowSound] = useState();
  const [imageFile, setImageFile] = useState();
  const [error, setError] = useState({
    name: "",
    image,
    soundTitle: "",
    soundLink: "",
    soundImage: "",
    soundCategoryId: "",
  });

  useEffect(() => {
    setSoundCategoryDataGet(soundCategoryData);
  }, [soundCategoryData]);

  const dispatch = useDispatch();
  useEffect(() => {
    setAddSoundOpen(dialogue);
    if (dialogueData) {
      setName(dialogueData?.singerName);
      setImage(dialogueData?.soundImage);
      setImgApi(dialogueData?.soundImage)
      setSoundLink(dialogueData?.soundLink);
      setShowSound(dialogueData?.soundLink);
      setSoundCategoryId(dialogueData?.soundCategoryId?._id);
      setSoundTime(dialogueData?.soundTime);
      setSoundTitle(dialogueData?.soundTitle);
      setVideoUploadLoader(true);
      setImageUploadLoader(true);
    }
  }, [dialogue]);

  useEffect(() => {
    dispatch(getSoundCategory());
  }, [])

  useEffect(() => {
    setUserSelect(dialogueData?.fullName);
  }, [dialogueData]);

  useEffect(() => {
    if (showSound) {
      setVideoUploadLoader(true);
    }
  }, [showSound]);

  useEffect(() => {
    if (image) {
      setImageUploadLoader(true);
    }
  }, [image]);



  const handleCloseAddCategory = () => {
    setAddSoundOpen(false);
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

  let folderStructure = "userImage";
  const handleFileUpload = async (imageData) => {
    if (!imageData || !imageData[0]) {
      return setError((prev) => ({
        ...prev,
        image: "Image is required",
      }));
    }

    setImageUploadLoader(true);

    try {
      const { resDataUrl } = await uploadFile(
        imageData[0],
        folderStructure,
        dispatch,
        "imageLoader"
      );

      setImgApi(resDataUrl);
      setImage(resDataUrl);

      setError((prev) => ({
        ...prev,
        image: "",
      }));

      return resDataUrl;
    } catch (err) {
      console.error("Image upload failed:", err);
      setError((prev) => ({
        ...prev,
        image: "Failed to upload image",
      }));
    }
  };


  const handleUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setSoundLink(file);             // 🔁 Raw File Object for upload
    setShowSound(URL.createObjectURL(file));
    setSoundLinkFile(file);         // ✅ This must be set here

    // ⏱️ Set duration
    const audioElement = new Audio(URL.createObjectURL(file));
    audioElement.addEventListener("loadedmetadata", () => {
      const durationInMilliseconds = audioElement.duration * 1000;
      setSoundTime(Math.floor(durationInMilliseconds));
    });

    setError((prev) => ({ ...prev, soundLink: "" }));
  };

  let folderStructureSound = "SoundList";
  const handleSoundUpload = async (file) => {
    if (!file) {
      setError((prev) => ({ ...prev, soundLink: "Sound file is required!" }));
      return null;
    }

    setVideoUploadLoader(true);

    try {
      const { resDataUrl } = await uploadFile(
        file,
        folderStructureSound,
        dispatch,
        "soundLoader"
      );

      setSoundLink(resDataUrl);
      setShowSound(resDataUrl);

      // Calculate and set sound duration
      const audioElement = new Audio(URL.createObjectURL(file));
      audioElement.addEventListener("loadedmetadata", () => {
        const durationInMilliseconds = audioElement.duration * 1000;
        setSoundTime(Math.floor(durationInMilliseconds));
      });

      setError((prev) => ({ ...prev, soundLink: "" }));
      return resDataUrl;
    } catch (err) {
      console.error("Sound upload failed:", err);
      setError((prev) => ({ ...prev, soundLink: "Failed to upload sound file!" }));
      return null;
    }
  };




  const handleImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage([e.target.files[0]]);
      setImgApi(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0])
    }
  };

  // const handleSubmit = async () => {
  //   if (
  //     !name ||
  //     (dialogueData ? "" : !image) ||
  //     !soundCategoryId ||
  //     !soundTitle ||
  //     (dialogueData ? "" : !soundLink)
  //   ) {
  //     let error = {};
  //     if (!name) error.channelName = "Name Is Required !";
  //     if (!image) error.image = "Image Is Required !";
  //     if (!soundCategoryId)
  //       error.soundCategoryId = "Sound Category Is Required !";
  //     if (!soundTitle) error.soundTitle = "Sound Title Is Required !";
  //     if (!soundLink) error.soundLink = "Sound Upload Is Required !";
  //     return setError({ ...error });
  //   } else {

  //     let songUrl;
  //     let songImageUrl;
  //     if (!dialogueData) {
  //       songUrl = await handleSoundUpload(soundLink);
  //       songImageUrl = await handleFileUpload(image)
  //     } else {


  //        if (sounLinkFile && imageFile) {
  //         songUrl = await handleSoundUpload(soundLink);
  //         songImageUrl = await handleFileUpload(image)
  //       }
  //     else  if (sounLinkFile) {
  //         songUrl = await handleSoundUpload(soundLink);
  //       } 
  //       else if (imageFile) {
  //         songImageUrl = await handleFileUpload(image);
  //       }
  //     }

  //     const addSoundData = {
  //       singerName: name?.trim(),
  //       soundImage: songImageUrl,
  //       soundLink: songUrl,
  //       soundTime: soundTime,
  //       soundTitle: soundTitle,
  //       soundCategoryId: soundCategoryId,
  //     };
  //     if (dialogueData) {
  //       props.editSound(dialogueData?._id, addSoundData);
  //     } else {
  //       props.addSound(addSoundData);
  //     }
  //     handleCloseAddCategory();
  //   }
  // };


  const handleSubmit = async () => {

    const isEdit = Boolean(dialogueData);

    const errors = {};
    if (!name) errors.name = "Name is required!";
    if (!soundTitle) errors.soundTitle = "Sound title is required!";
    if (!soundCategoryId) errors.soundCategoryId = "Sound category is required!";
    if (!isEdit && !image) errors.image = "Image is required!";
    if (!isEdit && !soundLink) errors.soundLink = "Sound file is required!";

    if (Object.keys(errors).length > 0) {
      return setError(errors);
    }

    let songUrl = soundLink;
    let songImageUrl = image;

    try {
      if (!isEdit) {
        songUrl = await handleSoundUpload(soundLink);
        songImageUrl = await handleFileUpload(image);
      } else {
        if (soundLinkFile) {
          songUrl = await handleSoundUpload(soundLinkFile);
        }
        if (imageFile) {
          songImageUrl = await handleFileUpload(image);
        }
      }

      const addSoundData = {
        singerName: name.trim(),
        soundTitle,
        soundCategoryId,
        soundTime,
        // soundLink: songUrl,
        // soundImage: songImageUrl,
      };

      if (soundLinkFile) addSoundData.soundLink = songUrl;
      if (imageFile) addSoundData.soundImage = songImageUrl;

      if (isEdit) {
        props.editSound(dialogueData._id, addSoundData);
      } else {
        props.addSound(addSoundData);
      }

      handleCloseAddCategory();
    } catch (err) {
      console.error("Submission error:", err);
    }
  };


  return (
    <div>
      <Modal
        open={addSoundOpen}
        onClose={handleCloseAddCategory}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box className="model-style">
          <div className="model-header">
            <p className="m-0">
              {dialogueData ? "Edit Sound" : "Add Sound"}
            </p>
          </div>
          <div className="model-body">
            <form>
              <div className="row sound-add-box">
                <div className="col-lg-6 col-sm-12">
                  <Input
                    label={"Singer Name"}
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
                </div>
                <div className="col-lg-6 col-sm-12">
                  <Input
                    label={"Sound Title"}
                    name={"soundTitle"}
                    placeholder={"Enter Details..."}
                    value={soundTitle}
                    errorMessage={error.soundTitle && error.soundTitle}
                    onChange={(e) => {
                      setSoundTitle(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          soundTitle: `Sound Title Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          soundTitle: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-lg-6 col-sm-12 mt-2">
                  <Selector
                    label={"Sound Category"}
                    selectValue={soundCategoryId}
                    placeholder={"Select Category"}
                    selectData={soundCategoryDataGet}
                    selectId={true}
                    errorMessage={error.soundCategoryId && error.soundCategoryId}
                    onChange={(e) => {
                      setSoundCategoryId(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          soundCategoryId: `Sound Category Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          soundCategoryId: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-lg-6 col-sm-12 mt-2">
                  <Input
                    label={"Sound Time"}
                    name={"soundTime"}
                    disabled={true}
                    placeholder={"Sound Upload"}
                    value={soundTime}
                  />
                </div>
                <div className="col-lg-6 col-sm-12 mt-2">
                  <Input
                    type={"file"}
                    label={"Sound Upload"}
                    accept={".mp3,audio/*"}
                    errorMessage={error.soundLink && error.soundLink}
                    onChange={handleUpload}
                  />
                  <p className="extention-show">Accept only .mp3</p>

                  <div className="video-upload-loader mt-3" style={{ width: "auto", height: "unset" }}>
                    {videoUploadLoader ? (
                      (
                        loaderType === "soundLoader"
                          ? uploadFilePercent === null
                            ? true
                            : uploadFilePercent === 100
                          : true
                      ) ? (
                        <ReactAudioPlayer
                          src={showSound}
                          controls
                          autoPlay
                          muted

                          onError={(error) =>
                            console.error("Audio error:", error)
                          }
                        />
                      ) : (
                        <>
                          <SmallLoader
                            loaderType={"percentLoader"}
                            percentShow={true}
                          />
                        </>
                      )
                    ) : (
                      ""
                    )}
                  </div>
                </div>


                <div className="col-lg-6 col-sm-12 mt-2">
                  <Input
                    type={"file"}
                    label={"Sound Image"}
                    accept={"image/png, image/jpeg"}
                    errorMessage={error.image && error.image}
                    onChange={handleImage}
                  />
                  <p className="extention-show">Accept only .png, .jpg, .jpeg</p>

                  <div className="video-upload-loader" style={{ width: "100%", height: "unset", marginTop: "20px" }}>
                    {imageUploadLoader ? (
                      (
                        loaderType === "imageLoader"
                          ? image === null
                            ? true
                            : image
                          : true
                      ) ? (
                        image && (
                          <img
                            src={imgApi}
                            height={100}
                            width={100}
                            onError={(e) => {
                              e.target.src = noImageFrom;
                            }}
                            style={{ objectFit: "contain" }}
                          />
                        )
                      ) : (
                        <>
                          <SmallLoader loaderType={"imageLoader"} />
                        </>
                      )
                    ) : (
                      ""
                    )}
                  </div>
                </div>


              </div>
            </form>
          </div>
          <div className="model-footer">
            <div className=" d-flex justify-content-end m-3">
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
  addSound,
  editSound,
  getSoundCategory,
})(SoundAdd);

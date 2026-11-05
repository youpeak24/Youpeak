import React, { useEffect, useRef, useState } from "react";
import Button from "../extra/Button";
import Input from "../extra/Input";
import Selector from "../extra/Selector";
import defaultImage from "../../assets/images/noimage.png";

import {
  createFakeUser,
  getIpAddress,
  getFakeUserName,
} from "../store/user/user.action";
import { createVideo, editVideo } from "../store/video/video.action";
import { connect, useDispatch, useSelector } from "react-redux";
import { uploadFile } from "../../util/AwsFunction";
import noImageFrom from "../../assets/images/noimage.png";
import $ from "jquery";
import { CLOSE_DIALOGUE, CLOSE_LOADER, LOADER_OPEN } from "../store/dialogue/dialogue.type";
import "react-datepicker/dist/react-datepicker.css";
import ReactDatePicker from "react-datepicker";
import dayjs from "dayjs";

import { Box, CircularProgress, Tooltip, Typography } from "@mui/material";
import SmallLoader from "../extra/SmallLoader";
import { useLocation, useNavigate } from "react-router-dom";
import countriesData from '../../util/countries.json';
import ReactSelect from 'react-select';
import store from "../store/Provider";
import { IconArrowNarrowLeft } from "@tabler/icons-react";

function NewVideoAdd(props) {
  const AgeNumber = Array.from({ length: 100 }, (_, index) => index + 1);
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const { setMultiButtonSelect } = props;
  const { userProfile, countryData } = useSelector((state) => state.user);
  const { uploadFilePercent, loaderType } = useSelector(
    (state) => state.dialogue
  );

  const { fakeUser } = useSelector((state) => state.video);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [videoUploadLoader, setVideoUploadLoader] = useState(false);
  const [imageUploadLoader, setImageUploadLoader] = useState(false);
  const [countryOptions, setCountryOptions] = useState([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState(null); // Selected country
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [title, setTitle] = useState();
  const [videoDescription, setVideoDescription] = useState();
  const [data, setData] = useState();
  const [country, setCountry] = useState();
  const [countryDataSelect, setCountryDataSelect] = useState();
  const [visibilityType, setVisibilityType] = useState(1);
  const [commentType, setCommentType] = useState(1);
  const [audienceType, setAudienceType] = useState(1);
  const [scheduleType, setScheduleType] = useState(1);
  const [latitude, setLatitude] = useState();
  const [longitude, setLongitude] = useState();
  const [reportType, setReportType] = useState(1);
  const [hashTag, setHashTag] = useState();
  const [videoTime, setVideoTime] = useState();
  const [scheduleTime, setScheduleTime] = useState();
  const [videoFile, setVideoFile] = useState();
  const [thumbnailFile, setThumbnailFile] = useState();
  const [fakeUserSelect, setFakeUserSelect] = useState();
  const [showVideo, setShowVideo] = useState("");
  const [showVideoImg, setShowVideoImg] = useState();
  const [channelId, setChannelId] = useState();
  const [hashTagArray, setHashTagArray] = useState([]);
  const [fakeUserData, setFakeUserData] = useState([]);
  const [countryDataGet, setCountryDataGet] = useState();
  const [videoImgApi, setVideoImgApi] = useState();
  const [videoFileApi, setVideoFileApi] = useState();
  const [video, setVideo] = useState({
    file: "",
    thumbnailBlob: "",
  });

  const [thumbnailKey, setThumbnailKey] = useState(0);
  const [error, setError] = useState({
    title: "",
    countryDataSelect: "",
    video: "",
    fakeUserSelect: "",
    videoDescription: "",
    hashTag: "",
    scheduleTime: "",
    videoImg: "",
  });

  useEffect(() => {
    if (!dialogueData) {
      setCountryDataSelect([]);
      setShowVideo("");
      setShowVideoImg("");
      setFakeUserSelect("");
      setTitle("");
      setCountryDataSelect("");
      setLatitude("");
      setLongitude("");
      setVideoDescription("");
      setHashTag("");
      setScheduleTime("");
    }
  }, []);

  useEffect(() => {
    if (dialogueData) {
      setFakeUserSelect(dialogueData?.userId);
      setTitle(dialogueData?.title);
      setVideoTime(dialogueData?.videoTime);
      setVideoDescription(dialogueData?.description);
      setHashTag(dialogueData?.hashTag);
      setVisibilityType(dialogueData?.visibilityType);
      setScheduleType(dialogueData?.scheduleType);
      setCommentType(dialogueData?.commentType);
      setCountryDataSelect(dialogueData?.location);
      setChannelId(dialogueData?.channelId);
      setScheduleTime(dialogueData?.scheduleTime);
      setAudienceType(dialogueData?.audienceType);
      setLatitude(dialogueData?.locationCoordinates?.latitude)
      setLongitude(dialogueData?.locationCoordinates?.longitude)
      setVideoUploadLoader(true);
      setImageUploadLoader(true);
    }
  }, [dialogueData]);

  useEffect(() => {
    setData(data);
  }, [userProfile]);

  useEffect(() => {
    if (showVideo) {
      setVideoUploadLoader(true);
    }
  }, [showVideo]);

  useEffect(() => {
    if (showVideoImg) {
      setImageUploadLoader(true);
    }
  }, [showVideoImg]);

  useEffect(() => {
    // const countryName = countryData?.map((item) => item?.name?.common);
    // setCountry(countryName);
    // const countryDataSelectData = countryData.filter((item) => {
    //   const countrySelect = item?.name?.common;
    //   return countrySelect?.toLowerCase() === countryDataSelect;
    // });
    // if (countryDataSelectData?.length > 0) {
    //   const getLatitude = countryDataSelectData?.map((item) => {
    //     setLatitude(item?.latlng[0]);
    //     setLongitude(item?.latlng[1]);
    //   });
    // }
    const fakeUserChannelCheck = fakeUser?.filter(
      (item) => item?.isChannel === true && item?.isBlock === false
    );
    setFakeUserData(fakeUserChannelCheck);
  }, [fakeUser]);

  useEffect(() => {
    dispatch(getFakeUserName());
  }, [dispatch]);

  useEffect(() => {
    if (dialogueData) {
      // ✅ Edit Mode → Backend से आया permanent URL directly set कर दो
      setVideo({
        file: dialogueData?.videoUrl || "",
        thumbnailBlob: dialogueData?.videoImage || ""
      });
    } else {
      // ✅ New Create Mode → Reset state
      setVideo({ file: "", thumbnailBlob: "" });
    }
  }, [dialogueData]);


  useEffect(() => {
    const processCountries = () => {
      setLoadingCountries(true)

      try {
        // Transform countries to React Select format
        const transformedCountries = countriesData
          .filter(country =>
            country.name?.common &&
            country.cca2 &&
            country.flags?.png
          )
          .map(country => ({
            value: country.cca2, // Required by React Select
            label: country.name.common, // Required by React Select
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg, // For compatibility
            latitude: country.latlng[0],
            longitude: country.latlng[1]
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        setCountryOptions(transformedCountries)

        // Set default or existing country
        if (dialogueData?.location) {
          const existingCountry = transformedCountries.find(
            (c) => c.name.toLowerCase() === dialogueData.location.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
          // Set India as default
          const defaultCountry = transformedCountries.find((c) => c.name === "India");
          setSelectedCountry(defaultCountry || transformedCountries[0] || null);
        }
      } catch (error) {
        console.error('Failed to process countries:', error)
      } finally {
        setLoadingCountries(false)
      }
    }

    processCountries()
  }, [userProfile])

  const handleClose = () => {
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

  let folderStructure = "Videos";
  let folderStructureImg = "videoImage";

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];

    if (file) {
      // Show loader
      store.dispatch({ type: LOADER_OPEN, payload: "file-upload" });
      try {
        const thumbnailBlob = await generateThumbnailBlob(file);
        setVideo({
          file,
          thumbnailBlob,
        });
        setThumbnailKey(prev => prev + 1);
        setVideoFile(file);
        setThumbnailFile(thumbnailBlob);

        const videoElement = document.createElement("video");
        videoElement.src = URL.createObjectURL(file);

        videoElement.addEventListener("loadedmetadata", () => {
          const durationInSeconds = videoElement.duration;

          // If you want only whole seconds
          setVideoTime(Math.floor(durationInSeconds));


        });
      } finally {
        // Hide loader
        store.dispatch({ type: CLOSE_LOADER });
      }
    } else {
      return setError(prev => ({
        ...prev,
        video: "Video is required",
      }));
    }
  };

  // const handleFileUpload = async (event) => {
  //   
  //   const file = event.target.files[0];

  //   if (file) {
  //     const thumbnailBlob = await generateThumbnailBlob(file);
  //     setVideo({
  //       file,
  //       thumbnailBlob,
  //     });

  //     if (thumbnailBlob) {
  //       const videoFileName = file ? file?.name : "video";
  //       const thumbnailFileName = `${videoFileName?.replace(
  //         /\.[^/.]+$/,
  //         ""
  //       )}.jpeg`;

  //       const thumbnailFile = new File([thumbnailBlob], thumbnailFileName, {
  //         type: "image/jpeg",
  //       });
  //       const { resDataUrl, imageURL } = await uploadFile(
  //         thumbnailFile,
  //         folderStructureImg,
  //         dispatch,
  //         "imageLoader"
  //       );
  //       setVideoImgApi(resDataUrl);
  //       if (imageURL) {
  //         setShowVideoImg(imageURL);
  //       }
  //     }
  //     setThumbnailKey((prevKey) => prevKey + 1);
  //   }

  //   const { resDataUrl, imageURL } = await uploadFile(
  //     event.target.files[0],
  //     folderStructure,
  //     dispatch,
  //     "videoLoader"
  //   );
  //   setVideoFileApi(resDataUrl);

  //   if (imageURL) {
  //     setShowVideo(imageURL);
  //   }
  //   const selectedFile = event.target.files[0];
  //   setVideoFile(selectedFile);
  //   const videoElement = document.createElement("video");
  //   if (selectedFile) {
  //     videoElement.src = URL.createObjectURL(selectedFile);
  //     videoElement.addEventListener("loadedmetadata", () => {
  //       const durationInSeconds = videoElement.duration;
  //       const durationInMilliseconds = durationInSeconds * 1000;
  //       setVideoTime(parseInt(durationInMilliseconds));
  //     });
  //   }

  //   if (!event.target.files[0]) {
  //     return setError({
  //       ...error,
  //       video: `Video Is Required`,
  //     });
  //   } else {
  //     return setError({
  //       ...error,
  //       video: "",
  //     });
  //   }
  // };



  const generateThumbnailBlob = async (file) => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        video.currentTime = 1; // Set to capture the frame at 1 second
      };

      video.onseeked = async () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas to blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/jpeg");
      };

      const objectURL = URL.createObjectURL(file);
      video.src = objectURL;

      return () => {
        URL.revokeObjectURL(objectURL);
      };
    });
  };

  const handleDateChange = (date) => {
    setScheduleTime(date);
    if (!date) {
      return setError({
        ...error,
        scheduleTime: `Schedule Time Is Required !`,
      });
    } else {
      return setError({
        ...error,
        scheduleTime: "",
      });
    }
  };

  const updateHashTagArray = (newHashTag) => {
    const newHashTagArray = newHashTag
      ?.split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setHashTagArray(newHashTagArray);
  };

  useState(() => {
    updateHashTagArray(hashTag);
  }, []);

  const handleHashTagChange = (event) => {
    const newHashTag = event.target.value;
    setHashTag(newHashTag);
    updateHashTagArray(newHashTag);
    if (!event.target.value && !dialogueData) {
      return setError({
        ...error,
        hashTag: `Hash Tag Is Required !`,
      });
    } else {
      return setError({
        ...error,
        hashTag: "",
      });
    }
  };

  const handleSubmit = async () => {

    const channelIdFine = fakeUser?.filter(
      (item) => item?._id === fakeUserSelect
    );
    const getChannelIdFine = channelIdFine?.map((item) => {
      return item?.channelId;
    });
    const countryDataName = fakeUser?.filter(
      (item) => item?._id === fakeUserSelect
    );
    const getFullNameUser = countryDataName?.map((item) => {
      return item?.fullName;
    });
    if (
      !title ||
      (dialogueData ? "" : !video?.file) ||
      (dialogueData ? "" : !videoDescription) ||
      (!dialogueData && !fakeUserSelect) ||
      (dialogueData ? "" : selectedCountry?.length <= 0) ||
      (dialogueData ? "" : scheduleType === 1 && !scheduleTime) ||
      (dialogueData ? "" : !hashTag)
    ) {
      const error = {};
      if (!title) error.title = "Title Is Required !";
      if (dialogueData ? "" : !video?.file) error.video = "Video Is Required !";
      if (dialogueData ? "" : !videoDescription)
        error.videoDescription = "Video Description Is Required !";
      if (dialogueData ? " " : !hashTag)
        error.hashTag = "Hash Tag Is Required !";
      if (!dialogueData && !fakeUserSelect)
        error.fakeUserSelect = "Fake User Is Required !";
      if (dialogueData ? "" : selectedCountry?.length <= 0)
        error.countryDataSelect = "Country Is Required !";
      if (dialogueData ? "" : scheduleType === 1 && !scheduleTime)
        error.scheduleTime = "Schedule Time Is Required !";
      return setError({ ...error });
    } else {

      // let uploadedVideoURL = videoFileApi || dialogueData?.videoUrl;
      // let uploadedThumbnailURL = videoImgApi || dialogueData?.videoImage;
      let uploadedVideoURL = "";
      let uploadedThumbnailURL = "";

      // if (videoFile) {
      //   // Thumbnail create
      //   const thumbnailFileName = `${video.file.name.replace(/\.[^/.]+$/, "")}.jpeg`;
      //   const thumbnailFile = new File([video.thumbnailBlob], thumbnailFileName, { type: "image/jpeg" });

      //   // ✅ Upload thumbnail
      //   const { resDataUrl: thumbnailUrl } = await uploadFile(
      //     thumbnailFile,
      //     "videoImage",
      //     dispatch,
      //     "imageLoader"
      //   );
      //   uploadedThumbnailURL = thumbnailUrl;

      //   // ✅ Upload video
      //   const { resDataUrl: videoUrl } = await uploadFile(
      //     video.file,
      //     "Videos",
      //     dispatch,
      //     "videoLoader"
      //   );
      //   uploadedVideoURL = videoUrl;
      // }

      if (thumbnailFile) {
        const fileToUpload =
          thumbnailFile instanceof File
            ? thumbnailFile
            : new File(
                [video?.thumbnailBlob || thumbnailFile],
                `${Date.now()}.jpeg`,
                { type: "image/jpeg" }
              );

        // ✅ Upload thumbnail
        const { resDataUrl: thumbnailUrl } = await uploadFile(
          fileToUpload,
          "videoImage",
          dispatch,
          "imageLoader"
        );
        uploadedThumbnailURL = thumbnailUrl;
      }


      if (videoFile) {
        // let uploadedVideoURL = "";
        const { resDataUrl: videoUrl } = await uploadFile(
          video.file,
          "Videos",
          dispatch,
          "videoLoader"
        );
        uploadedVideoURL = videoUrl;
      }

      let newVideoAddData = {
        title: title,
        description: videoDescription,
        hashTag: Array.isArray(hashTag)
          ? hashTag
          : hashTag
            ? hashTag.split(",").map((tag) => tag.trim())
            : [],
        videoType: 1,
        videoTime: videoTime,
        visibilityType: visibilityType,
        commentType: commentType,
        scheduleType: scheduleType,
        scheduleTime:
          scheduleType === 1 ? dayjs(scheduleTime).format("YYYY-MM-DD") : "",
        location: selectedCountry?.name,
        latitude: latitude,
        audienceType,
        longitude: longitude,
        // videoUrl: uploadedVideoURL,
        // videoImage: uploadedThumbnailURL,
        // videoUrl: "",
        // videoImage: "",
        userId: dialogueData ? dialogueData?.userId : fakeUserSelect,
        channelId: dialogueData
          ? dialogueData?.channelId
          : getChannelIdFine?.length === 0
            ? channelId
            : getChannelIdFine?.join(","),
      };

      if (videoFile) newVideoAddData.videoUrl = uploadedVideoURL
      if (thumbnailFile) newVideoAddData.videoImage = uploadedThumbnailURL

      if (dialogueData) {
        const videoId = dialogueData?._id;
        const userId = dialogueData?.userId?._id || dialogueData?.userId;
        const channelIdFind = dialogueData?.channelId;
        const fullNameUser =
          getFullNameUser?.length > 0 ? getFullNameUser[0] : "";
        const type = 1;
        props.editVideo(
          newVideoAddData,
          videoId,
          userId,
          channelIdFind,
          type,
          fullNameUser
        );
        handleClose();
      } else {
        props.createVideo(newVideoAddData);
        setTimeout(() => {
          setMultiButtonSelect("Manage Video");
        }, 2000)
      }
    }
  };

  const minDate = () => {
    const today = new Date().toISOString().split("T")[0];
    return today;
  };

  const handleSelectChange = (selected) => {
    setSelectedCountry(selected);

    if (!selected) {
      return setError({
        ...error,
        country: `Country Is Required`,
      });
    } else {
      return setError({
        ...error,
        country: '',
      });
    }
  };

  const CustomOption = ({ innerRef, innerProps, data }) => (
    <div ref={innerRef} {...innerProps} className="optionShow-option p-2 d-flex align-items-center">
      <img
        height={24}
        width={32}
        alt={data.name}
        src={data.flagUrl}
        className="me-2"
        style={{ objectFit: 'cover' }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = defaultImage;
        }}
      />
      <span>{data.label}</span>
    </div>
  )

  return (
    <div>
      <div className="card1 fake-user ">
        <div className="cardHeader p-3 ">
          <div className=" d-flex  align-items-center w-100">
            <div className="w-100">
              <h5 className="mb-0">{dialogueType ? "Edit Video" : "Import Video"}</h5>
            </div>
            {dialogueType && (
              <div className="w-100 d-flex justify-content-end">
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
            )}
          </div>
        </div>
        <div className=" userSettingBox">
          <form>
            <div className="row d-flex  align-items-center">
              {/* <div className="col-6">
                <h5 className="mb-0 text-nowrap">
                  {dialogueType ? "Edit Video" : "Import Video"}
                </h5>
              </div>
              {dialogueType && (
                <div className="col-6 d-flex justify-content-end">
                  <Button
                    btnName={"Back"}
                    newClass={"back-btn"}
                    onClick={handleClose}
                  />
                </div>
              )} */}
              <form>
                {/* <div
                  className="col-12 d-flex justify-content-end align-items-center"
                >
                  <Button
                    newClass={"submit-btn"}
                    btnName={"Submit"}
                    type={"button"}
                    onClick={handleSubmit}
                  />
                </div> */}
                <div className="row cardBody p-3 ">

                  <div className="col-12 col-lg-6 col-sm-6 col-xs-12 mt-2 country-dropdown">
                    <Selector
                      label={"Fake User"}
                      selectValue={fakeUserSelect}
                      placeholder={"Enter Details..."}
                      disabled={dialogueData ? true : false}
                      selectData={fakeUserData}
                      selectId={true}
                      errorMessage={
                        error.fakeUserSelect && error.fakeUserSelect
                      }
                      onChange={(e) => {
                        setFakeUserSelect(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            fakeUserSelect: `Fake User Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            fakeUserSelect: "",
                          });
                        }
                      }}
                    />
                  </div>


                  <div className="col-12 col-lg-6 col-sm-6 col-xs-12 mt-2">
                    <div className="text-about">
                      <label
                        className="label-form"
                        style={{ fontWeight: "500", marginBottom: "5px" }}
                      >
                        Title
                      </label>
                      <textarea
                        cols={1}
                        rows={3}
                        className={"form-control"}
                        value={title}
                        name={"title"}
                        placeholder={"Enter Details..."}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          if (!e.target.value) {
                            return setError({
                              ...error,
                              title: `Title Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              title: "",
                            });
                          }
                        }}
                      ></textarea>
                      {error.title && <p className="errorMessage">{error.title}</p>}
                    </div>
                  </div>

                  <div className="col-lg-6 col-sm-12 col-md-12  mt-2 country-dropdown">
                    <label>Country</label>
                    <ReactSelect
                      options={countryOptions} // FIXED: Use options array
                      value={selectedCountry} // FIXED: Use selected country
                      isClearable={true}
                      isLoading={loadingCountries}
                      placeholder="Select a country..."
                      onChange={handleSelectChange}
                      className=""
                      classNamePrefix="react-select"
                      formatOptionLabel={(option) => (
                        setLatitude(option?.latitude),
                        setLongitude(option?.longitude),
                        <div className="d-flex align-items-center">
                          <img
                            height={20}
                            width={28}
                            alt={option.name}
                            src={option.flagUrl}
                            className="me-2"
                            style={{ objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                          <span>{option.label}</span>
                        </div>
                      )}
                      components={{
                        Option: CustomOption,
                      }}
                      styles={{
                        option: (provided, state) => ({
                          ...provided,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: '#f8f9fa'
                          },

                          '&.css-b62m3t-container': {
                            borderRadius: "65px"
                          }
                        })
                      }}
                    />
                  </div>
                  <div className="col-12 col-lg-6 col-sm-6 col-xs-12 mt-2"></div>
                  <div className="col-12 col-lg-6 col-sm-6 col-xs-12 mt-2">
                    <Input
                      label={"Latitude"}
                      name={"latitude"}
                      disabled={true}
                      value={latitude}
                      placeholder={"Country Select"}
                    />
                  </div>
                  <div className="col-12 col-lg-6 col-sm-6 col-xs-12 mt-2">
                    <Input
                      label={"Longitude"}
                      disabled={true}
                      name={"longitude"}
                      value={longitude}
                      placeholder={"Country Select"}
                    />
                  </div>
                  {/* {!dialogueData && (
                    <div className="col-12  col-lg-6 col-sm-12 mt-2 mb-3"></div>
                  )} */}
                  <div className="col-12  col-lg-6 col-sm-12 mt-2 video-upload">
                    <Input
                      type={"file"}
                      label={"Video Upload"}
                      accept={"video/mp4,video/x-m4v,video/*"}
                      onChange={handleFileUpload}
                      errorMessage={error.video && error.video}
                    />
                    <p className="extention-show">Accept only .mp4, .mov, .mkv, .webm</p>
                  </div>
                  {/* <div className="col-12  col-lg-6 col-sm-12 mt-2 mb-3">
                      <Input
                        label={"Video Time"}
                        name={"videoTime"}
                        accept={"video/*"}
                        placeholder={"Video Upload"}
                        value={videoTime}
                        disabled={true}
                      />
                    </div> */}
                  <div className="col-12  col-lg-6 col-sm-12 mt-2">
                    <Input
                      type={"file"}
                      label={"Thumbnail Image"}
                      name={"thumbnailImage"}
                      accept=".png, .jpg, .jpeg"
                      placeholder={"Thumbnail Upload"}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setVideo({ ...video, thumbnailBlob: file })
                        setThumbnailFile(file)
                      }}
                    />
                    <p className="extention-show">Accept only .jpg, .jpeg, .png</p>
                  </div>
                  {/* <div className="col-12  col-lg-3 col-sm-12 mt-2 mb-3">
                    <div className="row"> */}
                  {video?.file && (
                    <div className="col-12 col-sm-6  col-md-6  mt-2 mb-3 video-upload">
                      <div className=" video-show-upload">
                        {typeof video?.file === "string" ? (
                          <video controls width="400" src={video?.file} />
                        ) : (
                          <video
                            controls
                            width="400"
                            src={
                              video?.file
                                ? URL.createObjectURL(video?.file)
                                : ""
                            }
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {video?.thumbnailBlob && (
                    <div className=" col-12 col-sm-6  col-md-6  mt-2 mb-3 video-show-upload">
                      <>
                        {typeof video?.thumbnailBlob === "string" ? (
                          <>
                            <img
                              src={
                                video?.thumbnailBlob
                                  ? video?.thumbnailBlob
                                  : noImageFrom
                              }
                            />
                          </>
                        ) : (
                          <>
                            <img
                              src={
                                video?.thumbnailBlob
                                  ? URL.createObjectURL(
                                    video?.thumbnailBlob
                                  )
                                  : noImageFrom
                              }
                            />
                          </>
                        )}
                      </>
                    </div>
                  )}
                  {/* </div>
                  </div> */}

                  <div className="col-12 mt-2">
                    <div className="text-about">
                      <label
                        className="label-form"
                        style={{ fontWeight: "500", marginBottom: "5px" }}
                      >
                        Video Description
                      </label>
                      <textarea
                        cols={1}
                        rows={4}
                        className={"form-control"}
                        value={videoDescription}
                        label={"Video Description"}
                        name={"videoDescription"}
                        placeholder={"Enter Details..."}
                        onChange={(e) => {
                          setVideoDescription(e.target.value);
                          if (!e.target.value && !dialogueData) {
                            return setError({
                              ...error,
                              videoDescription: `Video Description Is Required`,
                            });
                          } else {
                            return setError({
                              ...error,
                              videoDescription: "",
                            });
                          }
                        }}
                      ></textarea>
                      {error.videoDescription && (
                        <p className="errorMessage">
                          {error.videoDescription && error.videoDescription}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="col-12 mt-2">
                    <div className="text-about">
                      <label
                        className="label-form"
                        style={{ fontWeight: "500", marginBottom: "5px" }}
                      >
                        HashTag
                      </label>
                      <textarea
                        cols={1}
                        rows={4}
                        className={"form-control"}
                        value={hashTag}
                        label={"HashTag"}
                        name={"hashTag"}
                        placeholder={"Enter Details..."}
                        onChange={handleHashTagChange}
                      ></textarea>
                      {error.hashTag && (
                        <p className="errorMessage">
                          {error.hashTag && error.hashTag}
                        </p>
                      )}
                      <span className="text-danger d-flex mt-1">
                        <p>Note : You can add Hash Tag separate by comma (,)</p>
                      </span>
                    </div>
                  </div>

                  <div className="col-12 col-lg-3 col-sm-6 col-md-6 col-xs-12 mt-3  mb-3 d-flex align-items-baseline type-radio-box flex-column">
                    <div className=" d-flex align-items-start flex-column  ">
                      <label
                        className="text-gray"
                        style={{
                          margin: "1px 5px 0px 2px",
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#1F1F1F",
                        }}
                      >
                        Schedule Type :
                      </label>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="scheduleType"
                          type="radio"
                          value={1}
                          name="scheduleType"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setScheduleType(e.target.value);
                          }}
                          checked={scheduleType == 1 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="scheduleType"
                        >
                          Schedule
                        </label>
                      </div>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="scheduleType"
                          type="radio"
                          value={2}
                          name="scheduleType"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setScheduleType(e.target.value);
                          }}
                          checked={scheduleType == 2 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="scheduleType"
                        >
                          Not Schedule
                        </label>
                      </div>
                    </div>
                    <div className="">
                      {scheduleType == 1 && (
                        <div className="col-12 mt-2">
                          <div className="d-flex flex-column react-date-range-picker">
                            <label>Schedule Time</label>
                            <ReactDatePicker
                              dateFormat="yyyy/MM/dd"
                              selected={Date.parse(scheduleTime)}
                              placeholderText="Select a date"
                              showIcon
                              style={{ width: "200px" }}
                              minDate={new Date()}
                              onChange={(date) => handleDateChange(date)}
                            />
                            {error.scheduleTime && (
                              <p className="errorMessage">
                                {error.scheduleTime && error.scheduleTime}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-lg-3 col-sm-6 col-md-6 col-xs-12 mt-2 d-flex align-items-baseline type-radio-box">
                    <div className="d-flex align-items-start flex-column">
                      <label
                        className="text-gray"
                        style={{
                          margin: "1px 5px 0px 2px",
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#1F1F1F",
                        }}
                      >
                        Visibility Type :
                      </label>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="normalVideo"
                          type="radio"
                          value={1}
                          name="visibilityType"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setVisibilityType(e.target.value);
                          }}
                          checked={visibilityType == 1 ? true : false}
                        />
                        <label className="form-check-label mb-1 " htmlFor="normalVideo">
                          Public
                        </label>
                      </div>
                      <div
                        className="  justify-content-start d-flex align-items-center ml-3 pl-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          type="radio"
                          id="shortVideo"
                          value={2}
                          name="visibilityType"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setVisibilityType(e.target.value);
                          }}
                          checked={visibilityType == 2 ? true : false}
                        />
                        <label className="form-check-label mb-1 " htmlFor="shortVideo">
                          Private
                        </label>
                      </div>
                      <div
                        className="  justify-content-start d-flex align-items-center ml-3 pl-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          type="radio"
                          id="shortVideo"
                          value={3}
                          name="visibilityType"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setVisibilityType(e.target.value);
                          }}
                          checked={visibilityType == 3 ? true : false}
                        />
                        <label className="form-check-label mb-1 " htmlFor="shortVideo">
                          Unlisted
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-3 col-md-6  col-sm-6 mt-2 d-flex align-items-baseline type-radio-box">
                    <div className="d-flex align-items-start flex-column">
                      <label
                        className="text-gray"
                        style={{
                          margin: "1px 5px 0px 2px",
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#1F1F1F",
                        }}
                      >
                        Comment Type :
                      </label>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="commentType1"
                          type="radio"
                          value={1}
                          name="commentType1"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setCommentType(e.target.value);
                          }}
                          checked={commentType == 1 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="commentType1"
                        >
                          Allow All
                        </label>
                      </div>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="commentType2"
                          type="radio"
                          value={2}
                          name="commentType2"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setCommentType(e.target.value);
                          }}
                          checked={commentType == 2 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="commentType2"
                        >
                          Disable
                        </label>
                      </div>
                      {/* <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <div style={{ width: "17px" }}>
                          <input
                            id="commentType3"
                            type="radio"
                            value={3}
                            name="commentType3"
                            className="ml-2 mb-0 cursor-pointer"
                            onClick={(e) => {
                              setCommentType(e.target.value);
                            }}
                            checked={commentType == 3 ? true : false}
                          />
                        </div>
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="commentType3"
                        >
                          Hold Potentially InApproPrivate For Review
                        </label>
                      </div>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="commentType4"
                          type="radio"
                          value={4}
                          name="commentType4"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setCommentType(e.target.value);
                          }}
                          checked={commentType == 4 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="commentType4"
                        >
                          Hold All For Review
                        </label>
                      </div> */}
                    </div>
                  </div>

                  <div className="col-12 col-lg-3 col-md-6  col-sm-6 mt-2 d-flex align-items-baseline type-radio-box">
                    <div className="d-flex align-items-start flex-column">
                      <label
                        className="text-gray"
                        style={{
                          margin: "1px 5px 0px 2px",
                          fontSize: "16px",
                          fontWeight: "500",
                          color: "#1F1F1F",
                        }}
                      >
                        Audience Type :
                      </label>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="audienceType1"
                          type="radio"
                          value={1}
                          name="audienceType1"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setAudienceType(e.target.value);
                          }}
                          checked={audienceType == 1 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="audienceType1"
                        >
                          Kids
                        </label>
                      </div>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <input
                          id="audienceType2"
                          type="radio"
                          value={2}
                          name="audienceType2"
                          className="ml-2 mb-0 cursor-pointer"
                          onClick={(e) => {
                            setAudienceType(e.target.value);
                          }}
                          checked={audienceType == 2 ? true : false}
                        />
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="audienceType2"
                        >
                          Adults
                        </label>
                      </div>
                      <div
                        className=" justify-content-start d-flex align-items-center mr-3 pr-2"
                        style={{ marginTop: "3px" }}
                      >
                        <div style={{ width: "17px" }}>
                          <input
                            id="audienceType3"
                            type="radio"
                            value={3}
                            name="audienceType3"
                            className="ml-2 mb-0 cursor-pointer"
                            onClick={(e) => {
                              setAudienceType(e.target.value);
                            }}
                            checked={audienceType == 3 ? true : false}
                          />
                        </div>
                        <label
                          className="form-check-label mb-1 "
                          htmlFor="audienceType3"
                        >
                          Both
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="cadrFooter p-2 d-flex justify-content-end">
                  <Button
                    newClass={"submit-btn"}
                    btnName={"Submit"}
                    type={"button"}
                    onClick={handleSubmit}
                  />
                </div>
              </form>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  createFakeUser,
  getFakeUserName,
  getIpAddress,
  createVideo,
  editVideo,
})(NewVideoAdd);

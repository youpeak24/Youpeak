import React, { useEffect, useState } from "react";
import Input from "../../extra/Input";
import Selector from "../../extra/Selector";
import NewTitle from "../../extra/Title";
import {
  getSettingApi,
  editSetting,
  switchApi,
  editWaterMark,
  StorageSetting,
} from "../../store/setting/setting.action";
import { FormControlLabel, Switch } from "@mui/material";
import styled from "@emotion/styled";
import { setToast } from "../../../util/toast";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../../extra/Button";
import { Skeleton } from "@mui/material";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import { uploadFile } from "../../../util/AwsFunction";
import { baseURL } from "../../../util/config";
import noImageFound from "../../../assets/images/noimage.png";
import { useTheme } from "@emotion/react";
import InfoTooltip from "../../extra/InfoTooltip";
import {
  resendApiSetting,
  zegoSetting,
  deeplinkSetting,
  appSettingContent,
  firebaseNotificationContent,
  channelVideoShortContent,
  coinSettingContent,
} from "../../extra/infoContent";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: "76px",
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    top: "8px",
    transform: "translateX(10px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(38px)",
      top: "8px",
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.5992 5.06724L16.5992 5.06719C16.396 4.86409 16.1205 4.75 15.8332 4.75C15.546 4.75 15.2705 4.86409 15.0673 5.06719L15.0673 5.06721L7.91657 12.2179L4.93394 9.23531C4.83434 9.13262 4.71537 9.05067 4.58391 8.9942C4.45174 8.93742 4.30959 8.90754 4.16575 8.90629C4.0219 8.90504 3.87925 8.93245 3.74611 8.98692C3.61297 9.04139 3.49202 9.12183 3.3903 9.22355C3.28858 9.32527 3.20814 9.44622 3.15367 9.57936C3.0992 9.7125 3.07179 9.85515 3.07304 9.99899C3.07429 10.1428 3.10417 10.285 3.16095 10.4172C3.21742 10.5486 3.29937 10.6676 3.40205 10.7672L7.15063 14.5158L7.15066 14.5158C7.35381 14.7189 7.62931 14.833 7.91657 14.833C8.20383 14.833 8.47933 14.7189 8.68249 14.5158L8.68251 14.5158L16.5992 6.5991L16.5992 6.59907C16.8023 6.39592 16.9164 6.12042 16.9164 5.83316C16.9164 5.54589 16.8023 5.27039 16.5992 5.06724Z" fill="white" stroke="white" stroke-width="0.5"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor: theme.palette === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme.palette === "dark" ? "#0FB515" : "red",
    width: 24,
    height: 24,
    "&:before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.1665 5.83301L5.83325 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M5.83325 5.83301L14.1665 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: "52px",
    border: "0.5px solid rgba(0, 0, 0, 0.14)",
    background: " #eff6ff",
    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.08) inset",
    opacity: 1,
    width: "60px",
    height: "28px",
    borderRadius: "52px",
  },
}));
function AppSetting(props) {
  const { settingData } = useSelector((state) => state.setting);
  const { isLoading } = useSelector((state) => state.dialogue);

  const { defaultCurrency } = useSelector((state) => state.currency);

  const dispatch = useDispatch();
  const [data, setData] = useState();
  const [originalData, setOriginalData] = useState({});
  const [privacyPolicyLink, setPrivacyPolicyLink] = useState();
  const [privacyPolicyText, setPrivacyPolicyText] = useState();
  const [zegoAppSignIn, setZegoAppSignIn] = useState();
  const [imageFile, setImageFile] = useState();
  const [zegoAppId, setZegoAppId] = useState();
  const [adminCommissionOfPaidChannel, setAdminCommissionOfPaidChannel] =
    useState();
  const [adminCommissionOfPaidVideo, setAdminCommissionOfPaidVideo] =
    useState();
  const [durationOfShorts, setDurationOfShorts] = useState();
  const [resendApiKey, setResendApiKey] = useState();
  const [websiteUrl, setWebsiteUrl] = useState();
  const [androidAssetLinks, setAndroidAssetLinks] = useState();
  const [appleAppSiteAssociation, setAppleAppSiteAssociation] = useState();
  const [privateKey, setPrivateKey] = useState();
  const [minCoinForCashOut, setMinCoinForCashOut] = useState();
  const [minConvertCoin, setMinConvertCoin] = useState();
  const [zegoServerSecret, setZegoServerSecret] = useState();
  const [selectedOption, setSelectedOption] = useState(
    settingData?.isWatermarkOn ? "Active" : "Inactive"
  );
  const [image, setImage] = useState();
  const [imgApi, setImgApi] = useState();
  const [showImg, setShowImg] = useState();
  const [localStorage, setLocalStorage] = useState(false);
  const [awsS3Storage, setAwsS3Storage] = useState(false);
  const [digitalOceanStorage, setDigitalOceanStorage] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState("");

  const [error, setError] = useState({
    privacyPolicyLink: "",
    privacyPolicyText: "",
    zegoAppId: "",
    zegoAppSignIn: "",
    adminCommissionOfPaidChannel: "",
    adminCommissionOfPaidVideo: "",
    durationOfShorts: "",
    resendApiKey: "",
    androidAssetLinks: "",
    appleAppSiteAssociation: "",
    privateKey: "",
    minCoinForCashOut: "",
    minConvertCoin: "",
    zegoServerSecret: "",
  });

  const theme = useTheme();

  useEffect(() => {
    dispatch(getSettingApi());
    dispatch(getDefaultCurrency());
  }, [dispatch]);
  useEffect(() => {
    setSelectedOption(settingData?.isWatermarkOn ? "active" : "inactive");
    setImage(
      settingData?.watermarkIcon ? settingData?.watermarkIcon : noImageFound
    );
  }, [settingData]);

  const handleWaterMarkSubmit = async () => {

    let url;
    url = await handleFileUpload(image);

    let data = {
      settingId: settingData?._id,
      watermarkType: selectedOption === "active" ? 1 : 2,
      watermarkIcon: url,
    };
    props.editWaterMark(data);
  };

  useEffect(() => {
    setData(settingData);
  }, [settingData]);

  useEffect(() => {
    setPrivacyPolicyLink(settingData?.privacyPolicyLink);
    setPrivacyPolicyText(settingData?.privacyPolicyText);
    setAdminCommissionOfPaidChannel(settingData?.adminCommissionOfPaidChannel);
    setAdminCommissionOfPaidVideo(settingData?.adminCommissionOfPaidVideo);
    setDurationOfShorts(settingData?.durationOfShorts);
    setResendApiKey(settingData?.resendApiKey);
    setWebsiteUrl(settingData?.websiteUrl ?? "");

    const androidAssetLinksValue =
      typeof settingData?.androidAssetLinks === "string"
        ? settingData?.androidAssetLinks
        : settingData?.androidAssetLinks
          ? JSON.stringify(settingData.androidAssetLinks, null, 2)
          : "";

    const appleAppSiteAssociationValue =
      typeof settingData?.appleAppSiteAssociation === "string"
        ? settingData?.appleAppSiteAssociation
        : settingData?.appleAppSiteAssociation
          ? JSON.stringify(settingData.appleAppSiteAssociation, null, 2)
          : "";

    setAndroidAssetLinks(androidAssetLinksValue);
    setAppleAppSiteAssociation(appleAppSiteAssociationValue);
    setZegoAppId(settingData?.zegoAppId);
    setZegoAppSignIn(settingData?.zegoAppSignIn);
    setZegoServerSecret(settingData?.zegoServerSecret);
    setPrivateKey(JSON.stringify(settingData?.privateKey));
    setMinCoinForCashOut(settingData?.minCoinForCashOut);
    setMinConvertCoin(settingData?.minConvertCoin);
    setImage(settingData?.watermarkIcon);
    setImgApi(settingData?.watermarkIcon);
    if (settingData?.storage) {
      setAwsS3Storage(settingData?.storage?.awsS3);
      setDigitalOceanStorage(settingData?.storage?.digitalOcean);
      setLocalStorage(settingData?.storage?.local);
    }

    // Set original data for comparison
    setOriginalData({
      privacyPolicyLink: settingData?.privacyPolicyLink,
      privacyPolicyText: settingData?.privacyPolicyText,
      adminCommissionOfPaidChannel: settingData?.adminCommissionOfPaidChannel,
      adminCommissionOfPaidVideo: settingData?.adminCommissionOfPaidVideo,
      durationOfShorts: settingData?.durationOfShorts,
      resendApiKey: settingData?.resendApiKey,
      websiteUrl: settingData?.websiteUrl ?? "",
      androidAssetLinks: androidAssetLinksValue,
      appleAppSiteAssociation: appleAppSiteAssociationValue,
      zegoAppId: settingData?.zegoAppId,
      zegoAppSignIn: settingData?.zegoAppSignIn,
      zegoServerSecret: settingData?.zegoServerSecret,
      privateKey: JSON.stringify(settingData?.privateKey),
      minCoinForCashOut: settingData?.minCoinForCashOut,
      minConvertCoin: settingData?.minConvertCoin,
    });
  }, [settingData]);

  const handleChange = (type) => {
    setLocalStorage(type === "local");
    setAwsS3Storage(type === "awsS3");
    setDigitalOceanStorage(type === "digitalOcean");

    setSelectedStorage(type);
  };

  const handleSave = () => {


    const payload = {
      settingId: settingData?._id,
      type: selectedStorage,
    };
    dispatch(StorageSetting(payload));
  };

  const handleSubmit = () => {

    const adminCommissionOfPaidChannelValue = parseInt(
      adminCommissionOfPaidChannel
    );
    const adminCommissionOfPaidVideoValue = parseInt(
      adminCommissionOfPaidVideo
    );
    const durationOfShortsValue = parseInt(durationOfShorts);

    const minCoinForCashOutvalue = parseInt(minCoinForCashOut);
    const minConvertCoinvalue = parseInt(minConvertCoin);
    if (
      !privacyPolicyLink ||
      !privacyPolicyText ||
      !privateKey ||
      !zegoAppId ||
      !resendApiKey ||
      !zegoAppSignIn ||
      !zegoServerSecret ||
      adminCommissionOfPaidChannel === "" ||
      adminCommissionOfPaidVideo === "" ||
      durationOfShorts === "" ||
      minCoinForCashOut === "" ||
      minConvertCoin === "" ||
      adminCommissionOfPaidChannelValue < 0 ||
      adminCommissionOfPaidVideoValue < 0 ||
      durationOfShortsValue < 0 ||
      minCoinForCashOutvalue < 0 ||
      minConvertCoinvalue < 0
    ) {
      let error = {};
      if (!privacyPolicyLink)
        error.privacyPolicyLink = "PrivacyPolicyLink Is Required !";
      if (!privacyPolicyText)
        error.privacyPolicyText = "PrivacyPolicyText Is Required !";

      if (!zegoAppId) error.zegoAppId = "Zego AppID Is Required !";
      if (!resendApiKey) error.resendApiKey = "Resend ApiKey Is Required !";
      if (!zegoAppSignIn) error.zegoAppSignIn = "Zego AppSignIn Is Required !";
      if (!zegoServerSecret)
        error.zegoServerSecret = "Zego Server Secret Is Required !";
      if (adminCommissionOfPaidChannel === "")
        error.adminCommissionOfPaidChannel =
          "Commission Of PaidChannel Is Required !";
      if (adminCommissionOfPaidVideo === "")
        error.adminCommissionOfPaidVideo =
          "Commission Of PaidVideo Is Required !";
      if (durationOfShorts === "")
        error.durationOfShorts = "Duration Of Shorts Is Required !";
      if (minCoinForCashOut === "")
        error.minCoinForCashOut =
          "Minimum coin for cash out Is Required !";
      if (minConvertCoin === "")
        error.minConvertCoin = "Minimum convert coin Is Required !";
      if (adminCommissionOfPaidChannelValue < 0)
        error.adminCommissionOfPaidChannel =
          "Commission Of PaidChannel Invalid !";
      if (adminCommissionOfPaidVideoValue < 0)
        error.adminCommissionOfPaidVideo = "Commission Of PaidVideo Invalid !";
      if (durationOfShortsValue < 0)
        error.durationOfShorts = "Duration Of Shorts Invalid !";
      if (minCoinForCashOutvalue < 0)
        error.minCoinForCashOut = "Minimum coin for cash out Invalid !";
      if (minConvertCoinvalue < 0)
        error.minConvertCoin = "Minimum convert coin Invalid !";
      if (!privateKey) error.privateKey = "Private Key Json Is Required !";
      return setError({ ...error });
    } else {
      // Build updatedData with only changed fields
      const updatedData = {};
      if (privacyPolicyLink !== originalData.privacyPolicyLink) {
        updatedData.privacyPolicyLink = privacyPolicyLink;
      }
      if (privacyPolicyText !== originalData.privacyPolicyText) {
        updatedData.privacyPolicyText = privacyPolicyText;
      }
      if (adminCommissionOfPaidChannel !== originalData.adminCommissionOfPaidChannel) {
        updatedData.adminCommissionOfPaidChannel = adminCommissionOfPaidChannel;
      }
      if (adminCommissionOfPaidVideo !== originalData.adminCommissionOfPaidVideo) {
        updatedData.adminCommissionOfPaidVideo = adminCommissionOfPaidVideo;
      }
      if (durationOfShorts !== originalData.durationOfShorts) {
        updatedData.durationOfShorts = durationOfShorts;
      }
      if (zegoAppId !== originalData.zegoAppId) {
        updatedData.zegoAppId = zegoAppId;
      }
      if (resendApiKey !== originalData.resendApiKey) {
        updatedData.resendApiKey = resendApiKey;
      }
      if (zegoAppSignIn !== originalData.zegoAppSignIn) {
        updatedData.zegoAppSignIn = zegoAppSignIn;
      }
      if (zegoServerSecret !== originalData.zegoServerSecret) {
        updatedData.zegoServerSecret = zegoServerSecret;
      }
      if (privateKey !== originalData.privateKey) {
        updatedData.privateKey = privateKey;
      }
      if (minCoinForCashOut !== originalData.minCoinForCashOut) {
        updatedData.minCoinForCashOut = minCoinForCashOut;
      }
      if (minConvertCoin !== originalData.minConvertCoin) {
        updatedData.minConvertCoin = minConvertCoin;
      }
      if (websiteUrl !== originalData.websiteUrl) {
        updatedData.websiteUrl = websiteUrl;
      }
      if (androidAssetLinks !== originalData.androidAssetLinks) {
        updatedData.androidAssetLinks = androidAssetLinks;
      }
      if (appleAppSiteAssociation !== originalData.appleAppSiteAssociation) {
        updatedData.appleAppSiteAssociation = appleAppSiteAssociation;
      }

      // If there are changes, send payload with only updated fields
      if (Object.keys(updatedData).length > 0) {
        const payload = {
          settingId: data?._id,
          ...updatedData,
        };
        props.editSetting(data?._id, payload);
      } else {
        setToast("info", "No changes made");
      }
    }
  };

  useEffect(() => {
    if (props.submitTrigger > 0) {
      handleSubmit();
    }
  }, [props.submitTrigger]);

  const handleImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
      setImgApi(URL.createObjectURL(e.target.files[0]));
      setImageFile(e.target.files[0]);
    }
  };

  let folderStructure = "waterMarkImage";

  const handleFileUpload = async (image) => {
    if (!image) {
      setError((prev) => ({
        ...prev,
        image: "Image is required",
      }));
      return null;
    }

    try {
      const { resDataUrl } = await uploadFile(image, folderStructure); // ✅ image[0]

      setImgApi(resDataUrl);
      setImage(resDataUrl);
      return resDataUrl;
    } catch (err) {
      console.error("Upload error", err);
      return null;
    }
  };

  return (
    <div className="payment-setting app-setting p-0 mainSetting">
      <form>
        <div className="settingBox row g-3">
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">App Setting</h4>
                <InfoTooltip title="App Setting" content={appSettingContent} />
              </div>
              {/*  */}
              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input border-setting">
                    <Input
                      label={
                        "Privacy Policy Link (User redirected to this link in app)"
                      }
                      name={"privacyPolicyLink"}
                      type={"text"}
                      value={privacyPolicyLink}
                      loading={isLoading}
                      errorMessage={
                        error.privacyPolicyLink && error.privacyPolicyLink
                      }
                      placeholder={
                        "Enter Detail..."
                      }
                      onChange={(e) => {
                        setPrivacyPolicyLink(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            privacyPolicyLink: `PrivacyPolicyLink Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            privacyPolicyLink: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 withdrawal-input mt-2 border-0">
                    <Input
                      label={"Privacy Policy Text (Show in app)"}
                      name={"privacyPolicyText"}
                      value={privacyPolicyText}
                      loading={isLoading}
                      errorMessage={
                        error.privacyPolicyText && error.privacyPolicyText
                      }
                      type={"text"}
                      placeholder={
                        "Enter Detail..."
                      }
                      onChange={(e) => {
                        setPrivacyPolicyText(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            privacyPolicyText: `PrivacyPolicyText Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            privacyPolicyText: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 withdrawal-input mt-2 border-0">
                    <Input
                      label={"Website URL"}
                      name={"websiteUrl"}
                      type={"text"}
                      value={websiteUrl}
                      loading={isLoading}
                      placeholder={
                        "Enter Website URL..."
                      }
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Zego Cloud Setting</h4>
                <InfoTooltip title="Zego Cloud Setting" content={zegoSetting} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input">
                    <Input
                      label={"Zego AppId"}
                      name={"zegoAppId"}
                      type={"text"}
                      value={zegoAppId}
                      loading={isLoading}
                      placeholder={
                        "Enter Detail..."
                      }
                      errorMessage={error.zegoAppId && error.zegoAppId}
                      onChange={(e) => {
                        setZegoAppId(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            zegoAppId: `Zego AppId Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            zegoAppId: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 withdrawal-input border-0 mt-2">
                    <Input
                      label={"Zego AppSignIn"}
                      name={"zegoAppSignIn"}
                      value={zegoAppSignIn}
                      loading={isLoading}
                      errorMessage={
                        error.zegoAppSignIn && error.zegoAppSignIn
                      }
                      type={"text"}
                      placeholder={
                        "Enter Detail..."
                      }
                      onChange={(e) => {
                        setZegoAppSignIn(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            zegoAppSignIn: `zegoApp SignIn Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            zegoAppSignIn: "",
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="col-12 withdrawal-input border-0 mt-2">
                    <Input
                      label={"Zego Server Secret"}
                      name={"zegoServerSecret"}
                      value={zegoServerSecret}
                      loading={isLoading}
                      errorMessage={
                        error.zegoServerSecret && error.zegoServerSecret
                      }
                      type={"text"}
                      placeholder={
                        "Enter Detail..."
                      }
                      onChange={(e) => {
                        setZegoServerSecret(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            zegoServerSecret: `Zego Server Secret Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            zegoServerSecret: "",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter h-100">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Firebase Notification Setting</h4>
                <InfoTooltip
                  title="Firebase Notification Setting"
                  content={firebaseNotificationContent}
                />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input duration-short border-0 mt-0">
                    <div className="custom-input number undefined h-100">
                      <label className="form-label" htmlFor="privateKey">
                        Private Key JSON (firebase private key for
                        notification)
                      </label>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="100%" height={200} style={{ borderRadius: '8px' }} />
                      ) : (
                        <textarea
                          name=""
                          className="form-control mt-2 h-100"
                          id="privateKey"
                          rows={10}
                          // value={privateKey}
                          value={
                            privateKey
                          }
                          onChange={(e) => {
                            const newValue = e.target.value;
                            try {
                              const newData = JSON.parse(newValue);
                              setPrivateKey(newValue);
                              setError("");
                            } catch (error) {
                              // Handle invalid JSON input
                              console.error("Invalid JSON input:", error);
                              setPrivateKey(newValue);
                              return setError({
                                ...error,
                                privateKey: "Invalid JSON input",
                              });
                            }
                          }}
                        ></textarea>
                      )}

                      {error.privateKey && (
                        <div className="ml-2 mt-1">
                          {error.privateKey && (
                            <div className="pl-1 text__left">
                              <span className="text-red">
                                {error.privateKey}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Channel Video Short Setting</h4>
                <InfoTooltip
                  title="Channel Video Short Setting"
                  content={channelVideoShortContent}
                />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input duration-short border-0 mt-0">
                    <Input
                      label={`Duration Of Shorts in seconds (User can upload short video max ${durationOfShorts} seconds)`}
                      name={"durationOfShorts"}
                      type={"number"}
                      loading={isLoading}
                      value={
                        durationOfShorts
                      }
                      errorMessage={
                        error.durationOfShorts && error.durationOfShorts
                      }
                      placeholder={"Enter Duration in seconds..."}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = parseInt(value);

                        setDurationOfShorts(value);

                        if (value === "") {
                          setError({
                            ...error,
                            durationOfShorts: "Duration Of Shorts Is Required !",
                          });
                        } else if (!isNaN(numericValue) && numericValue < 0) {
                          setError({
                            ...error,
                            durationOfShorts: "Duration Of Shorts Invalid !",
                          });
                        } else {
                          setError({
                            ...error,
                            durationOfShorts: "",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="settingBoxOuter mt-4">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Coin Setting</h4>
                <InfoTooltip title="Coin Setting" content={coinSettingContent} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-6 withdrawal-input">
                    <div className="row">
                      <div className="col-11">
                        <Input
                          label={`Amount(${defaultCurrency?.symbol
                            ? defaultCurrency?.symbol
                            : ""
                            })`}
                          name={"durationOfShorts"}
                          type={"number"}
                          loading={isLoading}
                          value={`1`}
                          placeholder={""}
                          readOnly
                        />
                      </div>

                      <p className="col-1 d-flex align-items-center mt-3 fs-5">
                        =
                      </p>
                    </div>
                  </div>

                  <div className="col-6 withdrawal-input">
                    <Input
                      label={"Coin(how many coin required for withdraw)"}
                      name={"Coin"}
                      // value={minCoinForCashOut}
                      loading={isLoading}
                      value={
                        minCoinForCashOut
                      }
                      type={"number"}
                      placeholder={""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = parseInt(value);

                        setMinCoinForCashOut(value);

                        if (value === "") {
                          setError({
                            ...error,
                            minCoinForCashOut:
                              "Minimum coin for cash out Is Required !",
                          });
                        } else if (!isNaN(numericValue) && numericValue < 0) {
                          setError({
                            ...error,
                            minCoinForCashOut:
                              "Minimum coin for cash out Invalid !",
                          });
                        } else {
                          setError({
                            ...error,
                            minCoinForCashOut: "",
                          });
                        }
                      }}
                      errorMessage={
                        error.minCoinForCashOut && error.minCoinForCashOut
                      }
                    />
                  </div>

                  <div className="col-12 withdrawal-input">
                    <Input
                      label={"Coin  (how many coin required for covert)"}
                      name={"minConvertCoin"}
                      // value={minConvertCoin}
                      loading={isLoading}
                      value={
                        minConvertCoin
                      }
                      type={"number"}
                      placeholder={""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = parseInt(value);

                        setMinConvertCoin(value);

                        if (value === "") {
                          setError({
                            ...error,
                            minConvertCoin:
                              "Minimum convert coin Is Required !",
                          });
                        } else if (!isNaN(numericValue) && numericValue < 0) {
                          setError({
                            ...error,
                            minConvertCoin:
                              "Minimum convert coin Invalid !",
                          });
                        } else {
                          setError({
                            ...error,
                            minConvertCoin: "",
                          });
                        }
                      }}
                      errorMessage={
                        error.minConvertCoin && error.minConvertCoin
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center flex-wrap gap-2 px-2">
                <h4 className="settingboxheader mb-0">Water Mark Setting</h4>
                <Button
                  btnName={"Submit"}
                  type={"button"}
                  onClick={handleWaterMarkSubmit}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "88px",
                    marginLeft: "10px",
                  }}
                />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  {/* Radio Button for Inactive */}
                  <div className="d-flex justify-content-center mt-4 ">
                    {isLoading ? (
                      <div className="col-12 d-flex gap-4 justify-content-center">
                        <Skeleton variant="rectangular" width="100px" height={30} style={{ borderRadius: '20px' }} />
                        <Skeleton variant="rectangular" width="100px" height={30} style={{ borderRadius: '20px' }} />
                      </div>
                    ) : (
                      <>
                        <div className="col-6">
                          <label
                            className={`radio-label ${selectedOption === "inactive" ? "active-radio" : ""
                              }`}
                          >
                            <input
                              type="radio"
                              name="watermark"
                              value="inactive"
                              className="ms-2 custom-radio"
                              checked={selectedOption === "inactive"}
                              onChange={() => {
                                setSelectedOption("inactive");
                              }}
                            />
                            Inactive
                          </label>
                        </div>
                        <div className="col-6">
                          <label
                            className={`radio-label ${selectedOption === "active" ? "active-radio" : ""
                              }`}
                          >
                            <input
                              type="radio"
                              name="watermark"
                              value="active"
                              className="ms-2 custom-radio"
                              checked={selectedOption === "active"}
                              onChange={() => setSelectedOption("active")}
                            />
                            Active
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  {/* {selectedOption === "inactive" && (
                      <div className="d-flex justify-content-end mt-4">
                        <Button
                          btnName={"Submit"}
                          type={"button"}
                          onClick={handleWaterMarkSubmit}
                          newClass={"submit-btn"}
                          style={{
                            borderRadius: "0.5rem",
                            width: "88px",
                            marginLeft: "10px",
                          }}
                        />
                      </div>
                    )} */}
                </div>

                {/* Conditionally render the image upload input if 'Active' is selected */}
                {selectedOption === "active" && (
                  <>
                    {/* <div className="mt-3">
                        <label htmlFor="imageUpload">Upload Watermark Image:</label>
                        <input
                          type="file"
                          id="imageUpload"
                          name="imageUpload"
                          accept="image/*"
                          className="form-control"
                        />
                      </div> */}
                    <div className="mt-4">
                      <Input
                        type={"file"}
                        label={"Upload Watermark Image"}
                        accept={"image/png, image/jpeg"}
                        loading={isLoading}
                        // errorMessage={error.image && error.image}
                        onChange={handleImage}
                      />
                    </div>

                    <div className=" mt-2 fake-create-img mb-2">
                      {image && (
                        <div className="mt-3">
                          <img
                            src={imgApi}
                            // alt="Watermark Preview"
                            style={{ width: "96px", height: "auto" }}
                          />
                        </div>
                      )}
                    </div>

                    {/* <div className="d-flex justify-content-end mt-4">
                        <Button
                          btnName={"Submit"}
                          type={"button"}
                          onClick={handleWaterMarkSubmit}
                          newClass={"submit-btn"}
                          style={{
                            borderRadius: "0.5rem",
                            width: "88px",
                            marginLeft: "10px",
                          }}
                        />
                      </div> */}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Email Setting</h4>
                <InfoTooltip title="Email Setting" content={resendApiSetting} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input duration-short border-0 mt-0">
                    <Input
                      label={`Resend Api Key`}
                      name={"resendApiKey"}
                      type={"text"}
                      value={resendApiKey}
                      loading={isLoading}
                      errorMessage={error.resendApiKey && error.resendApiKey}
                      // placeholder={"Enter Resend Api Key"}
                      placeholder={
                        "Enter Resend Api Key"
                      }
                      onChange={(e) => {
                        setResendApiKey(e.target.value);
                        if (!e.target.value) {
                          return setError({
                            ...error,
                            resendApiKey: `Resend Api Key Is Required`,
                          });
                        } else {
                          return setError({
                            ...error,
                            resendApiKey: "",
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Deeplink Setting</h4>
                <InfoTooltip title="Deeplink Setting" content={deeplinkSetting} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 col-md-6 withdrawal-input duration-short border-0 mt-0">
                    <div className="custom-input undefined">
                      <label className="form-label d-flex align-items-center gap-1" htmlFor="androidAssetLinks">
                        Android Asset Links (JSON Array)
                        {/* <InfoTooltip title={deeplinkSetting[0]?.label} content={[deeplinkSetting[0]]} /> */}
                      </label>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="100%" height={100} style={{ borderRadius: '8px' }} />
                      ) : (
                        <textarea
                          name="androidAssetLinks"
                          className="form-control mt-2"
                          id="androidAssetLinks"
                          rows={7}
                          style={{ minHeight: "80px", maxHeight: "140px", resize: "vertical" }}
                          value={androidAssetLinks ?? ""}
                          placeholder="Enter Android Asset Links JSON..."
                          onChange={(e) => setAndroidAssetLinks(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-md-6 withdrawal-input duration-short border-0 mt-0">
                    <div className="custom-input undefined">
                      <label className="form-label d-flex align-items-center gap-1" htmlFor="appleAppSiteAssociation">
                        Apple App Site Association
                        {/* <InfoTooltip title={deeplinkSetting[1]?.label} content={[deeplinkSetting[1]]} /> */}
                      </label>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="100%" height={100} style={{ borderRadius: '8px' }} />
                      ) : (
                        <textarea
                          name="appleAppSiteAssociation"
                          className="form-control mt-2"
                          id="appleAppSiteAssociation"
                          rows={7}
                          style={{ minHeight: "80px", maxHeight: "140px", resize: "vertical" }}
                          value={appleAppSiteAssociation ?? ""}
                          placeholder="Enter Apple App Site Association JSON..."
                          onChange={(e) => setAppleAppSiteAssociation(e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>



  );
}
export default connect(null, {
  getSettingApi,
  editSetting,
  switchApi,
  editWaterMark,
})(AppSetting);

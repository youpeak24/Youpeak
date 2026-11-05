import React, { useEffect, useMemo, useState } from "react";
import Input from "../../extra/Input";
import {
  getSettingApi,
  editSetting,
  switchApi,
  getAdsApi,
  isAdsChange,
  adsApiData,
  getWithdrawalApi,
} from "../../store/setting/setting.action";
import { FormControlLabel, Switch } from "@mui/material";
import styled from "@emotion/styled";
import { connect, useDispatch, useSelector } from "react-redux";
import Button from "../../extra/Button";
import { Skeleton } from "@mui/material";

import { setToast } from "../../../util/toast";
import { getDefaultCurrency } from "../../store/currency/currency.action";
import InfoTooltip from "../../extra/InfoTooltip";
import { androidAdsContent, iosAdsContent, imaAdsTagsContent } from "../../extra/infoContent";

/* Styled switch (correct mode check) */
const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 76,
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    top: 8,
    transform: "translateX(10px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(38px)",
      top: 8,
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M16.5992 5.06724C16.396 4.86409 16.1205 4.75 15.8332 4.75c-.2872 0-.5627.11409-.7659.31719L7.9166 12.2179 4.934 9.2353a1.17 1.17 0 0 0-1.7801 1.532l3.7486 3.7486c.2031.2031.4786.3172.7659.3172s.5627-.1141.7659-.3172l7.9167-7.9167c.2031-.20315.3172-.47865.3172-.76591 0-.28727-.1141-.56277-.3172-.76592Z" fill="white" stroke="white" stroke-width="0.5"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 1,
        backgroundColor:
          theme?.palette?.mode === "dark" ? "#8796A5" : "#aab4be",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: theme?.palette?.mode === "dark" ? "#0FB515" : "red",
    width: 24,
    height: 24,
    "&:before": {
      content: "''",
      position: "absolute",
      inset: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M14.1665 5.83301 5.83325 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M5.83325 5.83301 14.1665 14.1663" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    border: "0.5px solid rgba(0,0,0,0.14)",
    background: "#eff6ff",
    boxShadow: "inset 0 0 2px rgba(0,0,0,0.08)",
    opacity: 1,
    width: 60,
    height: 28,
    borderRadius: 52,
  },
}));

const MonetizationSetting = (props) => {
  const dispatch = useDispatch();
  const { settingData, adsData } = useSelector((s) => s.setting);
  const { isLoading } = useSelector((s) => s.dialogue);
  const { defaultCurrency } = useSelector((s) => s.currency);

  /* Monetize state */
  const [data, setData] = useState(null);

  const [originalData, setOriginalData] = useState({});
  const [isMonetization, setIsMonetization] = useState(false);
  const [minWatchTime, setMinWatchTime] = useState(0);
  const [minSubScriber, setMinSubScriber] = useState(0);
  const [earningPerHour, setEarningPerHour] = useState(0);
  const [adDisplayIndex, setAdDisplayIndex] = useState(1);

  /* Ads state (Android) */
  const [androidGoogleInterstitial, setAndroidGoogleInterstitial] = useState("");
  const [androidGoogleNative, setAndroidGoogleNative] = useState("");
  const [androidGoogleNativeVideo, setAndroidGoogleNativeVideo] = useState("");
  const [androidGoogleReward, setAndroidGoogleReward] = useState("");
  const [androidVideoAdUrl, setAndroidVideoAdUrl] = useState(""); // NEW (flat submit)

  /* Ads state (iOS) */
  const [iosGoogleInterstitial, setIosGoogleInterstitial] = useState("");
  const [iosGoogleNative, setIosGoogleNative] = useState("");
  const [iosGoogleNativeVideo, setIosGoogleNativeVideo] = useState("");
  const [iosGoogleReward, setIosGoogleReward] = useState("");
  const [iosVideoAdUrl, setIosVideoAdUrl] = useState(""); // NEW (flat submit)

  /* IMA Tags (comma-separated in API: imaTagsUrl) */
  const [imaTagUrl1, setImaTagUrl1] = useState("");
  const [imaTagUrl2, setImaTagUrl2] = useState("");
  const [imaTagUrl3, setImaTagUrl3] = useState("");

  const [googleAds, setGoogleAds] = useState(false);
  const [originalAdsData, setOriginalAdsData] = useState({});

  const [error, setError] = useState({
    minWatchTime: "",
    minSubScriber: "",
    earningPerHour: "",
    adDisplayIndex: "",
  });

  /* Bootstrap */
  useEffect(() => {
    dispatch(getSettingApi());
    dispatch(getDefaultCurrency());
    dispatch(getAdsApi());
  }, [dispatch]);

  /* Store → local (Monetize) */
  useEffect(() => {
    if (!settingData) return;
    setData(settingData);
    setIsMonetization(Boolean(settingData?.isMonetization));
    setMinWatchTime(Number(settingData?.minWatchTime || 0));
    setMinSubScriber(Number(settingData?.minSubScriber || 0));
    setEarningPerHour(Number(settingData?.earningPerHour || 0));
    setAdDisplayIndex(
      Number.isFinite(Number(settingData?.adDisplayIndex))
        ? Number(settingData?.adDisplayIndex)
        : 1
    );

    // Set original data for comparison
    setOriginalData({
      minWatchTime: Number(settingData?.minWatchTime || 0),
      minSubScriber: Number(settingData?.minSubScriber || 0),
      earningPerHour: Number(settingData?.earningPerHour || 0),
      adDisplayIndex: Number.isFinite(Number(settingData?.adDisplayIndex))
        ? Number(settingData?.adDisplayIndex)
        : 1,
    });
  }, [settingData]);

  /* Store → local (Ads, read nested, keep flat state) */
  useEffect(() => {
    if (!adsData) return;

    setAndroidGoogleInterstitial(adsData?.android?.google?.interstitial || "");
    setAndroidGoogleNative(adsData?.android?.google?.native || "");
    setAndroidGoogleNativeVideo(adsData?.android?.google?.nativeAdVideo || "");
    setAndroidGoogleReward(adsData?.android?.google?.reward || "");
    setAndroidVideoAdUrl(adsData?.android?.google?.videoAdUrl || ""); // NEW

    setIosGoogleInterstitial(adsData?.ios?.google?.interstitial || "");
    setIosGoogleNative(adsData?.ios?.google?.native || "");
    setIosGoogleNativeVideo(adsData?.ios?.google?.nativeAdVideo || "");
    setIosGoogleReward(adsData?.ios?.google?.reward || "");
    setIosVideoAdUrl(adsData?.ios?.google?.videoAdUrl || ""); // NEW

    const rawImaTags =
      adsData?.imaTagsUrl ??
      adsData?.google?.imaTagsUrl ??
      adsData?.android?.google?.imaTagsUrl ??
      "";
    const parsedImaTags = String(rawImaTags)
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setImaTagUrl1(parsedImaTags[0] || "");
    setImaTagUrl2(parsedImaTags[1] || "");
    setImaTagUrl3(parsedImaTags[2] || "");

    setGoogleAds(Boolean(adsData?.isGoogle));

    // Set original ads data for comparison
    setOriginalAdsData({
      androidGoogleInterstitial: adsData?.android?.google?.interstitial || "",
      androidGoogleNative: adsData?.android?.google?.native || "",
      androidGoogleNativeVideo: adsData?.android?.google?.nativeAdVideo || "",
      androidGoogleReward: adsData?.android?.google?.reward || "",
      androidVideoAdUrl: adsData?.android?.google?.videoAdUrl || "",
      iosGoogleInterstitial: adsData?.ios?.google?.interstitial || "",
      iosGoogleNative: adsData?.ios?.google?.native || "",
      iosGoogleNativeVideo: adsData?.ios?.google?.nativeAdVideo || "",
      iosGoogleReward: adsData?.ios?.google?.reward || "",
      iosVideoAdUrl: adsData?.ios?.google?.videoAdUrl || "",
      imaTagsUrl: String(rawImaTags || ""),
    });
  }, [adsData]);

  /* Helpers */
  const guardPermission = async () => {
    return true;
  };

  const validateMonetizeForm = () => {
    const errs = {};
    if (minWatchTime === "" || minWatchTime === null) {
      errs.minWatchTime = "Min Watch Time is required !";
    } else if (!Number.isFinite(Number(minWatchTime)) || Number(minWatchTime) <= 0) {
      errs.minWatchTime = "Min Watch Time must be > 0.";
    }

    if (minSubScriber === "" || minSubScriber === null) {
      errs.minSubScriber = "Min Subscriber is required !";
    } else if (!Number.isFinite(Number(minSubScriber)) || Number(minSubScriber) < 0) {
      errs.minSubScriber = "Min Subscriber must be ≥ 0.";
    }

    if (earningPerHour === "" || earningPerHour === null) {
      errs.earningPerHour = "Earning per hour is required !";
    } else if (!Number.isFinite(Number(earningPerHour)) || Number(earningPerHour) < 0) {
      errs.earningPerHour = "Earning per hour must be ≥ 0.";
    }

    if (adDisplayIndex === "" || adDisplayIndex === null) {
      errs.adDisplayIndex = "Ad Display Frequency is required !";
    } else if (
      !Number.isFinite(Number(adDisplayIndex)) ||
      Number(adDisplayIndex) <= 0
    ) {
      errs.adDisplayIndex = "Ad Display Frequency must be > 0.";
    }

    setError((prev) => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  /* Handlers */
  const handleSubmit = async () => {
    if (!(await guardPermission())) return;
    if (!validateMonetizeForm()) return;

    // Only send changed fields
    let payload = {};

    if (Number(minWatchTime) !== originalData.minWatchTime) {
      payload.minWatchTime = Number(minWatchTime);
    }
    if (Number(minSubScriber) !== originalData.minSubScriber) {
      payload.minSubScriber = Number(minSubScriber);
    }
    if (Math.max(1, Number(adDisplayIndex) || 1) !== originalData.adDisplayIndex) {
      payload.adDisplayIndex = Math.max(1, Number(adDisplayIndex) || 1);
    }
    if (Number(earningPerHour) !== originalData.earningPerHour) {
      payload.earningPerHour = Number(earningPerHour);
    }

    // If no changes, don't call API
    if (Object.keys(payload).length === 0) {
      return "noChanges";
    }

    props.editSetting(data?._id, payload);
    return "updated";
  };

  // ⬇️ Only send changed fields
  const handleSubmitAds = async () => {
    if (!(await guardPermission())) return;

    let adsDataApi = {};

    if (androidGoogleInterstitial !== originalAdsData.androidGoogleInterstitial) {
      adsDataApi.androidGoogleInterstitial = androidGoogleInterstitial;
    }
    if (androidGoogleNative !== originalAdsData.androidGoogleNative) {
      adsDataApi.androidGoogleNative = androidGoogleNative;
    }
    if (androidGoogleNativeVideo !== originalAdsData.androidGoogleNativeVideo) {
      adsDataApi.androidNativeAdVideo = androidGoogleNativeVideo;
    }
    if (iosGoogleNativeVideo !== originalAdsData.iosGoogleNativeVideo) {
      adsDataApi.iosNativeAdVideo = iosGoogleNativeVideo;
    }
    if (iosGoogleNative !== originalAdsData.iosGoogleNative) {
      adsDataApi.iosGoogleNative = iosGoogleNative;
    }
    if (iosGoogleInterstitial !== originalAdsData.iosGoogleInterstitial) {
      adsDataApi.iosGoogleInterstitial = iosGoogleInterstitial;
    }
    if (androidGoogleReward !== originalAdsData.androidGoogleReward) {
      adsDataApi.androidGoogleReward = androidGoogleReward;
    }
    if (iosGoogleReward !== originalAdsData.iosGoogleReward) {
      adsDataApi.iosGoogleReward = iosGoogleReward;
    }
    if (androidVideoAdUrl !== originalAdsData.androidVideoAdUrl) {
      adsDataApi.androidGoogleVideoAdUrl = androidVideoAdUrl;
    }
    if (iosVideoAdUrl !== originalAdsData.iosVideoAdUrl) {
      adsDataApi.iosGoogleVideoAdUrl = iosVideoAdUrl;
    }

    const nextImaTagsUrl = `${String(imaTagUrl1 || "").trim()},${String(
      imaTagUrl2 || ""
    ).trim()},${String(imaTagUrl3 || "").trim()}`;
    if (nextImaTagsUrl !== String(originalAdsData.imaTagsUrl || "")) {
      adsDataApi.imaTagsUrl = nextImaTagsUrl;
    }

    // If no changes, don't call API
    if (Object.keys(adsDataApi).length === 0) {
      return "noChanges";
    }

    dispatch(adsApiData(adsDataApi, adsData?._id));
    return "updated";
  };

  useEffect(() => {
    if (props.submitTrigger > 0) {
      const onSubmit = async () => {
        const monetizeResult = await handleSubmit();
        const adsResult = await handleSubmitAds();
        if (monetizeResult === "noChanges" && adsResult === "noChanges") {
          setToast("info", "No changes made");
        }
      };
      onSubmit();
    }
  }, [props.submitTrigger]);

  const handleChangeSwitch = async (method) => {
    if (!(await guardPermission())) return;
    try {
      if (method === "monetization") {
        const next = !isMonetization;
        setIsMonetization(next);
        await props.switchApi(data?._id, method, next); // send NEW value
      }
    } catch (e) {
      console.error("Error updating switch:", e);
    }
  };

  const handleChangeAds = async () => {
    if (!(await guardPermission())) return;
    const next = !googleAds;
    setGoogleAds(next);
    dispatch(isAdsChange(next, adsData?._id)); // pass desired next state
  };

  const currencySymbol = useMemo(
    () => (defaultCurrency?.symbol ? defaultCurrency.symbol : ""),
    [defaultCurrency?.symbol]
  );

  return (
    <div className="payment-setting p-0 mainSetting">
      {/* ===== Monetize Setting ===== */}
      <div className="settingBox row g-3">
        <div className="col-12 col-md-6">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">Monetization</h4>
            </div>

            <div className="setting-box-body">
              <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center ">
                  <p className="m-0 fw-medium">
                    <span>Monetization Switch (enable/disable monetization in app)</span>
                  </p>
                  {isLoading ? (
                    <Skeleton variant="rectangular" width="60px" height={28} style={{ borderRadius: '52px' }} />
                  ) : (
                    <FormControlLabel
                      control={
                        <MaterialUISwitch
                          sx={{ m: 1 }}
                          checked={Boolean(isMonetization)}
                          onChange={() => handleChangeSwitch("monetization")}
                        />
                      }
                    />
                  )}
                </div>

                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"Min Watch Time of hours of Viewership in channel Required for Monetization"}
                    name={"minWatchTime"}
                    type={"number"}
                    loading={isLoading}
                    value={minWatchTime}
                    errorMessage={error.minWatchTime}
                    placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = Number(value);

                      setMinWatchTime(value);

                      setError((prev) => {
                        let message = "";
                        if (value === "") {
                          message = "Min Watch Time is required !";
                        } else if (
                          !Number.isFinite(numericValue) ||
                          numericValue <= 0
                        ) {
                          message = "Min Watch Time must be > 0.";
                        }
                        return { ...prev, minWatchTime: message };
                      });
                    }}
                  />
                </div>

                <div className="col-12 withdrawal-input border-setting">
                  <Input
                    label={"Minimum Subscriber Count for Monetization Eligibility"}
                    name={"minSubScriber"}
                    type={"number"}
                    loading={isLoading}
                    value={minSubScriber}
                    errorMessage={error.minSubScriber}
                    placeholder={"Enter Detail..."}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = Number(value);

                      setMinSubScriber(value);

                      setError((prev) => {
                        let message = "";
                        if (value === "") {
                          message = "Min Subscriber is required !";
                        } else if (
                          !Number.isFinite(numericValue) ||
                          numericValue < 0
                        ) {
                          message = "Min Subscriber must be ≥ 0.";
                        }
                        return { ...prev, minSubScriber: message };
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="col-12 col-md-6">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">Set Earnings Rate Per Hour Of Viewership For Creator</h4>
            </div>

            <div className="setting-box-body">
              <div className="row withdrawal-input">
                <div className="row">
                  <div className="col-5">
                    <Input label={"Hour"} name={"Hour"} type={"number"} loading={isLoading} value={1} disabled />
                  </div>
                  <div className="col-1" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p className="mb-0 mt-4" style={{ fontSize: 22 }}>=</p>
                  </div>
                  <div className="col-6">
                    <Input
                      label={`Earning (${currencySymbol})`}
                      name={"earningPerHour"}
                      type={"number"}
                      loading={isLoading}
                      value={earningPerHour}
                      errorMessage={error.earningPerHour}
                      placeholder={"Enter Detail..."}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = Number(value);

                        setEarningPerHour(value);

                        setError((prev) => {
                          let message = "";
                          if (value === "") {
                            message = "Earning per hour is required !";
                          } else if (
                            !Number.isFinite(numericValue) ||
                            numericValue < 0
                          ) {
                            message = "Earning per hour must be ≥ 0.";
                          }
                          return { ...prev, earningPerHour: message };
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ad frequency */}
        <div className="col-12">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">Show Ads After Every {Math.max(1, Number(adDisplayIndex) || 1)} Video Views</h4>
            </div>

            <div className="setting-box-body">
              <div className="row withdrawal-input">
                <div className="row">
                  <div className="col-12">
                    <Input
                      label={"Ad Display Frequency (Number of Videos)"}
                      name={"adDisplayIndex"}
                      type={"number"}
                      loading={isLoading}
                      value={adDisplayIndex}
                      errorMessage={error.adDisplayIndex}
                      placeholder={"Enter Detail..."}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = Number(value);

                        setAdDisplayIndex(value);

                        setError((prev) => {
                          let message = "";
                          if (value === "") {
                            message = "Ad Display Frequency is required !";
                          } else if (
                            !Number.isFinite(numericValue) ||
                            numericValue <= 0
                          ) {
                            message = "Ad Display Frequency must be > 0.";
                          }
                          return { ...prev, adDisplayIndex: message };
                        });
                      }}
                    />
                  </div>
                  <div className="col-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Ads Setting ===== */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 mt-4 px-1">
        <h4 className="settingboxheader mb-0">Ads Setting</h4>
      </div>

      <div className="settingBox row g-3">
        <div className="col-12 ">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">Google Ad</h4>
            </div>

            <div className="setting-box-body">
              <div className="row">
                <div className="col-12 d-flex justify-content-between align-items-center ">
                  <p className="fw-medium m-0">
                    <span>Google Ad (enable/disable google ads in app)</span>
                  </p>
                  {isLoading ? (
                    <Skeleton variant="rectangular" width="60px" height={28} style={{ borderRadius: '52px' }} />
                  ) : (
                    <FormControlLabel
                      control={
                        <MaterialUISwitch
                          sx={{ m: 1 }}
                          checked={Boolean(googleAds)}
                          onChange={handleChangeAds}
                        />
                      }
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* IMA Ads Tags */}
        <div className="col-12">
          <div className="settingBoxOuter ima-tags-box">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">IMA Ads Tags</h4>
              <InfoTooltip title="IMA Ads Tags (Web)" content={imaAdsTagsContent} />
            </div>

            <div className="setting-box-body">
              <div className="col-12 withdrawal-input border-setting pt-2 mt-0">
                <Input
                  labelShow={false}
                  label={"IMA Tag URL 1"}
                  name={"imaTagUrl1"}
                  type={"text"}
                  loading={isLoading}
                  value={imaTagUrl1}
                  fieldClass={"ima-tag-input"}
                  placeholder={
                    "Enter IMA Tag URL 1..."
                  }
                  onChange={(e) => setImaTagUrl1(e.target.value)}
                />
              </div>
              <div className="col-12 withdrawal-input border-setting pt-2 mt-2">
                <Input
                  labelShow={false}
                  label={"IMA Tag URL 2"}
                  name={"imaTagUrl2"}
                  type={"text"}
                  loading={isLoading}
                  value={imaTagUrl2}
                  fieldClass={"ima-tag-input"}
                  placeholder={
                    "Enter IMA Tag URL 2..."
                  }
                  onChange={(e) => setImaTagUrl2(e.target.value)}
                />
              </div>
              <div className="col-12 withdrawal-input border-setting pt-2 mt-2">
                <Input
                  labelShow={false}
                  label={"IMA Tag URL 3"}
                  name={"imaTagUrl3"}
                  type={"text"}
                  loading={isLoading}
                  value={imaTagUrl3}
                  fieldClass={"ima-tag-input"}
                  placeholder={
                    "Enter IMA Tag URL 3..."
                  }
                  onChange={(e) => setImaTagUrl3(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Android / iOS fields */}
        <div className="col-12 col-md-6">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">Android</h4>
              <InfoTooltip title="Android Ads Setting" content={androidAdsContent} />
            </div>

            <div className="setting-box-body">
              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"Android Google Interstitial"}
                  name={"androidGoogleInterstitial"}
                  type={"text"}
                  loading={isLoading}
                  value={androidGoogleInterstitial}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setAndroidGoogleInterstitial(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"Android Google Native Image Ad"}
                  name={"androidGoogleNative"}
                  type={"text"}
                  loading={isLoading}
                  value={androidGoogleNative}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setAndroidGoogleNative(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"Android Google Native Video Ad"}
                  name={"androidGoogleNativeVideo"}
                  type={"text"}
                  loading={isLoading}
                  value={androidGoogleNativeVideo}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setAndroidGoogleNativeVideo(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"Android Google Reward"}
                  name={"androidGoogleReward"}
                  type={"text"}
                  loading={isLoading}
                  value={androidGoogleReward}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setAndroidGoogleReward(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"Android Interactive Video Ad URL"}
                  name={"androidVideoAdUrl"}
                  type={"text"}
                  loading={isLoading}
                  value={androidVideoAdUrl}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setAndroidVideoAdUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* iOS */}
        <div className="col-12 col-md-6">
          <div className="settingBoxOuter">
            <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
              <h4 className="settingboxheader">iOS</h4>
              <InfoTooltip title="iOS Ads Setting" content={iosAdsContent} />
            </div>

            <div className="setting-box-body">
              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"iOS Google Interstitial"}
                  name={"iosGoogleInterstitial"}
                  type={"text"}
                  loading={isLoading}
                  value={iosGoogleInterstitial}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setIosGoogleInterstitial(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"iOS Google Native Image Ad"}
                  name={"iosGoogleNative"}
                  type={"text"}
                  loading={isLoading}
                  value={iosGoogleNative}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setIosGoogleNative(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"iOS Google Native Video Ad"}
                  name={"iosGoogleNativeVideo"}
                  type={"text"}
                  loading={isLoading}
                  value={iosGoogleNativeVideo}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setIosGoogleNativeVideo(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"iOS Google Reward"}
                  name={"iosGoogleReward"}
                  type={"text"}
                  loading={isLoading}
                  value={iosGoogleReward}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setIosGoogleReward(e.target.value)}
                />
              </div>

              <div className="col-12 withdrawal-input border-setting">
                <Input
                  label={"iOS Interactive Video Ad URL"}
                  name={"iosVideoAdUrl"}
                  type={"text"}
                  loading={isLoading}
                  value={iosVideoAdUrl}
                  placeholder={"Enter Detail..."}
                  onChange={(e) => setIosVideoAdUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(null, {
  getSettingApi,
  editSetting,
  switchApi,
  getAdsApi,
  getWithdrawalApi,
})(MonetizationSetting);

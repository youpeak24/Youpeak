import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { editSetting, getSettingApi, StorageSetting } from '../../store/setting/setting.action';
import Button from '../../extra/Button';
import Input from '../../extra/Input';
import { FormControlLabel, styled, Switch } from '@mui/material';
import { useTheme } from '@emotion/react';
import { setToast } from '../../../util/toast';
import InfoTooltip from '../../extra/InfoTooltip';
import { Skeleton } from "@mui/material";
import { awsContent, digitalOceanContent, storageOptionContent } from '../../extra/infoContent';



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

const StorageSettingPage = (props) => {
  const { settingData } = useSelector((state) => state.setting);
  const { isLoading } = useSelector((state) => state.dialogue);
  const dispatch = useDispatch();
  const [data, setData] = useState();
  const theme = useTheme();

  const [localStorage, setLocalStorage] = useState(false);
  const [awsS3Storage, setAwsS3Storage] = useState(false);
  const [digitalOceanStorage, setDigitalOceanStorage] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState("");

  const [doEndpoint, setdoEndpoint] = useState("");
  const [doAccessKey, setdoAccessKey] = useState("");
  const [doSecretKey, setdoSecretKey] = useState("");
  const [doHostname, setdoHostname] = useState("");
  const [doBucketName, setdoBucketName] = useState("");
  const [doRegion, setdoRegion] = useState("");

  const [awsEndpoint, setawsEndpoint] = useState("");
  const [awsAccessKey, setawsAccessKey] = useState("");
  const [awsSecretKey, setawsSecretKey] = useState("");
  const [awsHostname, setawsHostname] = useState("");
  const [awsBucketName, setawsBucketName] = useState("");
  const [awsRegion, setawsRegion] = useState("");
  const [originalData, setOriginalData] = useState({});

  //   useClearSessionStorageOnPopState("multiButton");





  useEffect(() => {
    const payload = {};
    dispatch(getSettingApi(payload));
  }, []);

  useEffect(() => {
    setData(settingData);
  }, [settingData]);

  useEffect(() => {
    setdoEndpoint(settingData?.doEndpoint);
    setdoAccessKey(settingData?.doAccessKey);
    setdoSecretKey(settingData?.doSecretKey);
    setdoHostname(settingData?.doHostname);
    setdoBucketName(settingData?.doBucketName);
    setdoRegion(settingData?.doRegion);

    setawsEndpoint(settingData?.awsEndpoint);
    setawsAccessKey(settingData?.awsAccessKey);
    setawsSecretKey(settingData?.awsSecretKey);
    setawsHostname(settingData?.awsHostname);
    setawsBucketName(settingData?.awsBucketName);
    setawsRegion(settingData?.awsRegion);

    if (settingData?.storage) {
      setAwsS3Storage(settingData?.storage?.awsS3);
      setDigitalOceanStorage(settingData?.storage?.digitalOcean);
      setLocalStorage(settingData?.storage?.local);
    }

    // Set original data for comparison
    setOriginalData({
      doEndpoint: settingData?.doEndpoint,
      doAccessKey: settingData?.doAccessKey,
      doSecretKey: settingData?.doSecretKey,
      doHostname: settingData?.doHostname,
      doBucketName: settingData?.doBucketName,
      doRegion: settingData?.doRegion,
      awsEndpoint: settingData?.awsEndpoint,
      awsAccessKey: settingData?.awsAccessKey,
      awsSecretKey: settingData?.awsSecretKey,
      awsHostname: settingData?.awsHostname,
      awsBucketName: settingData?.awsBucketName,
      awsRegion: settingData?.awsRegion,
    });
  }, [settingData]);

  const handleSubmit = () => {


    // Only send changed fields
    const updatedData = {};
    if (doEndpoint !== originalData.doEndpoint) updatedData.doEndpoint = doEndpoint;
    if (doAccessKey !== originalData.doAccessKey) updatedData.doAccessKey = doAccessKey;
    if (doSecretKey !== originalData.doSecretKey) updatedData.doSecretKey = doSecretKey;
    if (doHostname !== originalData.doHostname) updatedData.doHostname = doHostname;
    if (doBucketName !== originalData.doBucketName) updatedData.doBucketName = doBucketName;
    if (doRegion !== originalData.doRegion) updatedData.doRegion = doRegion;
    if (awsEndpoint !== originalData.awsEndpoint) updatedData.awsEndpoint = awsEndpoint;
    if (awsAccessKey !== originalData.awsAccessKey) updatedData.awsAccessKey = awsAccessKey;
    if (awsSecretKey !== originalData.awsSecretKey) updatedData.awsSecretKey = awsSecretKey;
    if (awsHostname !== originalData.awsHostname) updatedData.awsHostname = awsHostname;
    if (awsBucketName !== originalData.awsBucketName) updatedData.awsBucketName = awsBucketName;
    if (awsRegion !== originalData.awsRegion) updatedData.awsRegion = awsRegion;

    // If there are changes, send payload with only updated fields
    if (Object.keys(updatedData).length > 0) {
      dispatch(editSetting(settingData?._id, updatedData));
    } else {
      setToast("info", "No changes made");
    }
  };

  useEffect(() => {
    if (props.submitTrigger > 0) {
      handleSubmit();
    }
  }, [props.submitTrigger]);

  const handleChangeStorage = (type) => {
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

  const handleChange = (type) => {

    const payload = {
      settingId: settingData?._id,
      type: type,
    };
    dispatch(settingSwitch(payload));
  };
  const [selectedOption, setSelectedOption] = useState(
    settingData?.isWatermarkOn ? "active" : "inactive"
  );
  return (
    <>
      <div className="payment-setting p-0 mainSetting">
        <div className="settingBox row g-3">
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Digital Ocean Setting</h4>
                <InfoTooltip title="Digital Ocean Setting" content={digitalOceanContent} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="row">
                    <div className="col-12 col-lg-6 withdrawal-input border-setting">
                      <Input
                        label={"Endpoint"}
                        name={"doEndpoint"}
                        type={"text"}
                        loading={isLoading}
                        value={doEndpoint || ""}
                        placeholder={"Endpoint"}
                        onChange={(e) => {
                          setdoEndpoint(e.target.value);
                        }}
                      />

                      <p className="text-danger mb-3" style={{ wordWrap: "break-word" }}>e.g. https://bucketname.region.digitaloceanspaces.com</p>
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Host Name"}
                        name={"doHostname"}
                        value={doHostname || ""}
                        loading={isLoading}
                        type={"text"}
                        placeholder={"Endpoint"}
                        onChange={(e) => {
                          setdoHostname(e.target.value);
                        }}
                      />
                      <p className="text-danger mb-3" style={{ wordWrap: "break-word" }}>e.g https://region.digitaloceanspaces.com</p>
                    </div>


                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Secret Key"}
                        name={"doSecretKey"}
                        type={"text"}
                        loading={isLoading}
                        value={doSecretKey || ""}
                        placeholder={"Secret Key"}
                        onChange={(e) => {
                          setdoSecretKey(e.target.value);
                        }}
                      />
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Access Key"}
                        name={"doAccessKey"}
                        value={doAccessKey || ""}
                        loading={isLoading}
                        type={"text"}
                        placeholder={"Access Key"}
                        onChange={(e) => {
                          setdoAccessKey(e.target.value);
                        }}
                      />
                    </div>

                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Bucket Name"}
                        name={"doBucketName"}
                        type={"text"}
                        loading={isLoading}
                        value={doBucketName || ""}
                        placeholder={"Bucket Name"}
                        onChange={(e) => {
                          setdoBucketName(e.target.value);
                        }}
                      />
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Region"}
                        name={"doRegion"}
                        loading={isLoading}
                        value={doRegion || ""}
                        type={"text"}
                        placeholder={"Region"}
                        onChange={(e) => {
                          setdoRegion(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">AWS Setting</h4>
                <InfoTooltip title="AWS Setting" content={awsContent} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="row">
                    <div className="col-12 col-lg-6 withdrawal-input border-setting">
                      <Input
                        label={"Endpoint"}
                        name={"awsEndpoint"}
                        type={"text"}
                        loading={isLoading}
                        value={awsEndpoint || ""}
                        placeholder={"Endpoint"}
                        onChange={(e) => {
                          setawsEndpoint(e.target.value);
                        }}
                      />
                      <p className="text-danger mb-3" style={{ wordWrap: "break-word" }}>e.g https://bucketname.s3.region.amazonaws.com</p>
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Host Name"}
                        name={"awsHostname"}
                        value={awsHostname || ""}
                        loading={isLoading}
                        type={"text"}
                        placeholder={"Host Name"}
                        onChange={(e) => {
                          setawsHostname(e.target.value);
                        }}
                      />
                      <p className="text-danger mb-3" style={{ wordWrap: "break-word" }}>e.g https://s3.region.amazonaws.com</p>
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Access Key"}
                        name={"awsAccessKey"}
                        value={awsAccessKey || ""}
                        loading={isLoading}
                        type={"text"}
                        placeholder={"Access Key"}
                        onChange={(e) => {
                          setawsAccessKey(e.target.value);
                        }}
                      />
                    </div>


                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Secret Key"}
                        name={"awsSecretKey"}
                        type={"text"}
                        loading={isLoading}
                        value={awsSecretKey || ""}
                        placeholder={"Secret Key"}
                        onChange={(e) => {
                          setawsSecretKey(e.target.value);
                        }}
                      />
                    </div>



                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Bucket Name"}
                        name={"awsBucketName"}
                        type={"text"}
                        loading={isLoading}
                        value={awsBucketName || ""}
                        placeholder={"Bucket Name"}
                        onChange={(e) => {
                          setawsBucketName(e.target.value);
                        }}
                      />
                    </div>
                    <div className="col-12 col-lg-6 withdrawal-input">
                      <Input
                        label={"Region"}
                        name={"awsRegion"}
                        value={awsRegion || ""}
                        loading={isLoading}
                        type={"text"}
                        placeholder={"Region"}
                        onChange={(e) => {
                          setawsRegion(e.target.value);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="settingBoxOuter">
              <div className="settingBoxHeader d-flex justify-content-between align-items-center px-2">
                <h4 className="settingboxheader">Storage Option</h4>
                <InfoTooltip title="Storage Setting" content={storageOptionContent} />
              </div>

              <div className="setting-box-body">
                <div className="row">
                  <div className="col-12 withdrawal-input border-setting">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="">local</span>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="60px" height={28} style={{ borderRadius: '52px' }} />
                      ) : (
                        <FormControlLabel
                          control={
                            <MaterialUISwitch
                              sx={{ m: 1 }}
                              checked={localStorage === true ? true : false}
                              theme={theme}
                            />
                          }
                          label=""
                          onClick={() => handleChangeStorage("local")}
                        />
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span>AWS S3</span>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="60px" height={28} style={{ borderRadius: '52px' }} />
                      ) : (
                        <FormControlLabel
                          control={
                            <MaterialUISwitch
                              sx={{ m: 1 }}
                              checked={awsS3Storage === true ? true : false}
                              theme={theme}
                            />
                          }
                          label=""
                          onClick={() => handleChangeStorage("awsS3")}
                        />
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Digital Ocean Space</span>
                      {isLoading ? (
                        <Skeleton variant="rectangular" width="60px" height={28} style={{ borderRadius: '52px' }} />
                      ) : (
                        <FormControlLabel
                          control={
                            <MaterialUISwitch
                              sx={{ m: 1 }}
                              checked={
                                digitalOceanStorage === true ? true : false
                              }
                              theme={theme}
                            />
                          }
                          label=""
                          onClick={() => handleChangeStorage("digitalOcean")}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-12 mt-3 d-flex justify-content-end ">
                    <Button
                      btnName={"Save"}
                      type={"button"}
                      onClick={handleSave}
                      newClass={"submit-btn"}
                      style={{
                        borderRadius: "0.5rem",
                        width: "88px",
                        marginLeft: "10px",
                        // background : "#db2342"
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default StorageSettingPage

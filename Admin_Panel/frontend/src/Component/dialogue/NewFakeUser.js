import React, { useEffect, useState } from "react";
import Button from "../extra/Button";
import Input from "../extra/Input";
import Selector from "../extra/Selector";

import { createFakeUser, getIpAddress } from "../store/user/user.action";
import { connect, useDispatch, useSelector } from "react-redux";
import { uploadFile } from "../../util/AwsFunction";
import { CLOSE_DIALOGUE } from "../store/dialogue/dialogue.type";

import countriesData from "../../util/countries.json";
import ReactSelect from "react-select";
import { Tooltip } from "@mui/material";
import { IconArrowNarrowLeft } from "@tabler/icons-react";

function NewFakeUser(props) {
  const AgeNumber = Array.from(
    { length: 100 - 18 + 1 },
    (_, index) => index + 18
  );
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const { ipAddressData } = useSelector((state) => state.user);
  const { userProfile, countryData } = useSelector((state) => state.user);
  const [countryOptions, setCountryOptions] = useState([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState(null); // Selected country
  const [loadingCountries, setLoadingCountries] = useState(false);
  const dispatch = useDispatch();
  const [gender, setGender] = useState();
  const [activeRadio, setActiveRadio] = useState("");
  const [fullName, setFullName] = useState();
  const [nickName, setNickName] = useState();
  const [mobileNumber, setMobileNumber] = useState();
  const [password, setPassword] = useState();
  const [instagramLink, setInstagramLink] = useState();
  const [facebookLink, setFacebookLink] = useState();
  const [twitterLink, setTwitterLink] = useState();
  const [websiteLink, setWebsiteLink] = useState();
  const [ipAddress, setIpAddress] = useState();
  const [email, setEmail] = useState();
  const [data, setData] = useState();
  const [country, setCountry] = useState();
  const [countryDataSelect, setCountryDataSelect] = useState();
  const [image, setImage] = useState();
  const [age, setAge] = useState();
  const [imgApi, setImgApi] = useState();
  const [error, setError] = useState({
    fullName: "",
    nickName,
    mobileNumber: "",
    email: "",
    ipAddress: "",
    gender: "",
    country: "",
    age: "",
    newsLetter: "",
    image: "",
    password: "",
    websiteLink: "",
    facebookLink: "",
    instagramLink: "",
    twitterLink: "",
  });

  // useEffect(() => {
  //   const countryDataName = countryData?.map((item) => item?.name?.common);
  //   setCountry(countryDataName);
  // }, [countryData]);

  useEffect(() => {
    setData(data);
  }, [userProfile]);

  useEffect(() => {
    const processCountries = () => {
      setLoadingCountries(true);

      try {
        // Transform countries to React Select format
        const transformedCountries = countriesData
          .filter(
            (country) =>
              country.name?.common && country.cca2 && country.flags?.png
          )
          .map((country) => ({
            value: country.cca2, // Required by React Select
            label: country.name.common, // Required by React Select
            name: country.name.common,
            code: country.cca2,
            flagUrl: country.flags.png || country.flags.svg,
            flag: country.flags.png || country.flags.svg, // For compatibility
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setCountryOptions(transformedCountries);

        // Set default or existing country
        if (userProfile?.country) {
          const existingCountry = transformedCountries.find(
            (c) => c.name.toLowerCase() === userProfile.country.toLowerCase()
          );
          setSelectedCountry(existingCountry || null);
        } else {
          // Set India as default
          const defaultCountry = transformedCountries.find(
            (c) => c.name === "India"
          );
          setSelectedCountry(defaultCountry || transformedCountries[0] || null);
        }
      } catch (error) {
        console.error("Failed to process countries:", error);
      } finally {
        setLoadingCountries(false);
      }
    };

    processCountries();
  }, [userProfile]);

  useEffect(() => {
    setAge("");
    setGender("");
    setCountryDataSelect([]);
    setCountry([]);
  }, [dialogue]);

  useEffect(() => {
    dispatch(getIpAddress());
  }, [dispatch]);

  const handleImage = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage([file]); // Yeh ek array me file bhejta hai
      setImgApi(URL.createObjectURL(file));
    }
  };

  let folderStructure = "userImage";
  // const handleFileUpload = async (imageData) => {
  //   
  //   const { resDataUrl, imageURL } = await uploadFile(
  //     imageData[0],
  //     folderStructure
  //   );

  //   setImgApi(resDataUrl);

  //   if (imageURL) {
  //     setImage(imageURL);
  //     return resDataUrl

  //   }

  //   if (!imageData[0]) {
  //     return setError({
  //       ...error,
  //       image: `Image Is Required`,
  //     });
  //   } else {
  //     return setError({
  //       ...error,
  //       image: "",
  //     });
  //   }

  // };

  const handleFileUpload = async (imageData) => {


    if (!imageData || !imageData[0]) {
      setError((prev) => ({ ...prev, image: "Image is required" }));
      return null;
    }

    try {
      const { resDataUrl } = await uploadFile(
        imageData[0],
        folderStructure,
        dispatch, // ✅ dispatch bhejna zaroori hai progress ke liye
        "image" // ✅ loaderType pass karo (customizable string)
      );

      if (resDataUrl) {
        setImgApi(resDataUrl); // ✅ Preview ke liye
        setImage(resDataUrl); // ✅ Final image URL store
        setError((prev) => ({ ...prev, image: "" }));
        return resDataUrl;
      } else {
        setError((prev) => ({ ...prev, image: "Failed to upload image" }));
        return null;
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      setError((prev) => ({ ...prev, image: "Image upload error" }));
      return null;
    }
  };

  const isValidURL = (url) => {
    const urlRegex = /^(ftp|http|https):\/[^ "]+$/;
    return urlRegex.test(url);
  };

  const isValidIPv4 = (value) => {
    const urlRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return urlRegex.test(value);
  };

  const isEmail = (value) => {
    const val = value === "" ? 0 : value;
    const validNumber = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val);
    return validNumber;
  };

  const handleSubmit = async () => {

    const emailValid = isEmail(email);
    let websiteLinkValid = true;
    if (websiteLink) {
      websiteLinkValid = isValidURL(websiteLink);
    }
    let facebookLinkValid = true;
    if (facebookLink) {
      facebookLinkValid = isValidURL(facebookLink);
    }
    let twitterLinkValid = true;
    if (twitterLink) {
      twitterLinkValid = isValidURL(twitterLink);
    }
    let instagramLinkValid = true;
    if (instagramLink) {
      instagramLinkValid = isValidURL(instagramLink);
    }
    let ipAddressValid = true;
    if (ipAddress) {
      ipAddressValid = isValidIPv4(ipAddress);
    }
    if (
      !fullName ||
      !nickName ||
      !mobileNumber ||
      !email ||
      !age ||
      !emailValid ||
      !password ||
      !gender ||
      !countryDataSelect ||
      !image ||
      !ipAddress ||
      // !websiteLinkValid ||
      // !instagramLinkValid ||
      // !facebookLinkValid ||
      // !twitterLinkValid ||
      !ipAddressValid ||
      !websiteLink ||
      !instagramLink ||
      !facebookLink ||
      !twitterLink
    ) {
      let error = {};
      if (!fullName) error.fullName = "Full Name Is Required !";
      if (!nickName) error.nickName = "Nick Name Is Required !";
      if (!mobileNumber) error.mobileNumber = "Mobile Number Is Required !";
      if (!password) error.password = "Password Is Required !";
      if (!activeRadio) error.newsLetter = "Newsletter Is Required !";
      if (!email) {
        error.email = "Email Is Required !";
      }
      if (!gender) error.gender = "Gender Is Required !";
      if (!image) error.image = "Image Is Required !";
      if (!age) error.age = "Age is required !";
      if (!ipAddress);
      if (!countryDataSelect) error.country = "Country is required !";
      if (!age) error.age = "Age is required !";
      if (!emailValid) {
        error.email = "Email Invalid !";
      }

      if (!ipAddress) {
        error.ipAddress = "Ip Address is required !";
      } else if (!ipAddressValid) {
        error.ipAddress = "Ip Address Invalid!";
      }

      if (!websiteLink) {
        error.websiteLink = "WebsiteLink is required !";
      }
      // else if (!websiteLinkValid) {
      //   error.websiteLink = "WebsiteLink Invalid !";
      // }
      if (!instagramLink) {
        error.instagramLink = "InstagramLink is required !";
      }
      // else if (!instagramLinkValid) {
      //   error.instagramLink = "InstagramLink Invalid !";
      // }
      if (!facebookLink) {
        error.facebookLink = "FacebookLink is required !";
      }
      // else if (!facebookLinkValid) {
      //   error.facebookLink = "FacebookLink Invalid !";
      // }
      if (!twitterLink) {
        error.twitterLink = "TwitterLink is required !";
      }
      // else if (!twitterLinkValid) {
      //   error.twitterLink = "TwitterLink Invalid !";
      // }

      return setError({ ...error });
    } else {
      const uploadedImageUrl = await handleFileUpload(image);

      if (!uploadedImageUrl) {
        return; // Stop submission if image failed
      }

      let createFakeUserAdd = {
        fullName: fullName.charAt(0).toUpperCase() + fullName.slice(1),
        nickName: nickName.charAt(0).toUpperCase() + nickName.slice(1),
        gender: gender,
        mobileNumber: mobileNumber,
        instagramLink: instagramLink,
        facebookLink: facebookLink,
        twitterLink: twitterLink,
        websiteLink: websiteLink,
        age: parseInt(age),
        image: uploadedImageUrl,
        ipAddress: ipAddress,
        country: selectedCountry?.name,
        email: email,
        password: password,
      };
      const id = dialogueData?._id;
      props.createFakeUser(createFakeUserAdd, id);
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
    }
  };

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
        country: "",
      });
    }
  };

  const CustomOption = ({ innerRef, innerProps, data }) => (
    <div
      ref={innerRef}
      {...innerProps}
      className="optionShow-option p-2 d-flex align-items-center"
    >
      <img
        height={24}
        width={32}
        alt={data.name}
        src={data.flagUrl}
        className="me-2"
        style={{ objectFit: "cover" }}
      />
      <span>{data.label}</span>
    </div>
  );

  return (
    <div>
      <div className="card1 fake-user ">
        <div className="cardHeader p-3 ">
          <div className=" d-flex  align-items-center justify-content-between w-100">
            <h5 className="mb-0">Create Fake User</h5>
            <Tooltip title="Back" placement="top" arrow>
              <div className="submit-btn-multipleSelect" onClick={handleClose}>
                <IconArrowNarrowLeft size={25} className="text-secondary" />
              </div>
            </Tooltip>
          </div>
        </div>
        <div className=" userSettingBox">
          <form>
            <div className="">
              <div className="row cardBody p-3">
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Full Name"}
                    name={"fullName"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.fullName && error.fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          fullName: `Full Name Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          fullName: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Nick Name"}
                    name={"nickName"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.nickName && error.nickName}
                    onChange={(e) => {
                      setNickName(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          nickName: `Nick Name Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          nickName: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"E-mail Address"}
                    name={"email"}
                    errorMessage={error.email && error.email}
                    placeholder={"Enter Details..."}
                    defaultValue={userProfile?.email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          email: `Email Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          email: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 position-relative">
                  <Input
                    label={"Password"}
                    name={"password"}
                    type={"password"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.password && error.password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          password: `Password Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          password: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Mobile Number"}
                    name={"mobileNumber"}
                    type={"number"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.mobileNumber && error.mobileNumber}
                    onChange={(e) => {
                      setMobileNumber(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          mobileNumber: `Mobile Number Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          mobileNumber: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Instagram Link"}
                    name={"instagramLink"}
                    type={"text"}
                    errorMessage={error.instagramLink && error.instagramLink}
                    placeholder={"Enter Details..."}
                    onChange={(e) => {
                      setInstagramLink(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          instagramLink: `InstagramLink Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          instagramLink: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Facebook Link"}
                    name={"facebookLink"}
                    type={"text"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.facebookLink && error.facebookLink}
                    onChange={(e) => {
                      setFacebookLink(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          facebookLink: `FacebookLink Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          facebookLink: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Twitter Link"}
                    name={"twitterLink"}
                    type={"text"}
                    placeholder={"Enter Details..."}
                    errorMessage={error.twitterLink && error.twitterLink}
                    onChange={(e) => {
                      setTwitterLink(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          twitterLink: `TwitterLink Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          twitterLink: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Website Link"}
                    name={"websiteLink"}
                    type={"text"}
                    errorMessage={error.websiteLink && error.websiteLink}
                    placeholder={"Enter Details..."}
                    onChange={(e) => {
                      setWebsiteLink(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          websiteLink: `WebsiteLink Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          websiteLink: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Input
                    label={"Ip Address"}
                    name={"ipAddress"}
                    type={"text"}
                    value={ipAddress}
                    placeholder={"Enter Details..."}
                    errorMessage={error.ipAddress && error.ipAddress}
                    onChange={(e) => {
                      setIpAddress(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          ipAddress: `Ip Address Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          ipAddress: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Selector
                    label={"Gender"}
                    selectValue={gender}
                    placeholder={"Select Gender"}
                    selectData={["Male", "Female"]}
                    errorMessage={error.gender && error.gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          gender: `Gender Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          gender: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2">
                  <Selector
                    label={"Age"}
                    selectValue={age}
                    placeholder={"Select Age"}
                    errorMessage={error.age && error.age}
                    selectData={AgeNumber}
                    onChange={(e) => {
                      setAge(e.target.value);
                      if (!e.target.value) {
                        return setError({
                          ...error,
                          age: `Age Is Required`,
                        });
                      } else {
                        return setError({
                          ...error,
                          age: "",
                        });
                      }
                    }}
                  />
                </div>
                <div className="col-lg-6 col-sm-12 col-md-12  mt-2 country-dropdown custom-input">
                  <label clasName="label-selector-custom">Country</label>
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
                      <div className="d-flex align-items-center">
                        <img
                          height={20}
                          width={28}
                          alt={option.name}
                          src={option.flagUrl}
                          className="me-2"
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.target.style.display = "none";
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
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#f8f9fa",
                        },

                        "&.css-b62m3t-container": {
                          borderRadius: "65px",
                        },
                      }),
                    }}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 ">
                  <Input
                    type={"file"}
                    label={"Image"}
                    accept={"image/png, image/jpeg"}
                    errorMessage={error.image && error.image}
                    onChange={handleImage}
                  />
                </div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6"></div>
                <div className="col-12 col-sm-12 col-md-6 col-lg-6 mt-2 fake-create-img mb-2">
                  {image && (
                    <img src={imgApi} style={{ objectFit: "contain" }} />
                  )}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
export default connect(null, {
  createFakeUser,
  getIpAddress,
})(NewFakeUser);

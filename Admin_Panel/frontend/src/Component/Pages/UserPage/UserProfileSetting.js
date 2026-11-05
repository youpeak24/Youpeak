import React, { useEffect, useState } from "react";
import Button from "../../extra/Button";
import Input from "../../extra/Input";
import Selector from "../../extra/Selector";

import {
  editUserProfile,
  getUserProfile,
} from "../../store/user/user.action";
import { connect, useDispatch, useSelector } from "react-redux";
import { CLOSE_DIALOGUE } from "../../store/dialogue/dialogue.type";
import { useLocation } from "react-router-dom";
import countriesData from '../../../util/countries.json';
import ReactSelect from 'react-select';


function UserProfileSetting(props) {
  const AgeNumber = Array.from(
    { length: 100 - 18 + 1 },
    (_, index) => index + 18
  );
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  const { multiButtonSelectNavigateSet, multiButtonSelectNavigate } = props;
  const [loadingCountries, setLoadingCountries] = useState(false)

  const [countryOptions, setCountryOptions] = useState([]); // All countries
  const [selectedCountry, setSelectedCountry] = useState(null); // Selected country

  const { userProfile, countryData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [gender, setGender] = useState();
  const [activeRadio, setActiveRadio] = useState("");
  const [userName, setUserName] = useState();
  const [data, setData] = useState();
  const [country, setCountry] = useState();
  const [userId, setUserId] = useState();
  const [isChannel, setIsChannel] = useState();
  const [countryDataSelect, setCountryDataSelect] = useState();
  const [age, setAge] = useState();
  const [nickName, setNickName] = useState();
  const [websiteLink, setWebsiteLink] = useState();
  const [facebookLink, setFaceBookLink] = useState();
  const [instagramLink, setInstagramLink] = useState();
  const [twitterLink, setTwitterLink] = useState();
  const [mobileNumber, setMobileNumber] = useState();
  const [descriptionChannel, setDescriptionChannel] = useState();
  const location = useLocation();
  const [error, setError] = useState({
    userName: "",
    nickName: "",
    websiteLink: "",
    facebookLink: "",
    instagramLink: "",
    twitterLink: "",
    mobileNumber: "",
    descriptionChannel: "",
    gender: "",
    country: "",
    age: "",
  });

  useEffect(
    () => () => {
      setError({
        userName: "",
        nickName: "",
        websiteLink: "",
        facebookLink: "",
        instagramLink: "",
        twitterLink: "",
        mobileNumber: "",
        descriptionChannel: "",
        gender: "",
        country: "",
        age: "",
      });
    },
    [location.state]
  );
  useEffect(() => {
    setData(userProfile);
    multiButtonSelectNavigate === "Profile"
      ? sessionStorage.setItem(
        "multiButton",
        JSON.stringify(multiButtonSelectNavigate)
      )
      : sessionStorage.removeItem("multiButton");
  }, [userProfile, multiButtonSelectNavigate]);

  useEffect(() => {
    if (userProfile) {
      setUserName(userProfile?.fullName);
      setUserId(userProfile?._id);
      setIsChannel(userProfile?.isChannel);
      setDescriptionChannel(userProfile?.descriptionOfChannel);
      setMobileNumber(userProfile?.mobileNumber);
      setNickName(userProfile?.nickName);
      setWebsiteLink(userProfile?.socialMediaLinks?.websiteLink);
      setTwitterLink(userProfile?.socialMediaLinks?.twitterLink);
      setFaceBookLink(userProfile?.socialMediaLinks?.facebookLink);
      setInstagramLink(userProfile?.socialMediaLinks?.instagramLink);
      setGender(userProfile?.gender);
      setAge(userProfile?.age);
      setCountryDataSelect(userProfile?.country?.toLowerCase());
    }
  }, [userProfile]);


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
            flag: country.flags.png || country.flags.svg // For compatibility
          }))
          .sort((a, b) => a.label.localeCompare(b.label))

        setCountryOptions(transformedCountries)

        // Set default or existing country
        if (userProfile?.country) {
          const existingCountry = transformedCountries.find(
            (c) => c.name.toLowerCase() === userProfile.country.toLowerCase()
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

  // useEffect(() => {
  //   const countryDataName = countryData?.map((item) => item?.name?.common);
  //   setCountry(countryDataName);
  // }, [countryData]);
  useEffect(() => {
    setData(data);
  }, [userProfile]);

  const isValidURL = (url) => {
    const urlRegex = /^(ftp|http|https):\/[^ "]+$/;
    return urlRegex.test(url);
  };

  const handleSubmit = () => {

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

    const mobileNumberRegex = /^\d{10}$/;
    let mobileNumberValid = true;
    if (mobileNumber) {
      mobileNumberValid = mobileNumberRegex.test(mobileNumber);
    }

    const ageNumber = parseInt(age);
    if (
      !userName ||
      !nickName ||
      ageNumber <= 0 ||
      !gender ||
      !age ||
      !selectedCountry ||
      !mobileNumber ||
      !mobileNumberValid ||
      (dialogueData?.isChannel === true &&
        multiButtonSelectNavigate === "Fake User" &&
        !descriptionChannel)
      //    ||
      // !websiteLink ||
      // !instagramLink ||
      // !facebookLink ||
      // !twitterLink
    ) {
      let error = {};
      if (!userName) error.userName = "UserName Is Required !";
      if (!activeRadio) error.newsLetter = "Newsletter Is Required !";
      if (!gender) error.gender = "Gender Is Required !";
      if (!age) error.age = "Age is required !";

      if (ageNumber <= 0) error.age = "Age is required !";
      if (!selectedCountry) error.country = "Country is required !";
      // if (!websiteLink) {
      //   error.websiteLink = "WebsiteLink is required !";
      // } else if (!websiteLinkValid) {
      //   error.websiteLink = "WebsiteLink Invalid !";
      // }
      // if (!instagramLink) {
      //   error.instagramLink = "InstagramLink is required !";
      // }
      // if (!facebookLink) {
      //   error.facebookLink = "FacebookLink is required !";
      // }
      // if (!twitterLink) {
      //   error.twitterLink = "TwitterLink is required !";
      // }
      if (!mobileNumber) {
        error.mobileNumber = "Mobile Number is required !";
      } else if (!mobileNumberValid) {
        error.mobileNumber = "Mobile Number is invalid !";
      }
      if (!descriptionChannel)
        error.descriptionChannel = "Description Channel  is required !";

      return setError({ ...error });
    } else {
      let generalSettingData = {
        userId: userId,
        fullName: userName,
        nickName: nickName,
        gender: gender,
        age: ageNumber,
        country: selectedCountry?.name,
        websiteLink: websiteLink,
        instagramLink: instagramLink,
        facebookLink: facebookLink,
        twitterLink: twitterLink,
        mobileNumber: mobileNumber,
        descriptionOfChannel:
          dialogueData?.isChannel === true &&
            multiButtonSelectNavigate === "Fake User"
            ? descriptionChannel
            : "",
      };
      props.editUserProfile(userId, generalSettingData, isChannel);
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
      // multiButtonSelectNavigate == "Fake User"
      //   ? multiButtonSelectNavigateSet("Fake User")
      //   : multiButtonSelectNavigateSet("User");
    }
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
      />
      <span>{data.label}</span>
    </div>
  )

  return (
    <div className="card1 mt-2">
      <div className="cardHeader p-3 ">
        <div className="row d-flex  align-items-center">
          <div className="col-12 col-sm-6 col-md-6 col-lg-6 mb-1 mb-sm-0">
            <h5 className="mb-0">Profile Setting</h5>
          </div>
        </div>
      </div>
      <div className=" userSettingBox">
        <form>
          {/* <div className="row d-flex  align-items-center">
            <div className="col-6">
              <h5>Profile Setting</h5>
            </div>
            <div className="col-6 d-flex justify-content-end align-items-center">
              <Button
                newClass={"submit-btn"}
                btnName={"Submit"}
                type={"button"}
                onClick={handleSubmit}
              />
            </div>
          </div> */}
          <div className="row cardBody d-flex p-3">
            <div className="col-lg-6 col-sm-12 col-md-12  mt-2">
              <Input
                label={`${dialogueData?.isChannel === true &&
                  dialogueData?.isAddByAdmin === true
                  ? "Channel Name"
                  : "User Name"
                  }`}
                name={"userName"}
                value={userName}
                placeholder={"Enter Details..."}
                errorMessage={error.userName && error.userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      userName: `UserName Is Required`,
                    });
                  } else {
                    return setError({
                      ...error,
                      userName: "",
                    });
                  }
                }}
              />
            </div>
            <div className="col-lg-6 col-sm-12 col-md-12  mt-2">
              <Input
                label={"Nick Name"}
                name={"nickName"}
                value={nickName}
                placeholder={"Enter Details..."}
                errorMessage={error.nickName && error.nickName}
                onChange={(e) => {
                  setNickName(e.target.value);
                  if (!e.target.value) {
                    return setError({
                      ...error,
                      nickName: `FirstName Is Required`,
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
            <div className="col-lg-6 col-sm-12 col-md-12  mt-2">
              <Input
                label={"Mobile Number"}
                name={"mobileNumber"}
                type={"number"}
                errorMessage={error.mobileNumber && error.mobileNumber}
                placeholder={"Enter Details..."}
                value={mobileNumber}
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
            <div className="col-lg-6 col-sm-12 col-md-12  mt-2">

              <Selector
                label={"Gender"}
                selectValue={gender}
                defaultValue={userProfile?.gender}
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
            <div className="col-lg-6 col-md-12 col-sm-12  mt-2">
              <Selector
                label={"Age"}
                selectValue={age}
                defaultValue={userProfile?.age}
                value={age}
                placeholder={"Select Age"}
                errorMessage={error.age && error.age}
                className="mt-0"
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

            <div className="col-lg-6 col-md-12 col-sm-12 mt-2">
              <Input
                label={"Website Link"}
                name={"websiteLink"}
                errorMessage={error.websiteLink && error.websiteLink}
                placeholder={"Enter Details..."}
                value={websiteLink}
                defaultValue={userProfile?.websiteLink}
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
            <div className="col-lg-6 col-sm-12 col-md-12  mt-2">
              <Input
                label={"Twitter Link"}
                name={"twitter"}
                value={twitterLink}
                errorMessage={error.twitterLink && error.twitterLink}
                placeholder={"Enter Details..."}
                defaultValue={userProfile?.twitter}
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
            <div className="col-lg-6 col-md-12 col-sm-12 mt-2">
              <Input
                label={"Facebook Link"}
                name={"facebook"}
                value={facebookLink}
                errorMessage={error.facebookLink && error.facebookLink}
                placeholder={"Enter Details..."}
                defaultValue={userProfile?.facebook}
                onChange={(e) => {
                  setFaceBookLink(e.target.value);
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
            <div className="col-lg-6 col-md-12 col-sm-12 mt-2">
              <Input
                label={"Instagram Link"}
                name={"instagram"}
                value={instagramLink}
                errorMessage={error.instagramLink && error.instagramLink}
                placeholder={"Enter Details..."}
                defaultValue={userProfile?.instagram}
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
            {dialogueData?.isChannel === true &&
              dialogueData?.isAddByAdmin === true ? (
              <div className="col-12 custom-input text-about">
                <label className="">Description Of Channel</label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={descriptionChannel}
                  onChange={(e) => {
                    setDescriptionChannel(e.target.value);
                    if (!e.target.value) {
                      return setError({
                        ...error,
                        descriptionChannel: `Description Channel Is Required`,
                      });
                    } else {
                      return setError({
                        ...error,
                        descriptionChannel: "",
                      });
                    }
                  }}
                ></textarea>
                {error.descriptionChannel && (
                  <p className="errorMessage">
                    {error.descriptionChannel && error.descriptionChannel}
                  </p>
                )}
              </div>
            ) : (
              ""
            )}

          </div>

          <div className="cadrFooter p-3">
            <div className="d-flex justify-content-end align-items-center">
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
  );
}
export default connect(null, {
  editUserProfile,
  getUserProfile,
})(UserProfileSetting);

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { editSetting, getSettingApi } from "../../store/setting/setting.action";
import Button from "../../extra/Button";
import Input from "../../extra/Input";


const RefralBonus = () => {
  const { settingData } = useSelector((state) => state.setting);


  const dispatch = useDispatch();

  const [referralRewardCoins, setReferralRewardCoins] = useState();

  const [error, setError] = useState({
    referralRewardCoins: "",
  });

  useEffect(() => {
    setReferralRewardCoins(settingData?.referralRewardCoins);
  }, [settingData]);

  useEffect(() => {
    dispatch(getSettingApi());
  }, []);

  const handleSubmit = () => {

    const referralRewardCoinsValue = parseInt(referralRewardCoins);

    if (referralRewardCoins === "" || referralRewardCoinsValue <= 0) {
      let error = {};

      if (referralRewardCoins === "")
        error.referralRewardCoins = "Amount Is Required !";

      if (referralRewardCoinsValue <= 0)
        error.referralRewardCoins = "Amount Invalid !";

      return setError({ ...error });
    } else {
      let settingDataSubmit = {
        referralRewardCoins: parseInt(referralRewardCoins),
      };
      dispatch(editSetting(settingData?._id, settingDataSubmit));
    }
  };

  return (
    <div className="">
      <div className="">
        <div className="">
          <div className="card1">
            <div className="align-items-center cardHeader d-flex justify-content-between px-4 py-2">
              <div className=" ">
                <h5 className="mb-0">Referral Reward</h5>
              </div>
              <div className="">
                <Button
                  btnName={"Submit"}
                  type={"button"}
                  onClick={handleSubmit}
                  newClass={"submit-btn"}
                  style={{
                    borderRadius: "0.5rem",
                    width: "88px",
                    marginLeft: "10px",
                  }}
                />
              </div>
            </div>
            <div className="">
              <div className="px-4 py-2">
                <div className="row">
                  <div className="col-6 withdrawal-input">
                    <div className="row">
                      <div className="col-11">
                        <Input
                          label={`Number Of Member`}
                          name={"numberOfMember"}
                          type={"number"}
                          value={`1`}
                          placeholder={"Enter Number of Member"}
                          disabled
                        />
                      </div>
                      <p className="col-1 d-flex align-items-center mt-3 fs-5 justify-content-center">
                        =
                      </p>
                    </div>
                  </div>
                  <div className="col-6 withdrawal-input">
                    <Input
                      label={"Coin  (how many coins for Earning)"}
                      name={"Coin"}
                      value={referralRewardCoins}
                      type={"number"}
                      errorMessage={error.referralRewardCoins}
                      placeholder={""}
                      onChange={(e) => {
                        setReferralRewardCoins(e.target.value);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefralBonus;

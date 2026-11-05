import React, { useState } from "react";
import NewTitle from "../../extra/Title";
import AdsCoinRewardSetting from "./AdsCoinRewardSetting";
import DailyRewardSetting from "./DailyRewardSetting";
import RefralBonus from "./RefralBonus";
import EngagementSetting from "./EngagementSetting";
import LoginRewardSetting from "./LoginRewardSetting";

const ManageReward = () => {
  const [multiButtonSelect, setMultiButtonSelect] = useState("Ads Coin Reward");

  return (
    <div className="userPage">
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={false}
            // titleShow={true}
            setMultiButtonSelect={setMultiButtonSelect}
            multiButtonSelect={multiButtonSelect}
            // name={`Reward`}
            labelData={[
              "Ads Coin Reward",
              "Daily CheckIn Reward",
              "Referral Reward",
              "Engagement Reward",
              "Login Reward",
            ]}
          />
        </div>
        {multiButtonSelect == "Ads Coin Reward" && <AdsCoinRewardSetting />}
        {multiButtonSelect == "Daily CheckIn Reward" && <DailyRewardSetting />}
        {multiButtonSelect == "Referral Reward" && <RefralBonus />}
        {multiButtonSelect == "Engagement Reward" && <EngagementSetting />}
        {multiButtonSelect == "Login Reward" && <LoginRewardSetting />}
      </div>
    </div>
  );
};

export default ManageReward;

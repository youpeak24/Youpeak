import React, { useState } from "react";
import NewTitle from "../../extra/Title";
import { useTabSelectWithClearSearch } from "../../../util/useTabSelectWithClearSearch";
import MultiButton from "../../extra/MultiButton";
import ManageUser from "./ManageUser";
import { useSelector } from "react-redux";
import UserSetting from "./UserSetting";
import dayjs from "dayjs";
import FakeUser from "./FakeUser";
import NewFakeUser from "../../dialogue/NewFakeUser";

export default function UserPage() {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );
  
  const [dayAnalytics, setDayAnalytics] = useState("today");
  const { multiButtonSelect, setMultiButtonSelect, handleMultiButtonSelect } =
    useTabSelectWithClearSearch("User");
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  const startDateFormat = (startDate) => {
    return startDate && dayjs(startDate).isValid()
      ? dayjs(startDate).format("YYYY-MM-DD")
      : "All";
  };
  const endDateFormat = (endDate) => {
    return endDate && dayjs(endDate).isValid()
      ? dayjs(endDate).format("YYYY-MM-DD")
      : "All";
  };

  const startDateData = startDateFormat(startDate);
  const endDateData = endDateFormat(endDate);

  return (
    <div className="userPage">
      <div
        style={{
          display: `${
            dialogueType === "manageUser"
              ? "none"
              : dialogueType === "hostSettleMent"
              ? "none"
              : dialogueType === "hostHistory"
              ? "none"
              : dialogueType === "fakeUserAdd"
              ? "none"
              : dialogueType === "hostReport"
              ? "none"
              : "block"
          }`,
        }}
      >
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
                 dayAnalyticsShow={true}
                 setEndDate={setEndDate}
                 setStartDate={setStartDate}
                 startDate={startDate}
                 endDate={endDate}
                //  titleShow={true}
                 setMultiButtonSelect={handleMultiButtonSelect}
                 multiButtonSelect={multiButtonSelect}
                 name={`User`}
                 labelData={["User", "Fake User"]}
          />
        </div>
      
        {multiButtonSelect == "User" && (
          <ManageUser endDate={endDateData} startDate={startDateData} multiButtonSelectNavigate={setMultiButtonSelect}/>
        )}
        {multiButtonSelect == "Fake User" && (
          <FakeUser endDate={endDateData} startDate={startDateData}/>
        )}
      </div>

      {dialogueType == "manageUser" && (
        <UserSetting 
           multiButtonSelectNavigate={multiButtonSelect}
           multiButtonSelectNavigateSet={setMultiButtonSelect}/>
      )}
      {dialogueType == "fakeUserAdd" && <NewFakeUser />}
    </div>
  );
}

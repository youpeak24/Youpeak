import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ShortReport from "./ShortReport";
import VideoReport from "./VideoReport";
import NewTitle from "../../extra/Title";
import { useTabSelectWithClearSearch } from "../../../util/useTabSelectWithClearSearch";

export default function ManageReport() {
  const { multiButtonSelect, setMultiButtonSelect, handleMultiButtonSelect } =
    useTabSelectWithClearSearch("Shorts Report");
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [dayAnalytics, setDayAnalytics] = useState("today");
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
    <div className="userPage channelPage">
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={true}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            // titleShow={true}
            setMultiButtonSelect={handleMultiButtonSelect}
            multiButtonSelect={multiButtonSelect}
            // name={`Report`}
            labelData={["Shorts Report", "Video Report"]}
          />
        </div>
        {multiButtonSelect == "Shorts Report" && (
          <ShortReport endDate={endDateData} startDate={startDateData} />
        )}
        {multiButtonSelect == "Video Report" && (
          <VideoReport
            endDate={endDateData}
            startDate={startDateData}
            setMultiButtonSelect={setMultiButtonSelect}
          />
        )}
      </div>
    </div>
  );
};


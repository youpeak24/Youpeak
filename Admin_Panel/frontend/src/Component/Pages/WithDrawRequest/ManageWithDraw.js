import dayjs from "dayjs";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import NewTitle from "../../extra/Title";
import { useTabSelectWithClearSearch } from "../../../util/useTabSelectWithClearSearch";
import WithDrawRequest from "./WithDrawRequest";
import AcceptedRequest from "./AcceptedRequest";
import DeclinedRequest from "./DeclinedRequest";
import WithDrawDetails from "./WithDrawDetails";
import InfoDialog from "./InfoDialog";
import ReasonViewDialog from "./ReasonViewDialog";

const ManageWithDraw = () => {
  const { dialogue, dialogueType, dialogueData } = useSelector(
    (state) => state.dialogue
  );

  const [dayAnalytics, setDayAnalytics] = useState("today");
  const { multiButtonSelect, setMultiButtonSelect, handleMultiButtonSelect } =
    useTabSelectWithClearSearch("Pending");
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
    <>
      <div className="userPage">
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
              // name={`Withdrawal Request`}
              labelData={["Pending", "Accepted", "Declined"]}
            />
          </div>
         
          {multiButtonSelect == "Pending" && (
            <WithDrawRequest
              endDate={endDateData}
              startDate={startDateData}
              multiButtonSelectNavigate={setMultiButtonSelect}
            />
          )}
          {multiButtonSelect == "Accepted" && (
            <AcceptedRequest endDate={endDateData} startDate={startDateData} />
          )}
          {multiButtonSelect == "Declined" && (
            <DeclinedRequest endDate={endDateData} startDate={startDateData} />
          )}
          {dialogueType === "pay" && <WithDrawDetails />}
          {dialogueType === "info" && <InfoDialog />}
          {dialogueType === "viewReason" && <ReasonViewDialog />}
        </div>
      </div>
    </>
  );
};

export default ManageWithDraw;

import React, { useState } from "react";
import NewTitle from "../../extra/Title";
import { useTabSelectWithClearSearch } from "../../../util/useTabSelectWithClearSearch";
import AdminEarnings from "./AdminEarnings";
import CoinPlanEarnings from "./CoinPlanEarnings";
import AllPlanEarnings from "./AllPlanEarnings";
import dayjs from "dayjs";

const EARNINGS_TAB_LABELS = ["All Plan", "Coin Plan", "Premium Plan"];

const getInitialEarningsTab = () => {
  try {
    const raw = sessionStorage.getItem("multiButton");
    if (!raw) return "All Plan";
    const parsed = JSON.parse(raw);
    if (EARNINGS_TAB_LABELS.includes(parsed)) return parsed;
  } catch {
    /* ignore */
  }
  return "All Plan";
};

const MainEarnings = () => {
  const { multiButtonSelect, setMultiButtonSelect, handleMultiButtonSelect } =
    useTabSelectWithClearSearch(getInitialEarningsTab);
  const [startDate, setStartDate] = useState("All");
  const [endDate, setEndDate] = useState("All");

  const startDateFormat = (startDateValue) => {
    return startDateValue && dayjs(startDateValue).isValid()
      ? dayjs(startDateValue).format("YYYY-MM-DD")
      : "All";
  };

  const endDateFormat = (endDateValue) => {
    return endDateValue && dayjs(endDateValue).isValid()
      ? dayjs(endDateValue).format("YYYY-MM-DD")
      : "All";
  };

  const startDateData = startDateFormat(startDate);
  const endDateData = endDateFormat(endDate);

  return (
    <div className="userPage">
      <div>
        <div className="dashboardHeader primeHeader mb-3 p-0">
          <NewTitle
            dayAnalyticsShow={true}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            startDate={startDate}
            endDate={endDate}
            setMultiButtonSelect={handleMultiButtonSelect}
            multiButtonSelect={multiButtonSelect}
            labelData={[
              "All Plan",
              "Coin Plan",
              "Premium Plan",
            ]}
          />
        </div>

        {multiButtonSelect === "All Plan" && (
          <AllPlanEarnings
            endDate={endDateData}
            startDate={startDateData}
          />
        )}

        {multiButtonSelect === "Premium Plan" && (
          <AdminEarnings
            endDate={endDateData}
            startDate={startDateData}
            multiButtonSelectNavigate={setMultiButtonSelect}
          />
        )}

        {multiButtonSelect === "Coin Plan" && (
          <CoinPlanEarnings
            endDate={endDateData}
            startDate={startDateData}
            multiButtonSelectNavigate={setMultiButtonSelect}
          />
        )}
      </div>
    </div>
  );
};

export default MainEarnings;
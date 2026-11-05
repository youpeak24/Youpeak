import { useState } from "react";
import dayjs from "dayjs";
import DateRangePicker from "react-bootstrap-daterangepicker";
import MultiButton from "./MultiButton";
import { IconCalendar } from "@tabler/icons-react";

const Title = (props) => {
  const {
    newClass,
    name,
    dayAnalyticsShow,
    titleShow,
    setStartDate,
    setEndDate,
    endDate,
    startDate,
    setMultiButtonSelect,
    multiButtonSelect,
    labelData,
    color,
    bgColor,
  } = props;

  const [state, setState] = useState({
    start: dayjs().subtract(29, "days"),
    end: dayjs(),
  });
  const { start, end } = state;

  const handleApply = (event, picker) => {
    const s = dayjs(picker.startDate).format("YYYY-MM-DD");
    const e = dayjs(picker.endDate).format("YYYY-MM-DD");
    setStartDate(s);
    setEndDate(e);
  };

  const handleCancel = (event, picker) => {
    picker?.element.val("");
    setStartDate("");
    setEndDate("");
  };

  const handleCallback = (s, e) => {
    setState({ start: s, end: e });
  };

  const startAllDate = "1970-01-01";
  const endAllDate = dayjs().format("YYYY-MM-DD");

  const displayValue =
    (startDate === startAllDate && endDate === endAllDate) ||
    (startDate === "All" && endDate === "All")
      ? "All time"
      : dayjs(startDate).isValid() && dayjs(endDate).isValid()
      ? `${dayjs(startDate).format("MMM D, YYYY")} – ${dayjs(endDate).format("MMM D, YYYY")}`
      : "Select date range";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
        width: "100%",
      }}
    >
      {/* Left: title + tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* A name with no tabs is the page heading — it used to render only
            with titleShow, which left pages like Referral Management and
            Membership Tiers with no heading at all. Tab pages keep hiding it. */}
        {name && (titleShow || (titleShow === undefined && !labelData?.length)) && (
          <h4
            className="mb-0"
            style={{
              fontSize: labelData?.length ? "0.9rem" : "1.05rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </h4>
        )}
        <div className="multi-user-btn">
          <MultiButton
            multiButtonSelect={multiButtonSelect || ""}
            setMultiButtonSelect={setMultiButtonSelect || ""}
            label={labelData || []}
          />
        </div>
      </div>

      {/* Right: date range picker */}
      {dayAnalyticsShow && (
        <DateRangePicker
          initialSettings={{
            startDate: undefined,
            endDate: undefined,
            ranges: {
              All: [new Date("1970-01-01"), dayjs().toDate()],
              Today: [dayjs().toDate(), dayjs().toDate()],
              Yesterday: [dayjs().subtract(1, "days").toDate(), dayjs().subtract(1, "days").toDate()],
              "Last 7 Days": [dayjs().subtract(6, "days").toDate(), dayjs().toDate()],
              "Last 30 Days": [dayjs().subtract(29, "days").toDate(), dayjs().toDate()],
              "This Month": [dayjs().startOf("month").toDate(), dayjs().endOf("month").toDate()],
              "Last Month": [dayjs().subtract(1, "month").startOf("month").toDate(), dayjs().subtract(1, "month").endOf("month").toDate()],
            },
            maxDate: new Date(),
          }}
          onCallback={handleCallback}
          onApply={handleApply}
          onCancel={handleCancel}
        >
          <button
            type="button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
              fontWeight: 500,
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: 0,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            <IconCalendar size={14} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
            {displayValue}
          </button>
        </DateRangePicker>
      )}
    </div>
  );
};

export default Title;

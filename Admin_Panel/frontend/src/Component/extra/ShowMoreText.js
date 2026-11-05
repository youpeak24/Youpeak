import React, { useState } from "react";

const ShowMoreText = ({ text, maxLength = 30, className = "" }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <span className={className}>-</span>;
  }

  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <span className={className}>
      <span style={{ wordBreak: "break-word" }}>
        {expanded ? text : `${text.substring(0, maxLength)}...`}
      </span>{" "}
      <span className="text-nowrap" onClick={handleToggle} style={{ color: "#059669" , cursor: "pointer", fontWeight: "500"}}>
        {expanded ? "Show Less" : "Show More"}
      </span>
    </span>
  );
};

export default ShowMoreText;

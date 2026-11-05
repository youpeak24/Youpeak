import React, { useEffect } from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export default function MultiButton(props) {
  const { multiButtonSelect, setMultiButtonSelect, label } = props;

  const handleAlignment = (event, newAlignment) => {
    if (newAlignment !== null && newAlignment !== undefined) {
      setMultiButtonSelect(newAlignment);
      if (
        newAlignment !== "Fake User" &&
        newAlignment !== "User" &&
        newAlignment !== "Profile" &&
        newAlignment !== "Avatar"
      ) {
        sessionStorage.setItem(
          "multiButton",
          JSON.stringify(newAlignment || label[0])
        );
      }
    }
  };

  useEffect(() => {
    if (!setMultiButtonSelect || !label?.length) return;
    let stored = null;
    try {
      const raw = sessionStorage.getItem("multiButton");
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = null;
    }
    const next = stored != null && label.includes(stored) ? stored : label[0];
    setMultiButtonSelect(next);
  }, []);

  if (!label?.length) return null;

  return (
    <div className="multiButton">
      <ToggleButtonGroup
        value={multiButtonSelect}
        exclusive
        onChange={handleAlignment}
        aria-label="tab selection"
      >
        {label.map((item, index) => (
          <ToggleButton key={index} value={item} aria-label={item}>
            <span style={{ textTransform: "none", fontSize: "0.78rem" }}>{item}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

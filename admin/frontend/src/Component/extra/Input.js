import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { Skeleton } from "@mui/material";

const Input = (props) => {
  const {
    label,
    name,
    id,
    type,
    onChange,
    newClass,
    value,
    defaultValue,
    errorMessage,
    placeholder,
    disabled,
    onFocus,
    readOnly,
    onKeyPress,
    checked,
    onClick,
    ref,
    required,
    autoComplete,
    style,
    accept,
    fieldClass,
    labelShow,
    loading,
  } = props;

  const [types, setTypes] = useState(type);

  const hideShow = () => {
    types === "password" ? setTypes("text") : setTypes("password");
  };

  if (loading) {
    return (
      <div className={`custom-input ${type} ${newClass}`}>
        {labelShow !== false && (
          <Skeleton variant="text" width="40%" height={16} style={{ marginBottom: 4 }} />
        )}
        <Skeleton variant="rectangular" width="100%" height={34} style={{ borderRadius: 0 }} />
      </div>
    );
  }

  return (
    <div
      className={`custom-input ${type || ""} ${newClass || ""} ${
        type === "gender" ? "me-2 mb-0" : ""
      }`}
    >
      {labelShow !== false && label && (
        <label htmlFor={id}>{label}</label>
      )}

      <div style={{ position: "relative" }}>
        <input
          type={types}
          className={`form-control ${fieldClass || ""}`}
          onChange={onChange}
          value={value}
          defaultValue={defaultValue}
          name={name}
          onWheel={(e) => type === "number" && e.target.blur()}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          onKeyPress={onKeyPress}
          checked={checked}
          onClick={onClick}
          required={required}
          onFocus={onFocus}
          style={style}
          ref={ref}
          accept={accept}
          autoComplete={autoComplete}
        />

        {type === "password" && (
          <div
            className="passHideShow"
            onClick={hideShow}
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {types === "password" ? <IconEye size={16} /> : <IconEyeOff size={16} />}
          </div>
        )}

        {type === "search" && !value && (
          <div
            className="searching"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-tertiary)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "12px" }} />
          </div>
        )}
      </div>

      {type !== "search" && errorMessage && (
        <p className="errorMessage">{errorMessage}</p>
      )}
    </div>
  );
};

export default Input;

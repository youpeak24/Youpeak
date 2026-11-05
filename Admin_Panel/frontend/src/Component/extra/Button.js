const Button = (props) => {
  const { newClass, btnColor, btnName, onClick, style, btnIcon, disabled, type } = props;

  return (
    <button
      className={`themeBtn ${newClass || ""} ${btnColor || ""}`}
      onClick={onClick}
      disabled={disabled}
      type={type || "button"}
      style={style}
    >
      {btnIcon && btnIcon}
      {btnName}
    </button>
  );
};

export default Button;

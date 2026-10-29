function Button({
  children,
  type = "button",
  onClick,
  disabled,
  variant,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${variant || ""} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export default Button;

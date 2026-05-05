export default function Button({
  children,
  type = "button",
  onClick,
  className = "",
  disabled,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#0d4c9e] hover:bg-[#0a3d80] text-white font-medium py-3 px-12 rounded-full transition-colors whitespace-nowrap lg:text-[12px] text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
    >

      {children}
    </button>
  );
}

export default function Input({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}) {
  return (
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e4e8c]/50 focus:border-[#1e4e8c] transition-all text-gray-700 placeholder-gray-400 lg:text-[12px] text-base ${className}`}
      {...props}
    />
  );
}

export default function Textarea({
  id,
  placeholder,
  value,
  onChange,
  className = "",
  rows = 4,
  disabled = false,
  ...props
}) {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] transition-all text-[#1e293b] placeholder-gray-400 font-medium lg:text-[14px] text-base resize-none ${disabled ? 'bg-gray-50 text-gray-400 opacity-70' : ''} ${className}`}
      {...props}
    />
  );
}

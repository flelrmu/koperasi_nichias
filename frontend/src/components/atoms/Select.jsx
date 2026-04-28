import { ChevronDown } from 'lucide-react';

export default function Select({
  id,
  options = [],
  value,
  onChange,
  className = "",
  disabled = false,
  ...props
}) {
  return (
    <div className="relative w-full">
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004A9C]/50 focus:border-[#004A9C] transition-all font-medium lg:text-[14px] text-base appearance-none bg-white ${disabled ? 'bg-gray-50 text-gray-400 opacity-70 cursor-not-allowed' : ''} ${!value ? 'text-gray-400' : 'text-[#1e293b]'} ${className}`}
        {...props}
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <ChevronDown className={`w-5 h-5 ${disabled ? 'text-[#cbd5e1]' : 'text-gray-500'}`} />
      </div>
    </div>
  );
}

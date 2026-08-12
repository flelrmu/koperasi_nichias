import nichiasLogo from "../../assets/nichias.png";

export default function Logo({ variant = "default" }) {
  const isWhite = variant === "white";
  
  return (
    <div className="flex items-center gap-2 group select-none">
      <div className="relative flex items-center justify-center">
        {}
        {isWhite && (
          <div className="absolute inset-0 bg-white/15 blur-xl rounded-full scale-125 animate-pulse-slow" />
        )}
        <img 
          src={nichiasLogo} 
          alt="Nichias Logo" 
          className={`relative z-10 w-8 h-8 object-contain transition-all duration-500 group-hover:scale-105 ${
            isWhite ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''
          }`} 
        />
      </div>
      <div className="flex flex-col -space-y-1 leading-none">
        <span className={`${isWhite ? 'text-white' : 'text-[#004A9C]'} font-black text-sm tracking-tighter transition-colors uppercase`}>
          NICHIAS
        </span>
        <span className={`${isWhite ? 'text-white/60' : 'text-[#004A9C]/40'} font-black text-sm tracking-tighter transition-colors uppercase`}>
          SUNIJAYA
        </span>
      </div>
    </div>
  );
}

import Logo from "../components/atoms/Logo";

export default function AuthLayout({ children, headerRight }) {
  return (
    <div className="min-h-screen relative flex flex-col items-center pt-6 md:pt-8 px-4 pb-8 overflow-hidden bg-slate-50">
      {/* Abstract Background Gradient based on the image */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-100/50 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full bg-orange-50/60 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-6 sm:mb-8 px-2 lg:px-5 relative z-10">
        <Logo />
        {headerRight && <div>{headerRight}</div>}
      </div>

      {/* Main Title */}
      <h1 className="text-[15px] sm:text-xl md:text-2xl font-bold text-[#0d4c9e] text-center mb-6 sm:mb-8 tracking-wide relative z-10 px-4">
        KOPERASI KARYAWAN NICHIAS SUNIJAYA
      </h1>

      {/* Content Container */}
      <div className="w-full max-w-4xl bg-transparent relative z-10 flex justify-center">
        {children}
      </div>
    </div>
  );
}

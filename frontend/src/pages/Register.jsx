import { Info } from "lucide-react";
import { Link } from "react-router-dom";
import AuthLayout from "../templates/AuthLayout";
import RegisterForm from "../components/organisms/RegisterForm";

export default function Register() {
  const headerRightObj = (
    <Link 
      to="/rules"
      className="flex items-center gap-2 text-gray-500 hover:text-[#0d4c9e] transition-colors cursor-pointer mr-2"
    >
      <Info className="w-5 h-5" />
      <span className="text-sm font-medium hidden sm:inline-block">
        Aturan Koperasi
      </span>
    </Link>
  );

  return (
    <AuthLayout headerRight={headerRightObj}>
      <div className="w-full max-w-4xl px-4 md:px-8">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}

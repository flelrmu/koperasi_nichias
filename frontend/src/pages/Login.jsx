import AuthLayout from "../templates/AuthLayout";
import LoginForm from "../components/organisms/LoginForm";

export default function Login() {
  return (
    <AuthLayout>
      <div className="w-full max-w-[400px] px-4 md:px-0">
        <LoginForm />
      </div>
    </AuthLayout>
  );
}

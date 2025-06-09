import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-[400px] space-y-6">
        <div className="text-center space-y-2">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto">
            <img 
              src="/marvellous-logo-black.png" 
              alt="Marvellous Manager Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Marvellous Manager
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Sign in to your account
          </p>
        </div>

        <div >
          <LoginForm />
        </div>

      </div>
    </div>
  );
};

export default Login;


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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Marvellous Manager</h1>
          <p className="text-gray-600 mt-2">Hard Drive Management Solutions</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;

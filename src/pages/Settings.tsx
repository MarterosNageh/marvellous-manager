
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import UserManagement from "./UserManagement";
import { Navigate } from "react-router-dom";

const Settings = () => {
  const { currentUser } = useAuth();
  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  return (
    <MainLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <section>
          <h2 className="text-lg font-semibold mb-2">User Management</h2>
          <UserManagement />
        </section>
      </div>
    </MainLayout>
  );
};
export default Settings;

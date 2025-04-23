
import { MainLayout } from "@/components/layout/MainLayout";

const TaskManager = () => {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <h1 className="text-3xl font-bold mb-4">Task Manager</h1>
        <p className="text-xl text-gray-600 mb-6">Coming Soon</p>
        <p className="text-gray-500 max-w-md text-center">
          The task management system is under development and will be available soon.
          Check back later for updates.
        </p>
      </div>
    </MainLayout>
  );
};

export default TaskManager;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { MainLayout } from "@/components/layout/MainLayout";

interface Task {
  id: string;
  name: string;
  status: {
    status: string;
  };
}

const TaskManager = () => {
  const CLIENT_ID = "UZWSH210G5GD6NOP2XAK4SNNY2BSFIGO";
  const REDIRECT_URI = "http://localhost:5173/oauth/callback"; // Adjust this based on your actual app domain

  return (
    <MainLayout>
      <ClickUpIntegration CLIENT_ID={CLIENT_ID} REDIRECT_URI={REDIRECT_URI} />
    </MainLayout>
  );
};

const ClickUpIntegration = ({ CLIENT_ID, REDIRECT_URI }: { CLIENT_ID: string, REDIRECT_URI: string }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("clickup_token"));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle OAuth code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !token) {
      setLoading(true);
      axios
        .post("http://localhost:3001/api/clickup/exchange", { code })
        .then((res) => {
          const newToken = res.data.access_token;
          localStorage.setItem("clickup_token", newToken);
          setToken(newToken);
          window.history.replaceState({}, "", "/"); // Clean URL
        })
        .catch((err) => console.error("Token exchange failed:", err))
        .finally(() => setLoading(false));
    }
  }, [token]);

  // Fetch tasks after token is set
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    axios
      .get("https://api.clickup.com/api/v2/team", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const teamId = res.data.teams[0].id;
        return axios.get(`https://api.clickup.com/api/v2/team/${teamId}/task`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => setTasks(res.data.tasks))
      .catch((err) => console.error("Fetching tasks failed:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const logout = () => {
    localStorage.removeItem("clickup_token");
    setToken(null);
    setTasks([]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded shadow w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6 text-purple-700">ClickUp Integration</h1>

        {!token ? (
          <a
            href={`https://app.clickup.com/api?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Connect ClickUp
          </a>
        ) : (
          <>
            <button
              onClick={logout}
              className="mb-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
            >
              Logout
            </button>

            {loading ? (
              <p className="text-gray-500">Loading tasks...</p>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="p-4 bg-gray-100 rounded border border-gray-300"
                  >
                    <div className="font-semibold text-lg">{task.name}</div>
                    <div className="text-sm text-gray-500">
                      Status: {task.status.status}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskManager;

import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Register service worker for FCM
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('FCM Service Worker registered:', registration);
    } catch (error) {
      console.error('FCM Service Worker registration failed:', error);
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

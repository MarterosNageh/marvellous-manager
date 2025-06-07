import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIw7y43dseUoKSeRjxZ3FC0JwqQvDkPdc",
  authDomain: "marvellous-manager.firebaseapp.com",
  projectId: "marvellous-manager",
  storageBucket: "marvellous-manager.firebasestorage.app",
  messagingSenderId: "368753443778",
  appId: "1:368753443778:web:91898578c1af5b04184c5b",
  measurementId: "G-7PVGNBPXZ7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);



const messaging = async () => {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
};

export const fetchToken = async () => {
  try {
    const fcmMessaging = await messaging();
    if (fcmMessaging) {
      const token = await getToken(fcmMessaging, {
        vapidKey: "BMHNZr9Ik3CyBzIdS_9aeA1LTa85kjQWgIdMhswayeD6FtuUYIXflVJBPzDGWbNUqUx5QDXajEIskPx8Nsk7QNs",
      });
      return token;
    }
    return null;
  } catch (err) {
    console.error("An error occurred while fetching the token:", err);
    return null;
  }
};

export { app, messaging };
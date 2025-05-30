const fs = require('fs');
const path = require('path');

// Read Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Path to service worker file
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

// Read the service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the placeholder with actual config
swContent = swContent.replace(
  /const firebaseConfig = self\.__FIREBASE_CONFIG__ \|\| {[\s\S]*?};/,
  `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};`
);

// Write the updated content back
fs.writeFileSync(swPath, swContent);

console.log('✅ Firebase configuration injected into service worker'); 
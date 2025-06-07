import express from 'express';
import cors from 'cors';
import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try different possible locations for the service account file
    const possiblePaths = [
      '../../../Firebase_Key/marvellous-manager-firebase-adminsdk.json',
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
    ].filter(Boolean);

    let serviceAccount = null;
    let loadedPath: string | null = null;

    for (const filePath of possiblePaths) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          serviceAccount = require(filePath);
          loadedPath = filePath;
          break;
        }
      } catch (e) {
        console.log(`Could not load service account from ${filePath}`);
      }
    }

    if (!serviceAccount) {
      throw new Error(
        'Firebase service account file not found. Please ensure service_key.json exists in the project root or src directory.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully using:', loadedPath);
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
  }
}

app.post('/api/send-notification', async (req: express.Request, res: express.Response) => {
  console.log('Received notification request:', req.body);
  
  const { token, title, message, link } = req.body as {
    token: string;
    title: string; 
    message: string;
    link?: string;
  };
  
  if (!token || !title || !message) {
    console.error('Missing required fields:', { token, title, message });
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }

  const payload: Message = {
    token,
    notification: {
      title,
      body: message,
    },
    webpush: link ? {
      fcmOptions: {
        link,
      },
    } : undefined,
  };

  try {
    console.log('Attempting to send notification with payload:', payload);
    const response = await admin.messaging().send(payload);
    console.log('Notification sent successfully:', response);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccount = require("../../../Firebase_Key/marvellous-manager-firebase-adminsdk.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, title, message, link } = await request.json();

    // Validate required fields
    if (!token || !title || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
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

    const response = await admin.messaging().send(payload);
    return NextResponse.json({ 
      success: true, 
      messageId: response,
      message: "Notification sent successfully!" 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
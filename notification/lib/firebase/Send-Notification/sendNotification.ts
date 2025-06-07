interface NotificationPayload {
  token: string;
  title: string;
  message: string;
  link?: string;
}

interface NotificationResponse {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<NotificationResponse> {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 
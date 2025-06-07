import React from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import axios from 'axios';

export const NotificationExample = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSendNotification = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the FCM token
      const messaging = getMessaging();
      const token = await getToken(messaging);

      if (!token) {
        throw new Error('No FCM token available. Please check notification permissions.');
      }

      // Send the notification
      const result = await axios.post('/api/send-notification', {
        token,
        title: 'Test Notification',
        message: 'This is a test notification from Marvellous Manager!',
        link: '/dashboard', // Optional: Add a link to navigate to when clicked
      });

      if (result.data.success) {
        alert('Notification sent successfully!');
      } else {
        setError(result.data.error || 'Failed to send notification');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={handleSendNotification}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Sending...' : 'Send Test Notification'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
}; 
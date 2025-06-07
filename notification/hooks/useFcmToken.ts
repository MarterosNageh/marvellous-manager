import { useState, useEffect } from 'react';

const useFcmToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder for FCM token logic
    setToken(null);
  }, []);

  return token;
};

export default useFcmToken; 
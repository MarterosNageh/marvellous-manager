import express from 'express';
import axios from 'axios';

const app = express();
const PORT = 3001;

const CLIENT_ID = 'UZWSH210G5GD6NOP2XAK4SNNY2BSFIGO';
const CLIENT_SECRET = 'UG18AHRM8DJFZSZW3T6679D6TH8ZYBBAEHEJCJF9SFIJQMY6KS5EI4A6TIQTGR3A';
const REDIRECT_URI = 'https://ominous-fortnight-4j75xx69j459f7r9w-8080.app.github.dev/oauth/callback';

app.use(express.json());

// This is your OAuth callback handler
app.get('/oauth/callback', async (req, res) => {
  const code = req.query.code;  // Get the authorization code from the URL query

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange the code for an access token
    const response = await axios.post('https://github.com/login/oauth/access_token', null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      },
      headers: {
        accept: 'application/json', // This tells GitHub we expect a JSON response
      },
    });

    const accessToken = response.data.access_token;
    
    // You should store the access token in a secure place (e.g., database, session)
    console.log('Access token:', accessToken);

    // Redirect or send a success response
    res.send('OAuth authentication successful!');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: 'Failed to exchange code for token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Access environment variables
const {
  CLIENT_ID,
  CLIENT_SECRET,
  EMAIL,
  NAME,
  ROLLNO,
  ACCESS_CODE,
  BASE_URL,
  ACCESS_TOKEN
} = process.env;

// Logging endpoint
app.post('/api/log', (req, res) => {
  const { eventType, data, timestamp = new Date().toISOString() } = req.body;
  
  console.log(`[${timestamp}] ${eventType}:`, {
    user: { email: EMAIL, name: NAME, rollNo: ROLLNO },
    ...data
  });
  
  res.json({ success: true, message: 'Event logged successfully' });
});

// URL shortening endpoints (mock for now)
app.post('/api/shorten', (req, res) => {
  const { originalUrl, validityPeriod, customShortcode } = req.body;
  
  // Log the creation
  console.log(`[${new Date().toISOString()}] URL_CREATED:`, {
    originalUrl,
    validityPeriod,
    customShortcode,
    user: EMAIL
  });
  
  res.json({
    success: true,
    shortcode: customShortcode || Math.random().toString(36).substring(2, 8),
    shortUrl: `${BASE_URL}/${customShortcode || 'abc123'}`,
    expiryDate: new Date(Date.now() + validityPeriod * 60000)
  });
});

app.listen(PORT, () => {
  console.log(`Logging middleware running on port ${PORT}`);
  console.log(`Connected to: ${BASE_URL}`);
  console.log(`User: ${NAME} (${EMAIL})`);
});
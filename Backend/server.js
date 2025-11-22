import cors from 'cors';
import express from 'express';

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: 'http://localhost:8080', // Allow requests from the frontend (adjust for your actual frontend URL)
  credentials: true, // Allow cookies to be sent with the request (important for JWT in cookies)
};

// Apply CORS middleware with the specified options
app.use(cors(corsOptions));

app.use(express.json()); // To parse JSON bodies

// POST route for login (make sure to use POST for login)
app.post('/api/login', (req, res) => {
  // Simulate login logic here
  const { username, password } = req.body;
  
  // For demonstration, assume username is 'test' and password is 'password123'
  if (username === 'test' && password === 'password123') {
    // Simulate JWT creation and set a cookie (you'd normally use a library like jsonwebtoken here)
    res.cookie('token', 'dummy_jwt_token', { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 3600000 // 1 hour
    });
    return res.status(200).json({ message: 'Login successful' });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

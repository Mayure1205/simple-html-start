// server.js

import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // To parse JSON bodies
app.use(cookieParser()); // To parse cookies from the request
// Set up rate limiting (max 5 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests, please try again later.',
});

const corsOptions = {
  origin: '*', // Allow requests from any origin
  credentials: true, // Allow cookies to be sent with the request (important for JWT in cookies)
};

// Enable CORS with the specified options
app.use(cors(corsOptions));
app.use('/api/', limiter); // Apply to all /api routes

// Dummy in-memory user database (replace with actual DB in production)
let users = [
 {
    id: 1,
    username: 'testuser',
    password: '$2a$10$P1D0NDrQkTojdpWfPyzT3eoqYZgkVKwTLC4FnL0ktyZ6X0ij9SeMi', // 'password123' hashed
  },
];

// POST /login route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Compare the given password with the hashed password in the database
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Create a JWT token
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });

  // Store the JWT token in a cookie
  res.cookie('token', token, {
    httpOnly: true, // Cannot be accessed from JavaScript
    secure: process.env.NODE_ENV === 'production', // Only send cookies over HTTPS in production
    maxAge: 3600000, // 1 hour
  });

  return res.status(200).json({ message: 'Login successful' });
});

// POST /logout route to clear the JWT cookie
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Middleware to protect routes and check JWT
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token is not valid' });
    }
    req.user = user;
    next();
  });
}

// Protected route example (requires JWT token)
app.get('/api/protected', authenticateToken, (req, res) => {
  return res.status(200).json({ message: 'Protected data accessed', user: req.user });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

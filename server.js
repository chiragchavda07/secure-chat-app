require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key_here'; // Use env variable or fallback

app.use(cors());
app.use(express.json());

// In-memory user store (replace with DB in production)
const users = new Map();

// Register endpoint
app.post('/register', async (req, res) => {
  const { username, password, inviteCode } = req.body;
  const REQUIRED_INVITE_CODE = process.env.INVITE_CODE || 'secret-invite-code';
  console.log('REQUIRED_INVITE_CODE:',REQUIRED_INVITE_CODE);
  if (inviteCode !== REQUIRED_INVITE_CODE) {
    return res.status(403).json({ error: 'Invalid invite code' });
  }

  if (users.has(username)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users.set(username, hashedPassword);
  res.status(201).json({ message: 'User registered successfully' });
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = users.get(username);
  if (!hashedPassword) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  const valid = await bcrypt.compare(password, hashedPassword);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// WebSocket connection with token authentication
wss.on('connection', (ws, req) => {
  // Parse token from query string
  const params = new URLSearchParams(req.url.replace('/?', ''));
  const token = params.get('token');

  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }

  let user;
  try {
    user = jwt.verify(token, SECRET_KEY);
  } catch (err) {
    ws.close(1008, 'Invalid token');
    return;
  }

  ws.username = user.username;

  ws.on('message', (message) => {
    // Convert message to string if it is a Buffer
    const msgString = typeof message === 'string' ? message : message.toString();

    // Broadcast message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ username: ws.username, message: msgString }));
      }
    });
  });

  ws.send(JSON.stringify({ message: 'Welcome to the secure chat server!' }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server started on port ' + PORT);
});

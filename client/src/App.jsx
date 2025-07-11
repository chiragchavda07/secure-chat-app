import React, { useState, useEffect, useRef } from 'react';
import pic from './assets/images/pic.jpg';

const BACKEND_URL = 'http://localhost:3000';
const WEBSOCKET_URL = 'ws://localhost:3000?token=';
// const WEBSOCKET_URL = 'wss://secure-chat-app-production-bb99.up.railway.app?token=';
// const BACKEND_URL = 'https://secure-chat-app-production-bb99.up.railway.app';
function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [token, setToken] = useState(() => {
    // Load token from localStorage on app start
    return localStorage.getItem('token');
  });
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [showActiveUsers, setShowActiveUsers] = useState(false);
  const ws = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (token) {
      ws.current = new WebSocket(WEBSOCKET_URL + token);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'chat':
            setMessages((prev) => [...prev, data]);
            break;
          case 'typing':
            setTypingUsers(data.users.filter((user) => user !== username));
            break;
          case 'activeUsers':
            setActiveUsers(data.users);
            break;
          case 'readReceipt':
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.messageId === data.messageId ? { ...msg, readBy: data.users } : msg
              )
            );
            break;
          case 'system':
            console.log('System message:', data.message);
            break;
          default:
            break;
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        ws.current.close();
      };
    }
  }, [token, username]);

  const register = async () => {
    const res = await fetch(BACKEND_URL + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, inviteCode }),
    });
    if (res.ok) {
      alert('Registration successful. Please login.');
    } else {
      const data = await res.json();
      alert('Registration failed: ' + data.error);
    }
  };

  const login = async () => {
    const res = await fetch(BACKEND_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      localStorage.setItem('token', data.token); // Persist token in localStorage
    } else {
      const data = await res.json();
      alert('Login failed: ' + data.error);
    }
  };

  const sendMessage = () => {
    if (ws.current && inputMessage.trim() !== '') {
      ws.current.send(JSON.stringify({ type: 'chat', message: inputMessage }));
      setInputMessage('');
    }
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'typing', isTyping: true }));
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      typingTimeout.current = setTimeout(() => {
        ws.current.send(JSON.stringify({ type: 'typing', isTyping: false }));
      }, 1000);
    }
  };

  const toggleActiveUsers = () => {
    setShowActiveUsers(!showActiveUsers);
  };

  const sendReadReceipt = (messageId) => {
    if (ws.current) {
      ws.current.send(JSON.stringify({ type: 'readReceipt', messageId }));
    }
  };

  useEffect(() => {
    // Send read receipt for the last message received
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.username !== username) {
        sendReadReceipt(lastMessage.messageId);
      }
    }
  }, [messages, username]);

  if (!token) {
    return (
      <div className="min-vh-100 d-flex flex-column justify-content-center align-items-center bg-light p-4">
        <div className="w-100" style={{ maxWidth: '400px' }}>
          <h2 className="h2 mb-4 text-center">Secure Chat Login/Register</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control mb-3"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control mb-3"
          />
          <input
            type="text"
            placeholder="Invite Code"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="form-control mb-4"
          />
          <div className="d-flex justify-content-between gap-2">
            <button onClick={login} className="btn btn-primary flex-grow-1">
              Login
            </button>
            <button onClick={register} className="btn btn-secondary flex-grow-1">
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <img src={pic} alt="User provided" style={{ maxWidth: '100%', height: 'auto' }} />
    </div>
  );
}

export default App;

import React, { useState, useEffect, useRef } from 'react';

// const BACKEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'https://secure-chat-app-production-bb99.up.railway.app';
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
  const ws = useRef(null);

  useEffect(() => {
    if (token) {
      ws.current = new WebSocket('wss://secure-chat-app-production-bb99.up.railway.app?token=' + token);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
      };

      return () => {
        ws.current.close();
      };
    }
  }, [token]);

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
      // Send message as string
      ws.current.send(String(inputMessage));
      setInputMessage('');
    }
  };

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
            <button
              onClick={login}
              className="btn btn-primary flex-grow-1"
            >
              Login
            </button>
            <button
              onClick={register}
              className="btn btn-secondary flex-grow-1"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-75 mx-auto p-4 d-flex flex-column vh-100">
      <h2 className="h2 mb-4 text-center">Secure Chat</h2>
      <div
        className="flex-grow-1 overflow-auto border rounded p-4 mb-4 bg-white"
        id="messages"
        style={{ maxHeight: '70vh' }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 p-2 rounded ${
              msg.username === username ? 'bg-primary text-white ms-auto' : 'bg-light'
            }`}
            style={{ maxWidth: '70%' }}
          >
            <strong>{msg.username || 'Server'}:</strong>{' '}
            <span>{typeof msg.message === 'object' ? JSON.stringify(msg.message) : msg.message}</span>
          </div>
        ))}
      </div>
      <div className="d-flex gap-2">
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') sendMessage();
          }}
          className="form-control flex-grow-1"
        />
        <button
          onClick={sendMessage}
          className="btn btn-primary"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default App;

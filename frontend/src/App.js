import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import TicketDetails from './components/TicketDetails';
import CreateTicket from './components/CreateTicket';
import UserManagement from './components/UserManagement';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Axios interceptor for adding auth token
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md" data-testid="login-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ERP Ticketing System</h1>
          <p className="text-gray-600">Login to continue</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="login-form">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-testid="login-error">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              data-testid="username-input"
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              data-testid="password-input"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            data-testid="login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>Please contact your system administrator for login credentials.</p>
        </div>
      </div>
    </div>
  );
}

function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white shadow-lg" data-testid="navbar">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">ERP Ticketing System</h1>
            <div className="hidden md:flex space-x-4">
              <button
                data-testid="nav-dashboard"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-blue-700 px-3 py-2 rounded transition"
              >
                Dashboard
              </button>
              <button
                data-testid="nav-tickets"
                onClick={() => navigate('/tickets')}
                className="hover:bg-blue-700 px-3 py-2 rounded transition"
              >
                Tickets
              </button>
              {(user.role === 'Admin' || user.role === 'Support Engineer') && (
                <button
                  data-testid="nav-create-ticket"
                  onClick={() => navigate('/create-ticket')}
                  className="hover:bg-blue-700 px-3 py-2 rounded transition"
                >
                  Create Ticket
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm" data-testid="user-info">
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-blue-200 text-xs">{user.role}</p>
            </div>
            <button
              data-testid="logout-button"
              onClick={onLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/tickets" element={<TicketList user={user} />} />
          <Route path="/tickets/:ticketId" element={<TicketDetails user={user} />} />
          <Route path="/create-ticket" element={<CreateTicket user={user} />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

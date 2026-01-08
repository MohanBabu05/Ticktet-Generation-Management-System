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
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending registration request to:', `${API_URL}/api/auth/register`);
      console.log('Registration data:', {
        username: registerData.username,
        full_name: registerData.fullName
      });
      
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username: registerData.username,
        password: registerData.password,
        full_name: registerData.fullName
      });

      console.log('Registration successful:', response.data);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Show success message briefly
      setError('');
      alert(`Account created successfully!\nYou are registered as: ${response.data.user.role}`);
      
      onLogin(response.data.user);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.detail || err.message || 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md" data-testid="register-container">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Account</h1>
            <p className="text-gray-600">Register for ERP Ticketing System</p>
          </div>

          <form onSubmit={handleRegister} data-testid="register-form">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" data-testid="register-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                Full Name
              </label>
              <input
                data-testid="register-fullname-input"
                id="fullName"
                type="text"
                value={registerData.fullName}
                onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="register-username">
                Username
              </label>
              <input
                data-testid="register-username-input"
                id="register-username"
                type="text"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Choose a username"
                pattern="[a-zA-Z0-9_]+"
                title="Only letters, numbers, and underscores allowed"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Only letters, numbers, and underscores</p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="register-password">
                Password
              </label>
              <input
                data-testid="register-password-input"
                id="register-password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 characters)"
                minLength="6"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                Confirm Password
              </label>
              <input
                data-testid="register-confirm-password-input"
                id="confirm-password"
                type="password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
                minLength="6"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm text-blue-800">
              <p><strong>Note:</strong> First user gets Admin role. Subsequent users get Manager role (read-only). Admin can upgrade your role later.</p>
            </div>

            <button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-green-300 mb-3"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <button
              data-testid="back-to-login-button"
              type="button"
              onClick={() => {
                setShowRegister(false);
                setError('');
                setRegisterData({username: '', password: '', confirmPassword: '', fullName: ''});
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-blue-300 mb-3"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            data-testid="create-account-button"
            type="button"
            onClick={() => setShowRegister(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Create New Account
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-600 text-center">
          <p>Need help? Contact your system administrator.</p>
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
              {user.role === 'Admin' && (
                <button
                  data-testid="nav-user-management"
                  onClick={() => navigate('/users')}
                  className="hover:bg-blue-700 px-3 py-2 rounded transition"
                >
                  Users
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
          <Route path="/users" element={<UserManagement user={user} />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

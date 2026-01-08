import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    role: 'Support Engineer'
  });

  useEffect(() => {
    if (user.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post(`${API_URL}/api/users`, formData);
      setMessage('User created successfully');
      setShowCreateForm(false);
      setFormData({
        username: '',
        password: '',
        full_name: '',
        role: 'Support Engineer'
      });
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error creating user');
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/users/${username}`);
      setMessage(`User ${username} deleted successfully`);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error deleting user');
    }
  };

  const handleRoleChange = async (username, newRole) => {
    if (!window.confirm(`Change role for "${username}" to "${newRole}"?`)) {
      return;
    }

    try {
      await axios.put(`${API_URL}/api/users/${username}/role`, { role: newRole });
      setMessage(`Role updated successfully for ${username}`);
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error updating role');
    }
  };

  if (user.role !== 'Admin') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Access denied. Only administrators can manage users.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-management-container">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800" data-testid="user-management-title">User Management</h2>
        <button
          data-testid="create-user-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          {showCreateForm ? 'Cancel' : 'Create New User'}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded ${message.includes('Error') || message.includes('deleted') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          data-testid="user-management-message"
        >
          {message}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6" data-testid="create-user-form">
          <h3 className="text-xl font-semibold mb-4">Create New User</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username *</label>
              <input
                data-testid="input-username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter unique username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                data-testid="input-full-name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input
                data-testid="input-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 characters)"
                minLength="6"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <select
                data-testid="input-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Admin">Admin</option>
                <option value="Support Engineer">Support Engineer</option>
                <option value="Developer">Developer</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                data-testid="submit-user-button"
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              >
                Create User
              </button>
              <button
                data-testid="cancel-user-button"
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="users-table-container">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold">All Users ({users.length})</h3>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12" data-testid="no-users-message">
            <div className="text-xl text-gray-600">No users found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.username} className="hover:bg-gray-50" data-testid={`user-row-${u.username}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.username}
                      {u.created_by === 'self_registration' && (
                        <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Self-registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.username, e.target.value)}
                        disabled={u.username === user.username}
                        className={`px-2 py-1 text-xs font-semibold rounded border ${
                          u.username === user.username ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          u.role === 'Admin' ? 'bg-red-100 text-red-800 border-red-300' :
                          u.role === 'Support Engineer' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          u.role === 'Developer' ? 'bg-green-100 text-green-800 border-green-300' :
                          'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                        data-testid={`role-select-${u.username}`}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Support Engineer">Support Engineer</option>
                        <option value="Developer">Developer</option>
                        <option value="Manager">Manager</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        data-testid={`delete-user-${u.username}`}
                        onClick={() => handleDeleteUser(u.username)}
                        disabled={u.username === user.username}
                        className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <p className="text-sm text-blue-800">
          <strong>Security Note:</strong> Users should change their passwords immediately after first login. 
          Passwords are securely hashed and cannot be recovered - only reset.
        </p>
      </div>
    </div>
  );
}

export default UserManagement;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function CreateTicket({ user }) {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [formData, setFormData] = useState({
    customer: '',
    module: '',
    cr_type: 'Customer CR',
    issue_type: '',
    type: '',
    description: '',
    priority: 'Medium',
    amc_cost: '',
    pr_approval: '',
    planned_date: '',
    commitment_date: '',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/modules`);
      setModules(response.data.modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post(`${API_URL}/api/tickets`, formData);
      setMessage(`Ticket ${response.data.ticket_number} created successfully!`);
      
      // Reset form
      setTimeout(() => {
        navigate(`/tickets/${response.data.ticket_number}`);
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error creating ticket');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has permission
  if (user.role !== 'Admin' && user.role !== 'Support Engineer') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        You don't have permission to create tickets.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="create-ticket-container">
      <div>
        <button
          data-testid="back-to-tickets-button"
          onClick={() => navigate('/tickets')}
          className="text-blue-600 hover:text-blue-800 mb-2"
        >
          ← Back to Tickets
        </button>
        <h2 className="text-3xl font-bold text-gray-800" data-testid="create-ticket-title">Create New Ticket</h2>
      </div>

      {message && (
        <div
          className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          data-testid="create-ticket-message"
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-ticket-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer *</label>
              <input
                data-testid="input-customer"
                type="text"
                value={formData.customer}
                onChange={(e) => handleChange('customer', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter customer name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Module *</label>
              <select
                data-testid="input-module"
                value={formData.module}
                onChange={(e) => handleChange('module', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Module</option>
                {modules.map(module => (
                  <option key={module} value={module}>{module}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">CR Type *</label>
              <select
                data-testid="input-cr-type"
                value={formData.cr_type}
                onChange={(e) => handleChange('cr_type', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Customer CR">Customer CR</option>
                <option value="Internal CR">Internal CR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Issue Type *</label>
              <input
                data-testid="input-issue-type"
                type="text"
                value={formData.issue_type}
                onChange={(e) => handleChange('issue_type', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Operational Issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                data-testid="input-type"
                type="text"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                data-testid="input-priority"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">AMC Cost</label>
              <input
                data-testid="input-amc-cost"
                type="text"
                value={formData.amc_cost}
                onChange={(e) => handleChange('amc_cost', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">PR Approval</label>
              <input
                data-testid="input-pr-approval"
                type="text"
                value={formData.pr_approval}
                onChange={(e) => handleChange('pr_approval', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Planned Date</label>
              <input
                data-testid="input-planned-date"
                type="date"
                value={formData.planned_date}
                onChange={(e) => handleChange('planned_date', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Commitment Date</label>
              <input
                data-testid="input-commitment-date"
                type="date"
                value={formData.commitment_date}
                onChange={(e) => handleChange('commitment_date', e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              data-testid="input-description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter detailed description"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Remarks</label>
            <textarea
              data-testid="input-remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Optional remarks"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Support Engineer and Developer will be automatically assigned based on the selected module.
              An email notification will be sent to the assigned developer automatically.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              data-testid="submit-ticket-button"
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition disabled:bg-green-300"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
            <button
              data-testid="cancel-create-button"
              type="button"
              onClick={() => navigate('/tickets')}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TicketDetails({ user }) {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [statusUpdate, setStatusUpdate] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [completionRemarks, setCompletionRemarks] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/tickets/${ticketId}`);
      setTicket(response.data);
      setFormData(response.data);
      setStatusUpdate(response.data.status);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      setMessage('Error loading ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        customer: formData.customer,
        cr_type: formData.cr_type,
        issue_type: formData.issue_type,
        type: formData.type,
        module: formData.module,
        description: formData.description,
        amc_cost: formData.amc_cost,
        pr_approval: formData.pr_approval,
        priority: formData.priority,
        planned_date: formData.planned_date,
        commitment_date: formData.commitment_date,
        remarks: formData.remarks,
        exe_sent: formData.exe_sent,
        reason_for_issue: formData.reason_for_issue,
        customer_call: formData.customer_call
      };

      await axios.put(`${API_URL}/api/tickets/${ticketId}`, updateData);
      setMessage('Ticket updated successfully');
      setEditing(false);
      fetchTicket();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error updating ticket');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.put(`${API_URL}/api/tickets/${ticketId}/status`, {
        status: statusUpdate,
        completed_by: user.full_name
      });
      setMessage('Status updated successfully');
      fetchTicket();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Error updating status');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'New': 'status-new',
      'Assigned': 'status-assigned',
      'In Progress': 'status-in-progress',
      'Completed': 'status-completed',
      'Closed': 'status-closed',
      'Pending': 'status-pending'
    };
    return `status-badge ${statusMap[status] || ''}`;
  };

  const canEdit = () => {
    if (user.role === 'Admin') return true;
    if (ticket.status === 'Completed') return false;
    if (user.role === 'Support Engineer' || user.role === 'Developer') return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="ticket-details-container">
      <div className="flex justify-between items-center">
        <div>
          <button
            data-testid="back-button"
            onClick={() => navigate('/tickets')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Tickets
          </button>
          <h2 className="text-3xl font-bold text-gray-800" data-testid="ticket-details-title">
            Ticket {ticket.ticket_number}
          </h2>
        </div>
        <div className="flex gap-2">
          {canEdit() && !editing && (
            <button
              data-testid="edit-ticket-button"
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Edit Ticket
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`} data-testid="ticket-message">
          {message}
        </div>
      )}

      {/* Ticket Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold">Ticket Information</h3>
          <span className={getStatusClass(ticket.status)} data-testid="ticket-detail-status">
            {ticket.status}
          </span>
        </div>

        {editing ? (
          <form onSubmit={handleUpdateTicket} className="space-y-4" data-testid="edit-ticket-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <input
                  data-testid="edit-customer"
                  type="text"
                  value={formData.customer || ''}
                  onChange={(e) => setFormData({...formData, customer: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Module</label>
                <input
                  data-testid="edit-module"
                  type="text"
                  value={formData.module || ''}
                  onChange={(e) => setFormData({...formData, module: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">CR Type</label>
                <select
                  data-testid="edit-cr-type"
                  value={formData.cr_type || ''}
                  onChange={(e) => setFormData({...formData, cr_type: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Customer CR">Customer CR</option>
                  <option value="Internal CR">Internal CR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <input
                  data-testid="edit-issue-type"
                  type="text"
                  value={formData.issue_type || ''}
                  onChange={(e) => setFormData({...formData, issue_type: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  data-testid="edit-priority"
                  value={formData.priority || 'Medium'}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
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
                  data-testid="edit-amc-cost"
                  type="text"
                  value={formData.amc_cost || ''}
                  onChange={(e) => setFormData({...formData, amc_cost: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">PR Approval</label>
                <input
                  data-testid="edit-pr-approval"
                  type="text"
                  value={formData.pr_approval || ''}
                  onChange={(e) => setFormData({...formData, pr_approval: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Planned Date</label>
                <input
                  data-testid="edit-planned-date"
                  type="date"
                  value={formData.planned_date || ''}
                  onChange={(e) => setFormData({...formData, planned_date: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Commitment Date</label>
                <input
                  data-testid="edit-commitment-date"
                  type="date"
                  value={formData.commitment_date || ''}
                  onChange={(e) => setFormData({...formData, commitment_date: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">EXE Sent</label>
                <input
                  data-testid="edit-exe-sent"
                  type="text"
                  value={formData.exe_sent || ''}
                  onChange={(e) => setFormData({...formData, exe_sent: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason for Issue</label>
                <input
                  data-testid="edit-reason"
                  type="text"
                  value={formData.reason_for_issue || ''}
                  onChange={(e) => setFormData({...formData, reason_for_issue: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Customer Call</label>
                <input
                  data-testid="edit-customer-call"
                  type="text"
                  value={formData.customer_call || ''}
                  onChange={(e) => setFormData({...formData, customer_call: e.target.value})}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                data-testid="edit-description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Remarks</label>
              <textarea
                data-testid="edit-remarks"
                value={formData.remarks || ''}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex gap-2">
              <button
                data-testid="save-ticket-button"
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
              >
                Save Changes
              </button>
              <button
                data-testid="cancel-edit-button"
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData(ticket);
                }}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="ticket-info-view">
            <div>
              <p className="text-sm text-gray-600">Ticket Number</p>
              <p className="font-semibold" data-testid="view-ticket-number">{ticket.ticket_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-semibold" data-testid="view-customer">{ticket.customer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Module</p>
              <p className="font-semibold" data-testid="view-module">{ticket.module}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CR Type</p>
              <p className="font-semibold" data-testid="view-cr-type">{ticket.cr_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Issue Type</p>
              <p className="font-semibold" data-testid="view-issue-type">{ticket.issue_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold" data-testid="view-type">{ticket.type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CR Date</p>
              <p className="font-semibold" data-testid="view-cr-date">{ticket.cr_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CR Time</p>
              <p className="font-semibold" data-testid="view-cr-time">{ticket.cr_time}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Priority</p>
              <p className="font-semibold" data-testid="view-priority">{ticket.priority}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Support Engineer</p>
              <p className="font-semibold" data-testid="view-se">{ticket.se_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Developer</p>
              <p className="font-semibold" data-testid="view-developer">{ticket.developer}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AMC Cost</p>
              <p className="font-semibold" data-testid="view-amc-cost">{ticket.amc_cost || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">PR Approval</p>
              <p className="font-semibold" data-testid="view-pr-approval">{ticket.pr_approval || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Planned Date</p>
              <p className="font-semibold" data-testid="view-planned-date">{ticket.planned_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Commitment Date</p>
              <p className="font-semibold" data-testid="view-commitment-date">{ticket.commitment_date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed On</p>
              <p className="font-semibold" data-testid="view-completed-on">{ticket.completed_on || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Completed By</p>
              <p className="font-semibold" data-testid="view-completed-by">{ticket.completed_by || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Time Duration</p>
              <p className="font-semibold" data-testid="view-time-duration">{ticket.time_duration || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">EXE Sent</p>
              <p className="font-semibold" data-testid="view-exe-sent">{ticket.exe_sent || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reason for Issue</p>
              <p className="font-semibold" data-testid="view-reason">{ticket.reason_for_issue || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Call</p>
              <p className="font-semibold" data-testid="view-customer-call">{ticket.customer_call || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-semibold" data-testid="view-description">{ticket.description}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Remarks</p>
              <p className="font-semibold" data-testid="view-remarks">{ticket.remarks || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Update */}
      {(user.role === 'Admin' || user.role === 'Developer' || user.role === 'Support Engineer') && (
        <div className="bg-white rounded-lg shadow p-6" data-testid="status-update-section">
          <h3 className="text-xl font-semibold mb-4">Update Status</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                data-testid="status-select"
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="New">New</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <button
              data-testid="update-status-button"
              onClick={handleStatusUpdate}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Update Status
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetails;
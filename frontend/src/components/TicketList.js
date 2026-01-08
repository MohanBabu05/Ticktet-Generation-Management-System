import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function TicketList({ user }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    module: '',
    customer: '',
    developer: '',
    se_name: '',
    cr_type: '',
    issue_type: '',
    from_date: '',
    to_date: ''
  });
  const [modules, setModules] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [supportEngineers, setSupportEngineers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
    fetchModules();
    fetchDevelopers();
    fetchSupportEngineers();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${API_URL}/api/tickets?${params.toString()}`);
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/modules`);
      setModules(response.data.modules);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchDevelopers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/developers`);
      setDevelopers(response.data.developers);
    } catch (error) {
      console.error('Error fetching developers:', error);
    }
  };

  const fetchSupportEngineers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/support-engineers`);
      setSupportEngineers(response.data.support_engineers);
    } catch (error) {
      console.error('Error fetching support engineers:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchTickets();
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      module: '',
      customer: '',
      developer: '',
      se_name: '',
      cr_type: '',
      issue_type: '',
      from_date: '',
      to_date: ''
    });
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

  return (
    <div className="space-y-6" data-testid="ticket-list-container">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800" data-testid="ticket-list-title">Tickets</h2>
        <button
          onClick={handleApplyFilters}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          data-testid="refresh-tickets-button"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6" data-testid="ticket-filters">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              data-testid="filter-status"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="New">New</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Closed">Closed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Module</label>
            <select
              data-testid="filter-module"
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {modules.map(module => (
                <option key={module} value={module}>{module}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Developer</label>
            <select
              data-testid="filter-developer"
              value={filters.developer}
              onChange={(e) => handleFilterChange('developer', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {developers.map(dev => (
                <option key={dev} value={dev}>{dev}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Support Engineer</label>
            <select
              data-testid="filter-se"
              value={filters.se_name}
              onChange={(e) => handleFilterChange('se_name', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              {supportEngineers.map(se => (
                <option key={se} value={se}>{se}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <input
              data-testid="filter-customer"
              type="text"
              value={filters.customer}
              onChange={(e) => handleFilterChange('customer', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search customer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CR Type</label>
            <select
              data-testid="filter-cr-type"
              value={filters.cr_type}
              onChange={(e) => handleFilterChange('cr_type', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="Customer CR">Customer CR</option>
              <option value="Internal CR">Internal CR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input
              data-testid="filter-from-date"
              type="date"
              value={filters.from_date}
              onChange={(e) => handleFilterChange('from_date', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input
              data-testid="filter-to-date"
              type="date"
              value={filters.to_date}
              onChange={(e) => handleFilterChange('to_date', e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            data-testid="apply-filters-button"
            onClick={handleApplyFilters}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Apply Filters
          </button>
          <button
            data-testid="clear-filters-button"
            onClick={handleClearFilters}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="tickets-table-container">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading tickets...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12" data-testid="no-tickets-message">
            <div className="text-xl text-gray-600">No tickets found</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CR Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <tr key={ticket.ticket_number} className="hover:bg-gray-50" data-testid={`ticket-row-${ticket.ticket_number}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {ticket.ticket_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.module}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.cr_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.issue_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusClass(ticket.status)} data-testid={`ticket-status-${ticket.ticket_number}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.developer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.cr_date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        data-testid={`view-ticket-${ticket.ticket_number}`}
                        onClick={() => navigate(`/tickets/${ticket.ticket_number}`)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600" data-testid="ticket-count">
        Total: {tickets.length} ticket(s)
      </div>
    </div>
  );
}

export default TicketList;
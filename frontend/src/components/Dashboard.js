import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-red-600">Failed to load dashboard</div>
      </div>
    );
  }

  // Prepare data for charts
  const statusData = Object.entries(stats.status_counts).map(([name, value]) => ({
    name,
    value
  }));

  const issueTypeData = Object.entries(stats.issue_type_counts).map(([name, value]) => ({
    name,
    value
  }));

  const crTypeData = Object.entries(stats.cr_type_counts).map(([name, value]) => ({
    name,
    value
  }));

  const modulePendingData = Object.entries(stats.module_pending)
    .filter(([_, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const developerPendingData = Object.entries(stats.developer_pending)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const sePendingData = Object.entries(stats.se_pending)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6" data-testid="dashboard-container">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800" data-testid="dashboard-title">Dashboard</h2>
        <button
          onClick={fetchDashboardStats}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          data-testid="refresh-dashboard-button"
        >
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-total-tickets">
          <div className="text-gray-600 text-sm font-semibold">Total Tickets</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.total_tickets}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-pending-tickets">
          <div className="text-gray-600 text-sm font-semibold">Pending</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">
            {(stats.status_counts['New'] || 0) + 
             (stats.status_counts['Assigned'] || 0) + 
             (stats.status_counts['In Progress'] || 0) +
             (stats.status_counts['Pending'] || 0)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-completed-tickets">
          <div className="text-gray-600 text-sm font-semibold">Completed</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats.status_counts['Completed'] || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6" data-testid="kpi-closed-tickets">
          <div className="text-gray-600 text-sm font-semibold">Closed</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">{stats.status_counts['Closed'] || 0}</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-status-distribution">
          <h3 className="text-xl font-semibold mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-issue-type">
          <h3 className="text-xl font-semibold mb-4">Issue Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={issueTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CR Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-cr-type">
          <h3 className="text-xl font-semibold mb-4">CR Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={crTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {crTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Module Wise Pending */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-module-pending">
          <h3 className="text-xl font-semibold mb-4">Module Wise Pending (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modulePendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Developer Wise Pending */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-developer-pending">
          <h3 className="text-xl font-semibold mb-4">Developer Wise Pending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={developerPendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Support Engineer Wise Pending */}
        <div className="bg-white rounded-lg shadow p-6" data-testid="chart-se-pending">
          <h3 className="text-xl font-semibold mb-4">Support Engineer Wise Pending</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sePendingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
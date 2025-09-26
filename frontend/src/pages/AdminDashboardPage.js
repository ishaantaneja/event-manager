import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllBookings } from '../store/slices/bookingSlice';
import { createEvent, updateEvent, deleteEvent } from '../store/slices/eventSlice';
import api from '../services/api';

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { allBookings } = useSelector((state) => state.bookings);
  
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    category: '',
    price: ''
  });

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    dispatch(fetchAllBookings());
  }, [dispatch]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/admin/analytics');
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createEvent(eventFormData)).unwrap();
      alert('Event created successfully!');
      setShowEventForm(false);
      setEventFormData({
        name: '',
        description: '',
        date: '',
        location: '',
        category: '',
        price: ''
      });
    } catch (error) {
      alert('Failed to create event: ' + error.message);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      alert('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  if (!analytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.totalUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.totalEvents}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-purple-600">{analytics.totalBookings}</p>
        </div>
      </div>

      {/* Bookings by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bookings by Status</h2>
          <div className="space-y-2">
            {analytics.bookingsByStatus.map((status) => (
              <div key={status._id} className="flex justify-between">
                <span className="capitalize">{status._id}:</span>
                <span className="font-bold">{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Events by Category</h2>
          <div className="space-y-2">
            {analytics.eventsByCategory.map((category) => (
              <div key={category._id} className="flex justify-between">
                <span>{category._id || 'Uncategorized'}:</span>
                <span className="font-bold">{category.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Event Button */}
      <div className="mb-8">
        <button
          onClick={() => setShowEventForm(!showEventForm)}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          {showEventForm ? 'Cancel' : 'Create New Event'}
        </button>
      </div>

      {/* Event Creation Form */}
      {showEventForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Event Name"
                value={eventFormData.name}
                onChange={(e) => setEventFormData({...eventFormData, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={eventFormData.category}
                onChange={(e) => setEventFormData({...eventFormData, category: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="datetime-local"
                value={eventFormData.date}
                onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                placeholder="Location"
                value={eventFormData.location}
                onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={eventFormData.price}
                onChange={(e) => setEventFormData({...eventFormData, price: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <textarea
              placeholder="Event Description"
              value={eventFormData.description}
              onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
              className="w-full p-2 border rounded"
              rows="4"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Create Event
            </button>
          </form>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Event</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentBookings.slice(0, 10).map((booking) => (
                <tr key={booking._id} className="border-b">
                  <td className="px-4 py-2">{booking.user?.name}</td>
                  <td className="px-4 py-2">{booking.event?.name}</td>
                  <td className="px-4 py-2">
                    {new Date(booking.bookedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-200 text-red-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b">
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-purple-200 text-purple-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllBookings } from '../store/slices/bookingSlice';
import { createEvent, updateEvent, deleteEvent } from '../store/slices/eventSlice';
import api from '../services/api';
import MessagingPanel from '../components/MessagingPanel';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const dispatch = useDispatch();
  const { allBookings } = useSelector((state) => state.bookings);
  
  const [analytics, setAnalytics] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [eventFormData, setEventFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    category: '',
    price: ''
  });

  // Cyberpunk color palette
  const CYBER_COLORS = ['#FF006E', '#FB5607', '#FFBE0B', '#8338EC', '#3A86FF', '#06FFB4'];
  const NEON_GRADIENT = {
    purple: { from: '#8B5CF6', to: '#EC4899' },
    cyan: { from: '#06B6D4', to: '#8B5CF6' },
    pink: { from: '#EC4899', to: '#F97316' },
    green: { from: '#10B981', to: '#06B6D4' }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchRealTimeStats, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAnalytics(),
        fetchRealTimeStats(),
        fetchUsers(),
        dispatch(fetchAllBookings())
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get(`/admin/analytics?dateRange=${dateRange}`);
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    }
  };

  const fetchRealTimeStats = async () => {
    try {
      const { data } = await api.get('/admin/real-time-stats');
      setRealTimeStats(data);
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createEvent(eventFormData)).unwrap();
      toast.success('Event created successfully!');
      setShowEventForm(false);
      setEventFormData({
        name: '',
        description: '',
        date: '',
        location: '',
        category: '',
        price: ''
      });
      fetchAnalytics();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully!');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const exportAnalytics = async (format) => {
    try {
      const response = await api.get(`/admin/export?format=${format}&dateRange=${dateRange}`, {
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      
      if (format === 'csv') {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics_${dateRange}.csv`);
        document.body.appendChild(link);
        link.click();
      }
      
      toast.success('Analytics exported successfully!');
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-purple-500/50 p-3 rounded-lg shadow-2xl">
          <p className="text-purple-300 font-semibold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-purple-300 font-bold">LOADING</span>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div className="container mx-auto px-4 py-8 text-purple-300">Failed to load analytics data.</div>;
  }

  // Prepare data for visual analytics
  const bookingDistribution = analytics.lists.topUsers.map(user => ({
    name: user.name.split(' ')[0],
    bookings: user.bookingCount,
    fill: CYBER_COLORS[Math.floor(Math.random() * CYBER_COLORS.length)]
  }));

  const categoryRadarData = analytics.charts.categoryPerformance.map(cat => ({
    category: cat._id || 'Other',
    bookings: cat.bookings,
    revenue: cat.revenue / 100 // Scale for better visualization
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Cyberpunk Header */}
        <div className="flex justify-between items-center mb-8 p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl backdrop-blur-sm border border-purple-500/30">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              ADMIN CONTROL CENTER
            </h1>
            <p className="text-purple-300 mt-2">System Status: <span className="text-green-400 animate-pulse">● ONLINE</span></p>
          </div>
          <div className="flex space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-800/50 border border-purple-500/50 rounded-lg text-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={() => exportAnalytics('csv')}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all shadow-lg shadow-green-500/30"
            >
              Export CSV
            </button>
            <button
              onClick={() => exportAnalytics('json')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/30"
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Real-time Stats Grid */}
        {realTimeStats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: "Today's Bookings", value: realTimeStats.todaysBookings, icon: '🎟️', color: 'from-purple-600 to-pink-600' },
              { label: "Today's Revenue", value: `$${realTimeStats.todaysRevenue}`, icon: '💰', color: 'from-green-600 to-cyan-600' },
              { label: "New Users", value: realTimeStats.todaysNewUsers, icon: '👤', color: 'from-blue-600 to-purple-600' },
              { label: "Messages", value: realTimeStats.todaysMessages, icon: '💬', color: 'from-pink-600 to-orange-600' },
              { label: "Active Events", value: realTimeStats.activeEvents, icon: '🎉', color: 'from-cyan-600 to-blue-600' },
              { label: "Online Now", value: realTimeStats.onlineUsers, icon: '🌐', color: 'from-orange-600 to-red-600' }
            ].map((stat, index) => (
              <div key={index} className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl blur-lg group-hover:blur-xl transition-all opacity-50`}></div>
                <div className="relative bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:border-purple-400/50 transition-all">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                    {stat.value}
                  </p>
                  <p className="text-xs text-purple-300 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 bg-gray-900/50 p-2 rounded-xl backdrop-blur-sm border border-purple-500/30">
          {['overview', 'analytics', 'users', 'events', 'messages'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                  : 'text-purple-300 hover:bg-purple-800/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Users', value: analytics.overview.totalUsers, change: `+${analytics.overview.newUsers}`, icon: '👥' },
                { label: 'Total Events', value: analytics.overview.totalEvents, change: `${analytics.overview.upcomingEvents} upcoming`, icon: '🎪' },
                { label: 'Total Bookings', value: analytics.overview.totalBookings, change: `+${analytics.overview.newBookings}`, icon: '🎫' },
                { label: 'Total Revenue', value: `$${analytics.overview.totalRevenue}`, change: `${analytics.overview.conversionRate}% CVR`, icon: '💎' }
              ].map((metric, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg group-hover:blur-xl transition-all opacity-30"></div>
                  <div className="relative bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 hover:border-purple-400/50 transition-all">
                    <div className="text-4xl mb-3">{metric.icon}</div>
                    <h3 className="text-sm text-purple-400 mb-2">{metric.label}</h3>
                    <p className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
                      {metric.value}
                    </p>
                    <p className="text-sm text-cyan-400 mt-2">{metric.change}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* User & Booking Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">User Growth Trajectory</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.charts.userGrowth}>
                    <defs>
                      <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4C1D95" opacity={0.3} />
                    <XAxis dataKey="_id" stroke="#A78BFA" />
                    <YAxis stroke="#A78BFA" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#8B5CF6" fillOpacity={1} fill="url(#userGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Booking Volume Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.charts.bookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4C1D95" opacity={0.3} />
                    <XAxis dataKey="_id" stroke="#A78BFA" />
                    <YAxis stroke="#A78BFA" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#EC4899" strokeWidth={3} dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Events & Top Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">🔥 Trending Events</h3>
                <div className="space-y-3">
                  {analytics.lists.popularEvents.map((event, index) => (
                    <div key={event._id} className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg hover:from-purple-900/50 hover:to-pink-900/50 transition-all">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold text-purple-400">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-purple-200">{event.name}</p>
                          <p className="text-xs text-purple-400">{event.location} • {format(new Date(event.date), 'MMM dd')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-cyan-400">{event.attendees?.length || 0}</p>
                        <p className="text-xs text-purple-400">attendees</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">👑 Power Users</h3>
                <div className="space-y-3">
                  {analytics.lists.topUsers.map((user, index) => (
                    <div key={user._id} className="flex justify-between items-center p-3 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 rounded-lg hover:from-cyan-900/50 hover:to-blue-900/50 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-purple-200">{user.name}</p>
                          <p className="text-xs text-purple-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-pink-400">{user.bookingCount}</p>
                        <p className="text-xs text-purple-400">bookings</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Visual Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Booking Distribution */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">User Booking Distribution</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={bookingDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="bookings"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {bookingDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CYBER_COLORS[index % CYBER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Performance Radar */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Category Performance Matrix</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={categoryRadarData}>
                    <PolarGrid stroke="#4C1D95" />
                    <PolarAngleAxis dataKey="category" stroke="#A78BFA" />
                    <PolarRadiusAxis stroke="#A78BFA" />
                    <Radar name="Bookings" dataKey="bookings" stroke="#EC4899" fill="#EC4899" fillOpacity={0.6} />
                    <Radar name="Revenue (×100)" dataKey="revenue" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Events by Category Donut */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Events by Category</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={analytics.charts.eventsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analytics.charts.eventsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CYBER_COLORS[index % CYBER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {analytics.charts.eventsByCategory.map((cat, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CYBER_COLORS[index % CYBER_COLORS.length] }}></div>
                      <span className="text-xs text-purple-300">{cat._id || 'Other'}: {cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Revenue Performance */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-purple-300 mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={analytics.charts.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#4C1D95" opacity={0.3} />
                    <XAxis dataKey="_id" stroke="#A78BFA" />
                    <YAxis yAxisId="left" stroke="#A78BFA" />
                    <YAxis yAxisId="right" orientation="right" stroke="#EC4899" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="bookings" fill="#8B5CF6" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#EC4899" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Location Heatmap */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-purple-300 mb-4">📍 Geographic Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {analytics.charts.eventsByLocation.map((location, index) => {
                  const intensity = (location.count / Math.max(...analytics.charts.eventsByLocation.map(l => l.count))) * 100;
                  return (
                    <div
                      key={location._id}
                      className="relative group"
                      style={{
                        background: `linear-gradient(135deg, rgba(139, 92, 246, ${intensity/100}) 0%, rgba(236, 72, 153, ${intensity/100}) 100%)`
                      }}
                    >
                      <div className="p-3 bg-gray-900/60 backdrop-blur-sm rounded-lg border border-purple-500/30 hover:border-purple-400/50 transition-all">
                        <p className="font-semibold text-purple-200 text-sm truncate">{location._id}</p>
                        <p className="text-2xl font-bold text-cyan-400">{location.count}</p>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${intensity}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-cyan-600 rounded-lg hover:from-green-700 hover:to-cyan-700 transition-all shadow-lg shadow-green-500/30 font-bold"
            >
              {showEventForm ? 'Cancel' : '+ Create New Event'}
            </button>

            {showEventForm && (
              <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-300 mb-6">Create New Event</h2>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Event Name"
                      value={eventFormData.name}
                      onChange={(e) => setEventFormData({...eventFormData, name: e.target.value})}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={eventFormData.category}
                      onChange={(e) => setEventFormData({...eventFormData, category: e.target.value})}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <input
                      type="datetime-local"
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({...eventFormData, location: e.target.value})}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={eventFormData.price}
                      onChange={(e) => setEventFormData({...eventFormData, price: e.target.value})}
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <textarea
                    placeholder="Event Description"
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})}
                    className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="4"
                    required
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/30 font-bold"
                  >
                    Create Event
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-purple-300 mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-purple-500/30">
                    <th className="px-4 py-3 text-left text-purple-300">Name</th>
                    <th className="px-4 py-3 text-left text-purple-300">Email</th>
                    <th className="px-4 py-3 text-left text-purple-300">Role</th>
                    <th className="px-4 py-3 text-left text-purple-300">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b border-purple-500/20 hover:bg-purple-900/20">
                      <td className="px-4 py-3 text-purple-200">{user.name}</td>
                      <td className="px-4 py-3 text-purple-200">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                          className="bg-gray-800/50 border border-purple-500/30 rounded px-2 py-1 text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-purple-200">
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <h2 className="text-2xl font-bold text-purple-300 mb-6">Support Messages</h2>
            <MessagingPanel isAdmin={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

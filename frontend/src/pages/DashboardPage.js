import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBookings, cancelBooking } from '../store/slices/bookingSlice';
import { Link } from 'react-router-dom';
import api from '../services/api';
import MessagingPanel from '../components/MessagingPanel';
import NotificationPanel from '../components/NotificationPanel';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { userBookings, loading } = useSelector((state) => state.bookings);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [preferences, setPreferences] = useState({
    categories: [],
    locations: []
  });
  const [bookmarks, setBookmarks] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    bookingConfirmations: true,
    eventReminders: true,
    eventUpdates: true,
    promotions: false,
    newsletter: false
  });

  useEffect(() => {
    dispatch(fetchUserBookings());
    fetchUserData();
  }, [dispatch]);

  const fetchUserData = async () => {
    try {
      // Fetch user profile with preferences
      const { data: profile } = await api.get('/auth/profile');
      setPreferences(profile.preferences || { categories: [], locations: [] });
      setNotificationPreferences(profile.notificationPreferences || notificationPreferences);
      
      // Fetch bookmarked events
      const { data: bookmarkedEvents } = await api.get('/users/bookmarks');
      setBookmarks(bookmarkedEvents);
      
      // Fetch saved events
      const { data: savedEventsData } = await api.get('/saved-events');
      setSavedEvents(savedEventsData.savedEvents);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await dispatch(cancelBooking(bookingId));
        dispatch(fetchUserBookings());
        toast.success('Booking cancelled successfully');
      } catch (error) {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await api.put('/users/preferences', { preferences });
      toast.success('Preferences updated successfully!');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
  };

  const handleUpdateNotificationPreferences = async () => {
    try {
      await api.put('/notifications/preferences', { preferences: notificationPreferences });
      toast.success('Notification preferences updated!');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    }
  };

  const removeBookmark = async (eventId) => {
    try {
      await api.delete(`/users/bookmarks/${eventId}`);
      setBookmarks(bookmarks.filter(b => b._id !== eventId));
      toast.success('Bookmark removed');
    } catch (error) {
      toast.error('Failed to remove bookmark');
    }
  };

  const removeSavedEvent = async (eventId) => {
    try {
      await api.delete(`/saved-events/${eventId}`);
      setSavedEvents(savedEvents.filter(s => s.event._id !== eventId));
      toast.success('Event removed from saved list');
    } catch (error) {
      toast.error('Failed to remove saved event');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-purple-300 text-xs font-bold">LOADING</span>
          </div>
        </div>
      </div>
    );
  }

  const tabIcons = {
    bookings: '🎟️',
    saved: '📌',
    bookmarks: '🔖',
    messages: '💬',
    notifications: '🔔',
    preferences: '⚙️'
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-2xl backdrop-blur-sm border border-purple-500/30">
        <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text">
          MY DASHBOARD
        </h1>
        <Link
          to="/external-events"
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 text-white font-semibold transition-all shadow-lg shadow-cyan-500/30"
        >
          🌍 Discover Global Events
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Info Card */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg group-hover:blur-xl opacity-30"></div>
            <div className="relative bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <div className="text-center mb-4">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-purple-500/50">
                  {userInfo?.name.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-purple-200">{userInfo?.name}</h2>
                <p className="text-purple-400 text-sm">{userInfo?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-white text-xs font-semibold">
                  {userInfo?.role?.toUpperCase()}
                </span>
              </div>
              
              <div className="border-t border-purple-500/30 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">Total Bookings</span>
                  <span className="font-bold text-cyan-400">{userBookings.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">Saved Events</span>
                  <span className="font-bold text-pink-400">{savedEvents.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-400">Bookmarks</span>
                  <span className="font-bold text-yellow-400">{bookmarks.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-2">
            {Object.entries(tabIcons).map(([tab, icon]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition-all duration-300 ${
                  activeTab === tab 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                    : 'hover:bg-purple-800/20 text-purple-300'
                }`}
              >
                <span className="mr-3 text-lg">{icon}</span>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'bookings' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">My Bookings</h2>
              {userBookings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎫</div>
                  <p className="text-purple-400 mb-4">No bookings yet</p>
                  <Link
                    to="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div key={booking._id} className="border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-purple-200 mb-2">{booking.event?.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-400">
                            <p>📅 {format(new Date(booking.event?.date), 'EEEE, MMMM dd, yyyy')}</p>
                            <p>📍 {booking.event?.location}</p>
                            <p>💰 ${booking.event?.price}</p>
                            <p>🏷️ {booking.event?.category}</p>
                          </div>
                          <div className="mt-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
                              booking.status === 'cancelled' ? 'bg-red-900/50 text-red-400 border border-red-500/30' :
                              'bg-yellow-900/50 text-yellow-400 border border-yellow-500/30'
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                            <span className="ml-2 text-xs text-purple-500">
                              Booked on {format(new Date(booking.bookedAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Link
                            to={`/event/${booking.event?._id}`}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-semibold text-center transition-all"
                          >
                            View Event
                          </Link>
                          {booking.status !== 'cancelled' && (
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg hover:from-red-700 hover:to-pink-700 text-white text-sm font-semibold transition-all"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">Saved Events</h2>
              {savedEvents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📌</div>
                  <p className="text-purple-400 mb-4">No saved events yet</p>
                  <Link
                    to="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedEvents.map((saved) => (
                    <div key={saved._id} className="border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/20 transition-all">
                      <h3 className="font-semibold text-purple-200 mb-2">{saved.event.name}</h3>
                      <div className="text-sm text-purple-400 space-y-1">
                        <p>📅 {format(new Date(saved.event.date), 'MMM dd, yyyy')}</p>
                        <p>📍 {saved.event.location}</p>
                        {saved.notes && (
                          <p className="italic text-purple-300">📝 "{saved.notes}"</p>
                        )}
                        {saved.reminder?.enabled && (
                          <p className="text-cyan-400">
                            ⏰ Reminder: {format(new Date(saved.reminder.date), 'MMM dd, hh:mm a')}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Link
                          to={`/event/${saved.event._id}`}
                          className="flex-1 text-center py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white text-sm font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => removeSavedEvent(saved.event._id)}
                          className="flex-1 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-white text-sm font-semibold hover:from-red-700 hover:to-pink-700 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-purple-300 mb-6">Bookmarked Events</h2>
              {bookmarks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔖</div>
                  <p className="text-purple-400 mb-4">No bookmarked events</p>
                  <Link
                    to="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
                  >
                    Browse Events
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookmarks.map((event) => (
                    <div key={event._id} className="border border-purple-500/30 rounded-lg p-4 hover:bg-purple-900/20 transition-all">
                      <h3 className="font-semibold text-purple-200 mb-2">{event.name}</h3>
                      <div className="text-sm text-purple-400 space-y-1">
                        <p>📅 {format(new Date(event.date), 'MMM dd, yyyy')}</p>
                        <p>📍 {event.location}</p>
                        <p>💰 ${event.price}</p>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <Link
                          to={`/event/${event._id}`}
                          className="flex-1 text-center py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white text-sm font-semibold hover:from-cyan-700 hover:to-blue-700 transition-all"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => removeBookmark(event._id)}
                          className="flex-1 py-2 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg text-white text-sm font-semibold hover:from-red-700 hover:to-pink-700 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <MessagingPanel isAdmin={false} />
          )}

          {activeTab === 'notifications' && (
            <NotificationPanel />
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              {/* Event Preferences */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-300 mb-6">Event Preferences</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">Preferred Categories</label>
                    <input
                      type="text"
                      value={preferences.categories.join(', ')}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        categories: e.target.value.split(',').map(c => c.trim())
                      })}
                      placeholder="Music, Sports, Technology"
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-purple-500 mt-1">Separate with commas</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-purple-400 mb-2">Preferred Locations</label>
                    <input
                      type="text"
                      value={preferences.locations.join(', ')}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        locations: e.target.value.split(',').map(l => l.trim())
                      })}
                      placeholder="New York, Los Angeles, Chicago"
                      className="w-full p-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="text-xs text-purple-500 mt-1">Separate with commas</p>
                  </div>
                  
                  <button
                    onClick={handleUpdatePreferences}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all shadow-lg shadow-purple-500/30"
                  >
                    Save Event Preferences
                  </button>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-purple-300 mb-6">Notification Preferences</h2>
                <div className="space-y-3">
                  {Object.entries(notificationPreferences).map(([key, value]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-all cursor-pointer">
                      <span className="text-purple-300">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationPreferences({
                            ...notificationPreferences,
                            [key]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-600"></div>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleUpdateNotificationPreferences}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-700 hover:to-blue-700 text-white font-semibold transition-all shadow-lg shadow-cyan-500/30"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

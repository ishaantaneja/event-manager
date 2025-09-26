import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBookings, cancelBooking } from '../store/slices/bookingSlice';
import { Link } from 'react-router-dom';
import api from '../services/api';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { userBookings, loading } = useSelector((state) => state.bookings);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [preferences, setPreferences] = useState({
    categories: [],
    locations: []
  });
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    dispatch(fetchUserBookings());
    fetchUserData();
  }, [dispatch]);

  const fetchUserData = async () => {
    try {
      const { data: profile } = await api.get('/auth/profile');
      setPreferences(profile.preferences || { categories: [], locations: [] });
      
      const { data: bookmarkedEvents } = await api.get('/users/bookmarks');
      setBookmarks(bookmarkedEvents);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await dispatch(cancelBooking(bookingId));
      dispatch(fetchUserBookings());
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      await api.put('/users/preferences', { preferences });
      alert('Preferences updated successfully!');
    } catch (error) {
      alert('Failed to update preferences');
    }
  };

  const removeBookmark = async (eventId) => {
    try {
      await api.delete(`/users/bookmarks/${eventId}`);
      setBookmarks(bookmarks.filter(b => b._id !== eventId));
    } catch (error) {
      alert('Failed to remove bookmark');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Name:</span> {userInfo?.name}
            </p>
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">Email:</span> {userInfo?.email}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Role:</span> {userInfo?.role}
            </p>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Preferred Categories</label>
              <input
                type="text"
                value={preferences.categories.join(', ')}
                onChange={(e) => setPreferences({
                  ...preferences,
                  categories: e.target.value.split(',').map(c => c.trim())
                })}
                placeholder="Music, Sports, Tech"
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Preferred Locations</label>
              <input
                type="text"
                value={preferences.locations.join(', ')}
                onChange={(e) => setPreferences({
                  ...preferences,
                  locations: e.target.value.split(',').map(l => l.trim())
                })}
                placeholder="New York, Los Angeles"
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={handleUpdatePreferences}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update Preferences
            </button>
          </div>
        </div>

        {/* Bookings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">My Bookings</h2>
            {userBookings.length === 0 ? (
              <p className="text-gray-500">No bookings yet.</p>
            ) : (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking._id} className="border rounded p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{booking.event?.name}</h3>
                        <p className="text-gray-600">
                          Date: {new Date(booking.event?.date).toLocaleDateString()}
                        </p>
                        <p className="text-gray-600">
                          Location: {booking.event?.location}
                        </p>
                        <p className="text-gray-600">
                          Status: <span className={`font-semibold ${
                            booking.status === 'confirmed' ? 'text-green-600' :
                            booking.status === 'cancelled' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {booking.status}
                          </span>
                        </p>
                        <p className="text-gray-500 text-sm">
                          Booked on: {new Date(booking.bookedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <Link
                          to={`/event/${booking.event?._id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          View Event
                        </Link>
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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

          {/* Bookmarked Events */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Bookmarked Events</h2>
            {bookmarks.length === 0 ? (
              <p className="text-gray-500">No bookmarked events.</p>
            ) : (
              <div className="space-y-3">
                {bookmarks.map((event) => (
                  <div key={event._id} className="border rounded p-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(event.date).toLocaleDateString()} - {event.location}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/event/${event._id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => removeBookmark(event._id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

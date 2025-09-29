import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, addComment } from '../store/slices/eventSlice';
import { createBooking } from '../store/slices/bookingSlice';
import EventComments from '../components/EventComments';
import SocialShare from '../components/SocialShare';
import api from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentEvent, loading } = useSelector((state) => state.events);
  const { userInfo } = useSelector((state) => state.auth);
  const { loading: bookingLoading } = useSelector((state) => state.bookings);
  
  const [commentText, setCommentText] = useState('');
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [savedNotes, setSavedNotes] = useState('');

  useEffect(() => {
    dispatch(fetchEventById(id));
    if (userInfo) {
      checkIfEventSaved();
    }
  }, [dispatch, id, userInfo]);

  const checkIfEventSaved = async () => {
    try {
      const { data } = await api.get(`/saved-events/check/${id}`);
      setIsSaved(data.isSaved);
      if (data.savedEvent) {
        setSavedNotes(data.savedEvent.notes || '');
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleBooking = async () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(createBooking(id)).unwrap();
      setShowBookingSuccess(true);
      toast.success('Event booked successfully!', { icon: '🎉' });
      setTimeout(() => setShowBookingSuccess(false), 3000);
      
      // Refresh event to update attendees count
      dispatch(fetchEventById(id));
    } catch (error) {
      toast.error('Failed to book event: ' + error.message);
    }
  };

  const handleSaveEvent = async () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    if (isSaved) {
      // Remove from saved
      try {
        await api.delete(`/saved-events/${id}`);
        setIsSaved(false);
        toast.success('Event removed from saved list');
      } catch (error) {
        toast.error('Failed to remove event');
      }
    } else {
      // Add to saved
      setShowReminderModal(true);
    }
  };

  const confirmSaveEvent = async () => {
    try {
      const saveData = {
        eventId: id,
        notes: savedNotes
      };

      if (reminderDate) {
        saveData.reminder = {
          enabled: true,
          date: reminderDate
        };
      }

      await api.post('/saved-events', saveData);
      setIsSaved(true);
      setShowReminderModal(false);
      toast.success('Event saved successfully!', { icon: '📌' });
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleAddComment = () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    if (commentText.trim()) {
      dispatch(addComment({ eventId: id, content: commentText }));
      setCommentText('');
      toast.success('Comment added!');
    }
  };

  const handleAddToBookmark = async () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      await api.post(`/users/bookmarks/${id}`);
      toast.success('Event bookmarked!', { icon: '🔖' });
    } catch (error) {
      if (error.response?.status === 400) {
        toast('Event already bookmarked', { icon: 'ℹ️' });
      } else {
        toast.error('Failed to bookmark event');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Event not found.</p>
      </div>
    );
  }

  const isUserAttending = currentEvent.attendees?.some(
    attendee => attendee._id === userInfo?._id
  );

  const eventDate = new Date(currentEvent.date);
  const isPastEvent = eventDate < new Date();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {showBookingSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Successfully booked! Check your dashboard for details.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg">
          {/* Event Header */}
          <div className="relative h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg">
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-t-lg"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{currentEvent.name}</h1>
              <div className="flex items-center space-x-4">
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  {currentEvent.category}
                </span>
                {isPastEvent && (
                  <span className="bg-red-500 px-3 py-1 rounded-full text-sm">
                    Past Event
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-3">📅</span>
                  <div>
                    <p className="font-semibold">Date & Time</p>
                    <p>{format(eventDate, 'EEEE, MMMM dd, yyyy')}</p>
                    <p className="text-sm text-gray-500">{format(eventDate, 'hh:mm a')}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-3">📍</span>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p>{currentEvent.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-3">👤</span>
                  <div>
                    <p className="font-semibold">Organizer</p>
                    <p>{currentEvent.organizer?.name}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-3">💰</span>
                  <div>
                    <p className="font-semibold">Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {currentEvent.price === 0 ? 'FREE' : `$${currentEvent.price}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <span className="text-2xl mr-3">👥</span>
                  <div>
                    <p className="font-semibold">Attendees</p>
                    <p>{currentEvent.attendees?.length || 0} people attending</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">About This Event</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              {!isPastEvent && (
                <>
                  {isUserAttending ? (
                    <button
                      disabled
                      className="bg-gray-400 text-white px-6 py-3 rounded-lg cursor-not-allowed"
                    >
                      ✓ Already Booked
                    </button>
                  ) : (
                    <button
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {bookingLoading ? 'Booking...' : 'Book Now'}
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={handleSaveEvent}
                className={`${
                  isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'
                } text-white px-6 py-3 rounded-lg`}
              >
                {isSaved ? '✓ Saved' : '📌 Save for Later'}
              </button>
              
              <button
                onClick={handleAddToBookmark}
                className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
              >
                🔖 Bookmark
              </button>
              
              <div className="ml-auto">
                <SocialShare event={currentEvent} />
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold mb-4">Comments & Discussion</h2>
              
              {userInfo && (
                <div className="mb-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts about this event..."
                    className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Post Comment
                  </button>
                </div>
              )}

              <EventComments comments={currentEvent.comments || []} />
            </div>
          </div>
        </div>
      </div>

      {/* Save Event Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Save Event for Later</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Add Notes (optional)
              </label>
              <textarea
                value={savedNotes}
                onChange={(e) => setSavedNotes(e.target.value)}
                placeholder="Why are you interested in this event?"
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                Set Reminder (optional)
              </label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                max={currentEvent.date}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmSaveEvent}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save Event
              </button>
              <button
                onClick={() => setShowReminderModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;

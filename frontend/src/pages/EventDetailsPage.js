import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventById, addComment } from '../store/slices/eventSlice';
import { createBooking } from '../store/slices/bookingSlice';
import EventComments from '../components/EventComments';
import SocialShare from '../components/SocialShare';

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentEvent, loading } = useSelector((state) => state.events);
  const { userInfo } = useSelector((state) => state.auth);
  const { loading: bookingLoading } = useSelector((state) => state.bookings);
  
  const [commentText, setCommentText] = useState('');
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  useEffect(() => {
    dispatch(fetchEventById(id));
  }, [dispatch, id]);

  const handleBooking = async () => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(createBooking(id)).unwrap();
      setShowBookingSuccess(true);
      setTimeout(() => setShowBookingSuccess(false), 3000);
    } catch (error) {
      alert('Failed to book event: ' + error.message);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {showBookingSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Successfully booked! Check your dashboard for details.
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-4">{currentEvent.name}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Date:</span> {new Date(currentEvent.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Location:</span> {currentEvent.location}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Category:</span> {currentEvent.category}
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Price:</span> ${currentEvent.price}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Organizer:</span> {currentEvent.organizer?.name}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Attendees:</span> {currentEvent.attendees?.length || 0}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{currentEvent.description}</p>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {isUserAttending ? (
              <button
                disabled
                className="bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed"
              >
                Already Booked
              </button>
            ) : (
              <button
                onClick={handleBooking}
                disabled={bookingLoading}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {bookingLoading ? 'Booking...' : 'Book Now'}
              </button>
            )}
            
            <SocialShare event={currentEvent} />
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Comments</h2>
            
            {userInfo && (
              <div className="mb-4">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-2 border rounded"
                  rows="3"
                />
                <button
                  onClick={handleAddComment}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
  );
};

export default EventDetailsPage;

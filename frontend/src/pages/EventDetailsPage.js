import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toggleBookmark } from "../store/slices/eventSlice";
import EventComments from "../components/EventComments";

export default function EventDetailsPage() {
  const { id: eventId } = useParams(); // grabs event ID from URL
  const dispatch = useDispatch();
  const { bookmarks } = useSelector((state) => state.events);
  const { token } = useSelector((state) => state.auth);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvent = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/events/${eventId}`);
      setEvent(res.data.data); // backend returns { data: {...} }
    } catch (err) {
      console.error(err);
      setError("Failed to load event details.");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleBooking = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/bookings`,
        { eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Booking successful!");
    } catch (err) {
      console.error(err);
      alert("Booking failed!");
    }
  };

  const handleBookmark = () => {
    dispatch(toggleBookmark(eventId));
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Event link copied to clipboard!");
  };

  if (loading) return <p className="text-center mt-10">Loading event...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!event) return <p className="text-center mt-10">Event not found.</p>;

  const isBookmarked = bookmarks.includes(eventId);

  return (
    <div className="p-6 max-w-3xl mx-auto border rounded shadow">
      <h1 className="text-2xl font-bold">{event.title || event.name}</h1>
      <p className="text-gray-600">{event.category}</p>
      <p className="text-gray-500">{new Date(event.date).toLocaleString()}</p>
      <p className="mt-4">{event.description}</p>

      {token && (
        <button
          onClick={handleBooking}
          className="mt-4 mr-4 bg-green-500 text-white p-2 rounded hover:bg-green-600"
        >
          Book Event
        </button>
      )}

      <button
        onClick={handleBookmark}
        className={`mt-4 mr-4 px-4 py-2 rounded ${
          isBookmarked ? "bg-yellow-500" : "bg-gray-300"
        }`}
      >
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </button>

      <button
        onClick={handleShare}
        className="mt-4 px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
      >
        Share
      </button>

      <EventComments eventId={eventId} />
    </div>
  );
}

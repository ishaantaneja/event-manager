import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents, toggleBookmark } from "../store/slices/eventSlice.js";
import { Link } from "react-router-dom";
import EventFilter from "../components/EventFilter.js";

export default function EventListPage() {
  const dispatch = useDispatch();
  // FIXED: Changed from 'list' to 'events'
  const { events, loading, error, bookmarks } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents());
    const interval = setInterval(() => dispatch(fetchEvents()), 10000); // every 10s
    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading) return <p className="text-center mt-10">Loading events...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Event Management System</h1>
      <EventFilter />
      
      {/* Show message if no events */}
      {events.length === 0 && !loading ? (
        <div className="text-center mt-10">
          <p className="text-gray-500">No events available</p>
          <p className="text-sm text-gray-400">Backend API might not be connected</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} className="border rounded p-4 shadow hover:shadow-lg relative">
              <h2 className="font-bold text-lg">{event.name || event.title}</h2>
              <p className="text-gray-600">{event.category}</p>
              <p className="text-gray-500">{event.date}</p>
              <button
                onClick={() => dispatch(toggleBookmark(event._id))}
                className={`absolute top-2 right-2 ${
                  bookmarks.includes(event._id) ? "text-yellow-500" : "text-gray-400"
                }`}
              >
                ★
              </button>
              <Link
                to={`/event/${event._id}`}
                className="mt-2 inline-block bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
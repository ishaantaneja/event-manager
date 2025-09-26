import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
      <p className="text-gray-600 mb-2">{event.description?.substring(0, 100)}...</p>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">📍 {event.location}</span>
        <span className="text-sm text-gray-500">📅 {new Date(event.date).toLocaleDateString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-blue-600">${event.price}</span>
        <Link
          to={`/event/${event._id}`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {event.category && (
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
            {event.category}
          </span>
        )}
        <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs">
          {event.attendees?.length || 0} attendees
        </span>
      </div>
    </div>
  );
};

export default EventCard;

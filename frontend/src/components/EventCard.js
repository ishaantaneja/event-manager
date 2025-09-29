import React from 'react';
import { Link } from 'react-router-dom';

const EventCard = ({ event }) => {
  const getCategoryColor = (category) => {
    const colors = {
      'Music': 'from-purple-600 to-pink-600',
      'Sports': 'from-green-600 to-cyan-600',
      'Technology': 'from-blue-600 to-purple-600',
      'Art': 'from-pink-600 to-orange-600',
      'Food': 'from-orange-600 to-red-600',
      'Business': 'from-cyan-600 to-blue-600',
      'Education': 'from-indigo-600 to-purple-600',
      'Health': 'from-green-600 to-teal-600'
    };
    return colors[event.category] || 'from-gray-600 to-gray-700';
  };

  return (
    <div className="group relative">
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-lg group-hover:blur-xl opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
      
      {/* Card content */}
      <div className="relative bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-400/50 transition-all duration-300">
        {/* Category banner */}
        <div className={`h-2 bg-gradient-to-r ${getCategoryColor(event.category)}`}></div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              {event.name}
            </h3>
            {event.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getCategoryColor(event.category)} text-white shadow-lg`}>
                {event.category}
              </span>
            )}
          </div>
          
          <p className="text-purple-300 mb-4 line-clamp-2 text-sm opacity-80">
            {event.description?.substring(0, 100)}...
          </p>
          
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center text-purple-400">
              <span className="text-cyan-400 mr-2">📍</span>
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center text-purple-400">
              <span className="text-cyan-400 mr-2">📅</span>
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center text-purple-400">
                <span className="text-cyan-400 mr-2">👥</span>
                <span>{event.attendees?.length || 0} attending</span>
              </div>
              <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text">
                {event.price === 0 ? 'FREE' : `$${event.price}`}
              </div>
            </div>
          </div>
          
          <Link
            to={`/event/${event._id}`}
            className="block w-full text-center py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;

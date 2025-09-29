import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, fetchRecommendedEvents } from '../store/slices/eventSlice';
import EventCard from '../components/EventCard';
import EventFilter from '../components/EventFilter';

const EventListPage = () => {
  const dispatch = useDispatch();
  const { events, recommendedEvents, loading, totalPages, currentPage } = useSelector((state) => state.events);
  const { userInfo } = useSelector((state) => state.auth);
  
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    search: ''
  });

  useEffect(() => {
    dispatch(fetchEvents({ ...filters, page: currentPage }));
    if (userInfo) {
      dispatch(fetchRecommendedEvents());
    }
  }, [dispatch, filters, currentPage, userInfo]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page) => {
    dispatch(fetchEvents({ ...filters, page }));
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-cyan-600/10 blur-3xl"></div>
        <h1 className="relative text-5xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text mb-4">
          DISCOVER EVENTS
        </h1>
        <p className="relative text-purple-300 text-lg">Find your next adventure in the digital realm</p>
      </div>
      
      {/* Filters */}
      <EventFilter onFilterChange={handleFilterChange} />
      
      {/* Recommended Events */}
      {userInfo && recommendedEvents.length > 0 && (
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl"></div>
          <div className="relative bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text mb-6 flex items-center">
              <span className="text-3xl mr-3 animate-pulse">⚡</span>
              Recommended For You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedEvents.slice(0, 3).map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Events */}
      <div>
        <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-6 flex items-center">
          <span className="text-3xl mr-3">🌐</span>
          All Events
        </h2>
        
        {events.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 backdrop-blur-sm border border-purple-500/30 rounded-2xl">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-purple-300 text-xl mb-2">No events found</p>
            <p className="text-purple-400 opacity-75">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 py-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                page === currentPage
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800/50 text-purple-400 hover:bg-gray-700/50 border border-purple-500/30'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventListPage;

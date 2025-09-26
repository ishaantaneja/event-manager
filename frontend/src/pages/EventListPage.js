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
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upcoming Events</h1>
      
      <EventFilter onFilterChange={handleFilterChange} />
      
      {userInfo && recommendedEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Recommended For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {recommendedEvents.slice(0, 3).map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found. Try adjusting your filters.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
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

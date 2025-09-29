import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EventCard from '../components/EventCard';
import toast from 'react-hot-toast';

const ExternalEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    interests: [],
    locations: [],
    priceRange: { min: 0, max: 10000 }
  });
  
  const [filters, setFilters] = useState({
    query: '',
    location: 'all',
    category: 'all',
    dateFrom: '',
    dateTo: '',
    priceMin: 0,
    priceMax: 10000,
    page: 1
  });

  useEffect(() => {
    fetchInitialData();
    
    // Check if user has set preferences
    const savedPreferences = localStorage.getItem('eventPreferences');
    if (savedPreferences) {
      setUserPreferences(JSON.parse(savedPreferences));
      setShowOnboarding(false);
    }
  }, []);

  const fetchInitialData = async () => {
    try {
      await Promise.all([
        fetchTrendingEvents(),
        fetchLocations(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchTrendingEvents = async () => {
    try {
      const { data } = await api.get('/external-events/trending');
      setTrendingEvents(data.events);
    } catch (error) {
      console.error('Error fetching trending events:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/external-events/locations');
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/external-events/categories');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const searchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const { data } = await api.get(`/external-events/search?${params}`);
      setEvents(data.events);
      
      if (data.events.length === 0) {
        toast('No events found. Try adjusting your filters.', { icon: '🔍' });
      }
    } catch (error) {
      console.error('Error searching events:', error);
      toast.error('Failed to search events');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('eventPreferences', JSON.stringify(userPreferences));
    setShowOnboarding(false);
    
    // Apply preferences to filters
    if (userPreferences.locations.length > 0) {
      setFilters(prev => ({ ...prev, location: userPreferences.locations[0] }));
    }
    if (userPreferences.interests.length > 0) {
      setFilters(prev => ({ ...prev, category: userPreferences.interests[0] }));
    }
    setFilters(prev => ({
      ...prev,
      priceMin: userPreferences.priceRange.min,
      priceMax: userPreferences.priceRange.max
    }));
    
    toast.success('Preferences saved! Now searching for events...');
    searchEvents();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchEvents();
  };

  const importEvent = async (event) => {
    try {
      await api.post('/external-events/import', { externalEvent: event });
      toast.success('Event imported successfully!');
    } catch (error) {
      toast.error('Failed to import event');
    }
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-6">Welcome to Global Events! 🌍</h2>
          <p className="text-gray-600 text-center mb-8">
            Tell us about your interests so we can find the perfect events for you from around the world.
          </p>
          
          <form onSubmit={handlePreferencesSubmit}>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">What kind of events interest you?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <label key={cat.name} className="flex items-center">
                    <input
                      type="checkbox"
                      value={cat.name}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUserPreferences(prev => ({
                            ...prev,
                            interests: [...prev.interests, e.target.value]
                          }));
                        } else {
                          setUserPreferences(prev => ({
                            ...prev,
                            interests: prev.interests.filter(i => i !== e.target.value)
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span>{cat.icon} {cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Where would you like to attend events?</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {locations.slice(0, 9).map((loc) => (
                  <label key={loc.city} className="flex items-center">
                    <input
                      type="checkbox"
                      value={loc.city}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setUserPreferences(prev => ({
                            ...prev,
                            locations: [...prev.locations, e.target.value]
                          }));
                        } else {
                          setUserPreferences(prev => ({
                            ...prev,
                            locations: prev.locations.filter(l => l !== e.target.value)
                          }));
                        }
                      }}
                      className="mr-2"
                    />
                    <span>{loc.city}, {loc.country}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">What's your budget range?</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Price</label>
                  <input
                    type="number"
                    value={userPreferences.priceRange.min}
                    onChange={(e) => setUserPreferences(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Price</label>
                  <input
                    type="number"
                    value={userPreferences.priceRange.max}
                    onChange={(e) => setUserPreferences(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: parseInt(e.target.value) }
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Start Exploring Events
              </button>
              <button
                type="button"
                onClick={() => setShowOnboarding(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Skip for Now
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Discover Events Worldwide 🌍</h1>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <form onSubmit={handleSearch}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              name="query"
              value={filters.query}
              onChange={handleFilterChange}
              placeholder="Search events..."
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              name="location"
              value={filters.location}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc.city} value={loc.city}>
                  {loc.city}, {loc.country} ({loc.eventCount} events)
                </option>
              ))}
            </select>
            
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name} ({cat.count})
                </option>
              ))}
            </select>
            
            <div className="flex space-x-2">
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="From"
              />
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded"
                placeholder="To"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex space-x-2">
              <input
                type="number"
                name="priceMin"
                value={filters.priceMin}
                onChange={handleFilterChange}
                placeholder="Min Price"
                className="w-full p-2 border rounded"
              />
              <input
                type="number"
                name="priceMax"
                value={filters.priceMax}
                onChange={handleFilterChange}
                placeholder="Max Price"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Events'}
            </button>
            
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              Update Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Trending Events */}
      {trendingEvents.length > 0 && events.length === 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">🔥 Trending Worldwide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold flex-1">{event.name}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {event.source}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>📍 {event.location}</p>
                  <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                  <p>💰 ${event.price}</p>
                  <p>🏷️ {event.category}</p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={event.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
                  >
                    View on {event.source}
                  </a>
                  <button
                    onClick={() => importEvent(event)}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Import to Local
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {events.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Found {events.length} Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold flex-1">{event.name}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {event.source}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <p>📍 {event.location}</p>
                  <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                  <p>💰 ${event.price}</p>
                  <p>🏷️ {event.category}</p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={event.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded hover:bg-blue-700"
                  >
                    View on {event.source}
                  </a>
                  <button
                    onClick={() => importEvent(event)}
                    className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  >
                    Import to Local
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Stats */}
      <div className="mt-12 bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">🗺️ Popular Event Locations</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {locations.slice(0, 10).map((loc) => (
            <button
              key={loc.city}
              onClick={() => {
                setFilters(prev => ({ ...prev, location: loc.city }));
                searchEvents();
              }}
              className="p-3 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <p className="font-semibold">{loc.city}</p>
              <p className="text-sm text-gray-600">{loc.country}</p>
              <p className="text-xs text-blue-600">{loc.eventCount} events</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExternalEventsPage;

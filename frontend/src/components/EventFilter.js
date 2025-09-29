import React, { useState } from 'react';

const EventFilter = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    category: '',
    location: '',
    search: ''
  });

  const categories = [
    'Music', 'Sports', 'Technology', 'Art', 'Food', 
    'Business', 'Education', 'Health', 'Entertainment', 'Other'
  ];

  const handleChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value
    };
    setFilters(newFilters);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      location: '',
      search: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="relative">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-lg"></div>
      <div className="relative bg-gray-900/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-purple-400 text-sm font-semibold flex items-center">
                <span className="mr-2">🔍</span>
                Search
              </label>
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleChange}
                placeholder="Search events..."
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-purple-400 text-sm font-semibold flex items-center">
                <span className="mr-2">🏷️</span>
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-purple-400 text-sm font-semibold flex items-center">
                <span className="mr-2">📍</span>
                Location
              </label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleChange}
                placeholder="City or venue..."
                className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all duration-300 shadow-lg shadow-purple-500/30"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg hover:bg-gray-700/50 text-purple-300 font-semibold transition-all"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFilter;

import axios from "axios";

// Controller for fetching external events from various APIs
// You can integrate with APIs like Ticketmaster, Eventbrite, etc.

// Mock function to simulate external API - replace with real APIs
const fetchFromExternalAPIs = async (query, location, category) => {
  // In production, you would call real APIs here
  // Example: Ticketmaster API, Eventbrite API, Meetup API, etc.
  
  // For demonstration, returning mock data
  const mockEvents = [
    {
      id: "ext-1",
      name: "Global Tech Summit 2025",
      description: "Join tech leaders from around the world for the biggest technology conference of the year.",
      category: "Technology",
      location: location || "San Francisco, USA",
      date: new Date("2025-11-15"),
      price: 499,
      source: "Ticketmaster",
      externalUrl: "https://example.com/event1",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: "ext-2",
      name: "International Music Festival",
      description: "Three days of non-stop music from world-renowned artists.",
      category: "Music",
      location: location || "London, UK",
      date: new Date("2025-08-20"),
      price: 250,
      source: "Eventbrite",
      externalUrl: "https://example.com/event2",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: "ext-3",
      name: "World Food Expo",
      description: "Taste cuisines from every corner of the globe.",
      category: "Food",
      location: location || "Paris, France",
      date: new Date("2025-09-10"),
      price: 75,
      source: "Meetup",
      externalUrl: "https://example.com/event3",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: "ext-4",
      name: "Olympics 2025",
      description: "The world's greatest sporting event.",
      category: "Sports",
      location: location || "Tokyo, Japan",
      date: new Date("2025-07-25"),
      price: 150,
      source: "Official Olympics",
      externalUrl: "https://example.com/event4",
      image: "https://via.placeholder.com/300x200"
    },
    {
      id: "ext-5",
      name: "Art Basel",
      description: "Premier international art fair.",
      category: "Art",
      location: location || "Miami, USA",
      date: new Date("2025-12-05"),
      price: 100,
      source: "Art Basel",
      externalUrl: "https://example.com/event5",
      image: "https://via.placeholder.com/300x200"
    }
  ];
  
  // Filter based on query parameters
  let filteredEvents = mockEvents;
  
  if (query) {
    filteredEvents = filteredEvents.filter(event => 
      event.name.toLowerCase().includes(query.toLowerCase()) ||
      event.description.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  if (category && category !== 'all') {
    filteredEvents = filteredEvents.filter(event => 
      event.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  if (location && location !== 'all') {
    filteredEvents = filteredEvents.filter(event => 
      event.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  
  return filteredEvents;
};

// Search external events
export const searchExternalEvents = async (req, res, next) => {
  try {
    const { 
      query = "", 
      location = "all", 
      category = "all",
      dateFrom,
      dateTo,
      priceMin = 0,
      priceMax = 10000,
      page = 1,
      limit = 20
    } = req.query;
    
    // Fetch from external APIs
    const externalEvents = await fetchFromExternalAPIs(query, location, category);
    
    // Apply additional filters
    let filteredEvents = externalEvents;
    
    if (dateFrom) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= new Date(dateFrom)
      );
    }
    
    if (dateTo) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= new Date(dateTo)
      );
    }
    
    filteredEvents = filteredEvents.filter(event => 
      event.price >= priceMin && event.price <= priceMax
    );
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
    
    res.json({
      events: paginatedEvents,
      totalEvents: filteredEvents.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredEvents.length / limit),
      sources: ["Ticketmaster", "Eventbrite", "Meetup", "Official Olympics", "Art Basel"]
    });
  } catch (error) {
    next(error);
  }
};

// Get trending events worldwide
export const getTrendingEvents = async (req, res, next) => {
  try {
    // In production, this would fetch trending events from various APIs
    const trendingEvents = await fetchFromExternalAPIs("", "", "");
    
    // Sort by popularity (mock - in reality, use actual metrics)
    const sorted = trendingEvents.sort((a, b) => b.price - a.price);
    
    res.json({
      events: sorted.slice(0, 10),
      lastUpdated: new Date()
    });
  } catch (error) {
    next(error);
  }
};

// Get events by location
export const getEventsByLocation = async (req, res, next) => {
  try {
    const { location } = req.params;
    const { category = "all" } = req.query;
    
    const events = await fetchFromExternalAPIs("", location, category);
    
    res.json({
      location,
      events,
      totalEvents: events.length
    });
  } catch (error) {
    next(error);
  }
};

// Get available locations
export const getAvailableLocations = async (req, res, next) => {
  try {
    // In production, this would be dynamic
    const locations = [
      { city: "New York", country: "USA", eventCount: 245 },
      { city: "London", country: "UK", eventCount: 189 },
      { city: "Paris", country: "France", eventCount: 167 },
      { city: "Tokyo", country: "Japan", eventCount: 203 },
      { city: "Sydney", country: "Australia", eventCount: 134 },
      { city: "Dubai", country: "UAE", eventCount: 98 },
      { city: "Singapore", country: "Singapore", eventCount: 112 },
      { city: "Mumbai", country: "India", eventCount: 156 },
      { city: "Berlin", country: "Germany", eventCount: 143 },
      { city: "Toronto", country: "Canada", eventCount: 127 }
    ];
    
    res.json(locations);
  } catch (error) {
    next(error);
  }
};

// Get event categories with counts
export const getEventCategories = async (req, res, next) => {
  try {
    const categories = [
      { name: "Music", count: 3456, icon: "🎵" },
      { name: "Sports", count: 2341, icon: "⚽" },
      { name: "Technology", count: 1876, icon: "💻" },
      { name: "Art", count: 1543, icon: "🎨" },
      { name: "Food", count: 2109, icon: "🍔" },
      { name: "Business", count: 987, icon: "💼" },
      { name: "Education", count: 756, icon: "📚" },
      { name: "Health", count: 623, icon: "🏥" },
      { name: "Entertainment", count: 2987, icon: "🎭" },
      { name: "Travel", count: 1123, icon: "✈️" }
    ];
    
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

// Import external event to local database
export const importExternalEvent = async (req, res, next) => {
  try {
    const { externalEvent } = req.body;
    
    // Create event in local database
    const event = await Event.create({
      name: externalEvent.name,
      description: externalEvent.description,
      category: externalEvent.category,
      location: externalEvent.location,
      date: externalEvent.date,
      price: externalEvent.price,
      organizer: req.user._id,
      externalSource: externalEvent.source,
      externalUrl: externalEvent.externalUrl
    });
    
    res.status(201).json({
      message: "Event imported successfully",
      event
    });
  } catch (error) {
    next(error);
  }
};

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ category, location, search, page = 1 }) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (location) params.append('location', location);
    if (search) params.append('search', search);
    params.append('page', page);
    
    const { data } = await api.get(`/events?${params}`);
    return data;
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (id) => {
    const { data } = await api.get(`/events/${id}`);
    return data;
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData) => {
    const { data } = await api.post('/events', eventData);
    return data;
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, eventData }) => {
    const { data } = await api.put(`/events/${id}`, eventData);
    return data;
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id) => {
    await api.delete(`/events/${id}`);
    return id;
  }
);

export const addComment = createAsyncThunk(
  'events/addComment',
  async ({ eventId, content }) => {
    const { data } = await api.post(`/events/${eventId}/comments`, { content });
    return data;
  }
);

export const fetchRecommendedEvents = createAsyncThunk(
  'events/fetchRecommended',
  async () => {
    const { data } = await api.get('/events/recommendations');
    return data;
  }
);

const eventSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    currentEvent: null,
    recommendedEvents: [],
    totalPages: 1,
    currentPage: 1,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch single event
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create event
      .addCase(createEvent.fulfilled, (state, action) => {
        state.events.push(action.payload);
      })
      // Update event
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.events.findIndex(e => e._id === action.payload._id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      // Delete event
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter(e => e._id !== action.payload);
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        state.currentEvent = action.payload;
      })
      // Fetch recommended
      .addCase(fetchRecommendedEvents.fulfilled, (state, action) => {
        state.recommendedEvents = action.payload;
      });
  },
});

export const { clearCurrentEvent } = eventSlice.actions;
export default eventSlice.reducer;

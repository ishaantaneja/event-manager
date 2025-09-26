import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk to fetch all events
export const fetchEvents = createAsyncThunk(
  "events/fetchEvents",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/events`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Async thunk to fetch filtered events
export const fetchFilteredEvents = createAsyncThunk(
  "events/fetchFilteredEvents",
  async (filters, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/events?${query}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const initialState = {
  events: [],       // merged: use "events" instead of "list"
  loading: false,
  error: null,
  bookmarks: [],    // store bookmarked event IDs
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    toggleBookmark: (state, action) => {
      const id = action.payload;
      if (state.bookmarks.includes(id)) {
        state.bookmarks = state.bookmarks.filter((b) => b !== id);
      } else {
        state.bookmarks.push(id);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchEvents lifecycle
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.events = action.payload; // use events instead of list
        state.loading = false;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchFilteredEvents lifecycle
      .addCase(fetchFilteredEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilteredEvents.fulfilled, (state, action) => {
        state.events = action.payload; // use events instead of list
        state.loading = false;
      })
      .addCase(fetchFilteredEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setEvents, toggleBookmark } = eventSlice.actions;
export default eventSlice.reducer;

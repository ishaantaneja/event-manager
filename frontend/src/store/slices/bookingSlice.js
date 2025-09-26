import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (eventId) => {
    const { data } = await api.post('/bookings', { eventId });
    return data;
  }
);

export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchUser',
  async () => {
    const { data } = await api.get('/bookings');
    return data;
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId) => {
    const { data } = await api.put(`/bookings/${bookingId}/cancel`);
    return { bookingId, data };
  }
);

export const fetchAllBookings = createAsyncThunk(
  'bookings/fetchAll',
  async () => {
    const { data } = await api.get('/bookings/all');
    return data;
  }
);

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    userBookings: [],
    allBookings: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings.push(action.payload);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch user bookings
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.userBookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const index = state.userBookings.findIndex(
          b => b._id === action.payload.bookingId
        );
        if (index !== -1) {
          state.userBookings[index].status = 'cancelled';
        }
      })
      // Fetch all bookings (admin)
      .addCase(fetchAllBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.allBookings = action.payload;
      })
      .addCase(fetchAllBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearError } = bookingSlice.actions;
export default bookingSlice.reducer;

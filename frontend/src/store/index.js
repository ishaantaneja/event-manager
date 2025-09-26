import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import eventReducer from "./slices/eventSlice.js";
import bookingReducer from "./slices/bookingSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    bookings: bookingReducer,
  },
});

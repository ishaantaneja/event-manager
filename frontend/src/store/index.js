import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import bookingReducer from "./slices/bookingSlice";
import eventReducer from "./slices/eventSlice";
import userReducer from "./slices/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookings: bookingReducer,
    events: eventReducer,
    users: userReducer,
  },
});

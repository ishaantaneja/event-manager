import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchUserData = createAsyncThunk("user/fetchUserData", async (token) => {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
});

export const updatePreferences = createAsyncThunk("user/updatePreferences", async ({ token, preferences }) => {
  const res = await axios.put(`${process.env.REACT_APP_API_URL}/user/preferences`, preferences, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.preferences;
});

export const toggleBookmarkServer = createAsyncThunk("user/toggleBookmarkServer", async ({ token, eventId }) => {
  const res = await axios.put(`${process.env.REACT_APP_API_URL}/user/bookmark/${eventId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data.bookmarks;
});

const userSlice = createSlice({
  name: "user",
  initialState: { bookmarks: [], preferences: {}, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.fulfilled, (state, action) => {
        state.bookmarks = action.payload.bookmarks.map(b => b._id);
        state.preferences = action.payload.preferences;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.preferences = action.payload;
      })
      .addCase(toggleBookmarkServer.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      });
  }
});

export default userSlice.reducer;

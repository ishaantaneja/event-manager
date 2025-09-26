import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const userInfo = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    userInfo,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('userInfo');
      state.userInfo = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

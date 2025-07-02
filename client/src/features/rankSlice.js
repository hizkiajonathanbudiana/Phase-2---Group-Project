import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";

export const fetchRankings = createAsyncThunk(
  "rankings/fetchRankings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/status");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  items: [],
  isLoading: false,
};

const rankingsSlice = createSlice({
  name: "rankings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRankings.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchRankings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.status;
      })
      .addCase(fetchRankings.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export default rankingsSlice.reducer;

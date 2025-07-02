import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/login", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const googleLoginUser = createAsyncThunk(
  "auth/googleLoginUser",
  async (tokenData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/google", tokenData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/register", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/logout");
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const handleVerifyCode = createAsyncThunk(
  "auth/handleVerifyCode",
  async ({ verifyCode }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/verify", { verifyCode });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const sendVerificationCode = createAsyncThunk(
  "auth/sendVerificationCode",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/verify/send");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const searchEmail = createAsyncThunk(
  "auth/searchEmail",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/password/forgot", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const verifyForgotPass = createAsyncThunk(
  "auth/verifyForgotPass",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/password/reset", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  isSubmitting: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.fulfilled, (state, action) => {
        toast.success(`Welcome Back ${action.payload.username} !`);
      })
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        toast.success(`Welcome Back ${action.payload.username} !`);
      })
      .addCase(registerUser.fulfilled, () => {
        toast.success("Register account successfully");
      })
      .addCase(logoutUser.fulfilled, () => {
        toast.success("Logout successfully!");
      })
      .addCase(handleVerifyCode.fulfilled, (state) => {
        toast.success("Verification successful!");
      })
      .addCase(sendVerificationCode.fulfilled, (state) => {
        toast.success("Verification code sent!");
      })
      .addCase(searchEmail.fulfilled, (state) => {
        toast.success("Email found! Please check your inbox.");
      })
      .addCase(verifyForgotPass.fulfilled, (state) => {
        toast.success(
          "Password reset successful! You can now log in with your new password."
        );
      })

      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") && action.type.endsWith("/pending"),
        (state) => {
          state.isSubmitting = true;
        }
      )
      .addMatcher(
        (action) =>
          action.type.startsWith("auth/") &&
          (action.type.endsWith("/fulfilled") ||
            action.type.endsWith("/rejected")),
        (state) => {
          state.isSubmitting = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith("/rejected"),
        (state, action) => {
          toast.error(action.payload?.message || "An error occurred");
        }
      );
  },
});

export default authSlice.reducer;

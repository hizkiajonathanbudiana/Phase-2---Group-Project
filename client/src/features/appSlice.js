import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-toastify";
// --- Thunks ---

// --- Slice ---
const initialState = {
  user: null,
  loading: false,
  isAuthenticated: false,
};

// Login

export const loginUser = createAsyncThunk(
  "app/loginUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/login", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Google OAuth Login
export const googleLoginUser = createAsyncThunk(
  "app/googleLoginUser",
  async (tokenData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/google", tokenData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Register
export const registerUser = createAsyncThunk(
  "app/registerUser",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/register", data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Fetch current user
export const fetchUser = createAsyncThunk(
  "app/fetchUser",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/auth/me");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  "app/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await axiosInstance.post("/logout");
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

//verifycode
export const handleVerifyCode = createAsyncThunk(
  "app/handleVerifyCode",
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
  "app/sendVerificationCode",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/verify/send");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

//forgot pass
export const searchEmail = createAsyncThunk(
  "app/searchEmail",
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
  "app/verifyForgotPass",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/password/reset", data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // optional manual logout (clears state)
    logout: (state) => {
      state.name = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // loginUser
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        toast.success(`Welcome Back ${action.payload.username} !`);
      })

      // googleLoginUser
      .addCase(googleLoginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        toast.success(`Welcome Back ${action.payload.username} !`);
      })

      // registerUser
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        toast.success("Register account successfully");
      })

      // fetchUser
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })

      // logoutUser
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        toast.success("Logout successfully!");
      })

      //handleVerifyCode
      .addCase(handleVerifyCode.fulfilled, (state) => {
        state.loading = false;
        toast.success("Verification successful!");
      })
      //sendVerificationCode
      .addCase(sendVerificationCode.fulfilled, (state) => {
        state.loading = false;
        toast.success("Verification code sent!");
      })
      //forgotpass
      .addCase(searchEmail.fulfilled, (state) => {
        state.loading = false;
        toast.success("Email found! Please check your inbox.");
      })

      //resetpass
      .addCase(verifyForgotPass.fulfilled, (state) => {
        state.loading = false;
        toast.success(
          "Password reset successful! You can now log in with your new password."
        );
      })
      //pending or rejected using addmatcher
      .addMatcher(
        (action) => {
          return action.type.endsWith("/pending");
        },
        (state) => {
          state.loading = true;
        }
      )
      .addMatcher(
        (action) => {
          return action.type.endsWith("/rejected");
        },
        (state, action) => {
          state.loading = false;
          toast.error(action.payload?.message || "An error occurred");
        }
      )
      .addMatcher(
        (action) => {
          return (
            action.type.endsWith("/rejected") &&
            action.payload?.message?.includes("token")
          );
        },
        (state) => {
          state.loading = false;
          state.isAuthenticated = false;
        }
      );
  },
});

export const { logout } = appSlice.actions;
export default appSlice.reducer;

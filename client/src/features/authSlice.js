import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// --- Thunks ---

// Login
export const loginUser = createAsyncThunk(
    "auth/loginUser",
    async (credentials, { rejectWithValue }) => {
        try {
            const res = await axios.post("http://localhost:3000/login", credentials);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Google OAuth Login
export const googleLoginUser = createAsyncThunk(
    "auth/googleLoginUser",
    async (tokenData, { rejectWithValue }) => {
        try {
            const res = await axios.post("http://localhost:3000/google", tokenData);
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Register
export const registerUser = createAsyncThunk(
    "auth/registerUser",
    async ({ email, password }, { rejectWithValue }) => {
        try {
            const res = await axios.post("http://localhost:3000/register", { email, password });
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Fetch current user
export const fetchUser = createAsyncThunk(
    "auth/fetchUser",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axios.get("http://localhost:3000/auth/me");
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// Logout
export const logoutUser = createAsyncThunk(
    "auth/logoutUser",
    async (_, { rejectWithValue }) => {
        try {
            await axios.post("http://localhost:3000/logout");
        } catch (err) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

// --- Slice ---
const initialState = {
    user: null,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // optional manual logout (clears state)
        logout: (state) => {
            state.user = null;
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // loginUser
            .addCase(loginUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = { id: action.payload.id, email: action.payload.email };
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload?.message || action.error.message;
            })
            // googleLoginUser
            .addCase(googleLoginUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(googleLoginUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = { id: action.payload.id, email: action.payload.email };
            })
            .addCase(googleLoginUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload?.message || action.error.message;
            })
            // registerUser
            .addCase(registerUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.status = "succeeded";
                // user stays null until explicit login
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload?.message || action.error.message;
            })
            // fetchUser
            .addCase(fetchUser.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(fetchUser.rejected, (state) => {
                state.status = "idle"; // not logged in
                state.user = null;
            })
            // logoutUser
            .addCase(logoutUser.pending, (state) => {
                state.status = "loading";
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.status = "succeeded";
                state.user = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload?.message || action.error.message;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
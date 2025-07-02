import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/authSlice.js";
import appReducer from "../features/appSlice.js";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        app: appReducer,
    },
});
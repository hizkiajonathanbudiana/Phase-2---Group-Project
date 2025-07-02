import { configureStore } from "@reduxjs/toolkit";
import appSlice from "../features/appSlice";
import authReducer from "../features/authSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    app: appSlice,
  },
});

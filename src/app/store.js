import { configureStore } from "@reduxjs/toolkit";
import appReducer from "../features/appSlice";
import authReducer from "../features/authSlice";
import rankReducer from "../features/rankSlice";

export const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    rankings: rankReducer,
  },
});

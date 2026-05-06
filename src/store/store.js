import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import interazioneReducer from './slices/interazioneSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interazioni: interazioneReducer,
  },
});

export default store;

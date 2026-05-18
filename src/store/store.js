import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import interazioneReducer from './slices/interazioneSlice';
import notificheReducer from './slices/notificheSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    interazioni: interazioneReducer,
    notifiche: notificheReducer,
  },
});

export default store;

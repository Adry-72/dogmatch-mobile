import axios from "axios";
import { Platform } from "react-native";
import { getItem, deleteItem } from "./storage";

const BASE_URL = Platform.OS === "web"
  ? (process.env.EXPO_PUBLIC_API_URL_WEB || "http://localhost:3000/api")
  : (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api");

console.log("[api] Platform:", Platform.OS, "→ BASE_URL:", BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

let _store;
export function injectStore(store) {
  _store = store;
}

api.interceptors.request.use(
  async (config) => {
    const token = await getItem("userToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await deleteItem("userToken");
      await deleteItem("userData");
      _store?.dispatch({ type: "auth/logout" });
    }
    return Promise.reject(error);
  },
);

export default api;

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const getItem = (key) => {
  if (Platform.OS === "web") return Promise.resolve(localStorage.getItem(key));
  return SecureStore.getItemAsync(key);
};

export const setItem = (key, value) => {
  if (Platform.OS === "web") { localStorage.setItem(key, value); return Promise.resolve(); }
  return SecureStore.setItemAsync(key, value);
};

export const deleteItem = (key) => {
  if (Platform.OS === "web") { localStorage.removeItem(key); return Promise.resolve(); }
  return SecureStore.deleteItemAsync(key);
};

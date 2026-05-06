if (__DEV__) {
  const _log = console.log;
  console.log = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Running application")) return;
    _log(...args);
  };
}

import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import AppNavigator from "./src/navigation/AppNavigator";
import { connectSocket, disconnectSocket } from "./src/services/socket";
import { injectStore } from "./src/services/api";
import { restoreToken } from "./src/store/slices/authSlice";
import { store } from "./src/store/store";

injectStore(store);

const AppContent = () => {
  const dispatch = useDispatch();
  const { loading, token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(restoreToken());
  }, [dispatch]);

  useEffect(() => {
    if (token) {
      connectSocket(token);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [token]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <View style={styles.mainWrapper}>
        <View style={styles.appResponsiveContainer}>
          <AppContent />
        </View>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: "#D1D1D1",
    ...Platform.select({
      web: {
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 20,
      },
    }),
  },
  appResponsiveContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#FFF7F2",
    ...Platform.select({
      web: {
        maxWidth: 450,
        maxHeight: '92vh',
        minHeight: 600,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0px 10px 30px rgba(0,0,0,0.2)",
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7F2",
  },
});

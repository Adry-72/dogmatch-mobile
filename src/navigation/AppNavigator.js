import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Platform, Text, View } from 'react-native';
import { useDispatch, useSelector } from "react-redux";

import { HapticTab } from "../../components/haptic-tab";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminStatsScreen from "../screens/AdminStatsScreen";
import AdminDogDetailScreen from "../screens/AdminDogDetailScreen";
import AdminDogsScreen from "../screens/AdminDogsScreen";
import AdminReportsScreen from "../screens/AdminReportsScreen";
import AdminUserDetailScreen from "../screens/AdminUserDetailScreen";
import AdminUsersScreen from "../screens/AdminUsersScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import RichiesteRicevuteScreen from "../screens/RichiesteRicevuteScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SnoutChatScreen from '../screens/SnoutChatScreen';
import NotificheScreen from '../screens/NotificheScreen';
import { selectNonLette } from '../store/slices/notificheSlice';
import { usePushNotifications } from '../hooks/usePushNotifications';

import AppLogo from "../../assets/images/logotrasparente.png";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, headerShadowVisible: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false, headerShadowVisible: false }}>
      <ChatStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatStack.Screen name="Messages" component={MessagesScreen} />
    </ChatStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#FFF7F2' },
        headerTintColor: '#0047AB',
        headerTitleStyle: { fontWeight: '900' },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen
        name="RichiesteRicevute"
        component={RichiesteRicevuteScreen}
        options={{ title: 'Richieste di Match' }}
      />
    </ProfileStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#FFF7F2' },
        headerTintColor: '#0047AB',
        headerTitleStyle: { fontWeight: '900' },
      }}
    >
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <AdminStack.Screen name="AdminStats" component={AdminStatsScreen} options={{ title: 'Statistiche & Monitoring' }} />
      <AdminStack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: 'Utenti' }} />
      <AdminStack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ title: 'Dettaglio Utente' }} />
      <AdminStack.Screen name="AdminDogs" component={AdminDogsScreen} options={{ title: 'Cani' }} />
      <AdminStack.Screen name="AdminDogDetail" component={AdminDogDetailScreen} options={{ title: 'Dettaglio Cane' }} />
      <AdminStack.Screen name="AdminReports" component={AdminReportsScreen} options={{ title: 'Segnalazioni' }} />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.ruolo === 'admin';
  const nonLette = useSelector(selectNonLette);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTitle: () => (
          <View style={{ width: 220, height: 80, justifyContent: 'center', alignItems: 'center' }}>
            <Image
              source={AppLogo}
              style={{ width: 200, height: 90, resizeMode: 'contain' }}
            />
          </View>
        ),
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#0047AB",
        tabBarInactiveTintColor: "#666",
        tabBarStyle: {
          backgroundColor: "#FFF1E8",
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: "#FFF7F2",
          height: 110,
          elevation: 0,
          ...Platform.select({ web: { boxShadow: "none" }, default: { shadowOpacity: 0 } }),
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Home") iconName = "dog";
          else if (route.name === "Messaggi") iconName = "message-text";
          else if (route.name === "Notifiche") iconName = "bell";
          else if (route.name === "Profilo") iconName = "account";
          else if (route.name === "Admin") iconName = "shield-account";
          return (
            <View>
              <MaterialCommunityIcons name={iconName} size={size + 4} color={color} />
              {route.name === "Notifiche" && nonLette > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -8,
                  backgroundColor: '#E91E63', borderRadius: 9,
                  minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '900' }}>
                    {nonLette > 99 ? '99+' : nonLette}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Notifiche" component={NotificheScreen} options={{ title: 'Notifiche' }} />
      <Tab.Screen
        name="Messaggi"
        component={ChatNavigator}
        options={{ title: "Le mie Chat" }}
      />
      <Tab.Screen name="Profilo" component={ProfileNavigator} options={{ title: "Mio Profilo" }} />
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          options={{
            title: "Admin",
            tabBarActiveTintColor: "#E8405A",
          }}
        />
      )}
    </Tab.Navigator>
  );
}

function AuthenticatedStack() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="SnoutChat"
        component={SnoutChatScreen}
        options={{
          headerBackTitle: 'Indietro',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFF7F2' },
          headerTintColor: '#0047AB',
          headerTitle: () => (
            <Image source={AppLogo} style={{ width: 160, height: 48 }} resizeMode="contain" />
          ),
        }}
      />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const navigationRef = useNavigationContainerRef();
  usePushNotifications(navigationRef);

  if (loading && !isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' }}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? <AuthenticatedStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

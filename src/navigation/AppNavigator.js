import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Platform, View } from 'react-native';
import { useSelector } from "react-redux";

import { HapticTab } from "../../components/haptic-tab";
import EditProfileScreen from "../screens/EditProfileScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import MessagesScreen from "../screens/MessagesScreen";
import ChatListScreen from "../screens/ChatListScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RegisterScreen from "../screens/RegisterScreen";
import SnoutChatScreen from '../screens/SnoutChatScreen';

import AppLogo from "../../assets/images/logotrasparente.png";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
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
    <ProfileStack.Navigator screenOptions={{ headerShown: false, headerShadowVisible: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function MainTabs() {
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
          else if (route.name === "Profilo") iconName = "account";
          return <MaterialCommunityIcons name={iconName} size={size + 4} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Messaggi"
        component={ChatNavigator}
        options={{ title: "Le mie Chat" }}
      />
      <Tab.Screen name="Profilo" component={ProfileNavigator} options={{ title: "Mio Profilo" }} />
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
          title: 'SnoutBot AI',
          headerBackTitle: 'Indietro',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFF7F2' },
          headerTintColor: '#0047AB',
          headerTitleStyle: { fontWeight: '900' }
        }}
      />
    </AppStack.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading && !isAuthenticated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' }}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AuthenticatedStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

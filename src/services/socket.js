import { io } from 'socket.io-client';
import { Platform } from 'react-native';

const SOCKET_URL = Platform.OS === 'web'
  ? (process.env.EXPO_PUBLIC_SOCKET_URL_WEB || 'http://localhost:3000')
  : (process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000');

const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
});

export const connectSocket = (token) => {
    if (token) {
        socket.auth = { token };
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};

export default socket;

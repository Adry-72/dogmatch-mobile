import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import api from '../services/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) return null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0047AB',
        });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenData.data;
}

/**
 * @param {import('@react-navigation/native').NavigationContainerRef} navigationRef
 */
export const usePushNotifications = (navigationRef) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    const notificationListener = useRef(null);
    const responseListener = useRef(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        registerForPushNotificationsAsync().then(async (token) => {
            if (!token) return;
            try {
                await api.put('/profilo/push-token', { token });
            } catch {
                // non critico
            }
        });

        // Notifica ricevuta con app in foreground (solo listener, la UI è gestita dal handler sopra)
        notificationListener.current = Notifications.addNotificationReceivedListener(() => {});

        // Tap su notifica quando app è in background o chiusa
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const link = response.notification.request.content.data?.link;
            if (!link || !navigationRef?.isReady?.()) return;

            if (link.startsWith('chat:')) {
                const interazioneId = link.replace('chat:', '');
                navigationRef.navigate('Messaggi', {
                    screen: 'Messages',
                    params: { interazioneId },
                });
            } else if (link === 'requests') {
                navigationRef.navigate('Profilo', {
                    screen: 'RichiesteRicevute',
                });
            }
        });

        return () => {
            notificationListener.current?.remove();
            responseListener.current?.remove();
        };
    }, [isAuthenticated, navigationRef]);
};

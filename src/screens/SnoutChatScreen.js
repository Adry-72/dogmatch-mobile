import { useEffect, useLayoutEffect } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { ChatWindow } from '../../components/Chatbot/ChatWindow';
import { useChatbot } from '../hooks/useChatbot';
import { clearChatHistory } from '../services/chatApi';

const WELCOME = 'Ciao! Sono SnoutBot 🐾 Chiedimi tutto su DogMatch, razze, consigli e molto altro!';

const SnoutChatScreen = ({ navigation }) => {
    const user = useSelector((state) => state.auth.user);
    const { messages, sendMessage, isTyping, initChat, inputValue, setInputValue } = useChatbot(user?.id?.toString() || '');

    useEffect(() => {
        initChat(WELCOME);
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleClear} style={{ marginRight: 12 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#0047AB" />
                </TouchableOpacity>
            ),
        });
    }, [navigation]);

    const handleClear = () => {
        Alert.alert(
            'Cancella cronologia',
            'Vuoi eliminare tutta la cronologia della chat?',
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Elimina',
                    style: 'destructive',
                    onPress: async () => {
                        await clearChatHistory().catch(() => {});
                        initChat(WELCOME);
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <ChatWindow
                messages={messages}
                onSend={sendMessage}
                user={{ _id: user?.id || 1 }}
                isTyping={isTyping}
                inputValue={inputValue}
                onInputChange={setInputValue}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2' },
});

export default SnoutChatScreen;

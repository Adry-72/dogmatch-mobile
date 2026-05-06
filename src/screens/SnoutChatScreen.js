import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { ChatWindow } from '../../components/Chatbot/ChatWindow';
import { useChatbot } from '../hooks/useChatbot';

const SnoutChatScreen = () => {
    const user = useSelector((state) => state.auth.user);
    const { messages, sendMessage, isTyping, initChat } = useChatbot(user?.id?.toString() || '');

    useEffect(() => {
        initChat('Ciao! Sono SnoutBot 🐾 Chiedimi tutto su DogMatch, razze, consigli e molto altro!');
    }, []);

    return (
        <View style={styles.container}>
            <ChatWindow
                messages={messages}
                onSend={sendMessage}
                user={{ _id: user?.id || 1 }}
                isTyping={isTyping}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2' },
});

export default SnoutChatScreen;

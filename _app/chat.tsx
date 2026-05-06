import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChatWindow } from '../components/Chatbot/ChatWindow';
import { useChatbot } from '../hooks/useChatbot'; // Il nostro nuovo hook

export default function ChatScreen() {
    const { messages, sendMessage, isTyping, initChat } = useChatbot();

    useEffect(() => {
        initChat('Bau! Sono il tuo assistente DogMatch. Come posso aiutarti oggi?');
    }, []);

    return (
        <View style={styles.container}>
            <ChatWindow
                messages={messages}
                onSend={sendMessage}
                user={{ _id: 1 }}
                // Possiamo aggiungere una prop per il caricamento se vogliamo
                isTyping={isTyping}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
});
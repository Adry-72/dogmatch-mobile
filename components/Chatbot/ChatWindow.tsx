import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, Send } from 'react-native-gifted-chat';

interface ChatWindowProps {
    messages: IMessage[];
    onSend: (messages: IMessage[]) => void;
    user: { _id: number };
    isTyping: boolean;
}

export function ChatWindow({ messages, onSend, user, isTyping }: ChatWindowProps) {

    const renderBubble = (props: any) => (
        <Bubble
            {...props}
            wrapperStyle={{
                right: { backgroundColor: '#FF8C00' },
                left: { backgroundColor: '#f0f0f0' },
            }}
        />
    );

    const renderSend = (props: any) => (
        <Send {...props} containerStyle={styles.sendContainer}>
            <Ionicons name="send" size={24} color="#FF8C00" />
        </Send>
    );

    return (
        <View style={styles.container}>
            <GiftedChat
                messages={messages}
                onSend={(msgs) => onSend(msgs)}
                user={user}
                renderBubble={renderBubble}
                renderSend={renderSend}
                isTyping={isTyping}
                placeholder="Chiedi qualcosa su DogMatch..."
                alwaysShowSend
                scrollToBottom
                listViewProps={{ showsVerticalScrollIndicator: false }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 5,
    },
});

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Message {
    _id: string | number;
    text: string;
    createdAt: Date;
    user: { _id: string | number; name?: string; avatar?: any };
}

interface ChatWindowProps {
    messages: Message[];
    onSend: (messages: Message[]) => void;
    user: { _id: string | number; avatar?: string };
    isTyping: boolean;
    inputValue: string;
    onInputChange: (text: string) => void;
}

const TypingDots = () => {
    const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

    useEffect(() => {
        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 150),
                    Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.delay(600 - i * 150),
                ])
            )
        );
        animations.forEach(a => a.start());
        return () => animations.forEach(a => a.stop());
    }, []);

    return (
        <View style={typingStyles.row}>
            {dots.map((dot, i) => (
                <Animated.View key={i} style={[typingStyles.dot, { transform: [{ translateY: dot }] }]} />
            ))}
        </View>
    );
};

const typingStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4, paddingVertical: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#aaa' },
});

const formatTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function ChatWindow({ messages, onSend, user, isTyping, inputValue, onInputChange }: ChatWindowProps) {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }), 100);
        }
    }, [messages.length]);

    const handleSend = () => {
        const text = inputValue.trim();
        if (!text) return;
        onSend([{
            _id: Date.now(),
            text,
            createdAt: new Date(),
            user,
        }]);
    };

    const renderItem = ({ item }: { item: Message }) => {
        const isMe = item.user._id === user._id;
        return (
            <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
                {!isMe && item.user.avatar && (
                    <Image source={item.user.avatar} style={styles.avatar} />
                )}
                <View style={isMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft}>
                    <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={[styles.bubbleText, isMe && styles.bubbleTextRight]}>
                            {item.text}
                        </Text>
                    </View>
                    <Text style={[styles.timestamp, isMe ? styles.timestampRight : styles.timestampLeft]}>
                        {formatTime(item.createdAt)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item._id.toString()}
                inverted
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />

            {isTyping && (
                <View style={styles.typingRow}>
                    <View style={styles.typingBubble}>
                        <TypingDots />
                    </View>
                </View>
            )}

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={onInputChange}
                    placeholder="Chiedi qualcosa su DogMatch..."
                    placeholderTextColor="#999"
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    editable={!isTyping}
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (isTyping || !inputValue.trim()) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={isTyping || !inputValue.trim()}
                >
                    <Ionicons name="send" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    listContent: { paddingHorizontal: 12, paddingVertical: 8 },
    messageRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },
    avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
    bubbleWrapLeft: { maxWidth: '75%', alignItems: 'flex-start' },
    bubbleWrapRight: { maxWidth: '75%', alignItems: 'flex-end' },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    bubbleLeft: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
    bubbleRight: { backgroundColor: '#FF8C00', borderBottomRightRadius: 4 },
    bubbleText: { fontSize: 15, color: '#1c1e21', lineHeight: 20 },
    bubbleTextRight: { color: '#FFF' },
    timestamp: { fontSize: 10, color: '#aaa', marginTop: 2 },
    timestampLeft: { marginLeft: 4 },
    timestampRight: { marginRight: 4 },
    typingRow: { paddingHorizontal: 16, paddingBottom: 4 },
    typingBubble: {
        backgroundColor: '#f0f0f0',
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        backgroundColor: '#FFF',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 15,
        color: '#1c1e21',
        marginRight: 8,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FF8C00',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendBtnDisabled: { backgroundColor: '#FFD0A0' },
});

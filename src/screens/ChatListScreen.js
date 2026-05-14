import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../services/api';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const formatLastMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return date.toLocaleDateString('it-IT', { weekday: 'short' });
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
};

const truncate = (text, max = 38) =>
    text && text.length > max ? text.slice(0, max) + '…' : text;

const ChatListScreen = ({ navigation }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    const mioCaneId = user?.iMieiCani?.[0]?.id;

    const fetchMatches = useCallback(async () => {
        if (!mioCaneId) { setLoading(false); return; }
        try {
            const { data } = await api.get(`/interazioni/matches/${mioCaneId}`);
            if (data.successo) setChats(data.matches);
        } catch {
            Alert.alert('Errore', 'Non riesco a caricare i tuoi match al momento.');
        } finally {
            setLoading(false);
        }
    }, [mioCaneId]);

    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const renderItem = ({ item }) => {
        const altroCane = item.mittenteCaneId === mioCaneId ? item.ricevente : item.mittente;
        if (!altroCane) return null;

        const lastMsg = item.conversazione?.[0];
        const isMyLastMsg = lastMsg?.mittenteUtenteId === user?.id;
        const preview = lastMsg
            ? `${isMyLastMsg ? 'Tu: ' : ''}${truncate(lastMsg.contenuto)}`
            : 'Inizia la conversazione! 🐾';
        const timeLabel = lastMsg ? formatLastMessageTime(lastMsg.createdAt) : '';

        const avatarSource = altroCane.fotoUrl
            ? { uri: `${BASE_URL}/uploads/${altroCane.fotoUrl}` }
            : null;

        return (
            <TouchableOpacity
                style={styles.chatCard}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('Messages', {
                    interazioneId: item.id,
                    destinatarioNome: altroCane.nome,
                })}
            >
                {avatarSource ? (
                    <Image source={avatarSource} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <MaterialCommunityIcons name="dog" size={28} color="#CCC" />
                    </View>
                )}

                <View style={styles.textContainer}>
                    <View style={styles.topRow}>
                        <Text style={styles.dogName} numberOfLines={1}>{altroCane.nome}</Text>
                        {timeLabel ? <Text style={styles.timeLabel}>{timeLabel}</Text> : null}
                    </View>
                    <Text
                        style={[styles.lastMessage, !lastMsg && styles.lastMessageEmpty]}
                        numberOfLines={1}
                    >
                        {preview}
                    </Text>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={22} color="#CCC" />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#0047AB" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={chats.length === 0 ? { flex: 1 } : styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="dog-side" size={80} color="#CCC" />
                        <Text style={styles.emptyText}>
                            Ancora nessun match per {user?.iMieiCani?.[0]?.nome || 'il tuo cane'}.{'\n'}
                            Continua a fare swipe! 🦴
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingVertical: 8 },
    chatCard: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0EDE8',
        marginLeft: 82,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#EEE',
        marginRight: 14,
    },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, marginRight: 4 },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 3,
    },
    dogName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        flex: 1,
        marginRight: 8,
    },
    timeLabel: {
        fontSize: 12,
        color: '#AAA',
        flexShrink: 0,
    },
    lastMessage: {
        fontSize: 13,
        color: '#888',
        lineHeight: 18,
    },
    lastMessageEmpty: {
        color: '#BBB',
        fontStyle: 'italic',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#999',
        marginTop: 20,
        lineHeight: 24,
    },
});

export default ChatListScreen;

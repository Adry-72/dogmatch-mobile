import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../services/api';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const ChatListScreen = ({ navigation }) => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    const mioCaneId = user?.iMieiCani?.[0]?.id;

    useEffect(() => {
        const fetchMatches = async () => {
            if (!mioCaneId) {
                setLoading(false);
                return;
            }

            try {
                const { data } = await api.get(`/interazioni/matches/${mioCaneId}`);
                if (data.successo) {
                    setChats(data.matches);
                }
            } catch {
                Alert.alert("Errore", "Non riesco a caricare i tuoi match al momento.");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [mioCaneId]);

    const renderItem = ({ item }) => {
        const altroCane = item.mittenteCaneId === mioCaneId ? item.ricevente : item.mittente;

        if (!altroCane) return null;

        const avatarSource = altroCane.fotoUrl
            ? { uri: `${BASE_URL}/uploads/${altroCane.fotoUrl}` }
            : null;

        return (
            <TouchableOpacity
                style={styles.chatCard}
                onPress={() => navigation.navigate('Messages', {
                    interazioneId: item.id,
                    destinatarioNome: altroCane.nome
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
                    <Text style={styles.dogName}>{altroCane.nome}</Text>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        Tocca per annusare i messaggi... 🐾
                    </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#0047AB" />
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
                contentContainerStyle={chats.length === 0 && { flex: 1 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="dog-side" size={80} color="#CCC" />
                        <Text style={styles.emptyText}>
                            Ancora nessun match per {user?.iMieiCani?.[0]?.nome || 'il tuo cane'}.
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
    chatCard: {
        flexDirection: 'row',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        backgroundColor: '#FFF',
        borderRadius: 15,
        alignItems: 'center',
        elevation: 2,
        ...Platform.select({
          web: { boxShadow: "0px 0px 5px rgba(0,0,0,0.05)" },
          default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
        }),
    },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EEE' },
    avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    textContainer: { flex: 1, marginLeft: 15 },
    dogName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    lastMessage: { fontSize: 14, color: '#777', marginTop: 4 },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyText: { textAlign: 'center', fontSize: 16, color: '#999', marginTop: 20 },
});

export default ChatListScreen;

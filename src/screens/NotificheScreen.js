import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifiche, segnaLetta, segnaLetteTutte } from '../store/slices/notificheSlice';

const ICONE = {
    richiesta_match: { name: 'paw', color: '#FF8C00' },
    match_accettato: { name: 'heart', color: '#E91E63' },
    messaggio:       { name: 'message-text', color: '#0047AB' },
    gioco_accettato: { name: 'tennis-ball', color: '#4CAF50' },
};

const NotificaItem = ({ item, onPress }) => {
    const icona = ICONE[item.tipo] || { name: 'bell', color: '#999' };
    return (
        <TouchableOpacity
            style={[styles.item, !item.letto && styles.itemNonLetto]}
            onPress={() => onPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBox, { backgroundColor: icona.color + '20' }]}>
                <MaterialCommunityIcons name={icona.name} size={24} color={icona.color} />
            </View>
            <View style={styles.textBox}>
                <Text style={[styles.messaggio, !item.letto && styles.messaggioNonLetto]}>
                    {item.messaggio}
                </Text>
                <Text style={styles.data}>
                    {new Date(item.createdAt).toLocaleString('it-IT', {
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                    })}
                </Text>
            </View>
            {!item.letto && <View style={styles.pallino} />}
        </TouchableOpacity>
    );
};

const NotificheScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { lista, loading } = useSelector((state) => state.notifiche);
    const nonLette = lista.filter(n => !n.letto).length;

    useEffect(() => {
        dispatch(fetchNotifiche());
    }, []);

    const handlePress = (notifica) => {
        if (!notifica.letto) dispatch(segnaLetta(notifica.id));
        if (notifica.link?.startsWith('chat:')) {
            const interazioneId = notifica.link.replace('chat:', '');
            navigation.navigate('Messaggi', { screen: 'Chat', params: { interazioneId } });
        } else if (notifica.link === 'requests') {
            navigation.navigate('Profilo', { screen: 'RichiesteRicevute' });
        }
    };

    return (
        <View style={styles.container}>
            {nonLette > 0 && (
                <TouchableOpacity style={styles.segnaBtn} onPress={() => dispatch(segnaLetteTutte())}>
                    <Text style={styles.segnaBtnText}>Segna tutte come lette</Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <ActivityIndicator size="large" color="#0047AB" style={{ marginTop: 40 }} />
            ) : lista.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialCommunityIcons name="bell-off-outline" size={64} color="#CCC" />
                    <Text style={styles.emptyText}>Nessuna notifica</Text>
                </View>
            ) : (
                <FlatList
                    data={lista}
                    keyExtractor={(item) => item.id?.toString()}
                    renderItem={({ item }) => <NotificaItem item={item} onPress={handlePress} />}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF7F2' },
    segnaBtn: {
        alignSelf: 'flex-end',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    segnaBtnText: { fontSize: 12, color: '#0047AB', fontWeight: '700' },
    list: { paddingHorizontal: 16, paddingVertical: 8 },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        elevation: 2,
    },
    itemNonLetto: { backgroundColor: '#FFF8E1' },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 23,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textBox: { flex: 1 },
    messaggio: { fontSize: 14, color: '#444', lineHeight: 20 },
    messaggioNonLetto: { color: '#1A1A1A', fontWeight: '700' },
    data: { fontSize: 11, color: '#999', marginTop: 3 },
    pallino: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF8C00',
        marginLeft: 8,
    },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 15, color: '#999', marginTop: 12 },
});

export default NotificheScreen;

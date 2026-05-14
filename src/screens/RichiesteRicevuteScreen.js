import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../services/api';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const PLACEHOLDER = 'https://cdn-icons-png.flaticon.com/512/616/616408.png';

const buildImageSource = (fotoUrl) => {
    if (!fotoUrl || fotoUrl === 'default-dog.png') return { uri: PLACEHOLDER };
    if (fotoUrl.startsWith('http')) return { uri: fotoUrl };
    return { uri: `${BASE_URL}/uploads/${fotoUrl.replace('uploads/', '')}` };
};

const IntentoBadge = ({ intento }) => {
    const isAccoppiamento = intento === 'accoppiamento';
    return (
        <View style={[styles.badge, { backgroundColor: isAccoppiamento ? '#EFA6BA' : '#7FBCC8' }]}>
            <MaterialCommunityIcons
                name={isAccoppiamento ? 'heart' : 'tennis-ball'}
                size={11}
                color="#FFF"
            />
            <Text style={styles.badgeText}>
                {isAccoppiamento ? 'Accoppiamento' : 'Gioco'}
            </Text>
        </View>
    );
};

const RichiesteRicevuteScreen = ({ navigation }) => {
    const user = useSelector((state) => state.auth.user);
    const mioCaneId = user?.iMieiCani?.[0]?.id;

    const [richieste, setRichieste] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // interazioneId in progress

    const fetchRichieste = useCallback(async () => {
        try {
            const { data } = await api.get('/interazioni/richieste-ricevute');
            if (data.successo) setRichieste(data.richieste ?? []);
        } catch {
            Alert.alert('Errore', 'Impossibile caricare le richieste.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRichieste();
    }, [fetchRichieste]);

    const handleAccetta = async (richiesta) => {
        if (!mioCaneId) {
            Alert.alert('Attenzione', 'Non hai ancora aggiunto il tuo cane al profilo.');
            return;
        }
        setActionLoading(richiesta.interazioneId);
        try {
            const { data } = await api.post('/interazioni/like', {
                mittenteCaneId: mioCaneId,
                destinatarioCaneId: richiesta.cane.id,
                intento: richiesta.intento,
            });

            if (!data.successo) {
                Alert.alert('Errore', data.errore || 'Impossibile accettare la richiesta.');
                return;
            }

            setRichieste((prev) => prev.filter((r) => r.interazioneId !== richiesta.interazioneId));

            if (data.isMatch) {
                Alert.alert(
                    '🎉 È un Match!',
                    `Hai fatto match con ${richiesta.cane.nome}! Ora potete chattare.`,
                    [
                        {
                            text: 'Vai alla chat',
                            onPress: () => navigation.navigate('Messaggi', {
                                screen: 'Messages',
                                params: { interazioneId: data.data?.id, destinatarioNome: richiesta.cane.nome },
                            }),
                        },
                        { text: 'Resta qui', style: 'cancel' },
                    ]
                );
            } else {
                Alert.alert('Richiesta accettata', `Hai mandato un like a ${richiesta.cane.nome}!`);
            }
        } catch {
            Alert.alert('Errore', 'Impossibile accettare la richiesta.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRifiuta = (richiesta) => {
        Alert.alert(
            'Rifiuta richiesta',
            `Vuoi rifiutare la richiesta di ${richiesta.cane.nome}?`,
            [
                { text: 'Annulla', style: 'cancel' },
                {
                    text: 'Rifiuta',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(richiesta.interazioneId);
                        try {
                            await api.delete(`/interazioni/${richiesta.interazioneId}`);
                            setRichieste((prev) =>
                                prev.filter((r) => r.interazioneId !== richiesta.interazioneId)
                            );
                        } catch {
                            Alert.alert('Errore', 'Impossibile rifiutare la richiesta.');
                        } finally {
                            setActionLoading(null);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }) => {
        const isLoading = actionLoading === item.interazioneId;
        return (
            <View style={styles.card}>
                <Image
                    source={buildImageSource(item.cane?.fotoUrl)}
                    style={styles.avatar}
                    defaultSource={{ uri: PLACEHOLDER }}
                />
                <View style={styles.info}>
                    <Text style={styles.nomeCane}>{item.cane?.nome}</Text>
                    <Text style={styles.razza} numberOfLines={1}>{item.cane?.razza}</Text>
                    <IntentoBadge intento={item.intento} />
                </View>
                <View style={styles.actions}>
                    {isLoading ? (
                        <ActivityIndicator color="#0047AB" />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.btnAccetta}
                                onPress={() => handleAccetta(item)}
                            >
                                <MaterialCommunityIcons name="check" size={18} color="#FFF" />
                                <Text style={styles.btnText}>Accetta</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnRifiuta}
                                onPress={() => handleRifiuta(item)}
                            >
                                <MaterialCommunityIcons name="close" size={18} color="#DC3545" />
                                <Text style={[styles.btnText, { color: '#DC3545' }]}>Rifiuta</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
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
                data={richieste}
                keyExtractor={(item) => item.interazioneId?.toString()}
                renderItem={renderItem}
                contentContainerStyle={richieste.length === 0 ? styles.emptyContainer : styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <MaterialCommunityIcons name="heart-outline" size={72} color="#DDD" />
                        <Text style={styles.emptyTitle}>Nessuna richiesta</Text>
                        <Text style={styles.emptySubtitle}>
                            Quando qualcuno mette like al tuo cane, la richiesta apparirà qui.
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
    listContent: { padding: 16, gap: 12 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1.5,
        borderColor: '#F5E0E8',
        gap: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: '#EFA6BA',
    },
    info: { flex: 1 },
    nomeCane: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
    razza: { fontSize: 13, color: '#888', textTransform: 'capitalize', marginBottom: 6 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
    },
    badgeText: { fontSize: 11, color: '#FFF', fontWeight: '700' },
    actions: { alignItems: 'center', gap: 8 },
    btnAccetta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#7FBCC8',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        gap: 4,
        minWidth: 88,
        justifyContent: 'center',
    },
    btnRifiuta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3F3',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1.5,
        borderColor: '#F5C6CB',
        gap: 4,
        minWidth: 88,
        justifyContent: 'center',
    },
    btnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
    empty: { alignItems: 'center' },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: '#999', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: '#BBB', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default RichiesteRicevuteScreen;

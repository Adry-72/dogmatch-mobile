import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { useDispatch, useSelector } from 'react-redux';
import { clearMatch, fetchDiscovery, swipeDislike, swipeLike } from '../store/slices/interazioneSlice';

const { height } = Dimensions.get('window');
const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const DiscoveryScreen = () => {
    const dispatch = useDispatch();
    const swiperRef = useRef(null);

    const [intento, setIntento] = useState('gioco');
    const [distanza, setDistanza] = useState('provincia');

    const { discoveryStack, loading, lastMatch } = useSelector((state) => state.interazioni);
    const { user } = useSelector((state) => state.auth);

    const mioCaneId = user?.iMieiCani?.[0]?.id;

    useEffect(() => {
        if (mioCaneId) {
            dispatch(fetchDiscovery({ caneId: mioCaneId, intento, distanza }));
        }
    }, [dispatch, mioCaneId, intento, distanza]);

    const handleLike = (index) => {
        const caneTarget = discoveryStack[index];
        if (mioCaneId && caneTarget) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            dispatch(swipeLike({ mittenteCaneId: mioCaneId, destinatarioCaneId: caneTarget.id, intento }));
        }
    };

    const handleDislike = (index) => {
        const caneTarget = discoveryStack[index];
        if (mioCaneId && caneTarget) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            dispatch(swipeDislike({ mittenteCaneId: mioCaneId, destinatarioCaneId: caneTarget.id }));
        }
    };

    const renderHeaderFilters = () => (
        <View style={styles.filterWrapper}>
            <View style={styles.intentoContainer}>
                <TouchableOpacity
                    style={[styles.intentoBtn, intento === 'gioco' && styles.activeIntento]}
                    onPress={() => { setIntento('gioco'); setDistanza('provincia'); }}
                >
                    <Text style={[styles.intentoText, intento === 'gioco' && styles.activeText]}>🎾 Gioco</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.intentoBtn, intento === 'accoppiamento' && styles.activeIntento]}
                    onPress={() => { setIntento('accoppiamento'); setDistanza('regione'); }}
                >
                    <Text style={[styles.intentoText, intento === 'accoppiamento' && styles.activeText]}>🐕 Love</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.distanzaContainer}>
                {['provincia', 'regione', '500'].map((d) => (
                    <TouchableOpacity
                        key={d}
                        onPress={() => setDistanza(d)}
                        style={[styles.distanzaBtn, distanza === d && styles.activeDistanza]}
                    >
                        <Text style={[styles.distanzaText, distanza === d && styles.activeDistanzaText]}>
                            {d === '500' ? 'Italia' : d.charAt(0).toUpperCase() + d.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    if (loading && discoveryStack.length === 0) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0047AB" />
                <Text style={styles.statusText}>Cercando nuovi amici...</Text>
            </View>
        );
    }

    const myDogFotoUrl = user?.iMieiCani?.[0]?.fotoUrl;
    const myDogImageSource = myDogFotoUrl ? { uri: `${BASE_URL}/uploads/${myDogFotoUrl}` } : null;
    const matchImageSource = lastMatch?.fotoUrl ? { uri: `${BASE_URL}/uploads/${lastMatch.fotoUrl}` } : null;

    return (
        <View style={styles.container}>
            {renderHeaderFilters()}

            {discoveryStack.length === 0 ? (
                <View style={styles.centeredEmpty}>
                    <MaterialCommunityIcons name="dog-off" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>Nessun cane trovato con questi filtri.</Text>
                    <TouchableOpacity
                        onPress={() => dispatch(fetchDiscovery({ caneId: mioCaneId, intento, distanza }))}
                        style={styles.refreshBtn}
                    >
                        <Text style={styles.refreshBtnText}>Aggiorna</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.swiperContainer}>
                    <Swiper
                        ref={swiperRef}
                        cards={discoveryStack}
                        key={`${discoveryStack.length}-${intento}-${distanza}`}
                        renderCard={(card) => {
                            if (!card) return null;
                            const cardImageSource = card.fotoUrl
                                ? { uri: `${BASE_URL}/uploads/${card.fotoUrl}` }
                                : null;
                            return (
                                <View style={styles.card}>
                                    {cardImageSource ? (
                                        <Image source={cardImageSource} style={styles.image} />
                                    ) : (
                                        <View style={[styles.image, styles.imagePlaceholder]}>
                                            <MaterialCommunityIcons name="dog" size={60} color="#CCC" />
                                        </View>
                                    )}
                                    <View style={styles.gradientOverlay} />
                                    <View style={styles.infoContainer}>
                                        <View style={styles.row}>
                                            <Text style={styles.name}>{card.nome}, {card.eta}y</Text>
                                            <MaterialCommunityIcons
                                                name={card.sesso === 'M' ? "gender-male" : "gender-female"}
                                                size={28}
                                                color={card.sesso === 'M' ? "#90CAF9" : "#F48FB1"}
                                            />
                                        </View>
                                        <Text style={styles.breed}>{card.razza} • {card.taglia}</Text>
                                        <Text style={styles.location}>
                                            📍 {card.proprietario?.provincia || card.proprietario?.regione || "Vicino a te"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        onSwipedRight={(index) => handleLike(index)}
                        onSwipedLeft={(index) => handleDislike(index)}
                        cardIndex={0}
                        backgroundColor={'transparent'}
                        stackSize={3}
                        disableTopSwipe
                        disableBottomSwipe
                        animateCardOpacity
                        overlayLabels={{
                            left: { title: 'NOPE', style: styles.overlayLabelLeft },
                            right: { title: 'LOVE', style: styles.overlayLabelRight }
                        }}
                    />
                </View>
            )}

            <View style={styles.bottomActions}>
                <TouchableOpacity style={styles.miniBtn} onPress={() => swiperRef.current?.swipeLeft()}>
                    <MaterialCommunityIcons name="close" size={32} color="#FF5252" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.miniBtn} onPress={() => swiperRef.current?.swipeRight()}>
                    <MaterialCommunityIcons name="heart" size={32} color="#4CAF50" />
                </TouchableOpacity>
            </View>

            <Modal visible={!!lastMatch} transparent animationType="fade">
                <View style={styles.matchOverlay}>
                    <MaterialCommunityIcons name="heart-flash" size={100} color="#FF5252" />
                    <Text style={styles.matchTitle}>È un Match! 🐾</Text>
                    <View style={styles.matchPhotosContainer}>
                        {myDogImageSource && (
                            <Image source={myDogImageSource} style={[styles.matchImage, styles.myPhoto]} />
                        )}
                        {matchImageSource && (
                            <Image source={matchImageSource} style={[styles.matchImage, styles.targetPhoto]} />
                        )}
                    </View>
                    <Text style={styles.matchSubtitle}>Tu e {lastMatch?.nomeCane} siete pronti per un incontro!</Text>
                    <TouchableOpacity style={styles.matchButton} onPress={() => dispatch(clearMatch())}>
                        <Text style={styles.matchButtonText}>Continua</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusText: { marginTop: 12, fontSize: 14, color: '#666' },
    centeredEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
    emptyText: { fontSize: 15, color: '#999', marginTop: 16, marginBottom: 20, textAlign: 'center' },
    refreshBtn: { backgroundColor: '#0047AB', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 20 },
    refreshBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

    filterWrapper: { paddingTop: 50, paddingHorizontal: 20, backgroundColor: '#FFF', paddingBottom: 15, elevation: 4 },
    intentoContainer: { flexDirection: 'row', backgroundColor: '#F0F2F5', borderRadius: 25, padding: 4, marginBottom: 10 },
    intentoBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 22 },
    activeIntento: { backgroundColor: '#FFF', elevation: 2 },
    intentoText: { fontWeight: 'bold', color: '#666' },
    activeText: { color: '#0047AB' },
    distanzaContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    distanzaBtn: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, borderWidth: 1, borderColor: '#DDD' },
    activeDistanza: { backgroundColor: '#0047AB', borderColor: '#0047AB' },
    distanzaText: { fontSize: 12, color: '#666' },
    activeDistanzaText: { color: '#FFF', fontWeight: 'bold' },

    swiperContainer: { flex: 1, marginTop: -20 },
    card: { height: height * 0.60, borderRadius: 25, backgroundColor: '#FFF', overflow: 'hidden', elevation: 8 },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
    gradientOverlay: { position: 'absolute', bottom: 0, width: '100%', height: '50%', backgroundColor: 'rgba(0,0,0,0.35)' },
    infoContainer: { position: 'absolute', bottom: 25, left: 20, right: 20 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    name: { fontSize: 30, fontWeight: '900', color: '#FFF' },
    breed: { fontSize: 16, color: '#EEE', marginTop: 4 },
    location: { fontSize: 14, color: '#FFF', marginTop: 8, fontWeight: 'bold' },

    bottomActions: { flexDirection: 'row', justifyContent: 'center', gap: 30, paddingBottom: 40 },
    miniBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5 },

    overlayLabelLeft: {
        label: { backgroundColor: '#FF5252', color: 'white', fontSize: 24, fontWeight: 'bold' },
        wrapper: { flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', marginTop: 30, marginLeft: -30 }
    },
    overlayLabelRight: {
        label: { backgroundColor: '#4CAF50', color: 'white', fontSize: 24, fontWeight: 'bold' },
        wrapper: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', marginTop: 30, marginLeft: 30 }
    },

    matchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    matchTitle: { color: '#FFF', fontSize: 36, fontWeight: '900', marginTop: 20 },
    matchPhotosContainer: { flexDirection: 'row', height: 160, alignItems: 'center', marginVertical: 40 },
    matchImage: { width: 140, height: 140, borderRadius: 70, borderWidth: 4, borderColor: '#FFF' },
    myPhoto: { marginRight: -20 },
    targetPhoto: { marginLeft: -20 },
    matchSubtitle: { color: '#EEE', fontSize: 16, textAlign: 'center', marginBottom: 30 },
    matchButton: { backgroundColor: '#FF5252', paddingHorizontal: 50, paddingVertical: 15, borderRadius: 30 },
    matchButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16 },
});

export default DiscoveryScreen;

import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Dimensions, Image,
  Modal, PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
  useWindowDimensions
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { clearMatch, fetchDiscovery, resetInterazioni, swipeDislike, swipeLike } from '../store/slices/interazioneSlice';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.25 * width;
const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const HomeScreen = ({ navigation }) => {
  const { width: winW, height: winH } = useWindowDimensions();
  const CARD_W = Platform.OS === 'web' ? Math.min(winW * 0.85, 360) : width * 0.9;
  const CARD_H = Platform.OS === 'web' ? Math.min(winH * 0.35, 250) : height * 0.35;

  const dispatch = useDispatch();
  const { discoveryStack, loading, lastMatch } = useSelector((state) => state.interazioni);
  const { user } = useSelector((state) => state.auth);

  const [intento, setIntento] = useState('gioco');
  const [distanzaMax, setDistanzaMax] = useState(50);
  const [distanzaTemp, setDistanzaTemp] = useState(50);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [matchedDog, setMatchedDog] = useState(null);

  const mioCane = user?.iMieiCani?.[0];
  const mioCaneId = mioCane?.id;
  const mioCaneEta = mioCane?.eta ? parseFloat(mioCane.eta) : 0;
  const isTooYoung = mioCaneEta < 1;

  const position = useRef(new Animated.ValueXY()).current;
  const likedCardRef = useRef(null);

  const handleSetIntento = (nuovoIntento) => {
    if (nuovoIntento === 'accoppiamento' && isTooYoung) {
      Alert.alert("Ancora un po' di pazienza! 🐾", `${mioCane?.nome} è ancora un cucciolo.`);
      return;
    }
    setIntento(nuovoIntento);
  };

  const onSwipeCompleteRef = useRef(null);

  const onSwipeComplete = useCallback((direction) => {
    const item = discoveryStack[0];
    if (!item || !mioCaneId) return;
    if (direction === 'right') {
      likedCardRef.current = item;
      dispatch(swipeLike({ mittenteCaneId: mioCaneId, destinatarioCaneId: item.id, intento }));
    } else {
      dispatch(swipeDislike({ mittenteCaneId: mioCaneId, destinatarioCaneId: item.id }));
    }
    position.setValue({ x: 0, y: 0 });
  }, [discoveryStack, mioCaneId, intento, dispatch, position]);

  useEffect(() => {
    onSwipeCompleteRef.current = onSwipeComplete;
  }, [onSwipeComplete]);

  const forceSwipe = useCallback((direction) => {
    const x = direction === 'right' ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: false
    }).start(() => onSwipeCompleteRef.current?.(direction));
  }, [position]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
  }, [position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) onSwipeCompleteRef.current?.('right');
        else if (gesture.dx < -SWIPE_THRESHOLD) onSwipeCompleteRef.current?.('left');
        else resetPosition();
      }
    })
  ).current;

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ['-20deg', '0deg', '20deg'],
      extrapolate: 'clamp'
    });
    return { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] };
  };

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const prevUserIdRef = useRef(null);
  useEffect(() => {
    if (user?.id && prevUserIdRef.current !== user.id) {
      dispatch(resetInterazioni());
    }
    prevUserIdRef.current = user?.id ?? null;
  }, [user?.id, dispatch]);

  useEffect(() => {
    if (mioCaneId) {
      dispatch(fetchDiscovery({ caneId: mioCaneId, intento, distanza: distanzaMax }));
    }
  }, [dispatch, mioCaneId, user?.id, intento, distanzaMax]);

  // Auto-fetch when only 1 card left
  useEffect(() => {
    if (mioCaneId && !loading && discoveryStack.length === 1) {
      dispatch(fetchDiscovery({ caneId: mioCaneId, intento, distanza: distanzaMax }));
    }
  }, [discoveryStack.length, mioCaneId, loading, intento, distanzaMax, dispatch]);

  useEffect(() => {
    if (lastMatch && likedCardRef.current) {
      setMatchedDog(likedCardRef.current);
      likedCardRef.current = null;
    }
  }, [lastMatch]);

  const handleCloseMatchModal = () => {
    setMatchedDog(null);
    dispatch(clearMatch());
  };

  const caneCorrente = discoveryStack[0];
  const caneSuccessivo = discoveryStack[1];
  const imageUri = caneCorrente?.fotoUrl ? `${BASE_URL}/uploads/${caneCorrente.fotoUrl}` : null;
  const imageUriNext = caneSuccessivo?.fotoUrl ? `${BASE_URL}/uploads/${caneSuccessivo.fotoUrl}` : null;

  const handleApplyFilter = () => {
    setDistanzaMax(distanzaTemp);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        <View style={styles.headerGreeting}>
          <Text style={styles.greeting}>Ciao, {user?.nome}! 👋</Text>
          <Text style={styles.subtitle}>Trova nuovi amici per {mioCane?.nome}</Text>
        </View>

        <TouchableOpacity style={styles.snoutBotCard} onPress={() => navigation.navigate('SnoutChat')}>
          <View style={styles.snoutBotIconContainer}>
            <Image source={require('../../assets/images/snoutbot-ai.png')} style={styles.snoutBotImage} />
          </View>
          <View>
            <Text style={styles.snoutBotTitle}>Chiedi a SnoutBot AI</Text>
            <Text style={styles.snoutBotSub}>Consigli e match intelligenti</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#0047AB" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <View style={styles.topActionsRow}>
          <View style={styles.modeSelectorSmall}>
            <TouchableOpacity
              style={[styles.modeBtn, intento === 'gioco' && styles.modeBtnActive]}
              onPress={() => handleSetIntento('gioco')}
            >
              <MaterialCommunityIcons name="paw" size={18} color={intento === 'gioco' ? "#FFF" : "#666"} />
              <Text style={[styles.modeText, intento === 'gioco' && styles.modeTextActive]}>Gioco</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, intento === 'accoppiamento' && styles.modeBtnActive, isTooYoung && styles.modeBtnDisabled]}
              onPress={() => handleSetIntento('accoppiamento')}
            >
              <MaterialCommunityIcons name={isTooYoung ? "lock-outline" : "heart-multiple"} size={18} color={intento === 'accoppiamento' ? "#FFF" : "#e71010"} />
              <Text style={[styles.modeText, intento === 'accoppiamento' && styles.modeTextActive]}>Amore</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => { setDistanzaTemp(distanzaMax); setIsModalVisible(true); }}>
            <MaterialCommunityIcons name="tune-variant" size={24} color="#0047AB" />
          </TouchableOpacity>
        </View>

        <View style={[styles.mainArea, { height: CARD_H + 20 }]}>
          {loading && discoveryStack.length === 0 ? (
            <ActivityIndicator size="large" color="#0047AB" />
          ) : discoveryStack.length > 0 ? (
            <>
              {/* Back card — peek */}
              {caneSuccessivo && (
                <View style={[styles.card, styles.backCard, { width: CARD_W * 0.95, height: CARD_H }]}>
                  {imageUriNext ? (
                    <Image source={{ uri: imageUriNext }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                      <MaterialCommunityIcons name="dog" size={60} color="#CCC" />
                    </View>
                  )}
                  <View style={styles.infoContainer}>
                    <Text style={styles.name}>{caneSuccessivo.nome}, {caneSuccessivo.eta} anni</Text>
                    <Text style={styles.razza}>{caneSuccessivo.razza}</Text>
                  </View>
                </View>
              )}

              {/* Front card */}
              <Animated.View
                style={[getCardStyle(), styles.card, { width: CARD_W, height: CARD_H, position: 'absolute' }]}
                {...panResponder.panHandlers}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]}>
                    <MaterialCommunityIcons name="dog" size={60} color="#CCC" />
                  </View>
                )}

                <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, { opacity: likeOpacity }]}>
                  <Text style={styles.likeLabel}>{intento === 'accoppiamento' ? '❤️' : '🐾'} LIKE</Text>
                </Animated.View>
                <Animated.View style={[styles.swipeOverlay, styles.nopeOverlay, { opacity: nopeOpacity }]}>
                  <Text style={styles.nopeLabel}>✕ NOPE</Text>
                </Animated.View>

                <View style={styles.infoContainer}>
                  <Text style={styles.name}>{caneCorrente.nome}, {caneCorrente.eta} anni</Text>
                  <Text style={styles.razza}>{caneCorrente.razza}</Text>
                  {caneCorrente.descrizione ? (
                    <Text style={styles.bio} numberOfLines={2}>{caneCorrente.descrizione}</Text>
                  ) : null}
                </View>
              </Animated.View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="dog-side" size={90} color="#DDD" />
              <Text style={styles.emptyTitle}>Nessun cane nelle vicinanze</Text>
              <Text style={styles.emptyText}>
                Prova ad aumentare il raggio di ricerca o torna più tardi!
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => { setDistanzaTemp(distanzaMax); setIsModalVisible(true); }}>
                <MaterialCommunityIcons name="tune-variant" size={16} color="#0047AB" />
                <Text style={styles.emptyBtnText}>Cambia raggio</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {discoveryStack.length > 0 && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.dislikeBtn]} onPress={() => forceSwipe('left')}>
              <MaterialCommunityIcons name="close-thick" size={35} color="#FF5252" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.likeBtn, { borderColor: intento === 'gioco' ? '#4CAF50' : '#E91E63' }]}
              onPress={() => forceSwipe('right')}
            >
              <MaterialCommunityIcons
                name={intento === 'gioco' ? "paw" : "heart"}
                size={35}
                color={intento === 'gioco' ? "#4CAF50" : "#E91E63"}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Filter modal */}
      <Modal visible={isModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Raggio di Ricerca</Text>
            <Text style={styles.modalValue}>{Math.round(distanzaTemp)} km</Text>
            <Slider
              style={styles.slider}
              minimumValue={5}
              maximumValue={200}
              step={5}
              value={distanzaTemp}
              onValueChange={setDistanzaTemp}
              minimumTrackTintColor="#0047AB"
              maximumTrackTintColor="#DDD"
              thumbTintColor="#0047AB"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>5 km</Text>
              <Text style={styles.sliderLabel}>200 km</Text>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilter}>
              <Text style={styles.applyBtnText}>APPLICA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Match modal */}
      <Modal visible={!!matchedDog} animationType="fade" transparent>
        <View style={styles.matchOverlay}>
          <View style={styles.matchContent}>
            <Text style={styles.matchEmoji}>🎉</Text>
            <Text style={styles.matchTitle}>È un Match!</Text>
            <Text style={styles.matchSub}>
              {mioCane?.nome} e {matchedDog?.nome} si sono piaciuti!
            </Text>
            {matchedDog?.fotoUrl ? (
              <Image
                source={{ uri: `${BASE_URL}/uploads/${matchedDog.fotoUrl}` }}
                style={styles.matchAvatar}
              />
            ) : (
              <View style={[styles.matchAvatar, styles.matchAvatarPlaceholder]}>
                <MaterialCommunityIcons name="dog" size={50} color="#CCC" />
              </View>
            )}
            <TouchableOpacity
              style={styles.matchChatBtn}
              onPress={() => { handleCloseMatchModal(); navigation.navigate('Messaggi'); }}
            >
              <MaterialCommunityIcons name="message-text" size={18} color="#FFF" />
              <Text style={styles.matchChatBtnText}>Vai alla Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.matchCloseBtn} onPress={handleCloseMatchModal}>
              <Text style={styles.matchCloseBtnText}>Continua a esplorare</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 10 : 40, paddingBottom: 20 },
  headerGreeting: { marginBottom: 10 },
  greeting: { fontSize: 24, fontWeight: "900", color: "#1A1A1A" },
  subtitle: { fontSize: 14, color: "#666" },
  snoutBotCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD',
    padding: 12, borderRadius: 20, marginBottom: 15,
    borderWidth: 1, borderColor: '#BBDEFB', elevation: 2,
  },
  snoutBotIconContainer: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff',
    marginRight: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#0047AB',
  },
  snoutBotImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  snoutBotTitle: { fontWeight: '800', color: '#0047AB', fontSize: 15 },
  snoutBotSub: { fontSize: 11, color: '#546E7A' },
  topActionsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  modeSelectorSmall: { flexDirection: 'row', backgroundColor: '#EEE', borderRadius: 20, padding: 4, flex: 1, marginRight: 12 },
  modeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 18 },
  modeBtnActive: { backgroundColor: '#0047AB' },
  modeBtnDisabled: { opacity: 0.3 },
  modeText: { marginLeft: 6, fontWeight: '700', color: '#666', fontSize: 12 },
  modeTextActive: { color: '#FFF' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#FFF', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  mainArea: { width: '100%', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginVertical: 10 },
  card: {
    borderRadius: 30, overflow: 'hidden', elevation: 8, backgroundColor: '#FFF',
    ...Platform.select({ web: { boxShadow: "0px 0px 10px rgba(0,0,0,0.2)" }, default: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 } }),
  },
  backCard: {
    position: 'absolute',
    bottom: 0,
    zIndex: 0,
    transform: [{ scaleX: 0.95 }],
    elevation: 4,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  swipeOverlay: {
    position: 'absolute', top: 28, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 3, zIndex: 10,
  },
  likeOverlay: {
    left: 18, borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.12)',
    transform: [{ rotate: '-15deg' }],
  },
  nopeOverlay: {
    right: 18, borderColor: '#FF5252', backgroundColor: 'rgba(255,82,82,0.12)',
    transform: [{ rotate: '15deg' }],
  },
  likeLabel: { fontSize: 24, fontWeight: '900', color: '#4CAF50' },
  nopeLabel: { fontSize: 24, fontWeight: '900', color: '#FF5252' },
  infoContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  name: { fontSize: 22, fontWeight: '900', color: '#FFF', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  razza: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  bio: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 5, lineHeight: 17 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', width: '100%', paddingVertical: 20 },
  btn: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF',
    justifyContent: 'center', alignItems: 'center', elevation: 5, borderWidth: 2,
    ...Platform.select({ web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.15)" }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84 } }),
  },
  dislikeBtn: { borderColor: '#FF5252' },
  likeBtn: {},
  emptyContainer: { alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#555', marginTop: 16 },
  emptyText: { color: '#999', fontSize: 14, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', marginTop: 20,
    backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: '#0047AB', gap: 6,
  },
  emptyBtnText: { color: '#0047AB', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  modalValue: { fontSize: 32, fontWeight: '900', color: '#0047AB', marginBottom: 8 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  sliderLabel: { fontSize: 11, color: '#999' },
  applyBtn: { backgroundColor: '#0047AB', padding: 14, borderRadius: 14, width: '100%', alignItems: 'center', marginBottom: 10 },
  applyBtnText: { color: '#FFF', fontWeight: '900', fontSize: 15 },
  cancelBtn: { padding: 8 },
  cancelBtnText: { color: '#999', fontWeight: '600' },
  matchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center' },
  matchContent: { width: '85%', backgroundColor: '#FFF', borderRadius: 28, padding: 28, alignItems: 'center' },
  matchEmoji: { fontSize: 52, marginBottom: 8 },
  matchTitle: { fontSize: 30, fontWeight: '900', color: '#E91E63', marginBottom: 6 },
  matchSub: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 20 },
  matchAvatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 24 },
  matchAvatarPlaceholder: { backgroundColor: '#EEE', justifyContent: 'center', alignItems: 'center' },
  matchChatBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0047AB',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28, gap: 8, marginBottom: 12,
  },
  matchChatBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  matchCloseBtn: { padding: 8 },
  matchCloseBtnText: { color: '#999', fontWeight: '600', fontSize: 14 },
});

export default HomeScreen;

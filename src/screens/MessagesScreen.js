import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import api from '../services/api';
import socket from '../services/socket';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const MOTIVI = [
  { key: 'comportamento_inappropriato', label: 'Comportamento inappropriato' },
  { key: 'spam',                        label: 'Spam o pubblicità' },
  { key: 'profilo_falso',               label: 'Profilo falso' },
  { key: 'maltrattamento_animali',      label: 'Maltrattamento animali' },
  { key: 'altro',                       label: 'Altro' },
];

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessagesScreen = ({ route, navigation }) => {
  const { interazioneId, destinatarioNome } = route.params || {};

  const user = useSelector((state) => state.auth.user);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSegnalaModal, setShowSegnalaModal] = useState(false);
  const [motivoSelezionato, setMotivoSelezionato] = useState(null);
  const [descrizione, setDescrizione] = useState('');
  const [segnalaLoading, setSegnalaLoading] = useState(false);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  if (!interazioneId) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 50 }}>
          Caricamento chat non riuscito... 🐾
        </Text>
      </View>
    );
  }

  useEffect(() => {
    socket.emit('join_chat', interazioneId);

    socket.on('nuovo_messaggio', (nuovoMessaggio) => {
      if (nuovoMessaggio.mittenteUtenteId !== user?.id) {
        setMessages((prev) => [nuovoMessaggio, ...prev]);
      }
    });

    socket.on('user_typing', ({ isTyping: typing }) => {
      setIsTyping(typing);
    });

    return () => {
      socket.emit('leave_chat', interazioneId);
      socket.off('nuovo_messaggio');
      socket.off('user_typing');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [interazioneId, user?.id]);

  useEffect(() => {
    const fetchCronologia = async () => {
      try {
        const { data } = await api.get(`/messaggi/${interazioneId}`);
        if (data.successo) {
          // API returns oldest-first; reverse for inverted FlatList (newest first)
          setMessages([...data.chat].reverse());
        }
      } catch {}
    };
    fetchCronologia();

    if (destinatarioNome) {
      navigation.setOptions({
        title: destinatarioNome,
        headerRight: () => (
          <TouchableOpacity onPress={openSegnalaModal} style={{ marginRight: 16 }}>
            <MaterialCommunityIcons name="flag-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        ),
      });
    }
  }, [interazioneId]);

  const handleInputChange = (text) => {
    setInputText(text);
    if (text.length > 0) {
      socket.emit('typing', { interazioneId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { interazioneId, isTyping: false });
      }, 2000);
    }
  };

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const optimistic = {
      id: `tmp-${Date.now()}`,
      contenuto: text,
      created_at: new Date().toISOString(),
      mittenteUtenteId: user?.id,
      mittente: { nome: user?.nome, fotoUrl: user?.fotoUrl },
    };

    setMessages((prev) => [optimistic, ...prev]);
    setInputText('');
    socket.emit('typing', { interazioneId, isTyping: false });
    setIsSending(true);

    try {
      await api.post('/messaggi', { interazioneId, contenuto: text });
    } catch {
      // Keep the optimistic message even on failure for UX
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, interazioneId, user]);

  const openSegnalaModal = () => {
    setMotivoSelezionato(null);
    setDescrizione('');
    setShowSegnalaModal(true);
  };

  const handleInviaSegnalazione = async () => {
    if (!motivoSelezionato) {
      Alert.alert('Seleziona un motivo', 'Devi scegliere un motivo per la segnalazione.');
      return;
    }
    setSegnalaLoading(true);
    try {
      await api.post('/segnalazioni', {
        interazioneId,
        motivo: motivoSelezionato,
        descrizione: descrizione.trim() || undefined,
      });
      setShowSegnalaModal(false);
      Alert.alert('Segnalazione inviata', 'La tua segnalazione è stata ricevuta e verrà esaminata dal team.');
    } catch (err) {
      const msg = err?.response?.data?.errore || 'Impossibile inviare la segnalazione.';
      Alert.alert('Errore', msg);
    } finally {
      setSegnalaLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.mittenteUtenteId === user?.id;
    const avatarUri = item.mittente?.fotoUrl
      ? { uri: `${BASE_URL}/uploads/${item.mittente.fotoUrl}` }
      : null;

    return (
      <View style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}>
        {!isMe && (
          <View style={styles.avatarSmall}>
            {avatarUri ? (
              <Image source={avatarUri} style={styles.avatarSmallImg} />
            ) : (
              <MaterialCommunityIcons name="dog" size={20} color="#CCC" />
            )}
          </View>
        )}
        <View style={isMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft}>
          <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextRight]}>
              {item.contenuto}
            </Text>
          </View>
          <Text style={[styles.timestamp, isMe ? styles.timestampRight : styles.timestampLeft]}>
            {formatTime(item.created_at || item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Modal segnalazione utente */}
      <Modal
        visible={showSegnalaModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSegnalaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Segnala utente</Text>
              <TouchableOpacity onPress={() => setShowSegnalaModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Segnala {destinatarioNome} al team di moderazione. Verrai contattato se necessario.
            </Text>

            <Text style={styles.modalLabel}>Motivo *</Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {MOTIVI.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.motivoOption, motivoSelezionato === m.key && styles.motivoOptionActive]}
                  onPress={() => setMotivoSelezionato(m.key)}
                >
                  <MaterialCommunityIcons
                    name={motivoSelezionato === m.key ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={motivoSelezionato === m.key ? '#0047AB' : '#AAA'}
                  />
                  <Text style={[styles.motivoLabel, motivoSelezionato === m.key && { color: '#0047AB', fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.modalLabel, { marginTop: 14 }]}>Dettagli (opzionale)</Text>
            <TextInput
              style={styles.descrizioneInput}
              placeholder="Descrivi brevemente il problema..."
              placeholderTextColor="#BBB"
              value={descrizione}
              onChangeText={setDescrizione}
              multiline
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.inviaBtn, (!motivoSelezionato || segnalaLoading) && { opacity: 0.5 }]}
              onPress={handleInviaSegnalazione}
              disabled={!motivoSelezionato || segnalaLoading}
            >
              <MaterialCommunityIcons name="flag" size={18} color="#FFF" />
              <Text style={styles.inviaBtnText}>
                {segnalaLoading ? 'Invio...' : 'Invia segnalazione'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id?.toString() ?? item.created_at}
          inverted
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {isTyping && (
          <View style={styles.typingRow}>
            <Text style={styles.typingText}>{destinatarioNome} sta scrivendo... 🐾</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor="#BBB"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <MaterialCommunityIcons name="send-circle" size={44} color={inputText.trim() && !isSending ? '#0047AB' : '#B0C4DE'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  flex: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  messageRow: { flexDirection: 'row', marginVertical: 3, alignItems: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarSmallImg: { width: 32, height: 32, borderRadius: 16 },
  bubbleWrapLeft: { maxWidth: '75%', alignItems: 'flex-start' },
  bubbleWrapRight: { maxWidth: '75%', alignItems: 'flex-end' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  bubbleLeft: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1.5,
    borderColor: '#0047AB',
  },
  bubbleRight: {
    backgroundColor: '#0047AB',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 15, color: '#1A1A1A', lineHeight: 21 },
  bubbleTextRight: { color: '#FFF' },
  timestamp: { fontSize: 10, color: '#AAA', marginTop: 2 },
  timestampLeft: { marginLeft: 4 },
  timestampRight: { marginRight: 4 },
  typingRow: { paddingHorizontal: 16, paddingBottom: 6 },
  typingText: { fontSize: 12, color: '#0047AB', fontStyle: 'italic' },
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
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 4,
  },
  sendBtn: { justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A' },
  modalSubtitle: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  modalLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  motivoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    backgroundColor: '#FFF',
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  motivoOptionActive: { borderColor: '#0047AB', backgroundColor: '#EEF3FF' },
  motivoLabel: { fontSize: 14, color: '#333' },
  descrizioneInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inviaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 16,
    gap: 8,
  },
  inviaBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

export default MessagesScreen;

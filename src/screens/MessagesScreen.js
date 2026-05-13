import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Bubble, GiftedChat, Send } from 'react-native-gifted-chat';
import { useSelector } from 'react-redux';
import api from '../services/api';
import socket from '../services/socket';

const MOTIVI = [
  { key: 'comportamento_inappropriato', label: 'Comportamento inappropriato' },
  { key: 'spam',                        label: 'Spam o pubblicità' },
  { key: 'profilo_falso',               label: 'Profilo falso' },
  { key: 'maltrattamento_animali',      label: 'Maltrattamento animali' },
  { key: 'altro',                       label: 'Altro' },
];

const MessagesScreen = ({ route, navigation }) => {
  const { interazioneId, destinatarioNome } = route.params || {};

  const user = useSelector((state) => state.auth.user);

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSegnalaModal, setShowSegnalaModal] = useState(false);
  const [motivoSelezionato, setMotivoSelezionato] = useState(null);
  const [descrizione, setDescrizione] = useState('');
  const [segnalaLoading, setSegnalaLoading] = useState(false);

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

  const transformForGiftedChat = (msg) => ({
    _id: msg.id,
    text: msg.contenuto,
    createdAt: new Date(msg.created_at || msg.createdAt),
    user: {
      _id: msg.mittenteUtenteId,
      name: msg.mittente?.nome || 'Utente',
      avatar: msg.mittente?.fotoUrl || null,
    },
  });

  useEffect(() => {
    socket.emit('join_chat', interazioneId);

    socket.on('nuovo_messaggio', (nuovoMessaggio) => {
      if (nuovoMessaggio.mittenteUtenteId !== user?.id) {
        setMessages((prev) => GiftedChat.append(prev, [transformForGiftedChat(nuovoMessaggio)]));
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

  const handleTyping = (text) => {
    if (text.length > 0) {
      socket.emit('typing', { interazioneId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { interazioneId, isTyping: false });
      }, 2000);
    }
  };

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

  useEffect(() => {
    const fetchCronologia = async () => {
      try {
        const { data } = await api.get(`/messaggi/${interazioneId}`);
        if (data.successo) {
          setMessages(data.chat.map(transformForGiftedChat));
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

  const onSend = useCallback(async (newMessages = []) => {
    const msg = newMessages[0];
    setMessages((prev) => GiftedChat.append(prev, newMessages));
    socket.emit('typing', { interazioneId, isTyping: false });
    try {
      await api.post('/messaggi', { interazioneId, contenuto: msg.text });
    } catch {}
  }, [interazioneId]);

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: '#0047AB', borderRadius: 20, marginBottom: 5 },
        left: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 5, borderWidth: 1.5, borderColor: '#0047AB' },
      }}
      textStyle={{
        right: { color: '#FFF', fontSize: 15 },
        left: { color: '#1A1A1A', fontSize: 15 },
      }}
    />
  );

  const renderSend = (props) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <MaterialCommunityIcons name="send-circle" size={44} color="#0047AB" />
    </Send>
  );

  const renderFooter = () => {
    if (isTyping) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.typingText}>{destinatarioNome} sta scrivendo... 🐾</Text>
        </View>
      );
    }
    return null;
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

      <GiftedChat
        messages={messages}
        onSend={onSend}
        onInputTextChanged={handleTyping}
        user={{
          _id: user?.id || 1,
          name: user?.nome,
          avatar: user?.fotoUrl || null
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderFooter={renderFooter}
        showUserAvatar={true}
        placeholder="Scrivi un messaggio..."
        isTyping={isTyping}
        scrollToBottom
        listViewProps={{ showsVerticalScrollIndicator: false }}
        textInputStyle={styles.textInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  sendContainer: { justifyContent: 'center', alignItems: 'center', marginRight: 8, height: '100%' },
  textInput: {
    backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E8E8E8',
    paddingHorizontal: 15, marginTop: 8, marginBottom: 5, marginLeft: 10, fontSize: 16
  },
  footerContainer: {
    marginTop: 5,
    marginLeft: 15,
    marginBottom: 10,
  },
  typingText: {
    fontSize: 12,
    color: '#0047AB',
    fontStyle: 'italic',
  },
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

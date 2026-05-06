import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Bubble, GiftedChat, Send } from 'react-native-gifted-chat';
import { useSelector } from 'react-redux';
import api from '../services/api';
import socket from '../services/socket';

const MessagesScreen = ({ route, navigation }) => {
  const { interazioneId, destinatarioNome } = route.params || {};

  const user = useSelector((state) => state.auth.user);

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

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
    if (destinatarioNome) navigation.setOptions({ title: destinatarioNome });
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
});

export default MessagesScreen;

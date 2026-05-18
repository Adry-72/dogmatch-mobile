import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

const ROLE_LABEL = {
  privato: 'Privato',
  allevatore: 'Allevatore',
  appassionato: 'Appassionato',
  admin: 'Admin',
};

const RUOLI = ['privato', 'allevatore', 'appassionato', 'admin'];

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#0047AB" style={{ marginRight: 10 }} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

function DogCard({ dog }) {
  const fotoUri = dog.fotoUrl ? `${BASE_URL}/uploads/${dog.fotoUrl}` : null;
  return (
    <View style={styles.dogCard}>
      {fotoUri ? (
        <Image source={{ uri: fotoUri }} style={styles.dogPhoto} />
      ) : (
        <View style={[styles.dogPhoto, styles.dogPhotoPlaceholder]}>
          <MaterialCommunityIcons name="dog" size={30} color="#CCC" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.dogName}>{dog.nome}</Text>
        <Text style={styles.dogBreed}>{dog.razza || 'Razza non specificata'}</Text>
        {dog.isSegnalato && (
          <View style={styles.flagBadge}>
            <Text style={styles.flagBadgeText}>Segnalato</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AdminUserDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const [utente, setUtente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadUtente = useCallback(async () => {
    try {
      const res = await adminApi.getSingoloUtente(userId);
      setUtente(res.data.utente);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare i dati dell\'utente.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadUtente(); }, [loadUtente]);

  const handleToggleVerifica = async () => {
    setActionLoading(true);
    try {
      const nuovoStato = !utente.isVerificato;
      await adminApi.toggleVerifica(utente.id, nuovoStato);
      setUtente((u) => ({ ...u, isVerificato: nuovoStato }));
    } catch {
      Alert.alert('Errore', 'Operazione non riuscita.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlocco = () => {
    if (utente.ruolo === 'admin') {
      Alert.alert('Operazione negata', 'Non puoi bloccare un altro amministratore.');
      return;
    }
    const bloccato = utente.isBanned || utente.isBloccato;
    Alert.alert(
      bloccato ? 'Sblocca utente' : 'Blocca utente',
      `Sei sicuro di voler ${bloccato ? 'sbloccare' : 'bloccare'} ${utente.nome}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: bloccato ? 'Sblocca' : 'Blocca',
          style: bloccato ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await adminApi.toggleBlocco(utente.id);
              setUtente((u) => ({ ...u, isBanned: res.data.isBloccato, isBloccato: res.data.isBloccato }));
            } catch {
              Alert.alert('Errore', 'Operazione non riuscita.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCambiaRuolo = () => {
    if (utente.ruolo === 'admin') {
      Alert.alert('Operazione negata', 'Non puoi cambiare il ruolo di un amministratore.');
      return;
    }
    Alert.alert(
      'Cambia Ruolo',
      `Ruolo attuale: ${ROLE_LABEL[utente.ruolo]}\nScegli il nuovo ruolo:`,
      [
        ...RUOLI.filter((r) => r !== utente.ruolo && r !== 'admin').map((r) => ({
          text: ROLE_LABEL[r],
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.cambiaRuolo(utente.id, r);
              setUtente((u) => ({ ...u, ruolo: r }));
            } catch {
              Alert.alert('Errore', 'Impossibile cambiare il ruolo.');
            } finally {
              setActionLoading(false);
            }
          },
        })),
        { text: 'Annulla', style: 'cancel' },
      ]
    );
  };

  const handleElimina = () => {
    if (utente.ruolo === 'admin') {
      Alert.alert('Operazione negata', 'Non puoi eliminare un amministratore.');
      return;
    }
    Alert.alert(
      'Elimina Utente',
      `Questa operazione è irreversibile. Eliminare ${utente.nome} ${utente.cognome} e tutti i suoi dati?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.eliminaUtente(utente.id);
              Alert.alert('Fatto', 'Utente eliminato correttamente.');
              navigation.goBack();
            } catch {
              Alert.alert('Errore', 'Impossibile eliminare l\'utente.');
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  if (!utente) return null;

  const isBloccato = utente.isBanned || utente.isBloccato;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={48} color="#AAA" />
        </View>
        <Text style={styles.nome}>{utente.nome} {utente.cognome}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.badge, { backgroundColor: '#0047AB' }]}>
            <Text style={styles.badgeText}>{ROLE_LABEL[utente.ruolo] || utente.ruolo}</Text>
          </View>
          {utente.isVerificato && (
            <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
              <Text style={styles.badgeText}>Verificato</Text>
            </View>
          )}
          {isBloccato && (
            <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.badgeText}>Bloccato</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <InfoRow icon="email-outline" label="Email" value={utente.email} />
        <InfoRow icon="phone-outline" label="Telefono" value={utente.telefono} />
        <InfoRow icon="map-marker-outline" label="Provincia" value={utente.provincia} />
        <InfoRow icon="calendar-outline" label="Iscritto il" value={new Date(utente.createdAt).toLocaleDateString('it-IT')} />
      </View>

      {utente.iMieiCani?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            Cani ({utente.iMieiCani.length})
          </Text>
          {utente.iMieiCani.map((dog) => <DogCard key={dog.id} dog={dog} />)}
        </>
      )}

      <Text style={styles.sectionTitle}>Azioni</Text>

      {actionLoading && (
        <ActivityIndicator size="small" color="#0047AB" style={{ marginBottom: 12 }} />
      )}

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: '#34C759' }]}
        onPress={handleToggleVerifica}
        disabled={actionLoading}
      >
        <MaterialCommunityIcons
          name={utente.isVerificato ? 'shield-check' : 'shield-outline'}
          size={20}
          color="#34C759"
        />
        <Text style={[styles.actionBtnText, { color: '#34C759' }]}>
          {utente.isVerificato ? 'Rimuovi Verifica' : 'Verifica Utente'}
        </Text>
      </TouchableOpacity>

      {utente.ruolo !== 'admin' && (
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#8B5CF6' }]}
          onPress={handleCambiaRuolo}
          disabled={actionLoading}
        >
          <MaterialCommunityIcons name="account-convert-outline" size={20} color="#8B5CF6" />
          <Text style={[styles.actionBtnText, { color: '#8B5CF6' }]}>
            Cambia Ruolo ({ROLE_LABEL[utente.ruolo]})
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: isBloccato ? '#FF9500' : '#FF3B30' }]}
        onPress={handleToggleBlocco}
        disabled={actionLoading}
      >
        <MaterialCommunityIcons
          name={isBloccato ? 'lock-open-outline' : 'lock-outline'}
          size={20}
          color={isBloccato ? '#FF9500' : '#FF3B30'}
        />
        <Text style={[styles.actionBtnText, { color: isBloccato ? '#FF9500' : '#FF3B30' }]}>
          {isBloccato ? 'Sblocca Utente' : 'Blocca Utente'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: '#FF3B30', backgroundColor: '#FFF0EE' }]}
        onPress={handleElimina}
        disabled={actionLoading}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
        <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Elimina Utente</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  content: { padding: 20, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  header: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0E8E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  nome: { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  statusRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoLabel: { fontSize: 13, color: '#888', marginRight: 4, width: 70 },
  infoValue: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  dogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  dogPhoto: { width: 54, height: 54, borderRadius: 10, marginRight: 12 },
  dogPhotoPlaceholder: { backgroundColor: '#F0E8E0', justifyContent: 'center', alignItems: 'center' },
  dogName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  dogBreed: { fontSize: 13, color: '#888' },
  flagBadge: { backgroundColor: '#FF3B30', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  flagBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 10,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', marginLeft: 10 },
});

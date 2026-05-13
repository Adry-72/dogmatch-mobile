import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

function InfoRow({ icon, label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color="#0047AB" style={{ marginRight: 10 }} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{String(value)}</Text>
    </View>
  );
}

function Badge({ label, color }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function AdminDogDetailScreen({ route, navigation }) {
  const { dogId } = route.params;
  const [cane, setCane] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCane = useCallback(async () => {
    try {
      const res = await adminApi.getSingoloCane(dogId);
      setCane(res.data.cane);
    } catch {
      Alert.alert('Errore', "Impossibile caricare i dati del cane.");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [dogId]);

  useEffect(() => { loadCane(); }, [loadCane]);

  const handleVerifyPedigree = () => {
    const approva = !cane.isVerificato;
    Alert.alert(
      approva ? 'Approva pedigree' : 'Rimuovi verifica pedigree',
      approva
        ? `Approvare il pedigree di "${cane.nome}"?`
        : `Rimuovere la verifica del pedigree di "${cane.nome}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: approva ? 'Approva' : 'Rimuovi',
          style: approva ? 'default' : 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await adminApi.verificaPedigree(cane.id, approva);
              setCane((c) => ({ ...c, isVerificato: res.data.isVerificato }));
            } catch (err) {
              Alert.alert('Errore', err?.response?.data?.errore || 'Operazione non riuscita.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleFlag = () => {
    Alert.alert(
      cane.isSegnalato ? 'Rimuovi segnalazione' : 'Segnala cane',
      `${cane.isSegnalato ? 'Rimuovere la segnalazione' : 'Segnalare'} "${cane.nome}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: cane.isSegnalato ? 'Rimuovi' : 'Segnala',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await adminApi.toggleSegnalazione(cane.id);
              setCane((c) => ({ ...c, isSegnalato: res.data.isSegnalato }));
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

  const handleViewPedigree = async () => {
    const url = `${BASE_URL}/uploads/${cane.pedigreeUrl}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Errore', 'Impossibile aprire il documento pedigree.');
    }
  };

  const handleElimina = () => {
    Alert.alert(
      'Elimina Cane',
      `Eliminare definitivamente "${cane.nome}"? Questa operazione è irreversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await adminApi.eliminaCane(cane.id);
              Alert.alert('Fatto', 'Cane eliminato correttamente.');
              navigation.goBack();
            } catch {
              Alert.alert('Errore', "Impossibile eliminare il cane.");
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

  if (!cane) return null;

  const fotoUri = cane.fotoUrl ? `${BASE_URL}/uploads/${cane.fotoUrl}` : null;
  const proprietario = cane.proprietario;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header foto + nome */}
      <View style={styles.header}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.foto} />
        ) : (
          <View style={[styles.foto, styles.fotoPlaceholder]}>
            <MaterialCommunityIcons name="dog" size={52} color="#CCC" />
          </View>
        )}
        <Text style={styles.nome}>{cane.nome}</Text>
        <View style={styles.badgeRow}>
          {cane.isVerificato && <Badge label="Pedigree verificato" color="#34C759" />}
          {cane.isSegnalato && <Badge label="Segnalato" color="#FF3B30" />}
          {cane.disponibilitaRiproduttiva && <Badge label="Disponibile riprod." color="#0047AB" />}
        </View>
      </View>

      {/* Scheda anagrafica */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anagrafica</Text>
        <InfoRow icon="dog" label="Razza" value={cane.razza} />
        <InfoRow icon="gender-male-female" label="Sesso" value={cane.sesso === 'M' ? 'Maschio' : 'Femmina'} />
        <InfoRow icon="calendar" label="Età" value={`${cane.eta} ann${cane.eta === 1 ? 'o' : 'i'}`} />
        <InfoRow icon="weight-kilogram" label="Peso" value={`${cane.peso} kg`} />
        <InfoRow icon="resize" label="Taglia" value={cane.taglia} />
      </View>

      {/* Proprietario */}
      {proprietario && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Proprietario</Text>
          <InfoRow icon="account" label="Nome" value={`${proprietario.nome} ${proprietario.cognome}`} />
          <InfoRow icon="email-outline" label="Email" value={proprietario.email} />
          {proprietario.telefono && (
            <InfoRow icon="phone-outline" label="Telefono" value={proprietario.telefono} />
          )}
          {proprietario.isVerificato && (
            <View style={{ marginTop: 4 }}>
              <Badge label="Proprietario verificato" color="#34C759" />
            </View>
          )}
        </View>
      )}

      {/* Descrizione */}
      {cane.descrizione && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Descrizione</Text>
          <Text style={styles.bodyText}>{cane.descrizione}</Text>
        </View>
      )}

      {/* Info sanitarie */}
      {cane.infoSanitarie && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informazioni Sanitarie</Text>
          <Text style={styles.bodyText}>{cane.infoSanitarie}</Text>
        </View>
      )}

      {/* Azioni pedigree */}
      {cane.pedigreeUrl && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pedigree</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleViewPedigree} disabled={actionLoading}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#0047AB" />
            <Text style={[styles.actionBtnText, { color: '#0047AB' }]}>Visualizza documento</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: cane.isVerificato ? '#FF9500' : '#34C759', marginTop: 8 }]}
            onPress={handleVerifyPedigree}
            disabled={actionLoading}
          >
            <MaterialCommunityIcons
              name={cane.isVerificato ? 'close-circle-outline' : 'check-circle-outline'}
              size={20}
              color={cane.isVerificato ? '#FF9500' : '#34C759'}
            />
            <Text style={[styles.actionBtnText, { color: cane.isVerificato ? '#FF9500' : '#34C759' }]}>
              {cane.isVerificato ? 'Rimuovi verifica pedigree' : 'Approva pedigree'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Azioni</Text>

      {actionLoading && (
        <ActivityIndicator size="small" color="#0047AB" style={{ marginBottom: 12 }} />
      )}

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: cane.isSegnalato ? '#FF9500' : '#FF3B30' }]}
        onPress={handleToggleFlag}
        disabled={actionLoading}
      >
        <MaterialCommunityIcons
          name={cane.isSegnalato ? 'flag-off-outline' : 'flag-outline'}
          size={20}
          color={cane.isSegnalato ? '#FF9500' : '#FF3B30'}
        />
        <Text style={[styles.actionBtnText, { color: cane.isSegnalato ? '#FF9500' : '#FF3B30' }]}>
          {cane.isSegnalato ? 'Rimuovi segnalazione' : 'Segnala cane'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, { borderColor: '#FF3B30', backgroundColor: '#FFF0EE' }]}
        onPress={handleElimina}
        disabled={actionLoading}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
        <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Elimina Cane</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  content: { padding: 20, paddingBottom: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  header: { alignItems: 'center', marginBottom: 20 },
  foto: { width: 110, height: 110, borderRadius: 18, marginBottom: 12 },
  fotoPlaceholder: { backgroundColor: '#F0E8E0', justifyContent: 'center', alignItems: 'center' },
  nome: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0047AB', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#888', marginRight: 4, width: 72 },
  infoValue: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  bodyText: { fontSize: 14, color: '#555', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0047AB',
    padding: 14,
    marginBottom: 10,
  },
  actionBtnText: { fontSize: 15, fontWeight: '700', marginLeft: 10 },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

// Filtri attivi
const FILTERS = [
  { key: 'tutti', label: 'Tutti' },
  { key: 'attesa', label: 'In attesa' },
  { key: 'verificati', label: 'Verificati' },
  { key: 'segnalati', label: 'Segnalati' },
];

function pedigreeStatus(dog) {
  if (!dog.pedigreeUrl) return 'nessuno';
  if (dog.isVerificato) return 'verificato';
  return 'attesa';
}

function PedigreeBadge({ status }) {
  if (status === 'nessuno') return null;
  const config = {
    verificato: { color: '#34C759', icon: 'check-decagram', label: 'Pedigree verificato' },
    attesa: { color: '#FF9500', icon: 'clock-outline', label: 'In attesa verifica' },
  }[status];
  return (
    <View style={[styles.pedigreeBadge, { backgroundColor: config.color }]}>
      <MaterialCommunityIcons name={config.icon} size={11} color="#FFF" />
      <Text style={styles.pedigreeBadgeText}>{config.label}</Text>
    </View>
  );
}

function DogItem({ dog, onToggleFlag, onDelete, onVerifyPedigree, onViewPedigree }) {
  const fotoUri = dog.fotoUrl ? `${BASE_URL}/uploads/${dog.fotoUrl}` : null;
  const proprietario = dog.proprietario;
  const pedStatus = pedigreeStatus(dog);

  return (
    <View style={styles.item}>
      {/* Riga superiore: foto + info */}
      <View style={styles.itemTop}>
        {fotoUri ? (
          <Image source={{ uri: fotoUri }} style={styles.dogPhoto} />
        ) : (
          <View style={[styles.dogPhoto, styles.dogPhotoPlaceholder]}>
            <MaterialCommunityIcons name="dog" size={26} color="#CCC" />
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text style={styles.dogName} numberOfLines={1}>{dog.nome}</Text>
          <Text style={styles.dogBreed} numberOfLines={1}>{dog.razza || 'Razza n.d.'}</Text>
          {proprietario && (
            <Text style={styles.ownerText} numberOfLines={1}>
              {proprietario.nome} {proprietario.cognome}
            </Text>
          )}
          <View style={styles.badgeRow}>
            <PedigreeBadge status={pedStatus} />
            {dog.isSegnalato && (
              <View style={[styles.pedigreeBadge, { backgroundColor: '#FF3B30' }]}>
                <MaterialCommunityIcons name="flag" size={11} color="#FFF" />
                <Text style={styles.pedigreeBadgeText}>Segnalato</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Azioni pedigree (solo se c'è un documento) */}
      {dog.pedigreeUrl && (
        <View style={styles.pedigreeActions}>
          <TouchableOpacity style={styles.pedigreeBtn} onPress={() => onViewPedigree(dog)}>
            <MaterialCommunityIcons name="file-document-outline" size={16} color="#0047AB" />
            <Text style={styles.pedigreeBtnText}>Visualizza pedigree</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pedigreeBtn,
              { borderColor: dog.isVerificato ? '#FF9500' : '#34C759' },
            ]}
            onPress={() => onVerifyPedigree(dog)}
          >
            <MaterialCommunityIcons
              name={dog.isVerificato ? 'close-circle-outline' : 'check-circle-outline'}
              size={16}
              color={dog.isVerificato ? '#FF9500' : '#34C759'}
            />
            <Text style={[styles.pedigreeBtnText, { color: dog.isVerificato ? '#FF9500' : '#34C759' }]}>
              {dog.isVerificato ? 'Rimuovi verifica' : 'Approva pedigree'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Azioni generali */}
      <View style={styles.generalActions}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onToggleFlag(dog)}>
          <MaterialCommunityIcons
            name={dog.isSegnalato ? 'flag-off' : 'flag-outline'}
            size={20}
            color={dog.isSegnalato ? '#FF9500' : '#AAA'}
          />
          <Text style={[styles.iconBtnLabel, { color: dog.isSegnalato ? '#FF9500' : '#AAA' }]}>
            {dog.isSegnalato ? 'Rimuovi' : 'Segnala'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={() => onDelete(dog)}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
          <Text style={[styles.iconBtnLabel, { color: '#FF3B30' }]}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminDogsScreen() {
  const [cani, setCani] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('tutti');

  const loadCani = useCallback(async () => {
    try {
      const res = await adminApi.getCani();
      setCani(res.data.cani);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare la lista dei cani.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadCani(); }, [loadCani]);

  const filtered = useMemo(() => {
    let result = cani;

    // Applica filtro categoria
    if (activeFilter === 'attesa') {
      result = result.filter((c) => c.pedigreeUrl && !c.isVerificato);
    } else if (activeFilter === 'verificati') {
      result = result.filter((c) => c.isVerificato);
    } else if (activeFilter === 'segnalati') {
      result = result.filter((c) => c.isSegnalato);
    }

    // Applica ricerca testo
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome?.toLowerCase().includes(q) ||
          c.razza?.toLowerCase().includes(q) ||
          c.proprietario?.nome?.toLowerCase().includes(q) ||
          c.proprietario?.cognome?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [cani, search, activeFilter]);

  // Contatori badge per i filtri
  const counts = useMemo(() => ({
    tutti: cani.length,
    attesa: cani.filter((c) => c.pedigreeUrl && !c.isVerificato).length,
    verificati: cani.filter((c) => c.isVerificato).length,
    segnalati: cani.filter((c) => c.isSegnalato).length,
  }), [cani]);

  const handleVerifyPedigree = (dog) => {
    const approva = !dog.isVerificato;
    Alert.alert(
      approva ? 'Approva pedigree' : 'Rimuovi verifica pedigree',
      approva
        ? `Approvare il pedigree di "${dog.nome}"?`
        : `Rimuovere la verifica del pedigree di "${dog.nome}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: approva ? 'Approva' : 'Rimuovi',
          style: approva ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await adminApi.verificaPedigree(dog.id, approva);
              setCani((prev) =>
                prev.map((c) => c.id === dog.id ? { ...c, isVerificato: res.data.isVerificato } : c)
              );
            } catch (err) {
              Alert.alert('Errore', err?.response?.data?.errore || 'Operazione non riuscita.');
            }
          },
        },
      ]
    );
  };

  const handleViewPedigree = async (dog) => {
    const url = `${BASE_URL}/uploads/${dog.pedigreeUrl}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Errore', 'Impossibile aprire il documento pedigree.');
    }
  };

  const handleToggleFlag = (dog) => {
    Alert.alert(
      dog.isSegnalato ? 'Rimuovi segnalazione' : 'Segnala cane',
      `${dog.isSegnalato ? 'Rimuovere la segnalazione' : 'Segnalare'} "${dog.nome}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: dog.isSegnalato ? 'Rimuovi' : 'Segnala',
          onPress: async () => {
            try {
              const res = await adminApi.toggleSegnalazione(dog.id);
              setCani((prev) =>
                prev.map((c) => c.id === dog.id ? { ...c, isSegnalato: res.data.isSegnalato } : c)
              );
            } catch {
              Alert.alert('Errore', 'Operazione non riuscita.');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (dog) => {
    Alert.alert(
      'Elimina Cane',
      `Eliminare definitivamente "${dog.nome}"? Questa operazione è irreversibile.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.eliminaCane(dog.id);
              setCani((prev) => prev.filter((c) => c.id !== dog.id));
            } catch {
              Alert.alert('Errore', 'Impossibile eliminare il cane.');
            }
          },
        },
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCani();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra ricerca */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color="#AAA" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per nome, razza o proprietario..."
          placeholderTextColor="#AAA"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#AAA" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtri */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
            {counts[f.key] > 0 && (
              <View style={[styles.filterBadge, activeFilter === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, activeFilter === f.key && { color: '#0047AB' }]}>
                  {counts[f.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DogItem
            dog={item}
            onToggleFlag={handleToggleFlag}
            onDelete={handleDelete}
            onVerifyPedigree={handleVerifyPedigree}
            onViewPedigree={handleViewPedigree}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeFilter === 'attesa'
              ? 'Nessun pedigree in attesa di verifica.'
              : 'Nessun cane trovato.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF',
    gap: 6,
  },
  filterChipActive: { borderColor: '#0047AB', backgroundColor: '#EEF3FF' },
  filterChipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  filterChipTextActive: { color: '#0047AB' },
  filterBadge: { backgroundColor: '#EEE', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeActive: { backgroundColor: '#C5D5FF' },
  filterBadgeText: { fontSize: 11, fontWeight: '700', color: '#888' },
  item: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  dogPhoto: { width: 52, height: 52, borderRadius: 10, marginRight: 12 },
  dogPhotoPlaceholder: { backgroundColor: '#F0E8E0', justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  dogName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  dogBreed: { fontSize: 13, color: '#888', marginBottom: 2 },
  ownerText: { fontSize: 12, color: '#AAA', marginBottom: 4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  pedigreeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    gap: 3,
  },
  pedigreeBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  pedigreeActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E0',
  },
  pedigreeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0047AB',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  pedigreeBtnText: { fontSize: 13, fontWeight: '700', color: '#0047AB' },
  generalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0E8E0',
  },
  iconBtn: { alignItems: 'center', gap: 2 },
  iconBtnLabel: { fontSize: 10, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 40, paddingHorizontal: 30 },
});

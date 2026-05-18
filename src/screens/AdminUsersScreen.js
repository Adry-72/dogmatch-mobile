import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const ROLE_LABEL = {
  privato: 'Privato',
  allevatore: 'Allevatore',
  appassionato: 'Appassionato',
  admin: 'Admin',
};

const ROLE_COLOR = {
  privato: '#888',
  allevatore: '#FF9500',
  appassionato: '#34C759',
  admin: '#0047AB',
};

const STATUS_FILTERS = [
  { key: 'tutti', label: 'Tutti' },
  { key: 'verificati', label: 'Verificati' },
  { key: 'bloccati', label: 'Bloccati' },
];

const ROLE_FILTERS = [
  { key: 'tutti', label: 'Tutti' },
  { key: 'privato', label: 'Privato' },
  { key: 'allevatore', label: 'Allevatore' },
  { key: 'appassionato', label: 'Appassionato' },
  { key: 'admin', label: 'Admin' },
];

function isBloccato(user) {
  return user.isBanned || user.isBloccato;
}

function FilterChips({ options, selected, onSelect, activeColor }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
      {options.map((opt) => {
        const active = selected === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
            onPress={() => onSelect(opt.key)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function UserItem({ user, onPress }) {
  const bloccato = isBloccato(user);
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress(user)}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account" size={28} color="#AAA" />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>
          {user.nome} {user.cognome}
        </Text>
        <Text style={styles.itemEmail} numberOfLines={1}>{user.email}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: ROLE_COLOR[user.ruolo] || '#888' }]}>
            <Text style={styles.badgeText}>{ROLE_LABEL[user.ruolo] || user.ruolo}</Text>
          </View>
          {user.isVerificato && (
            <View style={[styles.badge, { backgroundColor: '#34C759' }]}>
              <Text style={styles.badgeText}>Verificato</Text>
            </View>
          )}
          {bloccato && (
            <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.badgeText}>Bloccato</Text>
            </View>
          )}
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

export default function AdminUsersScreen({ navigation }) {
  const [utenti, setUtenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('tutti');
  const [roleFilter, setRoleFilter] = useState('tutti');

  const loadUtenti = useCallback(async () => {
    try {
      const res = await adminApi.getUtenti();
      setUtenti(res.data.utenti);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare la lista utenti.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadUtenti(); }, [loadUtenti]);

  const filtered = useMemo(() => {
    let result = utenti;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nome?.toLowerCase().includes(q) ||
          u.cognome?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'verificati') result = result.filter((u) => u.isVerificato);
    if (statusFilter === 'bloccati') result = result.filter((u) => isBloccato(u));
    if (roleFilter !== 'tutti') result = result.filter((u) => u.ruolo === roleFilter);
    return result;
  }, [utenti, search, statusFilter, roleFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUtenti();
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
      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={20} color="#AAA" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cerca per nome o email..."
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

      <FilterChips
        options={STATUS_FILTERS}
        selected={statusFilter}
        onSelect={setStatusFilter}
        activeColor="#0047AB"
      />
      <FilterChips
        options={ROLE_FILTERS}
        selected={roleFilter}
        onSelect={setRoleFilter}
        activeColor="#FF9500"
      />

      <Text style={styles.count}>{filtered.length} utent{filtered.length === 1 ? 'e' : 'i'}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <UserItem user={item} onPress={(u) => navigation.navigate('AdminUserDetail', { userId: u.id })} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
        ListEmptyComponent={<Text style={styles.empty}>Nessun utente trovato.</Text>}
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
  chipsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#DDD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  chipTextActive: { color: '#FFF' },
  count: { paddingHorizontal: 16, marginBottom: 6, fontSize: 13, color: '#888', fontWeight: '600' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0E8E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  itemEmail: { fontSize: 13, color: '#888', marginBottom: 6 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 40 },
});

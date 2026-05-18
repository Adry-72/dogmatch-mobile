import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const BASE_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MatchRow({ match }) {
  const mittente = match.mittente;
  const ricevente = match.ricevente;
  return (
    <View style={styles.matchRow}>
      <MaterialCommunityIcons name="heart" size={16} color="#E8405A" style={{ marginRight: 8 }} />
      <Text style={styles.matchText} numberOfLines={1}>
        {mittente?.nome ?? '?'} & {ricevente?.nome ?? '?'}
      </Text>
      <Text style={styles.matchDate}>
        {new Date(match.updatedAt).toLocaleDateString('it-IT')}
      </Text>
    </View>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [matchRecenti, setMatchRecenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, matchRes, segnRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getMatchRecenti(),
        adminApi.getSegnalazioni('aperta'),
      ]);
      setStats({ ...statsRes.data.stats, segnalazioniAperte: segnRes.data.segnalazioni.length });
      setMatchRecenti(matchRes.data.matches);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare i dati della dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
    >
      <Text style={styles.title}>Pannello Admin</Text>

      <View style={styles.statsRow}>
        <StatCard icon="account-group" label="Utenti" value={stats?.utenti} color="#0047AB" />
        <StatCard icon="dog" label="Cani" value={stats?.cani} color="#FF9500" />
        <StatCard icon="heart-multiple" label="Match" value={stats?.match} color="#E8405A" />
      </View>

      {stats?.segnalazioniAperte > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('AdminReports')}
        >
          <MaterialCommunityIcons name="alert-circle" size={20} color="#FF3B30" />
          <Text style={styles.alertBannerText}>
            {stats.segnalazioniAperte} segnalazion{stats.segnalazioniAperte === 1 ? 'e' : 'i'} in attesa
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#FF3B30" />
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminUsers')}>
          <MaterialCommunityIcons name="account-group" size={22} color="#0047AB" />
          <Text style={styles.navButtonText}>Gestisci Utenti</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#0047AB" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminDogs')}>
          <MaterialCommunityIcons name="dog" size={22} color="#FF9500" />
          <Text style={styles.navButtonText}>Gestisci Cani</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#FF9500" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminReports')}>
          <MaterialCommunityIcons name="flag-variant" size={22} color="#E8405A" />
          <Text style={styles.navButtonText}>Segnalazioni Utenti</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#E8405A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('AdminStats')}>
          <MaterialCommunityIcons name="chart-bar" size={22} color="#8B5CF6" />
          <Text style={styles.navButtonText}>Statistiche & Monitoring</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Ultimi Match</Text>
      {matchRecenti.length === 0 ? (
        <Text style={styles.emptyText}>Nessun match recente.</Text>
      ) : (
        <View style={styles.matchList}>
          {matchRecenti.map((m) => <MatchRow key={m.id} match={m} />)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  title: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginBottom: 24, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: '#1A1A1A', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, textAlign: 'center' },
  section: { marginBottom: 24 },
  navButton: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navButtonText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginLeft: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 10,
  },
  alertBannerText: { flex: 1, color: '#FF3B30', fontWeight: '700', fontSize: 14 },
  matchList: { backgroundColor: '#FFF', borderRadius: 14, overflow: 'hidden', elevation: 2 },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8E0',
  },
  matchText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  matchDate: { fontSize: 12, color: '#999' },
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 10 },
});

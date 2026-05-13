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
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const STATO_CONFIG = {
  aperta:   { color: '#FF3B30', bg: '#FFF0EE', icon: 'alert-circle',     label: 'Aperta' },
  esaminata:{ color: '#FF9500', bg: '#FFF6E8', icon: 'eye-check',         label: 'Esaminata' },
  chiusa:   { color: '#34C759', bg: '#F0FFF4', icon: 'check-circle',      label: 'Chiusa' },
};

const MOTIVO_LABEL = {
  comportamento_inappropriato: 'Comportamento inappropriato',
  spam:                        'Spam o pubblicità',
  profilo_falso:               'Profilo falso',
  maltrattamento_animali:      'Maltrattamento animali',
  altro:                       'Altro',
};

const FILTRI = [
  { key: null,        label: 'Tutte' },
  { key: 'aperta',   label: 'Aperte' },
  { key: 'esaminata',label: 'Esaminate' },
  { key: 'chiusa',   label: 'Chiuse' },
];

function ReportCard({ report, onChangeStato, onDelete }) {
  const cfg = STATO_CONFIG[report.stato] || STATO_CONFIG.aperta;
  const segnalante = report.segnalante;
  const segnalato = report.segnalato;

  const handleChangeStato = () => {
    const opzioni = ['aperta', 'esaminata', 'chiusa']
      .filter((s) => s !== report.stato)
      .map((s) => ({ text: STATO_CONFIG[s].label, onPress: () => onChangeStato(report, s) }));
    opzioni.push({ text: 'Annulla', style: 'cancel' });
    Alert.alert('Cambia stato', 'Seleziona il nuovo stato:', opzioni);
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina segnalazione',
      'Eliminare definitivamente questa segnalazione?',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => onDelete(report) },
      ]
    );
  };

  return (
    <View style={[styles.card, { borderLeftColor: cfg.color }]}>
      {/* Header stato + data */}
      <View style={styles.cardHeader}>
        <View style={[styles.statoBadge, { backgroundColor: cfg.bg }]}>
          <MaterialCommunityIcons name={cfg.icon} size={13} color={cfg.color} />
          <Text style={[styles.statoText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Text style={styles.cardDate}>
          {new Date(report.createdAt).toLocaleDateString('it-IT')}
        </Text>
      </View>

      {/* Motivo */}
      <Text style={styles.motivoText}>{MOTIVO_LABEL[report.motivo] || report.motivo}</Text>

      {/* Descrizione */}
      {report.descrizione && (
        <Text style={styles.descrizioneText} numberOfLines={3}>"{report.descrizione}"</Text>
      )}

      {/* Utenti coinvolti */}
      <View style={styles.utentiRow}>
        <View style={styles.utenteBox}>
          <Text style={styles.utenteRuolo}>Segnalante</Text>
          <Text style={styles.utenteNome} numberOfLines={1}>
            {segnalante?.nome} {segnalante?.cognome}
          </Text>
          <Text style={styles.utenteEmail} numberOfLines={1}>{segnalante?.email}</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={18} color="#CCC" style={{ marginTop: 18 }} />
        <View style={styles.utenteBox}>
          <Text style={[styles.utenteRuolo, { color: '#FF3B30' }]}>Segnalato</Text>
          <Text style={styles.utenteNome} numberOfLines={1}>
            {segnalato?.nome} {segnalato?.cognome}
          </Text>
          <Text style={styles.utenteEmail} numberOfLines={1}>{segnalato?.email}</Text>
          {segnalato?.isBloccato && (
            <Text style={styles.bloccatoTag}>Già bloccato</Text>
          )}
        </View>
      </View>

      {/* Azioni */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleChangeStato}>
          <MaterialCommunityIcons name="swap-horizontal" size={16} color="#0047AB" />
          <Text style={styles.actionBtnText}>Cambia stato</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: '#FF3B30' }]} onPress={handleDelete}>
          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
          <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminReportsScreen() {
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStato, setFiltroStato] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getSegnalazioni(filtroStato);
      setSegnalazioni(res.data.segnalazioni);
    } catch {
      Alert.alert('Errore', 'Impossibile caricare le segnalazioni.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtroStato]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleChangeStato = async (report, nuovoStato) => {
    try {
      await adminApi.aggiornaSegnalazione(report.id, nuovoStato);
      setSegnalazioni((prev) =>
        prev.map((s) => s.id === report.id ? { ...s, stato: nuovoStato } : s)
      );
    } catch {
      Alert.alert('Errore', 'Impossibile aggiornare lo stato.');
    }
  };

  const handleDelete = async (report) => {
    try {
      await adminApi.eliminaSegnalazione(report.id);
      setSegnalazioni((prev) => prev.filter((s) => s.id !== report.id));
    } catch {
      Alert.alert('Errore', 'Impossibile eliminare la segnalazione.');
    }
  };

  // Contatori per i filtri
  const counts = useMemo(() => ({
    null: segnalazioni.length,
    aperta: segnalazioni.filter((s) => s.stato === 'aperta').length,
    esaminata: segnalazioni.filter((s) => s.stato === 'esaminata').length,
    chiusa: segnalazioni.filter((s) => s.stato === 'chiusa').length,
  }), [segnalazioni]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtri stato */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {FILTRI.map((f) => {
          const isActive = filtroStato === f.key;
          const count = counts[f.key] ?? counts['null'];
          return (
            <TouchableOpacity
              key={String(f.key)}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setFiltroStato(f.key)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {f.label}
              </Text>
              {count > 0 && (
                <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, isActive && { color: '#0047AB' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={segnalazioni}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onChangeStato={handleChangeStato}
            onDelete={handleDelete}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filtroStato ? `Nessuna segnalazione ${STATO_CONFIG[filtroStato]?.label.toLowerCase()}.` : 'Nessuna segnalazione.'}
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
  filtersRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  chip: {
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
  chipActive: { borderColor: '#0047AB', backgroundColor: '#EEF3FF' },
  chipText: { fontSize: 13, color: '#888', fontWeight: '600' },
  chipTextActive: { color: '#0047AB' },
  chipBadge: { backgroundColor: '#EEE', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  chipBadgeActive: { backgroundColor: '#C5D5FF' },
  chipBadgeText: { fontSize: 11, fontWeight: '700', color: '#888' },
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statoBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  statoText: { fontSize: 12, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#AAA' },
  motivoText: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  descrizioneText: { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 10, lineHeight: 18 },
  utentiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6, marginBottom: 12 },
  utenteBox: { flex: 1 },
  utenteRuolo: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  utenteNome: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  utenteEmail: { fontSize: 12, color: '#AAA' },
  bloccatoTag: { fontSize: 10, color: '#FF3B30', fontWeight: '700', marginTop: 3 },
  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#F0E8E0', paddingTop: 10 },
  actionBtn: {
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
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#0047AB' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 40, paddingHorizontal: 30 },
});

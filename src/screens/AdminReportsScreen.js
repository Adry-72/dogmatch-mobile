import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

const STATO_CONFIG = {
  aperta:    { color: '#FF3B30', bg: '#FFF0EE', icon: 'alert-circle',  label: 'Aperta' },
  esaminata: { color: '#FF9500', bg: '#FFF6E8', icon: 'eye-check',      label: 'Esaminata' },
  chiusa:    { color: '#34C759', bg: '#F0FFF4', icon: 'check-circle',   label: 'Chiusa' },
};

const MOTIVO_LABEL = {
  comportamento_inappropriato: 'Comportamento inappropriato',
  spam:                        'Spam o pubblicità',
  profilo_falso:               'Profilo falso',
  maltrattamento_animali:      'Maltrattamento animali',
  altro:                       'Altro',
};

const MOTIVO_ICON = {
  comportamento_inappropriato: 'account-alert',
  spam:                        'email-alert',
  profilo_falso:               'account-off',
  maltrattamento_animali:      'paw-off',
  altro:                       'dots-horizontal-circle',
};

const FILTRI_STATO = [
  { key: null,         label: 'Tutte' },
  { key: 'aperta',    label: 'Aperte' },
  { key: 'esaminata', label: 'Esaminate' },
  { key: 'chiusa',    label: 'Chiuse' },
];

const FILTRI_MOTIVO = [
  { key: null,                          label: 'Tutti i motivi' },
  { key: 'comportamento_inappropriato', label: 'Comportamento' },
  { key: 'spam',                        label: 'Spam' },
  { key: 'profilo_falso',               label: 'Profilo falso' },
  { key: 'maltrattamento_animali',      label: 'Maltrattamento' },
  { key: 'altro',                       label: 'Altro' },
];

// Modal per cambiare stato con nota
function CambiaStatoModal({ visible, report, onConfirm, onClose }) {
  const [statoScelto, setStatoScelto] = useState(null);
  const [nota, setNota] = useState('');

  useEffect(() => {
    if (visible) {
      setStatoScelto(null);
      setNota(report?.notaModerazione || '');
    }
  }, [visible, report]);

  const opzioni = ['aperta', 'esaminata', 'chiusa'].filter((s) => s !== report?.stato);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.modalBox} activeOpacity={1}>
          <Text style={styles.modalTitle}>Aggiorna segnalazione</Text>

          <Text style={styles.modalLabel}>Nuovo stato</Text>
          <View style={styles.modalStatiRow}>
            {opzioni.map((s) => {
              const cfg = STATO_CONFIG[s];
              const active = statoScelto === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.statoBtn, active && { backgroundColor: cfg.bg, borderColor: cfg.color }]}
                  onPress={() => setStatoScelto(s)}
                >
                  <MaterialCommunityIcons name={cfg.icon} size={16} color={active ? cfg.color : '#888'} />
                  <Text style={[styles.statoBtnText, active && { color: cfg.color }]}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.modalLabel}>Nota moderazione (opzionale)</Text>
          <TextInput
            style={styles.notaInput}
            value={nota}
            onChangeText={setNota}
            placeholder="Aggiungi una nota sulla decisione..."
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalConfirmBtn, !statoScelto && { opacity: 0.4 }]}
              onPress={() => statoScelto && onConfirm(statoScelto, nota.trim() || null)}
              disabled={!statoScelto}
            >
              <Text style={styles.modalConfirmText}>Conferma</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function ReportCard({ report, onChangeStato, onDelete, onToggleBlocco, onViewUser }) {
  const cfg = STATO_CONFIG[report.stato] || STATO_CONFIG.aperta;
  const segnalante = report.segnalante;
  const segnalato = report.segnalato;
  const bloccato = segnalato?.isBloccato;

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
      <View style={styles.motivoRow}>
        <MaterialCommunityIcons
          name={MOTIVO_ICON[report.motivo] || 'flag'}
          size={16}
          color="#555"
          style={{ marginRight: 6 }}
        />
        <Text style={styles.motivoText}>{MOTIVO_LABEL[report.motivo] || report.motivo}</Text>
      </View>

      {/* Descrizione utente */}
      {report.descrizione ? (
        <Text style={styles.descrizioneText} numberOfLines={3}>
          "{report.descrizione}"
        </Text>
      ) : null}

      {/* Nota moderazione */}
      {report.notaModerazione ? (
        <View style={styles.notaBanner}>
          <MaterialCommunityIcons name="note-text-outline" size={14} color="#0047AB" style={{ marginRight: 6 }} />
          <Text style={styles.notaBannerText} numberOfLines={3}>{report.notaModerazione}</Text>
        </View>
      ) : null}

      {/* Utenti coinvolti */}
      <View style={styles.utentiRow}>
        <View style={styles.utenteBox}>
          <Text style={styles.utenteRuolo}>Segnalante</Text>
          <Text style={styles.utenteNome} numberOfLines={1}>
            {segnalante?.nome} {segnalante?.cognome}
          </Text>
          <Text style={styles.utenteEmail} numberOfLines={1}>{segnalante?.email}</Text>
          {segnalante && (
            <TouchableOpacity onPress={() => onViewUser(segnalante.id)} style={styles.profileLink}>
              <MaterialCommunityIcons name="account-eye" size={12} color="#0047AB" />
              <Text style={styles.profileLinkText}>Profilo</Text>
            </TouchableOpacity>
          )}
        </View>

        <MaterialCommunityIcons name="arrow-right" size={18} color="#CCC" style={{ marginTop: 18 }} />

        <View style={styles.utenteBox}>
          <Text style={[styles.utenteRuolo, { color: '#FF3B30' }]}>Segnalato</Text>
          <Text style={styles.utenteNome} numberOfLines={1}>
            {segnalato?.nome} {segnalato?.cognome}
          </Text>
          <Text style={styles.utenteEmail} numberOfLines={1}>{segnalato?.email}</Text>
          <View style={styles.segnalatoBtns}>
            {segnalato && (
              <TouchableOpacity onPress={() => onViewUser(segnalato.id)} style={styles.profileLink}>
                <MaterialCommunityIcons name="account-eye" size={12} color="#0047AB" />
                <Text style={styles.profileLinkText}>Profilo</Text>
              </TouchableOpacity>
            )}
            {segnalato && segnalato.ruolo !== 'admin' && (
              <TouchableOpacity
                onPress={() => onToggleBlocco(report, segnalato)}
                style={[styles.profileLink, { borderColor: bloccato ? '#FF9500' : '#FF3B30' }]}
              >
                <MaterialCommunityIcons
                  name={bloccato ? 'lock-open-outline' : 'lock-outline'}
                  size={12}
                  color={bloccato ? '#FF9500' : '#FF3B30'}
                />
                <Text style={[styles.profileLinkText, { color: bloccato ? '#FF9500' : '#FF3B30' }]}>
                  {bloccato ? 'Sblocca' : 'Blocca'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {bloccato && <Text style={styles.bloccatoTag}>Bloccato</Text>}
        </View>
      </View>

      {/* Azioni */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onChangeStato(report)}>
          <MaterialCommunityIcons name="swap-horizontal" size={16} color="#0047AB" />
          <Text style={styles.actionBtnText}>Aggiorna stato</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: '#FF3B30' }]}
          onPress={() =>
            Alert.alert('Elimina segnalazione', 'Eliminare definitivamente questa segnalazione?', [
              { text: 'Annulla', style: 'cancel' },
              { text: 'Elimina', style: 'destructive', onPress: () => onDelete(report) },
            ])
          }
        >
          <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
          <Text style={[styles.actionBtnText, { color: '#FF3B30' }]}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminReportsScreen({ navigation }) {
  const [segnalazioni, setSegnalazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStato, setFiltroStato] = useState(null);
  const [filtroMotivo, setFiltroMotivo] = useState(null);
  const [modalReport, setModalReport] = useState(null);

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

  const handleChangeStato = (report) => {
    setModalReport(report);
  };

  const handleConfirmStato = async (nuovoStato, nota) => {
    setModalReport(null);
    try {
      const res = await adminApi.aggiornaSegnalazione(modalReport.id, nuovoStato, nota);
      setSegnalazioni((prev) =>
        prev.map((s) =>
          s.id === modalReport.id
            ? { ...s, stato: nuovoStato, notaModerazione: res.data.notaModerazione }
            : s
        )
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

  const handleToggleBlocco = (report, segnalato) => {
    const bloccato = segnalato.isBloccato;
    Alert.alert(
      bloccato ? 'Sblocca utente' : 'Blocca utente',
      `${bloccato ? 'Sbloccare' : 'Bloccare'} ${segnalato.nome} ${segnalato.cognome}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: bloccato ? 'Sblocca' : 'Blocca',
          style: bloccato ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await adminApi.toggleBlocco(segnalato.id);
              setSegnalazioni((prev) =>
                prev.map((s) =>
                  s.id === report.id
                    ? { ...s, segnalato: { ...s.segnalato, isBloccato: res.data.isBloccato } }
                    : s
                )
              );
            } catch {
              Alert.alert('Errore', 'Operazione non riuscita.');
            }
          },
        },
      ]
    );
  };

  const handleViewUser = (userId) => {
    navigation.navigate('AdminUserDetail', { userId });
  };

  const displayed = useMemo(() => {
    if (!filtroMotivo) return segnalazioni;
    return segnalazioni.filter((s) => s.motivo === filtroMotivo);
  }, [segnalazioni, filtroMotivo]);

  const countsByStato = useMemo(() => ({
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
      {/* Filtro stato */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
        {FILTRI_STATO.map((f) => {
          const isActive = filtroStato === f.key;
          const count = countsByStato[f.key] ?? countsByStato['null'];
          return (
            <TouchableOpacity
              key={String(f.key)}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setFiltroStato(f.key)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
              {count > 0 && (
                <View style={[styles.chipBadge, isActive && styles.chipBadgeActive]}>
                  <Text style={[styles.chipBadgeText, isActive && { color: '#0047AB' }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Filtro motivo */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filtersRow, { paddingTop: 0 }]}>
        {FILTRI_MOTIVO.map((f) => {
          const isActive = filtroMotivo === f.key;
          return (
            <TouchableOpacity
              key={String(f.key)}
              style={[styles.chip, isActive && { borderColor: '#E8405A', backgroundColor: '#FFF0EE' }]}
              onPress={() => setFiltroMotivo(f.key)}
            >
              <Text style={[styles.chipText, isActive && { color: '#E8405A' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onChangeStato={handleChangeStato}
            onDelete={handleDelete}
            onToggleBlocco={handleToggleBlocco}
            onViewUser={handleViewUser}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filtroStato
              ? `Nessuna segnalazione ${STATO_CONFIG[filtroStato]?.label.toLowerCase()}.`
              : 'Nessuna segnalazione.'}
          </Text>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <CambiaStatoModal
        visible={!!modalReport}
        report={modalReport}
        onConfirm={handleConfirmStato}
        onClose={() => setModalReport(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  filtersRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
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
  motivoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  motivoText: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  descrizioneText: { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 8, lineHeight: 18 },
  notaBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF3FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  notaBannerText: { flex: 1, fontSize: 13, color: '#0047AB', lineHeight: 18 },
  utentiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6, marginBottom: 12 },
  utenteBox: { flex: 1 },
  utenteRuolo: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 2, textTransform: 'uppercase' },
  utenteNome: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  utenteEmail: { fontSize: 12, color: '#AAA', marginBottom: 4 },
  segnalatoBtns: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0047AB',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  profileLinkText: { fontSize: 11, fontWeight: '700', color: '#0047AB' },
  bloccatoTag: { fontSize: 10, color: '#FF3B30', fontWeight: '700', marginTop: 4 },
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', marginBottom: 18, textAlign: 'center' },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', marginBottom: 8 },
  modalStatiRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  statoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#FAFAFA',
  },
  statoBtnText: { fontSize: 13, fontWeight: '700', color: '#888' },
  notaInput: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#DDD',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#888' },
  modalConfirmBtn: {
    flex: 1,
    backgroundColor: '#0047AB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
});

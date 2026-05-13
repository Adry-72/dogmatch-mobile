import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { adminApi } from '../services/adminApi';

// ── Componenti base ─────────────────────────────────────────────────────────

function SectionTitle({ icon, label, color = '#0047AB' }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{label}</Text>
    </View>
  );
}

function MetricCard({ icon, label, value, sub, color = '#0047AB' }) {
  return (
    <View style={[styles.metricCard, { borderTopColor: color }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={styles.metricValue}>{value ?? '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

function ProgressRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressCount}>
          {value} <Text style={styles.progressPct}>({pct}%)</Text>
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function StatRow({ icon, label, value, color = '#555' }) {
  return (
    <View style={styles.statRow}>
      <MaterialCommunityIcons name={icon} size={16} color={color} style={{ marginRight: 8 }} />
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color }]}>{value ?? '—'}</Text>
    </View>
  );
}

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

// ── Schermata principale ─────────────────────────────────────────────────────

export default function AdminStatsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminApi.getStatisticheComplete();
      setStats(res.data.statistiche);
      setLastUpdated(new Date());
    } catch {
      Alert.alert('Errore', 'Impossibile caricare le statistiche.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0047AB" />
      </View>
    );
  }

  if (!stats) return null;

  const { utenti, cani, interazioni, segnalazioni } = stats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0047AB" />}
    >
      {lastUpdated && (
        <Text style={styles.lastUpdated}>
          Aggiornato alle {lastUpdated.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}

      {/* ── PANORAMICA ──────────────────────────────────────────────────── */}
      <SectionTitle icon="view-dashboard" label="Panoramica" />
      <View style={styles.metricsGrid}>
        <MetricCard icon="account-group" label="Utenti" value={utenti.totale} color="#0047AB"
          sub={`+${utenti.nuovi7gg} questa settimana`} />
        <MetricCard icon="dog" label="Cani" value={cani.totale} color="#FF9500"
          sub={`${cani.disponibiliRiproduzione} disponibili`} />
        <MetricCard icon="heart-multiple" label="Match" value={interazioni.match} color="#E8405A"
          sub={`${interazioni.matchRate}% match rate`} />
        <MetricCard icon="flag-variant" label="Segnalazioni" value={segnalazioni.totale} color="#8B5CF6"
          sub={`${segnalazioni.aperte} aperte`} />
      </View>

      {/* ── UTENTI ──────────────────────────────────────────────────────── */}
      <SectionTitle icon="account-group" label="Utenti" color="#0047AB" />
      <Card>
        <Text style={styles.cardSubtitle}>Nuovi iscritti</Text>
        <View style={styles.trendRow}>
          <View style={styles.trendBox}>
            <Text style={styles.trendValue}>{utenti.nuovi7gg}</Text>
            <Text style={styles.trendLabel}>ultimi 7 gg</Text>
          </View>
          <View style={[styles.trendBox, { borderLeftWidth: 1, borderLeftColor: '#F0E8E0' }]}>
            <Text style={styles.trendValue}>{utenti.nuovi30gg}</Text>
            <Text style={styles.trendLabel}>ultimi 30 gg</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Distribuzione ruoli</Text>
        <ProgressRow label="Privato"       value={utenti.perRuolo.privato}       total={utenti.totale} color="#888" />
        <ProgressRow label="Allevatore"    value={utenti.perRuolo.allevatore}    total={utenti.totale} color="#FF9500" />
        <ProgressRow label="Appassionato"  value={utenti.perRuolo.appassionato}  total={utenti.totale} color="#34C759" />
        {utenti.perRuolo.admin > 0 && (
          <ProgressRow label="Admin" value={utenti.perRuolo.admin} total={utenti.totale} color="#0047AB" />
        )}
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Stato account</Text>
        <StatRow icon="shield-check"    label="Verificati"  value={`${utenti.verificati} (${utenti.percentualeVerificati}%)`} color="#34C759" />
        <StatRow icon="lock"            label="Bloccati"    value={utenti.bloccati}  color="#FF3B30" />
        <StatRow icon="account-check"   label="Totale"      value={utenti.totale}    color="#0047AB" />
      </Card>

      {/* ── CANI ────────────────────────────────────────────────────────── */}
      <SectionTitle icon="dog" label="Cani" color="#FF9500" />
      <Card>
        <Text style={styles.cardSubtitle}>Distribuzione per taglia</Text>
        <ProgressRow label="Piccola" value={cani.perTaglia.piccola} total={cani.totale} color="#34C759" />
        <ProgressRow label="Media"   value={cani.perTaglia.media}   total={cani.totale} color="#FF9500" />
        <ProgressRow label="Grande"  value={cani.perTaglia.grande}  total={cani.totale} color="#0047AB" />
        <ProgressRow label="Gigante" value={cani.perTaglia.gigante} total={cani.totale} color="#E8405A" />
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Pedigree & Stato</Text>
        <StatRow icon="file-certificate-outline" label="Con pedigree"       value={`${cani.conPedigree} (${cani.percentualePedigree}%)`} color="#FF9500" />
        <StatRow icon="check-decagram"           label="Pedigree verificati" value={cani.pedigreeVerificati} color="#34C759" />
        <StatRow icon="flag"                     label="Segnalati"           value={cani.segnalati}          color="#FF3B30" />
        <StatRow icon="heart-outline"            label="Disponibili riprod." value={cani.disponibiliRiproduzione} color="#E8405A" />
      </Card>

      {/* ── MATCH & ATTIVITÀ ────────────────────────────────────────────── */}
      <SectionTitle icon="heart-multiple" label="Match & Attività" color="#E8405A" />
      <Card>
        <Text style={styles.cardSubtitle}>Nuovi match</Text>
        <View style={styles.trendRow}>
          <View style={styles.trendBox}>
            <Text style={[styles.trendValue, { color: '#E8405A' }]}>{interazioni.nuoviMatch7gg}</Text>
            <Text style={styles.trendLabel}>ultimi 7 gg</Text>
          </View>
          <View style={[styles.trendBox, { borderLeftWidth: 1, borderLeftColor: '#F0E8E0' }]}>
            <Text style={[styles.trendValue, { color: '#E8405A' }]}>{interazioni.nuoviMatch30gg}</Text>
            <Text style={styles.trendLabel}>ultimi 30 gg</Text>
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Swipe totali</Text>
        <ProgressRow label="Like"    value={interazioni.like}    total={interazioni.totale} color="#E8405A" />
        <ProgressRow label="Dislike" value={interazioni.dislike} total={interazioni.totale} color="#AAA" />

        <View style={styles.divider} />
        <Text style={styles.cardSubtitle}>Match rate</Text>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Match su like</Text>
          <Text style={[styles.progressCount, { color: '#E8405A' }]}>{interazioni.matchRate}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${interazioni.matchRate}%`, backgroundColor: '#E8405A' }]} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Match per intento</Text>
        <ProgressRow label="Gioco"          value={interazioni.matchGioco}          total={interazioni.match} color="#FF9500" />
        <ProgressRow label="Accoppiamento"  value={interazioni.matchAccoppiamento}  total={interazioni.match} color="#E8405A" />
      </Card>

      {/* ── SEGNALAZIONI ────────────────────────────────────────────────── */}
      <SectionTitle icon="flag-variant" label="Segnalazioni" color="#8B5CF6" />
      <Card>
        <Text style={styles.cardSubtitle}>Per stato</Text>
        <ProgressRow label="Aperte"    value={segnalazioni.aperte}    total={segnalazioni.totale} color="#FF3B30" />
        <ProgressRow label="Esaminate" value={segnalazioni.esaminate} total={segnalazioni.totale} color="#FF9500" />
        <ProgressRow label="Chiuse"    value={segnalazioni.chiuse}    total={segnalazioni.totale} color="#34C759" />

        <View style={styles.divider} />
        <StatRow icon="check-circle" label="Tasso risoluzione" value={`${segnalazioni.rateRisoluzione}%`} color="#34C759" />
      </Card>

      <Card>
        <Text style={styles.cardSubtitle}>Per motivo</Text>
        <ProgressRow label="Comportamento"  value={segnalazioni.perMotivo.comportamento_inappropriato} total={segnalazioni.totale} color="#E8405A" />
        <ProgressRow label="Spam"           value={segnalazioni.perMotivo.spam}                        total={segnalazioni.totale} color="#FF9500" />
        <ProgressRow label="Profilo falso"  value={segnalazioni.perMotivo.profilo_falso}               total={segnalazioni.totale} color="#8B5CF6" />
        <ProgressRow label="Maltrattamento" value={segnalazioni.perMotivo.maltrattamento_animali}      total={segnalazioni.totale} color="#FF3B30" />
        <ProgressRow label="Altro"          value={segnalazioni.perMotivo.altro}                       total={segnalazioni.totale} color="#AAA" />
      </Card>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7F2' },
  lastUpdated: { fontSize: 11, color: '#BBB', textAlign: 'right', marginBottom: 12 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  metricCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  metricValue: { fontSize: 24, fontWeight: '900', color: '#1A1A1A', marginTop: 6 },
  metricLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 2 },
  metricSub: { fontSize: 11, color: '#AAA', marginTop: 3, textAlign: 'center' },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
  },
  cardSubtitle: { fontSize: 12, fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 12 },

  trendRow: { flexDirection: 'row' },
  trendBox: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  trendValue: { fontSize: 28, fontWeight: '900', color: '#0047AB' },
  trendLabel: { fontSize: 12, color: '#AAA', marginTop: 2 },

  progressRow: { marginBottom: 12 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  progressLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  progressCount: { fontSize: 13, color: '#333', fontWeight: '700' },
  progressPct: { fontSize: 11, color: '#AAA', fontWeight: '400' },
  progressTrack: { height: 6, backgroundColor: '#F0E8E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  statRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F5F0EC' },
  statRowLabel: { flex: 1, fontSize: 14, color: '#555' },
  statRowValue: { fontSize: 14, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F0E8E0', marginVertical: 12 },
});

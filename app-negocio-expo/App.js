import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const MERCHANT_ID = 1;

const COLORS = {
  purple: '#5B2A86',
  purpleDark: '#1D1037',
  purpleSoft: '#F2EAFB',
  bg: '#F7F4FB',
  card: '#FFFFFF',
  text: '#1D1037',
  muted: '#726A84',
  line: '#E9E1F5',
  green: '#1A6640',
  greenSoft: '#E6F7EE',
  red: '#C62828',
  redSoft: '#FDECEC',
  orange: '#A05D00',
  orangeSoft: '#FFF4DF',
};

const defaultProgram = {
  campaign_name: 'Cafe Lovers',
  points_per_dollar: 1,
  reward_threshold: 10,
  reward_type: 'discount',
  reward_value: '$1 de descuento en tu próxima compra',
  terms: 'Válido en compras desde $3. Un reward por compra.',
  active: true,
};

const rewardOptions = [
  { type: 'discount', label: 'Descuento fijo', value: '$1 de descuento en tu próxima compra', threshold: 10 },
  { type: 'percentage_off', label: 'Porcentaje off', value: '20% de descuento en toda la tienda', threshold: 15 },
  { type: 'free_product', label: 'Producto gratis', value: 'Café gratis', threshold: 20 },
];

const fallbackInsights = {
  clients_enrolled: 3,
  clients_recurring: 2,
  rewards_unlocked: 1,
  rewards_redeemed: 0,
  estimated_return: '+67% recurrencia',
  top_clients: [
    { name: 'Ana García', points_balance: 8, total_points_earned: 8 },
    { name: 'Luis Martínez', points_balance: 0, total_points_earned: 10 },
  ],
};

function apiUrl(path) {
  return `${API_URL}${path}`;
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `PUT ${path} failed`);
  return payload;
}

async function apiPost(path, body) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `POST ${path} failed`);
  return payload;
}

export default function App() {
  const [tab, setTab] = useState('inicio');
  const [program, setProgram] = useState(defaultProgram);
  const [insights, setInsights] = useState(fallbackInsights);

  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      const [programPayload, insightsPayload] = await Promise.all([
        apiGet(`/api/merchants/${MERCHANT_ID}/loyalty-program`).catch(() => null),
        apiGet(`/api/merchants/${MERCHANT_ID}/insights`).catch(() => null),
      ]);
      if (!mounted) return;
      if (programPayload) {
        setProgram({
          campaign_name: programPayload.campaign_name || defaultProgram.campaign_name,
          points_per_dollar: Number(programPayload.points_per_dollar || 1),
          reward_threshold: Number(programPayload.reward_threshold || 10),
          reward_type: programPayload.reward_type || 'discount',
          reward_value: programPayload.reward_value || defaultProgram.reward_value,
          terms: programPayload.terms || defaultProgram.terms,
          active: Boolean(programPayload.active),
        });
      }
      if (insightsPayload) setInsights(insightsPayload);
    }
    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.shell}>
        {tab === 'inicio' ? <HomeScreen program={program} insights={insights} setTab={setTab} /> : null}
        {tab === 'miCaja' ? <CashScreen insights={insights} /> : null}
        {tab === 'loyalty' ? <LoyaltyBuilder program={program} setProgram={setProgram} refreshInsights={setInsights} /> : null}
        {tab === 'scan' ? <ScannerScreen refreshInsights={setInsights} /> : null}
        {tab === 'menu' ? <MenuScreen /> : null}
      </View>
      <BottomNav current={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

function HomeScreen({ program, insights, setTab }) {
  const stats = [
    { label: 'Clientes rewards', value: String(insights.clients_enrolled ?? 0) },
    { label: 'Recurrentes', value: String(insights.clients_recurring ?? 0) },
    { label: 'Rewards listos', value: String(insights.rewards_unlocked ?? 0) },
    { label: 'Canjes', value: String(insights.rewards_redeemed ?? 0) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Panel negocio</Text>
      <Text style={styles.helper}>Demo Expo conectada a {API_URL}</Text>

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>Cafetería Luna</Text>
        <Text style={styles.heroTitle}>{program.campaign_name}</Text>
        <Text style={styles.heroSub}>{program.active ? 'Programa activo' : 'Programa pausado'} · ${program.points_per_dollar} = 1 punto</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accesos rápidos</Text>
        {[
          ['Programa Rewards', 'loyalty'],
          ['Escanear QR reward', 'scan'],
          ['Mi caja', 'miCaja'],
          ['Configuración', 'menu'],
        ].map(([label, target]) => (
          <TouchableOpacity key={label} style={styles.menuRow} onPress={() => setTab(target)}>
            <Text style={styles.menuText}>{label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function CashScreen({ insights }) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Mi caja</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen del día</Text>
        <Text style={styles.body}>Ventas demo: $248</Text>
        <Text style={styles.body}>Clientes en rewards: {insights.clients_enrolled}</Text>
        <Text style={styles.body}>Redenciones aplicadas: {insights.rewards_redeemed}</Text>
        <Text style={styles.body}>Retorno estimado: {insights.estimated_return}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Últimos movimientos</Text>
        <Text style={styles.body}>• Ana García — compra demo — puntos acumulados</Text>
        <Text style={styles.body}>• QR validado — reward de un solo uso</Text>
        <Text style={styles.body}>• Cliente recurrente — campaña activa</Text>
      </View>
    </ScrollView>
  );
}

function LoyaltyBuilder({ program, setProgram, refreshInsights }) {
  const [form, setForm] = useState(program);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const loadProgram = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiGet(`/api/merchants/${MERCHANT_ID}/loyalty-program`);
      const next = {
        campaign_name: payload.campaign_name || defaultProgram.campaign_name,
        points_per_dollar: Number(payload.points_per_dollar || 1),
        reward_threshold: Number(payload.reward_threshold || 10),
        reward_type: payload.reward_type || 'discount',
        reward_value: payload.reward_value || defaultProgram.reward_value,
        terms: payload.terms || defaultProgram.terms,
        active: Boolean(payload.active),
      };
      setForm(next);
      setProgram(next);
    } catch {
      setError('API no disponible. Puedes editar el demo local, pero no se guardará.');
      setForm(defaultProgram);
    } finally {
      setLoading(false);
    }
  }, [setProgram]);

  useEffect(() => {
    loadProgram();
  }, [loadProgram]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setStatus('');
  };

  const selectReward = (option) => {
    setForm((current) => ({
      ...current,
      reward_type: option.type,
      reward_value: option.value,
      reward_threshold: option.threshold,
    }));
    setStatus('');
  };

  const saveProgram = async () => {
    setSaving(true);
    setError('');
    setStatus('');
    const payload = {
      ...form,
      points_per_dollar: Number(form.points_per_dollar),
      reward_threshold: Number(form.reward_threshold),
    };

    try {
      const saved = await apiPut(`/api/merchants/${MERCHANT_ID}/loyalty-program`, payload);
      const next = {
        campaign_name: saved.campaign_name,
        points_per_dollar: Number(saved.points_per_dollar),
        reward_threshold: Number(saved.reward_threshold),
        reward_type: saved.reward_type,
        reward_value: saved.reward_value,
        terms: saved.terms,
        active: Boolean(saved.active),
      };
      setProgram(next);
      setForm(next);
      setStatus('Programa guardado. Tus clientes ya ven esta campaña.');
      const freshInsights = await apiGet(`/api/merchants/${MERCHANT_ID}/insights`).catch(() => null);
      if (freshInsights) refreshInsights(freshInsights);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la campaña.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Programa Rewards</Text>
      <Text style={styles.helper}>Constructor completo para configurar la campaña del negocio.</Text>

      {loading ? (
        <LoadingBlock label="Cargando campaña..." />
      ) : (
        <>
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Estado del programa</Text>
                <Text style={styles.helperNoMargin}>{form.active ? 'Activo para clientes' : 'Pausado temporalmente'}</Text>
              </View>
              <Switch value={form.active} onValueChange={(value) => setField('active', value)} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Datos de campaña</Text>
            <Field label="Nombre visible" value={form.campaign_name} onChangeText={(value) => setField('campaign_name', value)} />
            <View style={styles.twoColumns}>
              <Field label="$ por punto" value={String(form.points_per_dollar)} keyboardType="numeric" onChangeText={(value) => setField('points_per_dollar', value)} compact />
              <Field label="Meta puntos" value={String(form.reward_threshold)} keyboardType="numeric" onChangeText={(value) => setField('reward_threshold', value)} compact />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tipo de recompensa</Text>
            {rewardOptions.map((option) => (
              <TouchableOpacity key={option.type} style={[styles.rewardOption, form.reward_type === option.type && styles.rewardOptionActive]} onPress={() => selectReward(option)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rewardText, form.reward_type === option.type && styles.rewardTextActive]}>{option.label}</Text>
                  <Text style={[styles.rewardSub, form.reward_type === option.type && styles.rewardSubActive]}>{option.value}</Text>
                </View>
                <Text style={[styles.rewardMeta, form.reward_type === option.type && styles.rewardTextActive]}>{option.threshold} pts</Text>
              </TouchableOpacity>
            ))}
            <Field label="Valor del reward" value={form.reward_value} onChangeText={(value) => setField('reward_value', value)} />
            <Field label="Condiciones" value={form.terms} onChangeText={(value) => setField('terms', value)} multiline />
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>Vista del cliente</Text>
            <Text style={styles.previewTitle}>{form.campaign_name}</Text>
            <Text style={styles.previewBody}>${form.points_per_dollar || 1} = 1 punto · Meta: {form.reward_threshold || 0} puntos</Text>
            <Text style={styles.previewReward}>{form.reward_value}</Text>
          </View>

          {status ? <Text style={styles.successMessage}>{status}</Text> : null}
          {error ? <Text style={styles.errorMessage}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={saveProgram} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Guardar campaña</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function ScannerScreen({ refreshInsights }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canScan = permission?.granted && !result && !error;

  const redeemQr = async (qrCode) => {
    if (locked || loading) return;
    setLocked(true);
    setLoading(true);
    setError('');
    try {
      const payload = await apiPost('/api/rewards/redeem-by-qr', { qr_code: qrCode });
      setResult(payload);
      const freshInsights = await apiGet(`/api/merchants/${MERCHANT_ID}/insights`).catch(() => null);
      if (freshInsights) refreshInsights(freshInsights);
    } catch (err) {
      setError(err.message || 'QR no válido o ya fue canjeado');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLocked(false);
    setResult(null);
    setError('');
    setLoading(false);
  };

  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator color={COLORS.purple} size="large" />
        <Text style={styles.helper}>Preparando cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.scanIcon}>
          <Text style={styles.scanIconText}>QR</Text>
        </View>
        <Text style={styles.screenTitle}>Permiso de cámara</Text>
        <Text style={styles.centerText}>Necesitamos la cámara para validar rewards por QR.</Text>
        <TouchableOpacity style={styles.primaryButtonWide} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Permitir cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerScreen}>
      <Text style={styles.screenTitle}>Escanear reward</Text>
      <Text style={styles.helper}>Apunta al QR que muestra el cliente.</Text>

      <View style={styles.cameraFrame}>
        {canScan ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => redeemQr(data)}
          />
        ) : (
          <View style={styles.cameraFallback}>
            {loading ? <ActivityIndicator color={COLORS.purple} size="large" /> : null}
            <Text style={styles.cameraFallbackText}>{loading ? 'Validando QR...' : 'Escaneo pausado'}</Text>
          </View>
        )}
        <View style={styles.scanSquare} />
      </View>

      {result ? (
        <View style={styles.scanResultSuccess}>
          <Text style={styles.scanResultTitle}>Reward validado</Text>
          <Text style={styles.scanResultBody}>{result.reward_value}</Text>
          <Text style={styles.scanResultMeta}>{result.merchant_name}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.scanResultError}>
          <Text style={styles.scanErrorTitle}>No válido</Text>
          <Text style={styles.scanResultBody}>{error}</Text>
        </View>
      ) : null}

      {(result || error) ? (
        <TouchableOpacity style={styles.secondaryButton} onPress={reset}>
          <Text style={styles.secondaryButtonText}>Escanear otro QR</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function MenuScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.screenTitle}>Menú</Text>
      <View style={styles.card}>
        {['Perfil del negocio', 'Métodos de cobro', 'Notificaciones', 'Soporte'].map((item, index, items) => (
          <View key={item} style={[styles.menuRow, index === items.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={styles.menuText}>{item}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function Field({ label, value, onChangeText, keyboardType = 'default', multiline = false, compact = false }) {
  return (
    <View style={[styles.field, compact && { flex: 1 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function LoadingBlock({ label }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={COLORS.purple} size="large" />
      <Text style={styles.helper}>{label}</Text>
    </View>
  );
}

function BottomNav({ current, onChange }) {
  const items = useMemo(() => ([
    ['inicio', 'Inicio'],
    ['miCaja', 'Caja'],
    ['loyalty', 'Rewards'],
    ['scan', 'Escanear'],
    ['menu', 'Menú'],
  ]), []);

  return (
    <View style={styles.bottomNav}>
      {items.map(([key, label]) => (
        <TouchableOpacity key={key} style={styles.navItem} onPress={() => onChange(key)}>
          <Text style={[styles.navText, current === key && styles.navTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  shell: { flex: 1, maxWidth: 540, width: '100%', alignSelf: 'center' },
  content: { padding: 20, paddingBottom: 116 },
  screenTitle: { fontSize: 28, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  helper: { color: COLORS.muted, marginBottom: 14, lineHeight: 20 },
  helperNoMargin: { color: COLORS.muted, lineHeight: 20 },
  hero: { backgroundColor: COLORS.purple, borderRadius: 24, padding: 20, marginBottom: 18 },
  heroLabel: { color: '#EADFF7', fontWeight: '700', marginBottom: 4 },
  heroTitle: { color: '#fff', fontWeight: '900', fontSize: 26, marginBottom: 6 },
  heroSub: { color: '#EADFF7', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  statValue: { fontSize: 28, fontWeight: '900', color: COLORS.text },
  statLabel: { color: COLORS.muted, marginTop: 6, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.line },
  cardTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 12 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  menuText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  chevron: { color: COLORS.purple, fontSize: 24, fontWeight: '900' },
  body: { color: '#4F4662', lineHeight: 24, marginBottom: 8, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  twoColumns: { flexDirection: 'row', gap: 12 },
  field: { marginBottom: 12 },
  fieldLabel: { color: COLORS.muted, fontWeight: '800', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 14, backgroundColor: '#FAF8FD', color: COLORS.text, fontWeight: '800' },
  textArea: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  rewardOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E4DAF4', borderRadius: 14, padding: 14, marginBottom: 10 },
  rewardOptionActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  rewardText: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  rewardTextActive: { color: '#fff' },
  rewardSub: { color: COLORS.muted, marginTop: 3, fontWeight: '600' },
  rewardSubActive: { color: '#EADFF7' },
  rewardMeta: { color: COLORS.purple, fontWeight: '900' },
  previewBox: { backgroundColor: COLORS.purpleSoft, borderWidth: 1, borderColor: '#E4D7F4', borderRadius: 18, padding: 16, marginBottom: 14 },
  previewLabel: { color: COLORS.purple, fontWeight: '900', marginBottom: 8 },
  previewTitle: { color: COLORS.text, fontWeight: '900', fontSize: 20 },
  previewBody: { color: COLORS.muted, marginTop: 6, fontWeight: '700' },
  previewReward: { color: COLORS.purple, marginTop: 10, fontWeight: '900', fontSize: 16 },
  primaryButton: { backgroundColor: COLORS.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  primaryButtonWide: { backgroundColor: COLORS.purple, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', marginHorizontal: 20, marginTop: 12 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 17 },
  secondaryButton: { borderWidth: 2, borderColor: COLORS.purple, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  secondaryButtonText: { color: COLORS.purple, fontWeight: '900' },
  successMessage: { color: COLORS.green, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  errorMessage: { color: COLORS.red, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  loadingBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  scannerScreen: { flex: 1, padding: 20, paddingBottom: 110 },
  cameraFrame: { height: 360, borderRadius: 24, overflow: 'hidden', backgroundColor: '#111', borderWidth: 3, borderColor: COLORS.purple, marginTop: 4 },
  cameraFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5EFFB' },
  cameraFallbackText: { color: COLORS.purple, fontWeight: '900', marginTop: 10 },
  scanSquare: { position: 'absolute', width: 220, height: 220, borderWidth: 4, borderColor: '#fff', borderRadius: 22, alignSelf: 'center', top: 70 },
  scanResultSuccess: { backgroundColor: COLORS.greenSoft, borderColor: '#B7E8CC', borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16 },
  scanResultError: { backgroundColor: COLORS.redSoft, borderColor: '#F3C5C5', borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16 },
  scanResultTitle: { color: COLORS.green, fontWeight: '900', fontSize: 18 },
  scanErrorTitle: { color: COLORS.red, fontWeight: '900', fontSize: 18 },
  scanResultBody: { color: COLORS.text, fontWeight: '800', marginTop: 6, lineHeight: 20 },
  scanResultMeta: { color: COLORS.muted, marginTop: 4, fontWeight: '700' },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerText: { color: COLORS.muted, textAlign: 'center', lineHeight: 21, marginBottom: 12 },
  scanIcon: { width: 96, height: 96, borderRadius: 28, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  scanIconText: { color: COLORS.purple, fontWeight: '900', fontSize: 28 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.line, paddingVertical: 10 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  navText: { color: '#9087A3', fontWeight: '700', fontSize: 12 },
  navTextActive: { color: COLORS.purple, fontWeight: '900' },
});

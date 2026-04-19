import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.69.233:3000';
const USER_ID = 1;

const homePreview = require('./assets/ImagenesUsuario/home.jpeg');
const benefitsPreview = require('./assets/ImagenesUsuario/beneficios.jpeg');

const COLORS = {
  purple: '#4B168C',
  purpleDark: '#21122F',
  purpleSoft: '#F0E7FA',
  bg: '#F8F8FA',
  card: '#FFFFFF',
  text: '#202026',
  muted: '#697080',
  line: '#E7E7EC',
  green: '#0F7A4D',
  greenSoft: '#E7F7EF',
  orange: '#C26B00',
  orangeSoft: '#FFF2DD',
  red: '#B3261E',
};

const fallbackMerchants = [
  {
    id: 1,
    name: 'Cafeteria Luna',
    category: 'Cafeteria',
    description: 'El mejor cafe del barrio',
    loyalty_enabled: true,
    campaign_name: 'Cafe Lovers',
    points_per_dollar: 100,
    business_category: 'Cafeteria',
    reward_tiers: [
      { id: 'cafe-500', points: 500, title: 'Cafe gratis' },
      { id: 'cafe-1000', points: 1000, title: 'Combo desayuno' },
      { id: 'cafe-2000', points: 2000, title: 'Postre gratis' },
    ],
  },
  {
    id: 2,
    name: 'Barber Shop Centro',
    category: 'Peluqueria/Barberia',
    description: 'Cortes modernos y clasicos',
    loyalty_enabled: true,
    campaign_name: 'Cortes Frecuentes',
    points_per_dollar: 100,
    business_category: 'Peluqueria/Barberia',
    reward_tiers: [
      { id: 'barber-500', points: 500, title: 'Lavado de pelo gratis' },
      { id: 'barber-1000', points: 1000, title: 'Corte gratis' },
      { id: 'barber-2000', points: 2000, title: 'Producto de belleza gratis' },
    ],
  },
];

const fallbackPoints = [
  {
    merchant_id: 1,
    merchant_name: 'Cafeteria Luna',
    category: 'Cafeteria',
    campaign_name: 'Cafe Lovers',
    points_balance: 800,
    total_points_earned: 800,
    points_per_dollar: 100,
    reward_tiers: fallbackMerchants[0].reward_tiers,
  },
];

function apiUrl(path) {
  return `${API_URL}${path}`;
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiPost(path, body) {
  let res;
  try {
    res = await fetch(apiUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(`No se pudo conectar con ${API_URL}. Revisa que el celular y el PC esten en la misma red.`);
  }
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || `POST ${path} failed`);
  return payload;
}

function tiersFrom(row) {
  if (Array.isArray(row?.reward_tiers) && row.reward_tiers.length) {
    return row.reward_tiers.map((tier, index) => ({
      id: String(tier.id || `tier-${index}`),
      points: Number(tier.points),
      title: String(tier.title || tier.reward_value || 'Reward'),
    }));
  }
  const threshold = Number(row?.reward_threshold || 500);
  return [{ id: `tier-${threshold}`, points: threshold, title: row?.reward_value || 'Reward disponible' }];
}

function normalizeMerchant(row) {
  return {
    ...row,
    id: Number(row.id),
    points_per_dollar: Number(row.points_per_dollar || 100),
    business_category: row.business_category || row.category || 'Tienda',
    reward_tiers: tiersFrom(row),
  };
}

function normalizePoint(row) {
  return {
    ...row,
    merchant_id: Number(row.merchant_id),
    points_balance: Number(row.points_balance || 0),
    total_points_earned: Number(row.total_points_earned || 0),
    points_per_dollar: Number(row.points_per_dollar || 100),
    reward_tiers: tiersFrom(row),
  };
}

function merchantEmoji(category = '') {
  if (category.includes('Cafe')) return '☕';
  if (category.includes('Barber') || category.includes('Peluqueria')) return '✂️';
  if (category.includes('Pan')) return '🥐';
  if (category.includes('Tienda')) return '🛒';
  if (category.includes('Farmacia')) return '💊';
  return '🎁';
}

export default function App() {
  const [tab, setTab] = useState('inicio');
  const [merchant, setMerchant] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(true);

  const goTab = (next) => {
    setMerchant(null);
    setTransferOpen(false);
    setTab(next);
  };

  let content;
  if (transferOpen) {
    content = <TransferScreen onBack={() => setTransferOpen(false)} onOpenPoints={() => goTab('puntos')} />;
  } else if (merchant) {
    content = <RewardStoreScreen merchant={merchant} onBack={() => setMerchant(null)} />;
  } else if (tab === 'puntos') {
    content = <PointsScreen onOpenMerchant={setMerchant} />;
  } else if (tab === 'beneficios') {
    content = <BenefitsScreen onOpenMerchant={setMerchant} />;
  } else if (tab === 'billetera') {
    content = <WalletScreen />;
  } else if (tab === 'tu') {
    content = <ProfileScreen />;
  } else {
    content = <HomeScreen onTransfer={() => setTransferOpen(true)} onOpenPoints={() => goTab('puntos')} onOpenBenefits={() => goTab('beneficios')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.appContainer}>
        <View style={styles.contentContainer}>{content}</View>
        {!merchant && !transferOpen ? <BottomNav current={tab} onChange={goTab} /> : null}
      </View>
      <Modal visible={welcomeOpen} transparent animationType="fade" onRequestClose={() => setWelcomeOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.welcomeModal}>
            <Text style={styles.welcomeEmoji}>🎁</Text>
            <Text style={styles.welcomeTitle}>Ahora puedes ganar más usando De Una en los negocios</Text>
            <Text style={styles.welcomeText}>
              Cada $1 que gastas en negocios participantes suma <Text style={{ fontWeight: '900' }}>100 puntos</Text>. Acumula puntos y canjeálos por premios reales: cafés gratis, descuentos, productos y más.
            </Text>
            <View style={styles.welcomeBenefits}>
              <View style={styles.welcomeBenefit}><Text style={styles.welcomeBenefitIcon}>☕</Text><Text style={styles.welcomeBenefitText}>Premios en tu negocio favorito</Text></View>
              <View style={styles.welcomeBenefit}><Text style={styles.welcomeBenefitIcon}>📈</Text><Text style={styles.welcomeBenefitText}>$1 = 100 puntos automáticos</Text></View>
              <View style={styles.welcomeBenefit}><Text style={styles.welcomeBenefitIcon}>🏪</Text><Text style={styles.welcomeBenefitText}>Canjea en la tienda de rewards</Text></View>
            </View>
            <TouchableOpacity style={styles.welcomeButton} onPress={() => setWelcomeOpen(false)}>
              <Text style={styles.welcomeButtonText}>¡Entendido, a ganar!</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.welcomeSecondary} onPress={() => { setWelcomeOpen(false); goTab('puntos'); }}>
              <Text style={styles.welcomeSecondaryText}>Ver mis puntos ahora</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HomeScreen({ onTransfer, onOpenPoints, onOpenBenefits }) {
  const [pointRows, setPointRows] = useState([]);

  useEffect(() => {
    apiGet(`/api/users/${USER_ID}/points`)
      .then((rows) => setPointRows(rows.map(normalizePoint)))
      .catch(() => setPointRows(fallbackPoints.map(normalizePoint)));
  }, []);

  const actions = [
    { label: 'Transferir', icon: 'cash-outline', onPress: onTransfer },
    { label: 'Transferir a\notro banco', icon: 'bank-transfer', type: 'mci' },
    { label: 'Recargar', icon: 'wallet-outline' },
    { label: 'Cobrar', icon: 'card-outline' },
    { label: 'Retirar', icon: 'storefront-outline' },
    { label: 'Recarga\ncelular', icon: 'phone-portrait-outline' },
    { label: 'Pagar\nservicios', icon: 'receipt-outline' },
    { label: 'Metro de\nQuito', icon: 'train-outline' },
    { label: 'Deuna\nJovenes', icon: 'people-outline' },
    { label: 'Tienda Deuna', icon: 'cart-outline' },
    { label: 'Mis puntos', icon: 'gift-outline', onPress: onOpenPoints },
  ];

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <View style={styles.homeHeaderLeft}>
            <View style={styles.avatarCircle}><Text style={styles.avatarText}>PJ</Text></View>
            <Text style={styles.greeting}>Hola Pablo</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="notifications-outline" size={25} color={COLORS.text} />
            <Ionicons name="headset-outline" size={25} color={COLORS.text} />
          </View>
        </View>

        <Image source={homePreview} style={styles.referenceImage} resizeMode="cover" />

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>$4,00</Text>
            <Ionicons name="eye" size={26} color={COLORS.text} />
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={28} color={COLORS.text} />
          </View>
          <View style={styles.reloadRow}>
            <View>
              <Text style={styles.reloadLabel}>Recargar desde</Text>
              <Text style={styles.reloadAccount}>Principal ******7862</Text>
            </View>
            <View style={styles.reloadPill}><Text style={styles.reloadPillText}>+ $20</Text></View>
          </View>
        </View>

        <View style={styles.grid}>
          {actions.map((item) => <ShortcutCard key={item.label} item={item} />)}
        </View>

        <PointsHomeStrip points={pointRows} onOpenPoints={onOpenPoints} />

        <Text style={styles.sectionTitle}>Mis promociones</Text>
        <TouchableOpacity style={styles.scanBanner} onPress={onOpenBenefits}>
          <Ionicons name="qr-code-outline" size={26} color="#fff" />
          <Text style={styles.scanBannerText}>Escanear QR</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function PointsHomeStrip({ points, onOpenPoints }) {
  const total = points.reduce((sum, row) => sum + Number(row.points_balance || 0), 0);
  const top = points.slice(0, 2);
  return (
    <TouchableOpacity style={styles.pointsStrip} onPress={onOpenPoints}>
      <View style={styles.pointsStripIcon}><Text style={styles.pointsStripEmoji}>🏆</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.pointsStripTitle}>Tus puntos Deuna</Text>
        <Text style={styles.pointsStripText}>
          {top.length ? top.map((row) => `${row.merchant_name}: ${row.points_balance}`).join(' · ') : 'Inscribete en tu proxima transferencia'}
        </Text>
      </View>
      <View style={styles.pointsStripTotal}>
        <Text style={styles.pointsStripTotalValue}>{total}</Text>
        <Text style={styles.pointsStripTotalLabel}>pts</Text>
      </View>
    </TouchableOpacity>
  );
}

function TransferScreen({ onBack, onOpenPoints }) {
  const [merchants, setMerchants] = useState([]);
  const [merchantId, setMerchantId] = useState(1);
  const [amount, setAmount] = useState('5');
  const [joinRewards, setJoinRewards] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [scannedQr, setScannedQr] = useState('');
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    apiGet('/api/merchants')
      .then((rows) => setMerchants(rows.filter((row) => row.loyalty_enabled).map(normalizeMerchant)))
      .catch(() => setMerchants(fallbackMerchants.map(normalizeMerchant)));
  }, []);

  const selected = merchants.find((item) => Number(item.id) === Number(merchantId)) || merchants[0] || fallbackMerchants[0];

  const openScanner = async () => {
    setError('');
    setScanLocked(false);
    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response.granted) {
        setError('Necesitamos permiso de camara para escanear el QR de pago.');
        return;
      }
    }
    setScanOpen(true);
  };

  const handlePaymentQr = async (data) => {
    if (scanLocked) return;
    setScanLocked(true);
    setError('');
    try {
      const payload = await apiPost('/api/transactions/resolve-payment-qr', { qr_code: data });
      const scannedMerchant = normalizeMerchant(payload.merchant);
      setMerchants((current) => {
        const exists = current.some((item) => Number(item.id) === Number(scannedMerchant.id));
        return exists ? current : [scannedMerchant, ...current];
      });
      setMerchantId(scannedMerchant.id);
      if (payload.amount) setAmount(String(payload.amount).replace('.', ','));
      setScannedQr(data);
      setResult(null);
      setScanOpen(false);
    } catch (err) {
      setError(err.message || 'No se pudo leer el QR de pago.');
      setScanLocked(false);
    }
  };

  const completeTransfer = async () => {
    const numericAmount = Number(String(amount).replace(',', '.'));
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresa un monto valido.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const path = scannedQr ? '/api/transactions/pay-qr' : '/api/transactions/simulate';
      const payload = await apiPost(path, {
        user_id: USER_ID,
        merchant_id: selected.id,
        amount: numericAmount,
        enroll_rewards: joinRewards,
        qr_code: scannedQr || undefined,
      });
      setResult({ ...payload, merchant_name: selected.name, amount: numericAmount });
    } catch (err) {
      setError(err.message || 'No se pudo completar la transferencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Transferir" onBack={onBack} />
        <TouchableOpacity style={styles.scanPayButton} onPress={openScanner}>
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
          <Text style={styles.scanPayButtonText}>Escanear QR de pago DeUna</Text>
        </TouchableOpacity>
        {scannedQr ? (
          <View style={styles.scannedPayBox}>
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.green} />
            <Text style={styles.scannedPayText}>QR cargado para pagar a {selected.name}</Text>
          </View>
        ) : null}
        {result?.enrolled ? (
          <View style={styles.pointsWonBanner}>
            <Ionicons name="gift-outline" size={22} color={COLORS.green} />
            <Text style={styles.pointsWonText}>Haz ganado {result.points_earned} puntos en {result.merchant_name}</Text>
          </View>
        ) : null}

        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Monto</Text>
          <TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.transferAmountInput} />
        </View>

        <Text style={styles.listLabel}>Negocio</Text>
        {merchants.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.choiceRow, merchantId === item.id && styles.choiceRowActive]} onPress={() => setMerchantId(item.id)}>
            <View style={styles.merchantIcon}><Ionicons name="storefront-outline" size={22} color={COLORS.purple} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{item.name}</Text>
              <Text style={styles.merchantDesc}>{item.business_category}</Text>
            </View>
            <Text style={styles.choiceCheck}>{merchantId === item.id ? '✓' : ''}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.joinCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Inscribirme al sistema de puntos</Text>
            <Text style={styles.helperText}>Si aceptas, cada $1 suma 100 puntos en {selected.name}.</Text>
          </View>
          <Switch value={joinRewards} onValueChange={setJoinRewards} />
        </View>

        {result && !result.enrolled ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Transferencia completa. No sumaste puntos porque no te inscribiste.</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={completeTransfer} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Completar transferencia</Text>}
        </TouchableOpacity>
        {result?.enrolled ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenPoints}>
            <Text style={styles.secondaryButtonText}>Ver mis puntos</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={styles.qrScannerScreen}>
          <View style={styles.qrScannerHeader}>
            <TouchableOpacity style={styles.backButton} onPress={() => setScanOpen(false)}>
              <Ionicons name="chevron-back" size={26} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.screenHeaderTitle}>Escanear QR de pago</Text>
            <View style={{ width: 42 }} />
          </View>
          <View style={styles.qrCameraFrame}>
            {permission?.granted ? (
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={({ data }) => handlePaymentQr(data)}
              />
            ) : <LoadingBlock label="Activando camara..." />}
            <View style={styles.qrScanSquare} />
          </View>
          <Text style={styles.qrScannerHelp}>Apunta al QR de cobro que aparece en la app del negocio.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </Modal>
    </View>
  );
}

function PointsScreen({ onOpenMerchant }) {
  const [points, setPoints] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pointRows, merchantRows] = await Promise.all([
        apiGet(`/api/users/${USER_ID}/points`),
        apiGet('/api/merchants'),
      ]);
      setPoints(pointRows.map(normalizePoint));
      setMerchants(merchantRows.filter((row) => row.loyalty_enabled).map(normalizeMerchant));
    } catch {
      setError('API no disponible. Mostrando datos demo.');
      setPoints(fallbackPoints.map(normalizePoint));
      setMerchants(fallbackMerchants.map(normalizeMerchant));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const enrolledIds = new Set(points.map((row) => row.merchant_id));
  const enrolled = points.map((row) => {
    const merchant = merchants.find((item) => item.id === row.merchant_id);
    return normalizeMerchant({ ...merchant, ...row, id: row.merchant_id, name: row.merchant_name || merchant?.name });
  });
  const available = merchants.filter((item) => !enrolledIds.has(item.id));

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Mis puntos</Text>
        {error ? <Text style={styles.apiNote}>{error}</Text> : null}
        {loading ? <LoadingBlock label="Cargando puntos..." /> : (
          <>
            <Text style={styles.listLabel}>Negocios donde estas inscrito</Text>
            {enrolled.length ? enrolled.map((row) => (
              <TouchableOpacity key={row.id} style={styles.pointsRow} onPress={() => onOpenMerchant(row)}>
                <View style={styles.pointsBadge}><Text style={styles.pointsBadgeText}>{row.points_balance}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.merchantName}>{row.name}</Text>
                  <Text style={styles.merchantDesc}>{row.campaign_name}</Text>
                </View>
                <Text style={styles.pointsLabel}>pts</Text>
              </TouchableOpacity>
            )) : <EmptyState title="Aun no tienes puntos" body="Transfiere a un negocio y acepta inscribirte." />}

            <Text style={styles.listLabel}>Tiendas de recompensas disponibles</Text>
            {available.map((item) => (
              <TouchableOpacity key={item.id} style={styles.merchantRow} onPress={() => onOpenMerchant({ ...item, points_balance: 0 })}>
                <View style={styles.merchantIcon}><Ionicons name="storefront-outline" size={22} color={COLORS.purple} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.merchantName}>{item.name}</Text>
                  <Text style={styles.merchantDesc}>Inscribete en tu proxima transferencia</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RewardStoreScreen({ merchant, onBack }) {
  const [pointsRow, setPointsRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [celebration, setCelebration] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await apiGet(`/api/users/${USER_ID}/points`);
      const found = rows.map(normalizePoint).find((row) => row.merchant_id === Number(merchant.id));
      setPointsRow(found || { ...merchant, merchant_id: merchant.id, merchant_name: merchant.name, points_balance: Number(merchant.points_balance || 0), reward_tiers: tiersFrom(merchant) });
    } catch {
      setPointsRow({ ...merchant, merchant_id: merchant.id, merchant_name: merchant.name, points_balance: Number(merchant.points_balance || 0), reward_tiers: tiersFrom(merchant) });
    } finally {
      setLoading(false);
    }
  }, [merchant]);

  useEffect(() => { load(); }, [load]);

  const balance = Number(pointsRow?.points_balance || 0);
  const tiers = tiersFrom(pointsRow || merchant);
  const nextTier = tiers.find((tier) => balance < tier.points);

  const redeem = async (tier) => {
    setRedeeming(tier.id);
    setMessage('');
    setError('');
    try {
      const payload = await apiPost('/api/rewards/redeem-store', {
        user_id: USER_ID,
        merchant_id: Number(merchant.id || merchant.merchant_id),
        tier_id: tier.id,
        points: tier.points,
        title: tier.title,
      });
      setMessage(`Generaste el QR para ${tier.title}. Te quedan ${payload.current_points} puntos.`);
      setCelebration({ title: tier.title, points: tier.points, remaining: payload.current_points, qr_code: payload.qr_code });
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo canjear esta recompensa.');
    } finally {
      setRedeeming('');
    }
  };

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={merchant.name || merchant.merchant_name} onBack={onBack} />
        <View style={styles.storeHero}>
          <View style={styles.storeHeroTop}>
            <Text style={styles.storeHeroEmoji}>{merchantEmoji(merchant.business_category || merchant.category)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.storeHeroLabel}>Tienda de recompensas</Text>
              <Text style={styles.storeHeroTitle}>{merchant.name || merchant.merchant_name}</Text>
            </View>
          </View>
          <Text style={styles.storeHeroText}>Canjea puntos por premios reales. Tus puntos se descuentan al confirmar.</Text>
          <Text style={styles.storeHeroPoints}>{balance} puntos disponibles</Text>
          {nextTier ? <Text style={styles.storeHeroHint}>Te faltan {nextTier.points - balance} pts para {nextTier.title}</Text> : <Text style={styles.storeHeroHint}>Tienes puntos para cualquier premio visible.</Text>}
        </View>
        {loading ? <LoadingBlock label="Cargando tienda..." /> : (
          <>
            {message ? <Text style={styles.successText}>{message}</Text> : null}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {tiers.map((tier) => {
              const canRedeem = balance >= tier.points;
              const progress = Math.min((balance / tier.points) * 100, 100);
              return (
                <View key={tier.id} style={styles.rewardCard}>
                  <View style={[styles.rewardIcon, canRedeem && styles.rewardIconReady]}><Text style={styles.rewardIconEmoji}>{canRedeem ? '🎉' : '🎁'}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardTitle}>{tier.title}</Text>
                    <Text style={styles.rewardCost}>{tier.points} puntos</Text>
                    <View style={styles.rewardProgressTrack}>
                      <View style={[styles.rewardProgressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.rewardProgressText}>{canRedeem ? 'Listo para canjear' : `Faltan ${tier.points - balance} puntos`}</Text>
                  </View>
                  <TouchableOpacity style={[styles.redeemButton, !canRedeem && styles.redeemButtonDisabled]} disabled={!canRedeem || redeeming === tier.id} onPress={() => redeem(tier)}>
                    {redeeming === tier.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.redeemButtonText}>{canRedeem ? 'Canjear' : 'Faltan'}</Text>}
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      <Modal visible={Boolean(celebration)} transparent animationType="fade" onRequestClose={() => setCelebration(null)}>
        <View style={styles.modalShade}>
          <View style={styles.confettiModal}>
            <Text style={styles.confettiTop}>🎊  🎉  🎊</Text>
            <Text style={styles.confettiTitle}>Premio canjeado</Text>
            <Text style={styles.confettiPrize}>{celebration?.title}</Text>
            {celebration?.qr_code ? (
              <View style={styles.rewardQrBox}>
                <QRCode value={celebration.qr_code} size={190} />
              </View>
            ) : null}
            <Text style={styles.confettiText}>Muestra este QR al negocio para validar tu premio. Usaste {celebration?.points} puntos y te quedan {celebration?.remaining}.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setCelebration(null)}>
              <Text style={styles.primaryButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BenefitsScreen({ onOpenMerchant }) {
  const [merchants, setMerchants] = useState([]);
  const [active, setActive] = useState('rewards');

  useEffect(() => {
    apiGet('/api/merchants')
      .then((rows) => setMerchants(rows.filter((row) => row.loyalty_enabled).map(normalizeMerchant)))
      .catch(() => setMerchants(fallbackMerchants.map(normalizeMerchant)));
  }, []);

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Beneficios</Text>
        <Image source={benefitsPreview} style={styles.referenceImageTall} resizeMode="cover" />
        <View style={styles.topTabs}>
          {['rewards', 'club', 'promos'].map((key) => (
            <TouchableOpacity key={key} style={[styles.topTab, active === key && styles.topTabActive]} onPress={() => setActive(key)}>
              <Text style={[styles.topTabText, active === key && styles.topTabTextActive]}>{key === 'rewards' ? 'Rewards' : key === 'club' ? 'Club Deuna' : 'Promociones'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {active === 'rewards' ? merchants.map((item) => (
          <TouchableOpacity key={item.id} style={styles.merchantRow} onPress={() => onOpenMerchant(item)}>
            <View style={styles.merchantIcon}><Ionicons name="gift-outline" size={22} color={COLORS.purple} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{item.name}</Text>
              <Text style={styles.merchantDesc}>{item.reward_tiers.length} recompensas disponibles</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )) : <ClubOrPromo active={active} />}
      </ScrollView>
    </View>
  );
}

function ClubOrPromo({ active }) {
  return (
    <View style={styles.largeCard}>
      <Text style={styles.cardTitle}>{active === 'club' ? 'Nivel Bronce' : 'Promociones'}</Text>
      <Text style={styles.helperText}>{active === 'club' ? 'Completa pagos y sube tu nivel.' : 'Combos y descuentos en tus negocios favoritos.'}</Text>
    </View>
  );
}

function WalletScreen() {
  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Billetera</Text>
        <View style={styles.largeCard}><Text style={styles.cardTitle}>Principal ******7862</Text><Text style={styles.balanceAmountSmall}>$4,00</Text></View>
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.profileScreen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}><Text style={styles.avatarText}>PJ</Text></View>
          <Text style={styles.profileName}>Pablo</Text>
          <Text style={styles.profileMeta}>Version demo rewards</Text>
        </View>
        <View style={styles.profileCard}>
          {['Informacion personal', 'Pagos sin internet', 'Cambio de clave', 'Beneficios', 'Ayuda'].map((item) => (
            <View key={item} style={styles.profileRow}>
              <Text style={styles.profileRowText}>{item}</Text>
              <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ShortcutCard({ item }) {
  const icon = item.type === 'mci'
    ? <MaterialCommunityIcons name={item.icon} size={30} color={COLORS.purple} />
    : <Ionicons name={item.icon} size={30} color={COLORS.purple} />;
  return (
    <TouchableOpacity style={styles.shortcutCard} onPress={item.onPress}>
      <View style={styles.shortcutIconWrap}>{icon}</View>
      <Text style={styles.shortcutLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={26} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.screenHeaderTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 42 }} />
    </View>
  );
}

function LoadingBlock({ label }) {
  return (
    <View style={styles.loadingBlock}>
      <ActivityIndicator color={COLORS.purple} size="large" />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

function EmptyState({ title, body }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="gift-outline" size={36} color={COLORS.purple} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function BottomNav({ current, onChange }) {
  const tabs = [
    { key: 'inicio', label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
    { key: 'beneficios', label: 'Beneficios', icon: 'gift-outline', activeIcon: 'gift' },
    { key: 'puntos', label: 'Puntos', icon: 'trophy-outline', activeIcon: 'trophy' },
    { key: 'billetera', label: 'Billetera', icon: 'wallet-outline', activeIcon: 'wallet' },
    { key: 'tu', label: 'Tu', icon: 'person-circle-outline', activeIcon: 'person-circle' },
  ];
  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
        const isActive = current === item.key;
        return (
          <TouchableOpacity key={item.key} style={styles.bottomNavItem} onPress={() => onChange(item.key)}>
            <Ionicons name={isActive ? item.activeIcon : item.icon} size={23} color={isActive ? COLORS.purple : '#7782A0'} />
            <Text style={[styles.bottomNavText, isActive && styles.bottomNavTextActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  appContainer: { flex: 1, backgroundColor: COLORS.bg },
  contentContainer: { flex: 1 },
  screenBase: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 18, paddingBottom: 122 },
  detailContent: { padding: 18, paddingBottom: 40 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 6 },
  homeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.purpleSoft, borderWidth: 3, borderColor: '#F1A483', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '900', color: COLORS.purple, fontSize: 17 },
  greeting: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  headerIcons: { flexDirection: 'row', gap: 16 },
  referenceImage: { width: '100%', height: 190, borderRadius: 20, marginBottom: 14 },
  referenceImageTall: { width: '100%', height: 250, borderRadius: 20, marginBottom: 16 },
  balanceCard: { backgroundColor: COLORS.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#ECECF1', marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  balanceLabel: { fontSize: 16, color: '#444', marginHorizontal: 18, marginTop: 18, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 16 },
  balanceAmount: { fontSize: 42, fontWeight: '900', color: COLORS.text, marginRight: 12 },
  reloadRow: { borderTopWidth: 1, borderTopColor: COLORS.line, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reloadLabel: { color: COLORS.muted, fontSize: 16 },
  reloadAccount: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginTop: 2 },
  reloadPill: { backgroundColor: '#fff', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  reloadPillText: { color: COLORS.purple, fontWeight: '900', fontSize: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  shortcutCard: { width: (width - 60) / 4, minWidth: 70, alignItems: 'center', marginBottom: 16 },
  shortcutIconWrap: { width: 62, height: 62, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECECF1', marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
  shortcutLabel: { fontSize: 13, textAlign: 'center', color: COLORS.text, lineHeight: 17 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text, marginTop: 6, marginBottom: 14 },
  scanBanner: { backgroundColor: COLORS.purple, borderRadius: 10, minHeight: 62, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 12, marginBottom: 20 },
  scanBannerText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  pointsStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.purpleSoft, borderRadius: 18, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#DFC8F7' },
  pointsStripIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  pointsStripEmoji: { fontSize: 24 },
  pointsStripTitle: { color: COLORS.purpleDark, fontWeight: '900', fontSize: 16 },
  pointsStripText: { color: '#6D5A80', fontWeight: '700', marginTop: 3, fontSize: 12 },
  pointsStripTotal: { backgroundColor: COLORS.purple, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 64 },
  pointsStripTotalValue: { color: '#fff', fontWeight: '900', fontSize: 17 },
  pointsStripTotalLabel: { color: '#EADDF8', fontSize: 10, fontWeight: '800' },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  screenHeaderTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontWeight: '900', fontSize: 19, marginHorizontal: 10 },
  scanPayButton: { backgroundColor: COLORS.purple, borderRadius: 12, minHeight: 58, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  scanPayButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  scannedPayBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.greenSoft, borderRadius: 14, padding: 12, marginBottom: 14 },
  scannedPayText: { color: COLORS.green, fontWeight: '900', flex: 1 },
  qrScannerScreen: { flex: 1, backgroundColor: COLORS.bg, padding: 18 },
  qrScannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 18 },
  qrCameraFrame: { height: 430, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111', borderWidth: 3, borderColor: COLORS.purple },
  qrScanSquare: { position: 'absolute', width: 230, height: 230, borderWidth: 4, borderColor: '#fff', borderRadius: 22, alignSelf: 'center', top: 95 },
  qrScannerHelp: { color: COLORS.muted, textAlign: 'center', fontWeight: '800', lineHeight: 21, marginTop: 18 },
  pointsWonBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.greenSoft, borderColor: '#A9E4C4', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16 },
  pointsWonText: { color: COLORS.green, fontWeight: '900', flex: 1, lineHeight: 20 },
  amountCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, marginBottom: 16 },
  amountLabel: { color: COLORS.muted, fontSize: 18, marginBottom: 6 },
  transferAmountInput: { color: COLORS.text, fontWeight: '900', fontSize: 48, minWidth: 130, textAlign: 'center' },
  listLabel: { fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 10, marginTop: 4 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  choiceRowActive: { borderColor: COLORS.purple, backgroundColor: COLORS.purpleSoft },
  choiceCheck: { color: COLORS.purple, fontWeight: '900', fontSize: 18, width: 20 },
  joinCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.line, marginVertical: 12 },
  cardTitle: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
  helperText: { color: COLORS.muted, lineHeight: 20, marginTop: 5 },
  primaryButton: { backgroundColor: COLORS.purple, borderRadius: 12, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  secondaryButton: { borderWidth: 2, borderColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryButtonText: { color: COLORS.purple, fontWeight: '900' },
  infoBox: { backgroundColor: COLORS.orangeSoft, borderRadius: 14, padding: 12, marginVertical: 10 },
  infoText: { color: COLORS.orange, fontWeight: '800' },
  errorText: { color: COLORS.red, fontWeight: '900', textAlign: 'center', marginVertical: 10 },
  pageTitle: { fontSize: 25, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  apiNote: { color: COLORS.orange, fontWeight: '800', backgroundColor: COLORS.orangeSoft, padding: 12, borderRadius: 12, marginBottom: 12 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  pointsBadge: { width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  pointsBadgeText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  pointsLabel: { color: COLORS.purple, fontWeight: '900' },
  merchantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  merchantIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  merchantName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  merchantDesc: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  storeHero: { backgroundColor: COLORS.purple, borderRadius: 22, padding: 18, marginBottom: 16 },
  storeHeroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  storeHeroEmoji: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff', textAlign: 'center', textAlignVertical: 'center', fontSize: 34, overflow: 'hidden' },
  storeHeroLabel: { color: '#EBDDF9', fontWeight: '800', marginBottom: 6 },
  storeHeroTitle: { color: '#fff', fontWeight: '900', fontSize: 24 },
  storeHeroText: { color: '#EBDDF9', lineHeight: 20, fontWeight: '700', marginBottom: 12 },
  storeHeroPoints: { color: '#fff', fontWeight: '900', fontSize: 18, marginTop: 12 },
  storeHeroHint: { color: '#EBDDF9', fontWeight: '800', marginTop: 6 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  rewardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  rewardIconReady: { backgroundColor: COLORS.greenSoft },
  rewardIconEmoji: { fontSize: 23 },
  rewardTitle: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  rewardCost: { color: COLORS.purple, fontWeight: '800', marginTop: 3 },
  rewardProgressTrack: { height: 7, backgroundColor: '#ECECF1', borderRadius: 999, marginTop: 8, overflow: 'hidden' },
  rewardProgressFill: { height: '100%', backgroundColor: COLORS.purple, borderRadius: 999 },
  rewardProgressText: { color: COLORS.muted, marginTop: 5, fontSize: 11, fontWeight: '800' },
  redeemButton: { backgroundColor: COLORS.purple, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minWidth: 76, alignItems: 'center' },
  redeemButtonDisabled: { backgroundColor: '#C9C3D4' },
  redeemButtonText: { color: '#fff', fontWeight: '900' },
  successText: { color: COLORS.green, backgroundColor: COLORS.greenSoft, padding: 12, borderRadius: 12, marginBottom: 12, fontWeight: '900' },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  confettiModal: { width: '100%', backgroundColor: '#fff', borderRadius: 22, padding: 22, alignItems: 'center' },
  confettiTop: { fontSize: 34, marginBottom: 10 },
  confettiTitle: { color: COLORS.text, fontWeight: '900', fontSize: 24, textAlign: 'center' },
  confettiPrize: { color: COLORS.purple, fontWeight: '900', fontSize: 20, textAlign: 'center', marginTop: 8 },
  confettiText: { color: COLORS.muted, textAlign: 'center', lineHeight: 21, marginTop: 8, marginBottom: 10 },
  rewardQrBox: { backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line, marginTop: 16, marginBottom: 8 },
  welcomeModal: { width: '100%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center' },
  welcomeEmoji: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { color: COLORS.purpleDark, fontWeight: '900', fontSize: 20, textAlign: 'center', marginBottom: 10, lineHeight: 26 },
  welcomeText: { color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 16, fontSize: 14 },
  welcomeBenefits: { width: '100%', gap: 10, marginBottom: 20 },
  welcomeBenefit: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8F0FF', borderRadius: 12, padding: 12 },
  welcomeBenefitIcon: { fontSize: 22 },
  welcomeBenefitText: { color: COLORS.text, fontWeight: '700', flex: 1 },
  welcomeButton: { backgroundColor: COLORS.purple, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 10 },
  welcomeButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  welcomeSecondary: { paddingVertical: 8 },
  welcomeSecondaryText: { color: COLORS.purple, fontWeight: '700', fontSize: 14 },
  topTabs: { flexDirection: 'row', marginBottom: 16 },
  topTab: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingBottom: 12 },
  topTabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.purple },
  topTabText: { textAlign: 'center', color: '#A6A6B0', fontWeight: '700', fontSize: 16 },
  topTabTextActive: { color: COLORS.purple, fontWeight: '900' },
  largeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.line, marginBottom: 16 },
  balanceAmountSmall: { fontSize: 34, color: COLORS.text, fontWeight: '900', marginTop: 8 },
  loadingBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 70 },
  loadingText: { marginTop: 12, color: COLORS.muted, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { color: COLORS.text, fontWeight: '900', fontSize: 18, marginTop: 10 },
  emptyBody: { color: COLORS.muted, marginTop: 6, textAlign: 'center' },
  profileScreen: { flex: 1, backgroundColor: COLORS.purple },
  profileHeader: { alignItems: 'center', paddingTop: 36, paddingHorizontal: 18, paddingBottom: 28 },
  profileAvatar: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#E6DDF3', borderWidth: 4, borderColor: '#F0A07F', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileMeta: { color: '#E7DDF4', fontSize: 15, marginTop: 6 },
  profileCard: { backgroundColor: '#F7F7F8', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingVertical: 18, minHeight: 520 },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  profileRowText: { fontSize: 18, color: COLORS.text },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.line },
  bottomNavItem: { alignItems: 'center', gap: 4, flex: 1 },
  bottomNavText: { fontSize: 11, color: '#7782A0' },
  bottomNavTextActive: { color: COLORS.purple, fontWeight: '800' },
});

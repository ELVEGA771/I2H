import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import QRCode from 'react-native-qrcode-svg';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.69.233:3000';
const MERCHANT_ID = 1;

const businessPreview = require('./assets/imagenesEmpresa/cobrar.jpeg');
const businessMenuPreview = require('./assets/imagenesEmpresa/menu.jpeg');

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
  red: '#B3261E',
  orange: '#C26B00',
  orangeSoft: '#FFF2DD',
  teal: '#0E8F86',
  tealSoft: '#DFF7F5',
  pink: '#D62B74',
  pinkSoft: '#FFE4F0',
};

const categories = [
  { key: 'Cafeteria', emoji: '☕', title: 'Cafeteria', hint: 'Cafe, postres y combos' },
  { key: 'Tienda', emoji: '🛒', title: 'Tienda', hint: 'Compras del barrio' },
  { key: 'Peluqueria/Barberia', emoji: '✂️', title: 'Peluqueria/Barberia', hint: 'Cortes y cuidado personal' },
  { key: 'Panaderia', emoji: '🥐', title: 'Panaderia', hint: 'Pan, dulces y desayunos' },
  { key: 'Restaurante', emoji: '🍽️', title: 'Restaurante', hint: 'Platos, bebidas y postres' },
  { key: 'Farmacia', emoji: '💊', title: 'Farmacia', hint: 'Salud y bienestar' },
  { key: 'Gimnasio', emoji: '🏋️', title: 'Gimnasio', hint: 'Clases y membresias' },
  { key: 'Mascotas', emoji: '🐶', title: 'Mascotas', hint: 'Banos, snacks y alimento' },
  { key: 'Ropa', emoji: '👕', title: 'Ropa', hint: 'Prendas y accesorios' },
];

const categoryByKey = Object.fromEntries(categories.map((category) => [category.key, category]));

const predefinedGoals = [500, 1000, 2000, 3000, 5000];

const rewardsByCategory = {
  Cafeteria: ['Cafe gratis', 'Postre gratis', 'Combo desayuno', '2x1 en bebidas'],
  Tienda: ['Snack gratis', '$3 de descuento', 'Canasta basica mini', 'Bebida gratis'],
  'Peluqueria/Barberia': ['Corte gratis', 'Lavado de pelo gratis', 'Producto de belleza gratis', 'Barba gratis'],
  Panaderia: ['Pan dulce gratis', '20% de descuento', 'Combo familiar', 'Bebida caliente gratis'],
  Restaurante: ['Entrada gratis', 'Postre gratis', '10% de descuento', 'Bebida gratis'],
  Farmacia: ['10% en vitaminas', 'Producto de cuidado gratis', 'Envio gratis', '$5 de descuento'],
  Gimnasio: ['Clase gratis', 'Batido gratis', 'Evaluacion gratis', 'Semana extra'],
  Mascotas: ['Bano gratis', 'Snack para mascota', '10% en alimento', 'Juguete gratis'],
  Ropa: ['15% de descuento', 'Accesorio gratis', 'Envio gratis', '$5 de descuento'],
};

const defaultProgram = {
  campaign_name: 'Cafe Lovers',
  business_category: 'Cafeteria',
  points_per_dollar: 100,
  reward_threshold: 500,
  reward_type: 'free_product',
  reward_value: 'Cafe gratis',
  terms: 'Cada $1 suma 100 puntos. Los premios se canjean desde la tienda de rewards.',
  reward_tiers: [
    { id: 'tier-500', points: 500, title: 'Cafe gratis' },
    { id: 'tier-1000', points: 1000, title: 'Combo desayuno' },
    { id: 'tier-2000', points: 2000, title: 'Postre gratis' },
  ],
  active: true,
};

const fallbackInsights = {
  clients_enrolled: 3,
  clients_recurring: 2,
  rewards_unlocked: 0,
  rewards_redeemed: 1,
  estimated_return: '+67% recurrencia',
  top_clients: [
    { name: 'Ana Garcia', points_balance: 800, total_points_earned: 800 },
    { name: 'Luis Martinez', points_balance: 300, total_points_earned: 1300 },
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

function normalizeProgram(payload) {
  const tiers = Array.isArray(payload?.reward_tiers) && payload.reward_tiers.length
    ? payload.reward_tiers
    : defaultProgram.reward_tiers;
  return {
    ...defaultProgram,
    ...payload,
    business_category: payload?.business_category || payload?.category || defaultProgram.business_category,
    points_per_dollar: Number(payload?.points_per_dollar || 100),
    reward_threshold: Number(payload?.reward_threshold || tiers[0]?.points || 500),
    reward_tiers: tiers.map((tier, index) => ({
      id: String(tier.id || `tier-${index}`),
      points: Number(tier.points),
      title: String(tier.title || tier.reward_value || 'Reward'),
    })),
    active: payload?.active !== false,
  };
}

export default function App() {
  const [tab, setTab] = useState('inicio');
  const [program, setProgram] = useState(defaultProgram);
  const [insights, setInsights] = useState(fallbackInsights);
  const [promoOpen, setPromoOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [programPayload, insightsPayload] = await Promise.all([
      apiGet(`/api/merchants/${MERCHANT_ID}/loyalty-program`).catch(() => null),
      apiGet(`/api/merchants/${MERCHANT_ID}/insights`).catch(() => null),
    ]);
    if (programPayload) setProgram(normalizeProgram(programPayload));
    if (insightsPayload) setInsights(insightsPayload);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.shell}>
        {tab === 'inicio' ? <HomeScreen program={program} insights={insights} setTab={setTab} promoOpen={promoOpen} setPromoOpen={setPromoOpen} /> : null}
        {tab === 'loyalty' ? <RewardsBuilder program={program} setProgram={setProgram} refresh={refresh} /> : null}
        {tab === 'scan' ? <ScannerScreen refresh={refresh} /> : null}
        {tab === 'caja' ? <CashScreen insights={insights} /> : null}
        {tab === 'menu' ? <MenuScreen setTab={setTab} /> : null}
      </View>
      <BottomNav current={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

function HomeScreen({ program, insights, setTab, promoOpen, setPromoOpen }) {
  const [mode, setMode] = useState('cobrar');
  const [amount, setAmount] = useState('');
  const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'x'];
  const numericAmount = Number(amount.replace(',', '.'));
  const paymentQr = `DEUNA_PAY:${MERCHANT_ID}${numericAmount > 0 ? `:${numericAmount}` : ''}`;

  const pressKey = (key) => {
    if (key === 'x') {
      setAmount((current) => current.slice(0, -1));
      return;
    }
    if (key === ',' && (amount.includes(',') || amount.length === 0)) return;
    setAmount((current) => `${current}${key}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.deunaContent} showsVerticalScrollIndicator={false}>
      <BusinessHeader setTab={setTab} />
      <TopTabs current={mode} onChange={setMode} />

      {mode === 'cobrar' ? (
        <View style={styles.chargePanel}>
          <Text style={styles.amountLabel}>Monto</Text>
          <Text style={styles.amountValue}>$ {amount || '0'}</Text>
          <View style={styles.segmented}>
            <Text style={[styles.segmentedItem, styles.segmentedItemActive]}>QR</Text>
            <Text style={styles.segmentedItem}>Manual</Text>
          </View>
          <View style={styles.businessQrCard}>
            <QRCode value={paymentQr} size={170} />
            <Text style={styles.businessQrTitle}>QR de cobro DeUna</Text>
            <Text style={styles.businessQrText}>
              El cliente escanea este QR para transferir y sumar puntos en tu campaña.
            </Text>
          </View>
          <TouchableOpacity style={styles.reasonRow}>
            <Text style={styles.reasonText}>Agregar motivo (opcional)</Text>
            <Text style={styles.reasonChevron}>{'>'}</Text>
          </TouchableOpacity>
          <View style={styles.keypad}>
            {keypad.map((key) => (
              <TouchableOpacity key={key} style={styles.keypadKey} onPress={() => pressKey(key)}>
                <Text style={[styles.keypadText, key === 'x' && styles.keypadDelete]}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.disabledChargeButton, numericAmount > 0 && styles.enabledChargeButton]}>
            <Text style={[styles.disabledChargeText, numericAmount > 0 && styles.enabledChargeText]}>
              {numericAmount > 0 ? 'QR listo para cobrar' : 'Continuar para Cobrar'}
            </Text>
          </TouchableOpacity>
          <RewardInlineCard program={program} insights={insights} onPress={() => setTab('loyalty')} />
        </View>
      ) : (
        <View style={styles.managePanel}>
          <TouchableOpacity style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Mi Saldo</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceValue}>$4,00</Text>
              <Text style={styles.eyeIcon}>o</Text>
              <Text style={styles.balanceArrow}>{'>'}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.deunaSectionTitle}>Accesos rapidos</Text>
          <View style={styles.quickGrid}>
            <QuickAction icon="v" label="Recargar saldo" />
            <QuickAction icon="^" label="Transferir saldo" />
            <QuickAction icon="$" label="Venta Manual" />
            <QuickAction icon="[]" label="Verificar pago" onPress={() => setTab('scan')} />
          </View>
          <Text style={styles.deunaSectionTitle}>Novedades Deuna Negocios</Text>
          <View style={styles.newsRow}>
            <NewsCard title="Agrega vendedores a tu equipo" />
            <NewsCard title="Administra tus ventas con tu caja" />
          </View>
          <RewardProgramCard program={program} insights={insights} onPress={() => setTab('loyalty')} />
        </View>
      )}
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.logoDot}><Text style={styles.logoText}>d!</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Hola! Pablo</Text>
          <Text style={styles.muted}>Oniresolutions S.a.s.</Text>
        </View>
        <Text style={styles.headerIcon}>QR</Text>
      </View>

      <TouchableOpacity style={styles.adCard} onPress={() => setTab('loyalty')}>
        <View style={{ flex: 1 }}>
          <Text style={styles.adEyebrow}>Rewards Deuna</Text>
          <Text style={styles.adTitle}>Quieres publicitar tu negocio, sin riesgo ni costo?</Text>
          <Text style={styles.adText}>Activa puntos, crea premios y haz que tus clientes vuelvan.</Text>
        </View>
        <Text style={styles.adButton}>Abrir</Text>
      </TouchableOpacity>

      <Image source={businessPreview} style={styles.previewImage} resizeMode="cover" />

      <View style={styles.statsGrid}>
        <Stat label="Inscritos" value={insights.clients_enrolled ?? 0} />
        <Stat label="Recurrentes" value={insights.clients_recurring ?? 0} />
        <Stat label="Canjes" value={insights.rewards_redeemed ?? 0} />
        <Stat label="Campaña" value={program.active ? 'Activa' : 'Pausa'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Campaña actual</Text>
        <Text style={styles.programTitle}>{program.campaign_name}</Text>
        <Text style={styles.body}>Categoria: {program.business_category}</Text>
        <Text style={styles.body}>Regla simple: $1 = {program.points_per_dollar} puntos</Text>
        <View style={styles.tierMiniRow}>
          {program.reward_tiers.map((tier) => (
            <View key={tier.id} style={styles.tierMini}>
              <Text style={styles.tierMiniPoints}>{tier.points}</Text>
              <Text style={styles.tierMiniTitle} numberOfLines={2}>{tier.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Accesos rapidos</Text>
        {[
          ['Crear rewards', 'loyalty'],
          ['Escanear QR', 'scan'],
          ['Mi caja', 'caja'],
          ['Menu', 'menu'],
        ].map(([label, target]) => (
          <TouchableOpacity key={label} style={styles.menuRow} onPress={() => setTab(target)}>
            <Text style={styles.menuText}>{label}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={promoOpen} transparent animationType="fade" onRequestClose={() => setPromoOpen(false)}>
        <View style={styles.modalShade}>
          <View style={styles.promoModal}>
            <View style={styles.promoIconWrap}>
              <Text style={styles.promoIcon}>🚀</Text>
              <View style={styles.promoSparkOne} />
              <View style={styles.promoSparkTwo} />
              <View style={styles.promoSparkThree} />
            </View>
            <Text style={styles.promoTitle}>Quieres publicitar tu negocio, sin riesgo ni costo?</Text>
            <Text style={styles.promoText}>Crea puntos, premios y una tienda de recompensas para que tus clientes vuelvan sin pagar anuncios.</Text>
            <View style={styles.promoBenefits}>
              <View style={styles.promoBenefit}><Text style={styles.promoBenefitIcon}>🎁</Text><Text style={styles.promoBenefitText}>Premios simples</Text></View>
              <View style={styles.promoBenefit}><Text style={styles.promoBenefitIcon}>📈</Text><Text style={styles.promoBenefitText}>Mas visitas</Text></View>
              <View style={styles.promoBenefit}><Text style={styles.promoBenefitIcon}>💜</Text><Text style={styles.promoBenefitText}>Sin riesgo</Text></View>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => { setPromoOpen(false); setTab('loyalty'); }}>
              <Text style={styles.primaryButtonText}>Crear rewards</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={() => setPromoOpen(false)}>
              <Text style={styles.textButtonText}>Mas tarde</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BusinessHeader({ setTab }) {
  return (
    <View style={styles.businessHeader}>
      <View style={styles.logoDotSmall}><Text style={styles.logoText}>▰</Text></View>
      <View style={styles.businessIdentity}>
        <View style={styles.nameRow}>
          <Text style={styles.businessHello}>Hola! Pablo</Text>
          <Text style={styles.adminBadge}>Admin</Text>
        </View>
        <Text style={styles.businessName}>Oniresolutions S.a.s.</Text>
      </View>
      <TouchableOpacity onPress={() => setTab('scan')}><Text style={styles.headerAction}>QR</Text></TouchableOpacity>
      <Text style={styles.headerAction}>!</Text>
      <TouchableOpacity onPress={() => setTab('menu')}><Text style={styles.headerAction}>H</Text></TouchableOpacity>
    </View>
  );
}

function TopTabs({ current, onChange }) {
  return (
    <View style={styles.topTabs}>
      {[
        ['cobrar', 'Cobrar'],
        ['gestionar', 'Gestionar'],
      ].map(([key, label]) => (
        <TouchableOpacity key={key} style={styles.topTab} onPress={() => onChange(key)}>
          <Text style={[styles.topTabText, current === key && styles.topTabTextActive]}>{label}</Text>
          <View style={[styles.topTabLine, current === key && styles.topTabLineActive]} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickItem} onPress={onPress}>
      <View style={styles.quickCircle}><Text style={styles.quickIcon}>{icon}</Text></View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function NewsCard({ title }) {
  return (
    <View style={styles.newsCard}>
      <Text style={styles.newsTitle}>{title}</Text>
      <View style={styles.deunaMark}><Text style={styles.deunaMarkText}>d!</Text></View>
    </View>
  );
}

function RewardInlineCard({ program, insights, onPress }) {
  return (
    <TouchableOpacity style={styles.rewardInlineCard} onPress={onPress}>
      <View style={styles.rewardInlineBadge}><Text style={styles.rewardInlineBadgeText}>pts</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rewardInlineTitle}>Rewards Deuna activo</Text>
        <Text style={styles.rewardInlineText}>
          {insights.clients_enrolled ?? 0} clientes inscritos · {program.reward_tiers?.length ?? 0} premios
        </Text>
      </View>
      <Text style={styles.rewardInlineAction}>Configurar</Text>
    </TouchableOpacity>
  );
}

function RewardProgramCard({ program, insights, onPress }) {
  const tiers = program.reward_tiers || [];
  return (
    <TouchableOpacity style={styles.rewardProgramCard} onPress={onPress}>
      <View style={styles.rewardProgramHeader}>
        <View>
          <Text style={styles.rewardProgramKicker}>Sistema de puntos</Text>
          <Text style={styles.rewardProgramTitle}>{program.campaign_name}</Text>
        </View>
        <Text style={styles.rewardProgramStatus}>{program.active ? 'Activo' : 'Pausado'}</Text>
      </View>
      <Text style={styles.rewardProgramRule}>Cada $1 suma {program.points_per_dollar} puntos.</Text>
      <View style={styles.rewardProgramStats}>
        <View style={styles.rewardProgramStat}>
          <Text style={styles.rewardProgramStatValue}>{insights.clients_enrolled ?? 0}</Text>
          <Text style={styles.rewardProgramStatLabel}>Inscritos</Text>
        </View>
        <View style={styles.rewardProgramStat}>
          <Text style={styles.rewardProgramStatValue}>{insights.rewards_redeemed ?? 0}</Text>
          <Text style={styles.rewardProgramStatLabel}>Canjes</Text>
        </View>
        <View style={styles.rewardProgramStat}>
          <Text style={styles.rewardProgramStatValue}>{tiers.length}</Text>
          <Text style={styles.rewardProgramStatLabel}>Premios</Text>
        </View>
      </View>
      <View style={styles.rewardProgramTiers}>
        {tiers.slice(0, 3).map((tier) => (
          <View key={tier.id} style={styles.rewardProgramTier}>
            <Text style={styles.rewardProgramTierPoints}>{tier.points}</Text>
            <Text style={styles.rewardProgramTierTitle} numberOfLines={2}>{tier.title}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.rewardProgramButton}>Abrir tutorial y configurar rewards</Text>
    </TouchableOpacity>
  );
}

function RewardsBuilder({ program, setProgram, refresh }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(program.business_category || 'Cafeteria');
  const [goals, setGoals] = useState(() => {
    const tiers = program.reward_tiers || defaultProgram.reward_tiers;
    return tiers.map((t) => Number(t.points)).sort((a, b) => a - b);
  });
  const [manualGoal, setManualGoal] = useState('');
  const [assigned, setAssigned] = useState(() => {
    const map = {};
    (program.reward_tiers || []).forEach((t) => { map[t.points] = t.title; });
    return map;
  });
  const [customReward, setCustomReward] = useState('');
  const [customRewards, setCustomRewards] = useState([]);
  const [editingGoal, setEditingGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  /* ── animations ── */
  const guideSlide = useRef(new Animated.Value(-30)).current;
  const guideFade = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const tipSlide = useRef(new Animated.Value(30)).current;
  const tipFade = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const rewardOptions = useMemo(
    () => Array.from(new Set([...(rewardsByCategory[category] || rewardsByCategory.Cafeteria), ...customRewards])),
    [category, customRewards],
  );
  const sortedGoals = useMemo(() => [...goals].sort((a, b) => a - b), [goals]);
  const allFilled = sortedGoals.length > 0 && sortedGoals.every((g) => assigned[g]);
  const activeCategory = categoryByKey[category] || categoryByKey.Cafeteria;
  const unassignedCount = sortedGoals.filter((g) => !assigned[g]).length;
  const assignedCount = sortedGoals.length - unassignedCount;

  /* animate on step change */
  useEffect(() => {
    guideSlide.setValue(-30);
    guideFade.setValue(0);
    contentFade.setValue(0);
    tipSlide.setValue(30);
    tipFade.setValue(0);
    Animated.stagger(150, [
      Animated.parallel([
        Animated.spring(guideSlide, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(guideFade, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.timing(contentFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(tipSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(tipFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [step]);

  /* pulse loop for unassigned indicators */
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const tutorialContent = [
    {
      emoji: '👋',
      title: 'Hola! Soy tu asistente Deuna',
      text: 'Vamos a crear tu programa de rewards en 3 pasos rapidos.\nPrimero, toca la categoria que mejor describe tu negocio.',
      tip: 'No te preocupes, puedes cambiarlo despues.',
    },
    {
      emoji: '🎯',
      title: 'Genial! Ahora las metas',
      text: 'Cada $1 que gaste tu cliente = 100 puntos.\nElige a cuantos puntos quieres dar un premio.\n\nEjemplo: 500 pts = tu cliente gasto $5.',
      tip: 'Elige varias metas para premios cada vez mas valiosos.',
    },
    {
      emoji: '🎁',
      title: 'Ultimo paso! Elige premios',
      text: unassignedCount > 0
        ? `Toca cada meta para asignarle un premio.\nTe faltan ${unassignedCount} meta${unassignedCount > 1 ? 's' : ''} por asignar.`
        : 'Todas las metas tienen premio!\nRevisa que todo este bien y toca Lanzar.',
      tip: 'Puedes cambiar cualquier premio tocando la meta.',
    },
  ];
  const tutorial = tutorialContent[step - 1];

  /* ── handlers ── */
  const toggleGoal = (goal) => {
    setError('');
    if (goals.includes(goal)) {
      setGoals((c) => c.filter((g) => g !== goal));
      setAssigned((c) => { const n = { ...c }; delete n[goal]; return n; });
      if (editingGoal === goal) setEditingGoal(null);
    } else {
      setGoals((c) => [...c, goal].sort((a, b) => a - b));
    }
  };

  const addManualGoal = () => {
    const value = Number(String(manualGoal).replace(/[^0-9]/g, ''));
    if (!Number.isInteger(value) || value <= 0) {
      setError('Escribe una meta valida, por ejemplo 1500.');
      return;
    }
    if (goals.includes(value)) { setError('Esa meta ya esta en tu lista.'); return; }
    setGoals((c) => [...c, value].sort((a, b) => a - b));
    setManualGoal('');
    setError('');
  };

  const assignReward = (goal, reward) => {
    setAssigned((c) => ({ ...c, [goal]: reward }));
    setEditingGoal(null);
    setCustomReward('');
    setError('');
  };

  const addCustomReward = () => {
    const value = customReward.trim();
    if (!value) { setError('Escribe el nombre de la recompensa.'); return; }
    setCustomRewards((c) => Array.from(new Set([...c, value])));
    if (editingGoal != null) assignReward(editingGoal, value);
    setCustomReward('');
    setError('');
  };

  const launch = async () => {
    if (!allFilled) { setError('Asigna una recompensa a cada meta antes de lanzar.'); return; }
    setSaving(true);
    setError('');
    const reward_tiers = sortedGoals.map((goal) => ({
      id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${goal}`,
      points: goal,
      title: assigned[goal],
    }));
    const payload = {
      campaign_name: `${category} Rewards`,
      business_category: category,
      points_per_dollar: 100,
      reward_threshold: sortedGoals[0],
      reward_type: 'free_product',
      reward_value: assigned[sortedGoals[0]],
      terms: 'Cada $1 suma 100 puntos. El cliente canjea premios desde la tienda de rewards.',
      reward_tiers,
      active: true,
    };
    try {
      const saved = await apiPut(`/api/merchants/${MERCHANT_ID}/loyalty-program`, payload);
      setProgram(normalizeProgram(saved));
      await refresh();
      setCelebrate(true);
    } catch (err) {
      setError(err.message || 'No se pudo lanzar la campana.');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Programa Rewards</Text>

      {/* ─── Animated tutorial guide ─── */}
      <Animated.View style={[styles.guideCard, { opacity: guideFade, transform: [{ translateY: guideSlide }] }]}>
        <View style={styles.guideRow}>
          <Animated.View style={[styles.guideAvatar, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={styles.guideAvatarEmoji}>{tutorial.emoji}</Text>
          </Animated.View>
          <View style={styles.guideSpeech}>
            <View style={styles.speechArrow} />
            <Text style={styles.guideSpeechTitle}>{tutorial.title}</Text>
            <Text style={styles.guideSpeechText}>{tutorial.text}</Text>
          </View>
        </View>
        <Animated.View style={[styles.guideTipBar, { opacity: tipFade, transform: [{ translateY: tipSlide }] }]}>
          <Text style={styles.guideTipIcon}>💡</Text>
          <Text style={styles.guideTipText}>{tutorial.tip}</Text>
        </Animated.View>
      </Animated.View>

      <StepDots current={step} />

      {/* ─── Step content (fades in) ─── */}
      <Animated.View style={{ opacity: contentFade }}>

        {/* ============ STEP 1 – Category ============ */}
        {step === 1 ? (
          <View>
            <Text style={styles.sectionTitle}>Que tipo de negocio tienes?</Text>
            <View style={styles.categorySpotlight}>
              <Text style={styles.categorySpotlightEmoji}>{activeCategory.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.categorySpotlightTitle}>{activeCategory.title}</Text>
                <Text style={styles.categorySpotlightHint}>{activeCategory.hint}</Text>
              </View>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((item) => (
                <TouchableOpacity key={item.key} style={[styles.categoryChip, category === item.key && styles.categoryChipActive]} onPress={() => setCategory(item.key)}>
                  <Text style={styles.categoryEmoji}>{item.emoji}</Text>
                  <Text style={[styles.categoryChipText, category === item.key && styles.categoryChipTextActive]}>{item.title}</Text>
                  <Text style={[styles.categoryHint, category === item.key && styles.categoryHintActive]}>{item.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Siguiente  →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* ============ STEP 2 – Goals ============ */}
        {step === 2 ? (
          <View>
            <Text style={styles.sectionTitle}>Elige tus metas de puntos</Text>
            <Text style={styles.mutedBlock}>Cada $1 = 100 puntos. Selecciona cuantos puntos necesita tu cliente para ganar un premio.</Text>

            {/* Visual example card */}
            <View style={styles.exampleCard}>
              <Text style={styles.exampleTitle}>Ejemplo rapido</Text>
              <View style={styles.exampleRow}>
                <View style={styles.exampleItem}><Text style={styles.exampleEmoji}>💵</Text><Text style={styles.exampleLabel}>$5 gastados</Text></View>
                <Text style={styles.exampleArrow}>→</Text>
                <View style={styles.exampleItem}><Text style={styles.exampleEmoji}>⭐</Text><Text style={styles.exampleLabel}>500 puntos</Text></View>
                <Text style={styles.exampleArrow}>→</Text>
                <View style={styles.exampleItem}><Text style={styles.exampleEmoji}>🎁</Text><Text style={styles.exampleLabel}>Premio!</Text></View>
              </View>
            </View>

            <View style={styles.goalGrid}>
              {predefinedGoals.map((goal) => (
                <TouchableOpacity key={goal} style={[styles.goalChip, goals.includes(goal) && styles.goalChipActive]} onPress={() => toggleGoal(goal)}>
                  <Text style={[styles.goalChipText, goals.includes(goal) && styles.goalChipTextActive]}>{goal} pts</Text>
                  <Text style={[styles.goalChipSub, goals.includes(goal) && styles.goalChipSubActive]}>= ${goal / 100}</Text>
                  {goals.includes(goal) ? <Text style={styles.goalCheck}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.manualRow}>
              <TextInput value={manualGoal} onChangeText={setManualGoal} keyboardType="numeric" placeholder="Meta personalizada..." style={styles.input} />
              <TouchableOpacity style={styles.addButton} onPress={addManualGoal}><Text style={styles.addButtonText}>+ Agregar</Text></TouchableOpacity>
            </View>

            {sortedGoals.length > 0 ? (
              <View style={styles.selectedGoalsPreview}>
                <Text style={styles.selectedGoalsTitle}>{sortedGoals.length} meta{sortedGoals.length !== 1 ? 's' : ''} seleccionada{sortedGoals.length !== 1 ? 's' : ''}</Text>
                <View style={styles.selectedGoalsPills}>
                  {sortedGoals.map((g) => (
                    <View key={g} style={styles.selectedGoalPill}>
                      <Text style={styles.selectedGoalPillText}>{g} pts</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}><Text style={styles.secondaryButtonText}>← Atras</Text></TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButtonFlex, sortedGoals.length === 0 && styles.disabledButton]}
                disabled={sortedGoals.length === 0}
                onPress={() => { if (sortedGoals.length === 0) { setError('Selecciona al menos una meta.'); return; } setStep(3); setEditingGoal(null); }}
              >
                <Text style={styles.primaryButtonText}>Siguiente  →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ============ STEP 3 – Rewards (card-based) ============ */}
        {step === 3 ? (
          <View>
            <Text style={styles.sectionTitle}>Asigna premios a cada meta</Text>

            {/* Progress bar */}
            <View style={styles.rewardProgress}>
              <View style={[styles.rewardProgressFill, { width: `${(assignedCount / Math.max(sortedGoals.length, 1)) * 100}%` }]} />
            </View>
            <Text style={styles.rewardProgressLabel}>{assignedCount} de {sortedGoals.length} metas con premio</Text>

            {/* Goal cards */}
            {sortedGoals.map((goal, idx) => {
              const isEditing = editingGoal === goal;
              const hasReward = !!assigned[goal];
              return (
                <View key={goal}>
                  <TouchableOpacity
                    style={[styles.goalCard, hasReward && !isEditing && styles.goalCardDone, isEditing && styles.goalCardEditing, !hasReward && !isEditing && styles.goalCardPending]}
                    onPress={() => setEditingGoal(isEditing ? null : goal)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.goalCardLeft}>
                      <View style={[styles.goalCardBadge, hasReward && styles.goalCardBadgeDone]}>
                        <Text style={styles.goalCardBadgeText}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.goalCardPoints}>{goal} puntos</Text>
                        {hasReward
                          ? <Text style={styles.goalCardRewardDone}>🎁 {assigned[goal]}</Text>
                          : <Animated.Text style={[styles.goalCardRewardPending, { transform: [{ scale: pulseAnim }] }]}>Toca para asignar premio →</Animated.Text>}
                      </View>
                    </View>
                    <Text style={styles.goalCardAction}>{isEditing ? '▲' : hasReward ? '✏️' : '▼'}</Text>
                  </TouchableOpacity>

                  {/* Expanded reward picker */}
                  {isEditing ? (
                    <View style={styles.rewardPicker}>
                      <Text style={styles.rewardPickerTitle}>Elige premio para {goal} puntos:</Text>
                      <View style={styles.rewardPool}>
                        {rewardOptions.map((reward) => (
                          <TouchableOpacity
                            key={reward}
                            style={[styles.rewardChip, assigned[goal] === reward && styles.rewardChipSelected]}
                            onPress={() => assignReward(goal, reward)}
                          >
                            <Text style={styles.rewardEmoji}>🎁</Text>
                            <Text style={[styles.rewardChipText, assigned[goal] === reward && styles.rewardChipTextSelected]}>{reward}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.manualRow}>
                        <TextInput value={customReward} onChangeText={setCustomReward} placeholder="Crear premio propio..." style={styles.input} />
                        <TouchableOpacity style={styles.addButton} onPress={addCustomReward}><Text style={styles.addButtonText}>Usar</Text></TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.footerRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}><Text style={styles.secondaryButtonText}>← Atras</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.launchButton, !allFilled && styles.disabledButton]} disabled={!allFilled || saving} onPress={launch}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>🚀 Lanzar campana</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

      </Animated.View>

      {/* Celebration modal */}
      <Modal visible={celebrate} transparent animationType="slide" onRequestClose={() => setCelebrate(false)}>
        <View style={styles.modalShade}>
          <View style={styles.celebrateModal}>
            <Text style={styles.confetti}>🎉 🎊 🥳 🎉 🎊</Text>
            <Text style={styles.celebrateTitle}>Tu campana esta activa!</Text>
            <Text style={styles.celebrateText}>Tus clientes ya pueden inscribirse, ganar puntos y canjear premios.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setCelebrate(false)}>
              <Text style={styles.primaryButtonText}>Genial!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StepDots({ current }) {
  return (
    <View style={styles.stepRow}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={[styles.stepDot, current >= step && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, current >= step && styles.stepDotTextActive]}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function CashScreen({ insights }) {
  return (
    <ScrollView contentContainerStyle={styles.deunaContent} showsVerticalScrollIndicator={false}>
      <View style={styles.innerHeader}>
        <Text style={styles.backIcon}>{'<'}</Text>
        <View style={styles.cashPill}>
          <Text style={styles.cashPillText}>Mi caja</Text>
          <Text style={styles.cashPillArrow}>v</Text>
        </View>
        <View style={{ width: 34 }} />
      </View>
      <View style={styles.topTabs}>
        <View style={styles.topTab}>
          <Text style={[styles.topTabText, styles.topTabTextActive]}>Caja activa</Text>
          <View style={[styles.topTabLine, styles.topTabLineActive]} />
        </View>
        <View style={styles.topTab}>
          <Text style={styles.topTabText}>Historial</Text>
          <View style={styles.topTabLine} />
        </View>
      </View>
      <View style={styles.cashTotalCard}>
        <Text style={styles.cashLabel}>Mi caja</Text>
        <Text style={styles.cashAmount}>$0,00</Text>
      </View>
      <Text style={styles.cashDate}>Total al 18/04/2026, 11:48 am -</Text>
      <View style={styles.salesHeader}>
        <Text style={styles.deunaSectionTitle}>Mis ventas</Text>
        <TouchableOpacity style={styles.manualSaleButton}>
          <Text style={styles.manualSaleText}>+ Agregar venta manual</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.emptySales}>
        <View style={styles.emptyWallet}>
          <Text style={styles.emptyWalletText}>$</Text>
        </View>
        <Text style={styles.emptySalesText}>No hay ventas todavia</Text>
      </View>
      <TouchableOpacity style={styles.closeCashButton}>
        <Text style={styles.closeCashText}>✓  Cerrar caja</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Mi caja</Text>
      <Image source={businessMenuPreview} style={styles.previewImageTall} resizeMode="cover" />
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resumen</Text>
        <Text style={styles.body}>Clientes en puntos: {insights.clients_enrolled}</Text>
        <Text style={styles.body}>Canjes de tienda: {insights.rewards_redeemed}</Text>
        <Text style={styles.body}>Retorno estimado: {insights.estimated_return}</Text>
      </View>
    </ScrollView>
  );
}

function ScannerScreen({ refresh }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  const redeemQr = async (qrCode) => {
    if (locked) return;
    setLocked(true);
    setError('');
    try {
      const payload = await apiPost('/api/rewards/redeem-by-qr', { qr_code: qrCode });
      setResult(payload);
      await refresh();
    } catch (err) {
      setError(err.message || 'QR no valido o ya canjeado');
    }
  };

  if (!permission) return <Centered text="Preparando camara..." />;
  if (!permission.granted) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.pageTitle}>Permiso de camara</Text>
        <Text style={styles.mutedBlock}>Necesitamos la camara para validar QR antiguos de rewards.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Permitir camara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.scannerScreen}>
      <Text style={styles.pageTitle}>Escanear QR</Text>
      <View style={styles.cameraFrame}>
        {!result && !error ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => redeemQr(data)}
          />
        ) : <Centered text="Escaneo pausado" />}
        <View style={styles.scanSquare} />
      </View>
      {result ? <Text style={styles.success}>Reward validado: {result.reward_value}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {(result || error) ? (
        <TouchableOpacity style={styles.secondaryButtonFull} onPress={() => { setResult(null); setError(''); setLocked(false); }}>
          <Text style={styles.secondaryButtonText}>Escanear otro</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function MenuScreen({ setTab }) {
  return (
    <ScrollView contentContainerStyle={styles.deunaContent} showsVerticalScrollIndicator={false}>
      <View style={styles.menuTop}>
        <Text style={styles.backIcon}>{'<'}</Text>
        <Text style={styles.menuTitleReal}>Mas opciones</Text>
        <View style={{ width: 34 }} />
      </View>
      <View style={styles.menuProfile}>
        <View style={styles.logoDotMenu}><Text style={styles.logoText}>▰</Text></View>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>Pablo Daniel</Text>
            <Text style={styles.adminBadge}>Administrador</Text>
          </View>
          <Text style={styles.businessName}>Oniresolutions S.a.s.</Text>
        </View>
      </View>
      <Text style={styles.menuSection}>Mi Negocio</Text>
      <OptionRow icon="▰" label="Perfil de negocio" />
      <OptionRow icon="oo" label="Equipo y Roles" />
      <Text style={styles.menuSection}>Configuraciones</Text>
      <OptionRow icon="$" label="Limites de cuenta" />
      <OptionRow icon="[]" label="Clave de seguridad" />
      <Text style={styles.menuSection}>Soporte y Ayuda</Text>
      <OptionRow icon="H" label="Soporte" last />
      <TouchableOpacity style={styles.rewardsEntry} onPress={() => setTab('loyalty')}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardsEntryTitle}>Rewards Deuna</Text>
          <Text style={styles.rewardsEntryText}>Tu sistema de puntos esta listo para configurar.</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Menu</Text>
      <View style={styles.card}>
        {['Perfil de negocio', 'Equipo y roles', 'Limites de cuenta', 'Clave de seguridad', 'Soporte'].map((item) => (
          <View key={item} style={styles.menuRow}>
            <Text style={styles.menuText}>{item}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function OptionRow({ icon, label, last }) {
  return (
    <View style={[styles.optionRow, last && styles.optionRowLast]}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={styles.optionLabel}>{label}</Text>
    </View>
  );
}

function Centered({ text }) {
  return (
    <View style={styles.centerScreen}>
      <ActivityIndicator color={COLORS.purple} />
      <Text style={styles.mutedBlock}>{text}</Text>
    </View>
  );
}

function BottomNav({ current, onChange }) {
  const tabs = [
    ['inicio', 'Inicio', '^'],
    ['caja', 'Mi Caja', '▤'],
    ['loyalty', 'Rewards', '*'],
    ['scan', 'QR', '[]'],
    ['menu', 'Menu', '='],
  ];
  return (
    <View style={styles.bottomNav}>
      {tabs.map(([key, label, icon]) => (
        <TouchableOpacity key={key} style={styles.navItem} onPress={() => onChange(key)}>
          <Text style={[styles.navIcon, current === key && styles.navTextActive]}>{icon}</Text>
          <Text style={[styles.navText, current === key && styles.navTextActive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  shell: { flex: 1, maxWidth: 540, width: '100%', alignSelf: 'center' },
  content: { padding: 20, paddingBottom: 112 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  logoDot: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: COLORS.purple, fontWeight: '900' },
  hello: { color: COLORS.text, fontWeight: '900', fontSize: 24 },
  muted: { color: COLORS.muted, fontSize: 16 },
  headerIcon: { color: COLORS.purple, fontWeight: '900', borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, padding: 10 },
  adCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.purple, borderRadius: 20, padding: 18, marginBottom: 16 },
  adEyebrow: { color: '#E8D8FA', fontWeight: '800', marginBottom: 6 },
  adTitle: { color: '#fff', fontWeight: '900', fontSize: 20, lineHeight: 24 },
  adText: { color: '#E8D8FA', marginTop: 6, lineHeight: 19 },
  adButton: { color: COLORS.purple, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 9, fontWeight: '900' },
  previewImage: { width: '100%', height: 170, borderRadius: 20, marginBottom: 16 },
  previewImageTall: { width: '100%', height: 280, borderRadius: 20, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { width: '48%', backgroundColor: COLORS.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.line },
  statValue: { color: COLORS.purple, fontWeight: '900', fontSize: 24 },
  statLabel: { color: COLORS.muted, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.line },
  cardTitle: { color: COLORS.text, fontWeight: '900', fontSize: 18, marginBottom: 10 },
  programTitle: { color: COLORS.purple, fontWeight: '900', fontSize: 22, marginBottom: 6 },
  body: { color: COLORS.muted, fontWeight: '700', lineHeight: 22 },
  tierMiniRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tierMini: { flex: 1, backgroundColor: COLORS.purpleSoft, borderRadius: 12, padding: 10 },
  tierMiniPoints: { color: COLORS.purple, fontWeight: '900' },
  tierMiniTitle: { color: COLORS.purpleDark, fontSize: 12, marginTop: 4, fontWeight: '700' },
  menuRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.line },
  menuText: { color: COLORS.text, fontWeight: '800', fontSize: 16 },
  chevron: { color: COLORS.purple, fontWeight: '900', fontSize: 24 },
  pageTitle: { color: COLORS.text, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  tutorialCard: { backgroundColor: COLORS.purpleSoft, borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#DFC8F7' },
  tutorialTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tutorialIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tutorialIconText: { fontSize: 28 },
  tutorialTitle: { color: COLORS.purple, fontWeight: '900', marginBottom: 4 },
  tutorialText: { color: COLORS.purpleDark, lineHeight: 20 },
  tutorialControls: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  tutorialPill: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  tutorialPillActive: { backgroundColor: COLORS.purple },
  tutorialPillText: { color: COLORS.purple, fontWeight: '900' },
  tutorialPillTextActive: { color: '#fff' },
  tutorialNext: { marginLeft: 'auto', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  tutorialNextText: { color: COLORS.purple, fontWeight: '900' },
  stepRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 18 },
  stepDot: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  stepDotActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  stepDotText: { color: COLORS.muted, fontWeight: '900' },
  stepDotTextActive: { color: '#fff' },
  sectionTitle: { color: COLORS.text, fontWeight: '900', fontSize: 21, marginBottom: 12 },
  mutedBlock: { color: COLORS.muted, lineHeight: 21, marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  categorySpotlight: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: COLORS.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14 },
  categorySpotlightEmoji: { fontSize: 42 },
  categorySpotlightTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  categorySpotlightHint: { color: COLORS.muted, marginTop: 3, fontWeight: '700' },
  categoryChip: { width: '48%', minHeight: 106, padding: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.line },
  categoryChipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  categoryEmoji: { fontSize: 25, marginBottom: 6 },
  categoryChipText: { color: COLORS.text, fontWeight: '800' },
  categoryChipTextActive: { color: '#fff' },
  categoryHint: { color: COLORS.muted, fontSize: 11, lineHeight: 15, marginTop: 4, fontWeight: '700' },
  categoryHintActive: { color: '#E8D8FA' },
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  goalChip: { minWidth: 92, alignItems: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.line },
  goalChipActive: { backgroundColor: COLORS.purpleSoft, borderColor: COLORS.purple },
  goalChipText: { color: COLORS.text, fontWeight: '900' },
  goalChipTextActive: { color: COLORS.purple },
  manualRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  input: { flex: 1, minHeight: 50, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, paddingHorizontal: 14, color: COLORS.text, fontWeight: '800' },
  addButton: { backgroundColor: COLORS.purpleSoft, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  addButtonText: { color: COLORS.purple, fontWeight: '900' },
  rewardPool: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  rewardChip: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  rewardChipActive: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  rewardChipDragging: { zIndex: 20, elevation: 8, shadowOpacity: 0.16 },
  rewardEmoji: { fontSize: 18 },
  rewardChipText: { color: COLORS.text, fontWeight: '800' },
  rewardChipTextActive: { color: '#fff' },
  dropZone: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 72, borderWidth: 2, borderColor: '#DCC8F3', borderStyle: 'dashed', borderRadius: 16, padding: 14, marginBottom: 10, backgroundColor: '#fff' },
  dropZoneFilled: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 64, backgroundColor: COLORS.greenSoft, borderWidth: 1.5, borderColor: '#A9E4C4', borderRadius: 16, padding: 14, marginBottom: 10 },
  dropZoneInner: { flex: 1 },
  dropPoints: { color: COLORS.purple, fontWeight: '900', fontSize: 17 },
  dropHint: { color: COLORS.muted, marginTop: 4, fontWeight: '700' },
  dropIcon: { color: COLORS.green, fontWeight: '900', fontSize: 18 },
  activeGoalBlock: { backgroundColor: COLORS.purpleSoft, borderRadius: 18, padding: 16, marginBottom: 14 },
  activeGoalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  activeGoalPoints: { color: COLORS.purple, fontWeight: '900' },
  goalProgressRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  goalProgressDot: { flex: 1, height: 6, borderRadius: 4, backgroundColor: COLORS.line },
  goalProgressDotDone: { backgroundColor: COLORS.green },
  sectionSubtitle: { fontSize: 13, fontWeight: '700', color: COLORS.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  footerRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  primaryButton: { backgroundColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonFlex: { flex: 1, backgroundColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  launchButton: { flex: 1, backgroundColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  secondaryButton: { flex: 1, borderWidth: 2, borderColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonFull: { borderWidth: 2, borderColor: COLORS.purple, borderRadius: 12, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  secondaryButtonText: { color: COLORS.purple, fontWeight: '900' },
  modalShade: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  promoModal: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%' },
  balloon: { color: COLORS.purple, letterSpacing: 8, fontSize: 24, textAlign: 'center', marginBottom: 8 },
  promoIconWrap: { width: 112, height: 112, borderRadius: 56, backgroundColor: COLORS.purpleSoft, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  promoIcon: { fontSize: 48 },
  promoSparkOne: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.orange, right: 12, top: 18 },
  promoSparkTwo: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.teal, left: 14, bottom: 22 },
  promoSparkThree: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.pink, right: 24, bottom: 10 },
  promoTitle: { color: COLORS.text, fontWeight: '900', fontSize: 22, textAlign: 'center', lineHeight: 27 },
  promoText: { color: COLORS.muted, textAlign: 'center', lineHeight: 21, marginVertical: 14 },
  promoBenefits: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  promoBenefit: { flex: 1, backgroundColor: COLORS.purpleSoft, borderRadius: 12, padding: 10, alignItems: 'center' },
  promoBenefitIcon: { fontSize: 20, marginBottom: 4 },
  promoBenefitText: { color: COLORS.purpleDark, fontWeight: '900', fontSize: 11, textAlign: 'center' },
  textButton: { alignItems: 'center', paddingTop: 14 },
  textButtonText: { color: COLORS.muted, fontWeight: '800' },
  celebrateModal: { backgroundColor: '#fff', borderRadius: 20, padding: 22, width: '100%', alignItems: 'center' },
  confetti: { color: COLORS.purple, letterSpacing: 6, fontSize: 28, marginBottom: 8 },
  celebrateTitle: { color: COLORS.text, fontWeight: '900', fontSize: 24, textAlign: 'center', lineHeight: 29 },
  celebrateText: { color: COLORS.muted, textAlign: 'center', lineHeight: 21, marginVertical: 14 },
  scannerScreen: { flex: 1, padding: 20, paddingBottom: 110 },
  cameraFrame: { height: 360, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111', borderWidth: 3, borderColor: COLORS.purple },
  scanSquare: { position: 'absolute', width: 210, height: 210, borderWidth: 4, borderColor: '#fff', borderRadius: 20, alignSelf: 'center', top: 72 },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  success: { color: COLORS.green, backgroundColor: COLORS.greenSoft, padding: 14, borderRadius: 12, marginTop: 14, fontWeight: '900' },
  error: { color: COLORS.red, fontWeight: '900', textAlign: 'center', marginVertical: 10 },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.line, paddingTop: 10, paddingBottom: 16 },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { color: '#80879A', fontWeight: '700', fontSize: 12 },
  navTextActive: { color: COLORS.purple, fontWeight: '900' },

  /* ── Animated tutorial guide ── */
  guideCard: { backgroundColor: COLORS.purpleSoft, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: '#DFC8F7' },
  guideRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  guideAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.purple, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  guideAvatarEmoji: { fontSize: 28 },
  guideSpeech: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, position: 'relative', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  speechArrow: { position: 'absolute', left: -8, top: 16, width: 0, height: 0, borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 10, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: '#fff' },
  guideSpeechTitle: { color: COLORS.purple, fontWeight: '900', fontSize: 16, marginBottom: 6 },
  guideSpeechText: { color: COLORS.purpleDark, lineHeight: 21, fontWeight: '600' },
  guideTipBar: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12, backgroundColor: '#fff', borderRadius: 12, padding: 10 },
  guideTipIcon: { fontSize: 16 },
  guideTipText: { color: COLORS.muted, fontWeight: '700', flex: 1, lineHeight: 19 },

  /* ── Step 2: example card ── */
  exampleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.line },
  exampleTitle: { color: COLORS.purple, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  exampleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  exampleItem: { alignItems: 'center', flex: 1 },
  exampleEmoji: { fontSize: 24, marginBottom: 4 },
  exampleLabel: { color: COLORS.text, fontWeight: '800', fontSize: 12, textAlign: 'center' },
  exampleArrow: { color: COLORS.purple, fontWeight: '900', fontSize: 20 },

  /* ── Step 2: goal chip extras ── */
  goalChipSub: { color: COLORS.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  goalChipSubActive: { color: COLORS.purple },
  goalCheck: { color: COLORS.green, fontWeight: '900', fontSize: 16, marginTop: 4 },
  selectedGoalsPreview: { backgroundColor: COLORS.purpleSoft, borderRadius: 14, padding: 12, marginBottom: 14 },
  selectedGoalsTitle: { color: COLORS.purple, fontWeight: '900', marginBottom: 8 },
  selectedGoalsPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedGoalPill: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  selectedGoalPillText: { color: COLORS.purple, fontWeight: '900', fontSize: 13 },

  /* ── Step 3: progress bar ── */
  rewardProgress: { height: 8, backgroundColor: COLORS.line, borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  rewardProgressFill: { height: 8, backgroundColor: COLORS.green, borderRadius: 4 },
  rewardProgressLabel: { color: COLORS.muted, fontWeight: '700', fontSize: 13, marginBottom: 16 },

  /* ── Step 3: goal cards ── */
  goalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 14, marginBottom: 4, borderWidth: 1.5 },
  goalCardDone: { backgroundColor: COLORS.greenSoft, borderColor: '#A9E4C4' },
  goalCardEditing: { backgroundColor: COLORS.purpleSoft, borderColor: COLORS.purple },
  goalCardPending: { backgroundColor: '#fff', borderColor: COLORS.line, borderStyle: 'dashed' },
  goalCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  goalCardBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  goalCardBadgeDone: { backgroundColor: COLORS.green },
  goalCardBadgeText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  goalCardPoints: { color: COLORS.text, fontWeight: '900', fontSize: 16 },
  goalCardRewardDone: { color: COLORS.green, fontWeight: '700', fontSize: 13, marginTop: 2 },
  goalCardRewardPending: { color: COLORS.muted, fontWeight: '700', fontSize: 13, marginTop: 2 },
  goalCardAction: { fontSize: 16, marginLeft: 8 },

  /* ── Step 3: reward picker ── */
  rewardPicker: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  rewardPickerTitle: { color: COLORS.purple, fontWeight: '900', marginBottom: 10 },
  rewardChipSelected: { backgroundColor: COLORS.purple, borderColor: COLORS.purple },
  rewardChipTextSelected: { color: '#fff' },

  deunaContent: { paddingTop: 20, paddingBottom: 116, backgroundColor: '#fff' },
  businessHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 18, gap: 14, backgroundColor: '#fff' },
  logoDotSmall: { width: 45, height: 45, borderRadius: 23, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  businessIdentity: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  businessHello: { color: COLORS.text, fontSize: 23, fontWeight: '900', letterSpacing: 0 },
  adminBadge: { color: COLORS.purple, backgroundColor: COLORS.purpleSoft, borderRadius: 4, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, fontWeight: '900', fontSize: 13 },
  businessName: { color: '#5E6470', fontSize: 20, marginTop: 3, letterSpacing: 0 },
  headerAction: { color: '#111', fontSize: 22, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  topTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#EFEFF2', backgroundColor: '#fff' },
  topTab: { flex: 1, alignItems: 'center', paddingTop: 14 },
  topTabText: { color: '#535866', fontSize: 20, fontWeight: '800', letterSpacing: 0 },
  topTabTextActive: { color: COLORS.purple },
  topTabLine: { height: 3, alignSelf: 'stretch', marginTop: 20, backgroundColor: 'transparent' },
  topTabLineActive: { backgroundColor: COLORS.purple },
  chargePanel: { backgroundColor: '#fff' },
  amountLabel: { color: '#7B8495', fontSize: 22, textAlign: 'center', marginTop: 26 },
  amountValue: { color: '#17171C', fontSize: 64, fontWeight: '500', textAlign: 'center', marginTop: 8, marginBottom: 26 },
  segmented: { flexDirection: 'row', marginHorizontal: 54, backgroundColor: '#F5F5F7', borderRadius: 8, overflow: 'hidden', marginBottom: 36 },
  segmentedItem: { flex: 1, textAlign: 'center', paddingVertical: 13, color: COLORS.purpleDark, fontSize: 18, fontWeight: '800' },
  segmentedItemActive: { backgroundColor: COLORS.purple, color: '#fff' },
  businessQrCard: { alignItems: 'center', marginHorizontal: 24, marginBottom: 24, backgroundColor: '#fff', borderRadius: 8, padding: 18, borderWidth: 1, borderColor: '#E8E8EC', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  businessQrTitle: { color: COLORS.text, fontWeight: '900', fontSize: 18, marginTop: 12 },
  businessQrText: { color: COLORS.muted, textAlign: 'center', fontWeight: '700', lineHeight: 20, marginTop: 6 },
  reasonRow: { minHeight: 64, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E7E7EA', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reasonText: { color: '#565C69', fontSize: 20, letterSpacing: 0 },
  reasonChevron: { color: '#111', fontSize: 28, fontWeight: '900' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', paddingTop: 22, paddingHorizontal: 34 },
  keypadKey: { width: '33.333%', height: 78, alignItems: 'center', justifyContent: 'center' },
  keypadText: { color: COLORS.purple, fontSize: 28, fontWeight: '400' },
  keypadDelete: { color: '#fff', backgroundColor: COLORS.purple, borderRadius: 4, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 1, fontSize: 20, fontWeight: '900' },
  disabledChargeButton: { marginHorizontal: 24, marginTop: 20, height: 74, borderRadius: 8, backgroundColor: '#E2E2E3', alignItems: 'center', justifyContent: 'center' },
  disabledChargeText: { color: '#575D67', fontSize: 20, fontWeight: '900' },
  enabledChargeButton: { backgroundColor: COLORS.purple },
  enabledChargeText: { color: '#fff' },
  managePanel: { paddingHorizontal: 24, paddingTop: 32 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 8, padding: 24, minHeight: 132, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4, marginBottom: 36 },
  balanceLabel: { color: '#5E6470', fontSize: 21, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceValue: { color: '#17171C', fontSize: 45, fontWeight: '500' },
  eyeIcon: { color: '#111', fontSize: 28, marginLeft: 14, fontWeight: '900' },
  balanceArrow: { marginLeft: 'auto', color: '#111', fontSize: 32, fontWeight: '900' },
  deunaSectionTitle: { color: '#202026', fontSize: 22, fontWeight: '900', marginBottom: 18, letterSpacing: 0 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 52 },
  quickItem: { width: '23%', alignItems: 'center' },
  quickCircle: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#F7F7F8', alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  quickIcon: { color: '#222', fontSize: 26, fontWeight: '500' },
  quickLabel: { color: '#5E6470', fontSize: 16, textAlign: 'center', lineHeight: 20, fontWeight: '700' },
  newsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  newsCard: { width: 148, height: 170, backgroundColor: '#F8F8F9', borderRadius: 4, padding: 18, justifyContent: 'space-between' },
  newsTitle: { color: COLORS.purpleDark, fontSize: 18, lineHeight: 23, fontWeight: '700' },
  deunaMark: { width: 58, height: 38, borderRadius: 4, backgroundColor: '#007E75', alignItems: 'center', justifyContent: 'center' },
  deunaMarkText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  rewardsEntry: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.purpleSoft, borderRadius: 8, padding: 16, marginTop: 4 },
  rewardsEntryTitle: { color: COLORS.purple, fontWeight: '900', fontSize: 18 },
  rewardsEntryText: { color: COLORS.purpleDark, marginTop: 4, fontWeight: '700' },
  rewardsEntryButton: { color: '#fff', backgroundColor: COLORS.purple, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 8, fontWeight: '900' },
  rewardInlineCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 24, marginTop: 18, padding: 14, borderRadius: 8, backgroundColor: COLORS.purpleSoft },
  rewardInlineBadge: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rewardInlineBadgeText: { color: COLORS.purple, fontWeight: '900', fontSize: 12 },
  rewardInlineTitle: { color: COLORS.purple, fontWeight: '900', fontSize: 17 },
  rewardInlineText: { color: COLORS.purpleDark, fontWeight: '700', marginTop: 3 },
  rewardInlineAction: { color: '#fff', backgroundColor: COLORS.purple, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8, fontWeight: '900' },
  rewardProgramCard: { backgroundColor: '#fff', borderRadius: 8, padding: 18, marginTop: 8, marginBottom: 20, borderWidth: 1, borderColor: '#E8DDF4', shadowColor: COLORS.purple, shadowOpacity: 0.10, shadowRadius: 10, elevation: 3 },
  rewardProgramHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  rewardProgramKicker: { color: COLORS.purple, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  rewardProgramTitle: { color: COLORS.text, fontWeight: '900', fontSize: 22, marginTop: 4 },
  rewardProgramStatus: { color: COLORS.green, backgroundColor: COLORS.greenSoft, borderRadius: 8, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontWeight: '900' },
  rewardProgramRule: { color: '#5E6470', fontWeight: '700', fontSize: 16, marginTop: 10, marginBottom: 14 },
  rewardProgramStats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  rewardProgramStat: { flex: 1, backgroundColor: '#F8F8F9', borderRadius: 8, padding: 10 },
  rewardProgramStatValue: { color: COLORS.purple, fontWeight: '900', fontSize: 22 },
  rewardProgramStatLabel: { color: '#5E6470', fontWeight: '700', fontSize: 12, marginTop: 2 },
  rewardProgramTiers: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  rewardProgramTier: { flex: 1, backgroundColor: COLORS.purpleSoft, borderRadius: 8, padding: 10, minHeight: 74 },
  rewardProgramTierPoints: { color: COLORS.purple, fontWeight: '900', fontSize: 16 },
  rewardProgramTierTitle: { color: COLORS.purpleDark, fontWeight: '700', fontSize: 12, marginTop: 4 },
  rewardProgramButton: { color: '#fff', backgroundColor: COLORS.purple, borderRadius: 8, overflow: 'hidden', paddingVertical: 13, textAlign: 'center', fontWeight: '900', fontSize: 15 },
  innerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 22 },
  backIcon: { color: '#111', fontSize: 40, fontWeight: '500' },
  cashPill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#000', borderRadius: 28, paddingVertical: 12, paddingHorizontal: 22 },
  cashPillText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  cashPillArrow: { color: '#111', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 2, fontWeight: '900' },
  cashTotalCard: { marginHorizontal: 24, marginTop: 40, minHeight: 132, borderRadius: 8, backgroundColor: '#F7F7F8', alignItems: 'center', justifyContent: 'center' },
  cashLabel: { color: '#5E6470', fontSize: 20, marginBottom: 10 },
  cashAmount: { color: '#17171C', fontSize: 40, fontWeight: '500' },
  cashDate: { color: '#565C69', textAlign: 'center', fontSize: 18, marginTop: 30, marginBottom: 66 },
  salesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  manualSaleButton: { backgroundColor: COLORS.purpleSoft, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  manualSaleText: { color: COLORS.purple, fontSize: 18, fontWeight: '900' },
  emptySales: { alignItems: 'center', marginTop: 110, marginBottom: 74 },
  emptyWallet: { width: 130, height: 96, borderRadius: 8, backgroundColor: '#EFE8F7', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-4deg' }] },
  emptyWalletText: { color: COLORS.purple, fontSize: 42, fontWeight: '900' },
  emptySalesText: { color: '#6C7280', fontSize: 21, marginTop: 32 },
  closeCashButton: { marginHorizontal: 24, height: 72, borderRadius: 8, backgroundColor: COLORS.purple, alignItems: 'center', justifyContent: 'center' },
  closeCashText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  menuTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 30 },
  menuTitleReal: { color: COLORS.text, fontSize: 25, fontWeight: '900' },
  menuProfile: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingHorizontal: 24, marginBottom: 74 },
  logoDotMenu: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  profileName: { color: COLORS.text, fontSize: 25, fontWeight: '900' },
  menuSection: { color: COLORS.text, fontSize: 24, fontWeight: '900', paddingHorizontal: 24, marginBottom: 30, marginTop: 2 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 38, marginHorizontal: 44, minHeight: 84, borderBottomWidth: 1, borderBottomColor: '#E5E5E7' },
  optionRowLast: { borderBottomWidth: 0 },
  optionIcon: { width: 34, textAlign: 'center', color: '#222', fontSize: 28, fontWeight: '700' },
  optionLabel: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  navIcon: { color: '#80879A', fontWeight: '900', fontSize: 24, lineHeight: 28, marginBottom: 3 },
});

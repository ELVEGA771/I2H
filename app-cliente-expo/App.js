import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const USER_ID = 1;

const COLORS = {
  purple: '#5B2A86',
  purpleDark: '#1D1037',
  purpleSoft: '#F2EAFB',
  bg: '#F7F7F8',
  card: '#FFFFFF',
  text: '#191919',
  muted: '#71788A',
  line: '#E8E8EC',
  green: '#1A6640',
  greenSoft: '#E6F7EE',
  orange: '#A05D00',
  orangeSoft: '#FFF4DF',
  blue: '#2369C9',
};

const fallbackMerchants = [
  {
    id: 1,
    name: 'Cafetería Luna',
    category: 'Cafetería',
    description: 'El mejor café del barrio',
    is_featured: true,
    sponsor_level: 'premium',
    loyalty_enabled: true,
    campaign_name: 'Cafe Lovers',
    points_per_dollar: 1,
    reward_threshold: 10,
    reward_type: 'discount',
    reward_value: '$1 de descuento en tu próxima compra',
    terms: 'Válido en compras desde $3. Un reward por compra.',
  },
  {
    id: 2,
    name: 'Barber Shop Centro',
    category: 'Barbería',
    description: 'Cortes modernos y clásicos',
    is_featured: true,
    sponsor_level: 'basic',
    loyalty_enabled: true,
    campaign_name: 'Cortes Frecuentes',
    points_per_dollar: 1,
    reward_threshold: 20,
    reward_type: 'free_product',
    reward_value: 'Corte gratis',
    terms: 'Válido de lunes a jueves con reserva previa.',
  },
  {
    id: 3,
    name: 'Panadería El Sol',
    category: 'Panadería',
    description: 'Pan artesanal horneado cada día',
    is_featured: false,
    sponsor_level: 'none',
    loyalty_enabled: true,
    campaign_name: 'Pan de Cada Día',
    points_per_dollar: 1,
    reward_threshold: 15,
    reward_type: 'percentage_off',
    reward_value: '20% de descuento en toda la tienda',
    terms: 'No acumulable con otras promociones.',
  },
];

const fallbackPoints = [
  {
    merchant_id: 1,
    merchant_name: 'Cafetería Luna',
    category: 'Cafetería',
    campaign_name: 'Cafe Lovers',
    points_balance: 8,
    total_points_earned: 8,
    reward_threshold: 10,
    reward_type: 'discount',
    reward_value: '$1 de descuento en tu próxima compra',
    terms: 'Válido en compras desde $3. Un reward por compra.',
    points_per_dollar: 1,
    reward_id: null,
    reward_status: null,
    qr_code: null,
  },
];

const shortcuts = [
  { icon: 'cash-outline', label: 'Transferir', type: 'ion' },
  { icon: 'bank-transfer', label: 'Transferir a\notro banco', type: 'mci' },
  { icon: 'wallet-outline', label: 'Recargar', type: 'ion' },
  { icon: 'card-outline', label: 'Cobrar', type: 'ion' },
  { icon: 'storefront-outline', label: 'Retirar', type: 'ion' },
  { icon: 'phone-portrait-outline', label: 'Recarga\ncelular', type: 'ion' },
  { icon: 'receipt-outline', label: 'Pagar\nservicios', type: 'ion' },
  { icon: 'train-outline', label: 'Metro de\nQuito', type: 'ion' },
];

const rewardTypeLabel = {
  discount: 'Descuento',
  free_product: 'Gratis',
  percentage_off: '% Off',
};

const categoryIcons = {
  Cafetería: 'cafe-outline',
  Barbería: 'cut-outline',
  Panadería: 'restaurant-outline',
  Farmacia: 'medical-outline',
  Minimarket: 'basket-outline',
};

function apiUrl(path) {
  return `${API_URL}${path}`;
}

async function apiGet(path) {
  const res = await fetch(apiUrl(path));
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
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
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [selectedRewardId, setSelectedRewardId] = useState(null);

  const goTab = (nextTab) => {
    setSelectedMerchant(null);
    setSelectedRewardId(null);
    setTab(nextTab);
  };

  let content;
  if (selectedRewardId) {
    content = (
      <RewardQrScreen
        rewardId={selectedRewardId}
        onBack={() => setSelectedRewardId(null)}
        onDone={() => {
          setSelectedRewardId(null);
          setSelectedMerchant(null);
        }}
      />
    );
  } else if (selectedMerchant) {
    content = (
      <MerchantRewardScreen
        merchant={selectedMerchant}
        onBack={() => setSelectedMerchant(null)}
        onShowReward={(rewardId) => setSelectedRewardId(rewardId)}
      />
    );
  } else if (tab === 'beneficios') {
    content = <BenefitsScreen onOpenMerchant={setSelectedMerchant} />;
  } else if (tab === 'billetera') {
    content = <WalletScreen />;
  } else if (tab === 'tu') {
    content = <ProfileScreen />;
  } else {
    content = <HomeScreen onOpenRewards={() => goTab('beneficios')} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={styles.appContainer}>
        <View style={styles.contentContainer}>{content}</View>
        {!selectedMerchant && !selectedRewardId ? <BottomNav current={tab} onChange={goTab} /> : null}
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ onOpenRewards }) {
  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.homeHeader}>
          <View style={styles.homeHeaderLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>AG</Text>
            </View>
            <Text style={styles.greeting}>Hola Ana</Text>
          </View>
          <View style={styles.headerIcons}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
            <Ionicons name="headset-outline" size={24} color={COLORS.text} />
          </View>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>$4,26</Text>
            <Ionicons name="eye-outline" size={24} color={COLORS.text} />
            <View style={{ flex: 1 }} />
            <Ionicons name="chevron-forward" size={26} color={COLORS.text} />
          </View>
          <View style={styles.spentBanner}>
            <MaterialCommunityIcons name="sparkles" size={18} color={COLORS.purple} />
            <Text style={styles.spentText}>Gastaste $2,24 los últimos 30 días</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {shortcuts.map((item) => (
            <ShortcutCard key={item.label} item={item} />
          ))}
        </View>

        <View style={styles.rewardsHero}>
          <View style={styles.rewardsHeroIcon}>
            <Ionicons name="gift-outline" size={30} color={COLORS.purple} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardsHeroTitle}>Rewards cerca de ti</Text>
            <Text style={styles.rewardsHeroText}>Compra en negocios afiliados, acumula puntos y muestra tu QR al ganar.</Text>
          </View>
          <TouchableOpacity style={styles.smallPrimaryButton} onPress={onOpenRewards}>
            <Text style={styles.smallPrimaryButtonText}>Ver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Mis promociones</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoRow}>
          {[
            { title: '3 pagos y gana', subtitle: 'Sorteo', color: '#5B12C7' },
            { title: 'Giveaway Infinix', subtitle: 'Sorteo', color: '#20A9A2' },
            { title: 'Vuelta a clases', subtitle: 'Promo', color: '#D88421' },
          ].map((promo) => (
            <View key={promo.title} style={[styles.promoCard, { backgroundColor: promo.color }]}>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              <View style={styles.promoBadge}><Text style={styles.promoBadgeText}>{promo.subtitle}</Text></View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

function BenefitsScreen({ onOpenMerchant }) {
  const [activeTab, setActiveTab] = useState('rewards');
  const [merchants, setMerchants] = useState([]);
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [merchantRows, pointRows] = await Promise.all([
        apiGet('/api/merchants'),
        apiGet(`/api/users/${USER_ID}/points`),
      ]);
      setMerchants(merchantRows.filter((merchant) => merchant.loyalty_enabled));
      setPoints(pointRows);
    } catch (err) {
      setError('API no disponible. Mostrando datos demo.');
      setMerchants(fallbackMerchants);
      setPoints(fallbackPoints);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pointsByMerchant = useMemo(() => {
    const map = new Map();
    points.forEach((row) => map.set(Number(row.merchant_id), row));
    return map;
  }, [points]);

  const featured = merchants.filter((merchant) => merchant.sponsor_level !== 'none');

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Beneficios</Text>
        <View style={styles.topTabs}>
          {[
            ['rewards', 'Rewards'],
            ['club', 'Club Deuna'],
            ['promos', 'Promociones'],
          ].map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.topTab, activeTab === key && styles.topTabActive]} onPress={() => setActiveTab(key)}>
              <Text style={[styles.topTabText, activeTab === key && styles.topTabActiveText]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'rewards' ? (
          <View>
            <View style={styles.apiBanner}>
              <Ionicons name={error ? 'warning-outline' : 'cloud-done-outline'} size={18} color={error ? COLORS.orange : COLORS.green} />
              <Text style={[styles.apiBannerText, error && { color: COLORS.orange }]}>{error || `Conectado a ${API_URL}`}</Text>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons name="sparkles-outline" size={18} color={COLORS.purple} />
              </View>
              <View>
                <Text style={styles.sectionHeaderTitle}>Negocios con Rewards</Text>
                <Text style={styles.sectionHeaderSub}>Acumula puntos por cada compra</Text>
              </View>
            </View>

            {loading ? (
              <LoadingBlock label="Cargando rewards..." />
            ) : (
              <>
                {featured.length ? (
                  <>
                    <Text style={styles.listLabel}>Destacados</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
                      {featured.map((merchant) => (
                        <FeaturedMerchantCard
                          key={merchant.id}
                          merchant={merchant}
                          pointsRow={pointsByMerchant.get(Number(merchant.id))}
                          onPress={() => onOpenMerchant(merchant)}
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <Text style={styles.listLabel}>Todos los comercios</Text>
                {merchants.map((merchant) => (
                  <MerchantRow
                    key={merchant.id}
                    merchant={merchant}
                    pointsRow={pointsByMerchant.get(Number(merchant.id))}
                    onPress={() => onOpenMerchant(merchant)}
                  />
                ))}
              </>
            )}
          </View>
        ) : activeTab === 'club' ? (
          <ClubScreen />
        ) : (
          <PromotionsScreen />
        )}
      </ScrollView>
    </View>
  );
}

function MerchantRewardScreen({ merchant, onBack, onShowReward }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('5');
  const [simulating, setSimulating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState('');

  const merchantId = Number(merchant.id);

  const loadPoints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await apiGet(`/api/users/${USER_ID}/points`);
      const found = rows.find((row) => Number(row.merchant_id) === merchantId);
      if (found) {
        setData(found);
      } else {
        const merchantData = await apiGet(`/api/merchants/${merchantId}`);
        setData({
          merchant_id: merchantData.id,
          merchant_name: merchantData.name,
          category: merchantData.category,
          campaign_name: merchantData.campaign_name || 'Programa Rewards',
          points_balance: 0,
          total_points_earned: 0,
          reward_threshold: merchantData.reward_threshold || 10,
          reward_type: merchantData.reward_type || 'discount',
          reward_value: merchantData.reward_value || 'Reward disponible',
          terms: merchantData.terms || 'Reward de un solo uso.',
          points_per_dollar: merchantData.points_per_dollar || 1,
          reward_id: null,
          reward_status: null,
          qr_code: null,
        });
      }
    } catch (err) {
      setError('No se pudo conectar con la API.');
      setData({
        merchant_id: merchantId,
        merchant_name: merchant.name,
        category: merchant.category || 'Cafetería',
        campaign_name: merchant.campaign_name || 'Cafe Lovers',
        points_balance: 8,
        total_points_earned: 8,
        reward_threshold: merchant.reward_threshold || 10,
        reward_type: merchant.reward_type || 'discount',
        reward_value: merchant.reward_value || '$1 de descuento en tu próxima compra',
        terms: merchant.terms || 'Válido en compras desde $3. Un reward por compra.',
        points_per_dollar: merchant.points_per_dollar || 1,
        reward_id: null,
        reward_status: null,
        qr_code: null,
      });
    } finally {
      setLoading(false);
    }
  }, [merchant, merchantId]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const progress = data ? Math.min((Number(data.points_balance) / Number(data.reward_threshold)) * 100, 100) : 0;
  const hasReward = Boolean(data?.reward_id && data?.reward_status === 'unlocked');

  const simulatePurchase = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    setSimulating(true);
    setError('');
    setLastResult(null);
    try {
      const result = await apiPost('/api/transactions/simulate', {
        user_id: USER_ID,
        merchant_id: merchantId,
        amount: numericAmount,
      });
      setLastResult(result);
      await loadPoints();
    } catch (err) {
      setError(err.message || 'No se pudo simular la compra.');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={data?.merchant_name || merchant.name} onBack={onBack} />
        {loading ? (
          <LoadingBlock label="Cargando puntos..." />
        ) : data ? (
          <>
            <View style={styles.merchantHero}>
              <View style={styles.bigCategoryIcon}>
                <Ionicons name={categoryIcons[data.category] || 'storefront-outline'} size={34} color={COLORS.purple} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.merchantHeroTitle}>{data.merchant_name}</Text>
                <Text style={styles.merchantHeroSub}>{data.campaign_name}</Text>
                <Text style={styles.merchantHeroSub}>{data.category}</Text>
              </View>
            </View>

            <View style={styles.pointsCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>Mis puntos</Text>
                <Text style={styles.pointsBig}>{data.points_balance}<Text style={styles.pointsGoal}> / {data.reward_threshold}</Text></Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.helperText}>
                {hasReward
                  ? 'Ya tienes un reward listo para mostrar en caja.'
                  : `Te faltan ${Math.max(Number(data.reward_threshold) - Number(data.points_balance), 0)} puntos para desbloquear tu premio.`}
              </Text>
            </View>

            <View style={styles.rewardInfo}>
              <View style={styles.rewardInfoIcon}>
                <Ionicons name="gift-outline" size={22} color={COLORS.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rewardInfoLabel}>Premio</Text>
                <Text style={styles.rewardInfoTitle}>{data.reward_value}</Text>
                <Text style={styles.rewardInfoTerms}>{data.terms}</Text>
              </View>
            </View>

            {hasReward ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => onShowReward(data.reward_id)}>
                <Ionicons name="qr-code-outline" size={22} color="#fff" />
                <Text style={styles.primaryButtonText}>Mostrar QR del reward</Text>
              </TouchableOpacity>
            ) : null}

            {lastResult ? (
              <View style={[styles.resultBox, lastResult.reward_unlocked ? styles.successBox : styles.infoBox]}>
                <Text style={[styles.resultTitle, lastResult.reward_unlocked ? styles.successText : styles.infoText]}>
                  {lastResult.reward_unlocked ? 'Reward desbloqueado' : `+${lastResult.points_earned} puntos acumulados`}
                </Text>
                <Text style={styles.resultBody}>
                  {lastResult.reward_unlocked
                    ? 'Tu QR ya está listo. Muéstralo al negocio para canjearlo.'
                    : 'Sigue comprando para llegar a la meta.'}
                </Text>
              </View>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.demoTool}>
              <View style={styles.demoToolHeader}>
                <Ionicons name="cart-outline" size={18} color={COLORS.purple} />
                <Text style={styles.demoToolTitle}>Simular compra</Text>
                <Text style={styles.demoBadge}>demo</Text>
              </View>
              <View style={styles.amountRow}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={styles.amountInput}
                  placeholder="5"
                />
                <TouchableOpacity style={styles.payButton} onPress={simulatePurchase} disabled={simulating}>
                  {simulating ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pagar</Text>}
                </TouchableOpacity>
              </View>
              <Text style={styles.demoHint}>${data.points_per_dollar ? `1 = ${data.points_per_dollar}` : '1 = 1'} punto · Meta: {data.reward_threshold} puntos</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function RewardQrScreen({ rewardId, onBack, onDone }) {
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadReward() {
      setLoading(true);
      setError('');
      try {
        const payload = await apiGet(`/api/rewards/${rewardId}`);
        if (mounted) setReward(payload);
      } catch (err) {
        if (mounted) setError('No se pudo cargar el QR. Verifica la API.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadReward();
    return () => {
      mounted = false;
    };
  }, [rewardId]);

  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.qrContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Tu reward" onBack={onBack} />
        {loading ? (
          <LoadingBlock label="Preparando QR..." />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={48} color={COLORS.orange} />
            <Text style={styles.emptyTitle}>QR no disponible</Text>
            <Text style={styles.emptyBody}>{error}</Text>
          </View>
        ) : reward ? (
          <View style={styles.qrCard}>
            <View style={styles.qrRewardIcon}>
              <Ionicons name="gift-outline" size={36} color={COLORS.purple} />
            </View>
            <Text style={styles.qrTitle}>{reward.reward_value}</Text>
            <Text style={styles.qrMerchant}>en {reward.merchant_name}</Text>
            <View style={styles.qrBox}>
              <QRCode value={reward.qr_code} size={220} color={COLORS.purpleDark} backgroundColor="#FFFFFF" />
            </View>
            <Text style={styles.qrCodeText}>{reward.qr_code}</Text>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsTitle}>Cómo canjear</Text>
              <Text style={styles.instructionsText}>Muestra este QR al cajero. El negocio lo escanea desde su app y el código queda usado.</Text>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={onDone}>
              <Text style={styles.secondaryButtonText}>Volver a beneficios</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ClubScreen() {
  return (
    <View>
      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <View style={styles.bronzeBadge}><Text style={styles.badgeText}>d!</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.levelTitle}>Nivel Bronce</Text>
            <Text style={styles.levelDesc}>Completa pagos para subir de nivel y recibir beneficios adicionales.</Text>
          </View>
          <Ionicons name="help-circle-outline" size={28} color={COLORS.text} />
        </View>
        <Text style={styles.monthProgress}>Este mes completaste <Text style={{ color: COLORS.purple, fontWeight: '800' }}>0 pagos</Text></Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: '4%' }]} /></View>
      </View>
      <TouchableOpacity style={styles.inlineLink}>
        <Text style={styles.inlineLinkText}>¿Cómo funciona el Club Deuna?</Text>
        <Feather name="external-link" size={18} color={COLORS.blue} />
      </TouchableOpacity>
    </View>
  );
}

function PromotionsScreen() {
  return (
    <View>
      <Text style={styles.sectionTitle}>Destacadas del mes</Text>
      <View style={styles.promoLarge}>
        <Text style={styles.promoLargeTag}>Nuevo</Text>
        <Text style={styles.promoLargeTitle}>Introduce tus códigos aquí</Text>
        <Text style={styles.promoLargeText}>Activa promociones especiales para tu próxima compra.</Text>
      </View>
    </View>
  );
}

function WalletScreen() {
  return (
    <View style={styles.screenBase}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Billetera</Text>
        <Text style={styles.sectionTitle}>Cuentas</Text>
        <AccountItem badgeColor={COLORS.purple} title="Deuna ******7360" amount="$4,26" letters="d!" />
        <TouchableOpacity style={styles.inlineLink}>
          <Text style={styles.inlineLinkText}>No veo todas mis cuentas</Text>
          <Feather name="external-link" size={20} color={COLORS.blue} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.profileScreen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}><Text style={styles.avatarText}>AG</Text></View>
          <Text style={styles.profileName}>Ana García</Text>
          <Text style={styles.profileMeta}>Última sesión: 19 abr. 2026 | 10:08</Text>
          <Text style={styles.profileMeta}>Versión demo rewards</Text>
        </View>
        <View style={styles.profileCard}>
          {['Información personal', 'Pagos sin internet', 'Cambio de clave', 'Beneficios', 'Ayuda'].map((item, index) => (
            <View key={item}>
              <TouchableOpacity style={styles.profileRow}>
                <Text style={styles.profileRowText}>{item}</Text>
                <Ionicons name="chevron-forward" size={22} color={COLORS.text} />
              </TouchableOpacity>
              {index < 4 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FeaturedMerchantCard({ merchant, pointsRow, onPress }) {
  const current = Number(pointsRow?.points_balance ?? 0);
  const threshold = Number(merchant.reward_threshold ?? pointsRow?.reward_threshold ?? 10);
  return (
    <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
      <View style={styles.featuredImage}>
        <Ionicons name={categoryIcons[merchant.category] || 'storefront-outline'} size={42} color={COLORS.purple} />
      </View>
      <Text style={styles.featuredTitle} numberOfLines={1}>{merchant.name}</Text>
      <Text style={styles.featuredCategory}>{merchant.category}</Text>
      <Text style={styles.featuredReward}>{rewardTypeLabel[merchant.reward_type] || 'Reward'} a los {threshold} pts</Text>
      <View style={styles.miniProgressTrack}>
        <View style={[styles.miniProgressFill, { width: `${Math.min((current / threshold) * 100, 100)}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

function MerchantRow({ merchant, pointsRow, onPress }) {
  return (
    <TouchableOpacity style={styles.merchantRow} onPress={onPress}>
      <View style={styles.merchantIcon}>
        <Ionicons name={categoryIcons[merchant.category] || 'storefront-outline'} size={24} color={COLORS.purple} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.merchantName}>{merchant.name}</Text>
        <Text style={styles.merchantDesc} numberOfLines={1}>{merchant.description}</Text>
      </View>
      <View style={styles.merchantPoints}>
        <Text style={styles.merchantPointsValue}>{pointsRow?.points_balance ?? 0}</Text>
        <Text style={styles.merchantPointsLabel}>pts</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#B8B8C2" />
    </TouchableOpacity>
  );
}

function ShortcutCard({ item }) {
  const icon = item.type === 'mci'
    ? <MaterialCommunityIcons name={item.icon} size={30} color={COLORS.purple} />
    : <Ionicons name={item.icon} size={30} color={COLORS.purple} />;

  return (
    <TouchableOpacity style={styles.shortcutCard}>
      <View style={styles.shortcutIconWrap}>{icon}</View>
      <Text style={styles.shortcutLabel}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function AccountItem({ badgeColor, title, amount, letters }) {
  return (
    <View style={styles.accountRow}>
      <View style={[styles.accountBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.accountBadgeText}>{letters}</Text>
      </View>
      <View>
        <Text style={styles.accountTitle}>{title}</Text>
        <Text style={styles.accountAmount}>{amount}</Text>
      </View>
    </View>
  );
}

function ScreenHeader({ title, onBack }) {
  return (
    <View style={styles.screenHeader}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={26} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.screenHeaderTitle} numberOfLines={1}>{title}</Text>
      <View style={{ width: 40 }} />
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

function BottomNav({ current, onChange }) {
  const tabs = [
    { key: 'inicio', label: 'Inicio', icon: 'home-outline', activeIcon: 'home' },
    { key: 'beneficios', label: 'Beneficios', icon: 'gift-outline', activeIcon: 'gift' },
    { key: 'billetera', label: 'Billetera', icon: 'wallet-outline', activeIcon: 'wallet' },
    { key: 'tu', label: 'Tú', icon: 'person-circle-outline', activeIcon: 'person-circle' },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((item) => {
        const active = current === item.key;
        return (
          <TouchableOpacity key={item.key} style={styles.bottomNavItem} onPress={() => onChange(item.key)}>
            <Ionicons name={active ? item.activeIcon : item.icon} size={24} color={active ? COLORS.purple : '#7782A0'} />
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>{item.label}</Text>
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
  scrollContent: { padding: 18, paddingBottom: 118 },
  detailContent: { padding: 18, paddingBottom: 36 },
  qrContent: { padding: 18, paddingBottom: 36 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 8 },
  homeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#E8DDF7', borderWidth: 3, borderColor: '#F1A483', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800', color: COLORS.purple, fontSize: 18 },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerIcons: { flexDirection: 'row', gap: 14 },
  balanceCard: { backgroundColor: COLORS.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#ECECF1', marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  balanceLabel: { fontSize: 16, color: '#444', marginHorizontal: 18, marginTop: 18, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 18, marginBottom: 12 },
  balanceAmount: { fontSize: 32, fontWeight: '900', color: COLORS.text, marginRight: 10 },
  spentBanner: { backgroundColor: '#EFE4F7', paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  spentText: { color: COLORS.purple, fontWeight: '700', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  shortcutCard: { width: (width - 60) / 4, minWidth: 70, alignItems: 'center', marginBottom: 16 },
  shortcutIconWrap: { width: 62, height: 62, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ECECF1', marginBottom: 8 },
  shortcutLabel: { fontSize: 12, textAlign: 'center', color: COLORS.text, lineHeight: 16 },
  rewardsHero: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.purpleSoft, borderRadius: 20, padding: 16, marginTop: 4, marginBottom: 22, borderWidth: 1, borderColor: '#E4D7F4' },
  rewardsHeroIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  rewardsHeroTitle: { color: COLORS.purpleDark, fontWeight: '900', fontSize: 17 },
  rewardsHeroText: { color: '#61536F', marginTop: 3, lineHeight: 19 },
  smallPrimaryButton: { backgroundColor: COLORS.purple, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10 },
  smallPrimaryButtonText: { color: '#fff', fontWeight: '800' },
  sectionTitle: { fontSize: 21, fontWeight: '900', color: COLORS.text, marginTop: 6, marginBottom: 14 },
  promoRow: { paddingRight: 8 },
  promoCard: { width: 175, height: 105, borderRadius: 18, padding: 14, marginRight: 14, justifyContent: 'space-between' },
  promoTitle: { color: '#fff', fontWeight: '900', fontSize: 22, lineHeight: 24 },
  promoBadge: { backgroundColor: 'rgba(255,255,255,0.22)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  promoBadgeText: { color: '#fff', fontWeight: '700' },
  pageTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, textAlign: 'center', marginBottom: 18, marginTop: 8 },
  topTabs: { flexDirection: 'row', marginHorizontal: -18, marginBottom: 16 },
  topTab: { flex: 1, borderBottomWidth: 1, borderBottomColor: COLORS.line, paddingBottom: 12 },
  topTabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.purple },
  topTabText: { textAlign: 'center', color: '#A6A6B0', fontWeight: '700', fontSize: 16 },
  topTabActiveText: { color: COLORS.purple, fontWeight: '900' },
  apiBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, marginBottom: 16 },
  apiBannerText: { color: COLORS.green, flex: 1, fontWeight: '700', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  sectionHeaderTitle: { color: COLORS.text, fontWeight: '900', fontSize: 18 },
  sectionHeaderSub: { color: COLORS.muted, marginTop: 1 },
  listLabel: { fontSize: 15, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  featuredRow: { gap: 12, paddingBottom: 18 },
  featuredCard: { width: 178, backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: COLORS.line, marginRight: 12 },
  featuredImage: { height: 88, borderRadius: 16, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  featuredTitle: { color: COLORS.text, fontWeight: '900', fontSize: 15 },
  featuredCategory: { color: COLORS.muted, marginTop: 2, fontSize: 12 },
  featuredReward: { color: COLORS.purple, fontWeight: '800', marginTop: 8, fontSize: 12 },
  miniProgressTrack: { height: 6, backgroundColor: '#EEEFF3', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: COLORS.purple, borderRadius: 8 },
  merchantRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line },
  merchantIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  merchantName: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  merchantDesc: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  merchantPoints: { alignItems: 'center', minWidth: 38 },
  merchantPointsValue: { color: COLORS.purple, fontWeight: '900', fontSize: 17 },
  merchantPointsLabel: { color: COLORS.muted, fontSize: 11 },
  screenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 18 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line },
  screenHeaderTitle: { flex: 1, textAlign: 'center', color: COLORS.text, fontWeight: '900', fontSize: 18, marginHorizontal: 10 },
  loadingBlock: { alignItems: 'center', justifyContent: 'center', paddingVertical: 70 },
  loadingText: { marginTop: 12, color: COLORS.muted, fontWeight: '700' },
  merchantHero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.purpleSoft, borderRadius: 22, padding: 16, marginBottom: 14 },
  bigCategoryIcon: { width: 66, height: 66, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  merchantHeroTitle: { fontSize: 20, fontWeight: '900', color: COLORS.purpleDark },
  merchantHeroSub: { color: '#6E5A80', marginTop: 2, fontWeight: '600' },
  pointsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.line, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: COLORS.text, fontWeight: '900', fontSize: 17 },
  pointsBig: { color: COLORS.purple, fontWeight: '900', fontSize: 25 },
  pointsGoal: { color: COLORS.muted, fontWeight: '700', fontSize: 15 },
  progressTrack: { height: 11, backgroundColor: '#EEEFF3', borderRadius: 999, marginTop: 12, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.purple, borderRadius: 999 },
  helperText: { color: COLORS.muted, lineHeight: 20, marginTop: 10 },
  rewardInfo: { flexDirection: 'row', gap: 12, backgroundColor: COLORS.orangeSoft, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: '#F6D9A7', marginBottom: 14 },
  rewardInfoIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFE2B3', alignItems: 'center', justifyContent: 'center' },
  rewardInfoLabel: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  rewardInfoTitle: { color: COLORS.orange, fontWeight: '900', fontSize: 16, marginTop: 2 },
  rewardInfoTerms: { color: '#7B623C', marginTop: 4, lineHeight: 18 },
  primaryButton: { backgroundColor: COLORS.purple, borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginBottom: 14 },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  resultBox: { borderRadius: 16, padding: 14, marginBottom: 14, borderWidth: 1 },
  successBox: { backgroundColor: COLORS.greenSoft, borderColor: '#B7E8CC' },
  infoBox: { backgroundColor: COLORS.purpleSoft, borderColor: '#E4D7F4' },
  resultTitle: { fontWeight: '900', fontSize: 15 },
  successText: { color: COLORS.green },
  infoText: { color: COLORS.purple },
  resultBody: { color: COLORS.muted, marginTop: 4, lineHeight: 19 },
  errorText: { color: '#C62828', fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  demoTool: { borderWidth: 2, borderColor: '#E0D0F5', borderStyle: 'dashed', borderRadius: 18, padding: 14 },
  demoToolHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  demoToolTitle: { color: COLORS.purple, fontWeight: '900' },
  demoBadge: { backgroundColor: COLORS.purpleSoft, color: COLORS.purple, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden', fontWeight: '800', fontSize: 11 },
  amountRow: { flexDirection: 'row', gap: 10 },
  amountInput: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, paddingHorizontal: 14, fontSize: 18, fontWeight: '900', color: COLORS.text },
  payButton: { backgroundColor: COLORS.purple, borderRadius: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', minWidth: 92, minHeight: 52 },
  payButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  demoHint: { color: COLORS.muted, marginTop: 10, fontSize: 12 },
  qrCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  qrRewardIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.purpleSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  qrTitle: { color: COLORS.purpleDark, fontWeight: '900', fontSize: 22, textAlign: 'center' },
  qrMerchant: { color: COLORS.muted, marginTop: 5, marginBottom: 20 },
  qrBox: { padding: 18, borderRadius: 22, backgroundColor: '#fff', borderWidth: 2, borderColor: '#EFE5FB', marginBottom: 12 },
  qrCodeText: { fontFamily: 'monospace', color: COLORS.muted, fontSize: 12, marginBottom: 16, textAlign: 'center' },
  instructionsBox: { backgroundColor: COLORS.purpleSoft, borderRadius: 16, padding: 14, alignSelf: 'stretch', marginBottom: 16 },
  instructionsTitle: { color: COLORS.purpleDark, fontWeight: '900', marginBottom: 5 },
  instructionsText: { color: '#6E5A80', lineHeight: 20 },
  secondaryButton: { borderWidth: 2, borderColor: COLORS.purple, borderRadius: 16, paddingVertical: 14, alignItems: 'center', alignSelf: 'stretch' },
  secondaryButtonText: { color: COLORS.purple, fontWeight: '900' },
  emptyState: { alignItems: 'center', paddingVertical: 70 },
  emptyTitle: { color: COLORS.text, fontWeight: '900', fontSize: 20, marginTop: 12 },
  emptyBody: { color: COLORS.muted, marginTop: 8, textAlign: 'center' },
  levelCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#EBEBEF', marginBottom: 16 },
  levelRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  bronzeBadge: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#ED9A76', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '900', fontSize: 28 },
  levelTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  levelDesc: { fontSize: 14, color: '#45464C', lineHeight: 21, marginTop: 4 },
  monthProgress: { marginTop: 12, color: '#6B5B7A', fontSize: 15 },
  inlineLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  inlineLinkText: { color: COLORS.blue, fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
  promoLarge: { backgroundColor: '#FCE9F1', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#F4D1E0' },
  promoLargeTag: { alignSelf: 'flex-start', backgroundColor: '#69F0AE', color: '#004D40', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', fontWeight: '900', marginBottom: 10 },
  promoLargeTitle: { color: COLORS.text, fontWeight: '900', fontSize: 19 },
  promoLargeText: { color: '#555', marginTop: 5 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  accountBadge: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  accountBadgeText: { color: '#fff', fontWeight: '900', fontSize: 22 },
  accountTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  accountAmount: { fontSize: 16, color: '#444', marginTop: 4 },
  profileScreen: { flex: 1, backgroundColor: COLORS.purple },
  profileHeader: { alignItems: 'center', paddingTop: 36, paddingHorizontal: 18, paddingBottom: 28 },
  profileAvatar: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#E6DDF3', borderWidth: 4, borderColor: '#F0A07F', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileName: { color: '#fff', fontSize: 24, fontWeight: '900' },
  profileMeta: { color: '#E7DDF4', fontSize: 15, marginTop: 6 },
  profileCard: { backgroundColor: '#F7F7F8', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingVertical: 18, minHeight: 520 },
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20 },
  profileRowText: { fontSize: 18, color: COLORS.text },
  divider: { height: 1, backgroundColor: '#E1E1E6' },
  bottomNav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingTop: 10, paddingBottom: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: COLORS.line },
  bottomNavItem: { alignItems: 'center', gap: 4, flex: 1 },
  bottomNavText: { fontSize: 12, color: '#7782A0' },
  bottomNavTextActive: { color: COLORS.purple, fontWeight: '800' },
});

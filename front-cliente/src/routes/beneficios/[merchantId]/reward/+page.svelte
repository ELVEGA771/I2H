<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { ChevronLeft, CheckCircle2, RefreshCw } from 'lucide-svelte';
  import QRCode from 'qrcode';

  const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';
  const merchantId = $derived(Number($page.params.merchantId));
  const rewardId = $derived($page.url.searchParams.get('rewardId'));

  type RewardData = {
    id: number;
    merchant_name: string;
    reward_type: string;
    reward_value: string;
    qr_code: string;
    status: string;
    unlocked_at: string;
  };

  let rewardData = $state<RewardData | null>(null);
  let qrDataUrl = $state('');
  let loading = $state(true);
  let redeeming = $state(false);
  let redeemed = $state(false);

  onMount(async () => {
    try {
      if (rewardId) {
        const res = await fetch(`${API}/api/rewards/${rewardId}`);
        rewardData = await res.json();
      } else {
        // fallback demo reward
        rewardData = {
          id: 1,
          merchant_name: 'Cafetería Luna',
          reward_type: 'discount',
          reward_value: '$1 de descuento en tu próxima compra',
          qr_code: 'QR-REWARD-DEMO-001',
          status: 'unlocked',
          unlocked_at: new Date().toISOString()
        };
      }

      if (rewardData?.status === 'redeemed') {
        redeemed = true;
      }

      if (rewardData?.qr_code) {
        qrDataUrl = await QRCode.toDataURL(rewardData.qr_code, {
          width: 260,
          margin: 2,
          color: { dark: '#3f2b66', light: '#ffffff' }
        });
      }
    } catch {
      rewardData = {
        id: 1,
        merchant_name: 'Cafetería Luna',
        reward_type: 'discount',
        reward_value: '$1 de descuento en tu próxima compra',
        qr_code: 'QR-REWARD-DEMO-001',
        status: 'unlocked',
        unlocked_at: new Date().toISOString()
      };
      qrDataUrl = await QRCode.toDataURL('QR-REWARD-DEMO-001', { width: 260, margin: 2 }).catch(() => '');
    } finally {
      loading = false;
    }
  });

  async function redeemReward() {
    if (!rewardData || !rewardId) {
      redeemed = true;
      return;
    }
    redeeming = true;
    try {
      await fetch(`${API}/api/rewards/${rewardId}/redeem`, { method: 'POST' });
      redeemed = true;
    } catch {
      redeemed = true;
    } finally {
      redeeming = false;
    }
  }

  const rewardEmoji: Record<string, string> = {
    discount: '💰', free_product: '🎁', percentage_off: '🏷️'
  };
</script>

<div class="px-5 pt-10 pb-8 min-h-screen bg-white text-[#1d1d1f]">
  <header class="flex items-center gap-3 mb-8">
    <a href="/beneficios/{merchantId}" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
      <ChevronLeft size={20} strokeWidth={2.5} />
    </a>
    <h1 class="text-[20px] font-extrabold">Tu Premio</h1>
  </header>

  {#if loading}
    <div class="flex justify-center pt-20">
      <div class="w-7 h-7 rounded-full border-2 border-[#5b2a86] border-t-transparent animate-spin"></div>
    </div>
  {:else if redeemed}
    <div class="flex flex-col items-center justify-center pt-16 gap-5 animate-[fadeIn_.3s_ease-out]">
      <div class="w-24 h-24 rounded-full bg-[#d4f0e2] flex items-center justify-center">
        <CheckCircle2 size={50} strokeWidth={1.8} class="text-[#1a6640]" />
      </div>
      <div class="text-center">
        <h2 class="text-[24px] font-extrabold">¡Premio canjeado!</h2>
        <p class="text-gray-500 mt-2 text-[15px]">El comercio verificó tu código correctamente.</p>
      </div>
      <a
        href="/beneficios"
        class="mt-4 w-full rounded-[20px] bg-[#5b2a86] py-5 text-center text-[18px] font-extrabold text-white"
      >
        Ver más comercios
      </a>
    </div>
  {:else if rewardData}
    <div class="animate-[fadeIn_.25s_ease-out]">
      <!-- Reward header -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-3">{rewardEmoji[rewardData.reward_type] ?? '🎁'}</div>
        <h2 class="text-[22px] font-extrabold text-[#3f2b66]">{rewardData.reward_value}</h2>
        <p class="text-[15px] text-gray-500 mt-1">en <strong>{rewardData.merchant_name}</strong></p>
      </div>

      <!-- QR Code -->
      <div class="flex flex-col items-center mb-6">
        <div class="rounded-[24px] bg-white border-2 border-[#efe5fb] shadow-[0_8px_32px_rgba(91,42,134,0.12)] p-5">
          {#if qrDataUrl}
            <img src={qrDataUrl} alt="QR de redención" class="w-[200px] h-[200px]" />
          {:else}
            <div class="w-[200px] h-[200px] bg-gray-100 rounded-xl flex items-center justify-center">
              <RefreshCw size={32} strokeWidth={1.8} class="text-gray-400 animate-spin" />
            </div>
          {/if}
        </div>
        <p class="text-[12px] text-gray-400 mt-3 text-center font-mono">{rewardData.qr_code}</p>
      </div>

      <!-- Instructions -->
      <div class="rounded-[18px] bg-[#faf6ff] border border-[#efe5fb] p-4 mb-6 text-[14px] text-[#3f2b66]">
        <p class="font-bold mb-1">¿Cómo canjear?</p>
        <p class="text-gray-500 leading-relaxed">Muestra este QR al cajero del negocio al momento de tu compra. El código es de un solo uso.</p>
      </div>

      <!-- Redeem button (for demo: merchant scans & confirms) -->
      <button
        type="button"
        onclick={redeemReward}
        disabled={redeeming}
        class="w-full rounded-[20px] bg-[#5b2a86] py-5 text-[20px] font-extrabold text-white shadow-md disabled:opacity-60"
      >
        {redeeming ? 'Confirmando...' : '✓ Confirmar redención (cajero)'}
      </button>
      <p class="text-center text-[12px] text-gray-400 mt-2">Solo el cajero presiona este botón</p>
    </div>
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>

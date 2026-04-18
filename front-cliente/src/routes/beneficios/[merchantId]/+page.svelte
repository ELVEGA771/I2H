<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { ChevronLeft, Gift, Sparkles, ShoppingBag } from 'lucide-svelte';

  const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';
  const USER_ID = 1; // Ana García para demo

  const merchantId = $derived(Number($page.params.merchantId));

  type PointsData = {
    merchant_id: number;
    merchant_name: string;
    category: string;
    points_balance: number;
    total_points_earned: number;
    reward_threshold: number;
    reward_type: string;
    reward_value: string;
    points_per_dollar: number;
    reward_id: number | null;
    reward_status: string | null;
    qr_code: string | null;
  };

  let data = $state<PointsData | null>(null);
  let loading = $state(true);
  let simulating = $state(false);
  let simulateAmount = $state('5');
  type SimulateResult = {
    reward_unlocked: boolean;
    points_earned: number;
    applied_reward?: {
      reward_type: string;
      reward_value: string;
      original_amount: number;
      effective_amount: number;
    } | null;
  };
  let lastResult = $state<SimulateResult | null>(null);

  const categoryEmoji: Record<string, string> = {
    'Cafetería': '☕', 'Barbería': '✂️', 'Panadería': '🥖', 'Farmacia': '💊', 'Minimarket': '🛒'
  };

  async function loadPoints() {
    try {
      const res = await fetch(`${API}/api/users/${USER_ID}/points`);
      const all: PointsData[] = await res.json();
      const found = all.find(p => p.merchant_id === merchantId);
      if (found) {
        data = found;
      } else {
        // No points yet — load merchant info
        const mRes = await fetch(`${API}/api/merchants/${merchantId}`);
        const m = await mRes.json();
        data = {
          merchant_id: m.id,
          merchant_name: m.name,
          category: m.category,
          points_balance: 0,
          total_points_earned: 0,
          reward_threshold: m.reward_threshold ?? 10,
          reward_type: m.reward_type ?? 'discount',
          reward_value: m.reward_value ?? 'Premio',
          points_per_dollar: m.points_per_dollar ?? 1,
          reward_id: null,
          reward_status: null,
          qr_code: null
        };
      }
    } catch {
      data = {
        merchant_id: merchantId,
        merchant_name: 'Cafetería Luna',
        category: 'Cafetería',
        points_balance: 8,
        total_points_earned: 8,
        reward_threshold: 10,
        reward_type: 'discount',
        reward_value: '$1 de descuento en tu próxima compra',
        points_per_dollar: 1,
        reward_id: null,
        reward_status: null,
        qr_code: null
      };
    } finally {
      loading = false;
    }
  }

  onMount(loadPoints);

  async function simulatePurchase() {
    const amount = parseFloat(simulateAmount);
    if (!amount || amount <= 0) return;
    simulating = true;
    lastResult = null;
    try {
      const res = await fetch(`${API}/api/transactions/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, merchant_id: merchantId, amount })
      });
      lastResult = await res.json();
      await loadPoints();
    } catch {
      lastResult = { reward_unlocked: false, points_earned: Math.floor(amount) };
      if (data) {
        data = { ...data, points_balance: Math.min(data.points_balance + Math.floor(amount), data.reward_threshold) };
      }
    } finally {
      simulating = false;
    }
  }

  const progressPct = $derived(
    data ? Math.min((data.points_balance / data.reward_threshold) * 100, 100) : 0
  );
  const hasUnlockedReward = $derived(
    data?.reward_id != null && data?.reward_status === 'unlocked'
  );
</script>

<div class="px-5 pt-10 pb-8 text-[#1d1d1f] min-h-screen bg-white">
  <header class="flex items-center gap-3 mb-7">
    <a href="/beneficios" class="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
      <ChevronLeft size={20} strokeWidth={2.5} />
    </a>
    <h1 class="text-[20px] font-extrabold truncate">{data?.merchant_name ?? '...'}</h1>
  </header>

  {#if loading}
    <div class="flex justify-center pt-20">
      <div class="w-7 h-7 rounded-full border-2 border-[#5b2a86] border-t-transparent animate-spin"></div>
    </div>
  {:else if data}
    <!-- Merchant header -->
    <div class="rounded-[22px] bg-[#faf6ff] border border-[#efe5fb] p-5 mb-5 flex items-center gap-4">
      <div class="w-16 h-16 rounded-2xl bg-[#eadff7] flex items-center justify-center text-3xl shrink-0">
        {categoryEmoji[data.category] ?? '🏪'}
      </div>
      <div>
        <p class="text-[19px] font-extrabold leading-tight">{data.merchant_name}</p>
        <p class="text-[14px] text-gray-500">{data.category}</p>
      </div>
    </div>

    <!-- Points progress -->
    <div class="rounded-[22px] bg-white border border-gray-100 shadow-[0_4px_18px_rgba(17,24,39,0.07)] p-5 mb-5">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <Sparkles size={18} strokeWidth={2.2} class="text-[#5b2a86]" />
          <span class="text-[16px] font-bold">Mis puntos</span>
        </div>
        <span class="text-[24px] font-extrabold text-[#5b2a86]">{data.points_balance}<span class="text-[14px] font-medium text-gray-400"> / {data.reward_threshold}</span></span>
      </div>

      <div class="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[#5b2a86] to-[#9c4dcc]"
          style="width: {progressPct}%"
        ></div>
      </div>

      <p class="text-[13px] text-gray-500 mt-2">
        {#if progressPct >= 100}
          ¡Alcanzaste tu meta! Reclama tu premio.
        {:else}
          Te faltan <strong class="text-[#5b2a86]">{data.reward_threshold - data.points_balance} puntos</strong> para tu premio
        {/if}
      </p>
    </div>

    <!-- Reward info -->
    <div class="rounded-[18px] bg-[#fff8f0] border border-[#fde8c8] p-4 mb-5 flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-[#fde8c8] flex items-center justify-center shrink-0">
        <Gift size={20} strokeWidth={2.2} class="text-[#a05d00]" />
      </div>
      <div>
        <p class="text-[14px] text-gray-500">Premio al llegar a {data.reward_threshold} puntos</p>
        <p class="text-[16px] font-bold text-[#a05d00]">{data.reward_value}</p>
      </div>
    </div>

    <!-- Reward pending — will apply on next purchase -->
    {#if hasUnlockedReward}
      <div class="w-full rounded-[20px] bg-gradient-to-r from-[#5b2a86] to-[#9c4dcc] py-4 px-5 mb-5 flex items-center gap-3 shadow-lg animate-[fadeIn_.3s_ease-out]">
        <span class="text-2xl shrink-0">🎁</span>
        <div class="flex-1 min-w-0">
          <p class="text-white font-extrabold text-[16px] leading-tight">Premio listo</p>
          <p class="text-white/80 text-[13px] mt-0.5">{data.reward_value} — se aplicará en tu próxima compra aquí</p>
        </div>
      </div>
    {/if}

    {#if lastResult}
      <div class="rounded-[16px] p-4 mb-5 animate-[fadeIn_.3s_ease-out] {lastResult.reward_unlocked ? 'bg-[#d4f0e2] text-[#1a6640]' : lastResult.applied_reward ? 'bg-[#fff8f0] text-[#a05d00]' : 'bg-[#eadff7] text-[#5b2a86]'}">
        {#if lastResult.applied_reward}
          <p class="text-[15px] font-extrabold mb-1">✅ Descuento aplicado</p>
          <div class="flex justify-between text-[14px]">
            <span>Precio original</span>
            <span class="line-through opacity-60">${lastResult.applied_reward.original_amount.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-[15px] font-bold mt-0.5">
            <span>Pagaste</span>
            <span>${lastResult.applied_reward.effective_amount.toFixed(2)}</span>
          </div>
          {#if lastResult.points_earned > 0}
            <p class="text-[13px] mt-2 opacity-70">+{lastResult.points_earned} pts acumulados</p>
          {/if}
        {:else if lastResult.reward_unlocked}
          <p class="text-[15px] font-extrabold text-center">🎉 ¡Ganaste un premio! +{lastResult.points_earned} pts</p>
        {:else}
          <p class="text-[15px] font-semibold text-center">+{lastResult.points_earned} punto{lastResult.points_earned !== 1 ? 's' : ''} acumulado{lastResult.points_earned !== 1 ? 's' : ''}</p>
        {/if}
      </div>
    {/if}

    <!-- Simulate purchase (demo tool) -->
    <div class="rounded-[18px] border-2 border-dashed border-[#e0d0f5] p-4">
      <div class="flex items-center gap-2 mb-3">
        <ShoppingBag size={16} strokeWidth={2.2} class="text-[#5b2a86]" />
        <p class="text-[14px] font-bold text-[#5b2a86]">Simular compra</p>
        <span class="text-[11px] bg-[#eadff7] text-[#5b2a86] px-2 py-0.5 rounded-full font-semibold">demo</span>
      </div>
      <div class="flex gap-3">
        <div class="relative flex-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[16px] font-medium">$</span>
          <input
            type="number"
            bind:value={simulateAmount}
            min="1"
            class="w-full rounded-[14px] border border-gray-200 bg-gray-50 pl-7 pr-3 py-3 text-[16px] font-bold outline-none focus:border-[#5b2a86]"
          />
        </div>
        <button
          type="button"
          onclick={simulatePurchase}
          disabled={simulating}
          class="rounded-[14px] bg-[#5b2a86] px-5 py-3 text-[15px] font-bold text-white disabled:opacity-60 shrink-0"
        >
          {simulating ? '...' : 'Pagar'}
        </button>
      </div>
      <p class="text-[12px] text-gray-400 mt-2">$1 = 1 punto · Meta: {data.reward_threshold} puntos</p>
    </div>
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>

<script lang="ts">
  import { Gift, Star, Percent, ChevronRight, CheckCircle2, Sparkles } from 'lucide-svelte';

  const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';
  const MERCHANT_ID = 1;

  const rewardOptions = [
    { type: 'discount',       icon: Gift,    label: '$1 de descuento',  value: '$1 de descuento en tu próxima compra',   threshold: 10 },
    { type: 'free_product',   icon: Star,    label: 'Producto gratis',  value: 'Producto de cortesía gratis',             threshold: 20 },
    { type: 'percentage_off', icon: Percent, label: '20% off',          value: '20% de descuento en toda la tienda',      threshold: 15 },
  ];

  let step = $state<1 | 2 | 'done'>(1);
  let selectedReward = $state(rewardOptions[0]);
  let loading = $state(false);
  let error = $state('');

  async function activateProgram() {
    loading = true;
    error = '';
    try {
      const res = await fetch(`${API}/api/merchants/${MERCHANT_ID}/loyalty-program`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_per_dollar: 1,
          reward_threshold: selectedReward.threshold,
          reward_type: selectedReward.type,
          reward_value: selectedReward.value
        })
      });
      if (!res.ok) {
        error = 'No se pudo activar. Intenta de nuevo.';
      } else {
        step = 'done';
      }
    } catch {
      error = 'No se pudo activar. Intenta de nuevo.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="px-5 pt-10 pb-6 text-[#1d1d1f]">
  <header class="mb-8">
    <div class="flex items-center gap-3 mb-1">
      <div class="w-10 h-10 rounded-2xl bg-[#eadff7] flex items-center justify-center text-[#5b2a86]">
        <Sparkles size={22} strokeWidth={2.2} />
      </div>
      <h1 class="text-[26px] font-extrabold tracking-tight leading-none">Deuna Rewards</h1>
    </div>
    <p class="text-[16px] text-gray-500 mt-2 pl-1">Activa tu programa de lealtad en 2 pasos</p>
  </header>

  {#if step === 'done'}
    <div class="flex flex-col items-center justify-center pt-16 gap-6 animate-[fadeIn_.3s_ease-out]">
      <div class="w-24 h-24 rounded-full bg-[#eadff7] flex items-center justify-center">
        <CheckCircle2 size={52} strokeWidth={1.8} class="text-[#5b2a86]" />
      </div>
      <div class="text-center">
        <h2 class="text-[26px] font-extrabold tracking-tight">¡Programa activo!</h2>
        <p class="text-gray-500 mt-2 text-[16px]">Tus clientes ya pueden acumular puntos en tu negocio.</p>
      </div>
      <div class="w-full rounded-[18px] bg-[#faf6ff] border border-[#efe5fb] p-5 space-y-3">
        <div class="flex justify-between text-[16px]">
          <span class="text-gray-500">Regla de puntos</span>
          <span class="font-bold">$1 = 1 punto</span>
        </div>
        <div class="flex justify-between text-[16px]">
          <span class="text-gray-500">Meta</span>
          <span class="font-bold">{selectedReward.threshold} puntos</span>
        </div>
        <div class="flex justify-between text-[16px]">
          <span class="text-gray-500">Premio</span>
          <span class="font-bold">{selectedReward.label}</span>
        </div>
      </div>
      <a
        href="/loyalty/insights"
        class="w-full rounded-[20px] bg-[#5b2a86] py-5 text-center text-[20px] font-extrabold text-white shadow-md"
      >
        Ver mis clientes →
      </a>
    </div>

  {:else}
    <!-- Step indicators -->
    <div class="flex items-center gap-3 mb-8">
      {#each [1, 2] as s}
        <div class={`flex items-center justify-center w-8 h-8 rounded-full text-[15px] font-bold transition-colors
          ${step >= s ? 'bg-[#5b2a86] text-white' : 'bg-[#f0ecf5] text-[#5b2a86]'}`}>
          {s}
        </div>
        {#if s < 2}
          <div class={`flex-1 h-1 rounded-full transition-colors ${step > s ? 'bg-[#5b2a86]' : 'bg-[#f0ecf5]'}`}></div>
        {/if}
      {/each}
    </div>

    {#if step === 1}
      <div class="animate-[fadeIn_.25s_ease-out]">
        <h2 class="text-[21px] font-extrabold tracking-tight mb-2">Elige el tipo de recompensa</h2>
        <p class="text-gray-500 text-[15px] mb-6">¿Qué recibirán tus clientes al llegar a su meta?</p>

        <div class="space-y-3">
          {#each rewardOptions as option}
            {@const Icon = option.icon}
            <button
              type="button"
              onclick={() => (selectedReward = option)}
              class={`w-full rounded-[18px] border-2 p-4 flex items-center gap-4 text-left transition-all
                ${selectedReward.type === option.type
                  ? 'border-[#5b2a86] bg-[#faf6ff]'
                  : 'border-gray-100 bg-white'}`}
            >
              <span class={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors
                ${selectedReward.type === option.type ? 'bg-[#5b2a86] text-white' : 'bg-[#f0ecf5] text-[#5b2a86]'}`}>
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span class="flex flex-col text-left">
                <span class="text-[17px] font-bold leading-tight">{option.label}</span>
                <span class="text-[14px] text-gray-500 mt-0.5">Meta: {option.threshold} puntos</span>
              </span>
              {#if selectedReward.type === option.type}
                <CheckCircle2 size={22} strokeWidth={2} class="ml-auto text-[#5b2a86]" />
              {/if}
            </button>
          {/each}
        </div>

        <button
          type="button"
          onclick={() => (step = 2)}
          class="mt-8 w-full rounded-[20px] bg-[#5b2a86] py-5 text-[20px] font-extrabold text-white shadow-md flex items-center justify-center gap-2"
        >
          Siguiente <ChevronRight size={22} strokeWidth={2.5} />
        </button>
      </div>

    {:else if step === 2}
      <div class="animate-[fadeIn_.25s_ease-out]">
        <h2 class="text-[21px] font-extrabold tracking-tight mb-2">Confirma tu programa</h2>
        <p class="text-gray-500 text-[15px] mb-6">Así acumularán y canjearán tus clientes</p>

        <div class="rounded-[20px] bg-[#faf6ff] border border-[#efe5fb] p-5 space-y-4 shadow-[0_4px_18px_rgba(91,42,134,0.05)]">
          <div class="flex justify-between items-center py-3 border-b border-[#ece4f8]">
            <span class="text-[16px] text-gray-500">Regla de puntos</span>
            <span class="text-[18px] font-extrabold">$1 = 1 punto</span>
          </div>
          <div class="flex justify-between items-center py-3 border-b border-[#ece4f8]">
            <span class="text-[16px] text-gray-500">Meta para premio</span>
            <span class="text-[18px] font-extrabold">{selectedReward.threshold} puntos</span>
          </div>
          <div class="flex justify-between items-center py-3">
            <span class="text-[16px] text-gray-500">Premio</span>
            <span class="text-[18px] font-extrabold text-[#5b2a86]">{selectedReward.label}</span>
          </div>
        </div>

        <div class="mt-5 rounded-[16px] bg-[#f0f9f4] border border-[#c3e6d2] p-4 text-[14px] text-[#1a6640]">
          📊 Estimado: con 10 clientes activos podrías ver un <strong>+12% de recurrencia mensual</strong>.
        </div>

        {#if error}
          <p class="mt-3 text-red-500 text-[14px] text-center">{error}</p>
        {/if}

        <div class="mt-6 flex gap-3">
          <button
            type="button"
            onclick={() => (step = 1)}
            class="flex-1 rounded-[20px] border-2 border-[#5b2a86] py-5 text-[18px] font-bold text-[#5b2a86]"
          >
            Atrás
          </button>
          <button
            type="button"
            onclick={activateProgram}
            disabled={loading}
            class="flex-[2] rounded-[20px] bg-[#5b2a86] py-5 text-[20px] font-extrabold text-white shadow-md disabled:opacity-60"
          >
            {loading ? 'Activando...' : 'Activar programa'}
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>

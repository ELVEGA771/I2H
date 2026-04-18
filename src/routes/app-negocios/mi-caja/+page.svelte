<script lang="ts">
  import { ChevronLeft, ChevronDown, CheckCircle2 } from 'lucide-svelte';
  import SegmentTabs from '$lib/components/SegmentTabs.svelte';

  const tabs = [
    { key: 'activa', label: 'Caja activa' },
    { key: 'historial', label: 'Historial' }
  ];

  const filters = [
    { key: 'hoy', label: 'Hoy' },
    { key: 'ayer', label: 'Ayer' },
    { key: 'semana', label: 'Semana' }
  ];

  let activeTab = $state<'activa' | 'historial'>('activa');
  let activeFilter = $state<'hoy' | 'ayer' | 'semana'>('hoy');
</script>

<div class="bg-white min-h-full px-5 pt-10 pb-8">
  <header class="grid grid-cols-[40px_1fr_40px] items-center">
    <button type="button" class="text-black">
      <ChevronLeft size={34} strokeWidth={2.5} />
    </button>

    <div class="flex justify-center">
      <button type="button" class="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-white shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
        <span class="text-[19px] font-bold">Mi caja</span>
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
          <ChevronDown size={18} strokeWidth={2.8} />
        </span>
      </button>
    </div>

    <div></div>
  </header>

  <SegmentTabs tabs={tabs} active={activeTab} onSelect={(key) => (activeTab = key as typeof activeTab)} className="mt-8" />

  {#if activeTab === 'activa'}
    <section class="pt-10 animate-[fadeIn_.25s_ease-out]">
      <div class="rounded-[20px] bg-[#fafafa] border border-gray-100 px-5 py-9 text-center shadow-[0_4px_16px_rgba(17,24,39,0.04)]">
        <p class="text-[20px] text-gray-500">Mi caja</p>
        <p class="text-[42px] font-extrabold tracking-tight leading-none mt-2">$0,00</p>
      </div>

      <p class="text-center text-[20px] font-semibold text-gray-500 mt-7">Total al 18/04/2026, 11:48 am -</p>

      <div class="mt-10 flex items-center justify-between gap-4">
        <h2 class="text-[30px] font-extrabold tracking-tight">Mis ventas</h2>
        <button type="button" class="rounded-full bg-[#efe2fb] px-5 py-3 text-[22px] font-bold text-[#5b2a86] shadow-sm">
          + Agregar venta manual
        </button>
      </div>

      <div class="mt-14 flex flex-col items-center text-center">
        <img src="/logos/billetera.png" alt="Billetera vacía" class="w-[190px] h-auto object-contain" />
        <p class="mt-5 text-[22px] text-gray-500">No hay ventas todavía</p>
      </div>

      <button type="button" class="mt-16 w-full rounded-[20px] bg-[#5b2a86] py-5 text-[24px] font-extrabold text-white shadow-[0_12px_20px_rgba(91,42,134,0.28)] flex items-center justify-center gap-3">
        <CheckCircle2 size={28} strokeWidth={2.4} />
        Cerrar caja
      </button>
    </section>
  {:else}
    <section class="pt-8 animate-[fadeIn_.25s_ease-out]">
      <div class="flex gap-3">
        {#each filters as filter}
          <button
            type="button"
            onclick={() => (activeFilter = filter.key as typeof activeFilter)}
            class={`rounded-full border px-5 py-2.5 text-[21px] font-medium transition ${activeFilter === filter.key ? 'border-[#5b2a86] text-[#5b2a86] shadow-sm' : 'border-gray-300 text-gray-900'}`}
          >
            {filter.label}
          </button>
        {/each}
      </div>

      <div class="mt-8 rounded-[20px] bg-[#fafafa] border border-gray-100 px-5 py-10 text-center shadow-[0_4px_16px_rgba(17,24,39,0.04)]">
        <p class="text-[42px] font-extrabold tracking-tight leading-none">$0,00</p>
      </div>

      <div class="mt-16 flex flex-col items-center text-center">
        <img src="/logos/billetera.png" alt="Billetera vacía" class="w-[190px] h-auto object-contain" />
        <p class="mt-5 text-[22px] text-gray-500">No hay ventas todavía</p>
      </div>
    </section>
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

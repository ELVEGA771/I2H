<script lang="ts">
  import {
    Bell,
    QrCode,
    Headset,
    ChevronRight,
    Eye,
    ArrowDown,
    ArrowUp,
    DollarSign,
    ShieldCheck,
    Delete,
    Store,
  } from 'lucide-svelte';
  import SegmentTabs from '$lib/components/SegmentTabs.svelte';
  import BrandMarkIcon from '$lib/components/BrandMarkIcon.svelte';

  const tabs = [
    { key: 'cobrar', label: 'Cobrar' },
    { key: 'gestionar', label: 'Gestionar' }
  ];

  const quickActions = [
    { label: 'Recargar\nsaldo', icon: ArrowDown },
    { label: 'Transferir\nsaldo', icon: ArrowUp },
    { label: 'Venta\nManual', icon: DollarSign },
    { label: 'Verificar\npago', icon: ShieldCheck }
  ];

  let activeTab = $state<'cobrar' | 'gestionar'>('gestionar');
  let paymentMode = $state<'qr' | 'manual'>('qr');
  let balanceHidden = $state(false);
</script>

<div class="px-5 pt-10 pb-6 text-[#1d1d1f]">
  <header class="flex items-start justify-between gap-4 mb-4">
    <div class="flex items-start gap-3 min-w-0">
      <div class="w-12 h-12 rounded-full bg-[#eadff7] text-[#5b2a86] flex items-center justify-center shrink-0 shadow-sm">
        <Store size={24} strokeWidth={2.3} />
      </div>

      <div class="pt-0.5 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <h1 class="text-[23px] font-extrabold tracking-tight leading-none">Hola! Pablo</h1>
          <span class="inline-flex items-center rounded-md bg-[#efe7f8] px-2 py-0.5 text-[14px] font-bold text-[#5b2a86]">Admin</span>
        </div>
        <p class="text-[17px] text-gray-500 mt-1">Oniriasolutions S.a.s.</p>
      </div>
    </div>

    <div class="flex items-center gap-4 text-black pt-1 shrink-0">
      <button type="button" class="hover:opacity-70 transition"><QrCode size={28} strokeWidth={2.3} /></button>
      <button type="button" class="hover:opacity-70 transition"><Bell size={28} strokeWidth={2.3} /></button>
      <button type="button" class="hover:opacity-70 transition"><Headset size={28} strokeWidth={2.3} /></button>
    </div>
  </header>

  <SegmentTabs tabs={tabs} active={activeTab} onSelect={(key) => (activeTab = key as typeof activeTab)} className="mt-3" />

  {#if activeTab === 'gestionar'}
    <section class="pt-8 animate-[fadeIn_.25s_ease-out]">
      <div class="rounded-[20px] bg-white border border-gray-100 shadow-[0_8px_24px_rgba(17,24,39,0.06)] px-5 py-6 flex items-center justify-between">
        <div>
          <p class="text-[18px] text-gray-500 mb-1">Mi Saldo</p>
          <div class="flex items-end gap-3">
            <h2 class="text-[40px] font-extrabold tracking-tight leading-none">{balanceHidden ? '****' : '$4,00'}</h2>
            <button type="button" class="mb-1 text-black" onclick={() => (balanceHidden = !balanceHidden)}>
              <Eye size={24} strokeWidth={2.2} />
            </button>
          </div>
        </div>
        <button type="button" class="text-black">
          <ChevronRight size={30} strokeWidth={2.5} />
        </button>
      </div>

      <h3 class="text-[22px] font-extrabold tracking-tight mt-10 mb-5">Accesos rápidos</h3>

      <div class="grid grid-cols-4 gap-2">
        {#each quickActions as action}
          {@const Icon = action.icon}
          <button type="button" class="flex flex-col items-center gap-3 text-center">
            <div class="h-16 w-16 rounded-full bg-[#f6f6f7] flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              <Icon size={28} strokeWidth={2.1} class="text-[#1f1f1f]" />
            </div>
            <span class="text-[17px] leading-[1.08] text-gray-600 whitespace-pre-line">{action.label}</span>
          </button>
        {/each}
      </div>

      <h3 class="text-[22px] font-extrabold tracking-tight mt-12 mb-5">Novedades Deuna Negocios</h3>

      <div class="grid grid-cols-2 gap-3">
        <article class="rounded-[18px] bg-[#faf6ff] border border-[#efe5fb] p-4 min-h-[184px] flex flex-col justify-between shadow-[0_4px_18px_rgba(91,42,134,0.05)]">
          <div class="space-y-2">
            <p class="text-[19px] font-semibold leading-tight text-[#3f2b66]">Agrega vendedores a tu equipo</p>
          </div>
          <div class="flex items-end justify-start">
            <div class="h-12 w-12 rounded-2xl bg-white border border-[#ece4f8] shadow-sm flex items-center justify-center text-[#5b2a86]">
              <BrandMarkIcon class="text-[30px]" />
            </div>
          </div>
        </article>

        <article class="rounded-[18px] bg-[#faf6ff] border border-[#efe5fb] p-4 min-h-[184px] flex flex-col justify-between shadow-[0_4px_18px_rgba(91,42,134,0.05)]">
          <div class="space-y-2">
            <p class="text-[19px] font-semibold leading-tight text-[#3f2b66]">Administra tus ventas con tu caja</p>
          </div>
          <div class="flex items-end justify-start">
            <div class="h-12 w-12 rounded-2xl bg-white border border-[#ece4f8] shadow-sm flex items-center justify-center text-[#5b2a86]">
              <BrandMarkIcon class="text-[30px]" />
            </div>
          </div>
        </article>
      </div>
    </section>
  {:else}
    <section class="pt-9 animate-[fadeIn_.25s_ease-out]">
      <p class="text-center text-[22px] text-gray-500 mt-10">Monto</p>
      <p class="text-center text-[72px] font-black tracking-tight leading-none mt-2">$0</p>

      <div class="mt-10 mx-4 rounded-[22px] bg-[#f3f2f6] p-1 grid grid-cols-2 gap-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <button
          type="button"
          onclick={() => (paymentMode = 'qr')}
          class={`rounded-[18px] py-3 text-[20px] font-medium transition ${paymentMode === 'qr' ? 'bg-[#5b2a86] text-white shadow-md' : 'text-[#5b2a86]'}`}
        >
          QR
        </button>
        <button
          type="button"
          onclick={() => (paymentMode = 'manual')}
          class={`rounded-[18px] py-3 text-[20px] font-medium transition ${paymentMode === 'manual' ? 'bg-[#5b2a86] text-white shadow-md' : 'text-[#5b2a86]'}`}
        >
          Manual
        </button>
      </div>

      <button type="button" class="w-full flex items-center justify-between py-6 mt-4 text-left border-b border-gray-200 px-1 text-[23px] text-gray-500">
        <span>Agregar motivo (opcional)</span>
        <ChevronRight size={28} strokeWidth={2.3} class="text-black" />
      </button>

      <div class="mt-5 px-4 grid grid-cols-3 gap-y-10 place-items-center text-[#5b2a86] text-[30px] font-medium">
        {#each ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0'] as key}
          <button type="button" class="h-12 w-12 rounded-full flex items-center justify-center active:bg-[#f2e8fb]">
            {key}
          </button>
        {/each}
        <button type="button" class="h-12 w-12 rounded-full flex items-center justify-center text-[34px]">
          <Delete size={30} strokeWidth={2.6} />
        </button>
      </div>

      <button type="button" class="mt-10 w-full rounded-[20px] bg-[#d9d9dd] py-5 text-[24px] font-extrabold text-[#5e5e5f] shadow-sm">
        Continuar para Cobrar
      </button>
    </section>
  {/if}
</div>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>

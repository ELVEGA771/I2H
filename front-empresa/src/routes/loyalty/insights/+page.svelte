<script lang="ts">
  import { onMount } from 'svelte';
  import { Users, RefreshCw, Gift, TrendingUp, ChevronRight } from 'lucide-svelte';

  const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';
  const MERCHANT_ID = 1;

  type Insights = {
    clients_enrolled: number;
    clients_recurring: number;
    rewards_unlocked: number;
    rewards_redeemed: number;
    estimated_return: string;
    top_clients: { name: string; points_balance: number; total_points_earned: number }[];
  };

  let insights = $state<Insights | null>(null);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await fetch(`${API}/api/merchants/${MERCHANT_ID}/insights`);
      insights = await res.json();
    } catch {
      // fallback to demo data
      insights = {
        clients_enrolled: 3,
        clients_recurring: 2,
        rewards_unlocked: 1,
        rewards_redeemed: 0,
        estimated_return: '+12% recurrencia',
        top_clients: [
          { name: 'Ana García',    points_balance: 8,  total_points_earned: 8  },
          { name: 'Luis Martínez', points_balance: 0,  total_points_earned: 10 },
        ]
      };
    } finally {
      loading = false;
    }
  });

  const statCards = [
    { key: 'clients_enrolled',  label: 'Clientes inscritos',      icon: Users,      color: 'bg-[#eadff7] text-[#5b2a86]' },
    { key: 'clients_recurring', label: 'Clientes recurrentes',    icon: RefreshCw,  color: 'bg-[#dff0ff] text-[#1a6db6]' },
    { key: 'rewards_unlocked',  label: 'Rewards desbloqueados',   icon: Gift,       color: 'bg-[#fff0d4] text-[#a05d00]' },
    { key: 'rewards_redeemed',  label: 'Redenciones',             icon: TrendingUp, color: 'bg-[#d4f0e2] text-[#1a6640]' },
  ] as const;
</script>

<div class="px-5 pt-10 pb-6 text-[#1d1d1f]">
  <header class="mb-7">
    <h1 class="text-[26px] font-extrabold tracking-tight">Insights</h1>
    <p class="text-[15px] text-gray-500 mt-1">Programa de lealtad activo</p>
  </header>

  {#if loading}
    <div class="flex justify-center pt-20">
      <div class="w-8 h-8 rounded-full border-2 border-[#5b2a86] border-t-transparent animate-spin"></div>
    </div>
  {:else if insights}
    <div class="grid grid-cols-2 gap-3 mb-7">
      {#each statCards as card}
        {@const Icon = card.icon}
        <div class="rounded-[18px] bg-white border border-gray-100 shadow-[0_4px_16px_rgba(17,24,39,0.06)] p-4">
          <div class={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 ${card.color}`}>
            <Icon size={20} strokeWidth={2.2} />
          </div>
          <p class="text-[30px] font-extrabold leading-none">
            {insights[card.key]}
          </p>
          <p class="text-[13px] text-gray-500 mt-1 leading-tight">{card.label}</p>
        </div>
      {/each}
    </div>

    <div class="rounded-[18px] bg-[#f0f9f4] border border-[#c3e6d2] px-4 py-3 mb-7 flex items-center gap-3">
      <TrendingUp size={20} strokeWidth={2.2} class="text-[#1a6640] shrink-0" />
      <p class="text-[15px] font-semibold text-[#1a6640]">Retorno estimado: <span class="font-extrabold">{insights.estimated_return}</span></p>
    </div>

    {#if insights.top_clients.length}
      <h2 class="text-[20px] font-extrabold tracking-tight mb-4">Top clientes</h2>
      <div class="space-y-2">
        {#each insights.top_clients as client, i}
          <div class="rounded-[16px] bg-white border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
            <div class="w-9 h-9 rounded-full bg-[#eadff7] text-[#5b2a86] flex items-center justify-center font-bold text-[15px] shrink-0">
              {i + 1}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[16px] font-bold truncate">{client.name}</p>
              <p class="text-[13px] text-gray-500">{client.total_points_earned} pts totales</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[17px] font-extrabold text-[#5b2a86]">{client.points_balance}</p>
              <p class="text-[12px] text-gray-400">pts actuales</p>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="rounded-[18px] bg-[#faf6ff] border border-[#efe5fb] p-8 text-center">
        <p class="text-[17px] text-gray-500">Aún no hay clientes inscritos.</p>
        <p class="text-[14px] text-gray-400 mt-1">Comparte tu programa para empezar.</p>
      </div>
    {/if}

    <a
      href="/loyalty"
      class="mt-8 w-full rounded-[20px] border-2 border-[#5b2a86] py-4 text-[18px] font-bold text-[#5b2a86] flex items-center justify-center gap-2"
    >
      Editar programa <ChevronRight size={20} strokeWidth={2.5} />
    </a>
  {/if}
</div>

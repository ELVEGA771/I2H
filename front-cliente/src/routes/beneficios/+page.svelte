<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronRight, Sparkles, Store, ExternalLink } from 'lucide-svelte';

  const API = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000';

  type Merchant = {
    id: number;
    name: string;
    category: string;
    description: string;
    is_featured: boolean;
    sponsor_level: string;
    loyalty_enabled: boolean;
    reward_threshold: number | null;
    reward_type: string | null;
    reward_value: string | null;
  };

  let activeTab = $state<'rewards' | 'club' | 'promociones'>('rewards');
  let merchants = $state<Merchant[]>([]);
  let loading = $state(true);

  const USER_ID = 1; // Ana García para demo

  onMount(async () => {
    try {
      const res = await fetch(`${API}/api/merchants`);
      const all: Merchant[] = await res.json();
      merchants = all.filter(m => m.loyalty_enabled);
    } catch {
      merchants = [
        { id: 1, name: 'Cafetería Luna',     category: 'Cafetería', description: 'El mejor café del barrio',        is_featured: true,  sponsor_level: 'premium', loyalty_enabled: true, reward_threshold: 10, reward_type: 'discount',        reward_value: '$1 de descuento' },
        { id: 2, name: 'Barber Shop Centro', category: 'Barbería',  description: 'Cortes modernos y clásicos',      is_featured: true,  sponsor_level: 'basic',   loyalty_enabled: true, reward_threshold: 20, reward_type: 'free_product',    reward_value: 'Corte gratis' },
        { id: 3, name: 'Panadería El Sol',   category: 'Panadería', description: 'Pan artesanal horneado cada día', is_featured: false, sponsor_level: 'none',    loyalty_enabled: true, reward_threshold: 15, reward_type: 'percentage_off',  reward_value: '20% de descuento' },
        { id: 5, name: 'Tienda Don Jorge',   category: 'Minimarket',description: 'Todo lo que necesitas cerca',     is_featured: true,  sponsor_level: 'basic',   loyalty_enabled: true, reward_threshold: 30, reward_type: 'discount',        reward_value: '$3 de descuento' },
      ];
    } finally {
      loading = false;
    }
  });

  const categoryColors: Record<string, string> = {
    'Cafetería':  'bg-[#fff3e0] text-[#e65100]',
    'Barbería':   'bg-[#e8f5e9] text-[#2e7d32]',
    'Panadería':  'bg-[#fce4ec] text-[#c62828]',
    'Farmacia':   'bg-[#e3f2fd] text-[#1565c0]',
    'Minimarket': 'bg-[#f3e5f5] text-[#6a1b9a]',
  };

  const categoryEmoji: Record<string, string> = {
    'Cafetería': '☕', 'Barbería': '✂️', 'Panadería': '🥖', 'Farmacia': '💊', 'Minimarket': '🛒'
  };

  type Tab = 'rewards' | 'club' | 'promociones';
  const setTab = (key: string) => { activeTab = key as Tab; };
  const tabClass = (key: string) =>
    activeTab === key ? 'font-bold text-[#1a0a2e]' : 'font-medium text-gray-400';

  const rewardLabel = (type: string | null) => {
    if (type === 'discount') return 'Descuento';
    if (type === 'free_product') return 'Gratis';
    if (type === 'percentage_off') return '% Off';
    return 'Premio';
  };
</script>

<div class="bg-white min-h-screen pb-24">
  <header class="bg-white sticky top-0 z-10 pt-12">
    <div class="flex items-center justify-center pb-5">
      <h1 class="text-xl font-bold text-gray-900">Beneficios</h1>
    </div>
    <div class="flex relative border-b border-gray-200">
      {#each [['rewards','Rewards'], ['club','Club Deuna'], ['promociones','Promociones']] as [key, label]}
        <button
          onclick={() => setTab(key)}
          class="relative flex-1 py-3 text-[15px] text-center transition-colors {tabClass(key)}"
        >
          {label}
          {#if activeTab === key}
            <div class="absolute bottom-0 left-0 right-0 h-0.75 bg-[#4a148c] rounded-t-sm"></div>
          {/if}
        </button>
      {/each}
    </div>
  </header>

  <div class="px-5 pt-5">

    {#if activeTab === 'rewards'}
      <div class="animate-[fadeIn_.25s_ease-out]">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-8 h-8 rounded-xl bg-[#eadff7] flex items-center justify-center text-[#5b2a86]">
            <Sparkles size={17} strokeWidth={2.2} />
          </div>
          <div>
            <h2 class="text-[18px] font-extrabold tracking-tight leading-none">Negocios con Rewards</h2>
            <p class="text-[13px] text-gray-500 mt-0.5">Acumula puntos y gana premios</p>
          </div>
        </div>

        {#if loading}
          <div class="flex justify-center pt-16">
            <div class="w-7 h-7 rounded-full border-2 border-[#5b2a86] border-t-transparent animate-spin"></div>
          </div>
        {:else if merchants.length === 0}
          <div class="text-center pt-16 text-gray-400">
            <Store size={48} strokeWidth={1.5} class="mx-auto mb-3 opacity-40" />
            <p class="text-[16px]">Pronto habrá comercios disponibles</p>
          </div>
        {:else}
          <!-- Featured -->
          {@const featured = merchants.filter(m => m.sponsor_level !== 'none')}
          {#if featured.length}
            <div class="mb-5">
              <span class="text-[12px] font-bold text-[#5b2a86] bg-[#eadff7] px-2 py-1 rounded-full">⭐ Destacados</span>
            </div>
            <div class="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5 no-scrollbar mb-6">
              {#each featured as m}
                <a
                  href="/beneficios/{m.id}"
                  class="snap-center shrink-0 w-47.5 rounded-[20px] border border-gray-100 shadow-sm bg-white overflow-hidden"
                >
                  <div class="h-28 bg-[#eadff7] flex items-center justify-center text-5xl">
                    {categoryEmoji[m.category] ?? '🏪'}
                  </div>
                  <div class="p-3">
                    <p class="text-[15px] font-bold leading-tight truncate">{m.name}</p>
                    <span class={`text-[12px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${categoryColors[m.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {m.category}
                    </span>
                    <div class="mt-2 flex items-center gap-1 text-[13px] text-[#5b2a86] font-semibold">
                      <Sparkles size={13} strokeWidth={2.2} />
                      <span>{rewardLabel(m.reward_type)} a los {m.reward_threshold} pts</span>
                    </div>
                  </div>
                </a>
              {/each}
            </div>
          {/if}

          <!-- All merchants list -->
          <h2 class="text-[17px] font-bold mb-3">Todos los comercios</h2>
          <div class="space-y-2">
            {#each merchants as m}
              <a
                href="/beneficios/{m.id}"
                class="flex items-center gap-4 rounded-[18px] bg-white border border-gray-100 shadow-sm px-4 py-3"
              >
                <div class="w-12 h-12 rounded-2xl bg-[#eadff7] flex items-center justify-center text-2xl shrink-0">
                  {categoryEmoji[m.category] ?? '🏪'}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[16px] font-bold leading-tight truncate">{m.name}</p>
                  <p class="text-[13px] text-gray-500">{m.description}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-[13px] font-semibold text-[#5b2a86]">{rewardLabel(m.reward_type)}</p>
                  <p class="text-[12px] text-gray-400">{m.reward_threshold} pts</p>
                </div>
                <ChevronRight size={18} strokeWidth={2.3} class="text-gray-300 shrink-0" />
              </a>
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'promociones'}
      <div class="animate-[fadeIn_.25s_ease-out] space-y-8">
        <section>
          <h2 class="text-[19px] font-bold text-gray-900 mb-4">Destacadas del mes</h2>
          <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 no-scrollbar">
            <div class="snap-center shrink-0 w-65 bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]">
              <div class="h-36 bg-gray-50 relative p-4 flex items-center justify-center">
                <div class="absolute bottom-2 left-2 w-14 h-14 rounded-full bg-[#b388ff] text-white flex flex-col items-center justify-center shadow-md transform rotate-[-5deg]">
                  <span class="text-[8px] font-medium leading-none mb-0.5">Lo Tienes</span>
                  <span class="text-[11px] font-extrabold italic leading-none">deuna!</span>
                </div>
                <img src="/imagenes/nubia_air.jpg" alt="Celular Nubia Air" class="w-auto h-auto max-w-20.5 max-h-11.5 object-contain" />
              </div>
              <div class="p-4 pt-3">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="bg-[#2ecc71] text-white font-bold px-1.5 py-0.5 rounded text-[15px] leading-none">$208,9</span>
                  <span class="text-gray-500 line-through text-[15px] font-medium leading-none">$258,9</span>
                </div>
                <h3 class="font-semibold text-[16px] text-gray-900 leading-tight">Celular Nubia air 256GB ZTE</h3>
              </div>
            </div>
          </div>
        </section>
        <section>
          <h2 class="text-[19px] font-bold text-gray-900 mb-4">Códigos promocionales</h2>
          <div class="bg-[#faeff3] rounded-[28px] p-5 flex items-center justify-between shadow-sm">
            <div>
              <div class="inline-block bg-[#69f0ae] text-[#004d40] text-[12px] font-extrabold px-3 py-1 rounded-full mb-3">Nuevo</div>
              <h3 class="text-[16px] font-bold text-gray-900">¡Introduce tus códigos aquí!</h3>
              <p class="text-[14px] text-gray-700">Activa tus promociones ahora</p>
            </div>
            <ChevronRight size={24} strokeWidth={3} class="text-gray-900 shrink-0" />
          </div>
        </section>
      </div>

    {:else}
      <div class="animate-[fadeIn_.25s_ease-out]">
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
          <div class="flex items-center gap-4">
            <img src="/logos/Logo_club_bronze.png" alt="Nivel Bronce" class="w-20 h-20 object-contain" />
            <div>
              <h2 class="text-[20px] font-extrabold">Nivel Bronce</h2>
              <p class="text-[14px] text-gray-500 mt-1">Completa pagos para subir de nivel</p>
            </div>
          </div>
        </div>
        <button class="text-[#0056b3] text-[15px] font-medium flex items-center gap-1.5">
          ¿Cómo funciona el Club Deuna?
          <ExternalLink size={16} strokeWidth={2} />
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>

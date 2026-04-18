<script lang="ts">
  import {
    Bell,
    Headset,
    Eye,
    ChevronRight,
    QrCode,
    ArrowUpRight,
    Building2,
    ArrowDownToLine,
    CreditCard,
    Store,
    Smartphone,
    Receipt,
    TramFront,
    Users,
    ShoppingCart
  } from 'lucide-svelte';

  const actions = [
    { label: 'Transferir', icon: ArrowUpRight, bg: 'bg-green-100', color: 'text-green-600' },
    { label: 'Transferir a otro banco', icon: Building2, bg: 'bg-purple-100', color: 'text-purple-600' },
    { label: 'Recargar', icon: ArrowDownToLine, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    { label: 'Cobrar', icon: CreditCard, bg: 'bg-blue-100', color: 'text-blue-600' },
    { label: 'Retirar', icon: Store, bg: 'bg-purple-900', color: 'text-white' },
    { label: 'Recarga celular', icon: Smartphone, bg: 'bg-pink-100', color: 'text-pink-600' },
    { label: 'Pagar servicios', icon: Receipt, bg: 'bg-teal-100', color: 'text-teal-600' },
    { label: 'Metro de Quito', icon: TramFront, bg: 'bg-purple-100', color: 'text-purple-700' },
    { label: 'Deuna Jóvenes', icon: Users, bg: 'bg-blue-50', color: 'text-blue-500' },
    { label: 'Tienda Deuna', icon: ShoppingCart, bg: 'bg-orange-100', color: 'text-orange-500' }
  ];

  let balanceHidden = $state(false);
</script>

<div class="px-5 pt-12 pb-24">
  <!-- Header -->
  <header class="flex justify-between items-center mb-6">
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-orange-100 text-purple-900 font-bold flex items-center justify-center border-2 border-orange-300">
        AV
      </div>
      <h1 class="text-xl font-bold text-gray-900 flex items-center gap-1">
        Hola Andres <span class="text-xl">👋</span>
      </h1>
    </div>
    <div class="flex items-center gap-4">
      <button class="text-gray-800 hover:text-gray-600 transition">
        <Bell size={24} strokeWidth={2} />
      </button>
      <button class="text-gray-800 hover:text-gray-600 transition">
        <Headset size={24} strokeWidth={2} />
      </button>
    </div>
  </header>

  <!-- Balance Card -->
  <div class="bg-white rounded-2xl p-5 mb-8 shadow-sm border border-gray-100 flex justify-between items-center">
    <div>
      <p class="text-sm text-gray-600 font-medium mb-1">Saldo disponible</p>
      <div class="flex items-center gap-3">
        <h2 class="text-4xl font-extrabold text-gray-900 tracking-tight">
          {balanceHidden ? '****' : '$0,00'}
        </h2>
        <button onclick={() => balanceHidden = !balanceHidden} class="text-gray-700 hover:text-gray-500 transition mt-1">
          <Eye size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
    <button class="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-full transition">
      <ChevronRight size={24} strokeWidth={2.5} class="text-gray-900" />
    </button>
  </div>

  <!-- Actions Grid -->
  <div class="grid grid-cols-4 gap-y-6 gap-x-2 mb-8">
    {#each actions as action}
      {@const Icon = action.icon}
      <button class="flex flex-col items-center gap-2 group">
        <div class="w-[72px] h-[72px] bg-white rounded-2xl shadow-sm border border-gray-50 flex items-center justify-center {action.bg} transition-transform group-hover:scale-105 group-active:scale-95">
          <Icon size={32} class={action.color} strokeWidth={1.5} />
        </div>
        <span class="text-xs text-center font-medium text-gray-700 leading-tight w-full break-words px-1">
          {action.label}
        </span>
      </button>
    {/each}
  </div>

  <!-- Promos Section -->
  <div class="mb-6">
    <h3 class="text-xl font-bold text-gray-900 mb-4">Mis promociones</h3>
    <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 no-scrollbar">
      <!-- Promo Card 1 -->
      <div class="snap-center shrink-0 w-64 h-32 rounded-2xl bg-gradient-to-r from-purple-800 to-indigo-900 flex items-center p-4 relative overflow-hidden shadow-sm">
        <div class="z-10 text-white">
          <div class="text-4xl font-extrabold mb-0 leading-none">3</div>
          <div class="text-sm font-bold leading-tight">pagos y<br/>gana</div>
        </div>
        <div class="absolute right-0 bottom-0 top-0 w-1/2 bg-white/20 blur-xl transform translate-x-1/4"></div>
      </div>
      
      <!-- Promo Card 2 -->
      <div class="snap-center shrink-0 w-64 h-32 rounded-2xl bg-gradient-to-r from-teal-400 to-emerald-400 p-4 relative overflow-hidden shadow-sm">
        <div class="text-teal-900 font-bold text-sm mb-1">Infinix</div>
        <div class="text-white text-xl font-extrabold italic">deuna!</div>
        <div class="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
      </div>
      
      <!-- Promo Card 3 -->
      <div class="snap-center shrink-0 w-64 h-32 rounded-2xl bg-gradient-to-r from-pink-200 to-purple-200 p-4 relative overflow-hidden shadow-sm">
        <div class="text-purple-900 font-bold text-lg">Gana<br/>entradas</div>
        <div class="absolute right-[-20px] bottom-[-20px] w-32 h-32 bg-white/50 rounded-full blur-xl"></div>
      </div>
    </div>
  </div>
</div>

<!-- Sticky QR Scanner Button -->
<div class="fixed bottom-[72px] left-0 right-0 max-w-md mx-auto px-5 pointer-events-none z-10">
  <button class="w-full bg-[#4a148c] hover:bg-[#3a0f6c] active:bg-[#2d0b54] text-white rounded-xl py-4 flex items-center justify-center gap-3 shadow-lg font-bold text-lg transition-colors pointer-events-auto mb-2">
    <QrCode size={24} strokeWidth={2.5} />
    Escanear QR
  </button>
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
</style>
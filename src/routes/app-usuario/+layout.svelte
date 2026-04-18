<script lang="ts">
  import { Home, Gift, Wallet, User } from 'lucide-svelte';
  import { page } from '$app/stores';
  let { children } = $props();

  // Función para determinar si la ruta actual coincide (para cambiar el color del icono)
  let isActive = $derived((path: string) => $page.url.pathname === path || $page.url.pathname === path + '/');
</script>

<div class="max-w-md mx-auto h-[100dvh] w-full bg-gray-50 flex flex-col relative shadow-xl overflow-hidden font-sans">
  <div class="flex-1 overflow-y-auto pb-32">
    {@render children()}
  </div>

  <!-- Bottom Navigation -->
  <div class="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center pb-safe z-50">
    <a href="/app-usuario" class="flex flex-col items-center gap-1 min-w-[64px] transition-colors {isActive('/app-usuario') ? 'text-purple-900' : 'text-gray-400'}">
      <Home size={24} strokeWidth={isActive('/app-usuario') ? 2.5 : 2} class={isActive('/app-usuario') ? 'fill-purple-900' : ''} />
      <span class="text-xs font-semibold">Inicio</span>
    </a>
    
    <a href="/app-usuario/beneficios" class="flex flex-col items-center gap-1 relative min-w-[64px] transition-colors {isActive('/app-usuario/beneficios') ? 'text-purple-900' : 'text-gray-400'}">
      <div class="absolute -top-3 px-1.5 py-0.5 bg-teal-300 text-teal-900 text-[10px] font-bold rounded-md">Nuevo</div>
      <Gift size={24} strokeWidth={isActive('/app-usuario/beneficios') ? 2.5 : 2} class={isActive('/app-usuario/beneficios') ? 'fill-purple-900' : ''} />
      <span class="text-xs font-medium">Beneficios</span>
    </a>

    <a href="/app-usuario/billetera" class="flex flex-col items-center gap-1 relative min-w-[64px] transition-colors {isActive('/app-usuario/billetera') ? 'text-purple-900' : 'text-gray-400'}">
      <div class="absolute -top-3 px-1.5 py-0.5 bg-teal-300 text-teal-900 text-[10px] font-bold rounded-md">Nuevo</div>
      <Wallet size={24} strokeWidth={isActive('/app-usuario/billetera') ? 2.5 : 2} class={isActive('/app-usuario/billetera') ? 'fill-purple-900' : ''} />
      <span class="text-xs font-medium">Billetera</span>
    </a>

    <a href="/app-usuario/tu" class="flex flex-col items-center gap-1 min-w-[64px] transition-colors {isActive('/app-usuario/tu') ? 'text-purple-900' : 'text-gray-400'}">
      <User size={24} strokeWidth={isActive('/app-usuario/tu') ? 2.5 : 2} class={isActive('/app-usuario/tu') ? 'fill-purple-900' : ''} />
      <span class="text-xs font-medium">Tú</span>
    </a>
  </div>
</div>

<style>
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
</style>
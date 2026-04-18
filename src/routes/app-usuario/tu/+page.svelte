<script lang="ts">
  import {
    Store,
    Gift,
    FileText,
    Users,
    FileSignature,
    ChevronLeft
  } from 'lucide-svelte';

  const menuItems = [
    { label: 'Mi negocio', icon: Store },
    { label: 'Beneficios', icon: Gift },
    { label: 'Certificado bancario', icon: FileText },
    { label: 'Ayuda', icon: Users },
    { label: 'Términos y condiciones', icon: FileSignature }
  ];
</script>

<div class="bg-gray-50 min-h-screen pb-24">
  <!-- Profile Header (Purple Background) -->
  <div class="bg-[#4a148c] pb-8 pt-4 px-5 relative rounded-b-[40px] shadow-lg">
    <header class="flex items-center justify-start mb-6">
      <button class="text-white w-10 h-10 flex items-center justify-start hover:text-gray-200 transition">
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>
    </header>

    <div class="flex flex-col items-center text-center -mt-2">
      <!-- Avatar with Badge -->
      <div class="relative inline-block mb-3">
        <div class="w-[84px] h-[84px] rounded-full bg-orange-100 text-[#4a148c] font-bold text-xl flex items-center justify-center border-[4px] border-orange-300 shadow-md">
          AV
        </div>
        <!-- Hexagon Badge -->
        <div class="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-md transform rotate-45 flex items-center justify-center border-2 border-[#4a148c] shadow-sm z-10">
          <div class="transform -rotate-45 text-white font-extrabold text-[15px] leading-none drop-shadow-md">
            d!
          </div>
        </div>
      </div>

      <h1 class="text-2xl font-bold text-white mb-1 tracking-tight">Andres Vega</h1>
      <p class="text-sm text-purple-200 font-medium mb-1">
        Última sesión: 18 abr. 2026 | 10:08
      </p>
      <p class="text-sm text-purple-200 font-medium">
        Versión 5.2.65.1345
      </p>
    </div>
  </div>

  <!-- Menu List -->
  <div class="px-5 -mt-6 relative z-10">
    <div class="bg-white rounded-[32px] shadow-sm border border-gray-100/50 p-2 pb-6">
      <div class="flex flex-col px-4 pt-2">
        {#each menuItems as item, index}
          <button class="flex items-center gap-4 py-[22px] group w-full text-left {index !== menuItems.length - 1 ? 'border-b border-gray-100/80' : ''}">
            <svelte:component this={item.icon} size={26} strokeWidth={1.75} class="text-gray-800" />
            <span class="text-[17px] font-medium text-gray-800 flex-1">{item.label}</span>
          </button>
        {/each}
      </div>
      
      <div class="mt-8 flex justify-center pb-4">
        <button class="text-[#4a148c] font-bold text-lg border-b-[2px] border-[#4a148c] pb-0.5 hover:text-purple-800 hover:border-purple-800 transition">
          Cerrar sesión
        </button>
      </div>
    </div>
  </div>
</div>
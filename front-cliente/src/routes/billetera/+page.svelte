<script lang="ts">
  import { ChevronLeft, Eye, ExternalLink } from 'lucide-svelte';
</script>

<div class="bg-white min-h-full pb-24">
  <header class="flex items-center justify-between px-5 py-4 border-b border-gray-50 sticky top-0 bg-white z-10">
    <button class="text-gray-900 w-10 h-10 flex items-center justify-start">
      <ChevronLeft size={28} strokeWidth={2.5} />
    </button>
    <h1 class="text-xl font-bold text-gray-900 absolute left-1/2 transform -translate-x-1/2">Billetera</h1>
    <button class="text-gray-900 w-10 h-10 flex items-center justify-end">
      <Eye size={24} strokeWidth={2.5} />
    </button>
  </header>

  <div class="px-5 pt-6">
    <h2 class="text-xl font-extrabold text-gray-900 mb-6">Cuentas</h2>

    <div class="flex items-start gap-4 mb-6">
      <div class="w-12 h-12 rounded-full bg-[#4a148c] text-[#00e676] font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
        d!
      </div>
      <div class="flex-1">
        <h3 class="text-[17px] font-bold text-gray-900 leading-tight">Deuna ******5317</h3>
        <p class="text-[17px] text-gray-600 mt-0.5">$0,00</p>
      </div>
    </div>

    <button class="flex items-center gap-2 text-[#0056b3] font-medium hover:text-blue-800 transition mb-12">
      No veo todas mis cuentas
      <ExternalLink size={20} strokeWidth={2} />
    </button>

    <h2 class="text-xl font-extrabold text-gray-900 mb-6">Cuentas de mis hijos/as</h2>

    <div class="bg-white rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] p-6 relative overflow-hidden flex flex-col min-h-[160px] justify-between">
      <div class="w-[65%] z-10 relative">
        <h3 class="text-lg font-bold text-gray-900 leading-snug mb-2">Crea una cuenta nueva para un menor de edad</h3>
        <p class="text-[15px] text-gray-700 leading-snug mb-4">Si tienes hijos entre 12 y 17 años ya pueden usar Deuna</p>
        <button class="text-[#4a148c] font-bold text-base hover:text-purple-800 transition flex items-center gap-1">
          Crear ahora ›
        </button>
      </div>
      <div class="absolute -right-4 -bottom-4 w-40 h-40">
        <div class="w-full h-full bg-gradient-to-tr from-purple-400 to-indigo-300 rounded-tl-[100px] opacity-90 flex items-end justify-center pr-4 pb-4">
          <div class="w-20 h-20 bg-purple-200 rounded-full mb-4 mr-2"></div>
        </div>
      </div>
    </div>
  </div>
</div>

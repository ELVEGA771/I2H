<script lang="ts">
  import { ChevronRight, HelpCircle, ExternalLink, Ticket, Tag } from 'lucide-svelte';

  let activeTab = $state('promociones'); // 'club' | 'promociones'
</script>

<div class="bg-white min-h-screen pb-24">
  <!-- Header & Tabs -->
  <header class="bg-white sticky top-0 z-10 pt-12">
    <div class="flex items-center justify-center pb-6">
      <h1 class="text-xl font-bold text-gray-900">Beneficios</h1>
    </div>

    <div class="flex relative border-b border-gray-200">
      <button
        onclick={() => activeTab = 'club'}
        class="relative flex-1 py-4 text-[17px] text-center transition-colors {activeTab === 'club' ? 'font-bold text-[#1a0a2e]' : 'font-medium text-gray-400'}"
      >
        Club Deuna
        {#if activeTab === 'club'}
          <div class="absolute bottom-0 left-0 right-0 h-[4px] bg-[#4a148c] rounded-t-sm"></div>
        {/if}
      </button>
      <button
        onclick={() => activeTab = 'promociones'}
        class="relative flex-1 py-4 text-[17px] text-center transition-colors {activeTab === 'promociones' ? 'font-bold text-[#1a0a2e]' : 'font-medium text-gray-400'}"
      >
        Promociones
        {#if activeTab === 'promociones'}
          <div class="absolute bottom-0 left-0 right-0 h-[4px] bg-[#4a148c] rounded-t-sm"></div>
        {/if}
      </button>
    </div>
  </header>

  <div class="px-5 pt-6 space-y-8">

    {#if activeTab === 'promociones'}
      <section>
        <h2 class="text-[19px] font-bold text-gray-900 mb-4">Destacadas del mes</h2>

        <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-5 px-5 no-scrollbar">
          <div class="snap-center shrink-0 w-[260px] bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]">
            <div class="h-36 bg-gray-50 relative p-4 flex items-center justify-center">
              <div class="w-[96px] h-[58px] bg-white rounded-2xl shadow-sm overflow-hidden flex items-center justify-center">
                <img src="/imagenes/nubia_air.jpg" alt="Celular Nubia Air" class="w-auto h-auto max-w-[82px] max-h-[46px] object-contain" />
              </div>
              <div class="absolute bottom-2 left-2 w-14 h-14 rounded-full bg-[#b388ff] text-white flex flex-col items-center justify-center shadow-md transform rotate-[-5deg]">
                <span class="text-[8px] font-medium leading-none mb-0.5">Lo Tienes</span>
                <span class="text-[11px] font-extrabold italic leading-none">deuna!</span>
              </div>
            </div>
            <div class="p-4 pt-3">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="bg-[#2ecc71] text-white font-bold px-1.5 py-0.5 rounded text-[15px] leading-none">$208,9</span>
                <span class="text-gray-500 line-through text-[15px] font-medium leading-none">$258,9</span>
              </div>
              <h3 class="font-semibold text-[16px] text-gray-900 leading-tight mb-1">Celular Nubia air 256GB ZTE</h3>
              <p class="text-gray-500 text-[14px]">Recibe $50 de descuento</p>
            </div>
          </div>

          <div class="snap-center shrink-0 w-[260px] bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.1)]">
            <div class="h-36 bg-gray-50 relative p-4 flex items-center justify-center">
              <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=400&auto=format&fit=crop" alt="Parlante" class="w-full h-full object-cover rounded-lg" />
              <div class="absolute bottom-2 left-2 w-14 h-14 rounded-full bg-[#b388ff] text-white flex flex-col items-center justify-center shadow-md transform rotate-[-5deg]">
                <span class="text-[8px] font-medium leading-none mb-0.5">Lo Tienes</span>
                <span class="text-[11px] font-extrabold italic leading-none">deuna!</span>
              </div>
            </div>
            <div class="p-4 pt-3">
              <div class="flex items-center gap-2 mb-1.5">
                <span class="bg-[#2ecc71] text-white font-bold px-1.5 py-0.5 rounded text-[15px] leading-none">$228,9</span>
                <span class="text-gray-500 line-through text-[15px] font-medium leading-none">$278,9</span>
              </div>
              <h3 class="font-semibold text-[16px] text-gray-900 leading-tight mb-1">One body LG</h3>
              <p class="text-gray-500 text-[14px]">Recibe $50 de descue...</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-[19px] font-bold text-gray-900 mb-4">Códigos promocionales</h2>
        <div class="bg-[#faeff3] rounded-[28px] p-5 flex items-center justify-between relative overflow-hidden shadow-sm">
          <div class="z-10 w-[70%]">
            <div class="inline-block bg-[#69f0ae] text-[#004d40] text-[12px] font-extrabold px-3 py-1 rounded-full mb-3 shadow-sm">Nuevo</div>
            <h3 class="text-[16px] font-bold text-gray-900 leading-snug mb-1">¡Introduce tus códigos aquí!</h3>
            <p class="text-[14px] text-gray-700">Activa tus promociones ahora</p>
          </div>
          <div class="z-10 flex items-center justify-end w-[30%] gap-3 shrink-0">
            <div class="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center shrink-0">
              <img src="/logos/logo_descuento.png?v=2" alt="Cupón" class="w-10 h-10 object-contain" />
            </div>
            <ChevronRight size={24} strokeWidth={3} class="text-gray-900 shrink-0" />
          </div>
        </div>
      </section>

      <section>
        <h2 class="text-[19px] font-bold text-gray-900 mb-4">Otros</h2>
        <div class="space-y-4">
          <div class="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] flex p-2.5 gap-4 items-center">
            <div class="w-[130px] h-[110px] rounded-[16px] bg-gradient-to-br from-[#311b92] to-[#4a148c] relative overflow-hidden shrink-0 flex items-center p-3 shadow-inner">
              <div class="z-10 flex flex-col justify-center">
                <span class="text-white font-black text-[32px] leading-[0.8] tracking-tighter drop-shadow-md">3</span>
                <span class="text-white font-bold text-[11px] leading-tight mt-1">pagos y</span>
                <span class="text-[#69f0ae] font-black text-[15px] leading-tight">gana</span>
              </div>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop" class="absolute right-[-10px] bottom-0 w-[80px] h-[100px] object-cover object-top mask-image-bottom opacity-90 drop-shadow-lg" alt="Persona" />
            </div>
            <div class="flex-1 flex flex-col justify-center pr-2 py-1">
              <div class="inline-block bg-[#388e3c] text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1.5 self-start">Sorteo</div>
              <h3 class="font-bold text-[16px] text-gray-900 leading-tight mb-1 line-clamp-1">Gana en grande</h3>
              <p class="text-[14px] text-gray-500 leading-snug line-clamp-2">Haz 3 pagos en comercios aliados y participa por un iP...</p>
            </div>
          </div>

          <div class="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] flex p-2.5 gap-4 items-center">
            <div class="w-[130px] h-[110px] rounded-[16px] bg-[#00e5ff] relative overflow-hidden shrink-0 flex flex-col justify-between p-2 shadow-inner">
              <div class="flex justify-between w-full px-1 pt-1 z-10">
                <span class="text-[#004d40] font-bold text-[9px]">Infinix</span>
                <span class="text-[#004d40] font-black text-[9px] italic">deuna!</span>
              </div>
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-16 h-16 bg-gray-300 rounded-lg transform rotate-[-15deg] shadow-lg border-2 border-gray-400 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=100&auto=format&fit=crop" class="w-full h-full object-cover" alt="Phone" />
                </div>
              </div>
              <div class="z-10 text-center w-full pb-1">
                <span class="text-white font-black text-[13px] tracking-wide drop-shadow-md">GIVEAWAY</span>
              </div>
            </div>
            <div class="flex-1 flex flex-col justify-center pr-2 py-1">
              <div class="inline-block bg-[#388e3c] text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1.5 self-start">Sorteo</div>
              <h3 class="font-bold text-[16px] text-gray-900 leading-tight mb-1 line-clamp-1">Infinix</h3>
              <p class="text-[14px] text-gray-500 leading-snug line-clamp-2">¡El próximo Infinix Note 60 Pro puede ser tuyo! Entra a...</p>
            </div>
          </div>

          <div class="bg-white rounded-[20px] overflow-hidden border border-gray-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] flex p-2.5 gap-4 items-center">
            <div class="w-[130px] h-[110px] rounded-[16px] bg-[#d1c4e9] relative overflow-hidden shrink-0 flex items-center shadow-inner">
              <img src="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=100&auto=format&fit=crop" class="absolute bottom-0 left-[-5px] w-[70px] h-[90px] object-cover drop-shadow-lg" alt="Niño" />
              <div class="relative z-10 ml-14 flex flex-col justify-center mt-2">
                <span class="text-[#311b92] font-black text-[14px] leading-none mb-1 drop-shadow-sm">Gana $10</span>
                <span class="text-[#311b92] font-bold text-[8px] leading-[1] drop-shadow-sm">en este regreso</span>
                <span class="text-[#311b92] font-black text-[12px] leading-tight drop-shadow-sm">a clases</span>
              </div>
            </div>
            <div class="flex-1 flex flex-col justify-center pr-2 py-1">
              <div class="inline-block bg-[#388e3c] text-white text-[11px] font-bold px-2 py-0.5 rounded mb-1.5 self-start">Regreso a clases</div>
              <h3 class="font-bold text-[16px] text-gray-900 leading-tight mb-1 line-clamp-1">$10 de Reembolso</h3>
              <p class="text-[14px] text-gray-500 leading-snug line-clamp-2">Por compras superiores a $65 en comercios aliados</p>
            </div>
          </div>
        </div>
      </section>

    {:else}
      <div class="animate-in fade-in duration-300">
        <div class="bg-white rounded-[24px] border border-gray-100 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.08)] p-6 mb-8 relative">
          <div class="absolute top-5 right-5">
            <HelpCircle size={24} class="text-gray-900" strokeWidth={2.5} />
          </div>
          <div class="flex items-center gap-5 mb-8 pr-6 mt-1">
            <div class="shrink-0 flex items-center justify-center w-24 h-24">
              <img src="/logos/Logo_club_bronze.png" alt="Nivel Bronce" class="object-contain drop-shadow-md" style="width: 88px; height: 88px;" />
            </div>
            <div class="pt-1">
              <h2 class="text-[22px] font-extrabold text-gray-900 mb-1.5">Nivel Bronce</h2>
              <p class="text-[15px] text-gray-600 leading-snug">Completa los pagos necesarios y sube tu nivel. Se actualizará a inicios del próximo mes.</p>
            </div>
          </div>
          <div class="mt-4">
            <p class="text-[14px] text-gray-600 font-medium mb-2">Este mes completaste <span class="text-[#4a148c] font-bold">0 pagos</span></p>
            <div class="w-full h-2.5 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div class="h-full bg-[#4a148c] rounded-full" style="width: 5%"></div>
            </div>
            <div class="flex justify-between items-center px-1 mt-5">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 flex items-center justify-center mb-1.5">
                  <img src="/logos/Logo_club_bronze.png" alt="Bronce" class="object-contain drop-shadow-sm" style="width: 20px; height: 20px;" />
                </div>
                <span class="text-[12px] text-gray-500 font-medium">0</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 flex items-center justify-center mb-1.5">
                  <img src="/logos/Logo_club_metal.png" alt="Metal" class="object-contain opacity-70 drop-shadow-sm" style="width: 20px; height: 20px;" />
                </div>
                <span class="text-[12px] text-gray-500 font-medium">5</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 flex items-center justify-center mb-1.5">
                  <img src="/logos/Logo_club_oro.png" alt="Oro" class="object-contain drop-shadow-sm" style="width: 20px; height: 20px;" />
                </div>
                <span class="text-[12px] text-gray-500 font-medium">11</span>
              </div>
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 flex items-center justify-center mb-1.5">
                  <img src="/logos/Logo_club_morado.png" alt="Morado" class="object-contain drop-shadow-sm" style="width: 20px; height: 20px;" />
                </div>
                <span class="text-[12px] text-gray-500 font-medium">20+</span>
              </div>
            </div>
          </div>
        </div>

        <button class="text-[#0056b3] text-[15px] font-medium flex items-center gap-1.5 hover:underline mb-8">
          ¿Cómo funciona el Club Deuna?
          <ExternalLink size={16} strokeWidth={2} />
        </button>

        <div class="mt-8">
          <h3 class="text-[20px] font-extrabold text-gray-900 mb-6">Mis beneficios de Nivel Bronce</h3>
          <div class="space-y-2">
            <div class="flex items-center gap-5 py-5 border-b border-gray-100">
              <div class="w-16 h-16 flex items-center justify-center shrink-0 drop-shadow-sm">
                <img src="/logos/ruleta.png" alt="Gira y Gana" class="object-contain" style="width: 48px; height: 48px;" />
              </div>
              <div class="flex-1">
                <h4 class="text-[17px] font-bold text-gray-900 mb-1">Hasta 1 giro de Gira y Gana</h4>
                <p class="text-[15px] text-gray-500 leading-snug">Te faltan <span class="text-[#4a148c] font-medium">5 pagos</span> para tu próxima chance de ganar</p>
              </div>
              <ChevronRight size={24} class="text-gray-400 shrink-0" strokeWidth={2.5} />
            </div>
            <div class="flex items-center gap-5 py-5 border-b border-gray-100">
              <div class="w-16 h-16 flex items-center justify-center shrink-0 drop-shadow-sm">
                <img src="/logos/descuento.png" alt="Combos y promociones" class="object-contain" style="width: 48px; height: 48px;" />
              </div>
              <div class="flex-1">
                <h4 class="text-[17px] font-bold text-gray-900 mb-1">Combos y promociones</h4>
                <p class="text-[15px] text-gray-500 leading-snug">Recibe descuentos, combos y promos únicas en tus negocios favoritos</p>
              </div>
              <ChevronRight size={24} class="text-gray-400 shrink-0" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    {/if}

  </div>
</div>

<style>
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>

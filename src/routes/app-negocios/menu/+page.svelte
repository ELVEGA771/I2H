<script lang="ts">
  import { ChevronLeft, Store, Users, DollarSign, Lock, Headset, PlaySquare, CircleHelp, FileText } from 'lucide-svelte';
  import BusinessMenuItem from '$lib/components/BusinessMenuItem.svelte';
  import BrandMarkIcon from '$lib/components/BrandMarkIcon.svelte';

  const sections = [
    {
      title: 'Mi Negocio',
      items: [
        { label: 'Perfil de negocio', icon: Store },
        { label: 'Equipo y Roles', icon: Users }
      ]
    },
    {
      title: 'Configuraciones',
      items: [
        { label: 'Límites de cuenta', icon: DollarSign },
        { label: 'Clave de seguridad', icon: Lock }
      ]
    },
    {
      title: 'Soporte y Ayuda',
      items: [
        { label: 'Soporte', icon: Headset },
        { label: 'Solicita material publicitario', icon: BrandMarkIcon, iconClass: 'text-[30px] text-black' },
        { label: 'Tutoriales', icon: PlaySquare },
        { label: 'Preguntas Frecuentes', icon: CircleHelp },
        { label: 'Términos y condiciones', icon: FileText }
      ]
    }
  ];
</script>

<div class="bg-white min-h-full px-5 pt-10 pb-12">
  <header class="grid grid-cols-[40px_1fr_40px] items-center">
    <button type="button" class="text-black">
      <ChevronLeft size={34} strokeWidth={2.5} />
    </button>

    <h1 class="text-center text-[24px] font-extrabold tracking-tight">Más opciones</h1>

    <div></div>
  </header>

  <div class="mt-8 flex items-center gap-4">
    <div class="h-14 w-14 rounded-full bg-[#eadff7] text-[#5b2a86] flex items-center justify-center shrink-0">
      <Store size={28} strokeWidth={2.3} />
    </div>

    <div class="min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <p class="text-[22px] font-extrabold tracking-tight">Pablo Daniel</p>
        <span class="rounded-md bg-[#efe7f8] px-2 py-0.5 text-[16px] font-bold text-[#5b2a86]">Administrador</span>
      </div>
      <p class="text-[19px] text-gray-500 mt-1">Oniriasolutions S.a.s.</p>
    </div>
  </div>

  <div class="mt-12 space-y-11">
    {#each sections as section}
      <section>
        <h2 class="text-[22px] font-extrabold tracking-tight mb-7">{section.title}</h2>
        <div>
          {#each section.items as item, index}
            <BusinessMenuItem label={item.label} icon={item.icon} iconClass={item.iconClass ?? 'text-black'} border={index !== section.items.length - 1} />
          {/each}
        </div>
      </section>
    {/each}
  </div>

  <div class="mt-12 text-center">
    <button type="button" class="text-[24px] font-extrabold text-[#5b2a86] underline underline-offset-4 decoration-2 decoration-[#5b2a86]">
      Cerrar sesión
    </button>

    <p class="mt-8 text-[16px] text-gray-400 leading-snug">
      Última sesión: 18 Apr 2026 | 02:05 pm
      <br />
      versión 1.0.93.193
    </p>
  </div>
</div>

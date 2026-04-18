<script lang="ts">
  import { Home, Menu } from 'lucide-svelte';
  import AppFrame from '$lib/components/AppFrame.svelte';
  import CashRegisterIcon from '$lib/components/icons/CashRegisterIcon.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/app-negocios', label: 'Inicio', icon: Home },
    { href: '/app-negocios/mi-caja', label: 'Mi Caja', icon: CashRegisterIcon },
    { href: '/app-negocios/menu', label: 'Menú', icon: Menu }
  ];
</script>

<AppFrame shellClass="bg-white" {navItems}>
  {@render children()}
</AppFrame>

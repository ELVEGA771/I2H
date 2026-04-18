<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { Home, Menu, Sparkles } from 'lucide-svelte';
  import AppFrame from '$lib/components/AppFrame.svelte';
  import CashRegisterIcon from '$lib/components/icons/CashRegisterIcon.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/mi-caja', label: 'Mi Caja', icon: CashRegisterIcon },
    { href: '/loyalty', label: 'Rewards', icon: Sparkles },
    { href: '/menu', label: 'Menú', icon: Menu }
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<AppFrame shellClass="bg-white" {navItems}>
  {@render children()}
</AppFrame>

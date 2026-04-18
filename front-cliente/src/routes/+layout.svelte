<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { Home, Gift, Wallet, User } from 'lucide-svelte';
  import AppFrame from '$lib/components/AppFrame.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/', label: 'Inicio', icon: Home, fillOnActive: true },
    { href: '/beneficios', label: 'Beneficios', icon: Gift, badge: 'Nuevo' },
    { href: '/billetera', label: 'Billetera', icon: Wallet, badge: 'Nuevo' },
    { href: '/tu', label: 'Tú', icon: User }
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<AppFrame shellClass="bg-gray-50" {navItems}>
  {@render children()}
</AppFrame>

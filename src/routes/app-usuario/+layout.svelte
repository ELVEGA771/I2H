<script lang="ts">
  import { Home, Gift, Wallet, User } from 'lucide-svelte';
  import AppFrame from '$lib/components/AppFrame.svelte';

  let { children } = $props();

  const navItems = [
    { href: '/app-usuario', label: 'Inicio', icon: Home, fillOnActive: true },
    { href: '/app-usuario/beneficios', label: 'Beneficios', icon: Gift, badge: 'Nuevo' },
    { href: '/app-usuario/billetera', label: 'Billetera', icon: Wallet, badge: 'Nuevo' },
    { href: '/app-usuario/tu', label: 'Tú', icon: User }
  ];
</script>

<AppFrame shellClass="bg-gray-50" {navItems}>
  {@render children()}
</AppFrame>

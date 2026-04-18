<script lang="ts">
  import BottomNav from './BottomNav.svelte';

  type NavItem = {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    badgeClass?: string;
    fillOnActive?: boolean;
  };

  let {
    children,
    navItems = [],
    shellClass = 'bg-gray-50',
    contentClass = '',
    navClass = '',
    showBottomNav = true
  } = $props<{
    children: any;
    navItems?: NavItem[];
    shellClass?: string;
    contentClass?: string;
    navClass?: string;
    showBottomNav?: boolean;
  }>();
</script>

<div class={`max-w-md mx-auto h-[100dvh] w-full ${shellClass} flex flex-col relative shadow-xl overflow-hidden font-sans`}>
  <div class={`flex-1 overflow-y-auto ${showBottomNav ? 'pb-32' : ''} ${contentClass}`}>
    {@render children()}
  </div>

  {#if showBottomNav}
    <BottomNav items={navItems} className={navClass} />
  {/if}
</div>

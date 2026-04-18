<script lang="ts">
  import { page } from '$app/stores';

  type NavItem = {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    badgeClass?: string;
    fillOnActive?: boolean;
  };

  let { items = [], className = '' } = $props<{ items?: NavItem[]; className?: string }>();

  const isActive = (href: string) => $page.url.pathname === href || $page.url.pathname === `${href}/`;
</script>

<div class={`absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex justify-between items-center pb-safe z-50 ${className}`}>
  {#each items as item}
    {@const active = isActive(item.href)}
    {@const Icon = item.icon}
    <a
      href={item.href}
      class={`flex flex-col items-center gap-1 relative min-w-[64px] transition-colors ${active ? 'text-[#5b2a86]' : 'text-gray-400'}`}
    >
      {#if item.badge}
        <div class={`absolute -top-3 px-1.5 py-0.5 text-[10px] font-bold rounded-md ${item.badgeClass ?? 'bg-teal-300 text-teal-900'}`}>
          {item.badge}
        </div>
      {/if}

      <Icon class={`h-6 w-6 shrink-0 ${active && item.fillOnActive ? 'fill-current' : ''}`} strokeWidth={active ? 2.5 : 2} />

      <span class={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
        {item.label}
      </span>
    </a>
  {/each}
</div>

<style>
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
</style>

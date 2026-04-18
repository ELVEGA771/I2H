<script lang="ts">
  let {
    label,
    icon,
    href,
    iconClass = 'text-gray-900',
    border = true
  } = $props<{
    label: string;
    icon: any;
    href?: string;
    iconClass?: string;
    border?: boolean;
  }>();
</script>

{#if href}
  {@const Icon = icon}
  <a href={href} class={`flex items-center gap-4 py-5 ${border ? 'border-b border-gray-100' : ''}`}>
    <Icon class={`h-7 w-7 shrink-0 ${iconClass}`} />
    <span class="text-[17px] font-medium text-gray-900 flex-1">{label}</span>
  </a>
{:else}
  {@const Icon = icon}
  <button type="button" class={`flex items-center gap-4 py-5 w-full text-left ${border ? 'border-b border-gray-100' : ''}`}>
    <Icon class={`h-7 w-7 shrink-0 ${iconClass}`} />
    <span class="text-[17px] font-medium text-gray-900 flex-1">{label}</span>
  </button>
{/if}

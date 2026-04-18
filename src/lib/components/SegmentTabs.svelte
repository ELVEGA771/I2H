<script lang="ts">
  type Tab = {
    key: string;
    label: string;
  };

  let {
    tabs = [],
    active,
    onSelect,
    className = '',
    activeClass = 'text-[#5b2a86]',
    inactiveClass = 'text-gray-500',
    underlineClass = 'bg-[#5b2a86]'
  } = $props<{
    tabs?: Tab[];
    active: string;
    onSelect?: (key: string) => void;
    className?: string;
    activeClass?: string;
    inactiveClass?: string;
    underlineClass?: string;
  }>();
</script>

<div class={`flex border-b border-gray-100 ${className}`}>
  {#each tabs as tab}
    {@const isActive = active === tab.key}
    <button
      type="button"
      class={`relative flex-1 py-4 text-center transition-colors ${isActive ? `font-semibold ${activeClass}` : `font-medium ${inactiveClass}`}`}
      onclick={() => onSelect?.(tab.key)}
    >
      {tab.label}
      {#if isActive}
        <div class={`absolute left-0 right-0 bottom-0 h-1 rounded-t-sm ${underlineClass}`}></div>
      {/if}
    </button>
  {/each}
</div>

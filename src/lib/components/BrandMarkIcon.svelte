<script lang="ts">
  let { class: className = '' } = $props<{ class?: string }>();
</script>

<span class={`inline-flex select-none items-center justify-center font-black italic leading-none tracking-tight ${className}`}>
  d!
</span>

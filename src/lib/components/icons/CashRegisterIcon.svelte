<script lang="ts">
  let {
    class: className = '',
    size = 24,
    strokeWidth = 2
  } = $props<{ class?: string; size?: number; strokeWidth?: number }>();
</script>

<svg
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={className}
  width={size}
  height={size}
  stroke-width={strokeWidth}
>
  <path d="M4.5 7.5h15v4h-15z" />
  <path d="M5 11.5h14v6.5H5z" />
  <path d="M7.5 9.5h2" />
  <path d="M11 9.5h2" />
  <path d="M14.5 9.5h2" />
  <path d="M8 14.5h5" />
  <path d="M8 17h3" />
  <circle cx="16.75" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
</svg>

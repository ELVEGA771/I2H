<script lang="ts">
  let { class: className = '' } = $props<{ class?: string }>();
</script>

<svg viewBox="0 0 240 170" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class={className}>
  <defs>
    <linearGradient id="walletBase" x1="54" y1="91" x2="151" y2="155" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9b7be5" />
      <stop offset="1" stop-color="#6b43b8" />
    </linearGradient>
    <linearGradient id="billMint" x1="104" y1="46" x2="155" y2="93" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8be7d1" />
      <stop offset="1" stop-color="#59d2b9" />
    </linearGradient>
    <linearGradient id="coin" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#f7c9a7" />
      <stop offset="1" stop-color="#e9a889" />
    </linearGradient>
  </defs>

  <ellipse cx="120" cy="145" rx="68" ry="8" fill="#f4d2db" opacity="0.85" />

  <rect x="68" y="96" width="104" height="44" rx="16" fill="url(#walletBase)" />
  <rect x="80" y="86" width="86" height="18" rx="8" fill="#f3b55a" opacity="0.95" transform="rotate(4 80 86)" />
  <rect x="87" y="82" width="66" height="7" rx="3.5" fill="#ffd56c" opacity="0.85" />
  <rect x="78" y="106" width="40" height="16" rx="8" fill="#6f4ec6" opacity="0.55" />
  <rect x="120" y="104" width="30" height="14" rx="7" fill="#54359a" opacity="0.55" />

  <g transform="translate(111 41) rotate(-12)">
    <rect x="0" y="0" width="42" height="26" rx="6" fill="url(#billMint)" />
    <circle cx="21" cy="13" r="6" fill="#dffbf2" opacity="0.8" />
  </g>

  <g transform="translate(92 55) rotate(7)">
    <rect x="0" y="0" width="48" height="30" rx="8" fill="#8ee7cf" opacity="0.9" />
    <rect x="6" y="6" width="36" height="18" rx="5" fill="#b4f1e1" opacity="0.65" />
  </g>

  <path d="M107 97c12 0 22 10 22 22" stroke="#f2bb59" stroke-width="8" stroke-linecap="round" />
  <path d="M131 95c-7 2-11 8-11 14" stroke="#efb04d" stroke-width="6" stroke-linecap="round" />

  <circle cx="167" cy="44" r="7" fill="url(#coin)" />
  <circle cx="76" cy="60" r="6" fill="url(#coin)" opacity="0.95" />
  <circle cx="148" cy="28" r="4.5" fill="url(#coin)" opacity="0.9" />
  <circle cx="83" cy="56" r="2.5" fill="#f6d7c8" />
  <circle cx="169" cy="47" r="2.5" fill="#f6d7c8" />
</svg>

// Lapi, la mascota del aula: un lápiz simpático que saluda.
const LAPI = `<svg class="lapi" viewBox="0 0 130 165" aria-hidden="true" focusable="false">
<g transform="rotate(-6 65 90)">
<ellipse cx="65" cy="159" rx="24" ry="4" fill="#000" opacity=".14"/>
<path d="M38 94 Q22 100 20 114" fill="none" stroke="#37474f" stroke-width="7" stroke-linecap="round"/>
<path d="M38 94 Q22 100 20 114" fill="none" stroke="#ffd54a" stroke-width="3.2" stroke-linecap="round"/>
<circle cx="20" cy="116" r="5.5" fill="#fff" stroke="#37474f" stroke-width="2"/>
<rect x="38" y="42" width="54" height="86" fill="#ffd54a" stroke="#37474f" stroke-width="3"/>
<rect x="40" y="44" width="11" height="82" fill="#ffc107"/>
<rect x="83" y="44" width="7" height="82" fill="#ffe082"/>
<path d="M38 128 L92 128 L65 157 Z" fill="#f3d9b1" stroke="#37474f" stroke-width="3" stroke-linejoin="round"/>
<path d="M56 146 L74 146 L65 157 Z" fill="#455a64"/>
<rect x="38" y="30" width="54" height="14" fill="#cfd8dc" stroke="#37474f" stroke-width="3"/>
<path d="M44 35.5 H86 M44 39 H86" stroke="#90a4ae" stroke-width="1.6"/>
<path d="M38 30 V20 Q38 8 65 8 Q92 8 92 20 V30 Z" fill="#f48fb1" stroke="#37474f" stroke-width="3" stroke-linejoin="round"/>
<circle cx="55" cy="72" r="6.5" fill="#fff" stroke="#37474f" stroke-width="2"/>
<circle cx="75" cy="72" r="6.5" fill="#fff" stroke="#37474f" stroke-width="2"/>
<circle cx="56.3" cy="73" r="3.2" fill="#263238"/>
<circle cx="76.3" cy="73" r="3.2" fill="#263238"/>
<circle cx="57.4" cy="71.8" r="1.1" fill="#fff"/>
<circle cx="77.4" cy="71.8" r="1.1" fill="#fff"/>
<circle cx="47" cy="87" r="4.2" fill="#ff8a80" opacity=".7"/>
<circle cx="83" cy="87" r="4.2" fill="#ff8a80" opacity=".7"/>
<path d="M56 89 Q65 103 74 89" fill="none" stroke="#263238" stroke-width="3" stroke-linecap="round"/>
<g class="wave">
<path d="M92 92 Q108 86 112 68" fill="none" stroke="#37474f" stroke-width="7" stroke-linecap="round"/>
<path d="M92 92 Q108 86 112 68" fill="none" stroke="#ffd54a" stroke-width="3.2" stroke-linecap="round"/>
<circle cx="112" cy="64" r="5.5" fill="#fff" stroke="#37474f" stroke-width="2"/>
</g>
</g>
</svg>`;
(function(){ const el = document.getElementById('lapi-side'); if(el) el.innerHTML = LAPI; })();

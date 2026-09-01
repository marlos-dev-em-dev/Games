// ═══════════════════════════════════════════════════
// export.js — Fluid Battles — Sprite Library
// 37 símbolos SVG: 12 fluidos + 15 combos + player + 3 inimigos
// ═══════════════════════════════════════════════════

const SVG_SPRITES = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <desc>Fluid Battles — Sprite Library</desc>
  <defs>
    <linearGradient id="g-aqua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#81D4FA"/><stop offset="1" stop-color="#0277BD"/></linearGradient>
    <linearGradient id="g-ignis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFAB40"/><stop offset="1" stop-color="#D84315"/></linearGradient>
    <linearGradient id="g-acid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CCFF90"/><stop offset="1" stop-color="#64DD17"/></linearGradient>
    <linearGradient id="g-petrus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A1887F"/><stop offset="1" stop-color="#4E342E"/></linearGradient>
    <linearGradient id="g-volta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF59D"/><stop offset="1" stop-color="#F57F17"/></linearGradient>
    <linearGradient id="g-frost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B2EBF2"/><stop offset="1" stop-color="#00838F"/></linearGradient>
    <linearGradient id="g-vita" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A5D6A7"/><stop offset="1" stop-color="#2E7D32"/></linearGradient>
    <linearGradient id="g-void" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#CE93D8"/><stop offset="1" stop-color="#6A1B9A"/></linearGradient>
    <linearGradient id="g-zephyr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAFAFA"/><stop offset="1" stop-color="#B0BEC5"/></linearGradient>
    <linearGradient id="g-terra" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BCAAA4"/><stop offset="1" stop-color="#5D4037"/></linearGradient>
    <linearGradient id="g-lux" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#FFF9C4"/><stop offset="1" stop-color="#F9A825"/></linearGradient>
    <linearGradient id="g-umbra" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#546E7A"/><stop offset="1" stop-color="#1a1a2e"/></linearGradient>
    <linearGradient id="g-steam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAFAFA"/><stop offset="1" stop-color="#FFCC80"/></linearGradient>
    <linearGradient id="g-blizzard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E0F7FA"/><stop offset="1" stop-color="#4DD0E1"/></linearGradient>
    <linearGradient id="g-tempest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#455A64"/><stop offset="1" stop-color="#263238"/></linearGradient>
    <linearGradient id="g-inferno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF6E40"/><stop offset="1" stop-color="#BF360C"/></linearGradient>
    <linearGradient id="g-plasma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EA80FC"/><stop offset="1" stop-color="#7C4DFF"/></linearGradient>
    <linearGradient id="g-mutation" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B2FF59"/><stop offset="1" stop-color="#00C853"/></linearGradient>
    <linearGradient id="g-rift" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B39DDB"/><stop offset="1" stop-color="#00838F"/></linearGradient>
    <linearGradient id="g-equilibrium" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#69F0AE"/><stop offset="1" stop-color="#9575CD"/></linearGradient>
    <linearGradient id="g-corrosion" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C6FF00"/><stop offset="1" stop-color="#795548"/></linearGradient>
    <linearGradient id="g-supernova" x1="0.3" y1="0" x2="0.7" y2="1"><stop offset="0" stop-color="#FF8A80"/><stop offset="1" stop-color="#6A1B9A"/></linearGradient>
    <linearGradient id="g-thunderstorm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#607D8B"/><stop offset="1" stop-color="#263238"/></linearGradient>
    <linearGradient id="g-tidal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FC3F7"/><stop offset="1" stop-color="#795548"/></linearGradient>
    <linearGradient id="g-overgrowth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#81C784"/><stop offset="1" stop-color="#33691E"/></linearGradient>
    <linearGradient id="g-eclipse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF9C4"/><stop offset="0.5" stop-color="#F9A825"/><stop offset="1" stop-color="#263238"/></linearGradient>
    <linearGradient id="g-hellfire" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF5252"/><stop offset="1" stop-color="#1a0a1e"/></linearGradient>
    <linearGradient id="g-enemy-slime" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7B1FA2"/><stop offset="1" stop-color="#311B92"/></linearGradient>
    <linearGradient id="g-enemy-golem" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#78909C"/><stop offset="1" stop-color="#37474F"/></linearGradient>
    <linearGradient id="g-enemy-void" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A148C"/><stop offset="1" stop-color="#0D0D0D"/></linearGradient>
    <linearGradient id="g-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C6BC0"/><stop offset="1" stop-color="#283593"/></linearGradient>
  </defs>

  <!-- ══ FLUIDOS BASE (12) ══ -->

  <symbol id="fluid-aqua" viewBox="0 0 200 200">
    <title>Aqua</title>
    <ellipse cx="100" cy="186" rx="46" ry="7" fill="#0002"/>
    <path d="M100,28 C100,28 162,102 162,132 C162,168 134,187 100,187 C66,187 38,168 38,132 C38,102 100,28 100,28Z" fill="url(#g-aqua)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M68,92 Q62,118 67,148" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    <ellipse cx="78" cy="122" rx="14" ry="17" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="125" rx="8" ry="10" fill="#222"/>
    <circle cx="75" cy="118" r="4.5" fill="#fff"/>
    <circle cx="84" cy="128" r="2" fill="#fff"/>
    <ellipse cx="122" cy="122" rx="14" ry="17" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="125" rx="8" ry="10" fill="#222"/>
    <circle cx="119" cy="118" r="4.5" fill="#fff"/>
    <circle cx="128" cy="128" r="2" fill="#fff"/>
    <ellipse cx="63" cy="145" rx="10" ry="5" fill="#FF8A80" opacity="0.25"/>
    <ellipse cx="137" cy="145" rx="10" ry="5" fill="#FF8A80" opacity="0.25"/>
    <path d="M88,155 Q100,166 112,155" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="48" cy="162" r="7" fill="none" stroke="#0277BD" stroke-width="2" opacity="0.35"/>
    <circle cx="154" cy="105" r="5" fill="none" stroke="#0277BD" stroke-width="2" opacity="0.3"/>
    <circle cx="148" cy="165" r="5.5" fill="none" stroke="#0277BD" stroke-width="2" opacity="0.25"/>
  </symbol>

  <symbol id="fluid-ignis" viewBox="0 0 200 200">
    <title>Ignis</title>
    <ellipse cx="100" cy="186" rx="50" ry="7" fill="#0002"/>
    <path d="M80,52 C75,28 65,32 72,50 M100,42 C96,15 88,22 94,44 M118,50 C125,25 115,30 118,48" fill="#FFAB40" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <path d="M48,92 C34,68 52,42 80,48 C100,32 120,32 138,48 C162,42 175,68 160,92 C175,118 162,162 138,177 C118,190 82,190 62,177 C38,162 28,118 48,92Z" fill="url(#g-ignis)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="82" cy="98" r="7" fill="#FFE0B2" opacity="0.5"/>
    <circle cx="128" cy="118" r="5" fill="#FFCC80" opacity="0.4"/>
    <line x1="66" y1="92" x2="86" y2="98" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <line x1="134" y1="92" x2="114" y2="98" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="78" cy="112" rx="13" ry="14" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="115" rx="7" ry="9" fill="#222"/>
    <circle cx="76" cy="109" r="4" fill="#fff"/>
    <circle cx="84" cy="118" r="2" fill="#fff"/>
    <ellipse cx="122" cy="112" rx="13" ry="14" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="115" rx="7" ry="9" fill="#222"/>
    <circle cx="120" cy="109" r="4" fill="#fff"/>
    <circle cx="128" cy="118" r="2" fill="#fff"/>
    <path d="M80,140 Q100,158 120,140" fill="#222" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <rect x="95" y="138" width="10" height="9" rx="2" fill="#fff" stroke="#222" stroke-width="1.5"/>
  </symbol>

  <symbol id="fluid-acid" viewBox="0 0 200 200">
    <title>Acid</title>
    <ellipse cx="100" cy="186" rx="48" ry="7" fill="#0002"/>
    <path d="M46,100 C32,72 54,40 100,42 C146,40 168,72 154,100 C172,125 164,168 134,182 C115,192 85,192 66,182 C36,168 28,125 46,100Z" fill="url(#g-acid)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M70,182 C68,194 72,200 76,196 M90,186 C88,198 92,205 96,200" fill="#CCFF90" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="105" rx="14" ry="10" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="107" rx="7" ry="6" fill="#222"/>
    <circle cx="76" cy="103" r="3" fill="#fff"/>
    <ellipse cx="122" cy="105" rx="14" ry="10" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="107" rx="7" ry="6" fill="#222"/>
    <circle cx="120" cy="103" r="3" fill="#fff"/>
    <path d="M84,130 Q100,146 116,130" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M108,127 L114,137" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="52" cy="170" r="4" fill="#B2FF59" opacity="0.4" stroke="#222" stroke-width="1.5"/>
    <circle cx="150" cy="155" r="3" fill="#B2FF59" opacity="0.3" stroke="#222" stroke-width="1.5"/>
  </symbol>

  <symbol id="fluid-petrus" viewBox="0 0 200 200">
    <title>Petrus</title>
    <ellipse cx="100" cy="186" rx="52" ry="7" fill="#0002"/>
    <path d="M42,105 C30,75 55,42 100,44 C145,42 170,75 158,105 C175,135 165,172 135,184 C115,192 85,192 65,184 C35,172 25,135 42,105Z" fill="url(#g-petrus)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M65,80 Q55,105 60,125" fill="none" stroke="#BCAAA4" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
    <ellipse cx="78" cy="110" rx="14" ry="12" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="114" rx="7" ry="6" fill="#222"/>
    <circle cx="76" cy="108" r="3.5" fill="#fff"/>
    <path d="M64,106 L80,102" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="122" cy="110" rx="14" ry="12" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="114" rx="7" ry="6" fill="#222"/>
    <circle cx="120" cy="108" r="3.5" fill="#fff"/>
    <path d="M106,106 L140,102" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="100" cy="142" rx="10" ry="12" fill="#222" stroke="#222" stroke-width="2"/>
    <ellipse cx="100" cy="140" rx="7" ry="8" fill="#4E342E"/>
    <path d="M120,184 C122,195 118,200 114,197" fill="#4E342E" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="fluid-volta" viewBox="0 0 200 200">
    <title>Volta</title>
    <ellipse cx="100" cy="186" rx="40" ry="6" fill="#0002"/>
    <path d="M100,22 L120,72 L170,78 L130,112 L148,168 L100,140 L52,168 L70,112 L30,78 L80,72Z" fill="url(#g-volta)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M68,70 L58,55 M132,70 L142,55 M100,22 L100,10 M45,160 L35,172 M155,160 L165,172" stroke="#FFF176" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
    <ellipse cx="80" cy="95" rx="15" ry="18" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="82" cy="98" rx="8" ry="10" fill="#222"/>
    <circle cx="77" cy="91" r="5" fill="#fff"/>
    <circle cx="86" cy="101" r="2.5" fill="#fff"/>
    <circle cx="80" cy="95" r="2" fill="#FFF176" opacity="0.6"/>
    <ellipse cx="120" cy="95" rx="15" ry="18" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="98" rx="8" ry="10" fill="#222"/>
    <circle cx="117" cy="91" r="5" fill="#fff"/>
    <circle cx="126" cy="101" r="2.5" fill="#fff"/>
    <circle cx="120" cy="95" r="2" fill="#FFF176" opacity="0.6"/>
    <path d="M88,122 L95,118 L92,128 L100,124 L97,134" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M103,122 L110,118 L107,128 L115,124 L112,134" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M86,140 Q100,152 114,140" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="fluid-frost" viewBox="0 0 200 200">
    <title>Frost</title>
    <ellipse cx="100" cy="186" rx="42" ry="6" fill="#0002"/>
    <path d="M100,25 L158,62 L158,140 L100,178 L42,140 L42,62Z" fill="url(#g-frost)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100,25 L100,178 M42,62 L158,140 M158,62 L42,140" stroke="#B2EBF2" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
    <path d="M75,55 L62,42 M125,55 L138,42 M75,148 L62,162 M125,148 L138,162" stroke="#E0F7FA" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M58,85 Q52,108 58,130" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="80" cy="100" rx="14" ry="8" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="82" cy="102" rx="7" ry="5" fill="#222"/>
    <circle cx="78" cy="98" r="3" fill="#fff"/>
    <ellipse cx="120" cy="100" rx="14" ry="8" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="102" rx="7" ry="5" fill="#222"/>
    <circle cx="118" cy="98" r="3" fill="#fff"/>
    <path d="M90,122 Q100,130 110,122" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <circle cx="55" cy="170" r="3" fill="#E0F7FA" opacity="0.5"/>
    <circle cx="148" cy="55" r="2.5" fill="#E0F7FA" opacity="0.4"/>
    <circle cx="142" cy="168" r="2" fill="#E0F7FA" opacity="0.3"/>
  </symbol>

  <symbol id="fluid-vita" viewBox="0 0 200 200">
    <title>Vita</title>
    <ellipse cx="100" cy="186" rx="48" ry="7" fill="#0002"/>
    <path d="M100,40 C100,40 140,30 130,55 C145,45 155,55 140,68 C155,62 160,75 142,80 L130,70" fill="#69F0AE" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="100" cy="120" rx="60" ry="65" fill="url(#g-vita)" stroke="#222" stroke-width="5"/>
    <path d="M62,90 Q55,115 60,142" fill="none" stroke="#C8E6C9" stroke-width="4" stroke-linecap="round" opacity="0.45"/>
    <path d="M72,100 Q68,104 74,108 M128,100 Q132,104 126,108" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <path d="M72,100 Q80,96 88,100 M112,100 Q120,96 128,100" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="63" cy="120" rx="10" ry="6" fill="#FF8A80" opacity="0.25"/>
    <ellipse cx="137" cy="120" rx="10" ry="6" fill="#FF8A80" opacity="0.25"/>
    <path d="M82,132 Q100,152 118,132" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M92,134 Q100,142 108,134" fill="#E57373"/>
    <path d="M65,155 L58,168 Q55,175 62,172 L70,165" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M135,155 L142,168 Q145,175 138,172 L130,165" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="fluid-void" viewBox="0 0 200 200">
    <title>Void</title>
    <ellipse cx="100" cy="186" rx="44" ry="7" fill="#0003"/>
    <path d="M50,100 C35,72 55,38 100,40 C145,38 165,72 150,100 C168,128 160,168 130,182 C112,192 88,192 70,182 C40,168 32,128 50,100Z" fill="url(#g-void)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="75" cy="88" r="2" fill="#E1BEE7" opacity="0.5"/>
    <circle cx="130" cy="72" r="1.5" fill="#E1BEE7" opacity="0.4"/>
    <circle cx="60" cy="130" r="2" fill="#CE93D8" opacity="0.3"/>
    <circle cx="140" cy="145" r="1.5" fill="#E1BEE7" opacity="0.4"/>
    <circle cx="100" cy="70" r="1" fill="#fff" opacity="0.6"/>
    <circle cx="115" cy="160" r="1" fill="#fff" opacity="0.4"/>
    <ellipse cx="120" cy="108" rx="22" ry="26" fill="#1a0a2e" stroke="#222" stroke-width="3"/>
    <ellipse cx="120" cy="108" rx="18" ry="22" fill="#CE93D8"/>
    <ellipse cx="122" cy="112" rx="10" ry="13" fill="#6A1B9A"/>
    <circle cx="117" cy="104" r="5" fill="#fff"/>
    <circle cx="126" cy="116" r="2.5" fill="#fff"/>
    <ellipse cx="72" cy="108" rx="18" ry="20" fill="#1a0a2e" opacity="0.6"/>
    <path d="M82,148 Q95,158 108,150" fill="none" stroke="#CE93D8" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M55,65 C60,62 62,58 58,55 M145,140 C150,137 152,133 148,130" fill="none" stroke="#CE93D8" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  </symbol>

  <symbol id="fluid-zephyr" viewBox="0 0 200 200">
    <title>Zephyr</title>
    <circle cx="70" cy="105" r="50" fill="url(#g-zephyr)" stroke="#222" stroke-width="5"/>
    <circle cx="115" cy="90" r="45" fill="url(#g-zephyr)" stroke="#222" stroke-width="5"/>
    <circle cx="145" cy="115" r="38" fill="url(#g-zephyr)" stroke="#222" stroke-width="5"/>
    <circle cx="90" cy="120" r="42" fill="url(#g-zephyr)" stroke="#222" stroke-width="4"/>
    <circle cx="130" cy="125" r="35" fill="url(#g-zephyr)" stroke="#222" stroke-width="4"/>
    <rect x="30" y="120" width="140" height="45" rx="22" fill="url(#g-zephyr)" stroke="#222" stroke-width="5"/>
    <path d="M58,90 Q52,108 58,120" fill="none" stroke="#CFD8DC" stroke-width="3.5" stroke-linecap="round" opacity="0.5"/>
    <ellipse cx="78" cy="108" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="111" rx="7" ry="9" fill="#222"/>
    <circle cx="76" cy="104" r="4" fill="#fff"/>
    <circle cx="84" cy="114" r="2" fill="#fff"/>
    <ellipse cx="122" cy="108" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="111" rx="7" ry="9" fill="#222"/>
    <circle cx="120" cy="104" r="4" fill="#fff"/>
    <circle cx="128" cy="114" r="2" fill="#fff"/>
    <ellipse cx="60" cy="128" rx="14" ry="10" fill="#F48FB1" opacity="0.2"/>
    <ellipse cx="140" cy="128" rx="14" ry="10" fill="#F48FB1" opacity="0.2"/>
    <ellipse cx="100" cy="138" rx="10" ry="10" fill="#222"/>
    <ellipse cx="100" cy="136" rx="8" ry="7" fill="#546E7A" opacity="0.4"/>
    <path d="M165,105 Q180,100 175,115 M170,125 Q185,120 180,135" fill="none" stroke="#B0BEC5" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
  </symbol>

  <symbol id="fluid-terra" viewBox="0 0 200 200">
    <title>Terra</title>
    <ellipse cx="100" cy="186" rx="55" ry="7" fill="#0002"/>
    <rect x="38" y="48" width="124" height="138" rx="24" fill="url(#g-terra)" stroke="#222" stroke-width="5"/>
    <path d="M68,80 L82,95 M132,80 L118,95 M100,145 L100,162" stroke="#4E342E" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    <path d="M65,120 L55,130" stroke="#4E342E" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
    <path d="M52,60 Q56,55 62,58" fill="#81C784" stroke="#222" stroke-width="2"/>
    <path d="M58,55 Q62,48 68,52" fill="#A5D6A7" stroke="#222" stroke-width="2"/>
    <path d="M55,82 Q48,95 55,108" fill="none" stroke="#8D6E63" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
    <line x1="65" y1="92" x2="88" y2="92" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="112" y1="92" x2="135" y2="92" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="108" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="111" rx="8" ry="9" fill="#222"/>
    <circle cx="76" cy="105" r="4" fill="#fff"/>
    <circle cx="84" cy="114" r="2" fill="#fff"/>
    <ellipse cx="122" cy="108" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="111" rx="8" ry="9" fill="#222"/>
    <circle cx="120" cy="105" r="4" fill="#fff"/>
    <circle cx="128" cy="114" r="2" fill="#fff"/>
    <path d="M85,140 Q100,154 115,140" fill="none" stroke="#222" stroke-width="4" stroke-linecap="round"/>
  </symbol>

  <symbol id="fluid-lux" viewBox="0 0 200 200">
    <title>Lux</title>
    <ellipse cx="100" cy="186" rx="38" ry="6" fill="#FFD60022"/>
    <path d="M100,20 L112,72 L168,60 L130,100 L175,120 L122,128 L135,182 L100,148 L65,182 L78,128 L25,120 L70,100 L32,60 L88,72Z" fill="url(#g-lux)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="100" cy="108" r="52" fill="url(#g-lux)" stroke="#222" stroke-width="4"/>
    <path d="M68,85 Q62,108 68,128" fill="none" stroke="#FFF9C4" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
    <ellipse cx="80" cy="100" rx="14" ry="17" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="82" cy="103" rx="8" ry="10" fill="#222"/>
    <circle cx="77" cy="96" r="5" fill="#fff"/>
    <circle cx="86" cy="106" r="2.5" fill="#fff"/>
    <circle cx="80" cy="100" r="2" fill="#FFF59D" opacity="0.5"/>
    <ellipse cx="120" cy="100" rx="14" ry="17" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="103" rx="8" ry="10" fill="#222"/>
    <circle cx="117" cy="96" r="5" fill="#fff"/>
    <circle cx="126" cy="106" r="2.5" fill="#fff"/>
    <circle cx="120" cy="100" r="2" fill="#FFF59D" opacity="0.5"/>
    <ellipse cx="65" cy="120" rx="9" ry="5" fill="#FFAB40" opacity="0.25"/>
    <ellipse cx="135" cy="120" rx="9" ry="5" fill="#FFAB40" opacity="0.25"/>
    <path d="M82,128 Q100,148 118,128" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M90,130 Q100,139 110,130" fill="#FFE082"/>
    <circle cx="50" cy="50" r="3" fill="#FFF9C4" opacity="0.6"/>
    <circle cx="155" cy="45" r="2" fill="#FFF9C4" opacity="0.5"/>
    <circle cx="40" cy="155" r="2.5" fill="#FFF9C4" opacity="0.4"/>
  </symbol>

  <symbol id="fluid-umbra" viewBox="0 0 200 200">
    <title>Umbra</title>
    <path d="M45,108 C28,78 52,38 100,42 C148,38 172,78 155,108 C178,138 165,178 130,188 C110,195 90,195 70,188 C35,178 22,138 45,108Z" fill="url(#g-umbra)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M45,108 C30,118 20,140 28,155 C32,162 40,158 38,150 M155,108 C170,118 180,140 172,155 C168,162 160,158 162,150 M100,188 C100,200 95,210 88,205 M70,188 C62,196 55,195 58,188" fill="#1a1a2e" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="120" cy="100" rx="22" ry="28" fill="#263238" stroke="#222" stroke-width="3"/>
    <ellipse cx="120" cy="100" rx="18" ry="24" fill="#546E7A"/>
    <ellipse cx="122" cy="104" rx="10" ry="14" fill="#222"/>
    <circle cx="117" cy="96" r="6" fill="#80CBC4"/>
    <circle cx="126" cy="108" r="3" fill="#80CBC4"/>
    <circle cx="120" cy="100" r="2" fill="#E0F2F1" opacity="0.7"/>
    <ellipse cx="70" cy="105" rx="15" ry="18" fill="#1a1a2e" opacity="0.5"/>
    <path d="M80,145 Q92,155 108,148" fill="none" stroke="#80CBC4" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
    <path d="M108,146 L112,140" fill="none" stroke="#80CBC4" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
  </symbol>

  <!-- ══ COMBOS (15) ══ -->

  <symbol id="combo-steam" viewBox="0 0 200 200">
    <title>Steam — Aqua + Ignis</title>
    <ellipse cx="100" cy="186" rx="42" ry="6" fill="#0002"/>
    <circle cx="70" cy="110" r="45" fill="url(#g-steam)" stroke="#222" stroke-width="5"/>
    <circle cx="115" cy="95" r="42" fill="url(#g-steam)" stroke="#222" stroke-width="5"/>
    <circle cx="140" cy="120" r="35" fill="url(#g-steam)" stroke="#222" stroke-width="5"/>
    <circle cx="95" cy="125" r="38" fill="url(#g-steam)" stroke="#222" stroke-width="4"/>
    <rect x="32" y="120" width="140" height="42" rx="20" fill="url(#g-steam)" stroke="#222" stroke-width="5"/>
    <path d="M72,58 C68,42 58,48 65,60 M100,48 C96,32 86,38 93,52 M128,56 C132,38 122,44 125,58" fill="none" stroke="#FFCC80" stroke-width="3.5" stroke-linecap="round" opacity="0.6"/>
    <path d="M55,100 Q48,115 55,128" fill="none" stroke="#FFE0B2" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="78" cy="110" rx="13" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="113" rx="7" ry="9" fill="#222"/>
    <circle cx="76" cy="107" r="4" fill="#fff"/>
    <circle cx="84" cy="116" r="2" fill="#fff"/>
    <ellipse cx="122" cy="110" rx="13" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="113" rx="7" ry="9" fill="#222"/>
    <circle cx="120" cy="107" r="4" fill="#fff"/>
    <circle cx="128" cy="116" r="2" fill="#fff"/>
    <ellipse cx="62" cy="128" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <ellipse cx="138" cy="128" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <path d="M85,138 Q100,150 115,138" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-blizzard" viewBox="0 0 200 200">
    <title>Blizzard — Aqua + Frost</title>
    <ellipse cx="100" cy="186" rx="42" ry="6" fill="#0002"/>
    <path d="M100,30 C100,30 165,100 160,132 C158,162 132,180 100,180 C68,180 42,162 40,132 C35,100 100,30 100,30Z" fill="url(#g-blizzard)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100,30 L100,180 M40,80 L160,140 M160,80 L40,140" stroke="#E0F7FA" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
    <path d="M60,55 L50,42 M75,40 L68,28 M140,55 L150,42" stroke="#E0F7FA" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M60,95 Q54,115 60,135" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="80" cy="112" rx="14" ry="14" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="82" cy="115" rx="7" ry="8" fill="#222"/>
    <circle cx="78" cy="109" r="4" fill="#fff"/>
    <circle cx="86" cy="118" r="2" fill="#fff"/>
    <ellipse cx="120" cy="112" rx="14" ry="14" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="115" rx="7" ry="8" fill="#222"/>
    <circle cx="118" cy="109" r="4" fill="#fff"/>
    <circle cx="126" cy="118" r="2" fill="#fff"/>
    <line x1="66" y1="98" x2="88" y2="98" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <line x1="112" y1="98" x2="134" y2="98" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <path d="M90,140 Q100,150 110,140" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="48" cy="165" r="3" fill="#E0F7FA" opacity="0.5"/>
    <circle cx="155" cy="60" r="2.5" fill="#E0F7FA" opacity="0.4"/>
    <circle cx="148" cy="170" r="2" fill="#E0F7FA" opacity="0.3"/>
    <circle cx="38" cy="50" r="2" fill="#fff" opacity="0.4"/>
    <circle cx="165" cy="110" r="2" fill="#fff" opacity="0.3"/>
  </symbol>

  <symbol id="combo-tempest" viewBox="0 0 200 200">
    <title>Tempest — Aqua + Volta</title>
    <circle cx="75" cy="108" r="50" fill="url(#g-tempest)" stroke="#222" stroke-width="5"/>
    <circle cx="120" cy="92" r="46" fill="url(#g-tempest)" stroke="#222" stroke-width="5"/>
    <circle cx="145" cy="118" r="38" fill="url(#g-tempest)" stroke="#222" stroke-width="5"/>
    <circle cx="95" cy="125" r="42" fill="url(#g-tempest)" stroke="#222" stroke-width="4"/>
    <rect x="28" y="122" width="148" height="42" rx="20" fill="url(#g-tempest)" stroke="#222" stroke-width="5"/>
    <path d="M65,165 L72,155 L68,168 L78,158" fill="none" stroke="#FFF176" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M130,165 L137,155 L133,168 L143,158" fill="none" stroke="#FFF176" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M95,168 L100,158 L97,170 L105,160" fill="none" stroke="#FFF176" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    <path d="M50,100 Q44,115 50,128" fill="none" stroke="#78909C" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="78" cy="110" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="113" rx="7" ry="9" fill="#FFF176"/>
    <circle cx="76" cy="106" r="4.5" fill="#fff"/>
    <circle cx="84" cy="116" r="2" fill="#fff"/>
    <ellipse cx="122" cy="110" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="113" rx="7" ry="9" fill="#FFF176"/>
    <circle cx="120" cy="106" r="4.5" fill="#fff"/>
    <circle cx="128" cy="116" r="2" fill="#fff"/>
    <path d="M85,138 L95,132 L90,142 L100,136 L95,146" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M105,138 L115,132 L110,142 L120,136" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <symbol id="combo-inferno" viewBox="0 0 200 200">
    <title>Inferno — Ignis + Petrus</title>
    <ellipse cx="100" cy="186" rx="48" ry="7" fill="#F57F1733"/>
    <path d="M75,55 C68,30 55,38 65,55 M100,38 C92,12 80,22 90,42 M125,55 C132,30 120,38 128,55 M55,70 C48,50 40,55 50,68 M145,70 C152,50 140,55 148,68" fill="#FF6E40" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <path d="M40,95 C25,65 48,35 80,42 C100,28 120,28 140,42 C172,35 190,65 175,95 C192,125 178,170 148,184 C125,195 75,195 52,184 C22,170 8,125 40,95Z" fill="url(#g-inferno)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="80" cy="95" r="8" fill="#FFCC80" opacity="0.5"/>
    <circle cx="130" cy="115" r="6" fill="#FFE0B2" opacity="0.4"/>
    <circle cx="100" cy="80" r="5" fill="#FFAB40" opacity="0.3"/>
    <line x1="62" y1="88" x2="85" y2="95" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="138" y1="88" x2="115" y2="95" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="110" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="113" rx="8" ry="10" fill="#222"/>
    <circle cx="76" cy="107" r="4.5" fill="#fff"/>
    <circle cx="84" cy="116" r="2" fill="#fff"/>
    <ellipse cx="122" cy="110" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="113" rx="8" ry="10" fill="#222"/>
    <circle cx="120" cy="107" r="4.5" fill="#fff"/>
    <circle cx="128" cy="116" r="2" fill="#fff"/>
    <path d="M78,140 Q100,162 122,140" fill="#222" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <rect x="93" y="138" width="14" height="12" rx="3" fill="#fff" stroke="#222" stroke-width="1.5"/>
  </symbol>

  <symbol id="combo-plasma" viewBox="0 0 200 200">
    <title>Plasma — Volta + Petrus</title>
    <ellipse cx="100" cy="186" rx="40" ry="6" fill="#7C4DFF22"/>
    <circle cx="100" cy="108" r="70" fill="url(#g-plasma)" stroke="#222" stroke-width="5"/>
    <circle cx="100" cy="108" r="55" fill="none" stroke="#EA80FC" stroke-width="2" opacity="0.3"/>
    <circle cx="100" cy="108" r="40" fill="none" stroke="#B388FF" stroke-width="2" opacity="0.2"/>
    <path d="M35,60 L28,45 M165,60 L172,45 M30,155 L22,168 M170,155 L178,168 M100,32 L100,18 M100,185 L100,198" stroke="#EA80FC" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M55,85 Q48,108 55,130" fill="none" stroke="#E1BEE7" stroke-width="4" stroke-linecap="round" opacity="0.35"/>
    <ellipse cx="78" cy="100" rx="16" ry="19" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="103" rx="9" ry="11" fill="#7C4DFF"/>
    <circle cx="75" cy="96" r="5" fill="#fff"/>
    <circle cx="85" cy="107" r="2.5" fill="#fff"/>
    <circle cx="78" cy="100" r="2" fill="#EA80FC" opacity="0.5"/>
    <ellipse cx="122" cy="100" rx="16" ry="19" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="103" rx="9" ry="11" fill="#7C4DFF"/>
    <circle cx="119" cy="96" r="5" fill="#fff"/>
    <circle cx="129" cy="107" r="2.5" fill="#fff"/>
    <circle cx="122" cy="100" r="2" fill="#EA80FC" opacity="0.5"/>
    <path d="M85,130 Q100,145 115,130" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-mutation" viewBox="0 0 200 200">
    <title>Mutation — Acid + Vita</title>
    <ellipse cx="100" cy="186" rx="48" ry="7" fill="#0002"/>
    <path d="M100,35 C100,35 145,25 135,55 C155,42 162,58 145,72 C160,65 168,80 148,85 L135,75" fill="#B2FF59" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
    <path d="M45,100 C30,72 55,40 100,42 C145,40 170,72 155,100 C172,128 162,170 135,184 C115,194 85,194 65,184 C38,170 28,128 45,100Z" fill="url(#g-mutation)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M62,90 C72,85 78,78 85,82 M118,82 C125,78 130,85 140,90" fill="none" stroke="#00C853" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="78" cy="105" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="108" rx="7" ry="9" fill="#222"/>
    <circle cx="76" cy="102" r="4" fill="#fff"/>
    <circle cx="84" cy="111" r="2" fill="#fff"/>
    <circle cx="72" cy="98" r="4" fill="#CCFF90" opacity="0.5"/>
    <ellipse cx="122" cy="105" rx="13" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="108" rx="7" ry="9" fill="#222"/>
    <circle cx="120" cy="102" r="4" fill="#fff"/>
    <circle cx="128" cy="111" r="2" fill="#fff"/>
    <ellipse cx="62" cy="125" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <ellipse cx="138" cy="125" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <path d="M85,140 Q100,155 115,140" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M93,142 Q100,150 107,142" fill="#69F0AE"/>
    <path d="M75,160 Q70,175 78,178 M125,160 Q130,175 122,178" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-rift" viewBox="0 0 200 200">
    <title>Rift — Frost + Void</title>
    <ellipse cx="100" cy="186" rx="42" ry="6" fill="#0003"/>
    <ellipse cx="100" cy="108" rx="65" ry="72" fill="url(#g-rift)" stroke="#222" stroke-width="5"/>
    <ellipse cx="100" cy="108" rx="50" ry="55" fill="none" stroke="#B39DDB" stroke-width="2" opacity="0.3"/>
    <circle cx="70" cy="75" r="2" fill="#E1BEE7" opacity="0.6"/>
    <circle cx="135" cy="85" r="1.5" fill="#B2EBF2" opacity="0.5"/>
    <circle cx="60" cy="140" r="2" fill="#E1BEE7" opacity="0.4"/>
    <circle cx="140" cy="135" r="1.5" fill="#fff" opacity="0.5"/>
    <circle cx="100" cy="65" r="1" fill="#fff" opacity="0.7"/>
    <circle cx="85" cy="155" r="1.5" fill="#E1BEE7" opacity="0.4"/>
    <path d="M48,88 Q42,108 48,128" fill="none" stroke="#B39DDB" stroke-width="3.5" stroke-linecap="round" opacity="0.35"/>
    <path d="M78,40 L68,28 M122,40 L132,28 M78,175 L68,188 M122,175 L132,188" stroke="#B2EBF2" stroke-width="2.5" stroke-linecap="round" opacity="0.4"/>
    <ellipse cx="80" cy="102" rx="16" ry="18" fill="#1a0a2e" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="102" rx="12" ry="14" fill="#B39DDB"/>
    <ellipse cx="82" cy="106" rx="7" ry="9" fill="#6A1B9A"/>
    <circle cx="77" cy="99" r="4.5" fill="#fff"/>
    <circle cx="86" cy="109" r="2" fill="#fff"/>
    <ellipse cx="120" cy="102" rx="16" ry="18" fill="#1a0a2e" stroke="#222" stroke-width="3"/>
    <ellipse cx="120" cy="102" rx="12" ry="14" fill="#B39DDB"/>
    <ellipse cx="122" cy="106" rx="7" ry="9" fill="#6A1B9A"/>
    <circle cx="117" cy="99" r="4.5" fill="#fff"/>
    <circle cx="126" cy="109" r="2" fill="#fff"/>
    <path d="M88,135 Q100,142 112,135" fill="none" stroke="#B39DDB" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
  </symbol>

  <symbol id="combo-equilibrium" viewBox="0 0 200 200">
    <title>Equilibrium — Vita + Void</title>
    <ellipse cx="100" cy="186" rx="44" ry="6" fill="#0002"/>
    <circle cx="100" cy="105" r="72" fill="url(#g-equilibrium)" stroke="#222" stroke-width="5"/>
    <path d="M100,33 A72,72 0 0,1 100,177 A36,36 0 0,1 100,105 A36,36 0 0,0 100,33" fill="#69F0AE" stroke="none"/>
    <path d="M100,33 A72,72 0 0,0 100,177 A36,36 0 0,0 100,105 A36,36 0 0,1 100,33" fill="#9575CD" stroke="none"/>
    <circle cx="100" cy="33" r="36" fill="#9575CD"/>
    <circle cx="100" cy="177" r="36" fill="#69F0AE"/>
    <circle cx="100" cy="33" r="10" fill="#69F0AE"/>
    <circle cx="100" cy="177" r="10" fill="#9575CD"/>
    <circle cx="100" cy="105" r="72" fill="none" stroke="#222" stroke-width="5"/>
    <ellipse cx="78" cy="98" rx="12" ry="14" fill="#fff" stroke="#222" stroke-width="2.5"/>
    <ellipse cx="80" cy="101" rx="6" ry="8" fill="#222"/>
    <circle cx="76" cy="95" r="3.5" fill="#fff"/>
    <ellipse cx="122" cy="98" rx="12" ry="14" fill="#fff" stroke="#222" stroke-width="2.5"/>
    <ellipse cx="124" cy="101" rx="6" ry="8" fill="#222"/>
    <circle cx="120" cy="95" r="3.5" fill="#fff"/>
    <path d="M88,120 Q100,132 112,120" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-corrosion" viewBox="0 0 200 200">
    <title>Corrosion — Acid + Petrus</title>
    <ellipse cx="100" cy="186" rx="48" ry="7" fill="#0002"/>
    <path d="M42,108 C28,78 52,38 100,40 C148,38 172,78 158,108 C175,138 165,175 138,186 C118,195 82,195 62,186 C35,175 25,138 42,108Z" fill="url(#g-corrosion)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M68,186 C66,198 70,205 74,200 M88,190 C86,202 90,208 94,203" fill="#C6FF00" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="80" cy="85" r="5" fill="#C6FF00" opacity="0.4"/>
    <circle cx="125" cy="95" r="4" fill="#795548" opacity="0.3"/>
    <circle cx="95" cy="155" r="6" fill="#C6FF00" opacity="0.3"/>
    <path d="M55,85 Q48,108 55,130" fill="none" stroke="#C6FF00" stroke-width="3.5" stroke-linecap="round" opacity="0.35"/>
    <ellipse cx="78" cy="105" rx="14" ry="12" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="108" rx="7" ry="7" fill="#222"/>
    <circle cx="76" cy="102" r="3.5" fill="#fff"/>
    <ellipse cx="122" cy="105" rx="14" ry="12" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="108" rx="7" ry="7" fill="#222"/>
    <circle cx="120" cy="102" r="3.5" fill="#fff"/>
    <line x1="66" y1="90" x2="88" y2="93" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <line x1="134" y1="90" x2="112" y2="93" stroke="#222" stroke-width="4" stroke-linecap="round"/>
    <path d="M82,132 Q100,148 118,132" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M86,130 L92,140 M100,128 L100,140 M114,130 L108,140" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-supernova" viewBox="0 0 200 200">
    <title>Supernova — Ignis + Void</title>
    <ellipse cx="100" cy="186" rx="40" ry="6" fill="#FF525233"/>
    <path d="M100,18 L108,68 L158,48 L128,88 L182,95 L132,112 L168,148 L118,132 L125,185 L100,148 L75,185 L82,132 L32,148 L68,112 L18,95 L72,88 L42,48 L92,68Z" fill="url(#g-supernova)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="100" cy="108" r="52" fill="url(#g-supernova)" stroke="#222" stroke-width="4"/>
    <circle cx="100" cy="108" r="38" fill="none" stroke="#FF8A80" stroke-width="2" opacity="0.3"/>
    <circle cx="65" cy="70" r="2" fill="#E1BEE7" opacity="0.6"/>
    <circle cx="140" cy="75" r="1.5" fill="#FF8A80" opacity="0.5"/>
    <circle cx="55" cy="140" r="2" fill="#CE93D8" opacity="0.4"/>
    <circle cx="145" cy="145" r="1.5" fill="#E1BEE7" opacity="0.5"/>
    <ellipse cx="78" cy="100" rx="15" ry="18" fill="#1a0a1e" stroke="#222" stroke-width="3"/>
    <ellipse cx="78" cy="100" rx="11" ry="14" fill="#FF5252"/>
    <ellipse cx="80" cy="104" rx="6" ry="8" fill="#6A1B9A"/>
    <circle cx="75" cy="96" r="5" fill="#fff"/>
    <circle cx="84" cy="108" r="2.5" fill="#fff"/>
    <circle cx="78" cy="100" r="2" fill="#FF8A80" opacity="0.5"/>
    <ellipse cx="122" cy="100" rx="15" ry="18" fill="#1a0a1e" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="100" rx="11" ry="14" fill="#FF5252"/>
    <ellipse cx="124" cy="104" rx="6" ry="8" fill="#6A1B9A"/>
    <circle cx="119" cy="96" r="5" fill="#fff"/>
    <circle cx="128" cy="108" r="2.5" fill="#fff"/>
    <circle cx="122" cy="100" r="2" fill="#FF8A80" opacity="0.5"/>
    <path d="M85,132 Q100,148 115,132" fill="none" stroke="#FF8A80" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-thunderstorm" viewBox="0 0 200 200">
    <title>Thunderstorm — Zephyr + Volta</title>
    <circle cx="72" cy="100" r="48" fill="url(#g-thunderstorm)" stroke="#222" stroke-width="5"/>
    <circle cx="118" cy="88" r="44" fill="url(#g-thunderstorm)" stroke="#222" stroke-width="5"/>
    <circle cx="142" cy="112" r="36" fill="url(#g-thunderstorm)" stroke="#222" stroke-width="5"/>
    <circle cx="92" cy="115" r="40" fill="url(#g-thunderstorm)" stroke="#222" stroke-width="4"/>
    <rect x="28" y="115" width="148" height="40" rx="20" fill="url(#g-thunderstorm)" stroke="#222" stroke-width="5"/>
    <path d="M78,158 L85,145 L80,160 L90,148" fill="none" stroke="#FFD600" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M115,158 L122,145 L117,160 L127,148" fill="none" stroke="#FFD600" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M96,162 L100,152 L98,164 L104,154" fill="none" stroke="#FFD600" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>
    <path d="M48,88 Q42,105 48,118" fill="none" stroke="#90A4AE" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
    <line x1="62" y1="92" x2="82" y2="95" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="130" y1="88" x2="112" y2="92" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="105" rx="13" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="108" rx="7" ry="9" fill="#FFD600"/>
    <circle cx="76" cy="102" r="4" fill="#fff"/>
    <circle cx="84" cy="111" r="2" fill="#fff"/>
    <ellipse cx="122" cy="105" rx="13" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="108" rx="7" ry="9" fill="#FFD600"/>
    <circle cx="120" cy="102" r="4" fill="#fff"/>
    <circle cx="128" cy="111" r="2" fill="#fff"/>
    <path d="M85,132 Q100,145 115,132" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-tidal" viewBox="0 0 200 200">
    <title>Tidal — Terra + Aqua</title>
    <ellipse cx="100" cy="186" rx="52" ry="7" fill="#0002"/>
    <rect x="40" y="80" width="120" height="106" rx="22" fill="url(#g-terra)" stroke="#222" stroke-width="5"/>
    <path d="M40,105 C55,92 75,98 100,88 C125,98 145,92 160,105 C175,115 175,128 160,128 C145,138 125,132 100,142 C75,132 55,138 40,128 C25,128 25,115 40,105Z" fill="url(#g-tidal)" stroke="#222" stroke-width="4" stroke-linejoin="round"/>
    <path d="M55,78 Q50,68 58,62" fill="#81C784" stroke="#222" stroke-width="2.5"/>
    <path d="M62,70 Q58,60 66,55" fill="#A5D6A7" stroke="#222" stroke-width="2"/>
    <path d="M48,90 Q42,105 48,120" fill="none" stroke="#795548" stroke-width="3.5" stroke-linecap="round" opacity="0.3"/>
    <line x1="66" y1="130" x2="88" y2="130" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="112" y1="130" x2="134" y2="130" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="148" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="151" rx="8" ry="9" fill="#222"/>
    <circle cx="76" cy="145" r="4" fill="#fff"/>
    <circle cx="84" cy="154" r="2" fill="#fff"/>
    <ellipse cx="122" cy="148" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="151" rx="8" ry="9" fill="#222"/>
    <circle cx="120" cy="145" r="4" fill="#fff"/>
    <circle cx="128" cy="154" r="2" fill="#fff"/>
    <path d="M88,168 Q100,180 112,168" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-overgrowth" viewBox="0 0 200 200">
    <title>Overgrowth — Vita + Terra</title>
    <ellipse cx="100" cy="186" rx="52" ry="7" fill="#0002"/>
    <rect x="38" y="55" width="124" height="131" rx="28" fill="url(#g-overgrowth)" stroke="#222" stroke-width="5"/>
    <path d="M38,80 C30,75 25,65 35,58 C40,52 48,55 50,62 M162,80 C170,75 175,65 165,58 C160,52 152,55 150,62" fill="#4CAF50" stroke="#222" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M60,55 C55,40 48,42 55,55 M80,48 C78,35 70,38 76,50 M120,48 C122,35 130,38 124,50 M140,55 C145,40 152,42 145,55" fill="#69F0AE" stroke="#222" stroke-width="2" stroke-linejoin="round"/>
    <path d="M100,55 L100,42 Q100,32 95,35 Q90,38 92,45 L100,55" fill="#81C784" stroke="#222" stroke-width="2"/>
    <path d="M100,55 L100,42 Q100,32 105,35 Q110,38 108,45 L100,55" fill="#A5D6A7" stroke="#222" stroke-width="2"/>
    <path d="M55,90 Q48,108 55,125" fill="none" stroke="#2E7D32" stroke-width="4" stroke-linecap="round" opacity="0.3"/>
    <path d="M68,108 C62,108 58,115 62,120 C65,124 72,122 72,118 C72,114 68,108 68,108Z" fill="#69F0AE" stroke="#222" stroke-width="2" opacity="0.5"/>
    <ellipse cx="78" cy="115" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="118" rx="8" ry="9" fill="#222"/>
    <circle cx="76" cy="112" r="4" fill="#fff"/>
    <circle cx="84" cy="121" r="2" fill="#fff"/>
    <ellipse cx="122" cy="115" rx="14" ry="15" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="118" rx="8" ry="9" fill="#222"/>
    <circle cx="120" cy="112" r="4" fill="#fff"/>
    <circle cx="128" cy="121" r="2" fill="#fff"/>
    <ellipse cx="63" cy="135" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <ellipse cx="137" cy="135" rx="10" ry="5" fill="#FF8A80" opacity="0.2"/>
    <path d="M85,145 Q100,160 115,145" fill="#222" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M92,147 Q100,155 108,147" fill="#81C784"/>
  </symbol>

  <symbol id="combo-eclipse" viewBox="0 0 200 200">
    <title>Eclipse — Lux + Umbra</title>
    <ellipse cx="100" cy="186" rx="42" ry="6" fill="#0002"/>
    <circle cx="100" cy="105" r="72" fill="url(#g-eclipse)" stroke="#222" stroke-width="5"/>
    <path d="M100,33 A72,72 0 0,1 100,177 A72,72 0 0,1 100,33" fill="#263238" stroke="none"/>
    <path d="M108,33 A68,68 0 0,1 108,177" fill="none" stroke="#F9A825" stroke-width="3" opacity="0.6"/>
    <path d="M112,40 A60,60 0 0,1 112,170" fill="none" stroke="#FFF59D" stroke-width="2" opacity="0.3"/>
    <circle cx="62" cy="55" r="3" fill="#FFF9C4" opacity="0.5"/>
    <circle cx="48" cy="130" r="2" fill="#FFF9C4" opacity="0.4"/>
    <circle cx="70" cy="170" r="2.5" fill="#FFF9C4" opacity="0.3"/>
    <circle cx="155" cy="85" r="2" fill="#80CBC4" opacity="0.4"/>
    <circle cx="160" cy="140" r="1.5" fill="#80CBC4" opacity="0.3"/>
    <ellipse cx="82" cy="98" rx="14" ry="16" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="84" cy="101" rx="7" ry="9" fill="#222"/>
    <circle cx="79" cy="95" r="4" fill="#fff"/>
    <circle cx="88" cy="104" r="2" fill="#fff"/>
    <ellipse cx="118" cy="98" rx="14" ry="16" fill="#263238" stroke="#222" stroke-width="3"/>
    <ellipse cx="120" cy="101" rx="7" ry="9" fill="#80CBC4"/>
    <circle cx="115" cy="95" r="4" fill="#E0F2F1"/>
    <circle cx="124" cy="104" r="2" fill="#E0F2F1"/>
    <path d="M88,125 Q100,136 112,125" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round"/>
  </symbol>

  <symbol id="combo-hellfire" viewBox="0 0 200 200">
    <title>Hellfire — Ignis + Umbra</title>
    <ellipse cx="100" cy="186" rx="44" ry="7" fill="#FF525233"/>
    <path d="M72,58 C65,30 50,40 62,55 M100,42 C94,12 82,25 92,45 M128,58 C135,30 120,40 130,55 M48,72 C40,52 32,58 44,68 M152,72 C160,52 148,58 156,68" fill="#FF5252" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <path d="M42,92 C28,62 50,30 82,40 C100,25 118,25 138,40 C170,30 188,62 172,92 C190,122 175,168 145,182 C122,195 78,195 55,182 C25,168 10,122 42,92Z" fill="url(#g-hellfire)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <circle cx="78" cy="90" r="6" fill="#FF8A80" opacity="0.4"/>
    <circle cx="130" cy="105" r="5" fill="#FF5252" opacity="0.3"/>
    <circle cx="100" cy="75" r="4" fill="#FF8A80" opacity="0.25"/>
    <path d="M62,85 Q55,108 62,128" fill="none" stroke="#FF8A80" stroke-width="3.5" stroke-linecap="round" opacity="0.3"/>
    <ellipse cx="78" cy="108" rx="15" ry="17" fill="#1a0a1e" stroke="#222" stroke-width="3"/>
    <ellipse cx="78" cy="108" rx="11" ry="13" fill="#FF5252"/>
    <ellipse cx="80" cy="112" rx="6" ry="8" fill="#263238"/>
    <circle cx="75" cy="104" r="5" fill="#fff"/>
    <circle cx="84" cy="115" r="2.5" fill="#fff"/>
    <ellipse cx="122" cy="108" rx="15" ry="17" fill="#1a0a1e" stroke="#222" stroke-width="3"/>
    <ellipse cx="122" cy="108" rx="11" ry="13" fill="#FF5252"/>
    <ellipse cx="124" cy="112" rx="6" ry="8" fill="#263238"/>
    <circle cx="119" cy="104" r="5" fill="#fff"/>
    <circle cx="128" cy="115" r="2.5" fill="#fff"/>
    <path d="M78,140 Q100,162 122,140" fill="#1a0a1e" stroke="#FF8A80" stroke-width="3" stroke-linecap="round"/>
    <path d="M85,142 L90,152 M98,140 L98,152 M115,142 L110,152" fill="none" stroke="#FF8A80" stroke-width="2" stroke-linecap="round"/>
  </symbol>

  <!-- ══ PLAYER ══ -->

  <symbol id="player-alchemist" viewBox="0 0 200 200">
    <title>Alquimista — Jogador</title>
    <ellipse cx="100" cy="188" rx="42" ry="6" fill="#0002"/>
    <ellipse cx="100" cy="140" rx="48" ry="48" fill="#E8D5B7" stroke="#222" stroke-width="5"/>
    <rect x="62" y="115" width="76" height="55" rx="12" fill="#5C6BC0" stroke="#222" stroke-width="3.5"/>
    <line x1="100" y1="115" x2="100" y2="170" stroke="#3F51B5" stroke-width="2" opacity="0.5"/>
    <circle cx="100" cy="82" r="38" fill="#FFCC80" stroke="#222" stroke-width="5"/>
    <path d="M62,72 L100,18 L138,72Z" fill="url(#g-hat)" stroke="#222" stroke-width="4" stroke-linejoin="round"/>
    <rect x="55" y="68" width="90" height="12" rx="6" fill="#3F51B5" stroke="#222" stroke-width="3"/>
    <ellipse cx="82" cy="65" rx="12" ry="9" fill="#B3E5FC" stroke="#222" stroke-width="2.5"/>
    <ellipse cx="118" cy="65" rx="12" ry="9" fill="#B3E5FC" stroke="#222" stroke-width="2.5"/>
    <line x1="94" y1="65" x2="106" y2="65" stroke="#222" stroke-width="3"/>
    <circle cx="82" cy="65" r="4" fill="#81D4FA" opacity="0.5"/>
    <circle cx="118" cy="65" r="4" fill="#81D4FA" opacity="0.5"/>
    <path d="M63,75 C58,60 65,48 75,50 M137,75 C142,60 135,48 125,50" fill="none" stroke="#5D4037" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="85" cy="88" rx="11" ry="13" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="87" cy="91" rx="6" ry="8" fill="#222"/>
    <circle cx="83" cy="85" r="3.5" fill="#fff"/>
    <circle cx="90" cy="94" r="1.5" fill="#fff"/>
    <ellipse cx="115" cy="88" rx="11" ry="13" fill="#fff" stroke="#222" stroke-width="3"/>
    <ellipse cx="117" cy="91" rx="6" ry="8" fill="#222"/>
    <circle cx="113" cy="85" r="3.5" fill="#fff"/>
    <circle cx="120" cy="94" r="1.5" fill="#fff"/>
    <ellipse cx="72" cy="100" rx="8" ry="4" fill="#FF8A80" opacity="0.25"/>
    <ellipse cx="128" cy="100" rx="8" ry="4" fill="#FF8A80" opacity="0.25"/>
    <path d="M90,105 Q100,115 110,105" fill="none" stroke="#222" stroke-width="3" stroke-linecap="round"/>
    <path d="M52,135 C38,140 30,155 38,165" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/>
    <circle cx="38" cy="165" r="6" fill="#FFCC80" stroke="#222" stroke-width="2.5"/>
    <path d="M148,135 C162,140 170,155 162,165" fill="none" stroke="#222" stroke-width="5" stroke-linecap="round"/>
    <rect x="155" y="155" width="16" height="22" rx="4" fill="#69F0AE" stroke="#222" stroke-width="2.5"/>
    <rect x="159" y="148" width="8" height="10" rx="3" fill="#B2DFDB" stroke="#222" stroke-width="2"/>
    <circle cx="163" cy="166" r="3" fill="#A5D6A7" opacity="0.5"/>
    <ellipse cx="80" cy="185" rx="18" ry="8" fill="#5D4037" stroke="#222" stroke-width="3"/>
    <ellipse cx="120" cy="185" rx="18" ry="8" fill="#5D4037" stroke="#222" stroke-width="3"/>
  </symbol>

  <!-- ══ ENEMIES ══ -->

  <symbol id="enemy-shadow-slime" viewBox="0 0 200 200">
    <title>Sombra Slime</title>
    <ellipse cx="100" cy="186" rx="50" ry="7" fill="#0003"/>
    <path d="M42,108 C28,78 52,38 100,42 C148,38 172,78 158,108 C175,138 162,175 132,186 C112,195 88,195 68,186 C38,175 25,138 42,108Z" fill="url(#g-enemy-slime)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M42,108 C28,120 18,145 25,158 M158,108 C172,120 182,145 175,158" fill="#311B92" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M50,90 Q44,108 50,125" fill="none" stroke="#9C27B0" stroke-width="3.5" stroke-linecap="round" opacity="0.3"/>
    <ellipse cx="78" cy="100" rx="15" ry="17" fill="#FFD600" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="103" rx="8" ry="10" fill="#1a0a2e"/>
    <circle cx="75" cy="96" r="4" fill="#fff"/>
    <circle cx="84" cy="106" r="2" fill="#fff"/>
    <ellipse cx="122" cy="100" rx="15" ry="17" fill="#FFD600" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="103" rx="8" ry="10" fill="#1a0a2e"/>
    <circle cx="119" cy="96" r="4" fill="#fff"/>
    <circle cx="128" cy="106" r="2" fill="#fff"/>
    <path d="M78,135 Q100,155 122,135" fill="none" stroke="#FFD600" stroke-width="3" stroke-linecap="round"/>
    <path d="M82,138 L88,148 M94,136 L97,146 M106,136 L103,146 M118,138 L112,148" fill="none" stroke="#FFD600" stroke-width="2" stroke-linecap="round"/>
  </symbol>

  <symbol id="enemy-crystal-golem" viewBox="0 0 200 200">
    <title>Golem de Cristal</title>
    <ellipse cx="100" cy="188" rx="55" ry="7" fill="#0002"/>
    <path d="M50,55 L150,55 L165,105 L160,170 L40,170 L35,105Z" fill="url(#g-enemy-golem)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M100,55 L100,170 M50,55 L160,170 M150,55 L40,170" stroke="#B0BEC5" stroke-width="2" opacity="0.3"/>
    <path d="M35,105 L15,95 L25,80 M165,105 L185,95 L175,80" fill="#78909C" stroke="#222" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M50,55 L65,30 L85,48 M150,55 L135,30 L115,48" fill="#78909C" stroke="#222" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="100" cy="115" r="15" fill="#B2EBF2" stroke="#222" stroke-width="2.5"/>
    <circle cx="100" cy="115" r="8" fill="#E0F7FA" opacity="0.7"/>
    <ellipse cx="78" cy="85" rx="10" ry="12" fill="#B2EBF2" stroke="#222" stroke-width="3"/>
    <ellipse cx="80" cy="88" rx="5" ry="7" fill="#00838F"/>
    <circle cx="76" cy="82" r="3" fill="#fff"/>
    <ellipse cx="122" cy="85" rx="10" ry="12" fill="#B2EBF2" stroke="#222" stroke-width="3"/>
    <ellipse cx="124" cy="88" rx="5" ry="7" fill="#00838F"/>
    <circle cx="120" cy="82" r="3" fill="#fff"/>
    <line x1="68" y1="72" x2="86" y2="76" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="132" y1="72" x2="114" y2="76" stroke="#222" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M85,148 L92,140 L100,150 L108,140 L115,148" fill="none" stroke="#222" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  </symbol>

  <symbol id="enemy-void-beast" viewBox="0 0 200 200">
    <title>Fera do Vazio</title>
    <ellipse cx="100" cy="186" rx="55" ry="8" fill="#0003"/>
    <path d="M38,100 C22,68 48,28 100,32 C152,28 178,68 162,100 C182,132 168,178 130,190 C110,198 90,198 70,190 C32,178 18,132 38,100Z" fill="url(#g-enemy-void)" stroke="#222" stroke-width="5" stroke-linejoin="round"/>
    <path d="M38,100 C22,115 10,145 20,165 C25,172 35,168 32,158 M162,100 C178,115 190,145 180,165 C175,172 165,168 168,158 M100,190 C100,202 95,215 85,210 M70,190 C60,200 52,198 56,188 M130,190 C140,200 148,198 144,188" fill="#0D0D0D" stroke="#222" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="72" cy="82" rx="14" ry="16" fill="#FF5252" stroke="#222" stroke-width="3"/>
    <ellipse cx="74" cy="86" rx="7" ry="9" fill="#1a0a2e"/>
    <circle cx="70" cy="79" r="4" fill="#fff"/>
    <ellipse cx="128" cy="82" rx="14" ry="16" fill="#FF5252" stroke="#222" stroke-width="3"/>
    <ellipse cx="130" cy="86" rx="7" ry="9" fill="#1a0a2e"/>
    <circle cx="126" cy="79" r="4" fill="#fff"/>
    <ellipse cx="100" cy="68" rx="8" ry="10" fill="#FF5252" stroke="#222" stroke-width="2.5"/>
    <ellipse cx="101" cy="71" rx="4" ry="6" fill="#1a0a2e"/>
    <circle cx="99" cy="66" r="2.5" fill="#fff"/>
    <path d="M68,125 Q100,158 132,125" fill="#1a0a2e" stroke="#FF5252" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M76,128 L82,140 M92,126 L95,138 M108,126 L105,138 M124,128 L118,140" fill="none" stroke="#FF5252" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="60" cy="55" r="2" fill="#CE93D8" opacity="0.4"/>
    <circle cx="145" cy="60" r="1.5" fill="#CE93D8" opacity="0.3"/>
    <circle cx="50" cy="140" r="2" fill="#7C4DFF" opacity="0.3"/>
    <circle cx="155" cy="145" r="1.5" fill="#CE93D8" opacity="0.3"/>
  </symbol>

</svg>`;

function injectSprites() {
  const cache = document.getElementById('svg-cache');
  if (cache) cache.innerHTML = SVG_SPRITES;
}
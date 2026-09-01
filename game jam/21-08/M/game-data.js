const GameData = (() => {
  'use strict';

  const PLAYER = {
    startHp: 100, startGold: 5,
    gridCols: 5, gridRows: 4,
    shopSize: 4, rerollCost: 1,
    lossDmg: round => 10 + Math.floor(round * 2.5),
    goldPerWin: round => 3 + Math.floor(round * 0.8),
  };

  const FLUIDS = {
    fire:      { name:'Fogo',      emoji:'🔥', sprite:'fluid-fire',      hp:12, atk:4, cost:2, role:'dps',     color:'#ff4422', spec:{type:'burn',val:2,chance:0.25} },
    water:     { name:'Água',      emoji:'💧', sprite:'fluid-water',     hp:18, atk:2, cost:2, role:'support',  color:'#2288ff', spec:{type:'heal',val:3,chance:0.3} },
    earth:     { name:'Terra',     emoji:'🪨', sprite:'fluid-earth',     hp:25, atk:2, cost:2, role:'tank',     color:'#886633', spec:{type:'shield',val:3,chance:0.3} },
    air:       { name:'Ar',        emoji:'💨', sprite:'fluid-air',       hp:10, atk:3, cost:2, role:'dps',      color:'#aaddff', spec:{type:'evade',chance:0.25} },
    poison:    { name:'Veneno',    emoji:'☠️', sprite:'fluid-poison',    hp:14, atk:3, cost:3, role:'debuff',   color:'#44cc44', spec:{type:'poison',val:2,chance:0.3} },
    lightning: { name:'Raio',      emoji:'⚡', sprite:'fluid-lightning', hp:11, atk:5, cost:3, role:'dps',      color:'#ffdd00', spec:{type:'crit',chance:0.2} },
    ice:       { name:'Gelo',      emoji:'❄️', sprite:'fluid-ice',       hp:16, atk:3, cost:3, role:'debuff',   color:'#66ddff', spec:{type:'debuff',val:1,chance:0.3} },
    blood:     { name:'Sangue',    emoji:'🩸', sprite:'fluid-blood',     hp:20, atk:3, cost:3, role:'tank',     color:'#cc2244', spec:{type:'regen',val:2,chance:0.3} },
    shadow:    { name:'Sombra',    emoji:'🌑', sprite:'fluid-shadow',    hp:15, atk:4, cost:4, role:'debuff',   color:'#6644aa', spec:{type:'debuff',val:2,chance:0.25} },
    light:     { name:'Luz',       emoji:'✨', sprite:'fluid-light',     hp:14, atk:4, cost:4, role:'support',  color:'#ffdd88', spec:{type:'buff',val:2,chance:0.3} },
  };

  const COMBOS = {
    'fire+water':      { name:'Vapor',              emoji:'♨️',  sprite:'combo-steam',      hp:25, atk:5,  role:'support', color:'#ccddee', spec:{type:'heal',val:4,chance:0.35} },
    'fire+earth':      { name:'Lava',               emoji:'🌋',  sprite:'combo-lava',       hp:30, atk:7,  role:'tank',    color:'#ff6622', spec:{type:'burn',val:3,chance:0.35} },
    'fire+air':        { name:'Inferno',            emoji:'🌪️',  sprite:'combo-inferno',    hp:15, atk:8,  role:'dps',     color:'#ff4400', spec:{type:'burn',val:4,chance:0.3} },
    'fire+poison':     { name:'Fogo Infernal',      emoji:'🔥',  sprite:'combo-hellfire',   hp:20, atk:9,  role:'dps',     color:'#ff2200', spec:{type:'burn',val:3,chance:0.4} },
    'fire+lightning':  { name:'Plasma',             emoji:'💠',  sprite:'combo-plasma',     hp:18, atk:10, role:'dps',     color:'#ffaa00', spec:{type:'crit',chance:0.35} },
    'water+earth':     { name:'Lama',               emoji:'🏔️',  sprite:'combo-mud',        hp:40, atk:2,  role:'tank',    color:'#887744', spec:{type:'shield',val:5,chance:0.4} },
    'water+ice':       { name:'Geada',              emoji:'🧊',  sprite:'combo-frost',      hp:35, atk:4,  role:'debuff',  color:'#aaeeff', spec:{type:'debuff',val:2,chance:0.4} },
    'water+blood':     { name:'Banho de Sangue',    emoji:'🩸',  sprite:'combo-bloodbath',  hp:30, atk:6,  role:'tank',    color:'#882244', spec:{type:'regen',val:3,chance:0.35} },
    'earth+air':       { name:'Tempestade de Areia',emoji:'🏜️',  sprite:'combo-sandstorm',  hp:30, atk:5,  role:'debuff',  color:'#ccaa66', spec:{type:'debuff',val:2,chance:0.35} },
    'earth+shadow':    { name:'Obsidiana',          emoji:'🖤',  sprite:'combo-obsidian',   hp:45, atk:4,  role:'tank',    color:'#332244', spec:{type:'shield',val:6,chance:0.4} },
    'air+lightning':   { name:'Tempestade',         emoji:'⛈️',  sprite:'combo-tempest',    hp:20, atk:7,  role:'dps',     color:'#4488ff', spec:{type:'chain',val:2,chance:0.3} },
    'air+light':       { name:'Radiância',          emoji:'🌟',  sprite:'combo-radiance',   hp:25, atk:6,  role:'support', color:'#ffffaa', spec:{type:'buff',val:3,chance:0.35} },
    'poison+shadow':   { name:'Peste',              emoji:'☣️',  sprite:'combo-plague',     hp:22, atk:8,  role:'debuff',  color:'#226622', spec:{type:'poison',val:4,chance:0.4} },
    'poison+blood':    { name:'Corrupção',          emoji:'🫀',  sprite:'combo-corruption', hp:28, atk:7,  role:'debuff',  color:'#882266', spec:{type:'poison',val:3,chance:0.45} },
    'lightning+light': { name:'Divino',             emoji:'⚡',  sprite:'combo-divine',     hp:25, atk:9,  role:'dps',     color:'#ffff44', spec:{type:'crit',chance:0.4} },
  };

  const ENEMY_BUILDS = [
    null,
    { name:"Slime Curioso",       desc:"Um slime que encontrou um frasco de água...", p:[{t:'water',i:17}] },
    { name:"Gêmeos Flamejantes",  desc:"Dois irmãos inseparáveis de fogo", p:[{t:'fire',i:16},{t:'fire',i:17}] },
    { name:"Casal Elemental",     desc:"Fogo e água se atraem...", p:[{t:'fire',i:16},{t:'water',i:17}] },
    { name:"Par Venenoso",        desc:"Cuidado com o toque", p:[{t:'poison',i:15},{t:'shadow',i:16},{t:'poison',i:17}] },
    { name:"Muralha Rochosa",     desc:"Defesa impenetrável", p:[{t:'earth',i:11},{t:'earth',i:16},{t:'earth',i:17}] },
    { name:"Tempestade Jovem",    desc:"Relâmpagos em série", p:[{t:'lightning',i:16},{t:'lightning',i:17},{t:'light',i:11},{t:'air',i:15}] },
    { name:"Vulcão Nascente",     desc:"Lava borbulhante", p:[{t:'fire',i:11},{t:'earth',i:16},{t:'fire',i:15}] },
    { name:"Geada Eterna",        desc:"O frio corta fundo", p:[{t:'water',i:11},{t:'ice',i:16},{t:'water',i:15},{t:'ice',i:17}] },
    { name:"Culto Sangrento",     desc:"Ritual sombrio", p:[{t:'blood',i:15},{t:'blood',i:16},{t:'poison',i:17},{t:'shadow',i:12}] },
    { name:"Alquimista Iniciante",desc:"Seu primeiro rival de verdade", p:[{t:'fire',i:11},{t:'water',i:12},{t:'earth',i:16},{t:'air',i:17},{t:'poison',i:15}] },
    { name:"Exército das Sombras",desc:"Trevas por todos os lados", p:[{t:'shadow',i:10},{t:'shadow',i:11},{t:'poison',i:15},{t:'poison',i:16},{t:'shadow',i:17}] },
    { name:"Tempestade Arcana",   desc:"Eletricidade suprema", p:[{t:'lightning',i:10},{t:'lightning',i:11},{t:'light',i:12},{t:'air',i:16},{t:'lightning',i:17}] },
    { name:"Mestre do Fogo",      desc:"Chamas supremas", p:[{t:'fire',i:10},{t:'fire',i:11},{t:'earth',i:12},{t:'fire',i:15},{t:'air',i:16},{t:'poison',i:17}] },
    { name:"Oceano Profundo",     desc:"Ondas implacáveis", p:[{t:'water',i:10},{t:'water',i:11},{t:'ice',i:12},{t:'water',i:15},{t:'blood',i:16},{t:'earth',i:17}] },
    { name:"Quimera",             desc:"Múltiplas essências", p:[{t:'fire',i:10},{t:'lightning',i:11},{t:'light',i:12},{t:'earth',i:15},{t:'earth',i:16},{t:'air',i:17},{t:'poison',i:7}] },
    { name:"Fênix Renascida",     desc:"Das cinzas, poder", p:[{t:'fire',i:5},{t:'air',i:6},{t:'fire',i:10},{t:'fire',i:11},{t:'light',i:12},{t:'fire',i:15},{t:'blood',i:16}] },
    { name:"Dragão Elemental",    desc:"Todas as forças da natureza", p:[{t:'fire',i:5},{t:'water',i:6},{t:'earth',i:10},{t:'air',i:11},{t:'lightning',i:15},{t:'ice',i:16},{t:'poison',i:17},{t:'shadow',i:12}] },
    { name:"Lich Supremo",        desc:"Morte e destruição", p:[{t:'shadow',i:5},{t:'shadow',i:6},{t:'blood',i:10},{t:'poison',i:11},{t:'shadow',i:15},{t:'shadow',i:16},{t:'blood',i:17},{t:'poison',i:12}] },
    { name:"Arcanista Louco",     desc:"Gênio da alquimia", p:[{t:'fire',i:5},{t:'lightning',i:6},{t:'light',i:7},{t:'water',i:10},{t:'ice',i:11},{t:'earth',i:15},{t:'earth',i:16},{t:'air',i:17},{t:'poison',i:12}] },
    { name:"Alquimista Supremo",  desc:"O mestre de todos os elementos", p:[{t:'fire',i:0},{t:'water',i:1},{t:'earth',i:5},{t:'air',i:6},{t:'lightning',i:10},{t:'light',i:11},{t:'shadow',i:15},{t:'poison',i:16},{t:'blood',i:17},{t:'ice',i:12}] },
  ];

  const SPEC_INFO = {
    burn:    { name:'Queimadura',  icon:'🔥', color:'#ff4422' },
    heal:    { name:'Cura',        icon:'💚', color:'#44cc88' },
    shield:  { name:'Escudo',      icon:'🛡️', color:'#4488ff' },
    evade:   { name:'Esquiva',     icon:'💨', color:'#aaddff' },
    poison:  { name:'Veneno',      icon:'☠️', color:'#44cc44' },
    crit:    { name:'Crítico',     icon:'⚡', color:'#ffdd00' },
    debuff:  { name:'Enfraquecer', icon:'⬇️', color:'#8888ff' },
    regen:   { name:'Regeneração', icon:'🌿', color:'#44cc44' },
    chain:   { name:'Corrente',    icon:'⛓️', color:'#aaaaff' },
    buff:    { name:'Buff',        icon:'⬆️', color:'#ffaa44' },
  };

  const ROLES = {
    tank:    { name:'Tanque',   icon:'🛡️', color:'#4488ff' },
    dps:     { name:'DPS',      icon:'⚔️', color:'#ff4444' },
    support: { name:'Suporte',  icon:'💚', color:'#44cc88' },
    debuff:  { name:'Debuff',   icon:'⬇️', color:'#aa66ff' },
  };

  // ═══ HELPERS ═══
  function comboKey(a, b) { return [a, b].sort().join('+'); }
  function findCombo(a, b) { return COMBOS[comboKey(a, b)] || null; }

  function getAdj(idx, cols, rows) {
    const row = Math.floor(idx / cols), col = idx % cols;
    const a = [];
    if (row > 0) a.push(idx - cols);
    if (row < rows - 1) a.push(idx + cols);
    if (col > 0) a.push(idx - 1);
    if (col < cols - 1) a.push(idx + 1);
    return a;
  }

  // ═══════════════════════════════════════════════════════
  //  FIX #1: processGrid agora preserva scaling de onda
  //  - Merge usa stats atuais * 1.5 (não FLUIDS base)
  //  - Fusão usa avgScale dos ingredientes
  //  - Eventos incluem sprite
  // ═══════════════════════════════════════════════════════
  function processGrid(bp, cols, rows) {
    const events = [];
    let changed = true, iter = 0;

    while (changed && iter < 50) {
      changed = false; iter++;

      // Phase 1: MERGES (same type + same level)
      for (let i = 0; i < bp.length; i++) {
        if (!bp[i] || bp[i].isCombo) continue;
        for (const ai of getAdj(i, cols, rows)) {
          if (!bp[ai] || bp[ai].isCombo) continue;
          if (bp[i].type !== bp[ai].type) continue;
          const li = bp[i].mergeLvl || 0;
          const la = bp[ai].mergeLvl || 0;
          if (li !== la || li >= 3) continue;

          const nl = li + 1;
          const base = FLUIDS[bp[i].type];
          // FIX: multiplicar stats ATUAIS por 1.5 (preserva wave scaling)
          bp[i] = {
            type: bp[i].type, isCombo: false,
            sprite: base.sprite, emoji: base.emoji,
            name: base.name + ' +' + nl,
            hp: Math.round(bp[i].hp * 1.5),
            maxHp: Math.round(bp[i].maxHp * 1.5),
            atk: Math.round(bp[i].atk * 1.5),
            role: base.role,
            spec: base.spec ? { ...base.spec } : null,
            cost: base.cost, color: base.color,
            mergeLvl: nl,
            scale: bp[i].scale || 1
          };
          bp[ai] = null;
          events.push({ type:'merge', name:bp[i].name, emoji:base.emoji, color:base.color, sprite:base.sprite });
          changed = true; break;
        }
        if (changed) break;
      }
      if (changed) continue;

      // Phase 2: FUSIONS (different type combos)
      for (let i = 0; i < bp.length; i++) {
        if (!bp[i] || bp[i].isCombo) continue;
        for (const ai of getAdj(i, cols, rows)) {
          if (!bp[ai] || bp[ai].isCombo) continue;
          const recipe = findCombo(bp[i].type, bp[ai].type);
          if (recipe) {
            const f = bp[i], o = bp[ai];
            // FIX: preservar scaling via avgScale
            const avgScale = ((f.scale || 1) + (o.scale || 1)) / 2;
            bp[i] = {
              type: comboKey(f.type, o.type), isCombo: true,
              sprite: recipe.sprite, emoji: recipe.emoji,
              name: recipe.name,
              hp: Math.round(recipe.hp * avgScale),
              maxHp: Math.round(recipe.hp * avgScale),
              atk: Math.round(recipe.atk * avgScale),
              role: recipe.role,
              spec: recipe.spec ? { ...recipe.spec } : null,
              color: recipe.color, mergeLvl: 0,
              scale: avgScale
            };
            bp[ai] = null;
            events.push({ type:'fusion', name:recipe.name, emoji:recipe.emoji, color:recipe.color, sprite:recipe.sprite });
            changed = true; break;
          }
        }
        if (changed) break;
      }
    }
    return events;
  }

  function buildEnemyArmy(build, cols, rows, wave) {
    const bp = new Array(cols * rows).fill(null);
    const scale = 1 + (wave - 1) * 0.12;

    for (const pl of build.p) {
      const d = FLUIDS[pl.t];
      bp[pl.i] = {
        type: pl.t, isCombo: false,
        sprite: d.sprite, emoji: d.emoji, name: d.name,
        hp: Math.round(d.hp * scale),
        maxHp: Math.round(d.hp * scale),
        atk: Math.max(1, Math.round(d.atk * scale)),
        role: d.role,
        spec: d.spec ? { ...d.spec } : null,
        cost: d.cost, color: d.color, mergeLvl: 0,
        scale: scale
      };
    }

    processGrid(bp, cols, rows);

    return {
      army: bp.filter(f => f !== null),
      grid: [...bp]
    };
  }

  // ═══ SVG SPRITES ═══
  function injectSprites() {
    const c = document.getElementById('svg-cache');
    if (!c) return;
    c.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <g id="fluid-fire">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#ff4422" opacity=".25"/>
          <path d="M100 30 C70 80 50 110 60 150 C65 170 85 180 100 180 C115 180 135 170 140 150 C150 110 130 80 100 30Z" fill="#ff4422"/>
          <path d="M100 60 C85 95 75 115 80 140 C83 155 92 162 100 162 C108 162 117 155 120 140 C125 115 115 95 100 60Z" fill="#ff8844"/>
          <path d="M100 90 C92 110 88 122 90 135 C92 142 96 146 100 146 C104 146 108 142 110 135 C112 122 108 110 100 90Z" fill="#ffcc44"/>
          <circle cx="90" cy="100" r="4" fill="#fff" opacity=".5"/>
        </g>
        <g id="fluid-water">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#2288ff" opacity=".2"/>
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#2288ff"/>
          <ellipse cx="100" cy="100" rx="42" ry="50" fill="#44aaff"/>
          <ellipse cx="92" cy="88" rx="18" ry="22" fill="#88ccff" opacity=".6"/>
          <path d="M120 70 Q130 60 125 50 Q120 42 128 35" fill="none" stroke="#88ccff" stroke-width="3" opacity=".5"/>
          <circle cx="85" cy="80" r="5" fill="#fff" opacity=".4"/>
        </g>
        <g id="fluid-earth">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#886633" opacity=".2"/>
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#886633"/>
          <ellipse cx="100" cy="100" rx="42" ry="50" fill="#aa8844"/>
          <path d="M75 90 L85 75 L95 88 L105 72 L115 85 L125 78 L130 95" fill="#665522" opacity=".5"/>
          <ellipse cx="88" cy="85" rx="8" ry="6" fill="#554411" opacity=".4"/>
          <circle cx="82" cy="78" r="3" fill="#ccaa66" opacity=".5"/>
        </g>
        <g id="fluid-air">
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#aaddff" opacity=".15"/>
          <ellipse cx="100" cy="108" rx="48" ry="58" fill="#aaddff" opacity=".3"/>
          <path d="M60 100 Q80 80 100 90 Q120 100 140 85" fill="none" stroke="#aaddff" stroke-width="4" opacity=".6"/>
          <path d="M65 115 Q85 95 105 105 Q125 115 145 100" fill="none" stroke="#88ccee" stroke-width="3" opacity=".4"/>
          <circle cx="80" cy="95" r="3" fill="#fff" opacity=".5"/>
        </g>
        <g id="fluid-poison">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#44cc44" opacity=".2"/>
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#338833"/>
          <ellipse cx="100" cy="100" rx="42" ry="50" fill="#44aa44"/>
          <circle cx="80" cy="95" r="6" fill="#66dd66" opacity=".5"/>
          <circle cx="115" cy="100" r="8" fill="#66dd66" opacity=".4"/>
          <circle cx="95" cy="115" r="5" fill="#66dd66" opacity=".45"/>
          <path d="M85 70 L90 60 L95 70" fill="none" stroke="#88ff88" stroke-width="2.5" opacity=".6"/>
        </g>
        <g id="fluid-lightning">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#ffdd00" opacity=".15"/>
          <ellipse cx="100" cy="108" rx="50" ry="60" fill="#ffdd00" opacity=".3"/>
          <polygon points="105,35 80,100 98,100 85,170 125,85 105,85 120,35" fill="#ffdd00"/>
          <polygon points="105,50 90,100 102,100 93,150 118,90 106,90 115,50" fill="#ffff88"/>
          <circle cx="80" cy="80" r="3" fill="#fff" opacity=".7"/>
        </g>
        <g id="fluid-ice">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#66ddff" opacity=".15"/>
          <polygon points="100,30 130,65 130,120 100,160 70,120 70,65" fill="#88eeff" opacity=".4"/>
          <polygon points="100,45 120,70 120,115 100,145 80,115 80,70" fill="#aaeeff"/>
          <polygon points="100,60 112,75 112,108 100,128 88,108 88,75" fill="#ccf4ff"/>
          <line x1="100" y1="45" x2="100" y2="145" stroke="#fff" stroke-width="1.5" opacity=".4"/>
          <line x1="70" y1="95" x2="130" y2="95" stroke="#fff" stroke-width="1.5" opacity=".4"/>
          <circle cx="92" cy="78" r="3" fill="#fff" opacity=".6"/>
        </g>
        <g id="fluid-blood">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#cc2244" opacity=".2"/>
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#991133"/>
          <ellipse cx="100" cy="100" rx="42" ry="50" fill="#bb2244"/>
          <ellipse cx="90" cy="88" rx="15" ry="18" fill="#dd4466" opacity=".5"/>
          <circle cx="85" cy="82" r="4" fill="#ff6688" opacity=".4"/>
        </g>
        <g id="fluid-shadow">
          <ellipse cx="100" cy="110" rx="60" ry="70" fill="#6644aa" opacity=".2"/>
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#332266"/>
          <ellipse cx="100" cy="100" rx="42" ry="50" fill="#443388"/>
          <ellipse cx="100" cy="100" rx="30" ry="36" fill="#5544aa" opacity=".5"/>
          <circle cx="88" cy="90" r="6" fill="#8866cc" opacity=".4"/>
          <circle cx="100" cy="110" r="8" fill="#221144" opacity=".5"/>
        </g>
        <g id="fluid-light">
          <ellipse cx="100" cy="108" rx="55" ry="65" fill="#ffdd88" opacity=".2"/>
          <circle cx="100" cy="105" r="45" fill="#ffdd88" opacity=".35"/>
          <circle cx="100" cy="105" r="32" fill="#ffeeaa" opacity=".5"/>
          <circle cx="100" cy="105" r="18" fill="#ffffcc" opacity=".6"/>
          <line x1="100" y1="45" x2="100" y2="30" stroke="#ffdd88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="100" y1="165" x2="100" y2="180" stroke="#ffdd88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="40" y1="105" x2="25" y2="105" stroke="#ffdd88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="160" y1="105" x2="175" y2="105" stroke="#ffdd88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <circle cx="93" cy="98" r="5" fill="#fff" opacity=".5"/>
        </g>
        <g id="combo-steam">
          <ellipse cx="100" cy="115" rx="48" ry="40" fill="#88aacc" opacity=".4"/>
          <ellipse cx="80" cy="85" rx="22" ry="28" fill="#bbccee" opacity=".5"/>
          <ellipse cx="115" cy="80" rx="18" ry="24" fill="#aabbdd" opacity=".45"/>
          <ellipse cx="100" cy="65" rx="15" ry="20" fill="#ddeeff" opacity=".5"/>
          <path d="M85 55 Q80 35 90 25" fill="none" stroke="#ddeeff" stroke-width="3" opacity=".5" stroke-linecap="round"/>
          <path d="M105 50 Q110 30 100 20" fill="none" stroke="#ddeeff" stroke-width="3" opacity=".4" stroke-linecap="round"/>
          <circle cx="88" cy="78" r="4" fill="#fff" opacity=".35"/>
        </g>
        <g id="combo-lava">
          <ellipse cx="100" cy="112" rx="55" ry="58" fill="#cc3300"/>
          <ellipse cx="100" cy="105" rx="44" ry="46" fill="#ff5511"/>
          <ellipse cx="100" cy="98" rx="32" ry="34" fill="#ff8833"/>
          <ellipse cx="92" cy="88" rx="12" ry="14" fill="#ffcc44" opacity=".6"/>
          <circle cx="85" cy="100" r="5" fill="#ffdd66" opacity=".5"/>
          <path d="M70 80 Q65 60 75 50" fill="none" stroke="#ff4400" stroke-width="3" opacity=".5" stroke-linecap="round"/>
          <path d="M130 80 Q135 55 125 45" fill="none" stroke="#ff4400" stroke-width="3" opacity=".5" stroke-linecap="round"/>
        </g>
        <g id="combo-inferno">
          <path d="M100 20 C60 70 40 110 55 155 C62 175 82 185 100 185 C118 185 138 175 145 155 C160 110 140 70 100 20Z" fill="#ff4400"/>
          <path d="M100 50 C75 85 65 110 72 140 C76 155 88 162 100 162 C112 162 124 155 128 140 C135 110 125 85 100 50Z" fill="#ff6622"/>
          <path d="M100 75 C88 100 82 115 86 132 C88 140 94 144 100 144 C106 144 112 140 114 132 C118 115 112 100 100 75Z" fill="#ffaa44"/>
          <circle cx="90" cy="95" r="4" fill="#ffffaa" opacity=".5"/>
        </g>
        <g id="combo-hellfire">
          <path d="M100 25 C65 75 45 105 58 148 C64 168 84 178 100 178 C116 178 136 168 142 148 C155 105 135 75 100 25Z" fill="#cc1100"/>
          <path d="M100 50 C78 85 68 108 75 135 C78 150 90 158 100 158 C110 158 122 150 125 135 C132 108 122 85 100 50Z" fill="#ee2200"/>
          <path d="M100 78 C90 100 86 112 89 128 C90 136 95 140 100 140 C105 140 110 136 111 128 C114 112 110 100 100 78Z" fill="#44cc44" opacity=".5"/>
          <circle cx="88" cy="92" r="5" fill="#66ff66" opacity=".4"/>
        </g>
        <g id="combo-plasma">
          <circle cx="100" cy="105" r="48" fill="#ffaa00" opacity=".25"/>
          <circle cx="100" cy="105" r="35" fill="#ffcc22" opacity=".4"/>
          <circle cx="100" cy="105" r="20" fill="#ffee66" opacity=".55"/>
          <circle cx="100" cy="105" r="10" fill="#ffffcc" opacity=".7"/>
          <polygon points="108,50 92,95 104,95 90,155 120,85 106,85 118,50" fill="#ffdd00" opacity=".5"/>
        </g>
        <g id="combo-mud">
          <ellipse cx="100" cy="118" rx="52" ry="55" fill="#776633"/>
          <ellipse cx="100" cy="112" rx="40" ry="42" fill="#998855"/>
          <ellipse cx="88" cy="100" rx="14" ry="10" fill="#aa9966" opacity=".5"/>
          <circle cx="80" cy="108" r="5" fill="#665522" opacity=".4"/>
          <circle cx="100" cy="125" r="6" fill="#554411" opacity=".3"/>
        </g>
        <g id="combo-frost">
          <polygon points="100,25 138,65 138,125 100,168 62,125 62,65" fill="#88ddff" opacity=".35"/>
          <polygon points="100,42 125,70 125,118 100,150 75,118 75,70" fill="#aaeeff" opacity=".5"/>
          <polygon points="100,58 115,76 115,110 100,132 85,110 85,76" fill="#ccf4ff" opacity=".6"/>
          <line x1="100" y1="42" x2="100" y2="150" stroke="#fff" stroke-width="2" opacity=".4"/>
          <line x1="62" y1="96" x2="138" y2="96" stroke="#fff" stroke-width="2" opacity=".4"/>
          <circle cx="88" cy="78" r="3" fill="#fff" opacity=".5"/>
        </g>
        <g id="combo-bloodbath">
          <ellipse cx="100" cy="115" rx="50" ry="55" fill="#661133"/>
          <ellipse cx="100" cy="108" rx="40" ry="44" fill="#882244"/>
          <ellipse cx="90" cy="95" rx="16" ry="18" fill="#aa3355" opacity=".5"/>
          <circle cx="82" cy="88" r="5" fill="#cc4466" opacity=".4"/>
          <circle cx="115" cy="100" r="7" fill="#cc4466" opacity=".35"/>
        </g>
        <g id="combo-sandstorm">
          <ellipse cx="100" cy="112" rx="52" ry="58" fill="#aa8844" opacity=".4"/>
          <ellipse cx="100" cy="105" rx="40" ry="44" fill="#ccaa66" opacity=".5"/>
          <path d="M55 100 Q75 80 100 88 Q125 96 145 80" fill="none" stroke="#ddbb77" stroke-width="4" opacity=".5"/>
          <path d="M60 115 Q80 95 105 103 Q130 111 150 95" fill="none" stroke="#ccaa55" stroke-width="3" opacity=".4"/>
          <circle cx="78" cy="92" r="4" fill="#ddbb77" opacity=".4"/>
        </g>
        <g id="combo-obsidian">
          <polygon points="100,30 140,70 140,130 100,170 60,130 60,70" fill="#221133"/>
          <polygon points="100,45 130,75 130,125 100,155 70,125 70,75" fill="#332244"/>
          <polygon points="100,60 120,80 120,118 100,140 80,118 80,80" fill="#443366" opacity=".7"/>
          <circle cx="92" cy="88" r="5" fill="#6644aa" opacity=".3"/>
          <circle cx="100" cy="100" r="10" fill="#110022" opacity=".4"/>
        </g>
        <g id="combo-tempest">
          <ellipse cx="100" cy="108" rx="50" ry="58" fill="#3366cc" opacity=".35"/>
          <path d="M60 95 Q80 75 100 85 Q120 95 140 78" fill="none" stroke="#6699ff" stroke-width="4" opacity=".5"/>
          <polygon points="108,42 88,90 102,90 85,155 122,82 106,82 120,42" fill="#ffdd00" opacity=".6"/>
          <circle cx="80" cy="82" r="3" fill="#fff" opacity=".5"/>
        </g>
        <g id="combo-radiance">
          <circle cx="100" cy="105" r="48" fill="#ffffaa" opacity=".2"/>
          <circle cx="100" cy="105" r="36" fill="#ffffcc" opacity=".35"/>
          <circle cx="100" cy="105" r="22" fill="#ffffee" opacity=".5"/>
          <circle cx="100" cy="105" r="10" fill="#ffffff" opacity=".6"/>
          <line x1="100" y1="40" x2="100" y2="18" stroke="#ffffaa" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
          <line x1="100" y1="170" x2="100" y2="192" stroke="#ffffaa" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
          <line x1="35" y1="105" x2="13" y2="105" stroke="#ffffaa" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
          <line x1="165" y1="105" x2="187" y2="105" stroke="#ffffaa" stroke-width="3.5" stroke-linecap="round" opacity=".6"/>
        </g>
        <g id="combo-plague">
          <ellipse cx="100" cy="108" rx="52" ry="60" fill="#1a441a"/>
          <ellipse cx="100" cy="100" rx="40" ry="46" fill="#2d5a2d"/>
          <circle cx="82" cy="90" r="8" fill="#44aa44" opacity=".4"/>
          <circle cx="115" cy="95" r="10" fill="#44aa44" opacity=".35"/>
          <circle cx="98" cy="115" r="7" fill="#44aa44" opacity=".38"/>
          <path d="M85 65 Q80 48 88 38" fill="none" stroke="#44aa44" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>
          <path d="M110 60 Q115 42 108 32" fill="none" stroke="#44aa44" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>
        </g>
        <g id="combo-corruption">
          <ellipse cx="100" cy="115" rx="50" ry="55" fill="#661144"/>
          <ellipse cx="100" cy="108" rx="40" ry="44" fill="#882255"/>
          <ellipse cx="90" cy="95" rx="14" ry="16" fill="#aa3377" opacity=".5"/>
          <circle cx="80" cy="88" r="6" fill="#44cc44" opacity=".4"/>
          <circle cx="118" cy="100" r="8" fill="#44cc44" opacity=".35"/>
        </g>
        <g id="combo-divine">
          <circle cx="100" cy="105" r="48" fill="#ffff44" opacity=".2"/>
          <circle cx="100" cy="105" r="35" fill="#ffff88" opacity=".35"/>
          <circle cx="100" cy="105" r="20" fill="#ffffcc" opacity=".5"/>
          <polygon points="108,45 88,88 102,88 86,148 122,80 106,80 120,45" fill="#ffdd00" opacity=".6"/>
          <line x1="100" y1="38" x2="100" y2="18" stroke="#ffff88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="100" y1="172" x2="100" y2="192" stroke="#ffff88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="38" y1="105" x2="18" y2="105" stroke="#ffff88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <line x1="162" y1="105" x2="182" y2="105" stroke="#ffff88" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          <circle cx="93" cy="95" r="5" fill="#fff" opacity=".5"/>
        </g>
        <g id="player-alchemist">
          <ellipse cx="100" cy="170" rx="30" ry="8" fill="#000" opacity=".2"/>
          <path d="M75 165 L72 110 Q72 95 85 90 L85 70 Q85 55 100 50 Q115 55 115 70 L115 90 Q128 95 128 110 L125 165 Z" fill="#2a1a3a"/>
          <path d="M80 165 L78 115 Q78 102 88 97 L88 75 Q88 62 100 58 Q112 62 112 75 L112 97 Q122 102 122 115 L120 165 Z" fill="#3a2a4a"/>
          <circle cx="100" cy="42" r="22" fill="#ffd4a8"/>
          <circle cx="100" cy="38" r="20" fill="#ffe0bb"/>
          <path d="M78 32 Q80 15 100 12 Q120 15 122 32 Q118 28 100 26 Q82 28 78 32Z" fill="#553322"/>
          <circle cx="91" cy="38" r="3.5" fill="#1a1a2e"/>
          <circle cx="109" cy="38" r="3.5" fill="#1a1a2e"/>
          <circle cx="92" cy="37" r="1.2" fill="#fff"/>
          <circle cx="110" cy="37" r="1.2" fill="#fff"/>
          <path d="M95 48 Q100 52 105 48" fill="none" stroke="#cc8866" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M82 30 Q78 22 85 20" fill="none" stroke="#553322" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M118 30 Q122 22 115 20" fill="none" stroke="#553322" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M70 100 L60 85 Q55 80 60 78 L68 82 L72 100" fill="#ffd4a8"/>
          <path d="M130 100 L140 85 Q145 80 140 78 L132 82 L128 100" fill="#ffd4a8"/>
          <circle cx="100" cy="100" r="8" fill="#e8a838" opacity=".8"/>
          <circle cx="100" cy="100" r="5" fill="#ffcc44" opacity=".6"/>
        </g>
      </defs>
    </svg>`;
  }

  return {
    PLAYER, FLUIDS, COMBOS, ENEMY_BUILDS, SPEC_INFO, ROLES,
    comboKey, findCombo, processGrid, buildEnemyArmy, getAdj, injectSprites
  };
})();
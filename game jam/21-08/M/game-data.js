// ═══════════════════════════════════════════════════
// game-data.js — Fluid Battles — Dados e Configuração
// ═══════════════════════════════════════════════════

const GameData = (() => {

  const PLAYER = {
    startHp: 20, startGold: 5, rerollCost: 1,
    shopSize: 4, gridCols: 5, gridRows: 4,
    goldPerWin: r => 2 + Math.floor(r * 1.5),
    lossDmg: r => 2 + Math.floor(r * 0.8),
  };

  // ═══════ 12 FLUIDOS BASE ═══════
  const FLUIDS = {
    aqua:   {name:'Aqua',   emoji:'💧', sprite:'fluid-aqua',   cost:2, hp:6,  atk:2, role:'support',  spec:{type:'heal',  val:2, chance:.5},  color:'#4fc3f7'},
    ignis:  {name:'Ignis',  emoji:'🌋', sprite:'fluid-ignis',  cost:2, hp:3,  atk:5, role:'dps',      spec:{type:'burn',  val:2, chance:.4},  color:'#ff7043'},
    acid:   {name:'Acid',   emoji:'☣️', sprite:'fluid-acid',   cost:2, hp:4,  atk:4, role:'dps',      spec:{type:'poison',val:2, chance:.4},  color:'#76ff03'},
    petrus: {name:'Petrus', emoji:'🛢️', sprite:'fluid-petrus', cost:2, hp:8,  atk:1, role:'tank',     spec:null,                               color:'#8d6e63'},
    volta:  {name:'Volta',  emoji:'⚡', sprite:'fluid-volta',  cost:2, hp:2,  atk:6, role:'dps',      spec:{type:'crit',  val:2, chance:.3},  color:'#ffd600'},
    frost:  {name:'Frost',  emoji:'❄️', sprite:'fluid-frost',  cost:2, hp:5,  atk:3, role:'control',  spec:{type:'freeze',val:1, chance:.25}, color:'#80deea'},
    vita:   {name:'Vita',   emoji:'🌿', sprite:'fluid-vita',   cost:2, hp:7,  atk:2, role:'support',  spec:{type:'heal',  val:3, chance:.5},  color:'#69f0ae'},
    void:   {name:'Void',   emoji:'💜', sprite:'fluid-void',   cost:3, hp:4,  atk:5, role:'dps',      spec:{type:'chaos', val:3, chance:.3},  color:'#ce93d8'},
    zephyr: {name:'Zephyr', emoji:'☁️', sprite:'fluid-zephyr', cost:2, hp:3,  atk:3, role:'control',  spec:{type:'evade', val:1, chance:.3},  color:'#b0bec5'},
    terra:  {name:'Terra',  emoji:'🪨', sprite:'fluid-terra',  cost:2, hp:9,  atk:1, role:'tank',     spec:{type:'shield',val:2, chance:.3},  color:'#8d6e63'},
    lux:    {name:'Lux',    emoji:'✨', sprite:'fluid-lux',    cost:3, hp:5,  atk:4, role:'support',  spec:{type:'buff',  val:2, chance:.4},  color:'#ffd740'},
    umbra:  {name:'Umbra',  emoji:'🌑', sprite:'fluid-umbra',  cost:3, hp:3,  atk:6, role:'dps',      spec:{type:'debuff',val:2, chance:.3},  color:'#546e7a'},
  };

  // ═══════ 15 COMBOS ═══════
  const COMBOS = {
    'aqua+ignis':   {name:'Steam',        emoji:'♨️', sprite:'combo-steam',        hp:12,atk:8, role:'tank',    spec:{type:'burn',  val:3, chance:.5},  color:'#ffcc80'},
    'aqua+frost':   {name:'Blizzard',     emoji:'🌨️',sprite:'combo-blizzard',     hp:10,atk:7, role:'control', spec:{type:'freeze',val:1, chance:.4},  color:'#80deea'},
    'aqua+volta':   {name:'Tempest',      emoji:'⛈️', sprite:'combo-tempest',      hp:8, atk:12,role:'dps',     spec:{type:'chain', val:2, chance:.5},  color:'#607d8b'},
    'ignis+petrus': {name:'Inferno',      emoji:'🔥', sprite:'combo-inferno',      hp:10,atk:14,role:'dps',     spec:{type:'burn',  val:5, chance:.5},  color:'#ff6e40'},
    'petrus+volta': {name:'Plasma',       emoji:'🟣', sprite:'combo-plasma',       hp:7, atk:16,role:'dps',     spec:{type:'crit',  val:3, chance:.4},  color:'#ea80fc'},
    'acid+vita':    {name:'Mutation',     emoji:'🧬', sprite:'combo-mutation',     hp:14,atk:8, role:'support', spec:{type:'buff',  val:3, chance:.5},  color:'#b2ff59'},
    'frost+void':   {name:'Rift',         emoji:'🌀', sprite:'combo-rift',         hp:9, atk:10,role:'control', spec:{type:'banish',val:1, chance:.25}, color:'#b39ddb'},
    'vita+void':    {name:'Equilibrium',  emoji:'☯️', sprite:'combo-equilibrium',  hp:18,atk:6, role:'tank',    spec:{type:'heal',  val:6, chance:.5},  color:'#9575cd'},
    'acid+petrus':  {name:'Corrosion',    emoji:'🧪', sprite:'combo-corrosion',    hp:11,atk:10,role:'dps',     spec:{type:'armor_break',val:3,chance:.4},color:'#c6ff00'},
    'ignis+void':   {name:'Supernova',    emoji:'💫', sprite:'combo-supernova',    hp:6, atk:18,role:'dps',     spec:{type:'burn',  val:4, chance:.6},  color:'#ff8a80'},
    'volta+zephyr': {name:'Thunderstorm', emoji:'🌩️',sprite:'combo-thunderstorm', hp:8, atk:13,role:'dps',     spec:{type:'chain', val:3, chance:.5},  color:'#607d8b'},
    'aqua+terra':   {name:'Tidal',        emoji:'🌊', sprite:'combo-tidal',        hp:16,atk:6, role:'tank',    spec:{type:'shield',val:4, chance:.5},  color:'#4dd0e1'},
    'terra+vita':   {name:'Overgrowth',   emoji:'🌳', sprite:'combo-overgrowth',   hp:20,atk:4, role:'tank',    spec:{type:'regen', val:3, chance:.6},  color:'#81c784'},
    'lux+umbra':    {name:'Eclipse',      emoji:'🌘', sprite:'combo-eclipse',      hp:12,atk:12,role:'dps',     spec:{type:'dual',  val:3, chance:.4},  color:'#fff9c4'},
    'ignis+umbra':  {name:'Hellfire',     emoji:'👹', sprite:'combo-hellfire',     hp:5, atk:20,role:'dps',     spec:{type:'burn',  val:6, chance:.5},  color:'#ff5252'},
  };

  // ═══════ 3 TIPOS DE INIMIGO ═══════
  const ENEMIES = {
    slime: {name:'Shadow Slime',  emoji:'👾', sprite:'enemy-shadow-slime',  baseHp:4, baseAtk:2},
    golem: {name:'Crystal Golem', emoji:'🗿', sprite:'enemy-crystal-golem', baseHp:8, baseAtk:2},
    beast: {name:'Void Beast',    emoji:'👹', sprite:'enemy-void-beast',    baseHp:5, baseAtk:4},
  };

  const SPEC_INFO = {
    burn:       {icon:'🔥', name:'Queima',   color:'#ff7043'},
    poison:     {icon:'☠️', name:'Veneno',  color:'#76ff03'},
    freeze:     {icon:'❄️', name:'Congela', color:'#80deea'},
    heal:       {icon:'💚', name:'Cura',     color:'#69f0ae'},
    crit:       {icon:'⚡', name:'Crítico',  color:'#ffd600'},
    chain:      {icon:'🔗', name:'Corrente', color:'#607d8b'},
    buff:       {icon:'⬆️', name:'Buff',    color:'#ffd740'},
    debuff:     {icon:'⬇️', name:'Debuff',  color:'#546e7a'},
    chaos:      {icon:'🌀', name:'Caos',     color:'#ce93d8'},
    evade:      {icon:'💨', name:'Esquiva',  color:'#b0bec5'},
    shield:     {icon:'🛡️',name:'Escudo',  color:'#5c6bc0'},
    banish:     {icon:'🕳️',name:'Bane',    color:'#b39ddb'},
    armor_break:{icon:'💥', name:'Destrói',  color:'#c6ff00'},
    regen:      {icon:'🌿', name:'Regenera', color:'#81c784'},
    dual:       {icon:'☯️', name:'Dual',    color:'#fff9c4'},
  };

  const ROLES = {
    tank:    {name:'Tanque',   color:'#5c6bc0', icon:'🛡️'},
    dps:     {name:'DPS',      color:'#f44336', icon:'⚔️'},
    support: {name:'Suporte',  color:'#4caf50', icon:'💚'},
    control: {name:'Controle', color:'#9c27b0', icon:'🌀'},
  };

  function comboKey(t1, t2) { return [t1, t2].sort().join('+'); }
  function findCombo(t1, t2) { return COMBOS[comboKey(t1, t2)] || null; }

  return { PLAYER, FLUIDS, COMBOS, ENEMIES, SPEC_INFO, ROLES, comboKey, findCombo };
})();
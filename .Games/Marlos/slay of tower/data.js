// ═══════════════════════════════════════════════════════════════
// data.js — ALL GAME DATA
// ═══════════════════════════════════════════════════════════════

// ── CANVAS ──
var CN=15,RN=12,CL=50;
var W=CN*CL,H=RN*CL;
var HM=5;

// ── FACTIONS ──
var EI={normal:'\u2694\uFE0F',elite:'\u26A1',boss:'\uD83D\uDC79',shop:'\uD83D\uDED2',event:'\u2753',chest:'\uD83C\uDFF0',skull:'\uD83D\uDC80'};
var ECL={normal:'#888888',elite:'#ff9f43',boss:'#e84855',shop:'#2ecc71',event:'#a29bfe',chest:'#ffd93d',skull:'#e84855'};

var FACTIONS={
  neutral:{name:'Neutro',icon:'\u2694\uFE0F',color:'#888',bonus:null},
  holy:{name:'Sagrado',icon:'\u271D\uFE0F',color:'#ffd93d',bonus:'Torres sagradas +15% dano'},
  abyssal:{name:'Abissal',icon:'\uD83D\uDC79',color:'#9b59b6',bonus:'Dano dark +20%'},
  mechanical:{name:'Mecanico',icon:'\u2699\uFE0F',color:'#74b9ff',bonus:'-15% CD torres'},
  wild:{name:'Selvagem',icon:'\uD83D\uDC3B',color:'#6bcb77',bonus:'Inimigos -10% HP'},
  undead:{name:'Morto-vivo',icon:'\uD83D\uDC80',color:'#e84855',bonus:'Poison +25% duracao'}
};

// ── ENCOUNTERS ──
var ENC={normal:{wv:5,icon:'\u2694\uFE0F',name:'Normal'},elite_enc:{wv:3,icon:'\u26A1',name:'Elite'},boss:{wv:5,icon:'\uD83D\uDC79',name:'Boss'},skull:{wv:7,icon:'\uD83D\uDC80',name:'Chefe'}};

// ── DIFFICULTY ──
var DIFF_MULT={easy:{hp:.7,spd:.8,g:1.2},normal:{hp:1,spd:1,g:1},hard:{hp:1.4,spd:1.15,g:.8},impossible:{hp:2,spd:1.3,g:.6}};

// ── ENEMIES ──
var ENEMIES={
// Basic
crawler:{name:'Rastejante',hp:40,sp:40,g:3,xp:1,cl:'#888',z:.8,faction:'neutral',tags:[],ai:'walker',armor:0,mr:0,fly:0,size:'small'},
runner:{name:'Veloz',hp:25,sp:80,g:4,xp:1,cl:'#e17055',z:.7,faction:'neutral',tags:[],ai:'walker',armor:0,mr:0,fly:0,size:'small'},
tank:{name:'Tanque',hp:120,sp:25,g:6,xp:2,cl:'#636e72',z:1.1,faction:'neutral',tags:[],ai:'walker',armor:8,mr:0,fly:0,size:'medium'},
flyer:{name:'Voador',hp:30,sp:55,g:5,xp:1,cl:'#74b9ff',z:.6,faction:'neutral',tags:[],ai:'walker',armor:0,mr:3,fly:1,size:'small'},
healer:{name:'Curandeira',hp:35,sp:35,g:5,xp:2,cl:'#44ff44',z:.8,faction:'neutral',tags:[],ai:'healer',armor:0,mr:5,fly:0,size:'small',healAura:8,healAuraRange:2},
shielder:{name:'Escudeiro',hp:60,sp:30,g:5,xp:2,cl:'#5bc0ff',z:.9,faction:'neutral',tags:[],ai:'walker',armor:5,mr:5,fly:0,size:'medium',shield:30},
splitter:{name:'Divisor',hp:50,sp:35,g:4,xp:1,cl:'#ff9f43',z:.85,faction:'neutral',tags:[],ai:'walker',armor:3,mr:0,fly:0,size:'medium',summonOnKill:{type:'crawler',count:2}},
stealth:{name:'Fantasma',hp:20,sp:60,g:5,xp:2,cl:'#666688',z:.7,faction:'neutral',tags:[],ai:'walker',armor:0,mr:8,fly:0,size:'small',stealth:true},

// Holy
paladin:{name:'Paladino',hp:90,sp:30,g:7,xp:3,cl:'#ffd93d',z:1,faction:'holy',tags:['holy'],ai:'walker',armor:10,mr:8,fly:0,size:'medium'},
priest:{name:'Sacerdote',hp:45,sp:30,g:6,xp:3,cl:'#ffeaa7',z:.85,faction:'holy',tags:['holy'],ai:'healer',armor:0,mr:12,fly:0,size:'small',healAura:12,healAuraRange:2.5},
angel:{name:'Anjo',hp:60,sp:50,g:8,xp:3,cl:'#fff',z:.9,faction:'holy',tags:['holy','light'],ai:'walker',armor:5,mr:10,fly:1,size:'medium'},

// Abyssal
imp:{name:'Diabrete',hp:25,sp:65,g:5,xp:2,cl:'#9b59b6',z:.65,faction:'abyssal',tags:['demon'],ai:'walker',armor:0,mr:5,fly:0,size:'small'},
demon:{name:'Demônio',hp:100,sp:30,g:8,xp:3,cl:'#6c5ce7',z:1.1,faction:'abyssal',tags:['demon','lava_demon'],ai:'walker',armor:5,mr:10,fly:0,size:'medium'},
shadow:{name:'Sombra',hp:35,sp:55,g:6,xp:2,cl:'#444466',z:.75,faction:'abyssal',tags:['shadow'],ai:'walker',armor:0,mr:15,fly:0,size:'small',stealth:true},
warlock:{name:'Bruxo',hp:50,sp:25,g:7,xp:3,cl:'#a29bfe',z:.9,faction:'abyssal',tags:['demon'],ai:'summoner',armor:0,mr:12,fly:0,size:'medium',summons:{type:'imp',count:2,cooldown:10}},

// Mechanical
drone:{name:'Drone',hp:30,sp:50,g:5,xp:2,cl:'#74b9ff',z:.6,faction:'mechanical',tags:['mechanical'],ai:'walker',armor:8,mr:3,fly:1,size:'small'},
golem:{name:'Golem',hp:150,sp:18,g:8,xp:3,cl:'#636e72',z:1.2,faction:'mechanical',tags:['mechanical'],ai:'walker',armor:15,mr:0,fly:0,size:'large'},
omega:{name:'Omega',hp:200,sp:22,g:10,xp:4,cl:'#dfe6e9',z:1.3,faction:'mechanical',tags:['mechanical'],ai:'walker',armor:20,mr:10,fly:0,size:'large',towerDisable:2},

// Wild
wolf:{name:'Lobo',hp:30,sp:70,g:4,xp:1,cl:'#b2bec3',z:.7,faction:'wild',tags:['beast'],ai:'walker',armor:0,mr:0,fly:0,size:'small'},
treant:{name:'Treant',hp:130,sp:15,g:7,xp:3,cl:'#00b894',z:1.1,faction:'wild',tags:['plant'],ai:'walker',armor:5,mr:8,fly:0,size:'large'},
beast:{name:'Besta',hp:80,sp:45,g:6,xp:2,cl:'#fdcb6e',z:1,faction:'wild',tags:['beast'],ai:'berserker',armor:3,mr:3,fly:0,size:'medium'},

// Undead
skeleton:{name:'Esqueleto',hp:20,sp:45,g:3,xp:1,cl:'#dfe6e9',z:.7,faction:'undead',tags:['undead'],ai:'walker',armor:2,mr:0,fly:0,size:'small'},
zombie:{name:'Zumbi',hp:70,sp:20,g:4,xp:1,cl:'#636e72',z:.85,faction:'undead',tags:['undead'],ai:'walker',armor:0,mr:0,fly:0,size:'medium',re:2},
lich:{name:'Lich',hp:80,sp:25,g:8,xp:3,cl:'#a29bfe',z:.95,faction:'undead',tags:['undead'],ai:'summoner',armor:0,mr:15,fly:0,size:'medium',summons:{type:'skeleton',count:3,cooldown:8}},
wraith:{name:'Espectro',hp:40,sp:60,g:6,xp:2,cl:'#666688',z:.7,faction:'undead',tags:['undead','ghost'],ai:'walker',armor:0,mr:20,fly:0,size:'small',stealth:true},

// ── ELITES ──
elite_crawler:{name:'Crawler Alpha',hp:150,sp:50,g:15,xp:5,cl:'#ff9f43',z:1,faction:'neutral',tags:[],ai:'walker',armor:5,mr:5,fly:0,size:'medium',elite:true},
elite_demon:{name:'Demonio Menor',hp:250,sp:35,g:20,xp:6,cl:'#e84855',z:1.1,faction:'abyssal',tags:['demon'],ai:'berserker',armor:8,mr:12,fly:0,size:'medium',elite:true},
elite_golem:{name:'Golem Antigo',hp:400,sp:20,g:25,xp:7,cl:'#b2bec3',z:1.3,faction:'mechanical',tags:['mechanical'],ai:'walker',armor:25,mr:5,fly:0,size:'large',elite:true},
elite_lich:{name:'Arquimago',hp:200,sp:30,g:20,xp:6,cl:'#a29bfe',z:1,faction:'undead',tags:['undead'],ai:'summoner',armor:0,mr:20,fly:0,size:'medium',elite:true,summons:{type:'skeleton',count:2,cooldown:6}},

// ── BOSSES ──
boss_lich:{name:'Rei Lich',hp:800,sp:20,g:50,xp:20,cl:'#a29bfe',z:1.5,faction:'undead',tags:['undead','boss'],ai:'boss',armor:5,mr:25,fly:0,size:'giant',bo:true,phases:1,bossDrop:'crown_lich',
  summons:{type:'skeleton',count:3,cooldown:6},abilityCDs:[]},
boss_omega:{name:'Omega Supremo',hp:1200,sp:15,g:60,xp:25,cl:'#dfe6e9',z:1.6,faction:'mechanical',tags:['mechanical','boss'],ai:'boss',armor:30,mr:15,fly:0,size:'giant',bo:true,phases:1,bossDrop:'nucleo_mecanico',
  towerDisable:3,summons:{type:'drone',count:2,cooldown:8}},
boss_treant:{name:'Treant Ancestral',hp:1000,sp:12,g:55,xp:22,cl:'#00b894',z:1.7,faction:'wild',tags:['plant','boss'],ai:'boss',armor:10,mr:15,fly:0,size:'giant',bo:true,phases:1,bossDrop:'semente_ancestral',
  healAura:15,healAuraRange:3,summons:{type:'wolf',count:3,cooldown:7}},
boss_demon:{name:'Senhor Demônio',hp:1500,sp:18,g:70,xp:30,cl:'#e84855',z:1.8,faction:'abyssal',tags:['demon','lava_demon','boss'],ai:'boss',armor:15,mr:20,fly:0,size:'giant',bo:true,phases:2,bossDrop:'chifre_demoniaco',
  auraDmg:5,auraRange:2,summons:{type:'warlock',count:1,cooldown:12}}
};

// ═══════════════════ STATUS DATABASE (GDD Cap.2) ═══════════════════

var STATUS_DB={
burn:{name:'Burn',desc:'Em chamas.',cat:'dot',positive:false,canStack:true,maxStacks:20,tickRate:.5,baseDmg:2,baseDur:3,priority:5,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:['fire_elemental','lava_demon'],interactions:{removes:['freeze'],consumes:['wet']},visual:{color:'#ff6600',icon:'\uD83D\uDD25'}},
poison:{name:'Poison',desc:'Veneno. Ignora armadura.',cat:'dot',positive:false,canStack:true,maxStacks:99,tickRate:.5,baseDmg:1.5,baseDur:4,priority:3,refreshRule:'refresh',bossMult:.75,eliteMult:1,immune:[],interactions:{},visual:{color:'#6bcb77',icon:'\u2620\uFE0F'}},
bleed:{name:'Bleed',desc:'Sangramento.',cat:'dot',positive:false,canStack:true,maxStacks:30,tickRate:.5,baseDmg:2.5,baseDur:3,priority:2,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:['undead','mechanical'],interactions:{},visual:{color:'#e84855',icon:'\u2764\uFE0F'}},
toxic_burn:{name:'Toxic Burn',desc:'Queima toxica.',cat:'dot',positive:false,canStack:true,maxStacks:10,tickRate:.5,baseDmg:4,baseDur:3,priority:6,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#44aa44',icon:'\u2622\uFE0F'}},
corruption:{name:'Corruption',desc:'Corrupcao.',cat:'curse',positive:false,canStack:true,maxStacks:20,tickRate:1,baseDmg:1,baseDur:5,priority:4,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{onDeath:'spread_corruption'},visual:{color:'#662266',icon:'\uD83D\uDC80'}},
freeze:{name:'Freeze',desc:'Congelado.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:2,priority:10,refreshRule:'ignore',bossMult:.3,eliteMult:.6,immune:['ice_elemental'],interactions:{removedBy:['burn'],appliesOnEnd:'slow'},visual:{color:'#74b9ff',icon:'\u2744\uFE0F'}},
slow:{name:'Slow',desc:'Lentidao.',cat:'cc',positive:false,canStack:true,maxStacks:1,tickRate:0,baseDmg:0,baseDur:3,priority:1,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{maxEffect:.8,minSpeed:.2},visual:{color:'#74b9ff',icon:'\u23F1\uFE0F'}},
stun:{name:'Stun',desc:'Atordoado.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:1.5,priority:9,refreshRule:'refresh',bossMult:.25,eliteMult:.5,immune:[],interactions:{},visual:{color:'#ffd93d',icon:'\u2B50'}},
root:{name:'Root',desc:'Enraizado.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:2,priority:7,refreshRule:'refresh',bossMult:.3,eliteMult:.6,immune:[],interactions:{},visual:{color:'#3d5c3d',icon:'\uD83C\uDF33'}},
fear:{name:'Fear',desc:'Medo.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:2,priority:8,refreshRule:'refresh',bossMult:0,eliteMult:.5,immune:[],interactions:{bossConverts:'slow',failsWith:['root']},visual:{color:'#6666aa',icon:'\uD83D\uDC7B'}},
sleep:{name:'Sleep',desc:'Dormindo.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:11,refreshRule:'ignore',bossMult:0,eliteMult:0,immune:[],interactions:{breakOnDamage:true},visual:{color:'#dfe6e9',icon:'\uD83D\uDCA4'}},
confusion:{name:'Confusion',desc:'Confuso.',cat:'cc',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:3,priority:6,refreshRule:'refresh',bossMult:0,eliteMult:.5,immune:[],interactions:{},visual:{color:'#e17055',icon:'\uD83D\uDD73\uFE0F'}},
shock:{name:'Shock',desc:'Choque.',cat:'debuff',positive:false,canStack:true,maxStacks:10,tickRate:0,baseDmg:0,baseDur:4,priority:4,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#ffd93d',icon:'\u26A1'}},
silence:{name:'Silence',desc:'Silenciado.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:3,priority:5,refreshRule:'refresh',bossMult:.4,eliteMult:.7,immune:[],interactions:{},visual:{color:'#636e72',icon:'\uD83D\uDD07'}},
blind:{name:'Blind',desc:'Cego.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:3,priority:3,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#2d3436',icon:'\uD83D\uDE36\u200D\uD83C\uDF2B\uFE0F'}},
curse:{name:'Curse',desc:'Maldicao.',cat:'debuff',positive:false,canStack:true,maxStacks:10,tickRate:0,baseDmg:0,baseDur:5,priority:4,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#5b3b8b',icon:'\uD83D\uDC80'}},
exposed:{name:'Exposed',desc:'Exposto.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:3,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#d63031',icon:'\u26A0\uFE0F'}},
vulnerable:{name:'Vulnerable',desc:'Vulneravel.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:4,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#e84855',icon:'\uD83D\uDCA2'}},
weak:{name:'Weak',desc:'Fraco.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:2,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#ff44aa',icon:'\uD83D\uDCAA'}},
fragile:{name:'Fragile',desc:'Fragil.',cat:'debuff',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:3,refreshRule:'refresh',bossMult:.5,eliteMult:.75,immune:[],interactions:{},visual:{color:'#fab1a0',icon:'\uD83D\uDC94'}},
wet:{name:'Wet',desc:'Molhado.',cat:'utility',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:1,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#74b9ff',icon:'\uD83D\uDCA7'}},
oil:{name:'Oil',desc:'Oleo.',cat:'utility',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:6,priority:1,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#8b6914',icon:'\uD83E\uDDF2'}},
mark:{name:'Mark',desc:'Marcado.',cat:'utility',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:6,priority:2,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#ff9f43',icon:'\uD83C\uDFAF'}},
infection:{name:'Infection',desc:'Infectado.',cat:'curse',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:10,priority:3,refreshRule:'refresh',bossMult:0,eliteMult:.5,immune:[],interactions:{onDeath:'spread_poison'},visual:{color:'#44aa44',icon:'\uD83E\uDDA0'}},
shield:{name:'Shield',desc:'Escudo.',cat:'defense',positive:true,canStack:true,maxStacks:1,tickRate:0,baseDmg:0,baseDur:99,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#5bc0ff',icon:'\uD83D\uDEE1\uFE0F'}},
barrier:{name:'Barrier',desc:'Barreira.',cat:'defense',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:99,priority:0,refreshRule:'ignore',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#a29bfe',icon:'\uD83D\uDEE1\uFE0F'}},
invulnerable:{name:'Invulnerable',desc:'Invulneravel.',cat:'defense',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:2,priority:99,refreshRule:'ignore',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#ffd93d',icon:'\u2728'}},
regen:{name:'Regen',desc:'Regeneracao.',cat:'buff',positive:true,canStack:true,maxStacks:5,tickRate:1,baseDmg:0,baseDur:5,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#44ff44',icon:'\u2764\uFE0F'}},
haste:{name:'Haste',desc:'Acelerado.',cat:'buff',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#00cec9',icon:'\u23E9'}},
reflect:{name:'Reflect',desc:'Reflete dano.',cat:'defense',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#a29bfe',icon:'\uD83D\uDD04'}},
stone:{name:'Stone',desc:'Pedra.',cat:'transform',positive:false,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:8,refreshRule:'ignore',bossMult:0,eliteMult:0,immune:[],interactions:{},visual:{color:'#888899',icon:'\uD83E\uDEA8'}},
lifesteal:{name:'Lifesteal',desc:'Roubo de vida.',cat:'buff',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#9b59b6',icon:'\uD83E\uDDDB'}},
rage:{name:'Rage',desc:'Furia.',cat:'buff',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:6,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#e84855',icon:'\uD83D\uDD25'}},
berserk:{name:'Berserk',desc:'Frenesi.',cat:'buff',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:99,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#ff3838',icon:'\uD83D\uDCA2'}},
arcane_charge:{name:'Arcane Charge',desc:'Carga Arcana.',cat:'buff',positive:true,canStack:true,maxStacks:10,tickRate:0,baseDmg:0,baseDur:8,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{},visual:{color:'#a29bfe',icon:'\uD83D\uDD2E'}},
holy_blessing:{name:'Holy Blessing',desc:'Bencao.',cat:'blessing',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:5,priority:0,refreshRule:'refresh',bossMult:1,eliteMult:1,immune:[],interactions:{removesAllDebuffs:true},visual:{color:'#ffd93d',icon:'\u271D\uFE0F'}},
taunt:{name:'Taunt',desc:'Provocacao.',cat:'utility',positive:true,canStack:false,maxStacks:1,tickRate:0,baseDmg:0,baseDur:4,priority:0,refreshRule:'refresh',bossMult:0,eliteMult:0,immune:[],interactions:{},visual:{color:'#ff9f43',icon:'\uD83D\uDDE3\uFE0F'}}
};
var STATUS_ORDER=['buff','debuff','cc','dot','defense','utility','transform','curse','blessing','summon'];

// ═══════════════════ RELICS (GDD Cap.3) ═══════════════════

var RELICS={
bolsa_mercador:{n:'Bolsa do Mercador',ic:'\uD83D\uDCB0',d:'+100 ouro inicio.',cat:'economia',rarity:'common',effect:'startGold',value:100,trigger:'start',unique:false,corrupted:false},
moeda_antiga:{n:'Moeda Antiga',ic:'\uD83E\uDE99',d:'+1 ouro por kill.',cat:'economia',rarity:'common',effect:'killGold',value:1,trigger:'on_kill',unique:false,corrupted:false},
bolsa_sem_fundo:{n:'Bolsa Sem Fundo',ic:'\uD83C\uDF92',d:'Sem limite ouro.',cat:'economia',rarity:'epic',effect:'noGoldCap',value:1,trigger:'passive',unique:true,corrupted:false},
coroa_comerciante:{n:'Coroa Comerciante',ic:'\uD83D\uDC51',d:'Loja -15%.',cat:'loja',rarity:'rare',effect:'shopDiscount',value:.15,trigger:'passive',unique:false,corrupted:false},
livro_descontos:{n:'Livro Descontos',ic:'\uD83D\uDCD6',d:'Compra -1 proxima.',cat:'loja',rarity:'rare',effect:'shopCascade',value:1,trigger:'on_buy',unique:false,corrupted:false},
selo_comprador:{n:'Selo Comprador',ic:'\uD83D\uDCE3',d:'+1 carta loja.',cat:'loja',rarity:'uncommon',effect:'shopExtra',value:1,trigger:'passive',unique:false,corrupted:false},
biblioteca_infinita:{n:'Biblioteca Infinita',ic:'\uD83D\uDCDA',d:'10% carta evolui.',cat:'loja',rarity:'legendary',effect:'shopUpgrade',value:.1,trigger:'on_buy',unique:true,corrupted:false},
lente_cacador:{n:'Lente Cacador',ic:'\uD83D\uDD2D',d:'+25% crit.',cat:'ataque',rarity:'rare',effect:'critBoost',value:.25,trigger:'passive',unique:false,corrupted:false},
martelo_ancestral:{n:'Martelo Ancestral',ic:'\uD83D\uDD28',d:'Perfurante explode.',cat:'ataque',rarity:'epic',effect:'pierceExplosion',value:.6,trigger:'on_hit',unique:false,corrupted:false},
coracao_tita:{n:'Coracao Tita',ic:'\u2764\uFE0F',d:'Torres grandes +40%.',cat:'ataque',rarity:'legendary',effect:'giantBoost',value:.4,trigger:'passive',unique:true,corrupted:false},
olho_cacador:{n:'Olho Cacador',ic:'\uD83D\uDC41\uFE0F',d:'+25% dano >90% HP.',cat:'ataque',rarity:'uncommon',effect:'highHpBonus',value:.25,trigger:'on_hit',unique:false,corrupted:false},
bandeira_guerra:{n:'Bandeira Guerra',ic:'\uD83C\uDFF4',d:'Kill -> adjacentes +5% spd.',cat:'ataque',rarity:'rare',effect:'killSpeedBuff',value:.05,trigger:'on_kill',unique:false,corrupted:false},
coroa_tempestade:{n:'Coroa Tempestade',ic:'\u26C8\uFE0F',d:'10% raio no kill.',cat:'ataque',rarity:'epic',effect:'killLightning',value:.1,trigger:'on_kill',unique:false,corrupted:false},
mascara_vampiro:{n:'Mascara Vampiro',ic:'\uD83E\uDDDB',d:'3% lifesteal torres.',cat:'ataque',rarity:'epic',effect:'towerLifesteal',value:.03,trigger:'on_hit',unique:false,corrupted:false},
escama_carmesim:{n:'Escama Carmesim',ic:'\uD83D\uDC0D',d:'Burn +50% dur.',cat:'status',rarity:'legendary',effect:'burnBoost',value:.5,trigger:'on_status',unique:true,corrupted:false},
fragmento_glacial:{n:'Fragmento Glacial',ic:'\u2744\uFE0F',d:'Freeze +50%.',cat:'status',rarity:'legendary',effect:'freezeBoost',value:.5,trigger:'on_status',unique:true,corrupted:false},
nucleo_eletrico:{n:'Nucleo Eletrico',ic:'\u26A1',d:'Shock +1 ricochete.',cat:'status',rarity:'epic',effect:'shockChain',value:1,trigger:'on_status',unique:false,corrupted:false},
veneno_absoluto:{n:'Veneno Absoluto',ic:'\u2620\uFE0F',d:'Poison ignora resist.',cat:'status',rarity:'legendary',effect:'poisonPierce',value:.25,trigger:'on_status',unique:true,corrupted:false},
chama_eterna:{n:'Chama Eterna',ic:'\uD83D\uDD25',d:'Burn permanente.',cat:'status',rarity:'legendary',effect:'burnPermanent',value:1,trigger:'on_status',unique:true,corrupted:false},
cristal_prismatico:{n:'Cristal Prismatico',ic:'\uD83D\uDC8E',d:'20% status extra.',cat:'status',rarity:'divine',effect:'statusPrism',value:.2,trigger:'on_status',unique:true,corrupted:false},
cristal_arcano:{n:'Cristal Arcano',ic:'\uD83D\uDD2E',d:'Magias +30% range.',cat:'magia',rarity:'rare',effect:'spellBoost',value:.3,trigger:'passive',unique:false,corrupted:false},
grimorio_vivo:{n:'Grimorio Vivo',ic:'\uD83D\uDCD5',d:'20% magia gratis.',cat:'magia',rarity:'epic',effect:'spellFree',value:.2,trigger:'on_cast',unique:false,corrupted:false},
tomo_sabedoria:{n:'Tomo Sabedoria',ic:'\uD83D\uDCD3',d:'Magica +1lv.',cat:'magia',rarity:'uncommon',effect:'spellLevel',value:1,trigger:'on_acquire',unique:false,corrupted:false},
espelho_arcano:{n:'Espelho Arcano',ic:'\uD83D\uDD2E',d:'Copia magia 30%.',cat:'magia',rarity:'legendary',effect:'spellMirror',value:.3,trigger:'on_cast',unique:true,corrupted:false},
relogio_antigo:{n:'Relogio Antigo',ic:'\u231A',d:'30s -> desacelera 4s.',cat:'tempo',rarity:'rare',effect:'timeSlow',value:30,trigger:'periodic',unique:false,corrupted:false},
ampulheta_quebrada:{n:'Ampulheta',ic:'\u231B',d:'-20% cooldowns.',cat:'tempo',rarity:'legendary',effect:'cdReduction',value:.2,trigger:'passive',unique:true,corrupted:false},
nucleo_temporal:{n:'Nucleo Temporal',ic:'\u23F0',d:'Kill elite -> refresh.',cat:'tempo',rarity:'divine',effect:'eliteRefresh',value:1,trigger:'on_elite_kill',unique:true,corrupted:false},
semente_primordial:{n:'Semente Primordial',ic:'\uD83C\uDF31',d:'Cura dobrada.',cat:'defesa',rarity:'rare',effect:'doubleHeal',value:2,trigger:'passive',unique:false,corrupted:false},
olho_verdade:{n:'Olho Verdade',ic:'\uD83D\uDC41',d:'Revela furtivos.',cat:'controle',rarity:'epic',effect:'revealStealth',value:1,trigger:'passive',unique:false,corrupted:false},
anel_eco:{n:'Anel do Eco',ic:'\uD83D\uDC8D',d:'15% repetir skill.',cat:'controle',rarity:'epic',effect:'skillEcho',value:.15,trigger:'on_skill',unique:false,corrupted:false},
nucleo_deserto:{n:'Nucleo Deserto',ic:'\u2B50',d:'Lentos +10% dano.',cat:'controle',rarity:'epic',effect:'slowBonus',value:.1,trigger:'on_hit',unique:false,corrupted:false},
coracao_sombrio:{n:'Coracao Sombrio',ic:'\uD83D\uDC80',d:'Boss kill +5% dmg.',cat:'boss',rarity:'legendary',effect:'bossKillBoost',value:.05,trigger:'on_boss_kill',unique:false,corrupted:false},
fragmento_abismo:{n:'Fragmento Abismo',ic:'\uD83D\uDD73\uFE0F',d:'Elite/Boss -10% CC resist.',cat:'boss',rarity:'legendary',effect:'bossControl',value:.1,trigger:'passive',unique:true,corrupted:false},
reliquia_corrompida:{n:'Reliquia Corrompida',ic:'\uD83D\uDC80',d:'+20% inim, +30% ouro, +15% dmg.',cat:'corrupta',rarity:'corrupted',effect:'corrupted_basic',value:.2,trigger:'passive',unique:false,corrupted:true},
calice_maldito:{n:'Calice Maldito',ic:'\uD83C\uDF77',d:'Magias -1 mana, -1HP.',cat:'corrupta',rarity:'corrupted',effect:'corrupted_mana',value:1,trigger:'on_cast',unique:false,corrupted:true},
orbe_caos:{n:'Orbe Caos',ic:'\uD83C\uDF00',d:'60s -> evento aleatorio.',cat:'corrupta',rarity:'unique',effect:'chaos_orb',value:60,trigger:'periodic',unique:true,corrupted:true},
caixa_pandora:{n:'Caixa Pandora',ic:'\uD83C\uDF81',d:'Ao obter: +3 reliquias.',cat:'corrupta',rarity:'unique',effect:'pandora',value:3,trigger:'on_acquire',unique:true,corrupted:true},
crown_lich:{n:'Coroa do Lich',ic:'\uD83D\uDC51',d:'+30% dano torres.',cat:'ataque',rarity:'legendary',effect:'twDmg',value:.3,trigger:'passive',unique:true,corrupted:false},
nucleo_mecanico:{n:'Nucleo Omega',ic:'\u2699\uFE0F',d:'-20% CD torres.',cat:'tempo',rarity:'legendary',effect:'twCd',value:.2,trigger:'passive',unique:true,corrupted:false},
semente_ancestral:{n:'Semente Ancestral',ic:'\uD83C\uDF31',d:'+20 HP max.',cat:'defesa',rarity:'legendary',effect:'maxHp',value:20,trigger:'start',unique:true,corrupted:false},
chifre_demoniaco:{n:'Chifre Demônio',ic:'\uD83D\uDE08',d:'+50% dano boss.',cat:'boss',rarity:'legendary',effect:'bossDmg',value:.5,trigger:'passive',unique:true,corrupted:false},
mana_crystal:{n:'Cristal Mana',ic:'\uD83D\uDC8E',d:'+1 mana.',cat:'magia',rarity:'rare',effect:'maxMana',value:1,trigger:'start',unique:false,corrupted:false},
war_drum:{n:'Tambor',ic:'\uD83E\uDD41',d:'+20% dano torres.',cat:'ataque',rarity:'rare',effect:'twDmg',value:.2,trigger:'passive',unique:false,corrupted:false},
swift_totem:{n:'Totem',ic:'\uD83C\uDFC3',d:'+20% spd torres.',cat:'ataque',rarity:'rare',effect:'twSpd',value:.2,trigger:'passive',unique:false,corrupted:false},
golden_clover:{n:'Trevo',ic:'\uD83C\uDF40',d:'+3 ouro/onda.',cat:'economia',rarity:'rare',effect:'wvGold',value:3,trigger:'passive',unique:false,corrupted:false},
arcane_lens:{n:'Lente Arcana',ic:'\uD83D\uDD0D',d:'+25% range torres.',cat:'ataque',rarity:'rare',effect:'twRng',value:.25,trigger:'passive',unique:false,corrupted:false},
lucky_ring:{n:'Anel Sorte',ic:'\uD83D\uDC8D',d:'+5 ouro/no.',cat:'economia',rarity:'rare',effect:'ndGold',value:5,trigger:'passive',unique:false,corrupted:false},
blood_gem:{n:'Gema Sangrenta',ic:'\uD83E\uDE78',d:'+1 dmg/onda torres.',cat:'ataque',rarity:'rare',effect:'stkDmg',value:1,trigger:'on_wave',unique:false,corrupted:false},
golden_key:{n:'Chave Ouro',ic:'\uD83D\uDD11',d:'+2 locks.',cat:'controle',rarity:'rare',effect:'maxLocks',value:2,trigger:'passive',unique:false,corrupted:false},
infinite_key:{n:'Chave Infinita',ic:'\uD83D\uDDDD\uFE0F',d:'Locks infinitos.',cat:'controle',rarity:'legendary',effect:'infLocks',value:1,trigger:'passive',unique:true,corrupted:false},
crown_thorns:{n:'Coroa Espinhos',ic:'\uD83D\uDC51',d:'-8HP inimigos.',cat:'ataque',rarity:'rare',effect:'spawnDmg',value:8,trigger:'on_spawn',unique:false,corrupted:false},
eternity_glass:{n:'Vidro Eterno',ic:'\u231B',d:'+2 mana inicial.',cat:'magia',rarity:'rare',effect:'startMana',value:2,trigger:'start',unique:false,corrupted:false},
blood_chalice:{n:'Calice Sangue',ic:'\uD83C\uDFC6',d:'Torres curam 0.5/kill.',cat:'ataque',rarity:'rare',effect:'twHeal',value:.5,trigger:'on_kill',unique:false,corrupted:false},
doom_clock:{n:'Relogio Morte',ic:'\uD83D\uDC80',d:'+50%dmg, -20HP.',cat:'corrupta',rarity:'corrupted',effect:'doomClock',value:.5,trigger:'start',unique:true,corrupted:true}
};

// ═══════════════════ EVENTS (GDD Cap.3) ═══════════════════

var EVENTS_DATA=[
{id:'bau_misterioso',title:'Ba\u00FA Misterioso',description:'Um ba\u00FA lacrado com runas.',type:'bau',rarity:'common',choices:[{text:'Abrir (gratis)',fn:'bau_gratis'},{text:'Abrir pagando 15$',fn:'bau_pago',cost:15},{text:'Ignorar',fn:'nothing'}]},
{id:'altar_antigo',title:'Altar Antigo',description:'Um altar pede sacrificio.',type:'global',rarity:'common',choices:[{text:'-10HP -> reliquia rara',fn:'altar_sacrifice'},{text:'-25$ -> 2 cartas',fn:'altar_magic',cost:25},{text:'Ignorar',fn:'nothing'}]},
{id:'fonte_arcana',title:'Fonte Arcana',description:'Energia magica.',type:'global',rarity:'common',choices:[{text:'+3 mana, -5HP',fn:'fonte_mana'},{text:'1 reliquia comum',fn:'fonte_relic_common'},{text:'+15 HP',fn:'heal15'}]},
{id:'acampamento',title:'Acampamento',description:'Local seguro.',type:'global',rarity:'common',choices:[{text:'Curar 20 HP',fn:'heal20'},{text:'Melhorar 1 carta',fn:'uprandom'},{text:'Remover 1 carta',fn:'remove_card'}]},
{id:'festival',title:'Festival',description:'Festival de cartas.',type:'global',rarity:'common',choices:[{text:'Escolher 1 de 3',fn:'festival_cards'},{text:'1 reliquia comum',fn:'fonte_relic_common'},{text:'+30 ouro',fn:'gold30'}]},
{id:'maquina_estranha',title:'Maquina',description:'Maquina de sucata.',type:'global',rarity:'common',choices:[{text:'20$ -> carta',fn:'maquina_20',cost:20},{text:'40$ -> carta rara',fn:'maquina_40',cost:40},{text:'Desligar',fn:'nothing'}]},
{id:'ferreiro',title:'Ferreiro',description:'Melhorar ou destruir.',type:'loja',rarity:'uncommon',choices:[{text:'Melhorar 1',fn:'uprandom'},{text:'Destruir -> 50$',fn:'ferreiro_destroy'},{text:'Melhorar 2, -10HP',fn:'ferreiro_double'}]},
{id:'poco_misterioso',title:'Poco',description:'Brilho estranho.',type:'global',rarity:'uncommon',choices:[{text:'20$ (50% 35$)',fn:'poco_20',cost:20},{text:'40$ (50% reliquia)',fn:'poco_40',cost:40},{text:'Ignorar',fn:'nothing'}]},
{id:'ruinas',title:'Ruinas',description:'Ruinas esquecidas.',type:'mapa',rarity:'uncommon',choices:[{text:'Explorar (50% reliquia)',fn:'ruinas_explore'},{text:'Reforcar (-10% spd)',fn:'ruinas_reinforce'},{text:'Ignorar',fn:'nothing'}]},
{id:'eclipse',title:'Eclipse',description:'A luz some.',type:'global',rarity:'uncommon',choices:[{text:'Aceitar (+25% range luz)',fn:'eclipse_accept'},{text:'Resistir (-10HP, carta)',fn:'eclipse_resist'}]},
{id:'lua_vermelha',title:'Lua Vermelha',description:'Lua fica vermelha.',type:'global',rarity:'uncommon',choices:[{text:'Aceitar (+20% ouro)',fn:'lua_accept'},{text:'Quebrar (elite)',fn:'lua_break'}]},
{id:'chuva_dourada',title:'Chuva Dourada',description:'Chuva de ouro.',type:'global',rarity:'uncommon',choices:[{text:'Coletar (+50$)',fn:'chuva_collect'},{text:'Ignorar',fn:'nothing'}]},
{id:'aposta',title:'Aposta',description:'Comerciante propoe.',type:'global',rarity:'uncommon',choices:[{text:'25$ (50% 60$)',fn:'aposta_25',cost:25},{text:'50$ (50% reliquia)',fn:'aposta_50',cost:50},{text:'Nao',fn:'nothing'}]},
{id:'mercador_ambulante',title:'Mercador',description:'Vendedor fora da loja.',type:'loja',rarity:'rare',choices:[{text:'Item (25$)',fn:'mercador_buy',cost:25},{text:'Vender carta (x2)',fn:'mercador_sell'},{text:'Roubar (elite)',fn:'mercador_steal'}]},
{id:'portal',title:'Portal',description:'Portal instavel.',type:'mapa',rarity:'rare',choices:[{text:'Entrar (+recompensa)',fn:'portal_enter'},{text:'Selar (carta rara)',fn:'portal_seal'},{text:'Ignorar',fn:'nothing'}]},
{id:'arena',title:'Arena',description:'Combate opcional.',type:'batalha',rarity:'rare',choices:[{text:'Lutar (Elite->reliquia)',fn:'arena_enter'},{text:'Recusar (-10$)',fn:'arena_refuse'}]},
{id:'ritual',title:'Ritual',description:'Ritual sombrio.',type:'global',rarity:'rare',choices:[{text:'Comum->Rara',fn:'ritual_upgrade'},{text:'-15HP->reliquia rara',fn:'ritual_hp'},{text:'Recusar',fn:'nothing'}]},
{id:'santuario',title:'Santuario',description:'Purificacao.',type:'global',rarity:'epic',choices:[{text:'Remover corrompida',fn:'santuario_purify'},{text:'+20HP, remover carta',fn:'santuario_heal'},{text:'Ignorar',fn:'nothing'}]},
{id:'corrupcao',title:'Corrupcao',description:'Area contaminada.',type:'global',rarity:'epic',choices:[{text:'Aceitar (+15%dmg, maldicao)',fn:'corrupcao_aceitar'},{text:'Resistir (-10HP, reliquia)',fn:'corrupcao_resistir'}]},
{id:'templo',title:'Templo',description:'Templo testa voce.',type:'global',rarity:'epic',choices:[{text:'Desafio (reliquia epica)',fn:'templo_challenge'},{text:'Pagar 30$',fn:'templo_pay',cost:30},{text:'Ignorar',fn:'nothing'}]},
{id:'o_viajante',title:'Viajante',description:'Estranho oferece troca.',type:'global',rarity:'epic',choices:[{text:'Trocar reliquia',fn:'viajante_relic'},{text:'Trocar carta',fn:'viajante_card'},{text:'Recusar',fn:'nothing'}]},
{id:'o_colecionador',title:'Colecionador',description:'Quer sua peca.',type:'secreto',rarity:'secret',choices:[{text:'Reliquia->superior',fn:'colecionador_relic'},{text:'Carta rara->epica',fn:'colecionador_card'},{text:'Recusar',fn:'nothing'}]},
{id:'o_vazio',title:'O Vazio',description:'Buraco negro.',type:'secreto',rarity:'secret',choices:[{text:'Todas reliquias->unica',fn:'vazio_all'},{text:'Metade ouro',fn:'vazio_gold'},{text:'Sair',fn:'nothing'}]},
{id:'o_desenvolvedor',title:'Desenvolvedor',description:'Observa a Run.',type:'secreto',rarity:'secret',choices:[{text:'Pedir ajuda (3 lendarias)',fn:'dev_help'},{text:'Desafio (boss)',fn:'dev_challenge'},{text:'Ir embora',fn:'nothing'}]},
{id:'a_divindade',title:'Divindade',description:'Bencao elemental.',type:'secreto',rarity:'secret',choices:[{text:'Fogo (+1lv fire)',fn:'divindade_fire'},{text:'Gelo (+1lv ice)',fn:'divindade_ice'},{text:'Raio (+1lv lightning)',fn:'divindade_lightning'}]}
];

// ═══════════════════ POTIONS ═══════════════════

var POTS={
heal_pot:{n:'Pocao Vida',ic:'\uD83E\uDDEA',d:'+30 HP.',type:'heal',value:30},
rage_pot:{n:'Pocao Furia',ic:'\uD83C\uDF77',d:'Torres +30% 10s.',type:'buff',value:.3,dur:10},
shield_pot:{n:'Pocao Escudo',ic:'\uD83E\uDDF2',d:'+25 escudo.',type:'shield',value:25},
gold_pot:{n:'Pocao Ouro',ic:'\uD83E\uDDFA',d:'+30 ouro.',type:'gold',value:30},
mana_pot:{n:'Pocao Mana',ic:'\uD83D\uDD2E',d:'+3 mana.',type:'mana',value:3}
};
// ═══════════════════════════════════════════════════════════════
// cards.js — CAR DATABASE & CARD UTILITIES
// ═══════════════════════════════════════════════════════════════

var STAR_COST=[0,5,10,20,35,50];
var RARITY_COST={common:10,rare:20,epic:35,legendary:80};
var PRIO_ORDER=['nearest','strongest','weakest','fastest','first','boss'];

var CARDS={

// ═══════════════════ TOWERS ═══════════════════

archer:{name:'Arqueiro',icon:'\uD83C\uDFF9',desc:'Torre basica. Dano fisico rapido.',type:'tower',sub:'damage',
  rarity:'common',cost:1,color:'#2ecc71',shape:'triangle',
  dmg:8,range:3,spd:1.2,dmgType:'physical'},

mage:{name:'Mago',icon:'\uD83D\uDD2E',desc:'Dano magico.',type:'tower',sub:'damage',
  rarity:'common',cost:1,color:'#9b59b6',shape:'diamond',
  dmg:10,range:2.5,spd:.8,dmgType:'magical'},

cannon:{name:'Canhao',icon:'\uD83D\uDCA3',desc:'Dano em area.',type:'tower',sub:'damage',
  rarity:'rare',cost:2,color:'#e74c3c',shape:'circle',
  dmg:15,range:2,spd:.5,dmgType:'physical',splDmg:10,splRad:1.5},

tesla:{name:'Tesla',icon:'\u26A1',desc:'Corrente eletrica.',type:'tower',sub:'damage',
  rarity:'rare',cost:2,color:'#ffd93d',shape:'star',
  dmg:12,range:2.5,spd:.7,dmgType:'lightning',chain:3,chainRange:2},

ice_tower:{name:'Torre de Gelo',icon:'\u2744\uFE0F',desc:'Congela inimigos.',type:'tower',sub:'status',
  rarity:'rare',cost:2,color:'#74b9ff',shape:'hexagon',
  dmg:5,range:2.5,spd:.6,dmgType:'ice',slow:.4,slowDur:2,freeze:true,freezeDur:1.5},

fire_tower:{name:'Torre de Fogo',icon:'\uD83D\uDD25',desc:'Area de queimadura.',type:'tower',sub:'damage',
  rarity:'rare',cost:2,color:'#ff6600',shape:'circle',
  dmg:6,range:2,spd:.5,dmgType:'fire',splDmg:4,splRad:1.2,burnDmg:3,burnDur:3},

poison_tower:{name:'Torre de Veneno',icon:'\u2620\uFE0F',desc:'Veneno acumulativo.',type:'tower',sub:'status',
  rarity:'rare',cost:2,color:'#6bcb77',shape:'hexagon',
  dmg:4,range:2.5,spd:.8,dmgType:'physical',poisonDmg:2,poisonDur:4},

sniper:{name:'Atirador',icon:'\uD83C\uDFAF',desc:'Longo alcance, alto dano.',type:'tower',sub:'damage',
  rarity:'rare',cost:2,color:'#d4a843',shape:'diamond',
  dmg:30,range:5,spd:.3,dmgType:'physical'},

farm:{name:'Fazenda',icon:'\uD83C\uDF3E',desc:'Gera ouro por onda.',type:'tower',sub:'farm',
  rarity:'common',cost:1,color:'#ffd93d',shape:'circle',
  dmg:0,range:0,spd:0,dmgType:'physical',farmGold:3},

bleed_tower:{name:'Torre Sangrenta',icon:'\u2764\uFE0F',desc:'Sangramento.',type:'tower',sub:'status',
  rarity:'rare',cost:2,color:'#e84855',shape:'triangle',
  dmg:7,range:2.5,spd:.9,dmgType:'physical',bleedDmg:3,bleedDur:3},

holy_tower:{name:'Torre Sagrada',icon:'\u271D\uFE0F',desc:'Dano sagrado. Ignora armadura.',type:'tower',sub:'damage',
  rarity:'epic',cost:3,color:'#ffd93d',shape:'star',
  dmg:18,range:3,spd:.6,dmgType:'holy',armPrc:true},

shadow_tower:{name:'Torre Sombria',icon:'\uD83D\uDC7B',desc:'Dano escuro. Perfurante.',type:'tower',sub:'damage',
  rarity:'epic',cost:3,color:'#6c5ce7',shape:'diamond',
  dmg:14,range:3,spd:.8,dmgType:'dark',pierce:2},

support_tower:{name:'Suporte',icon:'\uD83D\uDCE1',desc:'Buff aura. +dano vizinhas.',type:'tower',sub:'support',
  rarity:'rare',cost:2,color:'#00cec9',shape:'hexagon',
  dmg:0,range:2.5,spd:0,dmgType:'physical',buffAura:{type:'dmg',value:.2,range:2}},

laser:{name:'Laser',icon:'\uD83D\uDD34',desc:'Raio continuo.',type:'tower',sub:'damage',
  rarity:'epic',cost:3,color:'#ff3838',shape:'star',
  dmg:20,range:3.5,spd:.4,dmgType:'fire',laser:true},

mine_layer:{name:'Minas',icon:'\uD83E\uDEA7',desc:'Coloca minas no caminho.',type:'tower',sub:'damage',
  rarity:'rare',cost:2,color:'#e17055',shape:'triangle',
  dmg:0,range:3,spd:0,dmgType:'physical',mineDmg:40,mineRate:5},

necro:{name:'Necromante',icon:'\uD83D\uDC80',desc:'Invoca esqueleto.',type:'tower',sub:'summon',
  rarity:'epic',cost:3,color:'#666688',shape:'diamond',
  dmg:5,range:2,spd:.5,dmgType:'dark',summon:{type:'skeleton_ally',interval:12,hp:50,dmg:5}},

berserker:{name:'Berserker',icon:'\uD83D\uDCA2',desc:'Mais dano em alvos feridos.',type:'tower',sub:'damage',
  rarity:'epic',cost:3,color:'#ff3838',shape:'star',
  dmg:12,range:2.5,spd:1,dmgType:'physical',execThresh:.3},

frost_nova:{name:'Nova Glacial',icon:'\u2744\uFE0F',desc:'Pulso de gelo AOE.',type:'tower',sub:'status',
  rarity:'epic',cost:3,color:'#a29bfe',shape:'hexagon',
  dmg:8,range:2,spd:.3,dmgType:'ice',nova:true,novaCD:3,freezeDur:2},

// ═══════════════════ SPELLS ═══════════════════

fireball:{name:'Bola de Fogo',icon:'\uD83D\uDD25',desc:'Explosao de fogo.',type:'spell',sub:'damage',
  rarity:'common',cost:2,color:'#ff6600',
  splDmg:25,splRad:1.5,dmgType:'fire',burnDmg:4,burnDur:3},

freeze_nova:{name:'Congelamento',icon:'\u2744\uFE0F',desc:'Congela todos os inimigos.',type:'spell',sub:'control',
  rarity:'rare',cost:3,color:'#74b9ff',
  splDmg:5,splRad:99,dmgType:'ice',freeze:true,freezeDur:2},

lightning:{name:'Raio',icon:'\u26A1',desc:'Raio devastador.',type:'spell',sub:'damage',
  rarity:'rare',cost:3,color:'#ffd93d',
  splDmg:50,splRad:1,dmgType:'lightning',stun:1.5},

heal_spell:{name:'Cura',icon:'\u2764\uFE0F',desc:'Restaura 25 HP.',type:'spell',sub:'utility',
  rarity:'common',cost:2,color:'#44ff44',
  splDmg:0,splRad:0,dmgType:'physical',healAmt:25},

meteor:{name:'Meteoro',icon:'\u2604\uFE0F',desc:'Destruição massiva.',type:'spell',sub:'damage',
  rarity:'legendary',cost:5,color:'#e84855',
  splDmg:100,splRad:2.5,dmgType:'fire',burnDmg:8,burnDur:4,stun:1,exhaust:true},

storm:{name:'Tempestade',icon:'\u26C8\uFE0F',desc:'5 raios aleatórios.',type:'spell',sub:'damage',
  rarity:'epic',cost:4,color:'#74b9ff',
  splDmg:20,splRad:3,dmgType:'lightning',hits:5},

poison_cloud:{name:'Nuvem Toxica',icon:'\u2620\uFE0F',desc:'Area de veneno.',type:'spell',sub:'damage',
  rarity:'rare',cost:2,color:'#6bcb77',
  splDmg:5,splRad:2,dmgType:'physical',poisonDmg:4,poisonDur:5},

shield_spell:{name:'Escudo',icon:'\uD83D\uDEE1\uFE0F',desc:'+30 escudo.',type:'spell',sub:'utility',
  rarity:'rare',cost:2,color:'#5bc0ff',
  splDmg:0,splRad:0,dmgType:'physical',shieldAmt:30},

// ═══════════════════ MODIFIERS ═══════════════════

mod_scope:{name:'Luneta',icon:'\uD83D\uDD0D',desc:'+40% alcance.',type:'mod',sub:'mod',
  rarity:'common',cost:0,color:'#888',modRange:.4},

mod_speed:{name:'Overclock',icon:'\u23E9',desc:'+30% velocidade.',type:'mod',sub:'mod',
  rarity:'common',cost:0,color:'#888',modSpd:.3},

mod_crit:{name:'Mira',icon:'\uD83C\uDFAF',desc:'+20% critico.',type:'mod',sub:'mod',
  rarity:'rare',cost:0,color:'#ffd93d',modCrit:.2},

mod_chain:{name:'Corrente',icon:'\u26D3\uFE0F',desc:'+2 correntes.',type:'mod',sub:'mod',
  rarity:'rare',cost:0,color:'#ffd93d',modChain:2},

mod_pierce:{name:'Perfurante',icon:'\uD83D\uDDE1\uFE0F',desc:'+2 perfuracoes.',type:'mod',sub:'mod',
  rarity:'rare',cost:0,color:'#d4a843',modPierce:2},

mod_lifesteal:{name:'Vampirico',icon:'\uD83E\uDDDB',desc:'Cura 5% do dano.',type:'mod',sub:'mod',
  rarity:'epic',cost:0,color:'#9b59b6',modLifesteal:.05}
};

// ═══════════════════ CARD UTILITY ═══════════════════

function lvStats(id,lv){
  var c=CARDS[id];if(!c)return null;
  var s={};for(var k in c)s[k]=c[k];
  if(lv>=2){s.dmg=Math.floor(s.dmg*1.35);s.range*=1.1;s.spd*=1.1;if(s.splDmg)s.splDmg=Math.floor(s.splDmg*1.35);if(s.cost>1)s.cost--}
  if(lv>=3){s.dmg=Math.floor(s.dmg*1.3);s.range*=1.15;s.spd*=1.15;if(s.splDmg)s.splDmg=Math.floor(s.splDmg*1.3);if(s.cost>1)s.cost--}
  return s;
}

function maxSt(lv){return lv>=3?5:lv>=2?4:3}
// ═══════════════════════════════════════════════════════════════
// data.js - MOCK, constantes, conversao
// ═══════════════════════════════════════════════════════════════

var $ = function(i){ return document.getElementById(i) };

var SUB = { massDmg:'\uD83D\uDCA5', areaDmg:'\uD83C\uDF00', support:'\uD83D\uDEE1\uFE0F', controller:'\uD83D\uDD2E', farm:'\uD83D\uDCB0', damage:'\u26A1', control:'\u2744\uFE0F', utility:'\u2728', mod:'\uD83D\uDD27' };
var RC = { common:2, rare:3, epic:4, mystic:5, legendary:6 };
var RCLR = { common:'#888', rare:'#4a9eff', epic:'#9b59b6', mystic:'#2ecc71', legendary:'#f39c12' };

var CN=12, RN=8, CL=60, W=CN*CL, H=RN*CL, HM=5;
var WP = [[-1,1],[5,1],[5,3],[1,3],[1,5],[7,5],[7,3],[11,3],[12,3]];
var pathCells = [], pathSet = {};

var ENC = { sword:{wv:5,gold:6,hps:.15}, crossed:{wv:10,gold:9,hps:.18}, skull:{wv:15,gold:16,hps:.2}, boss:{wv:20,gold:40,hps:.18} };
var BOSS_LIVES = { sword:5, crossed:20, skull:40, boss:-1 };
var EI = { sword:'\u2694\uFE0F', crossed:'\u2694\u2694\uFE0F', skull:'\uD83D\uDC80', event:'\u2753', shop:'\uD83C\uDFEA', campfire:'\uD83D\uDD25', boss:'\uD83D\uDC51', start:'\uD83C\uDFE0' };
var ECL = { sword:'#4ecdc4', crossed:'#ff9f43', skull:'#e84855', event:'#a29bfe', shop:'#ffd93d', campfire:'#ff6b6b', boss:'#ff0044', start:'#555' };

var STAR_COST = { 1:10, 2:20, 3:35, 4:50 };
var UPG_COST = { 1:20, 2:40 };
var REM_COST = [5, 10, 15];
var PRIO_ORDER = ['first','last','strong','weak','close'];
var SPEEDS = [1, 2, 3, 5];
var DIFFS = { normal:{n:'Normal',hm:1,gm:1}, hard:{n:'Dificil',hm:1.3,gm:1.5}, nightmare:{n:'Pesadelo',hm:1.8,gm:2.5} };

var CARDS={}, ENEMIES={}, RELICS={}, POTS={};

// ═══ MOCK DATA ═══

var CARDS_MOCK = {
arrow:{name:'Torre Flechas',type:'tower',sub_type:'massDmg',icon:'\uD83C\uDFF9',color:'#4ecdc4',description:'Flechas rapidas.',rarity:'common',cost:2,damage:15,range:2.5,attack_speed:1.2,projectile_speed:6,shape:'diamond',target_type:'grounded',trigger:{chance:.08,type:'draw'},ultimate:{name:'Tri-Shot',icon:'\uD83C\uDFAF',description:'3 flechas.',effect:'tri_shot'}},
frost:{name:'Obelisco Gelo',type:'tower',sub_type:'controller',icon:'\u2744\uFE0F',color:'#74b9ff',description:'Desacelera 35%.',rarity:'common',cost:2,damage:10,range:2.5,attack_speed:.85,projectile_speed:5,shape:'hexagon',target_type:'hybrid',slow:.35,slow_duration:2,ultimate:{name:'Blizzard',icon:'\uD83C\uDF28\uFE0F',description:'Aura lentidao.',effect:'blizzard'}},
venom:{name:'Poco Veneno',type:'tower',sub_type:'areaDmg',icon:'\u2620\uFE0F',color:'#6bcb77',description:'Veneno empilhavel.',rarity:'common',cost:2,damage:6,range:2.5,attack_speed:.9,projectile_speed:5,shape:'triangle',target_type:'grounded',poison_damage:4,poison_duration:4,ultimate:{name:'Praga',icon:'\u2622\uFE0F',description:'Veneno 3x.',effect:'plague'}},
shadow:{name:'Vigia',type:'tower',sub_type:'damage',icon:'\uD83D\uDC41',color:'#8888aa',description:'Rapido. Frenzy.',rarity:'common',cost:2,damage:8,range:2.5,attack_speed:1.5,projectile_speed:8,shape:'star',target_type:'grounded',frenzy:true,ultimate:{name:'Devastacao',icon:'\uD83D\uDC80',description:'Stun 0.25s/hit.',effect:'devastacao'}},
flame:{name:'Altar Chamas',type:'tower',sub_type:'areaDmg',icon:'\uD83D\uDD25',color:'#ff6b6b',description:'Explosivos.',rarity:'rare',cost:3,damage:22,range:2,attack_speed:.6,projectile_speed:5,shape:'circle',target_type:'grounded',splash_radius:1.2,ultimate:{name:'Firestorm',icon:'\uD83C\uDF0B',description:'Splash x2.',effect:'firestorm'}},
spark:{name:'Para-Raios',type:'tower',sub_type:'controller',icon:'\u26A1',color:'#ffd93d',description:'Raios cadeia.',rarity:'rare',cost:3,damage:18,range:3,attack_speed:.7,shape:'star',target_type:'hybrid',chain:3,chain_range:2,ultimate:{name:'Tempestade',icon:'\u26C8\uFE0F',description:'Chain x2.',effect:'tempestade'}},
sniper:{name:'Torre Sniper',type:'tower',sub_type:'massDmg',icon:'\uD83C\uDFAF',color:'#3498db',description:'Alcance enorme. Crit 3%.',rarity:'rare',cost:3,damage:40,range:4,attack_speed:.4,projectile_speed:12,shape:'diamond',target_type:'hybrid',trigger:{chance:.03,type:'crit',multiplier:2},ultimate:{name:'Headshot',icon:'\uD83D\uDC80',description:'3o tiro 5x.',effect:'headshot'}},
cannon:{name:'Canhao Arcano',type:'tower',sub_type:'massDmg',icon:'\uD83D\uDCA5',color:'#e17055',description:'Dano massivo.',rarity:'epic',cost:4,damage:45,range:2.5,attack_speed:.3,projectile_speed:4,shape:'circle',target_type:'grounded',splash_radius:1.5,ultimate:{name:'Nuclear',icon:'\u2622\uFE0F',description:'Atordoa 2s.',effect:'nuclear'}},
guardian:{name:'Guardiao',type:'tower',sub_type:'support',icon:'\uD83D\uDEE1\uFE0F',color:'#a29bfe',description:'Invoca Golem.',rarity:'epic',cost:4,damage:20,range:2,attack_speed:.7,projectile_speed:5,shape:'diamond',target_type:'grounded',tribute:{trigger:'enemy_pass',description:'Golem 300HP.',cooldown:12,execute:function(tw){spawnAllyGolem(tw)}},ultimate:{name:'Exercito',icon:'\u2694\uFE0F',description:'Golem 600HP.',effect:'army'}},
archmage:{name:'Torre Arcana',type:'tower',sub_type:'areaDmg',icon:'\uD83D\uDD2E',color:'#fd79a8',description:'Chain+splash.',rarity:'legendary',cost:6,damage:30,range:3.5,attack_speed:.6,projectile_speed:6,shape:'star',target_type:'hybrid',chain:4,chain_range:2.5,splash_radius:1.2,ultimate:{name:'Maestria',icon:'\uD83C\uDF1F',description:'2 projeteis.',effect:'double_shot'}},
mercado:{name:'Mercado',type:'tower',sub_type:'farm',icon:'\uD83C\uDFEA',color:'#ffd93d',description:'Gera 2 au/onda.',rarity:'common',cost:2,damage:0,range:0,attack_speed:0,shape:'circle',target_type:'grounded',gold_per_wave:2},
mina:{name:'Mina Ouro',type:'tower',sub_type:'farm',icon:'\u26CF\uFE0F',color:'#f39c12',description:'Gera 3 au/onda +1/star.',rarity:'rare',cost:3,damage:0,range:0,attack_speed:0,shape:'circle',target_type:'grounded',gold_per_wave:3},
idol:{name:'Idolo',type:'tower',sub_type:'support',icon:'\uD83C\uDFA4',color:'#e84855',description:'Buff ativo. Nao ataca.',rarity:'rare',cost:3,damage:0,range:0,attack_speed:0,shape:'diamond',target_type:'grounded',active_skill:{name:'Inspiracao',icon:'\uD83C\uDFA4',description:'+40% dmg torres, 8s',cooldown:20,effect:'buff_all'}},
cleric:{name:'Clerigo',type:'tower',sub_type:'support',icon:'\u271D\uFE0F',color:'#44ff44',description:'Cura ativa. Nao ataca.',rarity:'rare',cost:3,damage:0,range:0,attack_speed:0,shape:'hexagon',target_type:'grounded',active_skill:{name:'Curar',icon:'\u271D\uFE0F',description:'+3 HP jogador',cooldown:15,effect:'heal_player'}},
lancador:{name:'Lancador',type:'tower',sub_type:'areaDmg',icon:'\uD83E\uDD4A',color:'#e17055',description:'Splash+sangramento.',rarity:'common',cost:2,damage:18,range:2,attack_speed:.7,projectile_speed:5,shape:'triangle',target_type:'grounded',splash_radius:1,bleed_damage:6,bleed_duration:3},
laser:{name:'Torre Laser',type:'tower',sub_type:'damage',icon:'\uD83D\uDD34',color:'#ff3838',description:'Raio em linha. Queima.',rarity:'rare',cost:4,damage:25,range:4,attack_speed:.5,shape:'star',target_type:'hybrid',burn_damage:5,burn_duration:4,laser:true},
devorador:{name:'Devorador',type:'tower',sub_type:'damage',icon:'\uD83E\uDD96',color:'#6bcb77',description:'Devora 1 inimigo. CD 25s.',rarity:'epic',cost:5,damage:10,range:2,attack_speed:.3,shape:'triangle',target_type:'grounded',devour:true},
amplificador:{name:'Amplificador',type:'tower',sub_type:'support',icon:'\uD83D\uDD0A',color:'#74b9ff',description:'Buff alcance ativo.',rarity:'rare',cost:3,damage:0,range:0,attack_speed:0,shape:'hexagon',target_type:'grounded',active_skill:{name:'Expandir',icon:'\uD83D\uDD0A',description:'+50% rng adjacentes, 10s',cooldown:25,effect:'range_buff'}},
teleportador:{name:'Teleportador',type:'tower',sub_type:'controller',icon:'\uD83C\uDF00',color:'#00cec9',description:'Manda inimigos pra tras.',rarity:'epic',cost:4,damage:0,range:0,attack_speed:0,shape:'star',target_type:'grounded',active_skill:{name:'Warp',icon:'\uD83C\uDF00',description:'3 inimigos voltam',cooldown:30,effect:'teleport_back'}},
impositor:{name:'Impositor',type:'tower',sub_type:'damage',icon:'\u2694\uFE0F',color:'#e84855',description:'Executa abaixo 15% HP.',rarity:'epic',cost:4,damage:20,range:2.5,attack_speed:.8,projectile_speed:7,shape:'diamond',target_type:'grounded',execute_threshold:.15},
vampiro:{name:'Vampiro',type:'tower',sub_type:'damage',icon:'\uD83E\uDDDB',color:'#9b59b6',description:'Cura 1HP por kill no range.',rarity:'rare',cost:3,damage:15,range:2,attack_speed:1,projectile_speed:6,shape:'star',target_type:'grounded',lifesteal:1},
protetor:{name:'Protetor',type:'tower',sub_type:'support',icon:'\uD83D\uDEE1\uFE0F',color:'#a29bfe',description:'Overcharge ativo.',rarity:'epic',cost:4,damage:0,range:0,attack_speed:0,shape:'diamond',target_type:'grounded',active_skill:{name:'Overcharge',icon:'\u26A1',description:'2x spd torres, 6s',cooldown:30,effect:'overcharge'}},
fireball:{name:'Bola Fogo',type:'spell',sub_type:'damage',icon:'\u2604\uFE0F',color:'#ff6b6b',description:'Dano area.',rarity:'common',cost:2,spell_damage:60,splash_radius:2,levels:[{spell_damage:80,splash_radius:2.5},{spell_damage:100,splash_radius:3}]},
surge:{name:'Surto Arcano',type:'spell',sub_type:'utility',icon:'\u2728',color:'#a29bfe',description:'Compra cartas.',rarity:'common',cost:2,draw_count:2,levels:[{draw_count:2,cost:1},{draw_count:3,cost:1}]},
lightning:{name:'Raio',type:'spell',sub_type:'damage',icon:'\uD83C\uDF29\uFE0F',color:'#ffd93d',description:'Dano cadeia.',rarity:'common',cost:2,spell_damage:45,splash_radius:1.5,levels:[{spell_damage:65},{spell_damage:90}]},
frost_nova:{name:'Geada',type:'spell',sub_type:'control',icon:'\uD83D\uDC8E',color:'#74b9ff',description:'Congela.',rarity:'rare',cost:3,freeze_duration:3,levels:[{freeze_duration:3,spell_damage:25},{freeze_duration:4,spell_damage:50}]},
barrier:{name:'Barreira',type:'spell',sub_type:'utility',icon:'\uD83D\uDEE1\uFE0F',color:'#a29bfe',description:'Vidas.',rarity:'rare',cost:3,heal_amount:3,levels:[{heal_amount:5},{heal_amount:8}]},
meteor:{name:'Meteoro',type:'spell',sub_type:'damage',icon:'\uD83C\uDF0B',color:'#d63031',description:'Dano massivo. EXHAUST.',rarity:'epic',cost:4,spell_damage:120,splash_radius:3,exhaust:true,levels:[{spell_damage:160,splash_radius:3.5},{spell_damage:200,splash_radius:4}]},
timewarp:{name:'Distorcao',type:'spell',sub_type:'control',icon:'\u231B',color:'#00cec9',description:'Congela tudo.',rarity:'mystic',cost:5,freeze_duration:5,levels:[{freeze_duration:5},{freeze_duration:7}]},
apocalypse:{name:'Apocalipse',type:'spell',sub_type:'damage',icon:'\uD83D\uDC80',color:'#ff3838',description:'Dano TODOS.',rarity:'legendary',cost:6,spell_damage:200,splash_radius:99,levels:[{spell_damage:280},{spell_damage:360}]},
super_nutrient:{name:'Super Nutriente',type:'spell',sub_type:'utility',icon:'\uD83C\uDF3F',color:'#2ecc71',description:'+50% dmg torres, 8s.',rarity:'rare',cost:3,effect:'buff_all'},
ventania:{name:'Ventania',type:'spell',sub_type:'damage',icon:'\uD83C\uDF2C\uFE0F',color:'#74b9ff',description:'Mata todos voadores.',rarity:'common',cost:2,effect:'kill_flying'},
mina_arcana:{name:'Mina Arcana',type:'spell',sub_type:'damage',icon:'\uD83E\uDDEA',color:'#e17055',description:'Armadilha no path. 200dmg.',rarity:'common',cost:1,spell_damage:200,splash_radius:.8,target_mode:'path'},
hipnose:{name:'Hipnose',type:'spell',sub_type:'control',icon:'\uD83D\uDC41\u200D\uD83D\uDC41',color:'#a29bfe',description:'Converte 1 inimigo.',rarity:'epic',cost:4,splash_radius:2,effect:'convert'},
purificar:{name:'Purificar',type:'spell',sub_type:'utility',icon:'\u2728',color:'#ffd93d',description:'Remove escudo de todos.',rarity:'rare',cost:2,effect:'remove_shields'},
distortion:{name:'Distorcao Massa',type:'spell',sub_type:'control',icon:'\uD83C\uDF00',color:'#00cec9',description:'Manda todos pra tras.',rarity:'rare',cost:3,effect:'teleport_all'},
overcharge:{name:'Sobrecarga',type:'mod',sub_type:'mod',icon:'\u2B06\uFE0F',color:'#fdcb6e',description:'Dobra dano.',rarity:'rare',cost:3,damage_multiplier:2,levels:[{damage_multiplier:2.5},{damage_multiplier:3}]},
haste:{name:'Runa Agilidade',type:'mod',sub_type:'mod',icon:'\u23E9',color:'#fdcb6e',description:'Dobra vel.',rarity:'rare',cost:3,speed_multiplier:2,levels:[{speed_multiplier:2.5},{speed_multiplier:3}]},
fortify:{name:'Fortificar',type:'mod',sub_type:'mod',icon:'\uD83C\uDFD7\uFE0F',color:'#a29bfe',description:'+50% alcance.',rarity:'common',cost:2,range_bonus:.5,levels:[{range_bonus:.75},{range_bonus:1}]}
};

var ENEMIES_MOCK = {
crawler:{name:'Rastejador',health:35,speed:55,gold:2,color:'#555566',size:.55},
swift:{name:'Veloz',health:22,speed:95,gold:3,color:'#8888aa',size:.4},
brute:{name:'Bruto',health:140,speed:35,gold:6,color:'#774444',size:.85},
wraith:{name:'Espectro',health:55,speed:65,gold:4,color:'#6644aa',size:.55,regeneration:3},
titan:{name:'Tita',health:400,speed:28,gold:30,color:'#aa2233',size:1.1,boss:true},
golem:{name:'Golem',health:800,speed:20,gold:50,color:'#884422',size:1.3,boss:true},
phoenix:{name:'Fenix',health:80,speed:70,gold:8,color:'#ff9944',size:.5,flying:true},
shield_brute:{name:'Bruto Blindado',health:100,speed:40,gold:7,color:'#5bc0ff',size:.75,shield:60},
healer:{name:'Curandeiro',health:40,speed:50,gold:5,color:'#44cc88',size:.5,heal_range:2.5,heal_amount:8},
aura_buffer:{name:'Aura',health:60,speed:45,gold:6,color:'#cc44cc',size:.6,aura_speed:1.4},
weakness_mob:{name:'Maldito',health:50,speed:55,gold:4,color:'#ff44aa',size:.55},
armored:{name:'Blindado',health:80,speed:45,gold:5,color:'#888899',size:.75,armor:5},
stealth:{name:'Furtivo',health:45,speed:60,gold:6,color:'#333344',size:.5,stealth:true},
corrupted:{name:'Corrompido',health:120,speed:40,gold:8,color:'#441144',size:.7,corrupted:true}
};

var RELICS_MOCK = {
mana_crystal:{name:'Cristal Mana',icon:'\uD83D\uDC8E',description:'+1 mana',effect:'maxMana',value:1},
war_drum:{name:'Tambor',icon:'\uD83E\uDD41',description:'+20% dano',effect:'twDmg',value:.2},
swift_totem:{name:'Totem',icon:'\uD83C\uDFC3',description:'+20% vel',effect:'twSpd',value:.2},
golden_clover:{name:'Trevo',icon:'\uD83C\uDF40',description:'+3 au/onda',effect:'wvGold',value:3},
iron_heart:{name:'Coracao',icon:'\u2764\uFE0F',description:'+10 HP',effect:'maxHp',value:10},
arcane_lens:{name:'Lente',icon:'\uD83D\uDD0D',description:'+25% rng',effect:'twRng',value:.25},
lucky_ring:{name:'Anel',icon:'\uD83D\uDC8D',description:'+5 au/no',effect:'ndGold',value:5},
blood_gem:{name:'Gema',icon:'\uD83E\uDE78',description:'+1 dmg/onda',effect:'stkDmg',value:1},
golden_key:{name:'Chave',icon:'\uD83D\uDD11',description:'+2 locks',effect:'maxLocks',value:2},
infinite_key:{name:'Chave Inf',icon:'\uD83D\uDDDD\uFE0F',description:'locks inf',effect:'infLocks',value:1}
};

var POTS_MOCK = {
health:{name:'Pocao Vida',icon:'\u2764\uFE0F\uD83E\uDDEA',description:'+25 HP',effect:'heal',value:25},
mana:{name:'Pocao Mana',icon:'\uD83D\uDC8E\uD83E\uDDEA',description:'+3 mp',effect:'mana',value:3},
strength:{name:'Pocao Forca',icon:'\u2694\uFE0F\uD83E\uDDEA',description:'+50% dmg',effect:'str',value:.5,duration:30}
};

var EVENTS_DATA = [
{title:'Bau Misterioso',description:'Runas.',choices:[{text:'Abrir',effect:'relic'},{text:'Forcar (+15$)',effect:'gold15'}]},
{title:'Altar Antigo',description:'Sacrificio.',choices:[{text:'-10HP -> epica+',effect:'sacrifice'},{text:'+5$',effect:'gold5'}]},
{title:'Mercador',description:'Misterioso.',choices:[{text:'Rara (20$)',effect:'buyrare'},{text:'Recusar',effect:'nothing'}]},
{title:'Fonte Arcana',description:'Magica.',choices:[{text:'+5 HP max',effect:'hpup'},{text:'+10$',effect:'gold10'}]},
{title:'Encruzilhada',description:'Sinos.',choices:[{text:'+2 cartas',effect:'addcards'},{text:'+20$',effect:'gold20'}]},
{title:'Fonte de Cura',description:'Cristalina.',choices:[{text:'+15 HP',effect:'heal15'},{text:'+5 HP max',effect:'hpup'}]},
{title:'Ferreiro',description:'Ferramentas.',choices:[{text:'Upgrade aleatoria',effect:'uprandom'},{text:'+10$',effect:'gold10'}]},
{title:'Corvo',description:'Presente.',choices:[{text:'Rara gratis',effect:'addrare'},{text:'+15$',effect:'gold15'}]},
{title:'Cristal',description:'Brilho.',choices:[{text:'Comer (-5HP, +25$)',effect:'crystal'},{text:'Ignorar',effect:'nothing'}]},
{title:'Jardim',description:'Descanso.',choices:[{text:'+20 HP',effect:'heal20'},{text:'Rara',effect:'addrare'}]},
{title:'Mercador Viajante',description:'Negocio.',choices:[{text:'Pocao (5$)',effect:'buypot5'},{text:'Recusar',effect:'nothing'}]},
{title:'Armadilha',description:'Perigo!',choices:[{text:'-8 HP',effect:'lose8hp'},{text:'-15$',effect:'pay15'}]},
{title:'Estrela Cadente',description:'Desejo.',choices:[{text:'Desejar',effect:'wish'},{text:'Ignorar',effect:'nothing'}]},
{title:'Necromante',description:'Sombrio.',choices:[{text:'-10HP +1 epica',effect:'sacrifice'},{text:'+8$',effect:'gold8'}]},
{title:'Peregrino',description:'Jornada.',choices:[{text:'+2 cartas',effect:'addcards'},{text:'+25$',effect:'gold25'}]}
];

// ═══ CONVERSION ═══

function initCards(){
  for(var id in CARDS_MOCK){
    var m=CARDS_MOCK[id];
    var c={id:id,name:m.name,type:m.type,sub:m.sub_type,icon:m.icon,color:m.color,desc:m.description,rarity:m.rarity,cost:m.cost||RC[m.rarity]||2};
    c.damage=m.damage||0; c.range=m.range||0; c.atkSpd=m.attack_speed||0;
    c.pSpd=m.projectile_speed||6; c.shape=m.shape||'circle';
    c.tgtType=m.target_type||'grounded';
    c.slow=m.slow||0; c.slowDur=m.slow_duration||0;
    c.spl=m.type==='spell'?0:(m.splash_radius||0);
    c.splRad=m.type==='spell'?(m.splash_radius||0):0;
    c.splDmg=m.spell_damage||0;
    c.poisDmg=m.poison_damage||0; c.poisDur=m.poison_duration||0;
    c.bleedDmg=m.bleed_damage||0; c.bleedDur=m.bleed_duration||0;
    c.burnDmg=m.burn_damage||0; c.burnDur=m.burn_duration||0;
    c.chn=m.chain||0; c.chr=m.chain_range||0;
    c.frenzy=m.frenzy||false; c.exhaust=m.exhaust||false;
    c.execThresh=m.execute_threshold||0; c.lifeSteal=m.lifesteal||0;
    c.farmGold=m.gold_per_wave||0; c.targetMode=m.target_mode||'cell';
    c.effect=m.effect||null; c.laser=m.laser||false; c.devour=m.devour||false;
    c.frzDur=m.freeze_duration||0; c.drawN=m.draw_count||0;
    c.life=m.heal_amount||0; c.dmgMul=m.damage_multiplier||0;
    c.spdMul=m.speed_multiplier||0; c.rngBon=m.range_bonus||0;
    if(m.trigger) c.trigger={ch:m.trigger.chance,tp:m.trigger.type,mult:m.trigger.multiplier||0};
    if(m.ultimate) c.ultimate={name:m.ultimate.name,icon:m.ultimate.icon,desc:m.ultimate.description,effect:m.ultimate.effect};
    if(m.tribute) c.tribute={trigger:m.tribute.trigger,desc:m.tribute.description,cd:m.tribute.cooldown,execute:m.tribute.execute};
    if(m.active_skill) c.activeSkill={name:m.active_skill.name,icon:m.active_skill.icon,desc:m.active_skill.description,cd:m.active_skill.cooldown,effect:m.active_skill.effect};
    if(m.levels) c.levels=m.levels.map(function(lv){
      var o={};
      for(var k in lv){
        if(k==='spell_damage') o.splDmg=lv[k];
        else if(k==='splash_radius'){ if(m.type==='spell') o.splRad=lv[k]; else o.spl=lv[k]; }
        else if(k==='freeze_duration') o.frzDur=lv[k];
        else if(k==='draw_count') o.drawN=lv[k];
        else if(k==='heal_amount') o.life=lv[k];
        else if(k==='damage_multiplier') o.dmgMul=lv[k];
        else if(k==='speed_multiplier') o.spdMul=lv[k];
        else if(k==='range_bonus') o.rngBon=lv[k];
        else o[k]=lv[k];
      }
      return o;
    });
    CARDS[id]=c;
  }
}

function initEnemies(){
  for(var id in ENEMIES_MOCK){
    var m=ENEMIES_MOCK[id];
    ENEMIES[id]={hp:m.health,sp:m.speed,g:m.gold,cl:m.color,z:m.size,bo:m.boss?1:0,fly:m.flying?1:0,re:m.regeneration||0,shield:m.shield||0,armor:m.armor||0,healR:m.heal_range||0,healAmt:m.heal_amount||0,auraSpd:m.aura_speed||0,stealth:m.stealth||false,corrupted:m.corrupted||false};
  }
}

function initRelics(){
  for(var id in RELICS_MOCK){
    var m=RELICS_MOCK[id];
    RELICS[id]={n:m.name,ic:m.icon,d:m.description,ef:m.effect,v:m.value};
  }
}

function initPots(){
  for(var id in POTS_MOCK){
    var m=POTS_MOCK[id];
    POTS[id]={n:m.name,ic:m.icon,d:m.description,ef:m.effect,v:m.value,dur:m.duration||0};
  }
}

function initGameData(){ initCards(); initEnemies(); initRelics(); initPots(); }

function genPath(){
  pathCells=[]; pathSet={};
  for(var i=0;i<WP.length-1;i++){
    var x=WP[i][0],y=WP[i][1],tx=WP[i+1][0],ty=WP[i+1][1];
    if(i===0){ pathCells.push([x,y]); pathSet[x+','+y]=1; }
    while(x!==tx||y!==ty){
      if(x!==tx) x+=(tx>x?1:-1); else y+=(ty>y?1:-1);
      pathCells.push([x,y]); pathSet[x+','+y]=1;
    }
  }
}
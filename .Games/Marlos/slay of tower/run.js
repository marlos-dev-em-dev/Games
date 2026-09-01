// ═══════════════════════════════════════════════════════════════
// run.js — ALL GAME LOGIC
// ═══════════════════════════════════════════════════════════════

// ── DOM & CANVAS ──
function $(id){return document.getElementById(id)}
var cv,cx,AC=false;

// ── MATH UTILS ──
function dst(x1,y1,x2,y2){var dx=x1-x2,dy=y1-y2;return Math.sqrt(dx*dx+dy*dy)}
function cc(c,r){return[c*CL+CL/2,r*CL+CL/2]}
function shf(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.random()*(i+1)|0,tmp=a[i];a[i]=a[j];a[j]=tmp}return a}
function rng(min,max){return min+Math.random()*(max-min)}
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v))}

// ── SOUND (stub) ──
function sfx(t){try{var ac=new(window.AudioContext||window.webkitAudioContext)();var o=ac.createOscillator();var g=ac.createGain();o.connect(g);g.connect(ac.destination);g.gain.value=.08;var f={s:600,k:300,rw:500,sp:400,w:800}[t]||400;o.frequency.value=f;o.start();o.stop(ac.currentTime+.08)}catch(e){}}

// ── PARTICLES & FLOATS ──
function spP(x,y,cl,n){if(!G.cb)return;for(var i=0;i<(n||5);i++)G.cb.particles.push({x:x,y:y,vx:rng(-60,60),vy:rng(-80,-20),l:0,ml:rng(.3,.7),cl:cl,sz:rng(1.5,4)})}
function fTx(x,y,txt,cl){if(!G.cb)return;G.cb.floats.push({x:x,y:y,t:txt,c:cl||'#fff',l:0,ml:1.2})}

// ── GAME STATE ──
var G={};
function resetCombat(){
  G.cb={enemies:[],towers:[],projectiles:[],particles:[],floats:[],beams:[],mines:[],allySummons:[],
    grid:{},hand:[],drawPile:[],discardPile:[],selCard:null,selTower:null,hovC:null,hovR:null,
    encW:0,totalW:0,waveQ:[],waveTm:0,waveIdx:0,
    mana:5,maxMana:5,leftoverMana:0,
    encType:'',difficulty:1,announce:{text:'',timer:0},shake:0,
    deadEnemies:[],strBuff:0,strTimer:0,strengthBuff:0,
    revealAll:false,doubleHeal:false,slowEnemiesMod:1,
    spellRangeBonus:1,spellAreaBonus:1,
    lockSlots:2,lockedCards:{}};
}
function resetAll(){
  var sd={dobroes:G.player?G.player.dobroes:20,fv:G.player?G.player.firstVictory:false,
    cc:G.player?G.player.carriedCard:null,cr:G.player?G.player.carriedRelic:null};
  var prevDiff=G&&G.difficulty?G.difficulty:'normal';
  var prevFac=G&&G.faction?G.faction:'neutral';
  G={state:'MENU',player:{hp:80,maxHp:80,dobroes:sd.dobroes,ouro:0,deck:[],relics:[],potions:[],
    firstVictory:sd.fv,carriedCard:sd.cc,carriedRelic:sd.cr},
    map:{nodes:[],curId:0,totalH:0,scrollY:0,revealFloor:1},nodeCount:0,
    autoWv:false,autoTm:0,spd:1,difficulty:prevDiff,faction:prevFac,cb:{},
    bossKillBonus:0,corruptionBonus:0,_permMana:0,eliteNext:false,stealReward:false,
    arenaReward:false,luaReward:false,luaBuff:false,eclipseBuff:0,fendaMix:0,
    chuvaBossHP:0,devBossReward:false,slowEnemiesWaves:0,
    _shopRareUsed:false,_shopCascade:0,_evCardMode:null,_evRelicMode:null};
  resetCombat();
}

// ── RELIC HELPERS ──
function getRelicsByTrigger(tr){var o=[];for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r&&r.trigger===tr)o.push({id:G.player.relics[i],data:r})}return o}
function hasRelWithEffect(ef){for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r&&r.effect===ef)return true}return false}
function relV(ef){var s=0;for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r&&r.effect===ef)s+=r.value}return s}
function hasRel(id){return G.player.relics.indexOf(id)>=0}

// ── FACTION HELPERS ──
function getFactionElite(fac){var pool=[];for(var id in ENEMIES){if(ENEMIES[id].elite&&ENEMIES[id].faction===fac)pool.push(id)}if(!pool.length)for(var id in ENEMIES){if(ENEMIES[id].elite)pool.push(id)}return pool.length?shf(pool)[0]:null}

// ── DECK ──
function initDeck(){
  G.player.deck=[
    {id:'archer',lv:1},{id:'archer',lv:1},{id:'archer',lv:1},
    {id:'mage',lv:1},{id:'farm',lv:1},
    {id:'fireball',lv:1},{id:'fireball',lv:1}
  ];
}
function drawCards(n){
  var C=G.cb;if(!C)return;
  for(var i=0;i<n;i++){
    if(C.drawPile.length===0){C.drawPile=shf(C.discardPile);C.discardPile=[]}
    if(C.drawPile.length===0)break;
    if(C.hand.length>=5)break;
    C.hand.push(C.drawPile.pop());
  }
  if(typeof rHd==='function')rHd();
}

// ── HEAL HELPER ──
function healPlayer(amt){
  var f=amt;
  // FIX 4: so checar uma vez
  if(hasRelWithEffect('doubleHeal'))f*=2;
  G.player.hp=Math.min(G.player.hp+f,G.player.maxHp);
}
// ── OROU ──
function addOuro(n){
  var bonus=G.luaBuff?Math.floor(n*.2):0;
  var corrBonus=hasRelWithEffect('corrupted_basic')?Math.floor(n*.3):0;
  G.player.ouro+=n+bonus+corrBonus;
  G.player.dobroes+=n+bonus+corrBonus;
}

// ── TOWER STATS ──
function twDmg(tw){
  var d=CARDS[tw.id].dmg*(1+tw.stars*.25)*tw.dMul*tw.bSpd*(tw.sub==='status'?1.5:1)*(tw.weakMul||1)*tw.tempBuff*(tw.berserkDmgMul||1)*(G.cb.strengthBuff||1);
  var rTw=relV('twDmg'),rDoom=relV('doomClock');
  if(rTw||rDoom)d*=(1+rTw+rDoom);
  if(hasRelWithEffect('corrupted_basic'))d*=(1+(G.corruptionBonus||0));
  if(G.bossKillBonus)d*=(1+G.bossKillBonus);
  if(hasRelWithEffect('giantBoost')&&tw.sh==='circle')d*=(1+relV('giantBoost'));
  return d;
}
function twRange(tw){
  var r=CARDS[tw.id].range*(1+tw.stars*.1)*(1+relV('twRng'))*tw.rMul*(tw.tempRangeBuff||1)*CL;
  if(G.eclipseBuff>0&&CARDS[tw.id].dmgType==='light')r*=1.25;
  return r;
}
function twSpd(tw){
  var s=CARDS[tw.id].spd*(1+tw.stars*.08)*(1+relV('twSpd'))*tw.sMul*(tw.cdReduction||1)*(hasRelWithEffect('cdReduction')?(1-relV('cdReduction')):1);
  return s;
}

// ── FIND TARGET ──
function findTarget(tw){
  var C=G.cb,best=null,bestVal=tw.priority==='strongest'?-1:99999,rng2=twRange(tw);
  for(var i=0;i<C.enemies.length;i++){
    var e=C.enemies[i];if(e.hp<=0)continue;
    if(e.stealth&&!e.revealed&&!C.revealAll)continue;
    if(e.fly&&!tw.canAir)continue;
    var d=dst(tw.x,tw.y,e.x,e.y);
    if(d>rng2)continue;
    var v;
    switch(tw.priority){
      case'nearest':v=d;break;
      case'strongest':v=-e.hp;break;
      case'weakest':v=e.hp;break;
      case'fastest':v=-e.sp;break;
      case'first':v=-e.pi;break;
      case'boss':v=e.bo?-9999:e.elite?-5000:d;break;
      default:v=d;
    }
    if(e.marked)v-=1000;
    if(tw.priority==='strongest'?v>bestVal:v<bestVal){best=e;bestVal=v}
  }
  return best;
}

// ── PLACE TOWER ──
function canBuild(c,r){return c>=0&&c<CN&&r>=0&&r<RN&&!G.cb.grid[c+','+r]&&!pathSet[c+','+r]}
var pathSet={};
function placeTwr(c,r,idx,autoUp){
  var C=G.cb,en=C.hand[idx],card=CARDS[en.id],ls=lvStats(en.id,en.lv);
  var x=c*CL+CL/2,y=r*CL+CL/2;
  var tw={id:en.id,lv:en.lv,stars:0,x:x,y:y,c:c,r:r,
    cd:0,bSpd:1,dMul:1,rMul:1,sMul:1,priority:'nearest',
    tempBuff:1,tempBuffTimer:0,tempRangeBuff:1,tempRangeBuffTimer:0,
    frozen:false,frozenTimer:0,weakMul:1,weakTimer:0,
    ultEff:false,autoUp:autoUp||false,autoActive:false,
    pierce:card.pierce||0,chain:card.chain||0,chainRange:card.chainRange||2,
    slow:card.slow||0,slowDur:card.slowDur||0,stun:card.stun||0,
    splDmg:card.splDmg||0,splRad:card.splRad||0,
    freeze:card.freeze||false,freezeDur:card.freezeDur||0,
    burnDmg:card.burnDmg||0,burnDur:card.burnDur||0,
    poisonDmg:card.poisonDmg||0,poisonDur:card.poisonDur||0,
    bleedDmg:card.bleedDmg||0,bleedDur:card.bleedDur||0,
    farmGold:card.farmGold||0,sub:card.sub,
    sh:card.shape||'triangle',cl:card.color||'#888',
    tgtType:'normal',dmgType:card.dmgType||'physical',
    armPrc:card.armPrc||false,execThresh:card.execThresh||0,
    laser:card.laser||false,devour:card.devour||false,
    frenzy:card.frenzy||false,lifeSteal:card.lifeSteal||0,
    nova:card.nova||false,novaCD:0,novaTimer:0,
    mineDmg:card.mineDmg||0,mineRate:card.mineRate||0,mineTimer:0,
    slwA:card.slwA||0,stkDmg:0,
    summon:card.summon||null,summonTimer:0,
    buffAura:card.buffAura||null,
    activeSkill:card.active||null,activeCD:0,
    ultimate:card.ultimate||null,
    tribute:card.tribute||null,tribReady:true,tribCD:0,
    cLv:en.lv,modSlots:[],statuses:{},canAir:card.chain>0||card.laser||card.nova||card.dmgType==='lightning',
    berserkDmgMul:1};
  // Apply mods
  for(var i=C.hand.length-1;i>=0;i--){var m=C.hand[i];if(CARDS[m.id]&&CARDS[m.id].type==='mod'){
    var mc=CARDS[m.id];
    if(mc.modRange)tw.rMul*=(1+mc.modRange);
    if(mc.modSpd)tw.sMul*=(1+mc.modSpd);
    if(mc.modCrit)tw.critChance=(tw.critChance||0)+mc.modCrit;
    if(mc.modChain)tw.chain+=mc.modChain;
    if(mc.modPierce)tw.pierce+=mc.modPierce;
    if(mc.modLifesteal)tw.lifeSteal+=mc.modLifesteal;
    tw.modSlots.push(m.id);
    C.hand.splice(i,1);
  }}
  // Relic: giantBoost
  if(hasRelWithEffect('giantBoost')&&tw.sh==='circle')tw.dMul*=(1+relV('giantBoost'));
  C.grid[c+','+r]=tw;C.towers.push(tw);
  C.hand.splice(idx,1);if(typeof rHd==='function')rHd();
  spP(x,y,card.color,12);sfx('s');
}

// ── SELL TOWER ──
function sellTower(){
  var tw=G.cb.selTower;if(!tw)return;
  var prices={common:5,rare:10,epic:17,legendary:40};
  var val=prices[CARDS[tw.id].rarity]||5;
  addOuro(val);delete G.cb.grid[tw.c+','+tw.r];
  for(var i=0;i<G.cb.towers.length;i++){if(G.cb.towers[i]===tw){G.cb.towers.splice(i,1);break}}
  spP(tw.x,tw.y,'#888',8);fTx(tw.x,tw.y,'+'+val+'$','#ffd93d');
  G.cb.selTower=null;if(typeof clP==='function')clP();sfx('k');uH();
}

// ── UPGRADE ──
function doUp(){
  var tw=G.cb.selTower;if(!tw)return;
  var ms=maxSt(tw.cLv);if(tw.stars>=ms)return;
  var cost=STAR_COST[tw.stars]||99;if(G.player.ouro<cost)return;
  G.player.ouro-=cost;tw.stars++;
  spP(tw.x,tw.y,'#ffd93d',10);fTx(tw.x,tw.y,'STAR '+tw.stars+'!','#ffd93d');
  // Check ultimate unlock
  var card=CARDS[tw.id];
  if(tw.stars>=ms&&card.ultimate&&!tw.ultEff){
    tw.ultEff=true;fTx(tw.x,tw.y-20,'ULTIMATE!','#ffd93d');
    if(card.ultimate.onUnlock)card.ultimate.onUnlock(tw);
  }
  sfx('rw');if(typeof showTP==='function')showTP(tw);uH();
}
function setPrio(p){var tw=G.cb.selTower;if(tw){tw.priority=p;if(typeof showTP==='function')showTP(tw)}}
function cyclePrio(){var tw=G.cb.selTower;if(!tw)return;var ci=PRIO_ORDER.indexOf(tw.priority);tw.priority=PRIO_ORDER[(ci+1)%PRIO_ORDER.length];if(typeof showTP==='function')showTP(tw)}
function toggleTwAU(){var tw=G.cb.selTower;if(tw){tw.autoUp=!tw.autoUp;if(typeof showTP==='function')showTP(tw)}}
function toggleAutoActive(){var tw=G.cb.selTower;if(tw){tw.autoActive=!tw.autoActive;if(typeof showTP==='function')showTP(tw)}}

// ── ACTIVE SKILLS ──
function useActiveSkill(tw){
  if(!tw.activeSkill||tw.activeCD>0)return;
  var sk=tw.activeSkill;
  if(sk.type==='burst'){
    var rng2=twRange(tw);
    for(var i=0;i<G.cb.enemies.length;i++){var e=G.cb.enemies[i];if(dst(tw.x,tw.y,e.x,e.y)<=rng2)dmgE(e,twDmg(tw)*2,{type:tw.dmgType})}
    spP(tw.x,tw.y,tw.cl,20);fTx(tw.x,tw.y,sk.name+'!','#ffd93d');
  }
  if(sk.type==='buff'){
    tw.tempBuff=Math.max(tw.tempBuff,1.5);tw.tempBuffTimer=5;
    fTx(tw.x,tw.y,sk.name+'!','#ffd93d');
  }
  if(sk.type==='aoe_freeze'){
    for(var i=0;i<G.cb.enemies.length;i++){var e=G.cb.enemies[i];if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw))applyStatus(e,'freeze',2,0)}
    spP(tw.x,tw.y,'#74b9ff',15);
  }
  tw.activeCD=sk.cd||8;
  // CD reduction relic
  if(hasRelWithEffect('cdReduction'))tw.activeCD*=(1-relV('cdReduction'));
  sfx('sp');
}

// ═══════════════════ ENEMY SPAWN ═══════════════════

function initStatusSlots(e){
  e.statuses={};
  for(var id in STATUS_DB)e.statuses[id]={stacks:0,timer:0,tickTimer:0,dmgPerStack:0,duration:0};
}
function spawnE(tp,hm){
  var d=ENEMIES[tp];if(!d)return;
  var pos=cc(pathCells[0][0],pathCells[0][1]);
  var ne={tp:tp,x:pos[0],y:pos[1],hp:d.hp*hm,mh:d.hp*hm,sp:d.sp,g:d.g,xp:d.xp||1,pi:1,sva:0,stm:0,
    cl:d.cl||'#888',z:d.z,re:d.re||0,bo:!!d.bo,elite:!!d.elite,fly:d.fly||0,
    shield:(d.shield||0)*hm,maxShield:(d.shield||0)*hm,armor:d.armor||0,mr:d.mr||0,
    faction:d.faction||'neutral',tags:d.tags||[],size:d.size||'medium',
    ai:d.ai||'walker',stealth:!!d.stealth,corrupted:false,summons:d.summons||null,
    summonCD:0,summoned:false,summonerRef:null,evolvesTo:d.evolvesTo||null,
    phases:d.phases||null,bossDrop:d.bossDrop||null,phase:0,
    auraDmg:d.auraDmg||0,auraRange:d.auraRange||0,
    healAura:d.healAura||0,healAuraRange:d.healAuraRange||0,
    slowAura:d.slowAura||0,slowAuraRange:d.slowAuraRange||0,
    towerDisable:d.towerDisable||0,summonOnKill:d.summonOnKill||null,
    hitTimer:0,shatM:1,shatT:0,pd:0,ptm:0,poisonStacks:0,
    statuses:{},marked:false,vulnMul:1,weakStatusMul:1,shockStacks:0,
    markDmgMul:1,exposedMul:1,stoneMul:1,berserkDmgMul:1,
    armorReduction:0,mrReduction:0,abilityCDs:[],revealed:false,buffedSpd:1,
    spawnDmgApplied:false};
  initStatusSlots(ne);
  if(d.elite){ne.hp*=3;ne.mh*=3;ne.sp*=1.2;ne.g*=4}
  var sd=relV('spawnDmg');if(sd>0)ne.hp=Math.max(1,ne.hp-sd);
  ne.mh=ne.hp;
  // Corrupted relic: +20% enemies (handled in genWave, not here)
  G.cb.enemies.push(ne);
}

// ═══════════════════ DAMAGE SYSTEM ═══════════════════

function dmgE(e,d,opts){
  opts=opts||{};
  var type=opts.type||'physical';
  if(!e.statuses)initStatusSlots(e);
  if(e.statuses['invulnerable']&&e.statuses['invulnerable'].stacks>0){fTx(e.x,e.y,'IMUNE','#ffd93d');return}
  if(e.statuses['sleep']&&e.statuses['sleep'].stacks>0){removeStatus(e,'sleep');fTx(e.x,e.y,'ACORDOU!','#dfe6e9')}

  // Relic: highHpBonus
  if(hasRelWithEffect('highHpBonus')&&e.hp>e.mh*.9)d*=1.25;
  // Relic: slowBonus
  if(hasRelWithEffect('slowBonus')&&e.sva>.2)d*=1.1;
  // Relic: corrupted basic
  if(hasRelWithEffect('corrupted_basic'))d*=1.15;
  // Boss kill cumulative
  if(G.bossKillBonus)d*=(1+G.bossKillBonus);
  // Vulnerable
  var vuln=e.vulnMul||1;
  // Mark
  var mark=e.markDmgMul||1;
  // Exposed (crit)
  if(opts.crit){var exp=e.exposedMul||1;d*=exp}
  // Stone
  var stone=e.stoneMul||1;
  d*=vuln*mark*stone;
  // Shock amplifies electric
  if(type==='lightning'&&e.shockStacks>0)d*=(1+e.shockStacks*.1);
  // Type resistances
  if(e.dmgRes&&e.dmgRes[type]!==undefined){var mult=e.dmgRes[type];if(mult===0){fTx(e.x,e.y,'IMUNE','#888');return}d*=mult}
  // Armor
  if(type==='physical'&&!opts.ap){var arm=Math.max(0,(e.armor||0)-(e.armorReduction||0));d=Math.max(1,d-arm)}
  // MR
  if(type==='magical'||type==='fire'||type==='ice'||type==='lightning'||type==='holy'||type==='dark'){
    var mr=Math.max(0,(e.mr||0)-(e.mrReduction||0));
    // Relic: poisonPierce
    if(type!=='physical'&&hasRelWithEffect('poisonPierce'))mr*=.5;
    d=Math.max(1,d*(1-mr/100));
  }
  // Splash resist for giant
  if(opts.sp&&e.size==='giant')d*=.3;
  // Boss damage relic
  var bossDmg=relV('bossDmg');if(bossDmg&&e.bo)d*=(1+bossDmg);

  // Shield
  var shieldMult=(e.statuses['fragile']&&e.statuses['fragile'].stacks>0)?.5:1;
  if(e.shield>0){var actualShield=e.shield*shieldMult;var ab=Math.min(actualShield,d);e.shield-=ab/shieldMult;d-=ab;if(ab>0)fTx(e.x,e.y-20,Math.floor(ab)+'\u2611','#5bc0ff')}
  // Barrier
  if(e.statuses['barrier']&&e.statuses['barrier'].stacks>0){removeStatus(e,'barrier');fTx(e.x,e.y,'BARRA!','#a29bfe');return}

  e.hp-=Math.max(0,d);
  fTx(e.x,e.y-10,Math.floor(Math.max(0,d))+'','#fff');

  // Relic: tower lifesteal
  if(opts.type&&d>0&&hasRelWithEffect('towerLifesteal')){var h=d*.03;if(h>=.5)healPlayer(h)}
}

// ═══════════════════ STATUS ENGINE (GDD Cap.2) ═══════════════════

function applyStatus(e,statusId,duration,power,source){
  if(!e||!e.statuses)return;
  var db=STATUS_DB[statusId];if(!db)return;
  // Immunity check
  if(e.tags){for(var i=0;i<e.tags.length;i++){if(db.immune.indexOf(e.tags[i])>=0){fTx(e.x,e.y,'IMUNE','#888');return}}}
  if(e.faction&&db.immune.indexOf(e.faction)>=0){fTx(e.x,e.y,'IMUNE','#888');return}

  // Relic: burnBoost
  if(statusId==='burn'&&hasRelWithEffect('burnBoost')){duration*=1.5;power*=1.2}
  // Relic: freezeBoost
  if(statusId==='freeze'&&hasRelWithEffect('freezeBoost')){duration*=(e.bo?1.25:e.elite?1.375:1.5)}
  // Relic: bossControl
  if(hasRelWithEffect('bossControl')&&(e.bo||e.elite))duration*=1.1;

  // Boss/Elite multiplier
  if(e.bo&&db.bossMult===0)return;
  if(e.elite&&db.bossMult===0)return;
  if(e.bo)duration*=db.bossMult;
  else if(e.elite)duration*=db.eliteMult;

  // Boss fear -> slow
  if(statusId==='fear'&&e.bo){statusId='slow';db=STATUS_DB['slow']}
  // Boss sleep immune
  if(statusId==='sleep'&&e.bo)return;
  // Fear + Root fails
  if(statusId==='fear'&&e.statuses['root']&&e.statuses['root'].stacks>0)return;

  var cur=e.statuses[statusId];

  // Sleep breaks on damage
  if(statusId!=='sleep'&&cur&&cur.stacks>0){var sl=e.statuses['sleep'];if(sl&&sl.stacks>0){sl.stacks=0;sl.timer=0;fTx(e.x,e.y,'ACORDOU!','#dfe6e9')}}

  // Interactions
  if(db.interactions){
    if(db.interactions.removes){for(var r=0;r<db.interactions.removes.length;r++){var rem=db.interactions.removes[r];if(e.statuses[rem]&&e.statuses[rem].stacks>0){e.statuses[rem].stacks=0;e.statuses[rem].timer=0;fTx(e.x,e.y,'-'+rem,'#74b9ff')}}}
    if(db.interactions.consumes){for(var c=0;c<db.interactions.consumes.length;c++){var con=db.interactions.consumes[c];if(e.statuses[con]&&e.statuses[con].stacks>0){e.statuses[con].stacks=0;e.statuses[con].timer=0}}}
    if(db.interactions.removesAllDebuffs){for(var sid in STATUS_DB){if(STATUS_DB[sid].positive===false&&e.statuses[sid]){e.statuses[sid].stacks=0;e.statuses[sid].timer=0}}}
  }

  // Cross: Wet+Shock doubles duration
  if(statusId==='shock'&&e.statuses['wet']&&e.statuses['wet'].stacks>0){duration*=2;fTx(e.x,e.y,'WET+SHOCK!','#ffd93d')}
  if(statusId==='freeze'&&e.statuses['wet']&&e.statuses['wet'].stacks>0){duration*=1.5}
  // Oil+Burn
  if(statusId==='burn'&&e.statuses['oil']&&e.statuses['oil'].stacks>0){power*=2;e.statuses['oil'].stacks=0;e.statuses['oil'].timer=0;spP(e.x,e.y,'#ff6600',15);fTx(e.x,e.y,'EXPLOSAO!','#ff6600')}
  // Oil+Shock
  if(statusId==='shock'&&e.statuses['oil']&&e.statuses['oil'].stacks>0){e.hp-=50;e.statuses['oil'].stacks=0;e.statuses['oil'].timer=0;spP(e.x,e.y,'#ffd93d',20);fTx(e.x,e.y,'-50!','#ffd93d');G.cb.shake=Math.max(G.cb.shake,8)}
  // Poison+Burn -> Toxic Burn
  if(statusId==='burn'&&e.statuses['poison']&&e.statuses['poison'].stacks>0){applyStatus(e,'toxic_burn',duration,power*1.5,source);return}

  // Stone blocks DOT
  if(e.statuses['stone']&&e.statuses['stone'].stacks>0){if(statusId==='burn'||statusId==='poison'||statusId==='bleed')return}

  // Stack/refresh
  if(!cur){cur={stacks:0,timer:0,tickTimer:0,dmgPerStack:0,duration:0};e.statuses[statusId]=cur}
  if(db.canStack){
    if(db.refreshRule==='refresh'){cur.stacks=Math.min(cur.stacks+1,db.maxStacks);cur.timer=duration;cur.duration=duration}
    else if(db.refreshRule==='ignore'&&cur.stacks>0){}
    else{cur.stacks=Math.min(cur.stacks+1,db.maxStacks);cur.timer=Math.max(cur.timer,duration)}
  }else{
    if(db.refreshRule==='ignore'&&cur.stacks>0)return;
    cur.stacks=1;cur.timer=duration;cur.duration=duration;
  }
  cur.dmgPerStack=power||db.baseDmg||0;cur.tickTimer=0;
  if(statusId==='mark')e.marked=true;

  // Relic: statusPrism
  if(hasRelWithEffect('statusPrism')&&Math.random()<.2){
    var comp=[];
    if(statusId==='burn')comp=['vulnerable','exposed'];
    else if(statusId==='poison')comp=['weak','vulnerable'];
    else if(statusId==='freeze')comp=['exposed','vulnerable'];
    else if(statusId==='shock')comp=['vulnerable'];
    else comp=['weak','vulnerable','exposed'];
    if(comp.length){var ex=comp[Math.random()*comp.length|0];applyStatusStatusOnly(e,ex,duration*.5,power*.5);fTx(e.x,e.y-20,'PRISMA!','#ffd93d')}
  }
}
function applyStatusStatusOnly(e,sid,dur,pow){var db=STATUS_DB[sid];if(!db||!e.statuses)return;var cur=e.statuses[sid];if(!cur)cur={stacks:0,timer:0,tickTimer:0,dmgPerStack:0,duration:0};e.statuses[sid]=cur;if(db.canStack){cur.stacks=Math.min(cur.stacks+1,db.maxStacks);cur.timer=dur}else{cur.stacks=1;cur.timer=dur}cur.dmgPerStack=pow||db.baseDmg||0;cur.duration=dur}

function removeStatus(e,statusId){if(!e||!e.statuses||!e.statuses[statusId])return;e.statuses[statusId].stacks=0;e.statuses[statusId].timer=0;if(statusId==='mark')e.marked=false}

function processStatuses(e,dt){
  if(!e||!e.statuses)return;
  for(var oi=0;oi<STATUS_ORDER.length;oi++){
    var cat=STATUS_ORDER[oi];
    for(var sid in STATUS_DB){
      var db=STATUS_DB[sid];if(db.cat!==cat)continue;
      var st=e.statuses[sid];if(!st||st.stacks<=0)continue;
      // Timer
      if(st.timer>0){
        // Chama Eterna: burn never expires
        if(sid==='burn'&&hasRelWithEffect('burnPermanent')){st.timer=st.duration||st.timer}
        else{st.timer-=dt}
        if(st.timer<=0){st.stacks=0;st.timer=0;if(sid==='freeze')applyStatus(e,'slow',3,.5);continue}
      }
      // DOT
      if(db.cat==='dot'&&db.tickRate>0){
        st.tickTimer+=dt;
        while(st.tickTimer>=db.tickRate){
          st.tickTimer-=db.tickRate;
          var dotDmg=st.dmgPerStack*st.stacks;
          if(sid==='bleed'){var spd=e.sp*(1-Math.min(e.sva,1))*(e.buffedSpd||1);if(spd<5)continue}
          e.hp-=dotDmg;
          fTx(e.x+(Math.random()-.5)*10,e.y-10,Math.floor(dotDmg)+'',db.visual.color);
          spP(e.x+(Math.random()-.5)*10,e.y+(Math.random()-.5)*10,db.visual.color,2);
        }
      }
      // CC
      if(db.cat==='cc'){
        if(sid==='freeze'||sid==='stun'||sid==='sleep'||sid==='stone')e.sva=Math.max(e.sva,1);
        if(sid==='root')e.sva=Math.max(e.sva,.95);
        if(sid==='fear'){e.sva=Math.max(e.sva,.85);st.tickTimer=(st.tickTimer||0)+dt;if(st.tickTimer>=.6){st.tickTimer=0;e.pi=Math.max(0,e.pi-1)}}
        if(sid==='confusion'){if(Math.random()<.005)e.pi=Math.max(0,e.pi-1)}
      }
      // Slow
      if(sid==='slow')e.sva=Math.max(e.sva,Math.min(.35*st.stacks,.8));
      // Debuffs
      if(sid==='vulnerable')e.vulnMul=1.3;
      if(sid==='weak')e.weakStatusMul=.7;
      if(sid==='fragile'&&e.shield>0)e.shield*=.998;
      if(sid==='curse'){e.armorReduction=st.stacks;e.mrReduction=st.stacks*2}
      if(sid==='shock')e.shockStacks=st.stacks;
      if(sid==='mark'){e.marked=true;e.markDmgMul=1.15}
      if(sid==='exposed')e.exposedMul=1.25;
      if(sid==='stone')e.stoneMul=.3;
      // Regen
      if(sid==='regen'){st.tickTimer=(st.tickTimer||0)+dt;if(st.tickTimer>=db.tickRate){st.tickTimer=0;e.hp=Math.min(e.mh,e.hp+st.stacks*5)}}
      // Berserk
      if(sid==='berserk'){var mp=1-(e.hp/e.mh);e.berserkDmgMul=1+mp*2}
    }
  }
}

// ═══════════════════ ENEMY KILL ═══════════════════

function kE(e){
  addOuro(e.g);
  var ha=relV('twHeal');if(ha>0){healPlayer(ha);fTx(e.x,e.y,'+'+ha+'HP','#44ff44')}
  for(var j=0;j<G.cb.towers.length;j++){
    var tw=G.cb.towers[j];
    if(tw.frenzy&&dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){tw.cd=0;spP(tw.x,tw.y,'#ff9f43',5)}
    if(tw.lifeSteal>0&&dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){healPlayer(tw.lifeSteal);fTx(tw.x,tw.y,'+'+tw.lifeSteal+'HP','#44ff44')}
  }
  if(e.tp==='weakness_mob')for(var j=0;j<G.cb.towers.length;j++){var tw=G.cb.towers[j];if(dst(tw.x,tw.y,e.x,e.y)<=2.5*CL){tw.weakMul=.8;tw.weakTimer=5;spP(tw.x,tw.y,'#ff44aa',8);fTx(tw.x,tw.y,'FRAQUEZA!','#ff44aa')}}
  if(e.summons){for(var j=G.cb.enemies.length-1;j>=0;j--){if(G.cb.enemies[j].summonerRef===e){spP(G.cb.enemies[j].x,G.cb.enemies[j].y,'#888',5);G.cb.enemies.splice(j,1)}}}
  if(e.summonOnKill){for(var s=0;s<e.summonOnKill.count;s++){spawnE(e.summonOnKill.type,.5);var ne=G.cb.enemies[G.cb.enemies.length-1];ne.x=e.x+(Math.random()-.5)*20;ne.y=e.y+(Math.random()-.5)*20;ne.pi=e.pi;ne.summoned=true}}
  if(e.evolvesTo&&ENEMIES[e.evolvesTo]){spawnE(e.evolvesTo,1);var ne=G.cb.enemies[G.cb.enemies.length-1];ne.x=e.x;ne.y=e.y;ne.pi=e.pi;ne.summoned=true;fTx(e.x,e.y,'EVOLUIU!','#ff9f43')}
  if(e.bossDrop&&RELICS[e.bossDrop]){addRelic(e.bossDrop);fTx(e.x,e.y-20,RELICS[e.bossDrop].ic+' '+RELICS[e.bossDrop].n,'#ffd93d')}
  // Relic hooks on kill
  onEnemyKillRelics(e,e.x,e.y);
  // Event reward flags
  if(G.stealReward&&(e.bo||e.elite)){G.stealReward=false;var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(pool.length){addRelic(shf(pool)[0]);fTx(e.x,e.y,'RECOMPENSA!','#ffd93d')}}
  if(G.arenaReward&&e.elite){G.arenaReward=false;var pool=Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0&&!RELICS[r].corrupted});if(pool.length){addRelic(shf(pool)[0]);fTx(e.x,e.y,'ARENA!','#ffd93d')}}
  if(G.luaReward&&e.elite){G.luaReward=false;var pool=Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0&&!RELICS[r].corrupted});if(pool.length){addRelic(shf(pool)[0]);fTx(e.x,e.y,'LUA!','#ffd93d')}}
  if(G.devBossReward&&e.bo){G.devBossReward=false;var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='unique'&&G.player.relics.indexOf(r)<0});if(!pool.length)pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='divine'&&G.player.relics.indexOf(r)<0});if(pool.length){addRelic(shf(pool)[0]);fTx(e.x,e.y-20,'SEGREDO!','#fd79a8')}}
  spP(e.x,e.y,e.bo?'#ff4444':'#ffd93d',e.bo?20:8);fTx(e.x,e.y,'+'+e.g+'au','#ffd93d');sfx('k');
  for(var i=0;i<G.cb.towers.length;i++){var tw=G.cb.towers[i];if(tw.trib&&tw.trib.trigger==='tower_kill'&&tw.tribReady){if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)*2){tw.trib.execute(tw);tw.tribCD=tw.trib.cd||10;tw.tribReady=false}}}
}
function enEnd(e){var enDmg=10;if(hasRelWithEffect('corrupted_basic'))enDmg=Math.ceil(enDmg*1.1);G.player.hp=Math.max(G.player.hp-enDmg,0);fTx(e.x,e.y,'-'+enDmg+' HP!','#e84855');G.cb.shake=Math.max(G.cb.shake,8)}

// ═══════════════════ BOSS LOGIC ═══════════════════

function uBoss(e,dt){
  if(!e.phases||e.bo)return;
  // Regular boss ability cooldowns
  for(var i=0;i<(e.abilityCDs||[]).length;i++){
    if(e.abilityCDs[i]>0)e.abilityCDs[i]-=dt;
  }
}

// ═══════════════════ PROJECTILES ═══════════════════

function createProj(tw,tgt){
  return{tgt:tgt,x:tw.x,y:tw.y,sp:350,dm:twDmg(tw),cl:tw.cl,sz:3,
    pierce:tw.pierce||0,chain:tw.chain||0,chainRange:tw.chainRange||2,
    slow:tw.slow||0,slowDur:tw.slowDur||0,stun:tw.stun||0,
    splDmg:tw.splDmg||0,splRad:tw.splRad||0,
    freeze:tw.freeze||false,freezeDur:tw.freezeDur||0,
    burnDmg:tw.burnDmg||0,burnDur:tw.burnDur||0,
    poisonDmg:tw.poisonDmg||0,poisonDur:tw.poisonDur||0,
    bleedDmg:tw.bleedDmg||0,bleedDur:tw.bleedDur||0,
    dmgType:tw.dmgType||'physical',armPrc:tw.armPrc||false,
    execThresh:tw.execThresh||0,canAir:tw.canAir||false,
    hit:{},critChance:tw.critChance||0};
}
function uPj(dt){
  var C=G.cb;
  for(var i=C.projectiles.length-1;i>=0;i--){
    var p=C.projectiles[i],t=p.tgt;
    if(!t||t.hp<=0){C.projectiles.splice(i,1);continue}
    var dx=t.x-p.x,dy=t.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<8){pjHit(p);C.projectiles.splice(i,1);continue}
    var mv=p.sp*dt;p.x+=dx/d*mv;p.y+=dy/d*mv;
  }
}
function pjHit(p){
  var t=p.tgt;if(!t||t.hp<=0)return;if(t.fly&&!p.canAir)return;
  if(!t.statuses)initStatusSlots(t);
  var isCrit=p.critChance>0&&Math.random()<p.critChance;
  var d=p.dm;if(isCrit)d*=2;
  var hOpts={type:p.dmgType||'physical',crit:isCrit};
  if(p.armPrc)hOpts.ap=true;
  if(p.execThresh>0&&t.hp<=t.mh*p.execThresh)dmgE(t,99999,hOpts);
  else dmgE(t,d,hOpts);
  spP(t.x,t.y,p.cl,4);
  // Status application
  if(p.stun>0)applyStatus(t,'stun',p.stun,p.dm);
  if(p.slow>0)applyStatus(t,'slow',p.slowDur,p.slow);
  if(p.poisonDmg>0)applyStatus(t,'poison',p.poisonDur,p.poisonDmg);
  if(p.bleedDmg>0)applyStatus(t,'bleed',p.bleedDur,p.bleedDmg);
  if(p.burnDmg>0)applyStatus(t,'burn',p.burnDur,p.burnDmg);
  if(p.freeze)applyStatus(t,'freeze',p.freezeDur||2,0);
  // Splash
  if(p.splDmg>0){for(var j=0;j<G.cb.enemies.length;j++){var e=G.cb.enemies[j];if(e!==t&&dst(t.x,t.y,e.x,e.y)<=p.splRad*CL&&(!e.fly||p.canAir))dmgE(e,p.splDmg*.5,{type:p.dmgType,sp:true})}spP(t.x,t.y,'#ff6b6b',10);G.cb.shake=Math.max(G.cb.shake,3)}
  // Chain
  if(p.chain>0){
    var lt=t,ch={};ch[t.x+','+t.y]=1;
    for(var ci=0;ci<p.chain;ci++){
      var nd=null,dd=p.chainRange*CL;
      for(var j=0;j<G.cb.enemies.length;j++){var e=G.cb.enemies[j],key=e.x+','+e.y;if(!ch[key]&&(!e.fly||p.canAir)){var di=dst(lt.x,lt.y,e.x,e.y);if(di<dd){nd=e;dd=di}}}
      if(nd){dmgE(nd,d*.6,{type:p.dmgType});ch[nd.x+','+nd.y]=1;spP(nd.x,nd.y,'#ffd93d',3);lt=nd}else break;
    }
  }
}

// ═══════════════════ TOWER UPDATE ═══════════════════

function uTw(dt){
  var C=G.cb;
  for(var i=0;i<C.towers.length;i++){
    var tw=C.towers[i];
    // Frozen check
    if(tw.frozen){if(tw.frozenTimer>0)tw.frozenTimer-=dt;if(tw.frozenTimer<=0)tw.frozen=false;continue}
    // Slow aura
    if(tw.slwA>0){for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw))e.sva=Math.max(e.sva,tw.slwA)}}
    // Buff aura
    if(tw.buffAura){for(var j=0;j<C.towers.length;j++){var o=C.towers[j];if(o!==tw&&dst(tw.x,tw.y,o.x,o.y)<=tw.buffAura.range*CL){if(tw.buffAura.type==='dmg')o.dMul=Math.max(o.dMul,1+tw.buffAura.value)}}}
    // Farm
    if(tw.sub==='farm'){continue}
    // Mine layer
    if(tw.mineDmg>0){tw.mineTimer=(tw.mineTimer||0)+dt;if(tw.mineTimer>=tw.mineRate){tw.mineTimer=0;C.mines.push({x:tw.x+rng(-CL,CL),y:tw.y+rng(-CL,CL),dmg:tw.mineDmg,radius:CL*1.5,life:15});spP(tw.x,tw.y,'#e17055',5)}}
    // Summon
    if(tw.summon){tw.summonTimer=(tw.summonTimer||0)+dt;if(tw.summonTimer>=tw.summon.interval){tw.summonTimer=0;fTx(tw.x,tw.y,'SUMMON!','#a29bfe')}}

    // Normal attack
    var tgt=findTarget(tw);
    if(tgt){
      tw.cd-=dt;
      if(tw.cd<=0){
        if(tw.laser){C.beams.push({x1:tw.x,y1:tw.y,x2:tgt.x,y2:tgt.y,cl:tw.cl,timer:.3});dmgE(tgt,twDmg(tw),{type:tw.dmgType});spP(tgt.x,tgt.y,tw.cl,3)}
        else{C.projectiles.push(createProj(tw,tgt))}
        tw.cd=1/twSpd(tw);sfx('s');
      }
    }
    // Nova pulse
    if(tw.nova){tw.novaTimer=(tw.novaTimer||0)+dt;if(tw.novaTimer>=tw.novaCD){tw.novaTimer=0;for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){dmgE(e,twDmg(tw)*.5,{type:tw.dmgType});if(tw.freeze)applyStatus(e,'freeze',tw.freezeDur||2,0)}}spP(tw.x,tw.y,tw.cl,15)}}

    // Auto-active
    if(tw.autoActive&&tw.activeSkill&&tw.activeCD<=0)useActiveSkill(tw);

    // Timers
    if(tw.activeCD>0)tw.activeCD-=dt;
    if(tw.tribCD>0){tw.tribCD-=dt;if(tw.tribCD<=0)tw.tribReady=true}
    if(tw.weakTimer>0){tw.weakTimer-=dt;if(tw.weakTimer<=0)tw.weakMul=1}
    if(tw.tempBuffTimer>0){tw.tempBuffTimer-=dt;if(tw.tempBuffTimer<=0)tw.tempBuff=1}
    if(tw.tempRangeBuffTimer>0){tw.tempRangeBuffTimer-=dt;if(tw.tempRangeBuffTimer<=0)tw.tempRangeBuff=1}
    if(tw.frozenTimer>0){tw.frozenTimer-=dt;if(tw.frozenTimer<=0)tw.frozen=false}
  }
  // Farm gold at wave end (handled in wave complete)
}

// ═══════════════════ ENEMY UPDATE ═══════════════════

function uEn(dt){
  var C=G.cb;
  // Reset per-frame
  for(var i=0;i<C.enemies.length;i++){
    var e=C.enemies[i];
    e.sva=0;e.buffedSpd=1;e.vulnMul=1;e.weakStatusMul=1;e.shockStacks=0;
    e.markDmgMul=1;e.exposedMul=1;e.stoneMul=1;e.berserkDmgMul=1;
    e.armorReduction=0;e.mrReduction=0;e.marked=false;
    if(C.revealAll)e.revealed=true;
  }
  // Auras
  for(var i=0;i<C.enemies.length;i++){
    var e=C.enemies[i];
    if(!C.revealAll){e.revealed=false;for(var j=0;j<C.towers.length;j++){if(dst(e.x,e.y,C.towers[j].x,C.towers[j].y)<=1.5*CL){e.revealed=true;break}}}
    if(e.auraSpd>0)for(var j=0;j<C.enemies.length;j++){var o=C.enemies[j];if(o!==e&&dst(e.x,e.y,o.x,o.y)<=2*CL)o.buffedSpd=Math.max(o.buffedSpd,e.auraSpd)}
    if(e.healAura>0)for(var j=0;j<C.enemies.length;j++){var o=C.enemies[j];if(o!==e&&dst(e.x,e.y,o.x,o.y)<=e.healAuraRange*CL)o.hp=Math.min(o.mh,o.hp+e.healAura*dt)}
    if(e.slowAura>0)for(var j=0;j<C.towers.length;j++){if(dst(e.x,e.y,C.towers[j].x,C.towers[j].y)<=e.slowAuraRange*CL){C.towers[j].frozen=true;C.towers[j].frozenTimer=Math.max(C.towers[j].frozenTimer,.3)}}
    if(e.towerDisable>0&&e.hitTimer<=0)for(var j=0;j<C.towers.length;j++){if(dst(e.x,e.y,C.towers[j].x,C.towers[j].y)<=1.5*CL){C.towers[j].frozen=true;C.towers[j].frozenTimer=Math.max(C.towers[j].frozenTimer,e.towerDisable);e.hitTimer=10;break}}
    if(e.ai==='berserker'){var mp=1-e.hp/e.mh;e.buffedSpd=Math.max(e.buffedSpd,1+mp*2)}
    if(e.summons&&!e.summoned){e.summonCD-=dt;if(e.summonCD<=0){e.summonCD=e.summons.cooldown;for(var s=0;s<e.summons.count;s++){spawnE(e.summons.type,.8);var ne=C.enemies[C.enemies.length-1];ne.x=e.x+(Math.random()-.5)*20;ne.y=e.y+(Math.random()-.5)*20;ne.pi=e.pi;ne.summoned=true;ne.summonerRef=e}spP(e.x,e.y,'#8e44ad',15)}}
    if(e.phases)uBoss(e,dt);
  }
  // Process & move
  for(var i=C.enemies.length-1;i>=0;i--){
    var e=C.enemies[i];
    processStatuses(e,dt);
    if(e.hitTimer>0)e.hitTimer-=dt;
    if(e.shatT>0){e.shatT-=dt;if(e.shatT<=0)e.shatM=1}
    if(e.re)e.hp=Math.min(e.mh,e.hp+e.re*dt);
    // Death
    if(e.hp<=0){
      if(e.statuses['infection']&&e.statuses['infection'].stacks>0){for(var j=0;j<C.enemies.length;j++){if(C.enemies[j]!==e&&dst(e.x,e.y,C.enemies[j].x,C.enemies[j].y)<=2*CL)applyStatus(C.enemies[j],'poison',4,3)}spP(e.x,e.y,'#44aa44',15)}
      if(e.statuses['corruption']&&e.statuses['corruption'].stacks>0){for(var j=0;j<C.enemies.length;j++){if(C.enemies[j]!==e&&dst(e.x,e.y,C.enemies[j].x,C.enemies[j].y)<=2*CL)applyStatus(C.enemies[j],'corruption',5,e.statuses['corruption'].stacks*.5)}spP(e.x,e.y,'#662266',20);G.cb.shake=Math.max(G.cb.shake,5)}
      if(e.phases>0){e.phases--;e.hp=e.mh*.5;e.mh=e.hp;e.sp*=1.3;e.cl='#1abc9c';initStatusSlots(e);spP(e.x,e.y,'#2ecc71',20);fTx(e.x,e.y,'EVOLUIU!','#2ecc71');sfx('k');continue}
      kE(e);C.deadEnemies.push(e.tp);C.enemies.splice(i,1);continue;
    }
    if(e.pi>=pathCells.length){enEnd(e);C.enemies.splice(i,1);continue}
    // Movement
    var spd=e.sp*(1-Math.min(e.sva,1))*(e.buffedSpd||1)*(C.slowEnemiesMod||1)*dt;
    if(e.corrupted)spd=e.sp*(e.buffedSpd||1)*(C.slowEnemiesMod||1)*dt;
    var pos=cc(pathCells[e.pi][0],pathCells[e.pi][1]),dx=pos[0]-e.x,dy=pos[1]-e.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<spd){e.x=pos[0];e.y=pos[1];e.pi++;if(e.pi>=pathCells.length){enEnd(e);C.enemies.splice(i,1)}}
    else{e.x+=dx/d*spd;e.y+=dy/d*spd}
  }
}

// ═══════════════════ PARTICLES ═══════════════════

function uPart(dt){
  var C=G.cb;
  for(var i=C.particles.length-1;i>=0;i--){var p=C.particles[i];p.l+=dt;if(p.l>=p.ml){C.particles.splice(i,1);continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt}
  for(var i=C.floats.length-1;i>=0;i--){var f=C.floats[i];f.l+=dt;f.y-=30*dt;if(f.l>=f.ml)C.floats.splice(i,1)}
  for(var i=C.beams.length-1;i>=0;i--){C.beams[i].timer-=dt;if(C.beams[i].timer<=0)C.beams.splice(i,1)}
  for(var i=C.mines.length-1;i>=0;i--){var m=C.mines[i];m.life-=dt;if(m.life<=0){C.mines.splice(i,1);continue}
    for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(dst(m.x,m.y,e.x,e.y)<=m.radius){dmgE(e,m.dmg,{type:'physical'});spP(m.x,m.y,'#e17055',15);C.shake=Math.max(C.shake,5);C.mines.splice(i,1);break}}}
  if(C.announce.timer>0)C.announce.timer-=dt;
}

// ═══════════════════ PATH GENERATION ═══════════════════

var pathCells=[];
function genPath(){
  pathCells=[];pathSet={};
  var r=Math.floor(RN/2),dir=1,c=0;
  while(c<CN){
    pathCells.push([c,r]);
    pathSet[c+','+r]=1;
    if(Math.random()<.3&&r>1&&r<RN-2){r+=dir;if(r<=1||r>=RN-2)dir*=-1}
    c++;
  }
}

// ═══════════════════ MAP GENERATION ═══════════════════

function genMap(){
  G.map={nodes:[],curId:0,totalH:0,scrollY:0,revealFloor:1};
  var layers=[
    [{t:'normal'},{t:'normal'},{t:'event'}],
    [{t:'elite'},{t:'shop'},{t:'event'}],
    [{t:'normal'},{t:'normal'},{t:'chest'}],
    [{t:'elite'},{t:'event'},{t:'elite'}],
    [{t:'boss'}]
  ];
  var id=0,startY=80;
  for(var li=0;li<layers.length;li++){
    var layer=layers[li],y=startY+li*140,step=W/(layer.length+1);
    for(var ni=0;ni<layer.length;ni++){
      var x=step*(ni+1)+rng(-15,15);
      G.map.nodes.push({id:id,x:x,y:y,type:layer[ni].t,fl:li,conn:[],done:false,av:li===0});
      id++;
    }
  }
  for(var li=0;li<layers.length-1;li++){
    var cur=[],nxt=[];
    for(var i=0;i<G.map.nodes.length;i++){
      if(G.map.nodes[i].fl===li)cur.push(i);
      if(G.map.nodes[i].fl===li+1)nxt.push(i);
    }
    for(var i=0;i<cur.length;i++){
      var conns=Math.min(2,nxt.length);
      for(var j=0;j<conns;j++){
        if(G.map.nodes[cur[i]].conn.indexOf(nxt[j])<0)G.map.nodes[cur[i]].conn.push(nxt[j]);
      }
    }
  }
  G.map.totalH=startY+layers.length*140+100;
}



// ═══════════════════ NODE NAVIGATION ═══════════════════


// ═══════════════════ GAME START FLOW ═══════════════════

function startGame(){
  $('oM').classList.add('h');
  $('oDiff').classList.remove('h');
}

function pickDiff(d){
  G.difficulty=d;
  $('oDiff').classList.add('h');
  showFactionSelect();
}

function doStartGame(){
  var cc=G.player?G.player.carriedCard:null;
  var cr=G.player?G.player.carriedRelic:null;
  var fv=G.player?G.player.firstVictory:false;
  var pd=G.difficulty||'normal';
  var pf=G.faction||'neutral';

  resetAll();
  G.player.firstVictory=fv;
  G.difficulty=pd;
  G.faction=pf;

  if(cr){G.player.relics.push(cr);G.player.carriedRelic=null}
  initDeck();
  if(cc){G.player.deck.push(cc);G.player.carriedCard=null}

  applyStartRelics();
  genPath();genMap();
  G.state='MAP';

  // FIX 1: 'oG' REMOVIDO da lista — canvas precisa ficar visivel
  var ids=['oM','oV','oR','oSh','oCf','oEv','oDk','oDC','oDiff','oTut','oFac'];
  for(var i=0;i<ids.length;i++)$(ids[i]).classList.add('h');

  $('cb').style.display='none';
  $('hn').style.display='none';
  $('siDob').style.display='';
  $('siM').style.display='none';
  $('siW').style.display='none';
  $('siP').style.display='none';
  $('bA').classList.remove('on');
  $('bS').classList.remove('on');
  $('bS').textContent='1x';

  G.autoWv=false;speedIdx=0;G.spd=1;
  uH();
}

function enterNode(id){
  var nd=G.map.nodes[id];if(!nd.av)return;
  G.map.curId=id;nd.done=true;
  for(var i=0;i<nd.conn.length;i++){
    if(nd.conn[i]>=0&&nd.conn[i]<G.map.nodes.length)
      G.map.nodes[nd.conn[i]].av=true;
  }
  // FIX 2: nd.layer → nd.fl (propriedade correta do genMap)
  G.map.revealFloor=Math.max(G.map.revealFloor,nd.fl+2);
  G.nodeCount++;
  G.player.dobroes+=relV('ndGold');
  switch(nd.type){
    case'normal':startEnc('normal');break;
    case'elite':startEnc('elite_enc');break;
    case'boss':startEnc('boss');break;
    case'skull':startEnc('skull');break;
    case'shop':showShop();break;
    case'event':showEv();break;
    case'chest':showChest();break;
  }
  uH();
}

function compNode(){
  var nd=G.map.nodes[G.map.curId];
  // Check if boss node -> victory
  if(nd&&(nd.type==='boss'||nd.type==='skull')){
    if(!G.player.firstVictory){G.player.firstVictory=true}
    showVictory();return;
  }
  // Check if there are available next nodes
  var hasNext=false;
  for(var i=0;i<nd.conn.length;i++){if(!G.map.nodes[nd.conn[i]].done)hasNext=true}
  if(!hasNext){showVictory();return}
  G.state='MAP';$('cb').style.display='none';$('hn').style.display='none';
  $('siDob').style.display='';$('siM').style.display='none';$('siW').style.display='none';$('siP').style.display='none';
  uH();
}

// ═══════════════════ ENCOUNTER START ═══════════════════

function startEnc(type){
  G.state='COMBAT';resetCombat();
  var C=G.cb,enc=ENC[type];
  C.encType=type;C.totalW=enc.wv;C.encW=0;C.diff=1+G.nodeCount*.2;
  C.maxMana=5+relV('maxMana')+relV('startMana')+(G._permMana||0);
  C.mana=C.maxMana;C.leftoverMana=0;
  // FIX 3: doomClock removido — ja aplicado em applyStartRelics e addRelic
  genPath();
  C.drawPile=shf(G.player.deck.slice());C.discardPile=[];
  $('cb').style.display='flex';$('hn').style.display='flex';
  $('siDob').style.display='none';$('siM').style.display='';$('siW').style.display='';$('siP').style.display='';
  applyCombatRelics();drawCards(HM);uH();
  if(typeof showTutorial==='function')showTutorial();
  if(typeof updateWavePreview==='function')updateWavePreview();
}

function applyCombatRelics(){
  var C=G.cb;
  if(hasRelWithEffect('spellBoost')){C.spellRangeBonus=1.3;C.spellAreaBonus=1.1}
  if(hasRelWithEffect('revealStealth'))C.revealAll=true;
  if(hasRelWithEffect('doubleHeal'))C.doubleHeal=true;
}

// ═══════════════════ WAVE MANAGEMENT ═══════════════════

function genWave(n,diff){
  var dm=DIFF_MULT[G.difficulty]||DIFF_MULT.normal;
  var count=Math.floor(3+n*1.5)*dm.hp;
  var w=[];
  var pool=Object.keys(ENEMIES).filter(function(k){return!ENEMIES[k].bo&&!ENEMIES[k].elite});
  // Faction enemies more likely
  var facPool=pool.filter(function(k){return ENEMIES[k].faction===G.faction});
  for(var i=0;i<count;i++){
    var useFac=facPool.length>0&&Math.random()<.4;
    var tid=useFac?shf(facPool)[0]:shf(pool)[0];
    var hm=dm.hp*(1+diff*.15);
    w.push({t:tid,d:i*.8,hm:hm});
  }
  // Corrupted relic: +20%
  if(hasRelWithEffect('corrupted_basic')){
    var extra=Math.ceil(w.length*.2);
    for(var i=0;i<extra;i++){var src=w[Math.random()*w.length|0];w.push({t:src.t,d:src.d+.1,hm:src.hm})}
  }
  // Fenda mix
  if(G.fendaMix&&G.fendaMix>0){
    var otherFacs=Object.keys(FACTIONS).filter(function(f){return f!==G.faction});
    if(otherFacs.length){var mixFac=shf(otherFacs)[0];var mixPool=[];for(var id in ENEMIES){if(ENEMIES[id].faction===mixFac&&!ENEMIES[id].bo&&!ENEMIES[id].elite)mixPool.push(id)};if(mixPool.length)w.push({t:shf(mixPool)[0],d:w.length*.8,hm:dm.hp*(1+diff*.15)})}
  }
  return w;
}

function startWave(){
  if(G.state!=='COMBAT')return;G.state='WAVE';
  var C=G.cb;
  C.encW++;C.mana=Math.min(C.maxMana+(C.leftoverMana||0),10);C.leftoverMana=0;
  if(typeof rWM==='function')rWM();
  C.waveQ=genWave(C.encW,C.diff);C.waveTm=0;C.waveIdx=0;drawCards(HM);sfx('w');
  for(var i=0;i<C.towers.length;i++){var tw=C.towers[i];if(tw.trib&&tw.trib.trigger==='wave_start'&&tw.tribReady){tw.trib.execute(tw);tw.tribCD=tw.trib.cd||10;tw.tribReady=false}}
  var lb='ONDA '+C.encW+'/'+C.totalW;
  if(C.encW>=C.totalW){var t=C.encType;lb=t==='boss'?'CHEFE FINAL':t==='skull'?'BOSS':'MINI-BOSS'}
  C.announce={text:lb,timer:1.5};
  if(G.eclipseBuff>0)G.eclipseBuff--;
  if(G.fendaMix>0)G.fendaMix--;
  if(G.chuvaBossHP&&C.encW===C.totalW){for(var i=0;i<C.waveQ.length;i++)C.waveQ[i].hm*=(1+G.chuvaBossHP)}
  onWaveStartRelics();
  if(G.slowEnemiesWaves>0){G.slowEnemiesWaves--;C.slowEnemiesMod=.9}else C.slowEnemiesMod=1;
  uH();
}

function checkWaveComplete(dt){
  var C=G.cb;
  // Spawn from queue
  C.waveTm+=dt;
  while(C.waveIdx<C.waveQ.length&&C.waveQ[C.waveIdx].d<=C.waveTm){
    spawnE(C.waveQ[C.waveIdx].t,C.waveQ[C.waveIdx].hm);C.waveIdx++;
  }
  // Check complete
  if(C.waveIdx>=C.waveQ.length&&C.enemies.length===0){
    // Farm gold
    for(var i=0;i<C.towers.length;i++){if(C.towers[i].sub==='farm'){var fg=C.towers[i].farmGold+C.towers[i].stars;addOuro(fg);fTx(C.towers[i].x,C.towers[i].y,'+'+fg+'$','#ffd93d')}}
    // Wave gold
    var wg=5+relV('wvGold');addOuro(wg);
    // Mana leftover
    C.leftoverMana=Math.floor(C.mana*.5);
    // Strength buff
    C.strBuff+=.02;C.strengthBuff=1+C.strBuff;C.strTimer=15;
    // Auto wave
    if(G.autoWv){G.state='COMBAT';setTimeout(function(){if(G.state==='COMBAT')startWave()},500)}
    else{G.state='COMBAT';if(typeof rWM==='function')rWM()}
    // Victory check
    if(C.encW>=C.totalW){
      var nd=G.map.nodes[G.map.curId];
      if(nd&&(nd.type==='boss'||nd.type==='skull')){
        if(!G.player.firstVictory)G.player.firstVictory=true;
        showVictory();return;
      }
      showReward();
    }
    uH();
  }
}

// ═══════════════════ RELIC ENGINE (GDD Cap.3) ═══════════════════

function applyStartRelics(){
  var relics=getRelicsByTrigger('start');
  for(var i=0;i<relics.length;i++){
    var r=relics[i].data;
    if(r.effect==='startGold')G.player.dobroes+=r.value;
    if(r.effect==='maxHp'){G.player.maxHp+=r.value;G.player.hp=Math.min(G.player.hp+r.value,G.player.maxHp)}
    if(r.effect==='doomClock'){G.player.maxHp=Math.max(30,G.player.maxHp-20);G.player.hp=Math.min(G.player.hp,G.player.maxHp)}
  }
}
function onEnemyKillRelics(e,x,y){
  var relics=getRelicsByTrigger('on_kill');
  for(var i=0;i<relics.length;i++){
    var r=relics[i].data;
    if(r.effect==='killGold'){addOuro(r.value);fTx(x,y,'+'+r.value,'#ffd93d')}
    if(r.effect==='killLightning'&&Math.random()<r.value){var tgt=null,td=1e9;for(var j=0;j<G.cb.enemies.length;j++){var d=dst(x,y,G.cb.enemies[j].x,G.cb.enemies[j].y);if(d<td){tgt=G.cb.enemies[j];td=d}}if(tgt&&td<CL*3){dmgE(tgt,30,{type:'lightning'});spP(tgt.x,tgt.y,'#ffd93d',10)}}
    if(r.effect==='killSpeedBuff'){for(var j=0;j<G.cb.towers.length;j++){var tw=G.cb.towers[j];if(dst(tw.x,tw.y,x,y)<=2.5*CL){tw.tempBuff=Math.max(tw.tempBuff,1+r.value);tw.tempBuffTimer=Math.max(tw.tempBuffTimer,3)}}}
  }
  if(e.bo){var bk=getRelicsByTrigger('on_boss_kill');for(var i=0;i<bk.length;i++){var r=bk[i].data;if(r.effect==='bossKillBoost'){G.bossKillBonus=(G.bossKillBonus||0)+r.value;fTx(W/2,30,'+'+Math.round(G.bossKillBonus*100)+'% DMG!','#ffd93d')}}}
  if(e.elite){var el=getRelicsByTrigger('on_elite_kill');for(var i=0;i<el.length;i++){var r=el[i].data;if(r.effect==='eliteRefresh'){for(var j=0;j<G.cb.towers.length;j++){G.cb.towers[j].cd=0;G.cb.towers[j].activeCD=0}spP(W/2,H/2,'#00cec9',20);fTx(W/2,H/2,'REFRESH!','#00cec9')}}}
}
function onWaveStartRelics(){
  var C=G.cb;var relics=getRelicsByTrigger('on_wave');
  for(var i=0;i<relics.length;i++){
    var r=relics[i].data;
    if(r.effect==='stkDmg')for(var j=0;j<C.towers.length;j++)C.towers[j].stkDmg=(C.towers[j].stkDmg||0)+r.value;
    if(r.effect==='freeCardWave'&&C.encW%r.value===0&&C.encW>0)drawCards(1);
  }
}

// ═══════════════════ RELIC ADD ═══════════════════

function addRelic(id){
  if(G.player.relics.indexOf(id)>=0)return;
  if(G.player.relics.length>=3){for(var i=0;i<G.player.relics.length;i++){if(!RELICS[G.player.relics[i]].unique){G.player.relics.splice(i,1);break}}if(G.player.relics.length>=3)return}
  G.player.relics.push(id);var r=RELICS[id];
  if(r.effect==='maxHp'){G.player.maxHp+=r.value;G.player.hp=Math.min(G.player.hp+r.value,G.player.maxHp)}
  if(r.effect==='pandora'){
    var corrupted=Object.keys(RELICS).filter(function(r2){return RELICS[r2].corrupted&&G.player.relics.indexOf(r2)<0&&r2!==id});
    var others=Object.keys(RELICS).filter(function(r2){return!RELICS[r2].corrupted&&G.player.relics.indexOf(r2)<0&&r2!==id});
    if(corrupted.length)addRelic(shf(corrupted)[0]);
    for(var i=0;i<2;i++){if(others.length){addRelic(shf(others)[0]);others=others.filter(function(x){return G.player.relics.indexOf(x)<0})}}
  }
  sfx('rw');
}

// ═══════════════════ SPELL SYSTEM ═══════════════════

function checkSpellCost(card){
  var cost=card.cost||0;
  if(hasRelWithEffect('spellFree')&&Math.random()<.2)return 0;
  if(hasRelWithEffect('corrupted_mana'))cost=Math.max(1,cost-1);
  return cost;
}
function castSpell(c,r,i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv);
  var cost=checkSpellCost(ls||card);
  C.mana-=cost;C.hand.splice(i,1);
  if(card.exhaust){for(var d=G.player.deck.length-1;d>=0;d--){if(G.player.deck[d].id===en.id&&G.player.deck[d].lv===en.lv){G.player.deck.splice(d,1);break}}}
  else C.discardPile.push(en);
  var sd=ls.splDmg||card.splDmg,sr=(ls.splRad||card.splRad)*(C.spellAreaBonus||1);
  var tx=c*CL+CL/2,ty=r*CL+CL/2,rad=sr>=99?9999:sr*CL;
  // Corrupted mana: -1 HP
  if(hasRelWithEffect('corrupted_mana')){G.player.hp=Math.max(1,G.player.hp-1);fTx(tx,ty-20,'-1HP','#e84855')}
  // Heal spell
  if(card.healAmt){healPlayer(card.healAmt);fTx(tx,ty,'+'+card.healAmt+'HP','#44ff44');spP(tx,ty,'#44ff44',10);sfx('sp');C.selCard=null;if(typeof rHd==='function')rHd();uH();return}
  // Shield spell
  if(card.shieldAmt){G.cb.shield=(G.cb.shield||0)+card.shieldAmt;fTx(tx,ty,'+'+card.shieldAmt+' ESCUDO','#5bc0ff');sfx('sp');C.selCard=null;if(typeof rHd==='function')rHd();uH();return}
  // Multi-hit (storm)
  var hits=card.hits||1;
  for(var h=0;h<hits;h++){
    var ox=hits>1?rng(-rad*.8,rad*.8):0,oy=hits>1?rng(-rad*.8,rad*.8):0;
    for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(sr>=99||dst(tx+ox,ty+oy,e.x,e.y)<=rad)dmgE(e,sd/hits,{type:card.dmgType||'magical'})}
    if(hits>1)spP(tx+ox,ty+oy,card.color,8);
  }
  spP(tx,ty,card.color,sr>=99?30:20);C.shake=6;sfx('sp');
  // Status from spell
  if(card.burnDmg)for(var j=0;j<C.enemies.length;j++){if(sr>=99||dst(tx,ty,C.enemies[j].x,C.enemies[j].y)<=rad)applyStatus(C.enemies[j],'burn',card.burnDur||3,card.burnDmg)}
  if(card.poisonDmg)for(var j=0;j<C.enemies.length;j++){if(sr>=99||dst(tx,ty,C.enemies[j].x,C.enemies[j].y)<=rad)applyStatus(C.enemies[j],'poison',card.poisonDur||4,card.poisonDmg)}
  if(card.freeze)for(var j=0;j<C.enemies.length;j++){if(sr>=99||dst(tx,ty,C.enemies[j].x,C.enemies[j].y)<=rad)applyStatus(C.enemies[j],'freeze',card.freezeDur||2,0)}
  if(card.stun)for(var j=0;j<C.enemies.length;j++){if(sr>=99||dst(tx,ty,C.enemies[j].x,C.enemies[j].y)<=rad)applyStatus(C.enemies[j],'stun',card.stun,0)}
  // Espelho Arcano
  if(hasRelWithEffect('spellMirror')){setTimeout(function(){for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(sr>=99||dst(tx,ty,e.x,e.y)<=rad)dmgE(e,sd*.3,{type:card.dmgType||'magical'})}spP(tx+10,ty+10,card.color,10)},200)}
  C.selCard=null;if(typeof rHd==='function')rHd();uH();
}

// ═══════════════════ EVENT ENGINE (GDD Cap.3) ═══════════════════

function showEv(){
  G.state='EVENT';var pool=[];
  for(var i=0;i<EVENTS_DATA.length;i++){var ev=EVENTS_DATA[i],w=ev.rarity==='common'?5:ev.rarity==='uncommon'?3:ev.rarity==='rare'?2:ev.rarity==='epic'?1:ev.rarity==='secret'?.1:1;for(var j=0;j<Math.ceil(w);j++)pool.push(ev)}
  var ev=shf(pool)[0]||EVENTS_DATA[0],o=$('oEv');o.classList.remove('h');
  var h='<div class="en">'+ev.title+'</div><div class="et" style="color:'+({common:'#888',uncommon:'#2ecc71',rare:'#4a9eff',epic:'#9b59b6',secret:'#fd79a8'}[ev.rarity]||'#888')+';font-size:10px">'+(ev.type||'').toUpperCase()+'</div><div class="et">'+ev.description+'</div>';
  for(var i=0;i<ev.choices.length;i++){var ch=ev.choices[i];h+='<button class="bn ba" onclick="resEv(\''+ch.fn+'\','+(ch.cost||0)+')">'+ch.text+(ch.cost?' ('+ch.cost+'$)':'')+'</button><br>'}
  h+='<button class="bn" onclick="leaveEv()">Ignorar</button>';o.innerHTML=h;
}
function resEv(fn,cost){
  cost=cost||0;
  if(cost>0&&G.player.dobroes<cost){$('oEv').innerHTML='<div class="et">Sem dobroes!</div><button class="bn" onclick="leaveEv()">Sair</button>';return}
  if(cost>0)G.player.dobroes-=cost;
  evReward(fn);
}
function leaveEv(){$('oEv').classList.add('h');compNode()}

function evReward(fn){
  var o=$('oEv');
  switch(fn){
  // Bau
  case 'bau_gratis':
    if(Math.random()<.5){var pool=Object.keys(RELICS).filter(function(r){return!RELICS[r].corrupted&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break}}
    G.eliteNext=true;o.innerHTML='<div class="en" style="color:#e84855">MIMICO!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'bau_pago':
    var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(!pool.length)pool=Object.keys(RELICS).filter(function(r){return!RELICS[r].corrupted&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Altar
  case 'altar_sacrifice':
    G.player.hp=Math.max(1,G.player.hp-10);var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><div class="et">-10HP</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'altar_magic':
    var adds=shf(Object.keys(CARDS).filter(function(c){return CARDS[c].type==='tower'||CARDS[c].type==='spell'})).slice(0,2);
    for(var i=0;i<adds.length;i++)G.player.deck.push({id:adds[i],lv:1});
    o.innerHTML='<div class="et">+2 cartas</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Fonte
  case 'fonte_mana':
    G.player.hp=Math.max(1,G.player.hp-5);G._permMana=(G._permMana||0)+3;
    o.innerHTML='<div class="et">+3 mana permanente, -5HP</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'fonte_relic_common':
    var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='common'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Generic
  case 'heal15':G.player.hp=Math.min(G.player.hp+15,G.player.maxHp);o.innerHTML='<div class="et">+15 HP!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'heal20':G.player.hp=Math.min(G.player.hp+20,G.player.maxHp);o.innerHTML='<div class="et">+20 HP!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'gold30':G.player.dobroes+=30;o.innerHTML='<div class="et">+30$!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'uprandom':
    var cands=[];for(var i=0;i<G.player.deck.length;i++){if(G.player.deck[i].lv<3)cands.push(i)}
    if(cands.length){var ci=shf(cands)[0];G.player.deck[ci].lv++;o.innerHTML='<div class="et">'+CARDS[G.player.deck[ci].id].icon+' Lv'+G.player.deck[ci].lv+'!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'remove_card':evSelectCard('remove');return;
  case 'festival_cards':
    var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity!=='legendary'});var picks=shf(pool).slice(0,3);
    var h='<div class="en">Escolha 1:</div><div class="oi">';for(var i=0;i<picks.length;i++){var c=CARDS[picks[i]];h+='<div class="oC" onclick="festivalPick(\''+picks[i]+'\')"><div class="ic">'+c.icon+'</div><div class="nm">'+c.name+'</div></div>'}h+='</div>';o.innerHTML=h;return;
  // Poco
  case 'poco_20':if(Math.random()<.5){G.player.dobroes+=35;o.innerHTML='<div class="en">GANHOU!</div><div class="et">+35$</div><button class="bn ba" onclick="leaveEv()">OK</button>'}else{o.innerHTML='<div class="en" style="color:#e84855">PERDEU!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'poco_40':if(Math.random()<.5){var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}else{G.eliteNext=true;o.innerHTML='<div class="en" style="color:#e84855">ELITE!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Ruinas
  case 'ruinas_explore':if(Math.random()<.5){var pool=Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0});if(pool.length){addRelic(shf(pool)[0])}o.innerHTML='<div class="et">Reliquia encontrada!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}else{G.eliteNext=true;o.innerHTML='<div class="en" style="color:#e84855">ELITE!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'ruinas_reinforce':G.slowEnemiesWaves=(G.slowEnemiesWaves||0)+2;o.innerHTML='<div class="et">-10% spd inimigos, 2 ondas</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Eclipse
  case 'eclipse_accept':G.eclipseBuff=3;o.innerHTML='<div class="et">+25% range luz, 3 ondas</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'eclipse_resist':G.player.hp=Math.max(1,G.player.hp-10);var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].type==='spell'});var cid=shf(pool)[0];G.player.deck.push({id:cid,lv:1});o.innerHTML='<div class="et">-10HP, +carta</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Lua
  case 'lua_accept':G.luaBuff=true;o.innerHTML='<div class="et">+20% ouro, inimigos +10% spd</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'lua_break':G.eliteNext=true;G.luaReward=true;o.innerHTML='<div class="et">Elite! Vitoria = reliquia.</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Chuva
  case 'chuva_collect':G.player.dobroes+=50;G.chuvaBossHP=(G.chuvaBossHP||0)+.05;o.innerHTML='<div class="et">+50$ (boss +5% HP)</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Aposta
  case 'aposta_25':if(Math.random()<.5){G.player.dobroes+=60;o.innerHTML='<div class="en">GANHOU!</div><div class="et">+60$</div><button class="bn ba" onclick="leaveEv()">OK</button>'}else{o.innerHTML='<div class="en" style="color:#e84855">PERDEU!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'aposta_50':if(Math.random()<.5){var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}else{G.eliteNext=true;o.innerHTML='<div class="en" style="color:#e84855">ELITE!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Mercador
  case 'mercador_buy':var cid=shf(Object.keys(CARDS).filter(function(c){return CARDS[c].rarity!=='legendary'}))[0];G.player.deck.push({id:cid,lv:1});o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'mercador_sell':evSelectCard('sell_double');return;
  case 'mercador_steal':G.eliteNext=true;G.stealReward=true;o.innerHTML='<div class="et">Elite garantida! Vitoria = reliquia rara.</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Portal
  case 'portal_enter':G.player.dobroes+=50;var adds=shf(Object.keys(CARDS)).slice(0,2);for(var i=0;i<adds.length;i++)G.player.deck.push({id:adds[i],lv:1});G.player.hp=Math.max(1,G.player.hp-10);o.innerHTML='<div class="et">+50$, +2 cartas, -10HP</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'portal_seal':var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity==='rare'});var cid=shf(pool)[0];G.player.deck.push({id:cid,lv:1});o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Arena
  case 'arena_enter':G.eliteNext=true;G.arenaReward=true;o.innerHTML='<div class="et">Elite! Vitoria = reliquia.</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'arena_refuse':G.player.dobroes=Math.max(0,G.player.dobroes-10);o.innerHTML='<div class="et">-10$</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Ritual
  case 'ritual_upgrade':evSelectCard('upgrade_rare');return;
  case 'ritual_hp':G.player.hp=Math.max(1,G.player.hp-15);var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='rare'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><div class="et">-15HP</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Santuario
  case 'santuario_purify':var ci=-1;for(var i=0;i<G.player.relics.length;i++){if(RELICS[G.player.relics[i]].corrupted){ci=i;break}}if(ci>=0){var rem=G.player.relics.splice(ci,1)[0];o.innerHTML='<div class="et">'+RELICS[rem].ic+' removida!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}else{o.innerHTML='<div class="et">Nenhuma corrompida.</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'santuario_heal':G.player.hp=Math.min(G.player.hp+20,G.player.maxHp);evSelectCard('remove');return;
  // Corrupcao
  case 'corrupcao_aceitar':G.corruptionBonus=(G.corruptionBonus||0)+.15;var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].corrupted&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en" style="color:#e84855">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'corrupcao_resistir':G.player.hp=Math.max(1,G.player.hp-10);var pool=Object.keys(RELICS).filter(function(r){return!RELICS[r].corrupted&&G.player.relics.indexOf(r)<0&&RELICS[r].rarity==='common'});if(pool.length){addRelic(shf(pool)[0])}o.innerHTML='<div class="et">-10HP, reliquia comum</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Templo
  case 'templo_challenge':if(Math.random()<.6){var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='epic'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}else{G.player.hp=Math.max(1,G.player.hp-15);o.innerHTML='<div class="en" style="color:#e84855">ERROU!</div><div class="et">-15HP</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  case 'templo_pay':var pool=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='epic'&&G.player.relics.indexOf(r)<0});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Viajante
  case 'viajante_relic':evSelectRelic('trade');return;
  case 'viajante_card':evSelectCard('trade_card');return;
  // Ferreiro
  case 'ferreiro_destroy':evSelectCard('sell_50');return;
  case 'ferreiro_double':var cands=[];for(var i=0;i<G.player.deck.length;i++){if(G.player.deck[i].lv<3)cands.push(i)};if(cands.length>=2){var pick=shf(cands).slice(0,2);for(var i=0;i<pick.length;i++)G.player.deck[pick[i]].lv++;G.player.hp=Math.max(1,G.player.hp-10);o.innerHTML='<div class="et">2 cartas evoluidas! -10HP</div><button class="bn ba" onclick="leaveEv()">OK</button>'}break;
  // Maquina
  case 'maquina_20':var cid=shf(Object.keys(CARDS))[0];G.player.deck.push({id:cid,lv:1});o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'maquina_40':var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity==='rare'});if(!pool.length)pool=Object.keys(CARDS);var cid=shf(pool)[0];G.player.deck.push({id:cid,lv:1});o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Fenda
  case 'fenda_open':G.fendaMix=(G.fendaMix||0)+3;var bonus=Math.random()<.5?30:0;G.player.dobroes+=bonus;o.innerHTML='<div class="et">Mix inimigos!'+(bonus?' +30$':'')+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'fenda_seal':G._permMana=(G._permMana||0)+1;o.innerHTML='<div class="et">+1 mana permanente</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  // Secretos
  case 'colecionador_relic':evSelectRelic('upgrade_relic');return;
  case 'colecionador_card':evSelectCard('upgrade_to_epic');return;
  case 'vazio_all':if(G.player.relics.length>0){G.player.relics=[];var uniques=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='unique'});if(!uniques.length)uniques=Object.keys(RELICS).filter(function(r){return RELICS[r].rarity==='divine'});if(uniques.length){var rid=shf(uniques)[0];addRelic(rid);o.innerHTML='<div class="en" style="color:#fd79a8">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}break;
  case 'vazio_gold':var half=Math.floor(G.player.dobroes/2);G.player.dobroes-=half;o.innerHTML='<div class="et">-'+half+'$</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'dev_help':var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity==='legendary'});var picks=shf(pool).slice(0,3);var h='<div class="en">Escolha 1:</div><div class="oi">';for(var i=0;i<picks.length;i++){var c=CARDS[picks[i]];h+='<div class="oC" onclick="devPick(\''+picks[i]+'\')"><div class="ic">'+c.icon+'</div><div class="nm">'+c.name+'</div></div>'}h+='</div>';o.innerHTML=h;return;
  case 'dev_challenge':G.eliteNext=true;G.devBossReward=true;o.innerHTML='<div class="en" style="color:#e84855">BOSS SECRETO!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'divindade_fire':for(var i=0;i<G.player.deck.length;i++){if(CARDS[G.player.deck[i].id]&&CARDS[G.player.deck[i].id].dmgType==='fire'&&G.player.deck[i].lv<3)G.player.deck[i].lv++}o.innerHTML='<div class="et">Cartas Fogo evoluidas!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'divindade_ice':for(var i=0;i<G.player.deck.length;i++){if(CARDS[G.player.deck[i].id]&&CARDS[G.player.deck[i].id].dmgType==='ice'&&G.player.deck[i].lv<3)G.player.deck[i].lv++}o.innerHTML='<div class="et">Cartas Gelo evoluidas!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'divindade_lightning':for(var i=0;i<G.player.deck.length;i++){if(CARDS[G.player.deck[i].id]&&CARDS[G.player.deck[i].id].dmgType==='lightning'&&G.player.deck[i].lv<3)G.player.deck[i].lv++}o.innerHTML='<div class="et">Cartas Raio evoluidas!</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  case 'nothing':o.innerHTML='<div class="et">Nada acontece.</div><button class="bn ba" onclick="leaveEv()">OK</button>';break;
  default:o.innerHTML='<div class="et">?</div><button class="bn ba" onclick="leaveEv()">OK</button>';
  }
  sfx('rw');uH();
}
function festivalPick(id){G.player.deck.push({id:id,lv:1});$('oEv').innerHTML='<div class="et">'+CARDS[id].icon+' '+CARDS[id].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';sfx('rw');uH()}
function devPick(id){G.player.deck.push({id:id,lv:1});$('oEv').innerHTML='<div class="et">'+CARDS[id].icon+' '+CARDS[id].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>';sfx('rw');uH()}

// Card selection for events
function evSelectCard(mode){
  G._evCardMode=mode;var o=$('oEv');
  var h='<div class="bo">ESCOLHA CARTA</div><div class="oi">';
  for(var i=0;i<G.player.deck.length;i++){var en=G.player.deck[i],card=CARDS[en.id];h+='<div class="oC" onclick="evCardPick('+i+')"><div class="ic">'+card.icon+'</div><div class="nm">'+card.name+' Lv'+en.lv+'</div></div>'}
  h+='</div><button class="bn" onclick="leaveEv()">Cancelar</button>';o.innerHTML=h;
}
function evCardPick(i){
  var mode=G._evCardMode,deck=G.player.deck,o=$('oEv');
  if(mode==='remove'){deck.splice(i,1);o.innerHTML='<div class="et">Removida!</div><button class="bn ba" onclick="leaveEv()">OK</button>'}
  else if(mode==='sell_50'){deck.splice(i,1);G.player.dobroes+=50;o.innerHTML='<div class="et">+50$</div><button class="bn ba" onclick="leaveEv()">OK</button>'}
  else if(mode==='sell_double'){var c=deck[i],prices={common:10,rare:20,epic:35,legendary:80};var val=(prices[CARDS[c.id].rarity]||10)*2;deck.splice(i,1);G.player.dobroes+=val;o.innerHTML='<div class="et">+'+val+'$</div><button class="bn ba" onclick="leaveEv()">OK</button>'}
  else if(mode==='upgrade_rare'){var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity==='rare'});var cid=shf(pool)[0];deck[i]={id:cid,lv:1};o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}
  else if(mode==='upgrade_to_epic'){var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity==='epic'});var cid=shf(pool)[0];deck[i]={id:cid,lv:1};o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}
  else if(mode==='trade_card'){var old=deck[i];var pool=Object.keys(CARDS).filter(function(c){return CARDS[c].rarity===CARDS[old.id].rarity&&c!==old.id});if(pool.length){var cid=shf(pool)[0];deck[i]={id:cid,lv:old.lv};o.innerHTML='<div class="et">'+CARDS[cid].icon+' '+CARDS[cid].name+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}
  sfx('rw');uH();
}
function evSelectRelic(mode){
  G._evRelicMode=mode;var o=$('oEv');
  var h='<div class="bo">ESCOLHA RELIQUIA</div><div class="oi">';
  for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];h+='<div class="oR" onclick="evRelicPick('+i+')"><div class="ic">'+r.ic+'</div><div class="nm">'+r.n+'</div></div>'}
  h+='</div><button class="bn" onclick="leaveEv()">Cancelar</button>';o.innerHTML=h;
}
function evRelicPick(i){
  var mode=G._evRelicMode,o=$('oEv');
  if(mode==='trade'){var old=G.player.relics.splice(i,1)[0];var pool=Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0&&r!==old&&!RELICS[r].corrupted});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}
  else if(mode==='upgrade_relic'){var old=G.player.relics.splice(i,1)[0];var pool=Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0&&r!==old&&(RELICS[r].rarity==='epic'||RELICS[r].rarity==='legendary'||RELICS[r].rarity==='divine')});if(pool.length){var rid=shf(pool)[0];addRelic(rid);o.innerHTML='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div><button class="bn ba" onclick="leaveEv()">OK</button>'}}
  sfx('rw');uH();
}

// ═══════════════════ SHOP ═══════════════════

function showShop(){
  G.state='SHOP';var o=$('oSh');o.classList.remove('h');
  var prices={common:10,rare:20,epic:35,legendary:80};
  var discount=hasRelWithEffect('shopDiscount')?relV('shopDiscount'):0;
  var numCards=5+(hasRelWithEffect('shopExtra')?1:0);
  var cards=shf(Object.keys(CARDS)).slice(0,numCards);
  var relics=shf(Object.keys(RELICS).filter(function(r){return G.player.relics.indexOf(r)<0})).slice(0,1);
  var pots=shf(Object.keys(POTS)).slice(0,2);
  var h='<div class="bo">LOJA</div><div class="et">$: '+G.player.dobroes+'</div><div class="oi">';
  for(var i=0;i<cards.length;i++){var d=CARDS[cards[i]],pr=Math.ceil((prices[d.rarity]||10)*(1-discount));
    if(hasRelWithEffect('shopRare')&&d.rarity==='common'&&!G._shopRareUsed){pr=prices['rare'];G._shopRareUsed=true}
    h+='<div class="oC" onclick="buyC(\''+cards[i]+'\','+pr+')"><div class="ic">'+d.icon+'</div><div class="nm">'+d.name+'</div><div class="ds">'+d.desc+'</div><div class="pr">'+pr+'$</div></div>';
  }
  for(var i=0;i<relics.length;i++){var d=RELICS[relics[i]];h+='<div class="oR" onclick="buyR(\''+relics[i]+'\')"><div class="ic">'+d.ic+'</div><div class="nm">'+d.n+'</div><div class="ds">'+d.d+'</div><div class="pr">50$</div></div>'}
  for(var i=0;i<pots.length;i++){var d=POTS[pots[i]];h+='<div class="oC" onclick="buyP(\''+pots[i]+'\')"><div class="ic">'+d.ic+'</div><div class="nm">'+d.n+'</div><div class="pr">12$</div></div>'}
  h+='</div><button class="bn" onclick="leaveSh()">SAIR</button>';o.innerHTML=h;
}
function buyC(id,pr){
  if(G.player.dobroes<pr)return;G.player.dobroes-=pr;
  var lv=1;if(hasRelWithEffect('spellLevel')&&CARDS[id].type==='spell')lv=2;
  G.player.deck.push({id:id,lv:lv});
  if(hasRelWithEffect('shopUpgrade')&&Math.random()<.1){G.player.deck[G.player.deck.length-1].lv=Math.min(3,lv+1);fTx(W/2,H/2,'EVOLUIU!','#ffd93d')}
  G._shopCascade=(G._shopCascade||0)+1;sfx('rw');showShop();
}
function buyR(id){
  if(G.player.dobroes<50)return;G.player.dobroes-=50;addRelic(id);sfx('rw');showShop();
}
function buyP(id){
  if(G.player.dobroes<12||G.player.potions.length>=3)return;G.player.dobroes-=12;G.player.potions.push(id);sfx('rw');showShop();
}
function leaveSh(){$('oSh').classList.add('h');compNode()}

// ═══════════════════ CHEST ═══════════════════

function showChest(){
  var o=$('oEv');G.state='EVENT';o.classList.remove('h');
  var pool=Object.keys(RELICS).filter(function(r){return!RELICS[r].corrupted&&G.player.relics.indexOf(r)<0});
  var h='<div class="en">Ba\u00FA!</div>';
  if(pool.length){var rid=shf(pool)[0];addRelic(rid);h+='<div class="en">'+RELICS[rid].ic+' '+RELICS[rid].n+'</div>'}
  // Colar da fortuna: extra reward
  if(hasRelWithEffect('chestBonus')){addOuro(20);h+='<div class="et">+20$ (Fortuna)</div>'}
  h+='<button class="bn ba" onclick="leaveEv()">OK</button>';o.innerHTML=h;
}

// ═══════════════════ REWARD ═══════════════════

function showReward(){
  G.state='REWARD';var o=$('oR');o.classList.remove('h');
  var pool=Object.keys(CARDS);
  var picks=shf(pool).slice(0,3);
  var h='<div class="bo">RECOMPENSA</div><div class="oi">';
  for(var i=0;i<picks.length;i++){var c=CARDS[picks[i]];h+='<div class="oC" onclick="pickReward(\''+picks[i]+'\')"><div class="ic">'+c.icon+'</div><div class="nm">'+c.name+'</div><div class="ds">'+c.desc+'</div></div>'}
  h+='</div><button class="bn" onclick="skipReward()">+15$</button>';o.innerHTML=h;
}
function pickReward(id){
  var lv=1;if(hasRelWithEffect('spellLevel')&&CARDS[id].type==='spell')lv=2;
  G.player.deck.push({id:id,lv:lv});$('oR').classList.add('h');sfx('rw');compNode();
}
function skipReward(){addOuro(15);$('oR').classList.add('h');compNode()}

// ═══════════════════ PROGRESSION ═══════════════════

function saveProg(){try{localStorage.setItem('rtd_prog',JSON.stringify({fv:G.player.firstVictory,dobroes:G.player.dobroes}))}catch(e){}}
function loadProg(){try{var d=JSON.parse(localStorage.getItem('rtd_prog'));if(d){G.player.firstVictory=d.fv||false;G.player.dobroes=d.dobroes||20}}catch(e){}}

// ═══════════════════ GAME LOOP ═══════════════════

var lastTs=0;
function gameLoop(ts){
  var dt=Math.min((ts-lastTs)/1000,.1)*G.spd;lastTs=ts;
  if(G.state==='WAVE'){
    uTw(dt);uEn(dt);uPj(dt);uPart(dt);checkWaveComplete(dt);
    if(G.cb.strTimer>0){G.cb.strTimer-=dt;if(G.cb.strTimer<=0){G.cb.strengthBuff=1;G.cb.strBuff=0}}
  }else if(G.state==='COMBAT'){uPart(dt)}
  // Render (calls into ui.js)
  if(G.state==='MAP'&&typeof renderMap==='function')renderMap();
  else if((G.state==='COMBAT'||G.state==='WAVE')&&typeof renderCombat==='function')renderCombat();
  if(typeof uH==='function')uH();
  requestAnimationFrame(gameLoop);
}

// ═══════════════════ INITIALIZATION ═══════════════════

function init(){
  cv=$('cv');cx=cv.getContext('2d');
  cv.width=W;cv.height=H;
  resetAll();genPath();loadProg();
  // Canvas events
  cv.addEventListener('click',function(e){
    var r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height,x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sy;
    if(G.state==='MAP'){for(var i=0;i<G.map.nodes.length;i++){var nd=G.map.nodes[i],ndY=nd.y-G.map.scrollY;if(nd.av&&nd.fl<=G.map.revealFloor&&dst(x,y,nd.x,ndY)<18){enterNode(i);return}}}
    else if(G.state==='COMBAT'||G.state==='WAVE'){var c=Math.floor(x/CL),row=Math.floor(y/CL);if(c>=0&&c<CN&&row>=0&&row<RN&&typeof handleGrid==='function')handleGrid(c,row,e.ctrlKey)}
  });
  cv.addEventListener('mousemove',function(e){
    var r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height,x=(e.clientX-r.left)*sx,y=(e.clientY-r.top)*sy;
    if(G.state==='MAP'){cv.style.cursor='default';for(var i=0;i<G.map.nodes.length;i++){var nd=G.map.nodes[i],ndY=nd.y-G.map.scrollY;if(nd.av&&nd.fl<=G.map.revealFloor&&dst(x,y,nd.x,ndY)<18){cv.style.cursor='pointer';return}}return}
    G.cb.hovC=Math.floor(x/CL);G.cb.hovR=Math.floor(y/CL);cv.style.cursor='crosshair';
    if(G.cb.hovC<0||G.cb.hovC>=CN||G.cb.hovR<0||G.cb.hovR>=RN){G.cb.hovC=null;G.cb.hovR=null}
  });
  cv.addEventListener('contextmenu',function(e){e.preventDefault();G.cb.selCard=null;if(typeof rHd==='function')rHd();if(typeof clP==='function')clP()});
  document.addEventListener('keydown',function(e){
    if(G.state==='COMBAT'||G.state==='WAVE'){var n=parseInt(e.key);if(n>=1&&n<=5&&n<=G.cb.hand.length){if(typeof handleCardTap==='function')handleCardTap(n-1);e.preventDefault()}if(e.key==='u'||e.key==='U')doUp();if(e.key==='q'||e.key==='Q')cyclePrio()}
    if(e.key==='Escape'){G.cb.selCard=null;if(typeof clP==='function')clP()}
    if(e.key===' '){e.preventDefault();if(typeof toggleSpeed==='function')toggleSpeed()}
    if(e.key==='a'||e.key==='A')if(typeof toggleAuto==='function')toggleAuto();
  });
  $('oM').classList.remove('h');
  requestAnimationFrame(gameLoop);
  window.addEventListener('resize',function(){if(typeof handleResize==='function')handleResize()});
  if(typeof handleResize==='function')handleResize();
}
window.onload=init;
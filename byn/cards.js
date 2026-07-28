// ═══════════════════════════════════════════════════════════════
// cards.js - Deck, hand, card play
// ═══════════════════════════════════════════════════════════════

var lastClickT=0, lastClickI=-1;

function initDeck(){ G.player.deck=[]; var ids=['arrow','arrow','arrow','arrow','frost','frost','shadow','fireball','fireball','surge','overcharge']; for(var i=0;i<ids.length;i++)G.player.deck.push({id:ids[i],lv:1}) }
function shDraw(){ G.cb.drawPile=shf(G.player.deck.map(function(c){return{id:c.id,lv:c.lv,locked:false}})); G.cb.hand=[]; G.cb.discardPile=[] }
function drawCards(n){ var C=G.cb; for(var i=0;i<n;i++){if(C.hand.length>=HM)break;if(!C.drawPile.length){if(!C.discardPile.length)break;C.drawPile=shf(C.discardPile.slice());for(var j=0;j<C.drawPile.length;j++)C.drawPile[j].locked=false;C.discardPile=[]}C.hand.push(C.drawPile.pop())} rHd();uH() }
function discHand(){ var C=G.cb,kept=[]; for(var i=0;i<C.hand.length;i++){if(C.hand[i].locked)kept.push(C.hand[i]);else C.discardPile.push(C.hand[i])} C.hand=kept;rHd() }
function toggleLock(idx){ var C=G.cb; if(idx<0||idx>=C.hand.length)return; if(C.hand[idx].locked)C.hand[idx].locked=false; else if(countLocked()<maxLocks())C.hand[idx].locked=true; rHd() }

function handleCardTap(idx){
  var now=Date.now();
  if(lastClickI===idx&&now-lastClickT<350){toggleLock(idx);lastClickT=0;lastClickI=-1}
  else{onCardClick(idx);lastClickT=now;lastClickI=idx}
}

function onCardClick(i){
  var C=G.cb;if(G.state!=='COMBAT'&&G.state!=='WAVE')return;
  var en=C.hand[i],card=CARDS[en.id];if(!card)return;
  var ls=lvStats(en.id,en.lv),cost=ls.cost||card.cost;
  if(C.mana<cost){fMn();return}
  C.selTower=null;clP();
  if(isInst(card,ls)){playInst(i);return}
  C.selCard=C.selCard===i?null:i;rHd();
}

function isInst(card,ls){
  if(card.type!=='spell')return false;
  if(card.effect){if(card.effect==='buff_all'||card.effect==='kill_flying'||card.effect==='remove_shields'||card.effect==='teleport_all')return true}
  if(!ls.splDmg&&!ls.splRad&&!card.effect)return true;
  if(ls.splRad&&ls.splRad>=99)return true;
  if(ls.frzDur||card.frzDur)return true;
  return false;
}

function playInst(i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv),cost=ls.cost||card.cost;
  C.mana-=cost;C.hand.splice(i,1);
  if(card.exhaust){for(var d=G.player.deck.length-1;d>=0;d--){if(G.player.deck[d].id===en.id&&G.player.deck[d].lv===en.lv){G.player.deck.splice(d,1);break}}}
  else C.discardPile.push(en);
  if(ls.frzDur||card.frzDur){var dur=ls.frzDur||card.frzDur;for(var j=0;j<C.enemies.length;j++){if(!C.enemies[j].corrupted){C.enemies[j].sva=Math.max(C.enemies[j].sva,1);C.enemies[j].stm=Math.max(C.enemies[j].stm,dur)}}C.shake=8;spP(W/2,H/2,'#74b9ff',25);if(ls.splDmg)for(var j=0;j<C.enemies.length;j++)dmgE(C.enemies[j],ls.splDmg)}
  var eff=card.effect;
  if(eff==='buff_all'){for(var j=0;j<C.towers.length;j++){C.towers[j].tempBuff=1.5;C.towers[j].tempBuffTimer=8}spP(W/2,H/2,'#2ecc71',25)}
  if(eff==='kill_flying'){for(var j=C.enemies.length-1;j>=0;j--){if(C.enemies[j].fly){kE(C.enemies[j]);C.enemies.splice(j,1)}}spP(W/2,H/2,'#74b9ff',25)}
  if(eff==='remove_shields'){for(var j=0;j<C.enemies.length;j++){C.enemies[j].shield=0;C.enemies[j].armor=0}spP(W/2,H/2,'#ffd93d',20)}
  if(eff==='teleport_all'){for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(!e.bo){e.pi=Math.max(0,e.pi-5);var pos=cc(pathCells[e.pi][0],pathCells[e.pi][1]);e.x=pos[0];e.y=pos[1]}}spP(W/2,H/2,'#00cec9',25)}
  var dr=ls.drawN||card.drawN;if(dr)drawCards(dr);
  var lf=ls.life||card.life;if(lf){G.player.hp=Math.min(G.player.hp+lf,G.player.maxHp);fTx(W/2,H/2,'+'+lf+' HP','#e84855')}
  sfx('sp');C.selCard=null;rHd();uH();
}

function handleGrid(c,r,ctrl){
  var C=G.cb;
  if(C.selCard!==null){
    var en=C.hand[C.selCard],card=CARDS[en.id];
    if(card.type==='tower'){if(canBuild(c,r))placeTwr(c,r,C.selCard,ctrl)}
    else if(card.type==='spell'){
      if(card.target_mode==='path'){if(pathSet[c+','+r])placeMine(c,r,C.selCard)}
      else if(card.effect==='convert'){castConvert(c,r,C.selCard)}
      else if(card.splDmg||card.splRad)castSpell(c,r,C.selCard)
    }
    else if(card.type==='mod'){var tw=C.grid[c][r];if(tw)applyMod(tw,C.selCard)}
  }else{var tw=C.grid[c][r];if(tw)showTP(tw);else clP()}
}

function castSpell(c,r,i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv),cost=ls.cost||card.cost;
  C.mana-=cost;C.hand.splice(i,1);
  if(card.exhaust){for(var d=G.player.deck.length-1;d>=0;d--){if(G.player.deck[d].id===en.id&&G.player.deck[d].lv===en.lv){G.player.deck.splice(d,1);break}}}
  else C.discardPile.push(en);
  var sd=ls.splDmg||card.splDmg,sr=ls.splRad||card.splRad,tx=c*CL+CL/2,ty=r*CL+CL/2,rad=sr>=99?9999:sr*CL;
  for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(sr>=99||dst(tx,ty,e.x,e.y)<=rad)dmgE(e,sd)}
  spP(tx,ty,card.color,sr>=99?30:20);C.shake=6;sfx('sp');C.selCard=null;rHd();uH();
}

function placeMine(c,r,i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv),cost=ls.cost||card.cost;
  C.mana-=cost;C.hand.splice(i,1);C.discardPile.push(en);
  var pos=cc(c,r);
  C.mines.push({x:pos[0],y:pos[1],damage:ls.splDmg||card.splDmg||200,radius:CL*(ls.splRad||card.splRad||.8),lifetime:30});
  spP(pos[0],pos[1],card.color,10);sfx('sp');C.selCard=null;rHd();uH();
}

function castConvert(c,r,i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv),cost=ls.cost||card.cost;
  C.mana-=cost;C.hand.splice(i,1);C.discardPile.push(en);
  var tx=c*CL+CL/2,ty=r*CL+CL/2,rad=(ls.splRad||card.splRad||1.5)*CL,strongest=null,maxHP=0;
  for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(!e.bo&&dst(tx,ty,e.x,e.y)<=rad&&e.hp>maxHP){strongest=e;maxHP=e.hp}}
  if(strongest){var ei=C.enemies.indexOf(strongest);if(ei>=0)C.enemies.splice(ei,1);C.allies.push({x:strongest.x,y:strongest.y,hp:strongest.hp,maxHp:strongest.mh,dmg:20,range:CL*1.5,dmgTm:0,pi:strongest.pi,sz:strongest.z*.6});spP(strongest.x,strongest.y,'#a29bfe',15);fTx(strongest.x,strongest.y-15,'CONVERTIDO!','#a29bfe')}
  sfx('sp');C.selCard=null;rHd();uH();
}

function applyMod(tw,i){
  var C=G.cb,en=C.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv);
  C.mana-=(ls.cost||card.cost);C.hand.splice(i,1);C.discardPile.push(en);
  var dm=ls.dmgMul||card.dmgMul,sm=ls.spdMul||card.spdMul,rb=ls.rngBon||card.rngBon;
  if(dm)tw.dMul*=dm;if(sm)tw.sMul*=sm;if(rb)tw.rMul+=rb;
  spP(tw.x,tw.y,card.color,12);sfx('p');C.selCard=null;rHd();uH();
}
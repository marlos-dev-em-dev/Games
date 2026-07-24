// ═══════════════════════════════════════════════════════════════
// ui.js — ALL UI, RENDERING, AND OVERLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// ── STUBS (run.js calls these but they live here) ──
function initGameData(){}
function sC(){}
function updMenuAb(){if(G.player&&G.player.firstVictory)$('bAb').style.display=''}

// ═══════════════════════════════════════════════════════════════
// HUD
// ═══════════════════════════════════════════════════════════════

function uH(){
  var hpPct=Math.max(0,G.player.hp/G.player.maxHp*100);
  $('vHP').textContent=Math.floor(G.player.hp)+'/'+G.player.maxHp;
  $('hpFill').style.width=hpPct+'%';
  $('hpFill').style.background=hpPct>50?'#4ecdc4':hpPct>25?'#ffd93d':'#e84855';
  $('vDob').textContent=G.player.dobroes;

  // Death check
  if(G.player.hp<=0&&G.state!=='DEAD'&&G.state!=='MENU'&&G.state!=='MAP'){showDeathCarry();return}

  if(G.state==='COMBAT'||G.state==='WAVE'){
    var C=G.cb;
    $('vM').textContent=C.mana+'/'+C.maxMana;
    $('vW').textContent=C.encW+'/'+C.totalW;
    $('vP').textContent=C.drawPile.length+C.discardPile.length;
    var btn=$('sw');
    if(G.state==='COMBAT'){btn.textContent='INICIAR ONDA '+(C.encW+1);btn.disabled=false}
    else{btn.textContent='EM ANDAMENTO';btn.disabled=true}
    $('hi').textContent=C.selCard!==null?'Ctrl+clique=autoUp':'1-5:carta | Q:alvo | Espaco:vel';
    refreshPopup();
  }

  // Relics
  var rh='';
  for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r)rh+='<span class="ri" title="'+r.n+': '+r.d+'">'+r.ic+'</span>'}
  // Potions
  var ph='';
  for(var i=0;i<G.player.potions.length;i++){var p=POTS[G.player.potions[i]];if(p)ph+='<span class="pi" title="'+p.n+': '+p.d+'" onclick="usePot('+i+')">'+p.ic+'</span>'}
  $('rb').innerHTML=rh+(ph?' <span style="color:#333">|</span> '+ph:'');
}

function rWM(){if(G.cb&&$('vM'))$('vM').textContent=G.cb.mana+'/'+G.cb.maxMana}

function usePot(i){
  var pid=G.player.potions[i];var p=POTS[pid];if(!p)return;
  switch(p.type){
    case'heal':healPlayer(p.value);fTx(W/2,H/2,'+'+p.value+'HP','#44ff44');break;
    case'gold':addOuro(p.value);fTx(W/2,H/2,'+'+p.value+'$','#ffd93d');break;
    case'mana':if(G.cb)G.cb.mana=Math.min(G.cb.mana+p.value,10);break;
    case'shield':G.player.hp=Math.min(G.player.hp+p.value,G.player.maxHp);break;
    case'buff':if(G.cb)for(var j=0;j<G.cb.towers.length;j++){G.cb.towers[j].tempBuff=Math.max(G.cb.towers[j].tempBuff,1+p.value);G.cb.towers[j].tempBuffTimer=Math.max(G.cb.towers[j].tempBuffTimer,p.dur||10)}break;
  }
  G.player.potions.splice(i,1);sfx('rw');uH();
}

// ═══════════════════════════════════════════════════════════════
// HAND
// ═══════════════════════════════════════════════════════════════

function rHd(){
  var hn=$('hn'),h='';
  for(var i=0;i<G.cb.hand.length;i++){
    var en=G.cb.hand[i],card=CARDS[en.id],ls=lvStats(en.id,en.lv);
    var cost=ls.cost!==undefined?ls.cost:card.cost;
    var sel=G.cb.selCard===i,lk=G.cb.lockedCards&&G.cb.lockedCards[i];
    var rc=card.rarity==='rare'?'rr':card.rarity==='epic'?'re':card.rarity==='legendary'?'rl':'rc';
    h+='<div class="hc '+rc+(sel?' sel':'')+(lk?' lock':'')+'" onclick="handleCardTap('+i+')">';
    h+='<div class="ic">'+card.icon+'</div>';
    h+='<div class="nm">'+card.name+'</div>';
    h+='<div class="cs">'+cost+' M</div>';
    if(en.lv>1)h+='<div class="lv">Lv'+en.lv+'</div>';
    if(lk)h+='<div class="lk">LOCK</div>';
    h+='</div>';
  }
  hn.innerHTML=h;
}

function handleCardTap(i){
  if(!G.cb||i>=G.cb.hand.length)return;
  if(G.cb.selCard===i)toggleLock(i);
  else G.cb.selCard=i;
  rHd();uH();
}

function toggleLock(i){
  if(!G.cb.lockedCards)G.cb.lockedCards={};
  if(G.cb.lockedCards[i])delete G.cb.lockedCards[i];
  else G.cb.lockedCards[i]=true;
  rHd();
}

// ═══════════════════════════════════════════════════════════════
// GRID CLICK
// ═══════════════════════════════════════════════════════════════

function handleGrid(c,r,ctrl){
  var C=G.cb,tw=C.grid[c+','+r];
  if(C.selCard!==null){
    var en=C.hand[C.selCard],card=CARDS[en.id];
    if(card.type==='tower'||card.type==='mod'){
      if(canBuild(c,r)){placeTwr(c,r,C.selCard,ctrl);C.selCard=null;rHd();uH()}
      else fTx(c*CL+CL/2,r*CL+CL/2,'OCUPADO','#e84855');
    }else if(card.type==='spell'){
      var cost=checkSpellCost(lvStats(en.id,en.lv)||card);
      if(C.mana>=cost){castSpell(c,r,C.selCard);C.selCard=null;rHd();uH()}
      else fTx(c*CL+CL/2,r*CL+CL/2,'SEM MANA','#e84855');
    }
  }else if(tw){showTP(tw)}
  else{clP()}
}

// ═══════════════════════════════════════════════════════════════
// TOWER POPUP
// ═══════════════════════════════════════════════════════════════

var _ppRT=0;

function showTP(tw){
  if(!tw)return;
  G.cb.selTower=tw;_ppRT=0;
  var card=CARDS[tw.id],ms=maxSt(tw.cLv),ult=card.ultimate;

  $('pN').textContent=card.icon+' '+card.name+' '+'*'.repeat(tw.stars)+'.'.repeat(Math.max(0,ms-tw.stars));

  var info='';
  if(tw.sub==='farm'){info='<span style="color:#ffd93d">+'+tw.farmGold+' au/onda (+1/star)</span>'}
  else{
    info='DMG:'+Math.floor(twDmg(tw))+' RNG:'+(twRange(tw)/CL).toFixed(1)+' SPD:'+twSpd(tw).toFixed(2)+' ['+tw.tgtType+']';
    info+='<br>Tipo: '+(tw.dmgType||'physical');
  }
  if(tw.frenzy)info+='<br><span style="color:#ff9f43;font-size:9px">Frenzy</span>';
  if(tw.execThresh>0)info+='<br><span style="color:#e84855;font-size:9px">Executa &lt;'+Math.round(tw.execThresh*100)+'% HP</span>';
  if(tw.lifeSteal>0)info+='<br><span style="color:#9b59b6;font-size:9px">Lifesteal: +'+tw.lifeSteal+'HP/kill</span>';
  if(tw.laser)info+='<br><span style="color:#ff3838;font-size:9px">Laser (continuo)</span>';
  if(tw.armPrc)info+='<br><span style="color:#d4a843;font-size:9px">Perfura armadura</span>';
  if(tw.slwA>0)info+='<br><span style="color:#00cec9;font-size:9px">Aura lentidao '+Math.round(tw.slwA*100)+'%</span>';
  if(tw.nova)info+='<br><span style="color:#a29bfe;font-size:9px">Pulso AoE</span>';
  if(tw.burnDmg>0)info+='<br><span style="color:#ff6600;font-size:9px">Burn: '+tw.burnDmg+'/s '+tw.burnDur+'s</span>';
  if(tw.poisonDmg>0)info+='<br><span style="color:#6bcb77;font-size:9px">Poison: '+tw.poisonDmg+'/s '+tw.poisonDur+'s</span>';
  if(tw.bleedDmg>0)info+='<br><span style="color:#e84855;font-size:9px">Bleed: '+tw.bleedDmg+'/s '+tw.bleedDur+'s</span>';
  if(tw.freeze)info+='<br><span style="color:#74b9ff;font-size:9px">Freeze: '+(tw.freezeDur||0)+'s</span>';
  if(tw.stun>0)info+='<br><span style="color:#ffd93d;font-size:9px">Stun: '+tw.stun+'s</span>';
  if(tw.pierce>0)info+='<br><span style="color:#d4a843;font-size:9px">Perfura: '+tw.pierce+' alvos</span>';
  if(tw.chain>0)info+='<br><span style="color:#ffd93d;font-size:9px">Corrente: '+tw.chain+' alvos</span>';
  if(tw.slow>0)info+='<br><span style="color:#74b9ff;font-size:9px">Slow: '+Math.round(tw.slow*100)+'% '+tw.slowDur+'s</span>';
  if(tw.weakTimer>0)info+='<br><span style="color:#ff44aa;font-size:9px">Fraco: -20% ('+Math.ceil(tw.weakTimer)+'s)</span>';
  if(tw.tempBuff>1&&tw.tempBuffTimer>0)info+='<br><span style="color:#ff6b6b;font-size:9px">Buff: +'+Math.round((tw.tempBuff-1)*100)+'% ('+Math.ceil(tw.tempBuffTimer)+'s)</span>';
  if(tw.frozen)info+='<br><span style="color:#74b9ff;font-size:9px">CONGELADO ('+Math.ceil(tw.frozenTimer)+'s)</span>';
  if(tw.ultEff&&ult)info+='<br><span style="color:#ffd93d">'+ult.icon+' '+ult.name+'</span>';
  if(card.tribute)info+='<br><span style="color:#ff9f43">Trib: '+card.tribute.desc+'</span>';
  if(tw.trib&&!tw.tribReady)info+='<br><span style="color:#666">CD:'+Math.ceil(tw.tribCD)+'s</span>';
  if(tw.sub!=='farm'){
    info+='<br><span style="color:#74b9ff;font-size:9px">Alvo:</span> <span class="pprio">';
    for(var j=0;j<PRIO_ORDER.length;j++){info+='<span class="'+(tw.priority===PRIO_ORDER[j]?'act':'')+'" onclick="setPrio(\''+PRIO_ORDER[j]+'\')">'+PRIO_ORDER[j]+'</span>'}
    info+='</span>';
  }
  $('pD').innerHTML=info;

  // Buttons
  var btns='';
  var ms2=maxSt(tw.cLv),upText='MAX',upDis=true;
  if(tw.stars<ms2){var co=STAR_COST[tw.stars]||99;upText='Star '+(tw.stars+1)+' ('+co+'$)';upDis=G.player.ouro<co}
  btns+='<button class="bs ba" onclick="doUp()"'+(upDis?' disabled':'')+'>'+upText+'</button>';
  btns+='<button class="bs '+(tw.autoUp?'on':'')+'" onclick="toggleTwAU()">AU</button>';
  if(tw.activeSkill){
    btns+='<button class="bs '+(tw.autoActive?'on':'')+'" onclick="toggleAutoActive()">AS</button>';
    if(tw.activeCD>0)btns+='<button class="bs" disabled>'+tw.activeSkill.icon+' '+Math.ceil(tw.activeCD)+'s</button>';
    else btns+='<button class="bs ba" onclick="useActiveSkill(G.cb.selTower)">'+tw.activeSkill.icon+' '+tw.activeSkill.name+'</button>';
  }
  btns+='<button class="bs" style="border-color:#e84855;color:#e84855" onclick="sellTower()">Vender</button>';
  btns+='<button class="bs" onclick="clP()">X</button>';
  $('pB').innerHTML=btns;
  $('pp').classList.remove('h');
}

function clP(){$('pp').classList.add('h');if(G.cb)G.cb.selTower=null}

function refreshPopup(){
  if(!G.cb||!G.cb.selTower)return;
  if($('pp').classList.contains('h'))return;
  _ppRT++;
  if(_ppRT%6===0)showTP(G.cb.selTower);
}

// ═══════════════════════════════════════════════════════════════
// SPEED & AUTO
// ═══════════════════════════════════════════════════════════════

var speedIdx=0;
function toggleSpeed(){
  speedIdx=(speedIdx+1)%3;
  var speeds=[1,2,4];G.spd=speeds[speedIdx];
  $('bS').textContent=G.spd+'x';$('bS').classList.toggle('on',G.spd>1);
}
function toggleAuto(){
  G.autoWv=!G.autoWv;$('bA').classList.toggle('on',G.autoWv);
}

// ═══════════════════════════════════════════════════════════════
// RESIZE
// ═══════════════════════════════════════════════════════════════

function handleResize(){
  var s=Math.min(innerWidth/760,(innerHeight-20)/820,1);
  $('W').style.transform='scale('+s+')';
  $('W').style.transformOrigin='center center';
}

// ═══════════════════════════════════════════════════════════════
// OVERLAYS
// ═══════════════════════════════════════════════════════════════

function showTutorial(){$('oTut').classList.remove('h')}
function closeTutorial(){$('oTut').classList.add('h')}

function showVictory(){
  var o=$('oV');o.classList.remove('h');
  var h='<div class="bo" style="color:#d4a843;font-size:28px">VITORIA!</div>';
  h+='<div class="et">Nos: '+G.nodeCount+' | $: '+G.player.dobroes+'<br>Deck: '+G.player.deck.length+' cartas | Reliquias: '+G.player.relics.length+'/3</div>';
  if(!G.player.firstVictory)h+='<div class="et" style="color:#ffd93d;font-size:18px;font-weight:700;margin:16px 0">O ABISMO DESBLOQUEADO!</div>';
  h+='<button class="bn ba" onclick="startGame()">NOVA RUN</button>';
  h+='<button class="bn" onclick="startAbismo()" style="margin-top:10px">O ABISMO</button>';
  o.innerHTML=h;
  updMenuAb();saveProg();
}

function startAbismo(){alert('Campanha em breve!')}

function showFactionSelect(){
  $('oFac').classList.remove('h');
  var h='<div class="fc" onclick="pickFaction(\'neutral\')" style="border-color:#888"><div class="fi">\u2694\uFE0F</div><div class="fn">Neutro</div><div class="fb">Sem bonus</div></div>';
  for(var id in FACTIONS){if(id==='neutral')continue;var f=FACTIONS[id];
    h+='<div class="fc" onclick="pickFaction(\''+id+'\')" style="border-color:'+f.color+'"><div class="fi">'+f.icon+'</div><div class="fn" style="color:'+f.color+'">'+f.name+'</div><div class="fb">'+(f.bonus||'')+'</div></div>';
  }
  $('facList').innerHTML=h;
}

function pickFaction(id){G.faction=id;$('oFac').classList.add('h');doStartGame()}

function showDeck(){
  if(G.state!=='MAP')return;
  var o=$('oDk');o.classList.remove('h');
  var h='<div class="bo">SEU DECK ('+G.player.deck.length+')</div><div class="oi">';
  for(var i=0;i<G.player.deck.length;i++){var en=G.player.deck[i],card=CARDS[en.id];
    h+='<div class="oC" style="cursor:default"><div class="ic">'+card.icon+'</div><div class="nm">'+card.name+' Lv'+en.lv+'</div><div class="ds">'+card.desc+'</div></div>';}
  h+='</div><div class="en" style="margin-top:8px">Reliquias ('+G.player.relics.length+'/3)</div>';
  if(G.player.relics.length){for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r)h+='<span class="ri" style="font-size:24px" title="'+r.n+': '+r.d+'">'+r.ic+'</span> '}}
  else h+='<div class="et">Nenhuma</div>';
  h+='<br><button class="bn" style="margin-top:12px" onclick="closeDeck()">FECHAR</button>';
  o.innerHTML=h;
}
function closeDeck(){$('oDk').classList.add('h')}

function updateWavePreview(){}

// ═══════════════════════════════════════════════════════════════
// DEATH CARRY
// ═══════════════════════════════════════════════════════════════

var dcSC=null,dcSR=null;

function showDeathCarry(){
  G.state='DEAD';var o=$('oDC');o.classList.remove('h');dcSC=null;dcSR=null;
  var h='<div class="bo" style="color:#e84855">DERROTADO</div>';
  h+='<div class="et">Escolha 1 carta para a proxima run:</div><div class="oi">';
  for(var i=0;i<G.player.deck.length;i++){var en=G.player.deck[i],card=CARDS[en.id];
    h+='<div class="oC" id="dcc'+i+'" onclick="dcPickCard('+i+')"><div class="ic">'+card.icon+'</div><div class="nm">'+card.name+' Lv'+en.lv+'</div></div>';}
  h+='</div><div class="et">Escolha 1 reliquia:</div><div class="oi">';
  for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r)
    h+='<div class="oR" id="dcr'+i+'" onclick="dcPickRelic('+i+')"><div class="ic">'+r.ic+'</div><div class="nm">'+r.n+'</div></div>';}
  h+='</div><button class="bn ba" onclick="confirmCarry()">CONFIRMAR</button>';
  o.innerHTML=h;
}

function dcPickCard(i){dcSC=i;
  var cards=document.querySelectorAll('#oDC .oC');for(var j=0;j<cards.length;j++)cards[j].style.borderColor=j===i?'#d4a843':'#333';
}
function dcPickRelic(i){dcSR=i;
  var rels=document.querySelectorAll('#oDC .oR');for(var j=0;j<rels.length;j++)rels[j].style.borderColor=j===i?'#d4a843':'#333';
}
function confirmCarry(){
  if(dcSC!==null)G.player.carriedCard={id:G.player.deck[dcSC].id,lv:G.player.deck[dcSC].lv};
  if(dcSR!==null)G.player.carriedRelic=G.player.relics[dcSR];
  $('oDC').classList.add('h');doStartGame();
}

// ═══════════════════════════════════════════════════════════════
// MAP RENDERING
// ═══════════════════════════════════════════════════════════════

function renderMap(){
  cx.fillStyle='#0a0a12';cx.fillRect(0,0,W,H);
  var curNd=G.map.nodes[G.map.curId];
  var ideal=curNd?curNd.y-H*.35:0;
  ideal=Math.max(0,Math.min(ideal,G.map.totalH-H));
  G.map.scrollY+=(ideal-G.map.scrollY)*.06;
  var sy=G.map.scrollY;
  var NR=14;

  // Title
  cx.font='bold 12px Cinzel';cx.textAlign='center';cx.fillStyle='#d4a843';cx.fillText('MAPA',W/2,14);
  if(G.faction&&FACTIONS[G.faction]){cx.fillStyle=FACTIONS[G.faction].color;cx.font='bold 10px Cinzel';cx.fillText(FACTIONS[G.faction].icon+' '+FACTIONS[G.faction].name,W/2,30)}

  // Connections
  for(var i=0;i<G.map.nodes.length;i++){
    var nd=G.map.nodes[i],ndY=nd.y-sy;
    if(ndY<-40||ndY>H+40)continue;
    for(var j=0;j<nd.conn.length;j++){
      var ci=nd.conn[j];if(ci<0||ci>=G.map.nodes.length)continue;
      var cn=G.map.nodes[ci],cnY=cn.y-sy;
      if(cnY<-40||cnY>H+40)continue;
      var al=.2;if(nd.done&&cn.av)al=.5;
      cx.strokeStyle='rgba(212,168,67,'+al+')';
      cx.lineWidth=nd.done&&cn.av?2:1;
      cx.beginPath();cx.moveTo(nd.x,ndY);cx.lineTo(cn.x,cnY);cx.stroke();
    }
  }

  // Nodes
  for(var i=0;i<G.map.nodes.length;i++){
    var nd=G.map.nodes[i],ndY=nd.y-sy;
    if(ndY<-25||ndY>H+25)continue;
    if(nd.fl>G.map.revealFloor+1)continue;

    var nodeColor=ECL[nd.type]||'#888888';
    var nodeIcon=EI[nd.type]||'?';

    cx.save();
    if(nd.done)cx.globalAlpha=.3;
    else if(nd.av)cx.globalAlpha=1;
    else cx.globalAlpha=.15;

    // Glow for available nodes
    if(nd.av&&!nd.done){
      cx.globalAlpha=.2;
      cx.fillStyle=nodeColor;
      cx.beginPath();cx.arc(nd.x,ndY,NR+5,0,Math.PI*2);cx.fill();
      cx.globalAlpha=1;
    }

    // Circle
    cx.fillStyle=nd.done?'#222222':nodeColor+'30';
    cx.strokeStyle=nd.done?'#333333':nodeColor;
    cx.lineWidth=nd.av?2.5:1;
    cx.beginPath();cx.arc(nd.x,ndY,NR,0,Math.PI*2);cx.fill();cx.stroke();

    // Icon
    cx.fillStyle=nd.done?'#555555':'#ffffff';
    cx.font=(NR-2)+'px serif';
    cx.textAlign='center';cx.textBaseline='middle';
    cx.fillText(nodeIcon,nd.x,ndY);

    cx.restore();

    // Current node marker
    if(G.map.curId===nd.id){
      cx.strokeStyle='#d4a843';cx.lineWidth=2;cx.setLineDash([3,3]);
      cx.beginPath();cx.arc(nd.x,ndY,NR+3,0,Math.PI*2);cx.stroke();
      cx.setLineDash([]);
    }
  }

  // Bottom info
  cx.fillStyle='#d4a843';cx.font='10px Cinzel';
  cx.textAlign='left';cx.fillText('$:'+G.player.dobroes+' Deck:'+G.player.deck.length,8,H-8);
  cx.textAlign='right';cx.fillText('HP:'+Math.floor(G.player.hp)+'/'+G.player.maxHp,W-8,H-8);
}

// ═══════════════════════════════════════════════════════════════
// COMBAT RENDERING
// ═══════════════════════════════════════════════════════════════

function renderCombat(){
  var C=G.cb,now=performance.now()/1000;cx.save();
  if(C.shake>.5){cx.translate((Math.random()-.5)*C.shake,(Math.random()-.5)*C.shake);C.shake*=.88;if(C.shake<.5)C.shake=0}

  // BG
  cx.fillStyle='#0a0a12';cx.fillRect(0,0,W,H);
  for(var c=0;c<CN;c++)for(var r=0;r<RN;r++){cx.fillStyle=pathSet[c+','+r]?'#141025':((c+r)%2?'#0d0c13':'#0e0d14');cx.fillRect(c*CL,r*CL,CL,CL)}
  cx.strokeStyle='rgba(255,255,255,.02)';cx.lineWidth=1;
  for(var c=0;c<=CN;c++){cx.beginPath();cx.moveTo(c*CL,0);cx.lineTo(c*CL,H);cx.stroke()}
  for(var r=0;r<=RN;r++){cx.beginPath();cx.moveTo(0,r*CL);cx.lineTo(W,r*CL);cx.stroke()}
  cx.fillStyle='rgba(90,60,140,.1)';for(var i=0;i<pathCells.length;i++){var c=pathCells[i][0],r=pathCells[i][1];if(c>=0&&c<CN)cx.fillRect(c*CL+2,r*CL+2,CL-4,CL-4)}

  // Range preview
  if(C.selCard!==null&&C.hovC!==null&&C.hovR!==null){var en=C.hand[C.selCard],card=CARDS[en.id];if(card&&card.type==='tower'){var rx=C.hovC*CL+CL/2,ry=C.hovR*CL+CL/2,rng2=(card.range||2.5)*CL*(1+relV('twRng')),ok=canBuild(C.hovC,C.hovR);cx.save();cx.globalAlpha=ok?.15:.05;cx.fillStyle=card.color;cx.beginPath();cx.arc(rx,ry,rng2,0,Math.PI*2);cx.fill();cx.globalAlpha=ok?.3:.1;cx.strokeStyle=card.color;cx.lineWidth=1;cx.stroke();cx.restore()}}

  // Mines
  for(var i=0;i<C.mines.length;i++){var m=C.mines[i];cx.save();cx.globalAlpha=.5+.3*Math.sin(now*4);cx.fillStyle='#e17055';cx.beginPath();cx.arc(m.x,m.y,8,0,Math.PI*2);cx.fill();cx.strokeStyle='#e17055';cx.lineWidth=1;cx.globalAlpha=.2;cx.beginPath();cx.arc(m.x,m.y,m.radius,0,Math.PI*2);cx.stroke();cx.restore()}

  // Beams
  for(var i=0;i<C.beams.length;i++){var b=C.beams[i];cx.save();cx.globalAlpha=b.timer/.3;cx.strokeStyle=b.cl;cx.lineWidth=3;cx.shadowColor=b.cl;cx.shadowBlur=10;cx.beginPath();cx.moveTo(b.x1,b.y1);cx.lineTo(b.x2,b.y2);cx.stroke();cx.restore()}

  // ═══ TOWERS ═══
  var tsz=CL*.33;
  for(var i=0;i<C.towers.length;i++){
    var tw=C.towers[i];cx.save();
    if(tw.frozen)cx.globalAlpha=.4+.2*Math.sin(now*3);
    if(tw.ultEff){cx.strokeStyle='#ffd93d40';cx.lineWidth=1.5;cx.beginPath();cx.arc(tw.x,tw.y,tsz*1.8,now*2,now*2+4);cx.stroke()}
    if(tw.tempBuff>1&&tw.tempBuffTimer>0){cx.strokeStyle='#ff6b6b30';cx.lineWidth=2;cx.beginPath();cx.arc(tw.x,tw.y,tsz*2,now*3,now*3+5);cx.stroke()}
    if(tw.tempRangeBuff>1&&tw.tempRangeBuffTimer>0){cx.strokeStyle='#74b9ff20';cx.lineWidth=1;cx.setLineDash([4,4]);cx.beginPath();cx.arc(tw.x,tw.y,twRange(tw),0,Math.PI*2);cx.stroke();cx.setLineDash([])}
    var gl=cx.createRadialGradient(tw.x,tw.y,0,tw.x,tw.y,tsz*1.6);gl.addColorStop(0,(tw.ultEff?'#ffd93d':tw.cl)+'30');gl.addColorStop(1,'transparent');cx.fillStyle=gl;cx.beginPath();cx.arc(tw.x,tw.y,tsz*1.6,0,Math.PI*2);cx.fill();
    if(tw.weakTimer>0){cx.strokeStyle='#ff44aa40';cx.lineWidth=2;cx.beginPath();cx.arc(tw.x,tw.y,tsz+5,0,Math.PI*2);cx.stroke()}
    cx.fillStyle=tw.ultEff?'#ffd93d':tw.cl;
    switch(tw.sh){
      case'diamond':cx.beginPath();cx.moveTo(tw.x,tw.y-tsz);cx.lineTo(tw.x+tsz,tw.y);cx.lineTo(tw.x,tw.y+tsz);cx.lineTo(tw.x-tsz,tw.y);cx.closePath();cx.fill();break;
      case'hexagon':cx.beginPath();for(var k=0;k<6;k++){var a=Math.PI/3*k-Math.PI/6;k?cx.lineTo(tw.x+Math.cos(a)*tsz,tw.y+Math.sin(a)*tsz):cx.moveTo(tw.x+Math.cos(a)*tsz,tw.y+Math.sin(a)*tsz)}cx.closePath();cx.fill();break;
      case'circle':cx.beginPath();cx.arc(tw.x,tw.y,tsz,0,Math.PI*2);cx.fill();break;
      case'star':cx.beginPath();for(var k=0;k<8;k++){var a=Math.PI/4*k,r2=k%2?tsz*.5:tsz;k?cx.lineTo(tw.x+Math.cos(a)*r2,tw.y+Math.sin(a)*r2):cx.moveTo(tw.x+Math.cos(a)*r2,tw.y+Math.sin(a)*r2)}cx.closePath();cx.fill();break;
      case'triangle':cx.beginPath();cx.moveTo(tw.x,tw.y-tsz);cx.lineTo(tw.x+tsz*.85,tw.y+tsz*.7);cx.lineTo(tw.x-tsz*.85,tw.y+tsz*.7);cx.closePath();cx.fill();break;
    }
    cx.fillStyle='#fff';cx.font='bold 8px Cinzel';cx.textAlign='center';cx.textBaseline='middle';var sts='';for(var s=0;s<tw.stars;s++)sts+='*';cx.fillText(sts,tw.x,tw.y-tsz-5);
    if(tw.ultEff&&CARDS[tw.id].ultimate){cx.fillStyle='#ffd93d';cx.font='bold 7px Cinzel';cx.fillText(CARDS[tw.id].ultimate.name,tw.x,tw.y+tsz+10)}
    if(tw.autoUp){cx.fillStyle='#2ecc71';cx.font='bold 7px Cinzel';cx.fillText('AU',tw.x,tw.y+tsz+20)}
    if(tw.activeSkill){cx.fillStyle=tw.activeCD>0?'#666':'#ffd93d';cx.font='bold 7px Cinzel';cx.fillText(tw.activeCD>0?Math.ceil(tw.activeCD)+'s':'!',tw.x,tw.y+tsz+30)}
    if(tw.trib){cx.fillStyle=tw.tribReady?'#ff9f43':'#444';cx.font='bold 8px Cinzel';cx.fillText(tw.tribReady?'!':'~',tw.x+tsz+4,tw.y-tsz+4)}
    cx.restore();
  }

  // ═══ ENEMIES ═══
  for(var i=0;i<C.enemies.length;i++){
    var e=C.enemies[i],sz=CL*e.z*.38;
    if(e.stealth&&!e.revealed)cx.globalAlpha=.15;
    cx.save();
    cx.fillStyle='rgba(0,0,0,.3)';cx.beginPath();cx.ellipse(e.x,e.y+sz*.7,sz*.7,sz*.25,0,0,Math.PI*2);cx.fill();
    cx.fillStyle=e.cl;
    if(e.bo){cx.beginPath();cx.moveTo(e.x,e.y-sz);cx.lineTo(e.x+sz,e.y);cx.lineTo(e.x+sz*.6,e.y+sz);cx.lineTo(e.x-sz*.6,e.y+sz);cx.lineTo(e.x-sz,e.y);cx.closePath();cx.fill();cx.strokeStyle='#ff3333';cx.lineWidth=2;cx.stroke()}
    else{cx.beginPath();cx.arc(e.x,e.y,sz,0,Math.PI*2);cx.fill()}
    cx.fillStyle=e.bo?'#ff0':'#eee';cx.beginPath();cx.arc(e.x-sz*.25,e.y-sz*.15,sz*.15,0,Math.PI*2);cx.fill();cx.beginPath();cx.arc(e.x+sz*.25,e.y-sz*.15,sz*.15,0,Math.PI*2);cx.fill();

    // Status visuals
    if(e.statuses){
      var sIco='',sClr='';
      if(e.statuses.burn&&e.statuses.burn.stacks>0){sIco='\uD83D\uDD25';sClr='#ff6600'}
      if(e.statuses.freeze&&e.statuses.freeze.stacks>0){cx.strokeStyle='#74b9ffcc';cx.lineWidth=3;cx.beginPath();cx.arc(e.x,e.y,sz+4,0,Math.PI*2);cx.stroke();sIco='\u2744\uFE0F';sClr='#74b9ff'}
      if(e.statuses.poison&&e.statuses.poison.stacks>0){cx.fillStyle='#6bcb7720';cx.beginPath();cx.arc(e.x,e.y,sz+2,0,Math.PI*2);cx.fill();sIco='\u2620\uFE0F';sClr='#6bcb77'}
      if(e.statuses.stun&&e.statuses.stun.stacks>0){sIco='\u2B50';sClr='#ffd93d'}
      if(e.statuses.vulnerable&&e.statuses.vulnerable.stacks>0){cx.strokeStyle='#e8485560';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,sz+6,0,Math.PI*2);cx.stroke()}
      if(e.statuses.mark&&e.statuses.mark.stacks>0){cx.strokeStyle='#ff9f43';cx.lineWidth=2;cx.setLineDash([3,3]);cx.beginPath();cx.arc(e.x,e.y,sz+8,0,Math.PI*2);cx.stroke();cx.setLineDash([])}
      if(e.statuses.fear&&e.statuses.fear.stacks>0){sIco='\uD83D\uDC7B';sClr='#6666aa'}
      if(e.statuses.corruption&&e.statuses.corruption.stacks>0){cx.fillStyle='#66226630';cx.beginPath();cx.arc(e.x,e.y,sz+3,0,Math.PI*2);cx.fill()}
      if(sIco){cx.font='10px serif';cx.textAlign='center';cx.fillStyle=sClr;cx.fillText(sIco,e.x,e.y-sz-6)}
      var stTxt='';
      if(e.statuses.poison&&e.statuses.poison.stacks>1)stTxt+=e.statuses.poison.stacks+'x\u2620';
      if(e.statuses.shock&&e.statuses.shock.stacks>0)stTxt+=(stTxt?' ':'')+e.statuses.shock.stacks+'x\u26A1';
      if(e.statuses.curse&&e.statuses.curse.stacks>0)stTxt+=(stTxt?' ':'')+e.statuses.curse.stacks+'x\uD83D\uDC80';
      if(stTxt){cx.font='bold 7px Cinzel';cx.fillStyle='#fff';cx.textAlign='left';cx.fillText(stTxt,e.x+sz+2,e.y+2)}
    }
    if(e.sva>.3&&!e.corrupted){cx.strokeStyle='#74b9ff88';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,sz+3,0,Math.PI*2);cx.stroke()}
    if(e.fly){cx.fillStyle='#ffffff80';cx.font='bold 14px serif';cx.textAlign='center';cx.fillText('~',e.x,e.y-sz-4)}
    if(e.shield>0){cx.strokeStyle='rgba(91,192,255,.5)';cx.lineWidth=2.5;cx.beginPath();cx.arc(e.x,e.y,sz+4,0,Math.PI*2);cx.stroke()}
    if(e.armor>0){cx.strokeStyle='rgba(136,136,153,.5)';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,sz+2,0,Math.PI*2);cx.stroke()}
    if(e.faction&&e.faction!=='neutral'&&FACTIONS[e.faction]){cx.fillStyle=FACTIONS[e.faction].color;cx.font='bold 8px serif';cx.textAlign='center';cx.fillText(FACTIONS[e.faction].icon,e.x,e.y+sz+12)}
    if(e.elite){cx.fillStyle='#ffd93d';cx.font='bold 7px Cinzel';cx.textAlign='center';cx.fillText('ELITE',e.x,e.y-sz-8)}
    cx.restore();
    if(e.stealth&&!e.revealed)cx.globalAlpha=1;
    // HP bar
    var bw=CL*.55,bh=4,bx=e.x-bw/2,by=e.y-CL*e.z*.4;
    cx.fillStyle='rgba(0,0,0,.5)';cx.fillRect(bx-1,by-1,bw+2,bh+2);
    var pct=e.hp/e.mh;cx.fillStyle=pct>.5?'#4ecdc4':pct>.25?'#ffd93d':'#e84855';cx.fillRect(bx,by,bw*Math.max(0,pct),bh);
    if(e.shield>0){cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(bx-1,by-10,bw+2,7);cx.fillStyle='#5bc0ff';cx.fillRect(bx,by-9,bw*Math.max(0,e.shield/e.maxShield),6);cx.strokeStyle='#88ddff';cx.lineWidth=.5;cx.strokeRect(bx-1,by-10,bw+2,7)}
  }

  // Boss bar
  var bosses=[];for(var i=0;i<C.enemies.length;i++)if(C.enemies[i].bo)bosses.push(C.enemies[i]);
  if(bosses.length){var b=bosses[0],bW=W-40,bH=14,bX=20,bY=6;cx.fillStyle='rgba(0,0,0,.7)';cx.fillRect(bX-2,bY-2,bW+4,bH+4);cx.fillStyle='#330000';cx.fillRect(bX,bY,bW,bH);cx.fillStyle='#e84855';cx.fillRect(bX,bY,bW*Math.max(0,b.hp/b.mh),bH);cx.strokeStyle='#e8485580';cx.lineWidth=1;cx.strokeRect(bX,bY,bW,bH);cx.fillStyle='#fff';cx.font='bold 10px Cinzel';cx.textAlign='center';cx.textBaseline='middle';cx.fillText((ENEMIES[b.tp]?ENEMIES[b.tp].name:b.tp)+' '+Math.floor(b.hp)+'/'+Math.floor(b.mh),W/2,bY+bH/2+2)}

  if(C.strTimer>0){cx.fillStyle='#ff6b6b';cx.font='bold 10px Cinzel';cx.textAlign='left';cx.fillText('FORCA:'+Math.ceil(C.strTimer)+'s',8,14)}

  // Projectiles
  for(var i=0;i<C.projectiles.length;i++){var p=C.projectiles[i];cx.save();cx.fillStyle=p.cl;cx.shadowColor=p.cl;cx.shadowBlur=p.sz>4?10:6;cx.beginPath();cx.arc(p.x,p.y,p.sz||3,0,Math.PI*2);cx.fill();cx.restore()}

  // Particles
  for(var i=0;i<C.particles.length;i++){var p=C.particles[i],a=p.l/p.ml;cx.globalAlpha=a;cx.fillStyle=p.cl;cx.beginPath();cx.arc(p.x,p.y,p.sz*a,0,Math.PI*2);cx.fill()}
  cx.globalAlpha=1;

  // Announcement
  if(C.announce&&C.announce.timer>0){var a2=Math.min(1,C.announce.timer),ib=C.announce.text.indexOf('BOSS')>=0||C.announce.text.indexOf('CHEFE')>=0;cx.save();cx.globalAlpha=a2;cx.fillStyle=ib?'#e84855':'#d4a843';cx.font='bold 28px Cinzel';cx.textAlign='center';cx.textBaseline='middle';cx.shadowColor=ib?'#e84855':'#d4a843';cx.shadowBlur=20;cx.fillText(C.announce.text,W/2,H/2);cx.restore()}

  // Floats
  for(var i=0;i<C.floats.length;i++){var t=C.floats[i],a3=t.l/t.ml;cx.globalAlpha=a3;cx.fillStyle=t.c;cx.font='bold 12px Cinzel';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(t.t,t.x,t.y)}
  cx.globalAlpha=1;

  // Hover
  if(C.hovC!==null&&C.hovR!==null&&(G.state==='COMBAT'||G.state==='WAVE')){
    var hc=C.hovC,hr=C.hovR,hx=hc*CL,hy=hr*CL;
    if(C.selCard!==null){var en2=C.hand[C.selCard],card2=CARDS[en2.id];if(card2&&(card2.type==='tower'||card2.type==='mod')){cx.strokeStyle=canBuild(hc,hr)?'#4ecdc460':'#e8485560';cx.lineWidth=2;cx.strokeRect(hx+1,hy+1,CL-2,CL-2)}else if(card2&&card2.type==='spell'){cx.strokeStyle='#ff6b6b40';cx.lineWidth=2;cx.strokeRect(hx+1,hy+1,CL-2,CL-2)}}
    else if(C.grid[hc]&&C.grid[hc][hr]){cx.strokeStyle='#d4a84330';cx.lineWidth=1;cx.strokeRect(hx+1,hy+1,CL-2,CL-2)}
  }

  cx.fillStyle='#d4a84380';cx.font='10px Cinzel';cx.textAlign='right';cx.fillText('W'+C.encW+'/'+C.totalW,W-8,24);
  cx.restore();
}
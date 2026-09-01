// ═══════════════════════════════════════════════════════════════
// run.js - Game state, logic, combat, towers, enemies
// ═══════════════════════════════════════════════════════════════

// ═══ AUDIO ═══
var AC=null;
function iA(){ try{ AC=new(window.AudioContext||window.webkitAudioContext) }catch(e){} }
function sfx(t){ if(!AC)return; try{
  var o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime;
  o.connect(g);g.connect(AC.destination);
  o.type=t==='s'?'square':t==='w'||t==='d'?'sawtooth':'sine';
  o.frequency.setValueAtTime(t==='p'?300:t==='s'?500:t==='k'?600:t==='sp'?350:t==='w'?180:t==='d'?90:500,n);
  o.frequency.exponentialRampToValueAtTime(t==='p'?150:t==='s'?200:t==='k'?1100:t==='sp'?700:t==='w'?350:t==='d'?40:800,n+.12);
  g.gain.setValueAtTime(.08,n);g.gain.exponentialRampToValueAtTime(.001,n+.12);
  o.start(n);o.stop(n+.12);
}catch(e){} }

// ═══ UTILS ═══
function dst(x1,y1,x2,y2){ return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)) }
function cc(c,r){ return [c*CL+CL/2, r*CL+CL/2] }
function shf(a){ var b=a.slice(); for(var i=b.length-1;i>0;i--){var j=Math.random()*(i+1)|0,t=b[i];b[i]=b[j];b[j]=t} return b }

// ═══ SAVE/LOAD ═══
var CAMP={ unlocked:false, firstVictory:false };
function loadProg(){ try{ var d=JSON.parse(localStorage.getItem('asP')); if(d){CAMP.unlocked=!!d.ab;CAMP.firstVictory=!!d.fv} }catch(e){} }
function saveProg(){ try{ localStorage.setItem('asP',JSON.stringify({ab:CAMP.unlocked,fv:CAMP.firstVictory})) }catch(e){} }
function updMenuAb(){ var b=$('btnAb'); if(CAMP.unlocked){ b.style.opacity='1';b.style.cursor='pointer';b.disabled=false;b.textContent='O ABISMO';b.onclick=function(){alert('Campanha... (em breve)')} } }
function showTutorial(){ if(localStorage.getItem('asTut'))return; $('oTut').classList.remove('h') }
function dismissTutorial(){ localStorage.setItem('asTut','1'); $('oTut').classList.add('h') }

// ═══ GAME STATE ═══
var speedIdx=0, autoUpTimer=0, ouroDisplay=0;
var G={};

function resetAll(){
  var sd={ dobroes:G.player?G.player.dobroes:20, fv:G.player?G.player.firstVictory:false, cc:G.player?G.player.carriedCard:null, cr:G.player?G.player.carriedRelic:null };
  G={ state:'MENU', player:{hp:80,maxHp:80,dobroes:sd.dobroes+1000,ouro:0,deck:[],relics:[],potions:[],firstVictory:sd.fv,carriedCard:sd.cc,carriedRelic:sd.cr}, map:{nodes:[],curId:0,totalH:0,scrollY:0,revealFloor:1}, nodeCount:0, autoWv:false, autoTm:0, spd:1, difficulty:'normal', cb:{} };
  resetCombat();
}

function resetCombat(){
  G.cb={ drawPile:[],hand:[],discardPile:[],mana:5,maxMana:5,leftoverMana:0, towers:[],enemies:[],allies:[],projectiles:[],particles:[],floats:[],mines:[],beams:[], grid:null, waveQ:null,waveTm:0,waveIdx:0,encW:0,totalW:0,encType:'',diff:1, selCard:null,selTower:null,hovC:null,hovR:null,shake:0,announce:null,strTimer:0 };
  G.cb.grid=[];
  for(var c=0;c<CN;c++){ G.cb.grid[c]=[]; for(var r=0;r<RN;r++) G.cb.grid[c][r]=null; }
}

function relV(ef){ var v=0; for(var i=0;i<G.player.relics.length;i++){var d=RELICS[G.player.relics[i]];if(d&&d.ef===ef)v+=d.v} return v }
function hasRel(id){ return G.player.relics.indexOf(id)>=0 }
function maxLocks(){ var ml=1; for(var i=0;i<G.player.relics.length;i++){var r=RELICS[G.player.relics[i]];if(r.ef==='maxLocks')ml+=r.v;if(r.ef==='infLocks')return 9999} return ml }
function maxSt(cl){ return cl+2 }
function lvStats(id,lv){ var c=CARDS[id];if(!c)return{}; var s={};for(var k in c)s[k]=c[k]; if(c.levels&&c.levels[lv-2]){var o=c.levels[lv-2];for(var k in o)s[k]=o[k]} return s }
function countLocked(){ var n=0; for(var i=0;i<G.cb.hand.length;i++)if(G.cb.hand[i].locked)n++; return n }
function getEffDiff(){ if(G.cb.encType==='boss')return'nightmare'; if(G.cb.encType==='skull'&&G.difficulty==='normal')return'hard'; return G.difficulty||'normal' }

// ═══ GOLD ═══
function addOuro(a){ G.player.ouro+=a; if(G.state==='COMBAT'||G.state==='WAVE')spawnGoldFloat(a) }
function spawnGoldFloat(a){ var el=document.createElement('div');el.className='gldF';el.textContent=(a>0?'+':'')+a+'au';el.style.color=a>0?'#ffd93d':'#e84855';$('gldWrap').appendChild(el);setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},1100) }
function updateGoldDisplay(dt){ var d=G.player.ouro-ouroDisplay; if(Math.abs(d)>.5)ouroDisplay+=d*Math.min(1,dt*10); else ouroDisplay=G.player.ouro; $('gldAu').textContent=Math.round(ouroDisplay) }

// ═══ SPEED/AUTO ═══
function toggleSpeed(){ speedIdx=(speedIdx+1)%SPEEDS.length;G.spd=SPEEDS[speedIdx];$('bS').textContent=G.spd+'x';$('bS').classList.toggle('on',G.spd>1) }
function toggleAuto(){ G.autoWv=!G.autoWv;$('bA').classList.toggle('on',G.autoWv);if(!G.autoWv)G.autoTm=0 }
function uAuto(dt){ if(!G.autoWv||G.state!=='COMBAT'||G.cb.encW===0)return; if(G.autoTm>0){G.autoTm-=dt;if(G.autoTm<=0){G.autoTm=0;startWave()}} }

// ═══ MAP ═══
function rndType(){ var r=Math.random(); if(r<.25)return'sword';if(r<.45)return'crossed';if(r<.60)return'skull';if(r<.78)return'event';if(r<.90)return'campfire';return'shop' }
function connLines(cur,nxt){
  for(var i=0;i<cur.length;i++){ var srt=[]; for(var j=0;j<nxt.length;j++)srt.push({j:j,d:Math.abs(cur[i].x-nxt[j].x)}); srt.sort(function(a,b){return a.d-b.d}); cur[i].conn.push(nxt[srt[0].j].id); if(srt.length>1&&Math.random()<.45)cur[i].conn.push(nxt[srt[1].j].id) }
  for(var j=0;j<nxt.length;j++){ var has=false; for(var i=0;i<cur.length;i++){for(var k=0;k<cur[i].conn.length;k++){if(cur[i].conn[k]===nxt[j].id){has=true;break}}if(has)break} if(!has){var bi=0,bd=1e9;for(var i=0;i<cur.length;i++){var d=Math.abs(cur[i].x-nxt[j].x);if(d<bd){bd=d;bi=i}}cur[bi].conn.push(nxt[j].id)} }
}
function genMap(){
  var ns=[],ni=0,TL=15,SP=42,PAD=50,totalH=PAD+(TL+2)*SP+40;
  var startY=totalH-PAD;
  ns.push({id:ni++,tp:'start',fl:0,conn:[],done:true,av:false,x:360,y:startY});
  var lines=[];
  for(var f=1;f<=TL;f++){ var ct=f===1?3:2+Math.floor(Math.random()*3);var nodes=[];for(var i=0;i<ct;i++){var x=ct===1?360:100+i*(520/Math.max(1,ct-1));nodes.push({id:ni++,tp:rndType(),fl:f,conn:[],done:false,av:false,x:x,y:startY-f*SP});ns.push(nodes[nodes.length-1])}lines.push(nodes) }
  var preY=startY-(TL+1)*SP;var lt=Math.random()<.5?'shop':'event';var rt=lt==='shop'?'event':'shop';
  var preB=[{id:ni++,tp:lt,fl:TL+1,conn:[],done:false,av:false,x:250,y:preY},{id:ni++,tp:rt,fl:TL+1,conn:[],done:false,av:false,x:470,y:preY}];
  ns.push(preB[0]);ns.push(preB[1]);lines.push(preB);
  var bossN={id:ni++,tp:'boss',fl:TL+2,conn:[],done:false,av:false,x:360,y:startY-(TL+2)*SP};ns.push(bossN);lines.push([bossN]);
  for(var i=0;i<lines[0].length;i++)ns[0].conn.push(lines[0][i].id);
  for(var f=0;f<lines.length-1;f++)connLines(lines[f],lines[f+1]);
  G.map={nodes:ns,curId:0,totalH:totalH,scrollY:totalH,revealFloor:1};
  for(var i=0;i<ns[0].conn.length;i++)ns[ns[0].conn[i]].av=true;
}
function enterNode(nid){
  var nd=G.map.nodes[nid]; if(!nd.av)return;
  G.map.curId=nid; G.map.revealFloor=Math.max(G.map.revealFloor,nd.fl+2);
  var bg=relV('ndGold'); if(bg)addOuro(bg);
  if(nd.tp==='sword'||nd.tp==='crossed'||nd.tp==='skull'||nd.tp==='boss') startEnc(nd.tp);
  else if(nd.tp==='shop') showShop();
  else if(nd.tp==='campfire') showCF();
  else if(nd.tp==='event') showEv();
}
function compNode(){
  var nd=G.map.nodes[G.map.curId]; nd.done=true; G.nodeCount++;
  for(var i=0;i<G.map.nodes.length;i++){if(G.map.nodes[i].fl===nd.fl&&G.map.nodes[i].id!==nd.id)G.map.nodes[i].av=false}
  for(var i=0;i<nd.conn.length;i++)G.map.nodes[nd.conn[i]].av=true;
  if(nd.tp==='boss'){CAMP.firstVictory=true;CAMP.unlocked=true;saveProg();updMenuAb();G.state='VICTORY';showVictory();return}
  G.state='MAP'; uH();
}

// ═══ COMBAT SETUP ═══
function startEnc(type){
  G.state='COMBAT';resetCombat();var C=G.cb,enc=ENC[type];
  C.encType=type;C.totalW=enc.wv;C.encW=0;C.diff=1+G.nodeCount*.2;
  C.maxMana=5+relV('maxMana');C.mana=C.maxMana;C.leftoverMana=0;
  ouroDisplay=0;autoUpTimer=0;genPath();shDraw();drawCards(HM);
  $('cb').style.display='flex';$('hn').style.display='flex';
  $('siDob').style.display='none';$('siM').style.display='';$('siW').style.display='';$('siP').style.display='';
  uH();showTutorial();updateWavePreview();
}
function startWave(){
  if(G.state!=='COMBAT')return;G.state='WAVE';var C=G.cb;
  C.encW++;C.mana=Math.min(C.maxMana+(C.leftoverMana||0),10);C.leftoverMana=0;rWM();
  C.waveQ=genWave(C.encW,C.diff);C.waveTm=0;C.waveIdx=0;drawCards(HM);sfx('w');
  for(var i=0;i<C.towers.length;i++){var tw=C.towers[i];if(tw.trib&&tw.trib.trigger==='wave_start'&&tw.tribReady){tw.trib.execute(tw);tw.tribCD=tw.trib.cd||10;tw.tribReady=false}}
  var hasFly=false;for(var i=0;i<C.waveQ.length;i++){if(ENEMIES[C.waveQ[i].t]&&ENEMIES[C.waveQ[i].t].fly)hasFly=true}
  if(hasFly)setTimeout(function(){fTx(W/2,H/2-40,'VOADORES! So Hybrid!','#ff9f43')},300);
  var lb='ONDA '+C.encW+'/'+C.totalW;if(C.encW>=C.totalW){var t=C.encType;lb=t==='boss'?'CHEFE FINAL':t==='skull'?'BOSS':'MINI-BOSS'}
  C.announce={text:lb,timer:1.5};uH();
}
function genWave(n,diff){
  var w=[],enc=ENC[G.cb.encType],fl=G.map.nodes[G.map.curId].fl,hm=diff*n*enc.hps*DIFFS[getEffDiff()].hm,isLast=n>=enc.wv;
  if(isLast){for(var i=0;i<5;i++)w.push({t:'crawler',d:i*.4,hm:hm});w.push({t:G.cb.encType==='boss'?'golem':'titan',d:5,hm:hm*2});return w}
  var ct=3+Math.floor(n*.8);
  for(var i=0;i<ct;i++){
    var t='crawler';
    if(n>=2&&Math.random()<.25)t='swift';if(n>=3&&Math.random()<.12)t='brute';
    if(n>=4&&Math.random()<.08)t='wraith';if(fl>=3&&Math.random()<.05)t='armored';
    if(fl>=4&&Math.random()<.06)t='shield_brute';if(fl>=6&&Math.random()<.06)t='weakness_mob';
    if(fl>=8&&Math.random()<.05)t='healer';if(fl>=8&&Math.random()<.04)t='aura_buffer';
    if(fl>=10&&Math.random()<.08)t='phoenix';if(fl>=10&&Math.random()<.04)t='stealth';
    if(fl>=12&&Math.random()<.03)t='corrupted';
    w.push({t:t,d:i*.8,hm:hm});
  }
  return w;
}
function updateWavePreview(){
  var C=G.cb;if(G.state!=='COMBAT'||C.encW>=C.totalW){$('wvPrev').innerHTML='';return}
  var wq=genWave(C.encW+1,C.diff),counts={};
  for(var i=0;i<wq.length;i++){var t=wq[i].t;if(!counts[t])counts[t]=0;counts[t]++}
  var h='';for(var t in counts){var e=ENEMIES[t];h+='<span style="color:'+(e?e.cl:'#fff')+';font-weight:700">'+counts[t]+'x '+t+'</span> '}
  $('wvPrev').innerHTML=h;
}
function updateSpawner(dt){
  var C=G.cb;if(G.state!=='WAVE'||!C.waveQ)return;C.waveTm+=dt;
  while(C.waveIdx<C.waveQ.length&&C.waveTm>=C.waveQ[C.waveIdx].d){spawnE(C.waveQ[C.waveIdx].t,C.waveQ[C.waveIdx].hm);C.waveIdx++}
  if(C.waveIdx>=C.waveQ.length&&C.enemies.length===0)endWave();
}
function endWave(){
  var C=G.cb;C.leftoverMana=Math.max(0,C.mana);var bonus=3+relV('wvGold');addOuro(bonus);
  for(var i=0;i<C.towers.length;i++){var tw=C.towers[i];if(tw.sub==='farm'&&tw.farmGold>0){var fg=tw.farmGold+(tw.stars-1);addOuro(fg);fTx(tw.x,tw.y,'+'+fg+'au','#ffd93d')}}
  if(hasRel('blood_gem'))for(var i=0;i<C.towers.length;i++)C.towers[i].stkDmg=(C.towers[i].stkDmg||0)+1;
  doAutoUpgrade();discHand();rWM();
  if(C.encW>=C.totalW&&C.enemies.length===0){endEnc();return}
  G.state='COMBAT';C.mana=Math.min(C.maxMana+(C.leftoverMana||0),10);drawCards(HM);
  if(G.autoWv)G.autoTm=2.5;updateWavePreview();uH();
}
function endEnc(){ G.state='REWARD';showReward();$('cb').style.display='none';$('hn').style.display='none';$('siDob').style.display='';$('siM').style.display='none';$('siW').style.display='none';$('siP').style.display='none' }

// ═══ TOWERS ═══
function canBuild(c,r){ return c>=0&&c<CN&&r>=0&&r<RN&&!pathSet[c+','+r]&&!G.cb.grid[c][r] }
function placeTwr(c,r,idx,autoUp){
  var C=G.cb,en=C.hand[idx],card=CARDS[en.id],ls=lvStats(en.id,en.lv);
  C.mana-=ls.cost||card.cost;C.hand.splice(idx,1);C.discardPile.push(en);
  var pos=cc(c,r);
  var tw={id:en.id,cLv:en.lv,col:c,row:r,x:pos[0],y:pos[1],stars:1,bDmg:ls.damage||card.damage||0,bSpd:ls.atkSpd||card.atkSpd||1,range:(ls.range||card.range||2.5)*CL*(1+relV('twRng')),dMul:1+relV('twDmg'),sMul:1+relV('twSpd'),rMul:1,cd:0,pSpd:(ls.pSpd||card.pSpd||6)*CL,slow:ls.slow||card.slow||0,slowDur:ls.slowDur||card.slowDur||0,spl:(ls.spl||card.spl||0)*CL,poisDmg:ls.poisDmg||card.poisDmg||0,poisDur:ls.poisDur||card.poisDur||0,bleedDmg:ls.bleedDmg||card.bleedDmg||0,bleedDur:ls.bleedDur||card.bleedDur||0,burnDmg:ls.burnDmg||card.burnDmg||0,burnDur:ls.burnDur||card.burnDur||0,chn:ls.chn||card.chn||0,chr:(ls.chr||card.chr||0)*CL,cl:card.color,sh:card.shape||'circle',sub:card.sub,stkDmg:0,ultEff:null,stormCD:0,atkCnt:0,trib:card.tribute||null,tribCD:0,tribReady:!!card.tribute,priority:'first',autoUp:!!autoUp,tgtType:card.tgtType||'grounded',trigger:card.trigger||null,frenzy:card.frenzy||false,execThresh:card.execThresh||0,lifeSteal:card.lifeSteal||0,farmGold:card.farmGold||0,laser:card.laser||false,devour:card.devour||false,activeSkill:card.activeSkill||null,activeCD:0,tempBuff:1,tempBuffTimer:0,tempRangeBuff:1,tempRangeBuffTimer:0,weakMul:1,weakTimer:0};
  C.towers.push(tw);C.grid[c][r]=tw;spP(pos[0],pos[1],card.color,10);sfx('p');C.selCard=null;rHd();uH();
}
function twDmg(tw){ var cm=[1,1.35,1.75][tw.cLv-1]||1,sm=1+(tw.stars-1)*.35; return Math.floor((tw.bDmg+tw.stkDmg)*cm*sm*tw.dMul*(tw.weakMul||1)*(tw.tempBuff||1))*(tw.ultEff==='plague'?3:1) }
function twSpd(tw){ var cm=[1,1.1,1.2][tw.cLv-1]||1,sm=1+(tw.stars-1)*.1; return tw.bSpd*cm*sm*tw.sMul*(tw.tempBuff>1&&tw.tempBuffTimer>0?tw.tempBuff:1) }
function twRange(tw){ return tw.range*tw.rMul*(tw.tempRangeBuff||1) }
function findTgt(tw){
  var er=twRange(tw),best=null,bv=null,air=tw.tgtType==='hybrid';
  for(var i=0;i<G.cb.enemies.length;i++){
    var e=G.cb.enemies[i];if(e.fly&&!air)continue;if(e.stealth&&!e.revealed)continue;
    var d=dst(tw.x,tw.y,e.x,e.y);if(d>er)continue;
    var val;switch(tw.priority){case'last':val=-e.pi;break;case'strong':val=e.hp;break;case'weak':val=-e.hp;break;case'close':val=-d;break;default:val=e.pi;break}
    if(best===null||val>bv){best=e;bv=val}
  }
  return best;
}
function uTw(dt){
  var C=G.cb;
  for(var i=0;i<C.towers.length;i++){
    var tw=C.towers[i];
    if(tw.weakTimer>0){tw.weakTimer-=dt;if(tw.weakTimer<=0)tw.weakMul=1}
    if(tw.tempBuffTimer>0){tw.tempBuffTimer-=dt;if(tw.tempBuffTimer<=0)tw.tempBuff=1}
    if(tw.tempRangeBuffTimer>0){tw.tempRangeBuffTimer-=dt;if(tw.tempRangeBuffTimer<=0)tw.tempRangeBuff=1}
    if(tw.activeCD>0)tw.activeCD-=dt;
    if(!tw.tribReady){tw.tribCD-=dt;if(tw.tribCD<=0)tw.tribReady=true}
    if(tw.sub==='farm')continue;
    if(tw.ultEff==='blizzard')for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw))e.sva=Math.max(e.sva,.3)}
    if(tw.ultEff==='tempestade'){tw.stormCD-=dt;if(tw.stormCD<=0){tw.stormCD=4;for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){dmgE(e,twDmg(tw)*.4);spP(e.x,e.y,'#ffd93d',4)}}}}
    if(tw.devour&&tw.cd<=0){var tgt=findTgt(tw);if(tgt&&!tgt.bo){kE(tgt);var ei=C.enemies.indexOf(tgt);if(ei>=0)C.enemies.splice(ei,1);tw.cd=25;sfx('k');continue}}
    if(tw.laser&&tw.cd<=0){var tgt=findTgt(tw);if(tgt){fireLaserBeam(tw,tgt);tw.cd=1/twSpd(tw);sfx('s');continue}}
    if(tw.cd>0){tw.cd-=dt;continue}
    var tgt=findTgt(tw);
    if(tgt){
      var u=tw.ultEff;
      if(u==='tri_shot'){fireP(tw,tgt,-.15);fireP(tw,tgt,0);fireP(tw,tgt,.15)}
      else if(u==='double_shot'){fireP(tw,tgt,0);fireP(tw,tgt,0)}
      else if(u==='headshot'){tw.atkCnt++;if(tw.atkCnt>=3){tw.atkCnt=0;fireP(tw,tgt,0,5)}else fireP(tw,tgt,0)}
      else fireP(tw,tgt,0);
      tw.cd=1/twSpd(tw);sfx('s');
    }
  }
}
function fireLaserBeam(tw,tgt){
  var dx=tgt.x-tw.x,dy=tgt.y-tw.y,d=Math.sqrt(dx*dx+dy*dy),ux=dx/d,uy=dy/d,er=twRange(tw);
  for(var j=0;j<G.cb.enemies.length;j++){var e=G.cb.enemies[j],ex=e.x-tw.x,ey=e.y-tw.y,proj=ex*ux+ey*uy;if(proj>0&&proj<er){var perp=Math.abs(-ex*uy+ey*ux);if(perp<CL*.5)dmgE(e,twDmg(tw))}}
  G.cb.beams.push({x1:tw.x,y1:tw.y,x2:tw.x+ux*er,y2:tw.y+uy*er,cl:tw.cl,timer:.3});
}
function fireP(tw,tgt,ang,mul){
  mul=mul||1;
  if(tw.trigger&&tw.trigger.ch>0&&Math.random()<tw.trigger.ch){var tr=tw.trigger;switch(tr.tp){case'draw':drawCards(1);fTx(tw.x,tw.y-25,'DRAW!','#ffd93d');break;case'crit':mul*=(tr.mult||2);fTx(tw.x,tw.y-25,'CRIT!','#ff4444');break;case'gold':addOuro(5);fTx(tw.x,tw.y-25,'+5au!','#ffd93d');break}sfx('rw')}
  G.cb.projectiles.push({x:tw.x,y:tw.y,tgt:tgt,ang:ang,sp:tw.pSpd,dm:twDmg(tw)*mul,cl:tw.ultEff?'#ffd93d':tw.cl,slow:tw.slow,slowDur:tw.slowDur,spl:tw.spl,poisDmg:tw.poisDmg,poisDur:tw.poisDur,bleedDmg:tw.bleedDmg,bleedDur:tw.bleedDur,burnDmg:tw.burnDmg,burnDur:tw.burnDur,chn:tw.ultEff==='tempestade'?tw.chn*2:tw.chn,chr:tw.chr,sz:tw.ultEff?5:4,stun:tw.ultEff==='nuclear'?2:tw.ultEff==='devastacao'?.25:0,hasAng:ang!==0,canAir:tw.tgtType==='hybrid',execThresh:tw.execThresh||0});
}
function rWM(){ for(var i=0;i<G.cb.towers.length;i++){G.cb.towers[i].dMul=1+relV('twDmg');G.cb.towers[i].sMul=1+relV('twSpd')} }
function useActiveSkill(tw){
  if(!tw.activeSkill||tw.activeCD>0)return;var C=G.cb,eff=tw.activeSkill.effect;
  switch(eff){
    case'buff_all':for(var i=0;i<C.towers.length;i++){C.towers[i].tempBuff=1.4;C.towers[i].tempBuffTimer=8}spP(W/2,H/2,'#e84855',20);break;
    case'heal_player':G.player.hp=Math.min(G.player.hp+3,G.player.maxHp);fTx(W/2,H/2,'+3 HP','#44ff44');break;
    case'range_buff':for(var i=0;i<C.towers.length;i++){var o=C.towers[i];if(o!==tw&&dst(tw.x,tw.y,o.x,o.y)<=3*CL){o.tempRangeBuff=1.5;o.tempRangeBuffTimer=10}}spP(tw.x,tw.y,'#74b9ff',15);break;
    case'teleport_back':var cnt=0;for(var i=0;i<C.enemies.length&&cnt<3;i++){var e=C.enemies[i];if(!e.bo){e.pi=Math.max(0,e.pi-10);var pos=cc(pathCells[e.pi][0],pathCells[e.pi][1]);e.x=pos[0];e.y=pos[1];spP(e.x,e.y,'#00cec9',10);cnt++}}break;
    case'overcharge':for(var i=0;i<C.towers.length;i++){C.towers[i].tempBuff=Math.max(C.towers[i].tempBuff,2);C.towers[i].tempBuffTimer=6}spP(W/2,H/2,'#ffd93d',20);break;
  }
  tw.activeCD=tw.activeSkill.cd;sfx('rw');showTP(tw);
}
function spawnAllyGolem(tw){
  var bestI=0,bestD=Infinity;for(var i=0;i<pathCells.length;i++){var pos=cc(pathCells[i][0],pathCells[i][1]),d=dst(tw.x,tw.y,pos[0],pos[1]);if(d<bestD){bestD=d;bestI=i}}
  var pos=cc(pathCells[bestI][0],pathCells[bestI][1]),hp=tw.ultEff==='army'?600:300;
  G.cb.allies.push({x:pos[0],y:pos[1],hp:hp,maxHp:hp,dmg:15,range:CL*1.5,dmgTm:0,pi:bestI,sz:.7});
}
function doAutoUpgrade(){
  for(var i=0;i<G.cb.towers.length;i++){var tw=G.cb.towers[i];if(!tw.autoUp)continue;var ms=maxSt(tw.cLv);if(tw.stars>=ms)continue;var co=STAR_COST[tw.stars]||99;if(G.player.ouro>=co){addOuro(-co);tw.stars++;if(tw.stars>=5){var card=CARDS[tw.id];if(card.ultimate)tw.ultEff=card.ultimate.effect}spP(tw.x,tw.y,'#ffd93d',12)}}
}
function sellTower(){
  var tw=G.cb.selTower;if(!tw)return;var inv=0;for(var s=1;s<tw.stars;s++)inv+=STAR_COST[s]||0;var ref=Math.floor(inv*.6);if(ref>0)addOuro(ref);
  G.cb.grid[tw.col][tw.row]=null;var idx=G.cb.towers.indexOf(tw);if(idx>=0)G.cb.towers.splice(idx,1);clP();
}

// ═══ ENEMIES ═══
function spawnE(tp,hm){
  var d=ENEMIES[tp],pos=cc(pathCells[0][0],pathCells[0][1]);
  G.cb.enemies.push({tp:tp,x:pos[0],y:pos[1],hp:d.hp*hm,mh:d.hp*hm,sp:d.sp,g:d.g,pi:1,sva:0,stm:0,pd:0,ptm:0,cl:d.cl,z:d.z,re:d.re||0,bo:!!d.bo,shatM:1,shatT:0,fly:d.fly||0,shield:(d.shield||0)*hm,maxShield:(d.shield||0)*hm,armor:d.armor||0,healR:d.healR||0,healAmt:d.healAmt||0,auraSpd:d.auraSpd||0,buffedSpd:1,stealth:d.stealth||false,corrupted:d.corrupted||false,revealed:false,poisonStacks:0,bleedDmg:0,bleedDur:0,burnDmg:0,burnDur:0,weak:0,weakDur:0});
}
function uEn(dt){
  var C=G.cb;
  for(var i=0;i<C.enemies.length;i++)C.enemies[i].buffedSpd=1;
  for(var i=0;i<C.enemies.length;i++){
    var e=C.enemies[i];e.revealed=false;
    for(var j=0;j<C.towers.length;j++){if(dst(e.x,e.y,C.towers[j].x,C.towers[j].y)<=1.5*CL){e.revealed=true;break}}
    if(e.auraSpd>0)for(var j=0;j<C.enemies.length;j++){var o=C.enemies[j];if(o!==e&&dst(e.x,e.y,o.x,o.y)<=2*CL)o.buffedSpd=Math.max(o.buffedSpd,e.auraSpd)}
    if(e.healR>0)for(var j=0;j<C.enemies.length;j++){var o=C.enemies[j];if(o!==e&&!o.re&&dst(e.x,e.y,o.x,o.y)<=e.healR*CL)o.hp=Math.min(o.mh,o.hp+e.healAmt*dt)}
  }
  for(var i=C.enemies.length-1;i>=0;i--){
    var e=C.enemies[i];
    if(e.stm>0){e.stm-=dt;if(e.stm<=0)e.sva=0}
    if(e.ptm>0){e.ptm-=dt;e.hp-=e.pd*dt*(e.poisonStacks||1);if(e.ptm<=0)e.poisonStacks=0}
    if(e.bleedDur>0){e.bleedDur-=dt;e.hp-=e.bleedDmg*dt;if(e.bleedDur<=0)e.bleedDmg=0}
    if(e.burnDur>0){e.burnDur-=dt;e.hp-=e.burnDmg*dt;for(var j=0;j<C.enemies.length;j++){var o=C.enemies[j];if(o!==e&&dst(e.x,e.y,o.x,o.y)<=CL)o.hp-=e.burnDmg*.3*dt}if(e.burnDur<=0)e.burnDmg=0}
    if(e.shatT>0){e.shatT-=dt;if(e.shatT<=0)e.shatM=1}
    if(e.weakDur>0){e.weakDur-=dt;if(e.weakDur<=0)e.weak=0}
    if(e.re)e.hp=Math.min(e.mh,e.hp+e.re*dt);
    if(e.hp<=0){kE(e);C.enemies.splice(i,1);continue}
    if(e.pi>=pathCells.length){enEnd(e);C.enemies.splice(i,1);continue}
    var spd=e.sp*(1-e.sva)*(e.buffedSpd||1)*dt;if(e.corrupted)spd=e.sp*(e.buffedSpd||1)*dt;
    var pos=cc(pathCells[e.pi][0],pathCells[e.pi][1]),dx=pos[0]-e.x,dy=pos[1]-e.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<spd){e.x=pos[0];e.y=pos[1];e.pi++;if(e.pi>=pathCells.length){enEnd(e);C.enemies.splice(i,1)}}
    else{e.x+=dx/d*spd;e.y+=dy/d*spd}
  }
}
function kE(e){
  addOuro(e.g);
  for(var j=0;j<G.cb.towers.length;j++){var tw=G.cb.towers[j];if(tw.frenzy&&dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){tw.cd=0;spP(tw.x,tw.y,'#ff9f43',5)}if(tw.lifeSteal>0&&dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)){G.player.hp=Math.min(G.player.hp+tw.lifeSteal,G.player.maxHp);fTx(tw.x,tw.y,'+'+tw.lifeSteal+' HP','#44ff44')}}
  if(e.tp==='weakness_mob')for(var j=0;j<G.cb.towers.length;j++){var tw=G.cb.towers[j];if(dst(tw.x,tw.y,e.x,e.y)<=2.5*CL){tw.weakMul=.8;tw.weakTimer=5;spP(tw.x,tw.y,'#ff44aa',8);fTx(tw.x,tw.y,'FRAQUEZA!','#ff44aa')}}
  spP(e.x,e.y,e.bo?'#ff4444':'#ffd93d',e.bo?20:8);fTx(e.x,e.y,'+'+e.g+'au','#ffd93d');sfx('k');
  for(var i=0;i<G.cb.towers.length;i++){var tw=G.cb.towers[i];if(tw.trib&&tw.trib.trigger==='tower_kill'&&tw.tribReady){if(dst(tw.x,tw.y,e.x,e.y)<=twRange(tw)*2){tw.trib.execute(tw);tw.tribCD=tw.trib.cd||10;tw.tribReady=false}}}
}
function enEnd(e){
  if(e.bo){var bl=BOSS_LIVES[G.cb.encType];if(bl===-1){G.player.hp=0;gameOver();return}G.player.hp-=bl;G.cb.shake=15;sfx('d');fTx(W/2,40,'-'+bl+' HP!','#e84855');if(G.player.hp<=0)gameOver();return}
  G.player.hp--;G.cb.shake=10;sfx('d');fTx(W/2,40,'-1 HP','#e84855');
  for(var i=0;i<G.cb.towers.length;i++){var tw=G.cb.towers[i];if(tw.trib&&tw.trib.trigger==='enemy_pass'&&tw.tribReady){tw.trib.execute(tw);tw.tribCD=tw.trib.cd||10;tw.tribReady=false}}
  if(G.player.hp<=0)gameOver();
}
function dmgE(e,d){
  var a=d;if(e.weak>0)a*=1.3;if(e.armor>0)a=Math.max(1,a-e.armor);a*=(e.shatM||1);
  if(e.shield>0){var ab=Math.min(e.shield,a);e.shield-=ab;a-=ab;if(ab>0)fTx(e.x,e.y-20,Math.floor(ab)+'\u2611','#5bc0ff')}
  e.hp-=Math.max(0,a);fTx(e.x,e.y-10,Math.floor(Math.max(0,a))+'','#fff');
}

// ═══ PROJECTILES ═══
function uPj(dt){
  var C=G.cb;
  for(var i=C.projectiles.length-1;i>=0;i--){
    var p=C.projectiles[i];
    if(!p.hasAng){
      if(!p.tgt||p.tgt.hp<=0){var nd=null,dd=1e9;for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(e.fly&&!p.canAir)continue;if(e.stealth&&!e.revealed)continue;var d=dst(p.x,p.y,e.x,e.y);if(d<dd){nd=e;dd=d}}if(nd&&dd<CL*3)p.tgt=nd;else{C.projectiles.splice(i,1);continue}}
      var dx=p.tgt.x-p.x,dy=p.tgt.y-p.y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<p.sp*dt+6){pjHit(p);C.projectiles.splice(i,1)}else{p.x+=dx/d*p.sp*dt;p.y+=dy/d*p.sp*dt}
    }else{
      p.x+=Math.cos(p.ang)*p.sp*dt;p.y+=Math.sin(p.ang)*p.sp*dt;
      for(var j=0;j<C.enemies.length;j++){var e=C.enemies[j];if(e.fly&&!p.canAir)continue;if(dst(p.x,p.y,e.x,e.y)<CL*.4){var tmp={dm:p.dm,cl:p.cl,slow:p.slow,slowDur:p.slowDur,spl:p.spl,poisDmg:p.poisDmg,poisDur:p.poisDur,bleedDmg:p.bleedDmg,bleedDur:p.bleedDur,burnDmg:p.burnDmg,burnDur:p.burnDur,chn:p.chn,chr:p.chr,sz:p.sz,stun:p.stun,tgt:e,canAir:p.canAir,execThresh:p.execThresh};pjHit(tmp);C.projectiles.splice(i,1);break}}
      if(p.x<-50||p.x>W+50||p.y<-50||p.y>H+50)C.projectiles.splice(i,1);
    }
  }
}
function pjHit(p){
  var t=p.tgt;if(!t||t.hp<=0)return;if(t.fly&&!p.canAir)return;
  if(p.execThresh>0&&t.hp<=t.mh*p.execThresh)dmgE(t,99999);else dmgE(t,p.dm);
  spP(t.x,t.y,p.cl,4);
  if(p.stun>0&&!t.corrupted){t.sva=1;t.stm=Math.max(t.stm,p.stun)}
  if(p.slow>0&&!t.corrupted){t.sva=Math.max(t.sva,p.slow);t.stm=Math.max(t.stm,p.slowDur)}
  if(p.poisDmg>0){t.poisonStacks=Math.min((t.poisonStacks||0)+1,3);t.pd=Math.max(t.pd||0,p.poisDmg);t.ptm=Math.max(t.ptm,p.poisDur)}
  if(p.bleedDmg>0){t.bleedDmg=p.bleedDmg;t.bleedDur=p.bleedDur}
  if(p.burnDmg>0){t.burnDmg=p.burnDmg;t.burnDur=p.burnDur}
  if(p.spl>0){for(var j=0;j<G.cb.enemies.length;j++){var e=G.cb.enemies[j];if(e!==t&&dst(t.x,t.y,e.x,e.y)<=p.spl&&(!e.fly||p.canAir)){dmgE(e,p.dm*.5);spP(e.x,e.y,p.cl,2)}}spP(t.x,t.y,'#ff6b6b',10);G.cb.shake=Math.max(G.cb.shake,3)}
  if(p.chn>1){var lt=t,ch={};ch[t.x+','+t.y]=1;for(var ci=0;ci<p.chn-1;ci++){var nd=null,dd=p.chr;for(var j=0;j<G.cb.enemies.length;j++){var e=G.cb.enemies[j],key=e.x+','+e.y;if(!ch[key]&&(!e.fly||p.canAir)){var d=dst(lt.x,lt.y,e.x,e.y);if(d<dd){nd=e;dd=d}}}if(nd){dmgE(nd,p.dm*.6);ch[nd.x+','+nd.y]=1;spP(nd.x,nd.y,'#ffd93d',3);lt=nd}else break}}
}

// ═══ ALLIES / MINES / BEAMS / PARTICLES ═══
function uAl(dt){var C=G.cb;for(var i=C.allies.length-1;i>=0;i--){var a=C.allies[i];a.dmgTm-=dt;if(a.dmgTm<=0){a.dmgTm=1;for(var j=0;j<C.enemies.length;j++){if(dst(a.x,a.y,C.enemies[j].x,C.enemies[j].y)<=a.range)dmgE(C.enemies[j],a.dmg)}}for(var j=0;j<C.enemies.length;j++){if(dst(a.x,a.y,C.enemies[j].x,C.enemies[j].y)<CL*.5)a.hp-=15*dt}if(a.hp<=0){spP(a.x,a.y,'#a29bfe',10);C.allies.splice(i,1)}}}
function uMines(dt){var C=G.cb;for(var i=C.mines.length-1;i>=0;i--){var m=C.mines[i];m.lifetime-=dt;if(m.lifetime<=0){C.mines.splice(i,1);continue}for(var j=0;j<C.enemies.length;j++){if(dst(m.x,m.y,C.enemies[j].x,C.enemies[j].y)<=m.radius){dmgE(C.enemies[j],m.damage);spP(m.x,m.y,'#ff6b6b',20);C.shake=5;sfx('k');C.mines.splice(i,1);break}}}}
function uBeams(dt){var C=G.cb;for(var i=C.beams.length-1;i>=0;i--){C.beams[i].timer-=dt;if(C.beams[i].timer<=0)C.beams.splice(i,1)}}
function spP(x,y,c,n){for(var i=0;i<n;i++){var a=Math.random()*Math.PI*2,s=30+Math.random()*70;G.cb.particles.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:.3+Math.random()*.4,ml:.3+Math.random()*.4,cl:c,sz:2+Math.random()*3})}}
function uPt(dt){var C=G.cb;for(var i=C.particles.length-1;i>=0;i--){var p=C.particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.l-=dt;if(p.l<=0)C.particles.splice(i,1)}}
function fTx(x,y,t,c){G.cb.floats.push({x:x,y:y,t:t,c:c,l:.9,ml:.9})}
function uFt(dt){var C=G.cb;for(var i=C.floats.length-1;i>=0;i--){var t=C.floats[i];t.y-=40*dt;t.l-=dt;if(t.l<=0)C.floats.splice(i,1)}}

// ═══ POTIONS ═══
function usePot(idx){var id=G.player.potions[idx];if(!id)return;var p=POTS[id];G.player.potions.splice(idx,1);if(p.ef==='heal'){G.player.hp=Math.min(G.player.hp+p.v,G.player.maxHp);fTx(W/2,H/2,'+'+p.v+' HP','#e84855')}else if(p.ef==='mana'){G.cb.mana=Math.min(G.cb.mana+p.v,10);fTx(W/2,H/2,'+'+p.v+' mp','#a29bfe')}else if(p.ef==='str'){G.cb.strTimer=p.dur||30;for(var i=0;i<G.cb.towers.length;i++)G.cb.towers[i].dMul*=1+p.v;fTx(W/2,H/2,'+50%!','#ff6b6b')}sfx('rw');uH();rPots()}

// ═══ GAME LOOP ═══
var lastTime=0;
function gameLoop(ts){
  try{
    var raw=Math.min((ts-lastTime)/1000,.05),dt=raw*G.spd;lastTime=ts;
    if(G.state==='MAP'){renderMap();uH()}
    else if(G.state==='COMBAT'||G.state==='WAVE'){
      updateSpawner(dt);uTw(dt);uEn(dt);uPj(dt);uAl(dt);uMines(dt);uBeams(dt);uPt(dt);uFt(dt);
      uAuto(dt);updateGoldDisplay(dt);
      autoUpTimer-=dt;if(autoUpTimer<=0){autoUpTimer=3;doAutoUpgrade()}
      if(G.cb.strTimer>0)G.cb.strTimer-=dt;
      if(G.cb.announce&&G.cb.announce.timer>0)G.cb.announce.timer-=raw*G.spd;
      renderCombat();uH();
    }
  }catch(err){console.error('ERR:',err)}
  requestAnimationFrame(gameLoop);
}
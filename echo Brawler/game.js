// ================================================================
// ECHO BRAWL — You vs You
// Beat 'em up roguelike com mecânica de echo
// ================================================================
(()=>{
'use strict';

// ================================================================
// CONFIGURAÇÃO
// ================================================================
const W=480,H=270,GROUND_Y=218,GRAVITY=0.55,MAX_FALL=10;
const ARENA_L=24,ARENA_R=456;
const FPS=60,FRAME_MS=1000/FPS;

const C={
  bg1:'#0e0818',bg2:'#16102a',ground:'#1c1538',groundLine:'#2e2650',
  player:'#4ecdc4',playerDk:'#2d8f89',playerDk2:'#1a5c57',
  grunt:'#7ec850',gruntDk:'#5a9630',
  brute:'#e84040',bruteDk:'#a82020',
  dash:'#5090e8',dashDk:'#3060b0',
  shield:'#e8c840',shieldDk:'#a89020',
  echo:'#c050f0',echoDk:'#8020b0',echoGlow:'rgba(192,80,240,0.25)',
  ui:'#ffd93d',uiDk:'#b09020',
  hp:'#ff3838',hpBg:'#301010',
  sp:'#38c8ff',spBg:'#102030',
  dmg:'#ff4444',heal:'#44ff44',combo:'#ffd93d',
  white:'#ffffff',black:'#000000',
  cardBg:'rgba(20,14,40,0.92)',cardBorder:'#3a2e60'
};

const POWERUPS=[
  {id:'power',name:'POWER FIST',desc:'+30% ATK',icon:'!',color:'#ff6060',fn:p=>{p.atkM*=1.3}},
  {id:'speed',name:'SWIFT FEET',desc:'+25% SPD',icon:'»',color:'#60ff60',fn:p=>{p.spdM*=1.25}},
  {id:'hpup',name:'IRON SKIN',desc:'+50 HP',icon:'+',color:'#ff9040',fn:p=>{p.maxHp+=50;p.hp=Math.min(p.hp+50,p.maxHp)}},
  {id:'vamp',name:'VAMPIRE',desc:'Heal 15% of dmg',icon:'V',color:'#ff40a0',fn:p=>{p.vampire+=0.15}},
  {id:'thorns',name:'THORNS',desc:'Reflect 20% dmg',icon:'†',color:'#a0ff40',fn:p=>{p.thorns+=0.2}},
  {id:'crit',name:'CRITICAL EYE',desc:'25% crit chance',icon:'★',color:'#ffd040',fn:p=>{p.critCh+=0.25}},
  {id:'fdodge',name:'QUICK DODGE',desc:'-35% dodge CD',icon:'~',color:'#40d0ff',fn:p=>{p.dodgeCdM*=0.65}},
  {id:'burn',name:'FIRE FIST',desc:'40% burn on hit',icon:'f',color:'#ff8020',fn:p=>{p.burnCh+=0.4}},
  {id:'regen',name:'REGEN',desc:'Slow heal over time',icon:'r',color:'#40ff90',fn:p=>{p.regen+=0.4}},
  {id:'combo',name:'COMBO KING',desc:'+50% combo bonus',icon:'C',color:'#e040ff',fn:p=>{p.comboM*=1.5}},
];

const ARENA_THEMES=[
  {bg1:'#0e0818',bg2:'#16102a',ground:'#1c1538',line:'#2e2650',name:'VOID'},
  {bg1:'#180808',bg2:'#2a1010',ground:'#381515',line:'#502020',name:'LAVA'},
  {bg1:'#081818',bg2:'#102828',ground:'#153838',line:'#205050',name:'ICE'},
  {bg1:'#081808',bg2:'#102a10',ground:'#153815',line:'#205020',name:'FOREST'},
  {bg1:'#181808',bg2:'#2a2a10',ground:'#383815',line:'#505020',name:'SAND'},
  {bg1:'#100818',bg2:'#1a1028',ground:'#281538',line:'#3a2050',name:'SHADOW'},
  {bg1:'#140a1e',bg2:'#1e1430',ground:'#281e42',line:'#3a2e58',name:'ECHO CHAMBER'},
];

// ================================================================
// ESTADO DO JOGO
// ================================================================
let canvas,ctx;
let state='menu';
let stateTimer=0;
let subState='';

let player=null;
let enemies=[];
let echoEntity=null;
let particles=[];
let dmgNumbers=[];
let floatingTexts=[];

let echoLog=[];
let savedEcho=null;
let difficulty=1;
let arenaNum=0;
let score=0;
let combo=0;
let maxCombo=0;
let comboTimer=0;
let totalKills=0;
let totalDmgTaken=0;
let runTime=0;

let shakeX=0,shakeY=0,shakeAmt=0;
let hitPauseFrames=0;
let flashAlpha=0;
let menuParticles=[];
let selectOptions=[];
let selectedOption=0;

let isMobile=false;
let showControlsHint=true;
let titlePulse=0;

// ================================================================
// SETUP CANVAS
// ================================================================
function initCanvas(){
  canvas=document.getElementById('game');
  ctx=canvas.getContext('2d');
  canvas.width=W;
  canvas.height=H;
  resizeCanvas();
  window.addEventListener('resize',resizeCanvas);
}

function resizeCanvas(){
  const s=Math.min(window.innerWidth/W,window.innerHeight/H);
  canvas.style.width=(W*s)+'px';
  canvas.style.height=(H*s)+'px';
}

// ================================================================
// ÁUDIO (Web Audio API — procedural)
// ================================================================
let audioCtx=null;
let masterGain=null;

function initAudio(){
  if(audioCtx)return;
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    masterGain=audioCtx.createGain();
    masterGain.gain.value=0.3;
    masterGain.connect(audioCtx.destination);
  }catch(e){}
}

function sfx(type,vol){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  const v=(vol||1)*0.35;
  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  o.connect(g);g.connect(masterGain);
  switch(type){
    case'light':
      o.type='square';o.frequency.setValueAtTime(280,t);
      o.frequency.exponentialRampToValueAtTime(180,t+0.06);
      g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
      o.start(t);o.stop(t+0.08);break;
    case'heavy':
      o.type='sawtooth';o.frequency.setValueAtTime(120,t);
      o.frequency.exponentialRampToValueAtTime(60,t+0.15);
      g.gain.setValueAtTime(v*1.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
      o.start(t);o.stop(t+0.18);break;
    case'hit':
      o.type='square';o.frequency.setValueAtTime(400+Math.random()*200,t);
      g.gain.setValueAtTime(v*0.8,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.06);
      o.start(t);o.stop(t+0.06);break;
    case'crit':
      o.type='sawtooth';o.frequency.setValueAtTime(600,t);
      o.frequency.exponentialRampToValueAtTime(200,t+0.12);
      g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.15);
      o.start(t);o.stop(t+0.15);break;
    case'dodge':
      o.type='sine';o.frequency.setValueAtTime(300,t);
      o.frequency.exponentialRampToValueAtTime(600,t+0.1);
      g.gain.setValueAtTime(v*0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
      o.start(t);o.stop(t+0.12);break;
    case'special':
      o.type='sawtooth';o.frequency.setValueAtTime(200,t);
      o.frequency.linearRampToValueAtTime(800,t+0.2);
      o.frequency.linearRampToValueAtTime(100,t+0.4);
      g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);
      o.start(t);o.stop(t+0.45);break;
    case'select':
      o.type='sine';o.frequency.setValueAtTime(440,t);
      o.frequency.setValueAtTime(660,t+0.05);
      g.gain.setValueAtTime(v*0.4,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.12);
      o.start(t);o.stop(t+0.12);break;
    case'death':
      o.type='sawtooth';o.frequency.setValueAtTime(300,t);
      o.frequency.exponentialRampToValueAtTime(40,t+0.5);
      g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.55);
      o.start(t);o.stop(t+0.55);break;
    case'arena':
      o.type='sine';o.frequency.setValueAtTime(330,t);
      o.frequency.setValueAtTime(440,t+0.1);
      o.frequency.setValueAtTime(550,t+0.2);
      g.gain.setValueAtTime(v*0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
      o.start(t);o.stop(t+0.35);break;
    case'powerup':
      o.type='sine';o.frequency.setValueAtTime(400,t);
      o.frequency.linearRampToValueAtTime(800,t+0.15);
      g.gain.setValueAtTime(v*0.5,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.25);
      o.start(t);o.stop(t+0.25);break;
    case'echo_intro':
      o.type='sawtooth';o.frequency.setValueAtTime(80,t);
      o.frequency.linearRampToValueAtTime(200,t+0.8);
      g.gain.setValueAtTime(v*0.6,t);g.gain.exponentialRampToValueAtTime(0.001,t+1.0);
      o.start(t);o.stop(t+1.0);break;
  }
}

function noise(vol,dur){
  if(!audioCtx)return;
  const t=audioCtx.currentTime;
  const bufSize=audioCtx.sampleRate*dur;
  const buf=audioCtx.createBuffer(1,bufSize,audioCtx.sampleRate);
  const data=buf.getChannelData(0);
  for(let i=0;i<bufSize;i++)data[i]=(Math.random()*2-1);
  const src=audioCtx.createBufferSource();
  src.buffer=buf;
  const g=audioCtx.createGain();
  g.gain.setValueAtTime((vol||1)*0.15,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  src.connect(g);g.connect(masterGain);
  src.start(t);src.stop(t+dur);
}

// ================================================================
// INPUT (Teclado + Touch)
// ================================================================
const keys={};
const touch={};

function initInput(){
  window.addEventListener('keydown',e=>{
    keys[e.code]=true;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','KeyJ','KeyK','KeyL','Escape'].includes(e.code))e.preventDefault();
    if(state==='menu'||state==='gameover'||state==='leaderboard'){
      if(e.code==='Space'||e.code==='Enter'||e.code==='KeyJ'){
        handleConfirm();
      }
    }
    if(state==='powerup'){
      if(e.code==='ArrowLeft'||e.code==='KeyA'){selectedOption=Math.max(0,selectedOption-1);sfx('select')}
      if(e.code==='ArrowRight'||e.code==='KeyD'){selectedOption=Math.min(selectOptions.length-1,selectedOption+1);sfx('select')}
      if(e.code==='Space'||e.code==='Enter'||e.code==='KeyJ'){selectPowerup(selectOptions[selectedOption])}
    }
    if(state==='leaderboard'||state==='gameover'){
      if(e.code==='Escape'||e.code==='KeyM'){state='menu';stateTimer=0}
    }
  });
  window.addEventListener('keyup',e=>{keys[e.code]=false});

  // Touch
  const el=canvas;
  el.addEventListener('touchstart',onTouchStart,{passive:false});
  el.addEventListener('touchmove',onTouchMove,{passive:false});
  el.addEventListener('touchend',onTouchEnd,{passive:false});
  el.addEventListener('touchcancel',onTouchEnd,{passive:false});

  // Detect mobile
  isMobile=('ontouchstart' in window)||navigator.maxTouchPoints>0;
}

function getCanvasPos(cx,cy){
  const r=canvas.getBoundingClientRect();
  return{x:(cx-r.left)/r.width*W,y:(cy-r.top)/r.height*H};
}

function onTouchStart(e){
  e.preventDefault();
  initAudio();
  for(const t of e.changedTouches){
    const p=getCanvasPos(t.clientX,t.clientY);
    touch[t.identifier]={x:p.x,y:p.y,sx:p.x,sy:p.y,zone:''};
    if(state==='menu'||state==='gameover'||state==='leaderboard'){
      handleConfirm();
      touch[t.identifier].zone='ui';
      continue;
    }
    if(state==='powerup'){
      // Check which card was tapped
      for(let i=0;i<selectOptions.length;i++){
        const cx=W/2+(i-1)*120;
        const cy=H/2+10;
        if(Math.abs(p.x-cx)<50&&Math.abs(p.y-cy)<50){
          selectedOption=i;
          selectPowerup(selectOptions[i]);
          touch[t.identifier].zone='ui';
          continue;
        }
      }
      continue;
    }
    if(p.x<W*0.38){
      touch[t.identifier].zone='joystick';
    }else if(p.x>W*0.62){
      if(p.y<H*0.55)touch[t.identifier].zone='btn_special';
      else if(p.x>W*0.78)touch[t.identifier].zone='btn_heavy';
      else touch[t.identifier].zone='btn_light';
    }else{
      touch[t.identifier].zone='btn_dodge';
    }
  }
}

function onTouchMove(e){
  e.preventDefault();
  for(const t of e.changedTouches){
    if(!touch[t.identifier])continue;
    const p=getCanvasPos(t.clientX,t.clientY);
    touch[t.identifier].x=p.x;
    touch[t.identifier].y=p.y;
  }
}

function onTouchEnd(e){
  e.preventDefault();
  for(const t of e.changedTouches){
    if(touch[t.identifier]){
      if(touch[t.identifier].zone==='btn_light')touch._lightReleased=true;
      if(touch[t.identifier].zone==='btn_heavy')touch._heavyReleased=true;
      if(touch[t.identifier].zone==='btn_special')touch._specialReleased=true;
      if(touch[t.identifier].zone==='btn_dodge')touch._dodgeReleased=true;
    }
    delete touch[t.identifier];
  }
}

function getTouchDir(){
  for(const id in touch){
    const t=touch[id];
    if(t.zone==='joystick'){
      const dx=t.x-t.sx,dy=t.y-t.sy;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d>8)return{x:dx/d,y:dy/d};
      return{x:0,y:0};
    }
  }
  return{x:0,y:0};
}

function isTouchBtn(name){
  const zone='btn_'+name;
  for(const id in touch){if(touch[id].zone===zone)return true}
  return false;
}

function wasTouchBtn(name){
  const key='_'+name+'Released';
  if(touch[key]){touch[key]=false;return true}
  return false;
}

function getInput(){
  const td=getTouchDir();
  const left=keys.ArrowLeft||keys.KeyA||td.x<-0.3;
  const right=keys.ArrowRight||keys.KeyD||td.x>0.3;
  const up=keys.ArrowUp||keys.KeyW||td.y<-0.3;
  const down=keys.ArrowDown||keys.KeyS||td.y>0.3;
  const light=keys.KeyJ||isTouchBtn('light');
  const heavy=keys.KeyK||isTouchBtn('heavy');
  const dodge=keys.KeyL||isTouchBtn('dodge');
  const special=keys.Space||isTouchBtn('special');
  return{left,right,up,down,light,heavy,dodge,special};
}

// Previos frame input for "just pressed" detection
let prevInput={light:false,heavy:false,dodge:false,special:false};
function justPressed(inp,key){
  return inp[key]&&!prevInput[key];
}

// ================================================================
// UTILIDADES
// ================================================================
function lerp(a,b,t){return a+(b-a)*t}
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function rng(min,max){return Math.random()*(max-min)+min}
function rngInt(min,max){return Math.floor(rng(min,max+1))}
function rngPick(arr){return arr[rngInt(0,arr.length-1)]}
function dist(a,b){return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2)}
function rectOverlap(a,b){
  return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
}

// ================================================================
// PARTÍCULAS
// ================================================================
function spawnP(x,y,color,count,speed,life){
  for(let i=0;i<count;i++){
    const angle=rng(0,Math.PI*2);
    const spd=rng(speed*0.3,speed);
    particles.push({x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd-life*0.3,
      life:life+rng(0,life*0.3),maxLife:life*1.3,color,size:rng(1,3)});
  }
}

function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;
    p.life--;p.size*=0.98;
    if(p.life<=0)particles.splice(i,1);
  }
}

function drawParticles(){
  for(const p of particles){
    const a=clamp(p.life/p.maxLife,0,1);
    ctx.globalAlpha=a;
    ctx.fillStyle=p.color;
    ctx.fillRect(Math.round(p.x-p.size/2),Math.round(p.y-p.size/2),Math.ceil(p.size),Math.ceil(p.size));
  }
  ctx.globalAlpha=1;
}

// ================================================================
// NÚMEROS DE DANO
// ================================================================
function spawnDmg(x,y,val,color){
  const text=val>0?'-'+val:'+'+(-val);
  dmgNumbers.push({x:x+rng(-8,8),y:y-10,vy:-1.5,text,color,life:50,maxLife:50,size:val>=30?2:1});
}

function updateDmgNums(){
  for(let i=dmgNumbers.length-1;i>=0;i--){
    const d=dmgNumbers[i];
    d.y+=d.vy;d.vy*=0.97;d.life--;
    if(d.life<=0)dmgNumbers.splice(i,1);
  }
}

function drawDmgNums(){
  for(const d of dmgNumbers){
    const a=clamp(d.life/d.maxLife,0,1);
    ctx.globalAlpha=a;
    ctx.fillStyle=d.color;
    const s=d.size;
    drawText(d.text,Math.round(d.x),Math.round(d.y),s,'#000',1);
    drawText(d.text,Math.round(d.x)-1,Math.round(d.y)-1,s,d.color,1);
  }
  ctx.globalAlpha=1;
}

// Floating text (combo, arena clear, etc)
function spawnFloat(x,y,text,color,size){
  floatingTexts.push({x,y,vy:-0.8,text,color,size:size||2,life:80,maxLife:80});
}

function updateFloats(){
  for(let i=floatingTexts.length-1;i>=0;i--){
    const f=floatingTexts[i];
    f.y+=f.vy;f.vy*=0.98;f.life--;
    if(f.life<=0)floatingTexts.splice(i,1);
  }
}

function drawFloats(){
  for(const f of floatingTexts){
    const a=clamp(f.life/f.maxLife,0,1);
    ctx.globalAlpha=a;
    drawText(f.text,Math.round(f.x),Math.round(f.y),f.size,'#000',1);
    drawText(f.text,Math.round(f.x)-1,Math.round(f.y)-1,f.size,f.color,1);
  }
  ctx.globalAlpha=1;
}

// ================================================================
// EFEITOS DE TELA
// ================================================================
function doShake(amt){shakeAmt=Math.max(shakeAmt,amt)}
function doFlash(a){flashAlpha=Math.max(flashAlpha,a)}
function doHitPause(frames){hitPauseFrames=Math.max(hitPauseFrames,frames)}

function updateEffects(){
  if(shakeAmt>0.5){
    shakeX=rng(-shakeAmt,shakeAmt);
    shakeY=rng(-shakeAmt,shakeAmt);
    shakeAmt*=0.8;
  }else{shakeX=0;shakeY=0;shakeAmt=0}
  if(flashAlpha>0.01)flashAlpha*=0.85;else flashAlpha=0;
  if(hitPauseFrames>0)hitPauseFrames--;
}

// ================================================================
// TEXTO PIXEL
// ================================================================
// Mini fonte 5x7 simplificada
const FONT={
  A:[0x7C,0x12,0x11,0x12,0x7C],B:[0x7F,0x49,0x49,0x49,0x36],C:[0x3E,0x41,0x41,0x41,0x22],
  D:[0x7F,0x41,0x41,0x41,0x3E],E:[0x7F,0x49,0x49,0x49,0x41],F:[0x7F,0x09,0x09,0x09,0x01],
  G:[0x3E,0x41,0x49,0x49,0x7A],H:[0x7F,0x08,0x08,0x08,0x7F],I:[0x00,0x41,0x7F,0x41,0x00],
  J:[0x20,0x40,0x41,0x3F,0x01],K:[0x7F,0x08,0x14,0x22,0x41],L:[0x7F,0x40,0x40,0x40,0x40],
  M:[0x7F,0x02,0x0C,0x02,0x7F],N:[0x7F,0x04,0x08,0x10,0x7F],O:[0x3E,0x41,0x41,0x41,0x3E],
  P:[0x7F,0x09,0x09,0x09,0x06],Q:[0x3E,0x41,0x51,0x21,0x5E],R:[0x7F,0x09,0x19,0x29,0x46],
  S:[0x46,0x49,0x49,0x49,0x31],T:[0x01,0x01,0x7F,0x01,0x01],U:[0x3F,0x40,0x40,0x40,0x3F],
  V:[0x1F,0x20,0x40,0x20,0x1F],W:[0x3F,0x40,0x38,0x40,0x3F],X:[0x63,0x14,0x08,0x14,0x63],
  Y:[0x07,0x08,0x70,0x08,0x07],Z:[0x61,0x51,0x49,0x45,0x43],
  '0':[0x3E,0x51,0x49,0x45,0x3E],'1':[0x00,0x42,0x7F,0x40,0x00],'2':[0x42,0x61,0x51,0x49,0x46],
  '3':[0x21,0x41,0x45,0x4B,0x31],'4':[0x18,0x14,0x12,0x7F,0x10],'5':[0x27,0x45,0x45,0x45,0x39],
  '6':[0x3C,0x4A,0x49,0x49,0x30],'7':[0x01,0x71,0x09,0x05,0x03],'8':[0x36,0x49,0x49,0x49,0x36],
  '9':[0x06,0x49,0x49,0x29,0x1E],
  '!':[0x00,0x00,0x6F,0x00,0x00],':':[0x00,0x36,0x36,0x00,0x00],
  '-':[0x08,0x08,0x08,0x08,0x08],'.':[0x00,0x40,0x00,0x00,0x00],
  '+':[0x08,0x08,0x3E,0x08,0x08],'%':[0x23,0x13,0x08,0x64,0x62],
  '/':[0x20,0x10,0x08,0x04,0x02],'(':[0x00,0x3E,0x41,0x00,0x00],')':[0x00,0x41,0x3E,0x00,0x00],
  '?':[0x02,0x01,0x51,0x09,0x06],'\'':[0x00,0x00,0x07,0x00,0x00],
  ' ':[0x00,0x00,0x00,0x00,0x00],
  '★':[0x00,0x08,0x1C,0x3E,0x7F],'†':[0x08,0x3E,0x08,0x1C,0x08],
  '»':[0x00,0x24,0x12,0x24,0x00],'~':[0x04,0x02,0x04,0x08,0x04],
};

function drawChar_$(ch,x,y,scale,color){
  const d=FONT[ch];
  if(!d)return;
  ctx.fillStyle=color;
  for(let col=0;col<5;col++){
    for(let row=0;row<7;row++){
      if(d[col]&(1<<row)){
        ctx.fillRect(x+col*scale,y+row*scale,scale,scale);
      }
    }
  }
}

function drawText(str,x,y,scale,shadow,align){
  str=String(str).toUpperCase();
  const charW=6*scale;
  let totalW=str.length*charW;
  let sx=x;
  if(align===0.5)sx=x-totalW/2;
  else if(align===1)sx=x-totalW;
  if(shadow){
    for(let i=0;i<str.length;i++){
      drawChar_$(str[i],sx+i*charW+scale,y+scale,scale,'#000');
    }
  }
  for(let i=0;i<str.length;i++){
    drawChar_$(str[i],sx+i*charW,y,scale,C.white);
  }
}

function drawTextCol(str,x,y,scale,shadow,color,align){
  str=String(str).toUpperCase();
  const charW=6*scale;
  let totalW=str.length*charW;
  let sx=x;
  if(align===0.5)sx=x-totalW/2;
  else if(align===1)sx=x-totalW;
  if(shadow){
    for(let i=0;i<str.length;i++){
      drawChar_$(str[i],sx+i*charW+scale,y+scale,scale,'#000');
    }
  }
  for(let i=0;i<str.length;i++){
    drawChar_$(str[i],sx+i*charW,y,scale,color);
  }
}

// ================================================================
// DESENHO DE PERSONAGENS (pixel art procedural)
// ================================================================
function drawEntity(e,colors,flashWhite){
  const{x,y,state:st,frame:f,facing}=e;
  ctx.save();
  ctx.translate(Math.round(x+shakeX),Math.round(y+shakeY));
  if(facing<0)ctx.scale(-1,1);
  if(e.scale)ctx.scale(e.scale,e.scale);

  const{hair,skin,body,bodyDk,legs,accent}=colors;
  let bob=0,legL=0,legR=0,armX=0,armY=0,lean=0;
  let showArm=true,armExtended=false;

  switch(st){
    case'idle':bob=Math.sin(f*0.07)*1.5;break;
    case'walk':
      bob=Math.abs(Math.sin(f*0.18))*2;
      legL=Math.sin(f*0.18)*5;
      legR=-legL;
      break;
    case'light1':
      if(f<5){armX=f*2.5;armY=-f*1}
      else if(f<10){armX=12.5;armY=-5;armExtended=true}
      else{armX=12.5-(f-10)*2.5;armY=-5+(f-10)}
      lean=3;break;
    case'light2':
      if(f<6){armX=f*2;armY=-f*0.8}
      else if(f<12){armX=12;armY=-5;armExtended=true}
      else{armX=12-(f-12)*2;armY=-5+(f-12)}
      lean=4;break;
    case'light3':
      if(f<8){armX=f*1.5;armY=-f*1.2}
      else if(f<16){armX=12;armY=-10;armExtended=true}
      else{armX=12-(f-16)*1.5;armY=-10+(f-16)*1.2}
      lean=6;break;
    case'heavy':
      if(f<15){armY=-f*0.3}
      else if(f<22){armX=(f-15)*3.5;armY=-5;armExtended=true}
      else{armX=24.5-(f-22)*3;armY=-5+(f-22)*0.7}
      lean=8;break;
    case'dodge':
      bob=-2;lean=-15;
      ctx.globalAlpha=0.6+Math.sin(f*0.8)*0.2;break;
    case'hit':
      lean=-5+Math.sin(f*0.6)*4;
      bob=Math.sin(f*0.4)*2;break;
    case'death':
      lean=-20*f*0.1;bob=f*0.5;
      ctx.globalAlpha=Math.max(0,1-f*0.03);break;
    case'special':
      bob=-3;lean=0;break;
  }

  // Legs
  ctx.fillStyle=flashWhite?C.white:legs;
  ctx.fillRect(-4+legL,8+bob,5,10);
  ctx.fillRect(3+legR,8+bob,5,10);

  // Body
  ctx.fillStyle=flashWhite?C.white:body;
  ctx.fillRect(-6+lean,-2+bob,16,12);
  ctx.fillStyle=flashWhite?C.white:bodyDk;
  ctx.fillRect(-6+lean,6+bob,16,4);

  // Back arm
  ctx.fillStyle=flashWhite?C.white:skin;
  ctx.fillRect(-9,0+bob,4,10);

  // Front arm
  if(showArm){
    ctx.fillStyle=flashWhite?C.white:accent||skin;
    ctx.fillRect(8+armX,0+bob+armY,4,armExtended?12:10);
    if(armExtended){
      ctx.fillStyle=flashWhite?C.white:skin;
      ctx.fillRect(8+armX,10+bob+armY,4,4);
    }
  }

  // Head
  ctx.fillStyle=flashWhite?C.white:hair;
  ctx.fillRect(-5,-14+bob,14,13);
  ctx.fillStyle=flashWhite?C.white:skin;
  ctx.fillRect(-3,-12+bob,10,9);

  // Eyes
  if(st!=='death'){
    ctx.fillStyle=C.white;
    ctx.fillRect(0,-10+bob,3,3);
    ctx.fillRect(5,-10+bob,3,3);
    ctx.fillStyle=C.black;
    ctx.fillRect(1,-9+bob,2,2);
    ctx.fillRect(6,-9+bob,2,2);
  }

  // Mouth
  if(st==='hit'||st==='death'){
    ctx.fillStyle=C.black;
    ctx.fillRect(2,-5+bob,4,2);
  }

  ctx.restore();
}

const PLAYER_COLORS={
  hair:'#2d2d3d',skin:'#f0c8a0',body:'#4ecdc4',bodyDk:'#2d8f89',legs:'#1a5c57',accent:'#ff6b6b'
};

const ENEMY_COLORS={
  grunt:{hair:'#3a5a20',skin:'#c8e8a0',body:'#7ec850',bodyDk:'#5a9630',legs:'#3a6020'},
  brute:{hair:'#601010',skin:'#e8a0a0',body:'#e84040',bodyDk:'#a82020',legs:'#601010'},
  dash:{hair:'#1a3060',skin:'#a0c0e8',body:'#5090e8',bodyDk:'#3060b0',legs:'#1a3060'},
  shield:{hair:'#605010',skin:'#e8d8a0',body:'#e8c840',bodyDk:'#a89020',legs:'#605010'}
};

const ECHO_COLORS={
  hair:'#3a1050',skin:'#d0a0e8',body:'#c050f0',bodyDk:'#8020b0',legs:'#4a1060',accent:'#e080ff'
};

// Shield visual
function drawShield(x,y,facing){
  ctx.fillStyle='rgba(232,200,64,0.6)';
  ctx.fillRect(facing>0?x+8:x-8,y-16,6,28);
  ctx.fillStyle='rgba(255,255,200,0.3)';
  ctx.fillRect(facing>0?x+10:x-6,y-14,2,24);
}

// Echo glow
function drawEchoGlow(x,y){
  ctx.fillStyle=C.echoGlow;
  ctx.beginPath();
  ctx.arc(x,y-5,24,0,Math.PI*2);
  ctx.fill();
}

// ================================================================
// CRIAÇÃO DE ENTIDADES
// ================================================================
function makePlayer(){
  return{
    x:W/2,y:GROUND_Y,state:'idle',frame:0,facing:1,
    vx:0,vy:0,
    hp:200,maxHp:200,
    atk:15,atkM:1,spdM:1,spd:2.2,
    sp:0,maxSp:100,
    vampire:0,thorns:0,critCh:0,dodgeCdM:1,burnCh:0,regen:0,comboM:1,
    powerups:[],
    dodgeCd:0,dodgeTimer:0,
    lightChain:0,chainTimer:0,
    heavyCharge:0,
    hitTimer:0,invTimer:0,
    attackHitbox:null,
    specialTimer:0,
    burn:{active:false,timer:0,dmg:0},
    alive:true,
    isPlayer:true,
    scale:1
  };
}

function makeEnemy(type,x,y,diffMod){
  const base={
    grunt:{hp:40,atk:10,spd:1.0,range:22,cd:120,score:100},
    brute:{hp:100,atk:25,spd:0.5,range:28,cd:180,score:300},
    dash:{hp:30,atk:15,spd:0.8,range:18,cd:150,score:200},
    shield:{hp:60,atk:12,spd:0.7,range:22,cd:120,score:250}
  }[type];
  const dm=diffMod||{hpMult:1,spdMult:1,dmgMult:1};
  return{
    x,y,state:'idle',frame:0,facing:-1,
    vx:0,vy:0,
    hp:Math.round(base.hp*dm.hpMult),maxHp:Math.round(base.hp*dm.hpMult),
    atk:Math.round(base.atk*dm.dmgMult),spd:base.spd*dm.spdMult,
    range:base.range,cd:base.cd,cdTimer:60,
    score:base.score,type,
    hitTimer:0,stunTimer:0,
    dashTimer:0,dashState:'idle',
    alive:true,isPlayer:false,
    shieldActive:type==='shield',
    attackHitbox:null,
    burn:{active:false,timer:0,dmg:0},
    scale:1
  };
}

function makeEcho(){
  if(!savedEcho)return null;
  return{
    x:W/2,y:GROUND_Y,state:'idle',frame:0,facing:-1,
    vx:0,vy:0,
    hp:savedEcho.maxHp,maxHp:savedEcho.maxHp,
    atk:savedEcho.atk,atkM:1,spdM:1,spd:savedEcho.spd,
    sp:0,maxSp:100,
    vampire:0,thorns:0,critCh:0,dodgeCdM:1,burnCh:0,regen:0,comboM:1,
    powerups:savedEcho.powerups||[],
    dodgeCd:0,dodgeTimer:0,
    lightChain:0,chainTimer:0,
    hitTimer:0,invTimer:0,
    attackHitbox:null,
    specialTimer:0,
    burn:{active:false,timer:0,dmg:0},
    alive:true,
    isPlayer:false,isEcho:true,
    playbackFrame:0,
    scale:1
  };
}

// ================================================================
// ARENA / WAVES
// ================================================================
let arenaWaves=[];
let waveIndex=0;
let waveTimer=0;
let waveCleared=true;
let arenaComplete=false;
let arenaState='intro';
let arenaTimer=0;

function getDiffMod(){
  return{
    hpMult:1+difficulty*0.12,
    spdMult:1+difficulty*0.04,
    dmgMult:1+difficulty*0.1,
    countBonus:Math.floor(difficulty*0.4)
  };
}

function generateWaves(an){
  const dm=getDiffMod();
  const waves=[];
  const baseCount=2+Math.floor(an*0.5);

  for(let w=0;w<2+Math.floor(an/3);w++){
    const wave=[];
    const count=baseCount+w+dm.countBonus;

    for(let i=0;i<count;i++){
      let type='grunt';
      const r=Math.random();
      if(an>=1&&r<0.2)type='brute';
      if(an>=2&&r<0.35&&r>=0.2)type='dash';
      if(an>=3&&r<0.45&&r>=0.35)type='shield';
      if(an>=5&&r<0.55&&r>=0.45)type=rngPick(['brute','dash','shield']);

      const ex=rngInt(ARENA_L+20,ARENA_R-20);
      wave.push(makeEnemy(type,ex,GROUND_Y,dm));
    }
    waves.push(wave);
  }
  return waves;
}

function startArena(an){
  arenaNum=an;
  arenaWaves=generateWaves(an);
  waveIndex=0;
  waveTimer=0;
  waveCleared=true;
  arenaComplete=false;
  arenaState='intro';
  arenaTimer=120;
  sfx('arena');
}

function updateArena(){
  if(arenaState==='intro'){
    arenaTimer--;
    if(arenaTimer<=0){
      arenaState='combat';
      spawnWave();
    }
    return;
  }
  if(arenaState!=='combat')return;

  // Check wave cleared
  const allDead=enemies.every(e=>!e.alive);
  if(allDead){
    waveIndex++;
    if(waveIndex>=arenaWaves.length){
      arenaComplete=true;
      arenaState='done';
      score+=500;
      spawnFloat(W/2,H/2-30,'ARENA CLEAR! +500',C.ui,3);
      sfx('arena');
      return;
    }
    waveTimer++;
    if(waveTimer>90){
      waveTimer=0;
      spawnWave();
    }
  }
}

function spawnWave(){
  const wave=arenaWaves[waveIndex];
  if(!wave)return;
  for(const e of wave){
    e.alive=true;
    enemies.push(e);
  }
}

// ================================================================
// POWER-UP SYSTEM
// ================================================================
function offerPowerups(){
  const available=[...POWERUPS];
  selectOptions=[];
  for(let i=0;i<3&&available.length>0;i++){
    const idx=rngInt(0,available.length-1);
    selectOptions.push(available.splice(idx,1)[0]);
  }
  selectedOption=1;
  state='powerup';
  sfx('powerup');
}

function selectPowerup(pu){
  if(!pu)return;
  pu.fn(player);
  player.powerups.push(pu.id);
  score+=100;
  spawnFloat(W/2,H/2-60,'+'+pu.name,pu.color,2);
  sfx('select');

  if(arenaNum>=7){
    if(savedEcho){
      state='playing';
      subState='echo_intro';
      stateTimer=180;
      sfx('echo_intro');
    }else{
      endRun(true);
    }
  }else{
    state='playing';
    subState='next_arena';
    stateTimer=60;
  }
}

// ================================================================
// COMBAT SYSTEM
// ================================================================
function updateCombat(inp){
  if(hitPauseFrames>0)return;

  // Player
  updatePlayerEntity(player,inp);
  if(player.attackHitbox)checkAttackHits(player);

  // Enemies
  for(const e of enemies){
    if(!e.alive)continue;
    updateEnemyAI(e);
    if(e.attackHitbox)checkAttackHits(e);
  }

  // Echo
  if(echoEntity&&echoEntity.alive){
    updateEchoEntity();
    if(echoEntity.attackHitbox)checkAttackHits(echoEntity);
  }

  // Burn DOT
  updateBurn(player);
  for(const e of enemies)if(e.alive)updateBurn(e);
  if(echoEntity)updateBurn(echoEntity);
}

function updateBurn(e){
  if(!e.burn.active)return;
  e.burn.timer--;
  if(e.burn.timer%20===0){
    dealDmg(e,e.burn.dmg,null,true);
  }
  if(e.burn.timer<=0)e.burn.active=false;
}

function updatePlayerEntity(p,inp){
  p.frame++;
  if(p.hitTimer>0){p.hitTimer--;p.state='hit';if(p.hitTimer<=0)p.state='idle'}
  if(p.invTimer>0)p.invTimer--;
  if(p.dodgeCd>0)p.dodgeCd--;

  // Burn visual
  if(p.burn.active&&p.frame%8===0){
    spawnP(p.x+rng(-6,6),p.y-rng(10,20),'#ff6020',2,1.5,15);
  }

  // Regen
  if(p.regen>0&&p.frame%60===0&&p.hp<p.maxHp){
    p.hp=Math.min(p.maxHp,p.hp+p.regen);
    spawnDmg(p.x,p.y-20,-Math.round(p.regen),C.heal);
  }

  if(p.state==='dodge'){
    p.dodgeTimer--;
    p.invTimer=Math.max(p.invTimer,2);
    p.x+=p.vx;
    if(p.dodgeTimer<=0){p.state='idle';p.vx=0}
    return;
  }

  if(p.state.startsWith('light')){
    const chainNum=parseInt(p.state.charAt(5));
    const durations=[15,18,25];
    const dur=durations[chainNum-1]||15;
    if(p.frame>=dur){
      p.state='idle';p.lightChain=0;p.chainTimer=0;p.attackHitbox=null;
    }
    p.x+=p.vx*0.3;
    p.vx*=0.9;
    return;
  }

  if(p.state==='heavy'){
    if(p.frame>=35){p.state='idle';p.attackHitbox=null}
    p.vx*=0.9;
    return;
  }

  if(p.state==='special'){
    if(p.frame>=25){p.state='idle';p.attackHitbox=null}
    return;
  }

  // Chain timer
  if(p.chainTimer>0){p.chainTimer--;if(p.chainTimer<=0)p.lightChain=0}

  // Movement
  let moveX=0;
  if(inp.left)moveX=-1;
  if(inp.right)moveX=1;
  if(moveX!==0)p.facing=moveX;

  const spd=p.spd*p.spdM;
  p.vx=moveX*spd;
  p.x+=p.vx;
  p.x=clamp(p.x,ARENA_L+10,ARENA_R-10);

  if(moveX!==0){p.state='walk'}
  else{p.state='idle'}

  // Dodge
  if(justPressed(inp,'dodge')&&p.dodgeCd<=0&&p.state!=='hit'){
    p.state='dodge';
    p.dodgeTimer=18;
    p.dodgeCd=Math.round(60*p.dodgeCdM);
    p.vx=moveX!==0?-p.facing*5:-p.facing*5;
    sfx('dodge');
    spawnP(p.x,p.y-10,'#4ecdc4',5,2,15);
    return;
  }

  // Light attack
  if(justPressed(inp,'light')&&p.state!=='hit'){
    if(p.lightChain<3){
      p.lightChain++;
      p.state='light'+p.lightChain;
      p.frame=0;
      p.chainTimer=40;
      sfx('light');
      createHitbox(p,'light');
    }
    return;
  }

  // Heavy attack
  if(justPressed(inp,'heavy')&&p.state!=='hit'){
    p.state='heavy';
    p.frame=0;
    sfx('heavy');
    createHitbox(p,'heavy');
    return;
  }

  // Special
  if(justPressed(inp,'special')&&p.sp>=p.maxSp&&p.state!=='hit'){
    p.state='special';
    p.frame=0;
    p.sp=0;
    sfx('special');
    doShake(6);
    doFlash(0.4);
    createHitbox(p,'special');
    spawnP(p.x,p.y-10,C.sp,20,4,25);
    return;
  }
}

function createHitbox(e,type){
  const dir=e.facing;
  switch(type){
    case'light':
      e.attackHitbox={x:e.x+dir*12,y:e.y-16,w:18,h:16,
        dmg:Math.round(e.atk*(e.atkM||1)*(e.isPlayer?1:1)),
        active:true,dir,kb:2,type:'light',owner:e};
      break;
    case'heavy':
      e.attackHitbox={x:e.x+dir*14,y:e.y-20,w:24,h:24,
        dmg:Math.round((e.atk||15)*(e.atkM||1)*2.2),
        active:true,dir,kb:6,type:'heavy',owner:e};
      break;
    case'special':
      e.attackHitbox={x:e.x-30,y:e.y-30,w:60,h:40,
        dmg:Math.round((e.atk||15)*(e.atkM||1)*5),
        active:true,dir:0,kb:8,type:'special',owner:e};
      break;
    case'enemy':
      e.attackHitbox={x:e.x+dir*10,y:e.y-18,w:16,h:18,
        dmg:e.atk,active:true,dir,kb:3,type:'enemy',owner:e};
      break;
  }
}

function checkAttackHits(attacker){
  const hb=attacker.attackHitbox;
  if(!hb||!hb.active)return;

  const targets=attacker.isPlayer||attacker.isEcho?[...(attacker.isEcho?[player]:enemies.filter(e=>e.alive))]:[player];

  // Echo hits player, player hits enemies, enemies hit player
  if(attacker.isEcho) targets=[player];
  if(attacker.isPlayer){
    targets.length=0;
    for(const e of enemies)if(e.alive)targets.push(e);
    if(echoEntity&&echoEntity.alive)targets.push(echoEntity);
  }

  for(const t of targets){
    if(!t.alive)continue;
    if(t.invTimer>0)continue;
    const tBox={x:t.x-8,y:t.y-24,w:16,h:24};

    // Shield block
    if(t.shieldActive&&t.type==='shield'){
      const shieldBox={x:t.facing>0?t.x+6:t.x-14,y:t.y-20,w:8,h:24};
      if(rectOverlap(hb,shieldBox)){
        hb.active=false;
        spawnP(t.x+t.facing*12,t.y-10,'#e8c840',5,2,10);
        sfx('hit',0.3);
        return;
      }
    }

    if(rectOverlap(hb,tBox)){
      hb.active=false;
      let dmg=hb.dmg;
      let isCrit=false;

      // Critical hit (player only)
      if(attacker.isPlayer&&Math.random()<attacker.critCh){
        dmg=Math.round(dmg*2);
        isCrit=true;
        sfx('crit');
      }

      dealDmg(t,dmg,attacker,false,isCrit);

      // Knockback
      t.vx=hb.dir*hb.kb;
      t.x+=t.vx;
      t.x=clamp(t.x,ARENA_L+10,ARENA_R-10);

      // Hit pause
      doHitPause(hb.type==='heavy'?5:hb.type==='special'?7:3);
      doShake(hb.type==='heavy'?4:hb.type==='special'?7:2);

      // Particles
      const hitX=(hb.x+hb.w/2+t.x)/2;
      const hitY=hb.y+hb.h/2;
      spawnP(hitX,hitY,isCrit?C.ui:C.dmg,isCrit?12:6,hb.type==='heavy'?3:2,15);
      if(isCrit)spawnFloat(hitX,hitY-10,'CRIT!',C.ui,2);

      // Player special meter
      if(attacker.isPlayer){
        attacker.sp=Math.min(attacker.maxSp,attacker.sp+10);
      }

      // Vampire
      if(attacker.isPlayer&&attacker.vampire>0){
        const heal=Math.round(dmg*attacker.vampire);
        attacker.hp=Math.min(attacker.maxHp,attacker.hp+heal);
        if(heal>0)spawnDmg(attacker.x,attacker.y-20,-heal,C.heal);
      }

      // Thorns
      if(t.thorns>0&&attacker&&!attacker.isPlayer&&!attacker.isEcho){
        const reflect=Math.round(dmg*t.thorns);
        dealDmg(attacker,reflect,null,true);
      }

      // Burn
      if(attacker.isPlayer&&attacker.burnCh>0&&Math.random()<attacker.burnCh){
        t.burn={active:true,timer:120,dmg:Math.round(attacker.atk*attacker.atkM*0.2)};
        spawnP(t.x,t.y-15,'#ff6020',4,1.5,12);
      }

      // Combo
      if(attacker.isPlayer){
        combo++;
        comboTimer=180;
        if(combo>maxCombo)maxCombo=combo;
        const comboBonus=getComboMultiplier();
        score+=Math.round((hb.type==='heavy'?20:10)*comboBonus);
      }

      // Hit stun
      if(t.isPlayer||t.isEcho){
        t.hitTimer=10;
        t.state='hit';
        t.frame=0;
      }else{
        t.stunTimer=15;
        t.hitTimer=8;
        t.state='hit';
        t.frame=0;
      }

      sfx('hit');
    }
  }
}

function dealDmg(target,dmg,source,isBurn,isCrit){
  target.hp-=dmg;
  if(isBurn){
    spawnDmg(target.x,target.y,dmg,'#ff6020');
  }else if(isCrit){
    spawnDmg(target.x,target.y,dmg,C.ui);
  }else{
    spawnDmg(target.x,target.y,dmg,C.dmg);
  }

  if(target.hp<=0){
    target.hp=0;
    target.alive=false;
    target.state='death';
    target.frame=0;

    if(!target.isPlayer&&!target.isEcho){
      score+=target.score;
      totalKills++;
      spawnFloat(target.x,target.y-20,'+'+target.score,C.ui,2);
      sfx('death');
      spawnP(target.x,target.y-10,ENEMY_COLORS[target.type]?.body||C.dmg,15,3,25);
    }

    if(target.isPlayer){
      endRun(false);
    }
    if(target.isEcho){
      endRun(true);
    }
  }
}

function getComboMultiplier(){
  if(combo<5)return 1;
  if(combo<10)return 1.5;
  if(combo<20)return 2;
  if(combo<50)return 3;
  return 5;
}

// ================================================================
// ENEMY AI
// ================================================================
function updateEnemyAI(e){
  e.frame++;
  if(e.hitTimer>0){e.hitTimer--;return}
  if(e.stunTimer>0){e.stunTimer--;return}

  // Burn visual
  if(e.burn.active&&e.frame%8===0){
    spawnP(e.x+rng(-6,6),e.y-rng(10,20),'#ff6020',2,1.5,12);
  }

  const dx=player.x-e.x;
  const adx=Math.abs(dx);
  e.facing=dx>0?1:-1;

  switch(e.type){
    case'grunt':
      if(adx>e.range){
        e.x+=e.facing*e.spd;
        e.state='walk';
      }else{
        e.state='idle';
        e.cdTimer--;
        if(e.cdTimer<=0){
          e.state='light1';e.frame=0;e.cdTimer=e.cd;
          createHitbox(e,'enemy');
        }
      }
      break;

    case'brute':
      if(adx>e.range){
        e.x+=e.facing*e.spd;
        e.state='walk';
      }else{
        e.state='idle';
        e.cdTimer--;
        if(e.cdTimer<=0){
          e.state='heavy';e.frame=0;e.cdTimer=e.cd;
          createHitbox(e,'enemy');
          e.attackHitbox.dmg=e.atk;
          e.attackHitbox.w=28;
        }
      }
      break;

    case'dash':
      if(e.dashState==='idle'){
        if(adx>60){
          e.x+=e.facing*e.spd;
          e.state='walk';
        }else{
          e.state='idle';
        }
        e.cdTimer--;
        if(e.cdTimer<=0&&adx<200){
          e.dashState='dash';
          e.dashTimer=20;
          e.cdTimer=e.cd;
          sfx('dodge',0.5);
        }
      }else if(e.dashState==='dash'){
        e.x+=e.facing*4;
        e.state='walk';
        e.dashTimer--;
        spawnP(e.x,e.y-10,'#5090e8',1,1,8);
        if(adx<e.range){
          createHitbox(e,'enemy');
          e.attackHitbox.dmg=e.atk;
          e.dashState='retreat';
          e.dashTimer=25;
        }
        if(e.dashTimer<=0){e.dashState='retreat';e.dashTimer=25}
      }else if(e.dashState==='retreat'){
        e.x-=e.facing*1.5;
        e.state='walk';
        e.dashTimer--;
        if(e.dashTimer<=0)e.dashState='idle';
      }
      break;

    case'sield':
      e.shieldActive=adx>30;
      if(adx>e.range){
        e.x+=e.facing*e.spd;
        e.state='walk';
      }else{
        e.state='idle';
        e.cdTimer--;
        if(e.cdTimer<=0){
          e.state='light1';e.frame=0;e.cdTimer=e.cd;
          e.shieldActive=false;
          createHitbox(e,'enemy');
        }
      }
      break;
  }

  e.x=clamp(e.x,ARENA_L+10,ARENA_R-10);

  // Active hitbox lifetime
  if(e.attackHitbox){
    e.attackHitbox.x=e.x+e.facing*10;
    e.attackHitbox.y=e.y-18;
    if(e.frame>20)e.attackHitbox=null;
  }
}

// ================================================================
// ECHO SYSTEM
// ================================================================
function recordFrame(){
  if(!player||!player.alive)return;
  echoLog.push({
    x:player.x-GROUND_Y===0?player.x:player.x,
    relX:player.x-W/2,
    facing:player.facing,
    state:player.state,
    frame:player.frame
  });
}

function updateEchoEntity(){
  if(!echoEntity||!echoEntity.alive)return;
  const e=echoEntity;
  e.frame++;

  if(e.hitTimer>0){e.hitTimer--;e.state='hit';if(e.hitTimer<=0)e.state='idle'}
  if(e.invTimer>0)e.invTimer--;

  // Get recorded data
  const log=savedEcho.log;
  if(!log||log.length===0)return;

  const fi=e.playbackFrame%log.length;
  const rec=log[fi];
  e.playbackFrame++;

  // Mirror position
  const targetX=W-rec.x;
  e.x=lerp(e.x,targetX,0.15);
  e.x=clamp(e.x,ARENA_L+10,ARENA_R-10);

  // Mirror facing
  e.facing=-rec.facing;

  // Copy actions
  const wasAttacking=e.state.startsWith('light')||e.state==='heavy'||e.state==='special';
  const actionIsAttack=rec.state.startsWith('light')||rec.state==='heavy'||rec.state==='special';

  if(actionIsAttack&&!wasAttacking&&e.attackHitbox===null){
    e.state=rec.state;
    e.frame=0;
    createHitbox(e,rec.state.startsWith('light')?'light':rec.state);
  }

  // Update attack hitbox position
  if(e.attackHitbox){
    e.attackHitbox.x=e.x+e.facing*12;
    e.attackHitbox.y=e.y-16;
    if(e.frame>20)e.attackHitbox=null;
  }

  // Walk
  if(!actionIsAttack&&rec.state==='walk'){
    e.state='walk';
  }
  if(!actionIsAttack&&rec.state==='idle'){
    e.state='idle';
  }

  // Update burn
  if(e.burn.active&&e.frame%8===0){
    spawnP(e.x+rng(-6,6),e.y-rng(10,20),'#ff6020',2,1.5,12);
  }
}

// ================================================================
// DESENHO DO FUNDO
// ================================================================
function drawBackground(){
  const theme=ARENA_THEMES[Math.min(arenaNum,ARENA_THEMES.length-1)];
  const bg1=subState==='echo_intro'||subState==='echo_fight'?'#140a28':theme.bg1;
  const bg2=subState==='echo_intro'||subState==='echo_fight'?'#1e0e3a':theme.bg2;
  const grd=theme.ground;
  const line=theme.line;

  // Gradient background
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,bg1);
  grad.addColorStop(1,bg2);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // Background grid/lines for depth
  ctx.strokeStyle='rgba(255,255,255,0.03)';
  ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  }
  for(let y=0;y<H;y+=40){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }

  // Ground
  ctx.fillStyle=grd;
  ctx.fillRect(0,GROUND_Y+2,W,H-GROUND_Y);

  // Ground line
  ctx.fillStyle=line;
  ctx.fillRect(0,GROUND_Y,W,3);

  // Ground details
  ctx.fillStyle=line;
  for(let x=10;x<W;x+=30){
    ctx.fillRect(x,GROUND_Y+8,12,2);
  }
}

// ================================================================
// UI - MENU
// ================================================================
function drawMenu(){
  titlePulse+=0.03;

  // Background
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#0a0614');
  grad.addColorStop(1,'#140a28');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle='rgba(192,80,240,0.06)';
  ctx.lineWidth=1;
  for(let x=0;x<W;x+=30){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
  }
  for(let y=0;y<H;y+=30){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }

  // Menu particles
  if(stateTimer%4===0){
    menuParticles.push({x:rng(0,W),y:H+5,vy:rng(-1,-0.3),life:200,color:C.echo});
  }
  for(let i=menuParticles.length-1;i>=0;i--){
    const p=menuParticles[i];
    p.y+=p.vy;p.life--;
    if(p.life<=0)menuParticles.splice(i,1);
    else{
      ctx.globalAlpha=clamp(p.life/50,0,0.5);
      ctx.fillStyle=p.color;
      ctx.fillRect(p.x,p.y,2,2);
    }
  }
  ctx.globalAlpha=1;

  // Title
  const pulse=Math.sin(titlePulse)*0.15+1;
  const titleSize=Math.round(5*pulse);
  drawTextCol('ECHO BRAWL',W/2,60,titleSize,true,C.echo,0.5);

  // Subtitle
  drawText('YOU VS YOU',W/2,90,2,false,0.5);

  // Separator
  ctx.fillStyle=C.echo;
  ctx.globalAlpha=0.4;
  ctx.fillRect(W/2-80,108,160,2);
  ctx.globalAlpha=1;

  // How to play
  drawText('FIGHT THROUGH 7 ARENAS',W/2,125,1,false,0.5);
  drawText('THEN FACE YOUR ECHO',W/2,138,1,false,0.5);

  // Controls
  if(isMobile){
    drawText('JOYSTICK: MOVE',W/2,160,1,false,0.5);
    drawText('BTNS: ATTACK / HEAVY / DODGE',W/2,173,1,false,0.5);
  }else{
    drawText('WASD: MOVE   J: ATK   K: HEAVY',W/2,160,1,false,0.5);
    drawText('L: DODGE   SPACE: SPECIAL',W/2,173,1,false,0.5);
  }

  // Start prompt
  const blink=Math.sin(stateTimer*0.06)>0;
  if(blink){
    const txt=isMobile?'TAP TO START':'PRESS SPACE OR J TO START';
    drawTextCol(txt,W/2,210,2,false,C.ui,0.5);
  }

  // Leaderboard
  drawText('ESC - LEADERBOARD',W-10,H-15,1,false,1);

  // Version
  drawText('V1.0',10,H-15,1,false,0);

  // Echo label
  if(savedEcho){
    drawTextCol('ECHO READY',W/2,240,1,false,C.echo,0.5);
  }
}

// ================================================================
// UI - HUD
// ================================================================
function drawHUD(){
  if(!player)return;

  // HP bar
  const hpW=120,hpH=8,hpX=10,hpY=10;
  ctx.fillStyle=C.hpBg;ctx.fillRect(hpX,hpY,hpW,hpH);
  ctx.fillStyle=C.hp;ctx.fillRect(hpX,hpY,hpW*(player.hp/player.maxHp),hpH);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;
  ctx.strokeRect(hpX,hpY,hpW,hpH);
  drawText('HP',hpX-1,hpY-9,1,false,0);
  drawText(Math.ceil(player.hp)+'/'+player.maxHp,hpX+hpW+5,hpY-1,1,false,0);

  // SP bar
  const spY=hpY+hpH+4;
  ctx.fillStyle=C.spBg;ctx.fillRect(hpX,spY,hpW,hpH-2);
  ctx.fillStyle=C.sp;ctx.fillRect(hpX,spY,hpW*(player.sp/player.maxSp),hpH-2);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.strokeRect(hpX,spY,hpW,hpH-2);
  drawText('SP',hpX-1,spY-9,1,false,0);

  // Score
  drawText('SCORE: '+score,W-10,10,2,false,1);

  // Combo
  if(combo>1){
    const cm=getComboMultiplier();
    const comboSize=combo>=20?3:combo>=10?2:1;
    drawTextCol(combo+' COMBO',W-10,35,comboSize,true,C.combo,1);
    drawText('x'+cm.toFixed(1),W-10,35+comboSize*9+2,1,false,1);
  }

  // Arena info
  const theme=ARENA_THEMES[Math.min(arenaNum,ARENA_THEMES.length-1)];
  drawText('ARENA '+arenaNum+'/7',W/2,10,1,false,0.5);
  drawTextCol(theme.name,W/2,22,1,false,C.uiDk,0.5);

  // Difficulty
  drawText('DIFF: '+difficulty,10,H-12,1,false,0);

  // Powerups
  const puY=H-12;
  const puX=W/2;
  for(let i=0;i<player.powerups.length;i++){
    const pu=POWERUPS.find(p=>p.id===player.powerups[i]);
    if(pu){
      drawTextCol(pu.icon,puX+i*14,puY,1,false,pu.color,0);
    }
  }
}

// ================================================================
// UI - ARENA INTRO
// ================================================================
function drawArenaIntro(){
  const theme=ARENA_THEMES[Math.min(arenaNum,ARENA_THEMES.length-1)];
  const alpha=arenaTimer>90?clamp((120-arenaTimer)/30,0,1):clamp(arenaTimer/30,0,1);
  ctx.globalAlpha=alpha;

  drawTextCol('ARENA '+arenaNum,W/2,H/2-30,4,true,C.ui,0.5);
  drawTextCol(theme.name,W/2,H/2+10,2,false,C.uiDk,0.5);

  if(arenaNum===7){
    drawTextCol('FINAL ARENA',W/2,H/2+35,2,false,'#ff6060',0.5);
  }

  ctx.globalAlpha=1;
}

// ================================================================
// UI - ECHO INTRO
// ================================================================
function drawEchoIntro(){
  const alpha=stateTimer>120?clamp((180-stateTimer)/60,0,1):stateTimer>60?1:clamp(stateTimer/30,0,1);
  ctx.globalAlpha=alpha;

  // Dark overlay
  ctx.fillStyle='rgba(0,0,0,0.6)';
  ctx.fillRect(0,0,W,H);

  // Echo text
  drawTextCol('YOUR ECHO',W/2,H/2-30,4,true,C.echo,0.5);
  drawTextCol('AWAITS',W/2,H/2+10,4,true,C.echo,0.5);

  drawText('THE BETTER YOU PLAYED',W/2,H/2+50,1,false,0.5);
  drawText('THE HARDER IT WILL BE',W/2,H/2+63,1,false,0.5);

  ctx.globalAlpha=1;
}

// ================================================================
// UI - POWER-UP SELECT
// ================================================================
function drawPowerupSelect(){
  // Overlay
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,W,H);

  drawTextCol('CHOOSE YOUR POWER',W/2,50,3,true,C.ui,0.5);

  for(let i=0;i<selectOptions.length;i++){
    const pu=selectOptions[i];
    const cx=W/2+(i-1)*130;
    const cy=H/2+10;
    const sel=i===selectedOption;

    // Card background
    ctx.fillStyle=sel?C.cardBorder:C.cardBg;
    ctx.fillRect(cx-50,cy-45,100,100);
    if(sel){
      ctx.strokeStyle=pu.color;
      ctx.lineWidth=2;
      ctx.strokeRect(cx-50,cy-45,100,100);
    }

    // Icon
    drawTextCol(pu.icon,cx,cy-25,5,false,pu.color,0.5);

    // Name
    drawTextCol(pu.name,cx,cy+10,1,false,pu.color,0.5);

    // Description
    drawText(pu.desc,cx,cy+25,1,false,0.5);
  }

  // Navigation hint
  if(isMobile){
    drawText('TAP A CARD TO SELECT',W/2,H-30,1,false,0.5);
  }else{
    drawText('A/D: BROWSE   J/SPACE: SELECT',W/2,H-30,1,false,0.5);
  }
}

// ================================================================
// UI - GAME OVER
// ================================================================
function drawGameOver(){
  ctx.fillStyle='rgba(0,0,0,0.75)';
  ctx.fillRect(0,0,W,H);

  const won=player&&!player.alive?false:true;

  if(subState==='echo_won'){
    drawTextCol('YOU BEAT YOUR ECHO',W/2,50,3,true,C.ui,0.5);
    drawTextCol('DIFFICULTY UP!',W/2,85,2,false,C.echo,0.5);
  }else if(subState==='echo_lost'){
    drawTextCol('YOUR ECHO WON',W/2,50,3,true,C.echo,0.5);
  }else{
    drawTextCol('DEFEATED',W/2,50,3,true,C.dmg,0.5);
  }

  // Stats
  const sy=110;
  drawText('FINAL SCORE: '+score,W/2,sy,2,false,0.5);
  drawText('ARENAS CLEARED: '+(arenaNum-(arenaComplete?0:1))+'/7',W/2,sy+22,1,false,0.5);
  drawText('MAX COMBO: '+maxCombo,W/2,sy+35,1,false,0.5);
  drawText('ENEMIES DEFEATED: '+totalKills,W/2,sy+48,1,false,0.5);
  drawText('DIFFICULTY: '+difficulty,W/2,sy+61,1,false,0.5);

  // Powerups
  if(player&&player.powerups.length>0){
    drawText('POWERUPS: '+player.powerups.join(', '),W/2,sy+78,1,false,0.5);
  }

  // Save score
  drawText('SCORE SAVED TO LEADERBOARD',W/2,sy+100,1,false,0.5);

  // Options
  const blink=Math.sin(stateTimer*0.06)>0;
  if(blink){
    if(isMobile){
      drawTextCol('TAP TO RETRY',W/2,H-40,2,false,C.ui,0.5);
    }else{
      drawTextCol('SPACE/J: RETRY   ESC/M: MENU',W/2,H-40,2,false,C.ui,0.5);
    }
  }
}

// ================================================================
// UI - LEADERBOARD
// ================================================================
function drawLeaderboard(){
  ctx.fillStyle='#0a0614';
  ctx.fillRect(0,0,W,H);

  drawTextCol('LEADERBOARD',W/2,20,3,true,C.ui,0.5);

  const lb=getLeaderboard();
  if(lb.length===0){
    drawText('NO RECORDS YET',W/2,H/2,2,false,0.5);
  }else{
    for(let i=0;i<Math.min(lb.length,8);i++){
      const e=lb[i];
      const y=55+i*22;
      const isTop=i===0;
      const col=isTop?C.ui:C.white;
      drawTextCol((i+1)+'.',W/2-130,y,1,false,col,0);
      drawTextCol(e.score+'',W/2-100,y,1,false,col,0);
      drawText('ARENA '+e.arena+'/7 DIFF:'+e.difficulty,W/2+10,y,1,false,0);
      drawText(e.kills+' KILLS',W/2+120,y,1,false,0);
    }
  }

  drawText('ESC/M: BACK',W/2,H-20,1,false,0.5);
}

// ================================================================
// TOUCH CONTROLS OVERLAY
// ================================================================
function drawTouchOverlay(){
  if(!isMobile)return;
  if(state!=='playing')return;

  ctx.globalAlpha=0.25;

  // Joystick zone
  const jx=65,jy=H-40;
  ctx.strokeStyle=C.white;
  ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(jx,jy,28,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(jx,jy,10,0,Math.PI*2);ctx.stroke();

  // Direction indicator
  const td=getTouchDir();
  if(td.x!==0||td.y!==0){
    ctx.globalAlpha=0.5;
    ctx.beginPath();ctx.arc(jx+td.x*20,jy+td.y*20,8,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=0.25;
  }

  // Buttons
  const btnSize=20;
  const btnY=H-50;

  // Light attack (J)
  ctx.fillStyle=C.player;
  ctx.fillRect(W-160,btnY,btnSize*2,btnSize);
  drawText('ATK',W-160+btnSize,btnY+6,1,false,0.5);

  // Heavy (K)
  ctx.fillStyle=C.brute;
  ctx.fillRect(W-100,btnY,btnSize*2,btnSize);
  drawText('HVY',W-100+btnSize,btnY+6,1,false,0.5);

  // Dodge (L)
  ctx.fillStyle=C.dash;
  ctx.fillRect(W-160,btnY-btnSize-8,btnSize*2,btnSize);
  drawText('DDG',W-160+btnSize,btnY-btnSize-2,1,false,0.5);

  // Special (Space)
  if(player&&player.sp>=player.maxSp){
    ctx.fillStyle=C.sp;
    ctx.globalAlpha=0.4+Math.sin(stateTimer*0.1)*0.2;
    ctx.fillRect(W-100,btnY-btnSize-8,btnSize*2,btnSize);
    drawText('SPL',W-100+btnSize,btnY-btnSize-2,1,false,0.5);
  }

  ctx.globalAlpha=1;
}

// ================================================================
// GAME FLOW
// ================================================================
function startGame(){
  initAudio();
  player=makePlayer();
  enemies=[];
  echoLog=[];
  score=0;
  combo=0;
  maxCombo=0;
  comboTimer=0;
  totalKills=0;
  totalDmgTaken=0;
  runTime=0;
  difficulty=difficulty||1;
  particles=[];
  dmgNumbers=[];
  floatingTexts=[];

  // Load saved echo
  savedEcho=loadEcho();

  state='playing';
  subState='arena_intro';
  stateTimer=0;
  startArena(1);
}

function endRun(beatEcho){
  // Save echo data for next run
  if(beatEcho&&player.alive){
    saveEcho(echoLog,player);
    difficulty++;
  }

  // Save score
  saveScore(score,arenaNum,difficulty,totalKills);

  state='gameover';
  stateTimer=0;
  if(beatEcho)subState='echo_won';
  else if(echoEntity&&!echoEntity.alive)subState='echo_won';
  else subState=subState==='echo_fight'?'echo_lost':'defeated';
}

function handleConfirm(){
  initAudio();
  if(state==='menu'){
    startGame();
  }else if(state==='gameover'){
    startGame();
  }else if(state==='leaderboard'){
    state='menu';
    stateTimer=0;
  }
}

function saveEcho(log,p){
  const data={
    log:log,
    maxHp:p.maxHp,
    atk:Math.round(p.atk*p.atkM),
    spd:p.spd*p.spdM,
    powerups:[...p.powerups]
  };
  try{localStorage.setItem('echobrawl_echo',JSON.stringify(data))}catch(e){}
}

function loadEcho(){
  try{
    const d=JSON.parse(localStorage.getItem('echobrawl_echo'));
    if(d&&d.log&&d.log.length>0)return d;
  }catch(e){}
  return null;
}

function saveScore(sc,arena,diff,kills){
  try{
    const lb=JSON.parse(localStorage.getItem('echobrawl_lb')||'[]');
    lb.push({score:sc,arena,difficulty:diff,kills,date:Date.now()});
    lb.sort((a,b)=>b.score-a.score);
    if(lb.length>10)lb.length=10;
    localStorage.setItem('echobrawl_lb',JSON.stringify(lb));
  }catch(e){}
}

function getLeaderboard(){
  try{return JSON.parse(localStorage.getItem('echobrawl_lb')||'[]')}catch(e){return[]}
}

// ================================================================
// UPDATE PRINCIPAL
// ================================================================
function update(){
  stateTimer++;

  if(state==='menu'){
    // Menu logic handled in input
    return;
  }

  if(state==='leaderboard'){
    return;
  }

  if(state==='powerup'){
    return;
  }

  if(state==='gameover'){
    return;
  }

  if(state==='playing'){
    const inp=getInput();

    // Sub states
    if(subState==='arena_intro'){
      arenaTimer--;
      if(arenaTimer<=0){
        subState='combat';
      }
      return;
    }

    if(subState==='next_arena'){
      stateTimer--;
      if(stateTimer<=0){
        subState='arena_intro';
        startArena(arenaNum+1);
      }
      return;
    }

    if(subState==='echo_intro'){
      stateTimer--;
      if(stateTimer<=0){
        subState='echo_fight';
        echoEntity=makeEcho();
        enemies=[];
      }
      // Player can still move during intro
      updatePlayerEntity(player,inp);
      player.x=clamp(player.x,ARENA_L+10,ARENA_R-10);
      return;
    }

    // Main combat
    if(hitPauseFrames>0){
      hitPauseFrames--;
      return;
    }

    // Combo timer
    if(comboTimer>0){
      comboTimer--;
      if(comboTimer<=0)combo=0;
    }

    updateCombat(inp);
    recordFrame();
    updateArena();

    // Player hitbox cleanup
    if(player.attackHitbox){
      if(!player.state.startsWith('light')&&player.state!=='heavy'&&player.state!=='special'){
        player.attackHitbox=null;
      }
      if(player.attackHitbox){
        player.attackHitbox.x=player.x+player.facing*12;
        player.attackHitbox.y=player.y-16;
      }
    }

    // Player death check
    if(!player.alive){
      // Already handled in dealDmg
    }

    runTime++;

    // Check echo fight end (handled in dealDmg)
  }

  updateParticles();
  updateDmgNums();
  updateFloats();
  updateEffects();

  prevInput=getInput();
}

// ================================================================
// RENDER PRINCIPAL
// ================================================================
function render(){
  ctx.save();
  ctx.translate(Math.round(shakeX),Math.round(shakeY));

  if(state==='menu'){
    drawMenu();
    ctx.restore();
    return;
  }

  if(state==='leaderboard'){
    drawLeaderboard();
    ctx.restore();
    return;
  }

  if(state==='playing'||state==='powerup'||state==='gameover'){
    // Background
    drawBackground();

    // Entities
    // Enemies
    for(const e of enemies){
      if(e.alive||e.state==='death'){
        const colors=ENEMY_COLORS[e.type]||ENEMY_COLORS.grunt;
        drawEntity(e,colors,e.hitTimer>0);
        if(e.shieldActive)drawShield(e.x,e.y,e.facing);
        // HP bar for enemies
        if(e.alive&&e.hp<e.maxHp){
          const bw=20,bh=2;
          ctx.fillStyle='#300';
          ctx.fillRect(e.x-bw/2,e.y-28,bw,bh);
          ctx.fillStyle='#f00';
          ctx.fillRect(e.x-bw/2,e.y-28,bw*(e.hp/e.maxHp),bh);
        }
      }
    }

    // Player
    if(player&&(player.alive||player.state==='death')){
      // Invincibility flash
      if(player.invTimer>0&&player.invTimer%4<2){
        ctx.globalAlpha=0.4;
      }
      drawEntity(player,PLAYER_COLORS,false);
      ctx.globalAlpha=1;
    }

    // Echo
    if(echoEntity&&(echoEntity.alive||echoEntity.state==='death')){
      drawEchoGlow(echoEntity.x,echoEntity.y);
      drawEntity(echoEntity,ECHO_COLORS,echoEntity.hitTimer>0);
      // HP bar
      if(echoEntity.alive&&echoEntity.hp<echoEntity.maxHp){
        const bw=30,bh=3;
        ctx.fillStyle='#303';
        ctx.fillRect(echoEntity.x-bw/2,echoEntity.y-32,bw,bh);
        ctx.fillStyle=C.echo;
        ctx.fillRect(echoEntity.x-bw/2,echoEntity.y-32,bw*(echoEntity.hp/echoEntity.maxHp),bh);
      }
    }

    // Particles & effects
    drawParticles();
    drawDmgNums();
    drawFloats();

    // Flash overlay
    if(flashAlpha>0.01){
      ctx.fillStyle=`rgba(255,255,255,${flashAlpha})`;
      ctx.fillRect(0,0,W,H);
    }

    // HUD
    if(state==='playing'||state==='powerup'){
      drawHUD();
    }

    // Arena intro
    if(subState==='arena_intro'&&state==='playing'){
      drawArenaIntro();
    }

    // Echo intro
    if(subState==='echo_intro'&&state==='playing'){
      drawEchoIntro();
    }

    // Powerup select
    if(state==='powerup'){
      drawPowerupSelect();
    }

    // Game over
    if(state==='gameover'){
      drawGameOver();
    }

    // Touch controls
    drawTouchOverlay();
  }

  ctx.restore();
}

// ================================================================
// MAIN LOOP
// ================================================================
let lastTime=0;
let accumulator=0;

function gameLoop(time){
  if(lastTime===0)lastTime=time;
  const delta=time-lastTime;
  lastTime=time;
  accumulator+=delta;

  // Cap accumulator to prevent spiral
  if(accumulator>200)accumulator=200;

  while(accumulator>=FRAME_MS){
    update();
    accumulator-=FRAME_MS;
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ================================================================
// INITIALIZATION
// ================================================================
function init(){
  initCanvas();
  initInput();

  // Load saved echo
  savedEcho=loadEcho();

  // Start game loop
  requestAnimationFrame(gameLoop);
}

// Touch to init audio
document.addEventListener('touchstart',initAudio,{once:true});
document.addEventListener('keydown',initAudio,{once:true});

init();

})();
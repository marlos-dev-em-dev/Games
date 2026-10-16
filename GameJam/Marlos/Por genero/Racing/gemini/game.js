// Syntax Shift - Rebalanced QTE & Pacing
(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playSound(type) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'type') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 300, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now); osc.stop(now + 0.04);
    } else if (type === 'hack') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now); osc.stop(now + 0.28);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'engine') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50 + Math.random() * 20, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now); osc.stop(now + 0.06);
    }
  }

  // Palavras simplificadas e sem símbolos chatos
  const LANGUAGES = [
    { id: 'python', name: 'Python', color: '#3776AB', accent: '#FFD43B', ability: 'TURBO', desc: 'Aceleração hiper-rápida instantânea.', topSpeed: 9.6, accel: 0.28, keywords: ['import', 'turbo', 'lambda', 'yield'], hackName: 'HYPER TURBO' },
    { id: 'rust', name: 'Rust', color: '#DEA584', accent: '#A72145', ability: 'NO CLIP', desc: 'Atravessa paredes e barreiras sem colidir.', topSpeed: 10.3, accel: 0.22, keywords: ['unsafe', 'match', 'unwrap', 'free'], hackName: 'UNSAFE NO_CLIP' },
    { id: 'javascript', name: 'JavaScript', color: '#F7DF1E', accent: '#323330', ability: 'STORM', desc: 'Relâmpagos que desaceleram oponentes.', topSpeed: 9.9, accel: 0.30, keywords: ['await', 'fetch', 'async', 'const'], hackName: 'ASYNC STORM' },
    { id: 'csharp', name: 'C#', color: '#9B4F96', accent: '#239120', ability: 'FREEZE', desc: 'Pulso EMP que congela motores próximos.', topSpeed: 10.0, accel: 0.25, keywords: ['where', 'freeze', 'task', 'list'], hackName: 'LINQ EMP FREEZE' },
    { id: 'java', name: 'Java', color: '#ED8B00', accent: '#5382A1', ability: 'CLEANUP', desc: 'Garbage Collector limpa obstáculos do mapa.', topSpeed: 9.3, accel: 0.20, keywords: ['system', 'static', 'public', 'class'], hackName: 'GARBAGE COLLECTOR' },
    { id: 'ruby', name: 'Ruby', color: '#CC342D', accent: '#FFFFFF', ability: 'WARP', desc: 'Metaprogramação para salto quântico.', topSpeed: 10.1, accel: 0.27, keywords: ['warp', 'yield', 'times', 'puts'], hackName: 'METAPROGRAM WARP' }
  ];

  const TRACK_POINTS = [
    { x: 500, y: 500 }, { x: 1800, y: 350 }, { x: 3000, y: 600 },
    { x: 3200, y: 1500 }, { x: 2500, y: 2200 }, { x: 1600, y: 1700 },
    { x: 1100, y: 2200 }, { x: 400, y: 1600 }, { x: 300, y: 1000 }
  ];
  const TRACK_WIDTH = 135;
  const TOTAL_LAPS = 3;

  let gameState = 'LOBBY';
  let playerCar = null;
  let cars = [];
  let hackNodes = [];
  let bugHazards = [];
  let keys = {};
  let camera = { x: 0, y: 0 };

  // QTE System - Tempo estendido e Cooldown anti-spam
  let activeTargetString = '';
  let typedIndex = 0;
  let qteTimeRemaining = 0;
  let qteTimeMax = 5.5; // Aumentado para 5.5 segundos!
  let qteCooldownTimer = 0; // Proteção contra disparos seguidos

  const MAX_PLAYERS = 6;
  let myPeerId = '';
  let isHost = true;
  let peer = null;
  let clientConns = [];
  let hostConn = null;
  let currentPingMs = 0;
  let lastPing = 0;
  let roomPlayers = [];

  function initNetworking() {
    myPeerId = Math.floor(100000 + Math.random() * 900000).toString();
    peer = new Peer(myPeerId);

    peer.on('open', id => {
      myPeerId = id;
      document.getElementById('my-peer-id').innerText = id;
      roomPlayers = [{ id: myPeerId, langId: null, isHost: true }];
      updateLobbyUI();
    });

    peer.on('error', err => {
      if (err.type === 'unavailable-id') initNetworking();
    });

    peer.on('connection', conn => {
      if (!isHost) { conn.close(); return; }

      if (roomPlayers.length >= MAX_PLAYERS || gameState !== 'LOBBY') {
        conn.on('open', () => {
          conn.send({ type: 'ROOM_FULL' });
          setTimeout(() => conn.close(), 500);
        });
        return;
      }

      clientConns.push(conn);
      conn.on('open', () => {
        roomPlayers.push({ id: conn.peer, langId: null, isHost: false });
        broadcastLobbyState();
      });

      conn.on('data', data => handleHostData(conn, data));

      conn.on('close', () => {
        clientConns = clientConns.filter(c => c !== conn);
        roomPlayers = roomPlayers.filter(p => p.id !== conn.peer);
        broadcastLobbyState();
      });
    });
  }

  window.connectToPeer = function () {
    const targetId = document.getElementById('join-peer-id').value.trim();
    if (!targetId || targetId === myPeerId) return;

    hostConn = peer.connect(targetId, { reliable: true });
    isHost = false;

    document.getElementById('btn-connect').innerText = 'CONECTANDO...';

    hostConn.on('open', () => {
      document.getElementById('btn-connect').innerText = 'CONECTADO!';
      document.getElementById('btn-connect').style.background = '#00ff66';
      document.getElementById('join-peer-id').disabled = true;
    });

    hostConn.on('data', data => handleClientData(data));
  };

  function handleHostData(conn, data) {
    if (data.type === 'SELECT_LANG') {
      const p = roomPlayers.find(p => p.id === conn.peer);
      const taken = roomPlayers.some(p => p.langId === data.langId);
      if (p && !p.langId && !taken) {
        p.langId = data.langId;
        broadcastLobbyState();
      }
    } else if (data.type === 'SYNC_CAR') {
      broadcastToClients({ type: 'REMOTE_SYNC', id: conn.peer, ...data }, conn.peer);
      const car = cars.find(c => c.peerId === conn.peer);
      if (car) {
        car.x += (data.x - car.x) * 0.35;
        car.y += (data.y - car.y) * 0.35;
        car.angle = data.angle;
        car.speed = data.speed;
        car.lap = data.lap;
        car.currentWaypoint = data.currentWaypoint;
      }
    } else if (data.type === 'PING') {
      conn.send({ type: 'PONG', timestamp: data.timestamp });
    }
  }

  function handleClientData(data) {
    if (data.type === 'LOBBY_STATE') {
      roomPlayers = data.roomPlayers;
      updateLobbyUI();
    } else if (data.type === 'ROOM_FULL') {
      alert('A sala está cheia!');
      location.reload();
    } else if (data.type === 'START_RACE') {
      startRaceLocal(data.raceConfig);
    } else if (data.type === 'REMOTE_SYNC') {
      const car = cars.find(c => c.peerId === data.id);
      if (car) {
        car.x += (data.x - car.x) * 0.35;
        car.y += (data.y - car.y) * 0.35;
        car.angle = data.angle;
        car.speed = data.speed;
        car.lap = data.lap;
        car.currentWaypoint = data.currentWaypoint;
      }
    } else if (data.type === 'PONG') {
      currentPingMs = Math.round(performance.now() - data.timestamp);
    }
  }

  function broadcastLobbyState() {
    updateLobbyUI();
    broadcastToClients({ type: 'LOBBY_STATE', roomPlayers });
  }

  function broadcastToClients(msg, excludePeerId = null) {
    clientConns.forEach(c => {
      if (c.open && c.peer !== excludePeerId) c.send(msg);
    });
  }

  function selectLanguage(langId) {
    initAudio();
    if (isHost) {
      const p = roomPlayers.find(p => p.id === myPeerId);
      const taken = roomPlayers.some(p => p.langId === langId);
      if (p && !p.langId && !taken) {
        p.langId = langId;
        broadcastLobbyState();
      }
    } else {
      const myP = roomPlayers.find(p => p.id === myPeerId);
      if (myP && !myP.langId && hostConn && hostConn.open) {
        hostConn.send({ type: 'SELECT_LANG', langId });
      }
    }
  }

  function updateLobbyUI() {
    const statusText = document.getElementById('lobby-status');
    const btnStart = document.getElementById('btn-start-race');

    const total = roomPlayers.length;
    const readyCount = roomPlayers.filter(p => p.langId !== null).length;

    statusText.innerText = `JOGADORES NA SALA: ${total}/6 • PRONTOS: ${readyCount}/${total}`;

    if (isHost) {
      btnStart.style.display = 'inline-block';
      if (readyCount === total && total >= 1) {
        btnStart.disabled = false;
        btnStart.innerText = '🚀 INICIAR CORRIDA AGORA';
      } else {
        btnStart.disabled = true;
        btnStart.innerText = 'AGUARDANDO TODOS ESCOLHEREM...';
      }
    } else {
      btnStart.style.display = 'none';
    }

    const grid = document.getElementById('lang-grid');
    grid.innerHTML = '';

    LANGUAGES.forEach(lang => {
      const owner = roomPlayers.find(p => p.langId === lang.id);
      const isMine = owner && owner.id === myPeerId;

      const card = document.createElement('div');
      card.className = `lang-card ${owner ? 'taken' : ''} ${isMine ? 'selected' : ''}`;

      let badgeText = '';
      if (isMine) badgeText = '<span class="taken-badge" style="background:#00ff66; color:#000">SEU CARRO</span>';
      else if (owner) badgeText = `<span class="taken-badge">RESERVADO</span>`;

      card.innerHTML = `
        ${badgeText}
        <div class="lang-title"><span style="color:${lang.color}">${lang.name}</span> <span>⚡ ${Math.floor(lang.topSpeed * 20)}</span></div>
        <div class="lang-ability">HACK: ${lang.ability}</div>
        <div class="lang-desc">${lang.desc}</div>
      `;

      if (!owner) {
        card.onclick = () => selectLanguage(lang.id);
      }
      grid.appendChild(card);
    });
  }

  window.hostStartRace = function () {
    if (!isHost) return;
    
    const takenLangs = roomPlayers.map(p => p.langId);
    const availableLangs = LANGUAGES.filter(l => !takenLangs.includes(l.id));

    const raceConfig = [];
    roomPlayers.forEach(p => {
      raceConfig.push({ peerId: p.id, langId: p.langId, isAI: false });
    });

    let aiIdx = 1;
    availableLangs.forEach(lang => {
      raceConfig.push({ peerId: `AI_${aiIdx++}`, langId: lang.id, isAI: true });
    });

    broadcastToClients({ type: 'START_RACE', raceConfig });
    startRaceLocal(raceConfig);
  };

  function startRaceLocal(raceConfig) {
    document.getElementById('select-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    const p0 = TRACK_POINTS[0];
    const angle = Math.atan2(TRACK_POINTS[1].y - p0.y, TRACK_POINTS[1].x - p0.x);

    cars = [];
    raceConfig.forEach((cfg, idx) => {
      const lang = LANGUAGES.find(l => l.id === cfg.langId);
      const offsetX = (idx % 2) * -35;
      const offsetY = Math.floor(idx / 2) * -40;

      const isMe = cfg.peerId === myPeerId;
      const car = createCar(lang, p0.x + offsetX, p0.y + offsetY, angle, isMe, !isMe && !cfg.isAI, cfg.peerId);
      cars.push(car);

      if (isMe) playerCar = car;
    });

    generateTrackItems();
    gameState = 'RACING';
  }

  function createCar(lang, x, y, angle, isPlayer, isRemotePeer, peerId) {
    return {
      lang, x, y, angle, speed: 0,
      topSpeed: lang.topSpeed, accel: lang.accel,
      isPlayer, isRemotePeer, peerId,
      currentWaypoint: 1, lap: 1, finished: false,
      boostTimer: 0, ghostTimer: 0, frozenTimer: 0, stormSlowTimer: 0
    };
  }

  // Menos itens gerados na pista para não poluir
  function generateTrackItems() {
    hackNodes = [];
    bugHazards = [];
    for (let i = 0; i < TRACK_POINTS.length; i += 2) { // Gerados a cada 2 pontos
      const p1 = TRACK_POINTS[i];
      const p2 = TRACK_POINTS[(i + 1) % TRACK_POINTS.length];
      hackNodes.push({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2, active: true, respawn: 0 });
      if (i % 4 === 0) {
        bugHazards.push({ x: p1.x, y: p1.y, active: true, respawn: 0 });
      }
    }
  }

  function triggerQTE() {
    if (gameState !== 'RACING' || qteCooldownTimer > 0) return;
    gameState = 'QTE';

    const kwList = playerCar.lang.keywords;
    activeTargetString = kwList[Math.floor(Math.random() * kwList.length)];
    typedIndex = 0;
    
    // Tempo proporcional + base de 5.5s
    qteTimeMax = Math.max(5.5, activeTargetString.length * 0.9);
    qteTimeRemaining = qteTimeMax;

    updateQTEDisplay();
    document.getElementById('qte-overlay').classList.remove('hidden');
    document.getElementById('autopilot-indicator').style.display = 'block';
  }

  function updateQTEDisplay() {
    const typed = activeTargetString.substring(0, typedIndex);
    const untyped = activeTargetString.substring(typedIndex);
    document.getElementById('qte-code-box').innerHTML = `<span class="typed-text">${escapeHTML(typed)}</span><span class="cursor"></span><span class="untyped-text">${escapeHTML(untyped)}</span>`;
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function resolveQTE(success) {
    document.getElementById('qte-overlay').classList.add('hidden');
    document.getElementById('autopilot-indicator').style.display = 'none';
    gameState = 'RACING';
    qteCooldownTimer = 4.0; // 4 segundos de invulnerabilidade/cooldown de QTE

    if (success) {
      playSound('hack');
      executeHack(playerCar);
      showNotification(`HACK INJETADO: ${playerCar.lang.hackName}`);
    } else {
      playSound('error');
      showNotification(`ERRO DE SINTAXE! COMPILED FAILED`);
    }
  }

  function executeHack(car) {
    const id = car.lang.id;
    if (id === 'python') car.boostTimer = 220;
    else if (id === 'rust') car.ghostTimer = 280;
    else if (id === 'javascript') cars.filter(c => c !== car).forEach(c => c.stormSlowTimer = 240);
    else if (id === 'csharp') cars.filter(c => c !== car && Math.hypot(c.x - car.x, c.y - car.y) < 500).forEach(c => c.frozenTimer = 180);
    else if (id === 'java') bugHazards.forEach(b => b.active = false);
    else if (id === 'ruby') {
      const target = TRACK_POINTS[car.currentWaypoint];
      car.x = target.x; car.y = target.y;
      car.currentWaypoint = (car.currentWaypoint + 1) % TRACK_POINTS.length;
    }
  }

  function showNotification(msg) {
    const n = document.getElementById('notification');
    n.innerText = msg;
    n.classList.add('show');
    setTimeout(() => n.classList.remove('show'), 2200);
  }

  window.addEventListener('keydown', e => {
    initAudio();
    keys[e.key] = true;

    if (gameState === 'QTE') {
      if (e.key === ' ' || e.key.length === 1) e.preventDefault();

      // Aceita caracteres em caixa alta ou baixa sem penalizar
      const targetChar = activeTargetString[typedIndex];
      if (e.key.toLowerCase() === targetChar.toLowerCase()) {
        typedIndex++;
        playSound('type');
        updateQTEDisplay();
        if (typedIndex >= activeTargetString.length) resolveQTE(true);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        playSound('error');
      }
    }
  });

  window.addEventListener('keyup', e => keys[e.key] = false);

  function update(dt) {
    if (qteCooldownTimer > 0) qteCooldownTimer -= dt;

    if (gameState === 'QTE') {
      qteTimeRemaining -= dt;
      document.getElementById('qte-timer').style.width = Math.max(0, (qteTimeRemaining / qteTimeMax) * 100) + '%';
      if (qteTimeRemaining <= 0) resolveQTE(false);
      if (playerCar) autopilotSteer(playerCar);
    }

    if (gameState !== 'RACING' && gameState !== 'QTE') return;

    if (!isHost && hostConn && hostConn.open && performance.now() - lastPing > 300) {
      lastPing = performance.now();
      hostConn.send({ type: 'PING', timestamp: lastPing });
    }

    if (playerCar) {
      const targetCamX = playerCar.x - canvas.width / 2;
      const targetCamY = playerCar.y - canvas.height / 2;
      camera.x += (targetCamX - camera.x) * 0.12;
      camera.y += (targetCamY - camera.y) * 0.12;
    }

    hackNodes.forEach(n => { if (!n.active && (n.respawn -= dt) <= 0) n.active = true; });
    bugHazards.forEach(b => { if (!b.active && (b.respawn -= dt) <= 0) b.active = true; });

    cars.forEach(car => {
      if (car.finished) return;

      if (car.boostTimer > 0) car.boostTimer--;
      if (car.ghostTimer > 0) car.ghostTimer--;
      if (car.frozenTimer > 0) { car.frozenTimer--; return; }
      if (car.stormSlowTimer > 0) car.stormSlowTimer--;

      let effTopSpeed = car.topSpeed * (car.boostTimer > 0 ? 1.45 : 1) * (car.stormSlowTimer > 0 ? 0.45 : 1);

      if (car.isPlayer) {
        if (gameState === 'RACING') {
          if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            car.speed = Math.min(car.speed + car.accel, effTopSpeed);
            if (Math.random() < 0.2) playSound('engine');
          } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            car.speed = Math.max(car.speed - car.accel * 1.2, -effTopSpeed * 0.4);
          } else {
            car.speed *= 0.96;
          }

          let turn = 0.048 * (car.speed / car.topSpeed);
          if (keys['ArrowLeft'] || keys['a'] || keys['A']) car.angle -= turn;
          if (keys['ArrowRight'] || keys['d'] || keys['D']) car.angle += turn;
        }

        const syncPayload = {
          type: 'SYNC_CAR', x: car.x, y: car.y, angle: car.angle, speed: car.speed,
          lap: car.lap, currentWaypoint: car.currentWaypoint
        };
        if (isHost) broadcastToClients({ type: 'REMOTE_SYNC', id: myPeerId, ...syncPayload });
        else if (hostConn && hostConn.open) hostConn.send(syncPayload);

      } else if (!car.isRemotePeer) {
        autopilotSteer(car);
      }

      car.x += Math.cos(car.angle) * car.speed;
      car.y += Math.sin(car.angle) * car.speed;

      const wp = TRACK_POINTS[car.currentWaypoint];
      if (Math.hypot(car.x - wp.x, car.y - wp.y) < 110) {
        car.currentWaypoint = (car.currentWaypoint + 1) % TRACK_POINTS.length;
        if (car.currentWaypoint === 1) {
          car.lap++;
          if (car.lap > TOTAL_LAPS) car.finished = true;
        }
      }

      if (car.ghostTimer <= 0) {
        let onTrack = false;
        for (let i = 0; i < TRACK_POINTS.length; i++) {
          const p1 = TRACK_POINTS[i];
          const p2 = TRACK_POINTS[(i + 1) % TRACK_POINTS.length];
          if (distToSegment({ x: car.x, y: car.y }, p1, p2) <= TRACK_WIDTH) { onTrack = true; break; }
        }
        if (!onTrack) {
          car.speed *= 0.7;
          // Reduzida probabilidade de QTE ao sair da pista (de 8% para apenas 2%)
          if (car.isPlayer && gameState === 'RACING' && Math.abs(car.speed) > 4 && Math.random() < 0.02) {
            triggerQTE();
          }
        }
      }

      if (car.isPlayer && gameState === 'RACING') {
        hackNodes.forEach(node => {
          if (node.active && Math.hypot(car.x - node.x, car.y - node.y) < 40) {
            node.active = false; node.respawn = 10;
            triggerQTE();
          }
        });
        if (car.ghostTimer <= 0) {
          bugHazards.forEach(bug => {
            if (bug.active && Math.hypot(car.x - bug.x, car.y - bug.y) < 35) {
              bug.active = false; bug.respawn = 8;
              car.speed *= 0.3; triggerQTE();
            }
          });
        }
      }
    });

    if (playerCar) {
      const sorted = [...cars].sort((a, b) => (b.lap * 100 + b.currentWaypoint) - (a.lap * 100 + a.currentWaypoint));
      document.getElementById('hud-pos').innerText = `POS: ${sorted.indexOf(playerCar) + 1} / ${cars.length}`;
      document.getElementById('hud-lap').innerText = `LAP: ${Math.min(playerCar.lap, TOTAL_LAPS)} / ${TOTAL_LAPS}`;
      document.getElementById('hud-ping').innerText = `PING: ${currentPingMs || '<60'} ms`;
      document.getElementById('hud-speed').innerText = `${Math.floor(Math.abs(playerCar.speed) * 20)} KM/H`;
    }
  }

  function autopilotSteer(car) {
    const target = TRACK_POINTS[car.currentWaypoint];
    let diff = Math.atan2(target.y - car.y, target.x - car.x) - car.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    car.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.045);
    car.speed = Math.min(car.speed + car.accel * 0.85, car.topSpeed * 0.75);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    ctx.strokeStyle = '#0e1222';
    ctx.lineWidth = 1;
    for (let x = -1000; x < 4500; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, -1000); ctx.lineTo(x, 3500); ctx.stroke();
    }
    for (let y = -1000; y < 3500; y += 60) {
      ctx.beginPath(); ctx.moveTo(-1000, y); ctx.lineTo(4500, y); ctx.stroke();
    }

    ctx.beginPath();
    TRACK_POINTS.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.lineWidth = TRACK_WIDTH * 2;
    ctx.strokeStyle = '#121324';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowBlur = 15; ctx.shadowColor = '#00f0ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    hackNodes.forEach(node => {
      if (!node.active) return;
      ctx.fillStyle = '#FFD43B'; ctx.beginPath(); ctx.arc(node.x, node.y, 12, 0, Math.PI * 2); ctx.fill();
    });
    bugHazards.forEach(bug => {
      if (!bug.active) return;
      ctx.fillStyle = '#ff0055'; ctx.beginPath(); ctx.arc(bug.x, bug.y, 10, 0, Math.PI * 2); ctx.fill();
    });

    cars.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      if (car.ghostTimer > 0) ctx.globalAlpha = 0.4;

      ctx.fillStyle = car.lang.color;
      ctx.fillRect(-18, -10, 36, 20);
      ctx.fillStyle = car.lang.accent;
      ctx.fillRect(-2, -6, 12, 12);

      ctx.rotate(-car.angle);
      ctx.font = 'bold 12px Courier New';
      ctx.fillStyle = '#fff';
      ctx.fillText(car.lang.name + (car.isPlayer ? ' (VOCÊ)' : ''), -20, -18);
      ctx.restore();
    });

    ctx.restore();
    drawMinimap();
  }

  function drawMinimap() {
    const mapW = 160, mapH = 114;
    const miniX = canvas.width - mapW - 15;
    const miniY = 15;

    ctx.save();
    ctx.fillStyle = 'rgba(4, 4, 10, 0.85)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    ctx.fillRect(miniX, miniY, mapW, mapH);
    ctx.strokeRect(miniX, miniY, mapW, mapH);

    const scaleX = mapW / 3800;
    const scaleY = mapH / 2800;

    ctx.beginPath();
    TRACK_POINTS.forEach((p, i) => {
      const mx = miniX + (p.x + 200) * scaleX;
      const my = miniY + (p.y + 200) * scaleY;
      if (i === 0) ctx.moveTo(mx, my); else ctx.lineTo(mx, my);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    cars.forEach(car => {
      const cx = miniX + (car.x + 200) * scaleX;
      const cy = miniY + (car.y + 200) * scaleY;
      ctx.fillStyle = car.isPlayer ? '#00ff66' : (car.isRemotePeer ? '#ff0055' : '#ffdd00');
      ctx.beginPath();
      ctx.arc(cx, cy, car.isPlayer ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  function distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = Math.max(0, Math.min(1, ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
  }

  let lastTime = performance.now();
  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
  }

  initNetworking();
  requestAnimationFrame(gameLoop);
})();
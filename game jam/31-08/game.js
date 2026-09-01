/**
 * Gnomo no Barril - Motor de Jogo 2D
 */

const ITEMS_CONFIG = {
  nenhum: { name: "Nenhum", desc: "Plataforma Padrão (Sem habilidades especiais)" },
  sabao: { name: "Sabão Escorregadio", desc: "Atrito reduzido! Ganhe velocidade extrema ao deslizar." },
  guarda_chuva: { name: "Guarda-Chuva de Vento", desc: "Segure Pulo no ar para planar suavemente." },
  tostadeira: { name: "Tostadeira Pesada", desc: "Massa extra para pressionar botões e quebrar blocos marrons caindo de cima." },
  pedra: { name: "Pedra de Arremesso", desc: "Pressione Z para lançar pedras e ativar alavancas distantes." },
  bota: { name: "Bota Mágica", desc: "Permite executar um Pulo Duplo no ar." }
};

const DEFAULT_FALLBACK_LEVEL = {
  tileSize: 32,
  unlockedItem: "nenhum",
  spawn: { x: 2, y: 8 },
  goal: { x: 17, y: 2 },
  grid: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
    [1,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,3,3,3,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ]
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.currentLevelIndex = 1;
    this.levelData = null;
    this.tileSize = 32;

    this.keys = {};
    this.prevKeys = {};

    this.player = { x: 0, y: 0, vx: 0, vy: 0, width: 24, height: 28, grounded: false, facingRight: true, jumpCount: 0 };
    this.projectiles = [];
    this.activatedLevers = new Set();
    this.pressedButtons = new Set();

    this.initInputs();
    this.loadLevel(this.currentLevelIndex);
    
    requestAnimationFrame(() => this.loop());
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyZ'].includes(e.code)) e.preventDefault();
    });

    window.addEventListener('keyup', (e) => this.keys[e.code] = false);

    document.getElementById('manualJsonInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target.result);
          this.applyLevelData(json, "Fase Carregada");
        } catch (err) { alert('Erro ao carregar JSON.'); }
      };
      reader.readAsText(file);
    });
  }

  isKeyPressed(code) {
    return this.keys[code] && !this.prevKeys[code];
  }
  async loadLevel(index) {
    const levelPath = `./level/level${index}.json`;
    try {
      const res = await fetch(levelPath);
      if (!res.ok) throw new Error("Não encontrado");
      const json = await res.json();
      this.applyLevelData(json, `Nível ${index}`);
    } catch (err) {
      this.applyLevelData(DEFAULT_FALLBACK_LEVEL, `Nível ${index} (Padrão)`);
    }
  }

  applyLevelData(data, title) {
    this.levelData = JSON.parse(JSON.stringify(data));
    this.tileSize = this.levelData.tileSize || 32;
    this.canvas.width = this.levelData.grid[0].length * this.tileSize;
    this.canvas.height = this.levelData.grid.length * this.tileSize;

    document.getElementById('levelName').innerText = title;
    const item = ITEMS_CONFIG[this.levelData.unlockedItem || 'nenhum'];
    document.getElementById('activeItemName').innerText = item.name;
    document.getElementById('activeItemDesc').innerText = item.desc;

    this.projectiles = [];
    this.activatedLevers.clear();
    this.pressedButtons.clear();
    this.resetPlayer();
  }

  resetPlayer() {
    this.player.x = this.levelData.spawn.x * this.tileSize + (this.tileSize - this.player.width) / 2;
    this.player.y = this.levelData.spawn.y * this.tileSize + (this.tileSize - this.player.height);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.grounded = false;
    this.player.jumpCount = 0;
  }

  update() {
    if (!this.levelData) return;

    if (this.isKeyPressed('KeyR')) { this.resetPlayer(); return; }

    const item = this.levelData.unlockedItem || 'nenhum';
    let accel = 0.8, friction = 0.80, maxSpeed = 4.5, gravity = 0.45;

    if (item === 'sabao') { friction = 0.96; accel = 0.35; maxSpeed = 6.5; }
    else if (item === 'tostadeira') { gravity = 0.70; }

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) { this.player.vx -= accel; this.player.facingRight = false; }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) { this.player.vx += accel; this.player.facingRight = true; }

    this.player.vx *= friction;
    if (Math.abs(this.player.vx) > maxSpeed) this.player.vx = Math.sign(this.player.vx) * maxSpeed;

    const jumpPressed = this.isKeyPressed('KeyW') || this.isKeyPressed('Space') || this.isKeyPressed('ArrowUp');
    const jumpHeld = this.keys['KeyW'] || this.keys['Space'] || this.keys['ArrowUp'];

    if (jumpPressed) {
      if (this.player.grounded) {
        this.player.vy = -9.5; this.player.grounded = false; this.player.jumpCount = 1;
      } else if (item === 'bota' && this.player.jumpCount < 2) {
        this.player.vy = -8.5; this.player.jumpCount++;
      }
    }

    if (item === 'guarda_chuva' && !this.player.grounded && jumpHeld && this.player.vy > 0) {
      this.player.vy = 1.2;
    } else {
      this.player.vy += gravity;
    }

    if (item === 'pedra' && this.isKeyPressed('KeyZ')) {
      this.projectiles.push({
        x: this.player.x + this.player.width / 2,
        y: this.player.y + this.player.height / 2,
        vx: this.player.facingRight ? 7 : -7,
        vy: -3.5, radius: 5
      });
    }

    this.player.x += this.player.vx; this.checkTileCollisions(true);
    this.player.y += this.player.vy; this.player.grounded = false; this.checkTileCollisions(false);

    this.updateProjectiles();

    if (this.player.y > this.canvas.height + 100) this.resetPlayer();

    const pCenter = { x: this.player.x + this.player.width / 2, y: this.player.y + this.player.height / 2 };
    const goalX = this.levelData.goal.x * this.tileSize + this.tileSize / 2;
    const goalY = this.levelData.goal.y * this.tileSize + this.tileSize / 2;
    if (Math.hypot(pCenter.x - goalX, pCenter.y - goalY) < this.tileSize * 0.75) {
      alert(`Fase concluída!`);
      this.currentLevelIndex++;
      this.loadLevel(this.currentLevelIndex);
    }

    this.prevKeys = { ...this.keys };
  }

  checkTileCollisions(isHorizontal) {
    const grid = this.levelData.grid;
    const startCol = Math.floor(this.player.x / this.tileSize);
    const endCol = Math.floor((this.player.x + this.player.width) / this.tileSize);
    const startRow = Math.floor(this.player.y / this.tileSize);
    const endRow = Math.floor((this.player.y + this.player.height) / this.tileSize);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) continue;
        const tile = grid[r][c];

        if (tile === 1 || tile === 3) {
          const tileBounds = { x: c * this.tileSize, y: r * this.tileSize, w: this.tileSize, h: this.tileSize };
          if (this.checkAABB(this.player, tileBounds)) {
            if (tile === 3 && this.levelData.unlockedItem === 'tostadeira' && !isHorizontal && this.player.vy > 0) {
              grid[r][c] = 0; continue;
            }
            if (isHorizontal) {
              this.player.x = this.player.vx > 0 ? tileBounds.x - this.player.width : tileBounds.x + tileBounds.w;
              this.player.vx = 0;
            } else {
              if (this.player.vy > 0) {
                this.player.y = tileBounds.y - this.player.height;
                this.player.grounded = true; this.player.jumpCount = 0;
              } else {
                this.player.y = tileBounds.y + tileBounds.h;
              }
              this.player.vy = 0;
            }
          }
        } else if (tile === 2 && !isHorizontal) {
          if (this.checkAABB(this.player, { x: c * this.tileSize, y: r * this.tileSize + 16, w: this.tileSize, h: 16 })) {
            this.pressedButtons.add(`${r},${c}`);
          }
        }
      }
    }
  }

  checkAABB(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.width > r2.x && r1.y < r2.y + r2.h && r1.y + r1.height > r2.y;
  }

  updateProjectiles() {
    const grid = this.levelData.grid;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.x += proj.vx; proj.y += proj.vy; proj.vy += 0.3;
      const c = Math.floor(proj.x / this.tileSize), r = Math.floor(proj.y / this.tileSize);

      if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
        if (grid[r][c] === 4) { this.activatedLevers.add(`${r},${c}`); this.projectiles.splice(i, 1); continue; }
        if (grid[r][c] === 1 || grid[r][c] === 3) { this.projectiles.splice(i, 1); continue; }
      }
      if (proj.y > this.canvas.height || proj.x < 0 || proj.x > this.canvas.width) this.projectiles.splice(i, 1);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.levelData) return;

    const grid = this.levelData.grid;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[0].length; c++) {
        const tile = grid[r][c];
        const x = c * this.tileSize, y = r * this.tileSize;

        if (tile === 1) {
          this.ctx.fillStyle = "#4a4a4a"; this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
          this.ctx.strokeStyle = "#2c2c2c"; this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        } else if (tile === 2) {
          const isPressed = this.pressedButtons.has(`${r},${c}`);
          this.ctx.fillStyle = "#e74c3c";
          const h = isPressed ? 6 : 12;
          this.ctx.fillRect(x + 4, y + this.tileSize - h, this.tileSize - 8, h);
        } else if (tile === 3) {
          this.ctx.fillStyle = "#8d6e63"; this.ctx.fillRect(x, y, this.tileSize, this.tileSize);
          this.ctx.strokeStyle = "#5d4037"; this.ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        } else if (tile === 4) {
          const isActivated = this.activatedLevers.has(`${r},${c}`);
          this.ctx.fillStyle = isActivated ? "#2ecc71" : "#f1c40f";
          this.ctx.fillRect(x + 12, y + 10, 8, 20);
          this.ctx.beginPath(); this.ctx.arc(x + 16, y + 10, 8, 0, Math.PI * 2); this.ctx.fill();
        }
      }
    }

    const gx = this.levelData.goal.x * this.tileSize, gy = this.levelData.goal.y * this.tileSize;
    this.ctx.fillStyle = "#3498db"; this.ctx.fillRect(gx, gy, this.tileSize, this.tileSize);
    this.ctx.fillStyle = "#fff"; this.ctx.font = "bold 16px sans-serif"; this.ctx.fillText("G", gx + 10, gy + 22);

    this.ctx.fillStyle = "#95a5a6";
    for (const proj of this.projectiles) {
      this.ctx.beginPath(); this.ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2); this.ctx.fill();
    }

    const p = this.player;
    this.ctx.fillStyle = "#8e5a2b"; this.ctx.fillRect(p.x, p.y + 8, p.width, p.height - 8);
    this.ctx.strokeStyle = "#4a2e13"; this.ctx.lineWidth = 2; this.ctx.strokeRect(p.x, p.y + 8, p.width, p.height - 8);
    this.ctx.fillStyle = "#7f8c8d"; this.ctx.fillRect(p.x, p.y + 12, p.width, 3); this.ctx.fillRect(p.x, p.y + 22, p.width, 3);
    this.ctx.fillStyle = "#e74c3c";
    this.ctx.beginPath(); this.ctx.moveTo(p.x, p.y + 8); this.ctx.lineTo(p.x + p.width / 2, p.y - 4); this.ctx.lineTo(p.x + p.width, p.y + 8); this.ctx.closePath(); this.ctx.fill();
    this.ctx.fillStyle = "#fff"; const eyeOffsetX = p.facingRight ? 12 : 4; this.ctx.fillRect(p.x + eyeOffsetX, p.y + 10, 4, 4);
    this.ctx.fillStyle = "#000"; this.ctx.fillRect(p.x + eyeOffsetX + (p.facingRight ? 2 : 0), p.y + 11, 2, 2);
  }

  loop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.loop());
  }
}

window.onload = () => new Game();
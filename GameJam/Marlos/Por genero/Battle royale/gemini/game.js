const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cw = canvas.width = window.innerWidth;
let ch = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
});

// Configurações do Jogo
const MAP_SIZE = 2000;
const CENTER = MAP_SIZE / 2;

// Inputs
const keys = {};
const mouse = { x: cw / 2, y: ch / 2 };
let isMouseDown = false;

window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mousedown', () => isMouseDown = true);
window.addEventListener('mouseup', () => isMouseDown = false);
window.addEventListener('click', handleClicks);

// Estados
const STATE = { MENU: 0, CLASS_SELECT: 1, PLAYING: 2, GAMEOVER: 3 };
let gameState = STATE.MENU;
let gameWon = false;

// Entidades globais
let entities = [];
let projectiles = [];
let explosions = [];
let cores = [];
let player = null;
let camera = { x: CENTER, y: CENTER };
let zoneRadius = 1500;

// Matemática
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

// Definição das Classes
const CLASSES = {
    TANK: {
        name: "Tanque", color: '#ff8800',
        hp: 200, speed: 2.8, dmg: 25, fireRate: 60, size: 1.2,
        desc: "Muita vida, dano explosivo em área. Lento.",
        passive: "Regeneração contínua de HP."
    },
    SNIPER: {
        name: "Sniper", color: '#8800ff',
        hp: 65, speed: 4.5, dmg: 50, fireRate: 70, size: 0.8,
        desc: "Muito dano, pouca vida, longo alcance. Rápido.",
        passive: "Tiros perfuram os inimigos."
    },
    SOLDIER: {
        name: "Soldado", color: '#00cc44',
        hp: 120, speed: 3.8, dmg: 18, fireRate: 35, size: 1.0,
        desc: "Equilíbrio perfeito de status.",
        passive: "Roubo de vida (cura ao causar dano)."
    }
};
const classKeys = Object.keys(CLASSES);

class Core {
    constructor(x, y) {
        this.x = x + (Math.random() - 0.5) * 40;
        this.y = y + (Math.random() - 0.5) * 40;
        this.radius = 6;
        this.color = '#00ffff';
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }
}

class Explosion {
    constructor(x, y, radius, damage, owner, color) {
        this.x = x; this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.owner = owner;
        this.color = color || '#ff4400';
        this.maxLife = 15;
        this.life = this.maxLife;
        this.hitTargets = [];
    }
    update() {
        if (this.life === this.maxLife) {
            // Causa dano no primeiro frame
            entities.forEach(e => {
                if (e !== this.owner && dist(this.x, this.y, e.x, e.y) < this.radius + e.radius) {
                    e.takeDamage(this.damage, this.owner);
                }
            });
        }
        this.life--;
    }
    draw(ctx) {
        let alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, angle, owner, isUlt = false) {
        this.x = x; this.y = y;
        this.owner = owner;
        this.angle = angle;
        
        let stats = CLASSES[owner.classType];
        let speedMult = isUlt && owner.classType === 'SNIPER' ? 3 : 1;
        let speed = (12 * speedMult);
        
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.damage = stats.dmg + (owner.level * 3);
        this.life = isUlt && owner.classType === 'SNIPER' ? 200 : 80;
        this.radius = (4 + (owner.level * 0.5)) * (isUlt ? 2 : 1);
        
        this.isExplosive = owner.classType === 'TANK';
        this.piercing = (owner.level >= 7 && owner.classType === 'SNIPER') || (isUlt && owner.classType === 'SNIPER');
        if (isUlt && owner.classType === 'TANK') this.damage *= 3;
        
        this.hitEntities = []; // Para controle de perfuração
        this.isUlt = isUlt;
    }
    
    update() {
        this.x += this.vx; this.y += this.vy;
        this.life--;
    }
    
    explode() {
        let expRadius = this.isUlt ? 200 : 60 + (this.owner.level * 5);
        explosions.push(new Explosion(this.x, this.y, expRadius, this.damage, this.owner));
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.owner.isPlayer ? '#44aaff' : CLASSES[this.owner.classType].color;
        
        if (this.isUlt && this.owner.classType === 'SNIPER') ctx.fillStyle = '#ff00ff';
        
        ctx.beginPath();
        if (this.isExplosive) {
            ctx.arc(0, 0, this.radius, 0, Math.PI*2);
        } else {
            ctx.moveTo(this.radius * 2, 0);
            ctx.lineTo(-this.radius, -this.radius);
            ctx.lineTo(-this.radius, this.radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

class Entity {
    constructor(x, y, isPlayer, classType) {
        this.x = x; this.y = y;
        this.isPlayer = isPlayer;
        this.classType = classType;
        this.level = 1;
        this.coreCount = 0;
        
        let stats = CLASSES[this.classType];
        this.baseSpeed = stats.speed;
        this.angle = 0;
        
        // Cooldowns
        this.attackCd = 0;
        this.skill1Cd = 0; // Lv 5
        this.ultCd = 0;    // Lv 10
        
        // Buffs
        this.rapidFireTimer = 0;
        
        this.updateStats();
        this.hp = this.maxHp;
    }

    updateStats() {
        let stats = CLASSES[this.classType];
        let sizeMult = stats.size;
        
        if (this.level <= 3) { this.baseRadius = 15; this.hpMult = 1; }
        else if (this.level <= 7) { this.baseRadius = 22.5; this.hpMult = 1.5; }
        else if (this.level <= 9) { this.baseRadius = 30; this.hpMult = 2.5; }
        else { this.baseRadius = 45; this.hpMult = 5.0; }
        
        this.radius = this.baseRadius * sizeMult;
        let oldMax = this.maxHp || (stats.hp * this.hpMult);
        this.maxHp = stats.hp * this.hpMult;
        
        if (this.hp) this.hp += (this.maxHp - oldMax); // Ajusta HP ao subir de nível
    }

    takeDamage(amount, attacker) {
        this.hp -= amount;
        // Passiva Soldado: Roubo de vida
        if (attacker && attacker.level >= 7 && attacker.classType === 'SOLDIER') {
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + (amount * 0.3));
        }
    }

    getDropCount() {
        if (this.level <= 3) return 1;
        if (this.level <= 7) return 2;
        if (this.level <= 9) return 3;
        return 5;
    }

    getLevelRequirement() {
        if (this.level <= 3) return 1;
        if (this.level <= 7) return 2;
        if (this.level <= 9) return 3;
        return 999; 
    }

    collectCore() {
        if (this.level === 10) return;
        this.coreCount++;
        let req = this.getLevelRequirement();
        if (this.coreCount >= req) {
            this.coreCount -= req;
            this.level++;
            this.updateStats();
            this.hp = Math.min(this.hp + (this.maxHp * 0.2), this.maxHp); 
        }
    }

    shoot() {
        if (this.attackCd > 0) return;
        
        let fireRate = CLASSES[this.classType].fireRate;
        if (this.rapidFireTimer > 0) fireRate *= 0.3; // Buff da habilidade do Soldado
        if (this.level >= 8 && this.level <= 9) fireRate *= 0.7; // Evolução passiva de tiro
        
        this.attackCd = fireRate;
        
        if (this.level <= 3 || this.classType === 'SNIPER') {
            projectiles.push(new Projectile(this.x, this.y, this.angle, this));
        } else if (this.level >= 4 && this.level <= 7) {
            projectiles.push(new Projectile(this.x, this.y, this.angle, this));
            projectiles.push(new Projectile(this.x, this.y, this.angle - 0.2, this));
            projectiles.push(new Projectile(this.x, this.y, this.angle + 0.2, this));
        } else if (this.level >= 8) { // Spread maior para tank/soldier no late game
            projectiles.push(new Projectile(this.x, this.y, this.angle, this));
            projectiles.push(new Projectile(this.x, this.y, this.angle - 0.3, this));
            projectiles.push(new Projectile(this.x, this.y, this.angle + 0.3, this));
        }
    }

    useSkill1() { // Requer Level 5
        if (this.level < 5 || this.skill1Cd > 0) return;
        this.skill1Cd = 300; // 5 segundos
        
        if (this.classType === 'TANK') {
            explosions.push(new Explosion(this.x, this.y, 120, 40 + this.level*5, this, '#ffaa00'));
        } else if (this.classType === 'SNIPER') {
            // Dash para trás
            this.x -= Math.cos(this.angle) * 150;
            this.y -= Math.sin(this.angle) * 150;
        } else if (this.classType === 'SOLDIER') {
            this.rapidFireTimer = 180; // 3 segundos de tiro rápido
        }
    }

    useUltimate() { // Requer Level 10
        if (this.level < 10 || this.ultCd > 0) return;
        this.ultCd = 600; // 10 segundos
        
        if (this.classType === 'TANK') {
            projectiles.push(new Projectile(this.x, this.y, this.angle, this, true));
        } else if (this.classType === 'SNIPER') {
            projectiles.push(new Projectile(this.x, this.y, this.angle, this, true)); // Railgun
        } else if (this.classType === 'SOLDIER') {
            // Supernova 360
            for (let i = 0; i < 16; i++) {
                projectiles.push(new Projectile(this.x, this.y, this.angle + (Math.PI*2/16)*i, this));
            }
        }
    }

    update() {
        // Redução de Cooldowns
        if (this.attackCd > 0) this.attackCd--;
        if (this.skill1Cd > 0) this.skill1Cd--;
        if (this.ultCd > 0) this.ultCd--;
        if (this.rapidFireTimer > 0) this.rapidFireTimer--;
        
        // Passiva Tanque: Regen Lv 7+
        if (this.level >= 7 && this.classType === 'TANK' && this.hp < this.maxHp) {
            this.hp += 0.05;
        }
        
        // Dano da zona
        let dCenter = dist(this.x, this.y, CENTER, CENTER);
        if (dCenter > zoneRadius) this.hp -= 0.5;

        let speed = this.baseSpeed;

        if (this.isPlayer) {
            let dx = 0, dy = 0;
            if (keys['w'] || keys['arrowup']) dy -= 1;
            if (keys['s'] || keys['arrowdown']) dy += 1;
            if (keys['a'] || keys['arrowleft']) dx -= 1;
            if (keys['d'] || keys['arrowright']) dx += 1;

            if (dx !== 0 && dy !== 0) {
                const norm = Math.hypot(dx, dy);
                dx /= norm; dy /= norm;
            }

            this.x += dx * speed;
            this.y += dy * speed;

            // Mira
            let mxWorld = mouse.x - cw/2 + camera.x;
            let myWorld = mouse.y - ch/2 + camera.y;
            this.angle = Math.atan2(myWorld - this.y, mxWorld - this.x);
            
            this.shoot();
            
            // Habilidades do Player
            if (keys[' ']) this.useSkill1();
            if (keys['shift']) this.useUltimate();

        } else {
            // IA AVANÇADA DOS BOTS
            let dGas = dCenter - zoneRadius;
            let targetX = this.x, targetY = this.y;
            let forceShoot = false;
            let moving = false;

            // Busca inimigo mais próximo
            let bestEnemy = null;
            let minEDist = 1500;
            entities.forEach(e => {
                if (e !== this) {
                    let d = dist(this.x, this.y, e.x, e.y);
                    if (d < minEDist) { minEDist = d; bestEnemy = e; }
                }
            });

            // Regra 1: Fugir do gás se estiver perto
            if (dGas > -200) {
                targetX = CENTER; targetY = CENTER; moving = true;
            } 
            else if (bestEnemy) {
                // Comportamento por Classe
                this.angle = Math.atan2(bestEnemy.y - this.y, bestEnemy.x - this.x);
                
                if (this.classType === 'SNIPER') {
                    if (minEDist < 350) { // Foge se muito perto
                        targetX = this.x - (bestEnemy.x - this.x);
                        targetY = this.y - (bestEnemy.y - this.y);
                        moving = true;
                        if (minEDist < 200) this.useSkill1(); // Usa dash para fugir
                    } else if (minEDist < 800) {
                        forceShoot = true; // Mantém distância e atira
                    }
                    if (minEDist < 900 && Math.random() < 0.01) this.useUltimate();
                } 
                else if (this.classType === 'TANK') {
                    if (minEDist < 150) this.useSkill1(); // Slam
                    if (minEDist < 400 && Math.random() < 0.01) this.useUltimate();
                    
                    if (minEDist > 100) { // Avança brutalmente
                        targetX = bestEnemy.x; targetY = bestEnemy.y; moving = true;
                    }
                    if (minEDist < 400) forceShoot = true;
                }
                else if (this.classType === 'SOLDIER') {
                    if (minEDist < 250) this.useSkill1(); // Rapid fire
                    if (minEDist < 300 && Math.random() < 0.01) this.useUltimate();
                    
                    if (minEDist > 300) { // Flanqueia / Aproxima moderadamente
                        targetX = bestEnemy.x; targetY = bestEnemy.y; moving = true;
                    }
                    if (minEDist < 500) forceShoot = true;
                }
            } 
            
            // Se não estiver lutando nem fugindo do gás, busca núcleos
            if (!moving && !forceShoot) {
                let bestCore = null;
                let minCDist = 600;
                cores.forEach(c => {
                    let d = dist(this.x, this.y, c.x, c.y);
                    if (d < minCDist) { minCDist = d; bestCore = c; }
                });

                if (bestCore) {
                    targetX = bestCore.x; targetY = bestCore.y; moving = true;
                } else {
                    // Andar aleatório
                    if (Math.random() < 0.02) this.wanderAngle = Math.random() * Math.PI * 2;
                    targetX = this.x + Math.cos(this.wanderAngle || 0) * 100;
                    targetY = this.y + Math.sin(this.wanderAngle || 0) * 100;
                    moving = true;
                }
            }

            if (moving) {
                let moveDx = targetX - this.x;
                let moveDy = targetY - this.y;
                let moveDist = Math.hypot(moveDx, moveDy);
                if (moveDist > 5) {
                    this.x += (moveDx / moveDist) * speed;
                    this.y += (moveDy / moveDist) * speed;
                }
            }
            if (forceShoot) this.shoot();
        }

        // Limites do mapa
        this.x = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.y));
    }

    draw(ctx) {
        ctx.fillStyle = this.isPlayer ? '#2288ff' : CLASSES[this.classType].color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Direção
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + Math.cos(this.angle) * (this.radius + 10), this.y + Math.sin(this.angle) * (this.radius + 10));
        ctx.stroke();

        // Barra HP
        let hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#f00';
        ctx.fillRect(this.x - 20, this.y - this.radius - 15, 40, 5);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(this.x - 20, this.y - this.radius - 15, 40 * hpPct, 5);

        // Nível e Classe
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let classInit = this.classType === 'TANK' ? 'T' : (this.classType === 'SNIPER' ? 'S' : 'M');
        ctx.fillText(`Lv.${this.level} [${classInit}]`, this.x, this.y - this.radius - 25);
    }
}

function initGame(playerClass) {
    entities = []; projectiles = []; explosions = []; cores = [];
    zoneRadius = 1500;
    
    // Spawn Player
    player = new Entity(CENTER + (Math.random()-0.5)*500, CENTER + (Math.random()-0.5)*500, true, playerClass);
    entities.push(player);

    // Spawn 19 Bots
    for (let i = 0; i < 99; i++) {
        let bx, by;
        do {
            bx = Math.random() * MAP_SIZE;
            by = Math.random() * MAP_SIZE;
        } while (dist(bx, by, player.x, player.y) < 500); 
        
        let randomClass = classKeys[Math.floor(Math.random() * classKeys.length)];
        entities.push(new Entity(bx, by, false, randomClass));
    }
    
    gameState = STATE.PLAYING;
}

function handleClicks(e) {
    if (gameState === STATE.MENU || gameState === STATE.GAMEOVER) {
        gameState = STATE.CLASS_SELECT;
    } else if (gameState === STATE.CLASS_SELECT) {
        // Lógica de clique nas caixas de classe
        let boxWidth = 250;
        let startX = cw/2 - (boxWidth * 1.5) - 20;
        
        for(let i=0; i<3; i++) {
            let x = startX + i * (boxWidth + 20);
            let y = ch/2 - 150;
            if (e.clientX >= x && e.clientX <= x + boxWidth && e.clientY >= y && e.clientY <= y + 300) {
                initGame(classKeys[i]);
                break;
            }
        }
    }
}

function update() {
    if (gameState !== STATE.PLAYING) return;

    if (zoneRadius > 50) zoneRadius -= 0.15;

    explosions.forEach(exp => exp.update());
    explosions = explosions.filter(exp => exp.life > 0);

    entities.forEach(e => e.update());

    // Fricção/Colisão entre Entidades
    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            let e1 = entities[i]; let e2 = entities[j];
            let dx = e2.x - e1.x; let dy = e2.y - e1.y;
            let d = Math.hypot(dx, dy);
            let minDist = e1.radius + e2.radius;
            
            if (d < minDist && d > 0) {
                let overlap = minDist - d;
                let nx = dx / d; let ny = dy / d;
                e1.x -= nx * overlap / 2; e1.y -= ny * overlap / 2;
                e2.x += nx * overlap / 2; e2.y += ny * overlap / 2;
            }
        }
    }

    // Projéteis vs Entidades
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.update();
        let hit = false;
        
        for (let j = 0; j < entities.length; j++) {
            let e = entities[j];
            if (p.owner !== e && dist(p.x, p.y, e.x, e.y) < e.radius + p.radius) {
                if (!p.hitEntities.includes(e)) {
                    e.takeDamage(p.damage, p.owner);
                    p.hitEntities.push(e);
                    if (!p.piercing) hit = true;
                }
            }
        }
        
        if (hit || p.life <= 0 || p.x < 0 || p.x > MAP_SIZE || p.y < 0 || p.y > MAP_SIZE) {
            if (p.isExplosive) p.explode();
            projectiles.splice(i, 1);
        }
    }

    // Coleta de Núcleos
    for (let i = cores.length - 1; i >= 0; i--) {
        let c = cores[i];
        let collected = false;
        for (let j = 0; j < entities.length; j++) {
            let e = entities[j];
            if (dist(c.x, c.y, e.x, e.y) < e.radius + c.radius) {
                e.collectCore(); collected = true; break;
            }
        }
        if (collected) cores.splice(i, 1);
    }

    // Morte de Entidades
    for (let i = entities.length - 1; i >= 0; i--) {
        let e = entities[i];
        if (e.hp <= 0) {
            let drops = e.getDropCount();
            for(let d = 0; d < drops; d++) cores.push(new Core(e.x, e.y));
            if (e.isPlayer) {
                gameState = STATE.GAMEOVER; gameWon = false;
            }
            entities.splice(i, 1);
        }
    }

    if (player && player.hp > 0) {
        camera.x += (player.x - camera.x) * 0.1;
        camera.y += (player.y - camera.y) * 0.1;
    }

    if (entities.length === 1 && entities[0].isPlayer) {
        gameState = STATE.GAMEOVER; gameWon = true;
    }
}

function drawGrid(ctx) {
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    let step = 100;
    let startX = Math.floor((camera.x - cw/2) / step) * step;
    let startY = Math.floor((camera.y - ch/2) / step) * step;
    ctx.beginPath();
    for (let x = startX; x < camera.x + cw/2; x += step) {
        if(x >= 0 && x <= MAP_SIZE) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_SIZE); }
    }
    for (let y = startY; y < camera.y + ch/2; y += step) {
        if(y >= 0 && y <= MAP_SIZE) { ctx.moveTo(0, y); ctx.lineTo(MAP_SIZE, y); }
    }
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, cw, ch);

    if (gameState === STATE.PLAYING || gameState === STATE.GAMEOVER) {
        ctx.save();
        ctx.translate(cw/2 - camera.x, ch/2 - camera.y);

        ctx.fillStyle = '#222'; ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
        drawGrid(ctx);

        // Zona Segura
        ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, Math.max(0, zoneRadius), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(CENTER, CENTER, Math.max(0, zoneRadius), 0, Math.PI * 2);
        ctx.stroke();

        cores.forEach(c => c.draw(ctx));
        projectiles.forEach(p => p.draw(ctx));
        explosions.forEach(e => e.draw(ctx));
        entities.forEach(e => e.draw(ctx));

        ctx.strokeStyle = '#fff'; ctx.lineWidth = 5;
        ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
        ctx.restore();

        // UI HUD
        if (gameState === STATE.PLAYING && player) {
            ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.font = '24px Arial';
            ctx.fillText(`Vivos: ${entities.length}`, 20, 20);
            ctx.fillText(`Level: ${player.level} / 10`, 20, 50);
            
            if (player.level < 10) {
                ctx.fillText(`Núcleos: ${player.coreCount} / ${player.getLevelRequirement()}`, 20, 80);
            }
            
            // Habilidades UI
            ctx.font = '18px Arial';
            let sk1Text = player.level >= 5 ? (player.skill1Cd > 0 ? `Ativa (Espaço): ${(player.skill1Cd/60).toFixed(1)}s` : 'Ativa (Espaço): PRONTO') : 'Ativa (Espaço): Bloqueado (Nv 5)';
            let passText = player.level >= 7 ? `Passiva: Ativa!` : 'Passiva: Bloqueado (Nv 7)';
            let ultText = player.level >= 10 ? (player.ultCd > 0 ? `ULT (Shift): ${(player.ultCd/60).toFixed(1)}s` : 'ULT (Shift): PRONTO') : 'ULT (Shift): Bloqueado (Nv 10)';
            
            ctx.fillStyle = player.level >= 5 && player.skill1Cd === 0 ? '#00ff00' : '#888';
            ctx.fillText(sk1Text, 20, ch - 100);
            ctx.fillStyle = player.level >= 7 ? '#00ffff' : '#888';
            ctx.fillText(passText, 20, ch - 70);
            ctx.fillStyle = player.level >= 10 && player.ultCd === 0 ? '#ff00ff' : '#888';
            ctx.fillText(ultText, 20, ch - 40);
        }
    }

    if (gameState === STATE.MENU) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 50px Arial';
        ctx.fillText('MICRO ROYALE: CLASSES', cw/2, ch/2 - 40);
        ctx.font = '24px Arial'; ctx.fillStyle = '#ffcc00';
        ctx.fillText('CLIQUE PARA INICIAR', cw/2, ch/2 + 60);
    }

    if (gameState === STATE.CLASS_SELECT) {
        ctx.fillStyle = 'rgba(0,0,0,0.9)'; ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.font = 'bold 40px Arial';
        ctx.fillText('ESCOLHA SUA CLASSE', cw/2, 100);
        
        let boxWidth = 250;
        let startX = cw/2 - (boxWidth * 1.5) - 20;
        
        classKeys.forEach((key, i) => {
            let cls = CLASSES[key];
            let x = startX + i * (boxWidth + 20);
            let y = ch/2 - 150;
            
            ctx.fillStyle = '#333';
            ctx.fillRect(x, y, boxWidth, 300);
            ctx.strokeStyle = cls.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, boxWidth, 300);
            
            ctx.fillStyle = cls.color;
            ctx.font = 'bold 28px Arial';
            ctx.fillText(cls.name, x + boxWidth/2, y + 40);
            
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            wrapText(ctx, cls.desc, x + 20, y + 90, boxWidth - 40, 22);
            
            ctx.fillStyle = '#aaa';
            ctx.fillText("Passiva (Nv 7):", x + boxWidth/2, y + 200);
            ctx.fillStyle = '#00ffff';
            wrapText(ctx, cls.passive, x + 20, y + 230, boxWidth - 40, 20);
        });
    }

    if (gameState === STATE.GAMEOVER) {
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, cw, ch);
        ctx.textAlign = 'center'; ctx.font = 'bold 60px Arial';
        ctx.fillStyle = gameWon ? '#00ff00' : '#ff0000';
        ctx.fillText(gameWon ? 'VITÓRIA!' : 'VOCÊ MORREU!', cw/2, ch/2 - 20);
        ctx.fillStyle = '#fff'; ctx.font = '30px Arial';
        ctx.fillText('CLIQUE PARA REINICIAR', cw/2, ch/2 + 60);
    }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x + maxWidth/2, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x + maxWidth/2, y);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
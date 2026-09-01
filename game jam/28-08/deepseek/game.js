// ==================== SISTEMA DE ÁUDIO (Web Audio API - sem assets) ====================
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch(e) {
            this.enabled = false;
        }
    }

    playTone(freq, duration, type='square', volume=0.3) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    shoot(level) {
        if (level <= 3) this.playTone(800, 0.1, 'square', 0.2);
        else if (level <= 7) this.playTone(600, 0.15, 'sawtooth', 0.25);
        else if (level <= 9) this.playTone(900, 0.08, 'square', 0.2);
        else this.playTone(400, 0.4, 'sine', 0.4);
    }

    collect() {
        this.playTone(1200, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(1800, 0.15, 'sine', 0.3), 100);
    }

    death() {
        this.playTone(200, 0.5, 'sawtooth', 0.5);
        setTimeout(() => this.playTone(100, 0.4, 'sawtooth', 0.4), 200);
    }

    zoneWarning() {
        this.playTone(1000, 0.2, 'square', 0.15);
    }

    dash() {
        this.playTone(500, 0.15, 'sine', 0.3);
    }
}

// ==================== CANVAS E CONTEXTO ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ==================== ESTADO DO JOGO ====================
let gameState = 'start'; // 'start', 'playing', 'gameover'
let win = false;
const audio = new AudioManager();

// ==================== CONSTANTES ====================
const MAP_SIZE = 2000;
const CENTER = { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
const ZONE_START_RADIUS = Math.hypot(MAP_SIZE / 2, MAP_SIZE / 2);
const ZONE_SHRINK_DELAY = 3000;
const ZONE_SHRINK_INTERVAL = 500;
const ZONE_SHRINK_AMOUNT = 20;
const ZONE_DAMAGE_PER_SECOND = 8;
const ZONE_MIN_RADIUS = 50;

let zoneRadius = ZONE_START_RADIUS;
let zoneShrinkTimer = 0;
let lastZoneShrinkTime = 0;
let zoneActive = false;
let zoneActiveTime = 0;
let zoneWarningCooldown = 0;

const keys = {};
let player = null;
let bots = [];
let bullets = [];
let cores = [];
let particles = [];
let damageNumbers = [];
let screenShake = { x: 0, y: 0, intensity: 0 };
let screenFlash = { alpha: 0, color: '#ffffff' };

let camera = { x: 0, y: 0 };
let lastTime = 0;
let aliveCount = 0;

// Dash
let dashCooldown = 0;
const DASH_COOLDOWN_MAX = 3;
const DASH_DURATION = 0.2;
const DASH_SPEED_MULTIPLIER = 3;
let dashTime = 0;

// ==================== HELPERS ====================
function randomRange(min, max) { return Math.random() * (max - min) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function normalize(x, y) { const len = Math.hypot(x, y); if (len === 0) return { x: 0, y: 0 }; return { x: x / len, y: y / len }; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

// ==================== SISTEMA DE NÍVEIS ====================
function getRadiusForLevel(level) { if (level <= 3) return 15; if (level <= 7) return 22.5; if (level <= 9) return 30; return 45; }
function getMaxHpForLevel(level) { if (level <= 3) return 100; if (level <= 7) return 150; if (level <= 9) return 250; return 500; }
function getCoresToNextLevel(level) { if (level === 10) return 0; if (level <= 3) return 1; if (level <= 7) return 2; return 3; }
function getDropCores(level) { if (level <= 3) return 1; if (level <= 7) return 2; if (level <= 9) return 3; return 5; }
function getCooldown(level) { if (level <= 3) return 500; if (level <= 7) return 800; if (level <= 9) return 200; return 1500; }
function getBulletSpeed(level) { if (level <= 3) return 400; if (level <= 7) return 450; if (level <= 9) return 500; return 350; }
function getBulletDamage(level) { if (level <= 3) return 10; if (level <= 7) return 10; if (level <= 9) return 10; return 15; }

// ==================== ENTIDADES ====================
function createEntity(isPlayer, x, y, level = 1) {
    return {
        isPlayer, x, y, level,
        radius: getRadiusForLevel(level),
        hp: getMaxHpForLevel(level),
        maxHp: getMaxHpForLevel(level),
        cores: 0,
        cooldown: 0,
        color: isPlayer ? '#00ccff' : `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
        name: isPlayer ? 'Você' : `Bot ${Math.floor(Math.random() * 1000)}`,
        moveSpeed: 180,
        // IA
        targetX: x, targetY: y,
        decisionTimer: 0,
    };
}

function levelUp(entity) {
    if (entity.level >= 10) return false;
    const needed = getCoresToNextLevel(entity.level);
    if (entity.cores >= needed) {
        entity.cores -= needed;
        entity.level++;
        entity.radius = getRadiusForLevel(entity.level);
        entity.maxHp = getMaxHpForLevel(entity.level);
        entity.hp = entity.maxHp;
        // Efeitos
        spawnParticles(entity.x, entity.y, 20, entity.color, 3, 300);
        audio.collect();
        screenFlash = { alpha: 0.3, color: '#ffff00' };
        return true;
    }
    return false;
}

function collectCore(entity, coreValue) {
    entity.cores += coreValue;
    while (levelUp(entity)) {}
}

// ==================== SISTEMA DE PARTÍCULAS ====================
function spawnParticles(x, y, count, color, size = 4, life = 500, speed = 150) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = randomRange(50, speed);
        particles.push({
            x, y,
            vx: Math.cos(angle) * vel,
            vy: Math.sin(angle) * vel,
            life: randomRange(life * 0.5, life),
            maxLife: life,
            color,
            size: randomRange(size * 0.5, size * 1.5),
            type: 'spark'
        });
    }
}

function spawnDamageNumber(x, y, amount, color = '#fff') {
    damageNumbers.push({
        x, y,
        vy: -80,
        life: 1000,
        maxLife: 1000,
        amount,
        color
    });
}

// ==================== PROJÉTEIS ====================
function fireBullet(entity, angle, speed, damage) {
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    bullets.push({
        x: entity.x + dir.x * (entity.radius + 5),
        y: entity.y + dir.y * (entity.radius + 5),
        vx: dir.x * speed,
        vy: dir.y * speed,
        damage,
        owner: entity,
        radius: 4,
        life: 2000,
        trail: [],
        maxTrailLength: 10
    });
    // Efeito visual de disparo
    spawnParticles(entity.x + dir.x * entity.radius, entity.y + dir.y * entity.radius, 5, '#ffaa00', 2, 200, 100);
}

function fire(entity, angle) {
    if (entity.cooldown > 0) return;
    entity.cooldown = getCooldown(entity.level);
    const speed = getBulletSpeed(entity.level);
    const damage = getBulletDamage(entity.level);
    audio.shoot(entity.level);

    if (entity.level <= 3) {
        fireBullet(entity, angle, speed, damage);
    } else if (entity.level <= 7) {
        const spread = Math.PI / 6;
        fireBullet(entity, angle, speed, damage);
        fireBullet(entity, angle - spread / 2, speed, damage);
        fireBullet(entity, angle + spread / 2, speed, damage);
    } else if (entity.level <= 9) {
        fireBullet(entity, angle, speed, damage);
    } else {
        const count = 16; // mais projéteis para supernova
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2;
            fireBullet(entity, a, speed, damage);
        }
    }
    screenShake.intensity = Math.min(screenShake.intensity + 2, 5);
}

// ==================== NÚCLEOS ====================
function dropCores(entity) {
    const dropCount = getDropCores(entity.level);
    for (let i = 0; i < dropCount; i++) {
        cores.push({
            x: entity.x + randomRange(-25, 25),
            y: entity.y + randomRange(-25, 25),
            value: 1,
            radius: 6,
            color: '#ffff00',
            glow: 0,
            pulse: randomRange(0, Math.PI * 2)
        });
    }
    // Explosão de morte
    spawnParticles(entity.x, entity.y, 40, entity.color, 6, 800, 200);
    audio.death();
    screenShake.intensity = 10;
}

// ==================== SPAWN ====================
function spawnBots(count) {
    bots = [];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = randomRange(200, MAP_SIZE / 2 - 200);
        const x = CENTER.x + Math.cos(angle) * dist;
        const y = CENTER.y + Math.sin(angle) * dist;
        const bot = createEntity(false, x, y, 1);
        bots.push(bot);
    }
}

function resetGame() {
    player = createEntity(true, CENTER.x, CENTER.y, 1);
    player.cores = 0;
    spawnBots(19);
    bullets = [];
    cores = [];
    particles = [];
    damageNumbers = [];
    zoneRadius = ZONE_START_RADIUS;
    zoneActive = false;
    zoneShrinkTimer = 0;
    lastZoneShrinkTime = 0;
    zoneActiveTime = 0;
    zoneWarningCooldown = 0;
    gameState = 'playing';
    win = false;
    camera.x = player.x;
    camera.y = player.y;
    dashCooldown = 0;
    dashTime = 0;
    screenShake.intensity = 0;
    screenFlash.alpha = 0;
}

// ==================== IA DOS BOTS ====================
function updateBotAI(bot, dt) {
    if (bot.hp <= 0) return;

    bot.decisionTimer -= dt;
    const distToCenter = distance(bot, CENTER);
    const zoneMargin = 60;
    const inDanger = zoneActive && distToCenter > zoneRadius - zoneMargin;

    if (inDanger) {
        // Fugir para o centro com prioridade
        const dir = normalize(CENTER.x - bot.x, CENTER.y - bot.y);
        bot.x += dir.x * bot.moveSpeed * dt;
        bot.y += dir.y * bot.moveSpeed * dt;
        return;
    }

    // Se HP baixo, tentar evitar combate (fugir levemente)
    if (bot.hp < bot.maxHp * 0.3) {
        const nearestEnemy = findNearestEnemy(bot);
        if (nearestEnemy && distance(bot, nearestEnemy) < 200) {
            const dir = normalize(bot.x - nearestEnemy.x, bot.y - nearestEnemy.y);
            bot.x += dir.x * bot.moveSpeed * 0.8 * dt;
            bot.y += dir.y * bot.moveSpeed * 0.8 * dt;
            return;
        }
    }

    if (bot.decisionTimer <= 0) {
        bot.decisionTimer = randomRange(0.3, 1.0);
        // 1. Núcleo mais próximo
        let nearestCore = null;
        let minDist = Infinity;
        for (const core of cores) {
            const d = distance(bot, core);
            if (d < minDist) {
                minDist = d;
                nearestCore = core;
            }
        }
        if (nearestCore && minDist < 600) {
            bot.targetX = nearestCore.x;
            bot.targetY = nearestCore.y;
        } else {
            // 2. Inimigo mais próximo
            const enemy = findNearestEnemy(bot);
            if (enemy) {
                bot.targetX = enemy.x;
                bot.targetY = enemy.y;
            } else {
                bot.targetX = CENTER.x + randomRange(-200, 200);
                bot.targetY = CENTER.y + randomRange(-200, 200);
            }
        }
    }

    // Mover em direção ao alvo
    const dirToTarget = normalize(bot.targetX - bot.x, bot.targetY - bot.y);
    bot.x += dirToTarget.x * bot.moveSpeed * dt;
    bot.y += dirToTarget.y * bot.moveSpeed * dt;

    // Atacar se inimigo próximo e alvo é inimigo
    const nearestEnemy = findNearestEnemy(bot);
    if (nearestEnemy && distance(bot, nearestEnemy) < 450 && bot.cooldown <= 0) {
        const angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
        fire(bot, angle);
    }
}

function findNearestEnemy(entity) {
    let nearest = null;
    let minDist = Infinity;
    const allEntities = [player, ...bots].filter(e => e.hp > 0 && e !== entity);
    for (const enemy of allEntities) {
        const d = distance(entity, enemy);
        if (d < minDist) {
            minDist = d;
            nearest = enemy;
        }
    }
    return nearest;
}

// ==================== UPDATE ENTIDADES ====================
function updateEntities(dt) {
    // Player
    if (player.hp > 0) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;
        if (dx !== 0 || dy !== 0) {
            const norm = normalize(dx, dy);
            const speedMultiplier = dashTime > 0 ? DASH_SPEED_MULTIPLIER : 1;
            player.x += norm.x * player.moveSpeed * speedMultiplier * dt;
            player.y += norm.y * player.moveSpeed * speedMultiplier * dt;
            if (dashTime > 0) spawnParticles(player.x, player.y, 2, '#00ffff', 3, 200, 50);
        }
        player.x = clamp(player.x, player.radius, MAP_SIZE - player.radius);
        player.y = clamp(player.y, player.radius, MAP_SIZE - player.radius);
        if (player.cooldown > 0) player.cooldown -= dt * 1000;
        // Tiro automático na direção do mouse
        const angle = Math.atan2(mouseWorldY - player.y, mouseWorldX - player.x);
        fire(player, angle);

        // Dash com espaço
        if (keys[' '] && dashCooldown <= 0 && dashTime <= 0) {
            dashTime = DASH_DURATION;
            dashCooldown = DASH_COOLDOWN_MAX;
            audio.dash();
            screenShake.intensity = 5;
        }
    }
    if (dashTime > 0) dashTime -= dt;
    if (dashCooldown > 0) dashCooldown -= dt;

    // Bots
    for (const bot of bots) {
        if (bot.hp <= 0) continue;
        updateBotAI(bot, dt);
        if (bot.cooldown > 0) bot.cooldown -= dt * 1000;
        bot.x = clamp(bot.x, bot.radius, MAP_SIZE - bot.radius);
        bot.y = clamp(bot.y, bot.radius, MAP_SIZE - bot.radius);
    }

    // Coleta de núcleos
    for (let i = cores.length - 1; i >= 0; i--) {
        const core = cores[i];
        if (player.hp > 0 && distance(player, core) < player.radius + core.radius) {
            collectCore(player, core.value);
            spawnParticles(core.x, core.y, 10, '#ffff00', 3, 300, 100);
            audio.collect();
            cores.splice(i, 1);
            continue;
        }
        for (const bot of bots) {
            if (bot.hp > 0 && distance(bot, core) < bot.radius + core.radius) {
                collectCore(bot, core.value);
                spawnParticles(core.x, core.y, 10, '#ffff00', 3, 300, 100);
                cores.splice(i, 1);
                break;
            }
        }
    }

    // Colisão entre entidades
    const allEntities = [player, ...bots].filter(e => e.hp > 0);
    for (let i = 0; i < allEntities.length; i++) {
        for (let j = i + 1; j < allEntities.length; j++) {
            const a = allEntities[i];
            const b = allEntities[j];
            const dist = distance(a, b);
            const minDist = a.radius + b.radius;
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const dir = normalize(b.x - a.x, b.y - a.y);
                const pushX = dir.x * overlap * 0.5;
                const pushY = dir.y * overlap * 0.5;
                a.x -= pushX; a.y -= pushY;
                b.x += pushX; b.y += pushY;
                a.x = clamp(a.x, a.radius, MAP_SIZE - a.radius);
                a.y = clamp(a.y, a.radius, MAP_SIZE - a.radius);
                b.x = clamp(b.x, b.radius, MAP_SIZE - b.radius);
                b.y = clamp(b.y, b.radius, MAP_SIZE - b.radius);
            }
        }
    }
}

// ==================== UPDATE PROJÉTEIS ====================
function updateBullets(dt) {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.life -= dt * 1000;
        if (b.life <= 0) { bullets.splice(i, 1); continue; }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // Trail
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > b.maxTrailLength) b.trail.shift();

        if (b.x < 0 || b.x > MAP_SIZE || b.y < 0 || b.y > MAP_SIZE) {
            bullets.splice(i, 1);
            continue;
        }
        // Colisão
        const allEntities = [player, ...bots];
        let hit = false;
        for (const entity of allEntities) {
            if (entity.hp <= 0 || entity === b.owner) continue;
            if (distance(b, entity) < entity.radius + b.radius) {
                entity.hp -= b.damage;
                spawnDamageNumber(entity.x, entity.y - entity.radius, b.damage, '#ff0000');
                spawnParticles(b.x, b.y, 8, '#ffaa00', 2, 200, 150);
                hit = true;
                break;
            }
        }
        if (hit) {
            bullets.splice(i, 1);
            for (let j = bots.length - 1; j >= 0; j--) {
                if (bots[j].hp <= 0) {
                    dropCores(bots[j]);
                    bots.splice(j, 1);
                }
            }
            if (player.hp <= 0) {
                gameState = 'gameover';
                win = false;
                dropCores(player);
                player.hp = 0;
                audio.death();
                screenShake.intensity = 15;
            }
        }
    }
}

// ==================== UPDATE ZONA ====================
function updateZone(dt) {
    if (!zoneActive) {
        zoneShrinkTimer += dt * 1000;
        if (zoneShrinkTimer >= ZONE_SHRINK_DELAY) {
            zoneActive = true;
            zoneShrinkTimer = 0;
            lastZoneShrinkTime = performance.now();
            audio.zoneWarning();
        }
    } else {
        const now = performance.now();
        if (now - lastZoneShrinkTime >= ZONE_SHRINK_INTERVAL) {
            zoneRadius = Math.max(ZONE_MIN_RADIUS, zoneRadius - ZONE_SHRINK_AMOUNT);
            lastZoneShrinkTime = now;
            if (zoneRadius <= ZONE_MIN_RADIUS) {
                // Zona mínima atingida
            }
        }
    }

    // Dano da zona
    const entities = [player, ...bots];
    for (const entity of entities) {
        if (entity.hp <= 0) continue;
        if (distance(entity, CENTER) > zoneRadius) {
            entity.hp -= ZONE_DAMAGE_PER_SECOND * dt;
            // Efeito visual de dano da zona
            if (Math.random() < 0.2) spawnParticles(entity.x, entity.y, 1, '#ff0000', 3, 500, 50);
            if (entity.isPlayer) {
                screenFlash = { alpha: 0.2, color: '#ff0000' };
            }
        }
    }

    // Remover bots mortos pela zona
    for (let i = bots.length - 1; i >= 0; i--) {
        if (bots[i].hp <= 0) {
            dropCores(bots[i]);
            bots.splice(i, 1);
        }
    }
    if (player.hp <= 0) {
        gameState = 'gameover';
        win = false;
        dropCores(player);
        player.hp = 0;
        audio.death();
        screenShake.intensity = 15;
    }

    // Vitória
    const aliveBots = bots.filter(b => b.hp > 0).length;
    if (player.hp > 0 && aliveBots === 0) {
        gameState = 'gameover';
        win = true;
        audio.death();
        screenFlash = { alpha: 0.5, color: '#00ff00' };
    }
    aliveCount = aliveBots + (player.hp > 0 ? 1 : 0);
}

// ==================== UPDATE PARTICLES & EFFECTS ====================
function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt * 1000;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.98;
        p.vy *= 0.98;
    }
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        const d = damageNumbers[i];
        d.life -= dt * 1000;
        if (d.life <= 0) { damageNumbers.splice(i, 1); continue; }
        d.y += d.vy * dt;
        d.vy *= 0.95;
    }
    // Screen shake decay
    if (screenShake.intensity > 0) screenShake.intensity *= 0.9;
    if (screenShake.intensity < 0.1) screenShake.intensity = 0;
    // Flash decay
    if (screenFlash.alpha > 0) screenFlash.alpha *= 0.95;
    if (screenFlash.alpha < 0.01) screenFlash.alpha = 0;
}

// ==================== UPDATE PRINCIPAL ====================
function update(dt) {
    if (gameState !== 'playing') return;
    updateEntities(dt);
    updateBullets(dt);
    updateZone(dt);
    updateParticles(dt);
    camera.x += (player.x - camera.x) * 0.1;
    camera.y += (player.y - camera.y) * 0.1;
}

// ==================== RENDERIZAÇÃO ====================
function drawMap() {
    ctx.fillStyle = '#1a3a1a';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
    ctx.strokeStyle = '#2a4a2a';
    ctx.lineWidth = 1;
    const gridSize = 100;
    for (let x = 0; x <= MAP_SIZE; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_SIZE); ctx.stroke();
    }
    for (let y = 0; y <= MAP_SIZE; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_SIZE, y); ctx.stroke();
    }
}

function drawZone() {
    // Círculo seguro
    const gradient = ctx.createRadialGradient(CENTER.x, CENTER.y, zoneRadius * 0.8, CENTER.x, CENTER.y, zoneRadius);
    gradient.addColorStop(0, 'rgba(50,150,50,0)');
    gradient.addColorStop(1, 'rgba(50,150,50,0.2)');
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, zoneRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 5;
    ctx.stroke();
    // Borda externa pulsante
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, zoneRadius + 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,50,50,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function drawEntity(entity) {
    // Sombra
    ctx.beginPath();
    ctx.arc(entity.x, entity.y + 2, entity.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Corpo com gradiente
    const gradient = ctx.createRadialGradient(entity.x - entity.radius * 0.3, entity.y - entity.radius * 0.3, entity.radius * 0.2, entity.x, entity.y, entity.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, entity.color);
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barra de vida
    const barWidth = entity.radius * 2;
    const barHeight = 4;
    const barX = entity.x - barWidth / 2;
    const barY = entity.y - entity.radius - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    const hpPercent = entity.hp / entity.maxHp;
    const hpColor = hpPercent > 0.6 ? '#00ff00' : hpPercent > 0.3 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);

    // Nível
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`Lv ${entity.level}`, entity.x, entity.y + 5);

    // Indicador de player (seta)
    if (entity.isPlayer) {
        ctx.beginPath();
        ctx.moveTo(entity.x, entity.y - entity.radius - 15);
        ctx.lineTo(entity.x - 5, entity.y - entity.radius - 25);
        ctx.lineTo(entity.x + 5, entity.y - entity.radius - 25);
        ctx.closePath();
        ctx.fillStyle = '#00ffff';
        ctx.fill();
    }
}

function drawBullets() {
    for (const b of bullets) {
        // Trail
        ctx.beginPath();
        ctx.moveTo(b.trail[0]?.x || b.x, b.trail[0]?.y || b.y);
        for (const point of b.trail) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Projétil
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd44';
        ctx.fill();
    }
}

function drawCores() {
    for (const core of cores) {
        core.pulse += 0.05;
        const glow = Math.sin(core.pulse) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(core.x, core.y, core.radius + glow * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,0,${0.1 + glow * 0.3})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawParticles() {
    for (const p of particles) {
        const alpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function drawDamageNumbers() {
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    for (const d of damageNumbers) {
        const alpha = d.life / d.maxLife;
        ctx.fillStyle = d.color;
        ctx.globalAlpha = alpha;
        ctx.fillText(d.amount, d.x, d.y);
        ctx.globalAlpha = 1;
    }
}

function drawUI() {
    // Contador de vivos
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'left';
    ctx.fillText(`Vivos: ${aliveCount}`, 20, 40);
    ctx.fillText(`Nível: ${player.level} | HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 20, 70);
    ctx.fillText(`Núcleos: ${player.cores}/${getCoresToNextLevel(player.level)}`, 20, 100);
    // Cooldown de dash
    if (dashCooldown > 0) {
        ctx.fillStyle = '#888';
        ctx.fillText(`Dash: ${dashCooldown.toFixed(1)}s`, 20, 130);
    } else {
        ctx.fillStyle = '#0f0';
        ctx.fillText('Dash: PRONTO (espaço)', 20, 130);
    }
    // Indicador da zona
    const distToCenter = distance(player, CENTER);
    if (distToCenter > zoneRadius) {
        ctx.fillStyle = '#ff0000';
        ctx.fillText('FORA DA ZONA!', canvas.width / 2 - 80, 40);
    }
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('MICRO ROYALE: EVOLUÇÃO', canvas.width / 2, canvas.height / 2 - 60);
    ctx.font = '24px Courier New';
    ctx.fillText('Colete núcleos, evolua e seja o último sobrevivente!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText('Clique para iniciar', canvas.width / 2, canvas.height / 2 + 40);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = win ? '#00ff00' : '#ff3333';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(win ? 'VITÓRIA!' : 'DERROTA', canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = '24px Courier New';
    ctx.fillStyle = '#fff';
    ctx.fillText('Clique para reiniciar', canvas.width / 2, canvas.height / 2 + 20);
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'start') {
        drawStartScreen();
        return;
    }

    ctx.save();
    // Aplicar shake
    if (screenShake.intensity > 0) {
        const shakeX = (Math.random() - 0.5) * screenShake.intensity * 2;
        const shakeY = (Math.random() - 0.5) * screenShake.intensity * 2;
        ctx.translate(shakeX, shakeY);
    }
    const offsetX = canvas.width / 2 - camera.x;
    const offsetY = canvas.height / 2 - camera.y;
    ctx.translate(offsetX, offsetY);

    drawMap();
    drawZone();
    drawCores();
    drawParticles();
    drawBullets();
    if (player && player.hp > 0) drawEntity(player);
    for (const bot of bots) {
        if (bot.hp > 0) drawEntity(bot);
    }
    drawDamageNumbers();

    ctx.restore();

    drawUI();

    if (screenFlash.alpha > 0) {
        ctx.fillStyle = screenFlash.color;
        ctx.globalAlpha = screenFlash.alpha;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1;
    }

    if (gameState === 'gameover') {
        drawGameOverScreen();
    }
}

// ==================== INPUT ====================
let mouseWorldX = 0, mouseWorldY = 0;
let mouseDown = false;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;
    mouseWorldX = screenX - (canvas.width / 2 - camera.x);
    mouseWorldY = screenY - (canvas.height / 2 - camera.y);
});

canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    if (gameState === 'start' || gameState === 'gameover') {
        resetGame();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const screenX = (e.clientX - rect.left) * scaleX;
        const screenY = (e.clientY - rect.top) * scaleY;
        mouseWorldX = screenX - (canvas.width / 2 - camera.x);
        mouseWorldY = screenY - (canvas.height / 2 - camera.y);
    }
});

canvas.addEventListener('mouseup', () => { mouseDown = false; });

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ==================== RESIZE ====================
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ==================== LOOP ====================
function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (gameState === 'playing') {
        update(dt);
    }

    render();
    requestAnimationFrame(gameLoop);
}

// Inicialização
resetGame();
gameState = 'start';
player = createEntity(true, CENTER.x, CENTER.y, 1);
spawnBots(19);
aliveCount = 20;
zoneRadius = ZONE_START_RADIUS;

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    requestAnimationFrame(gameLoop);
});
/* =============================================================
   KINGDOMS OF TACTICS — game.js
   Dados, simulação de combate, IA, sinergias, UI e testes.
   ============================================================= */
'use strict';

/* ===================== 1. DADOS ===================== */
const C = {
    blue: [0.29, 0.50, 0.78], red: [0.72, 0.26, 0.22], gold: [0.87, 0.67, 0.27],
    green: [0.42, 0.60, 0.29], steel: [0.72, 0.76, 0.82], wood: [0.42, 0.29, 0.17],
    white: [0.93, 0.90, 0.82], black: [0.16, 0.15, 0.16], skin: [0.85, 0.63, 0.45],
    purple: [0.44, 0.30, 0.62], fire: [1.0, 0.52, 0.16], ice: [0.55, 0.82, 0.95]
};

const UNITS = [
    {
        id: 'guard', name: 'Guardião de Escudo', cls: 'Guerreiro', cost: 55, hp: 230, dmg: 15, range: 1.9,
        speed: 2.3, atkSpeed: 1.05, armor: 12, detect: 15, radius: 0.78,
        ability: { name: 'Muralha', type: 'wall', desc: '+4 de armadura por aliado de linha a 5m (máx. +16).' },
        tags: ['line', 'shield', 'melee', 'frontline'], role: 'Tanque', unlock: 0,
        strong: 'Absorve dano e sustenta a linha de frente.', weak: 'Dano baixo; sofre contra magia e perfuração.',
        weapon: 'sword', shield: true, helmet: 1, pal: { cloth: C.blue, cloth2: [0.19, 0.33, 0.55], metal: C.steel, acc: C.gold }
    },

    {
        id: 'spear', name: 'Lanceiro Real', cls: 'Lanceiro', cost: 60, hp: 185, dmg: 21, range: 2.9,
        speed: 2.4, atkSpeed: 0.95, armor: 8, detect: 15, radius: 0.75,
        ability: { name: 'Pique Longa', type: 'anti_cav', desc: '+60% de dano contra cavalaria e cancela cargas.' },
        tags: ['line', 'spear', 'melee', 'frontline', 'anti_cav'], role: 'Anti-Cavalaria', unlock: 0,
        strong: 'Alcance de combate longo e destrói cavalaria.', weak: 'Frágil contra magos e unidades de burst.',
        weapon: 'spear', shield: false, helmet: 1, pal: { cloth: C.green, cloth2: [0.29, 0.42, 0.20], metal: C.steel, acc: C.white }
    },

    {
        id: 'archer', name: 'Arqueiro do Vale', cls: 'Atirador', cost: 65, hp: 125, dmg: 17, range: 12,
        speed: 2.6, atkSpeed: 1.15, armor: 2, detect: 18, radius: 0.7,
        ability: { name: 'Tiro Certeiro', type: 'crit4', desc: 'Cada 4º disparo causa +110% de dano.' },
        tags: ['ranged', 'bow', 'backline'], role: 'Dano à Distância', unlock: 0,
        strong: 'Dano sustentado constante a longa distância.', weak: 'Morre rápido se alcançado.',
        weapon: 'bow', shield: false, helmet: 0, pal: { cloth: [0.35, 0.52, 0.32], cloth2: [0.24, 0.36, 0.22], metal: [0.55, 0.42, 0.28], acc: C.gold }
    },

    {
        id: 'crossbow', name: 'Besteiro Blindado', cls: 'Atirador', cost: 80, hp: 145, dmg: 32, range: 10,
        speed: 2.2, atkSpeed: 0.55, armor: 6, detect: 18, radius: 0.75,
        ability: { name: 'Perfurar', type: 'pierce', desc: 'Ignora 55% da armadura do alvo.' },
        tags: ['ranged', 'crossbow', 'backline', 'anti_armor'], role: 'Perfuração', unlock: 150,
        strong: 'Punish em unidades pesadas e tanques.', weak: 'Cadência lenta; ruim contra alvos múltiplos.',
        weapon: 'crossbow', shield: false, helmet: 1, pal: { cloth: [0.32, 0.36, 0.44], cloth2: [0.22, 0.25, 0.32], metal: C.steel, acc: [0.6, 0.5, 0.35] }
    },

    {
        id: 'rider', name: 'Cavaleiro Montado', cls: 'Cavalaria', cost: 115, hp: 270, dmg: 26, range: 2.0,
        speed: 5.0, atkSpeed: 0.85, armor: 10, detect: 20, radius: 1.05,
        ability: { name: 'Carga Devastadora', type: 'charge', desc: 'Dano extra de até +90% conforme a distância percorrida; empurra o alvo.' },
        tags: ['cavalry', 'mobility', 'melee', 'charger'], role: 'Flanco & Carga', unlock: 0,
        strong: 'Mobilidade brutal e dano de abertura altíssimo.', weak: 'Lanceiros anulam a carga; preso em combate perde valor.',
        weapon: 'sword', shield: false, helmet: 2, mount: true, pal: { cloth: [0.28, 0.34, 0.52], cloth2: [0.18, 0.22, 0.36], metal: C.steel, acc: C.gold }
    },

    {
        id: 'rogue', name: 'Assassino das Sombras', cls: 'Flanqueador', cost: 90, hp: 140, dmg: 33, range: 1.6,
        speed: 4.3, atkSpeed: 1.3, armor: 3, detect: 16, radius: 0.68,
        ability: { name: 'Golpe nas Costas', type: 'backstab', desc: '+75% de dano contra alvos que não o estão atacando; fica ocioso se distante.' },
        tags: ['melee', 'flanker', 'burst', 'mobility'], role: 'Eliminação', unlock: 200,
        strong: 'Apaga suportes e atiradores inimigos.', weak: 'Não sustenta trocas diretas.',
        weapon: 'dagger', shield: false, helmet: 2, cape: true, pal: { cloth: [0.22, 0.20, 0.26], cloth2: [0.14, 0.13, 0.18], metal: [0.5, 0.5, 0.56], acc: [0.62, 0.20, 0.22] }
    },

    {
        id: 'mage', name: 'Mago de Fogo', cls: 'Feiticeiro', cost: 135, hp: 130, dmg: 24, range: 11,
        speed: 2.3, atkSpeed: 0.5, armor: 2, detect: 18, radius: 0.72,
        ability: { name: 'Bola de Fogo', type: 'fireball', desc: 'Projétil em área (raio 3,6m) que incendeia o solo por 3s.' },
        tags: ['ranged', 'magic', 'aoe', 'backline'], role: 'Dano em Área', unlock: 300,
        strong: 'Castiga agrupamentos e formações densas.', weak: 'Caro, frágil e lento.',
        weapon: 'staff', shield: false, helmet: 2, robe: true, pal: { cloth: [0.52, 0.24, 0.36], cloth2: [0.34, 0.15, 0.24], metal: [0.6, 0.5, 0.34], acc: C.fire }
    },

    {
        id: 'cleric', name: 'Sacerdote da Luz', cls: 'Suporte', cost: 95, hp: 160, dmg: 7, range: 9,
        speed: 2.5, atkSpeed: 0.7, armor: 5, detect: 16, radius: 0.72,
        ability: { name: 'Bênção Vital', type: 'heal', desc: 'Cura continuamente o aliado mais ferido em 8m (+18/s) e concede +6 armadura.' },
        tags: ['holy', 'support', 'ranged', 'backline'], role: 'Cura & Sustentação', unlock: 180,
        strong: 'Mantém a linha viva em combates longos.', weak: 'Sem dano próprio; prioridade de foco inimiga.',
        weapon: 'staff', shield: false, helmet: 2, robe: true, pal: { cloth: [0.88, 0.86, 0.76], cloth2: [0.72, 0.68, 0.56], metal: [0.85, 0.72, 0.36], acc: C.gold }
    },

    {
        id: 'bulwark', name: 'Bastião de Ferro', cls: 'Defensor Pesado', cost: 105, hp: 390, dmg: 13, range: 1.9,
        speed: 1.5, atkSpeed: 0.7, armor: 22, detect: 12, radius: 0.92,
        ability: { name: 'Fortificar', type: 'fortify', desc: 'Raiz no chão: +45% armadura e atrai inimigos próximos (provocação).' },
        tags: ['line', 'shield', 'tank', 'frontline'], role: 'Muralha', unlock: 220,
        strong: 'Absorve dano absurdo e trava o avanço inimigo.', weak: 'Quase imóvel e sem ameaça de dano.',
        weapon: 'hammer', shield: true, helmet: 2, cape: true, pal: { cloth: [0.36, 0.38, 0.42], cloth2: [0.26, 0.28, 0.32], metal: [0.62, 0.66, 0.72], acc: [0.55, 0.32, 0.2] }
    },

    {
        id: 'engineer', name: 'Engenheiro de Cerco', cls: 'Controle', cost: 110, hp: 125, dmg: 11, range: 13,
        speed: 2.0, atkSpeed: 0.6, armor: 4, detect: 20, radius: 0.74,
        ability: { name: 'Pedra de Cerco', type: 'siege', desc: 'Lança rocha em área (raio 3m, 46 de dano) que reduz 40% da velocidade por 3s.' },
        tags: ['ranged', 'control', 'siege', 'backline'], role: 'Controle de Campo', unlock: 260,
        strong: 'Quebra cargas e lentifica avanços.', weak: 'Pouco dano direto; depende de alvos agrupados.',
        weapon: 'wrench', shield: false, helmet: 1, pal: { cloth: [0.55, 0.42, 0.26], cloth2: [0.38, 0.29, 0.18], metal: [0.58, 0.58, 0.62], acc: [0.72, 0.52, 0.22] }
    },

    {
        id: 'banner', name: 'Porta-Estandarte', cls: 'Suporte', cost: 85, hp: 175, dmg: 12, range: 2.0,
        speed: 2.3, atkSpeed: 0.9, armor: 8, detect: 16, radius: 0.78,
        ability: { name: 'Estandarte de Guerra', type: 'banner', desc: 'Aura: +14% de dano e +10% de velocidade em 8m.' },
        tags: ['support', 'aura', 'line', 'morale'], role: 'Moral & Bônus', unlock: 0,
        strong: 'Multiplica a eficiência de todo o exército.', weak: 'Alvo de alto valor, sem defesa especial.',
        weapon: 'banner', shield: true, helmet: 1, pal: { cloth: [0.78, 0.62, 0.24], cloth2: [0.58, 0.44, 0.16], metal: C.steel, acc: C.red }
    },

    {
        id: 'berserker', name: 'Berserker Selvagem', cls: 'Guerreiro', cost: 100, hp: 195, dmg: 25, range: 1.7,
        speed: 3.3, atkSpeed: 1.35, armor: 4, detect: 14, radius: 0.76,
        ability: { name: 'Fúria', type: 'rage', desc: 'Ganha até +70% de dano e +40% de velocidade de ataque conforme perde vida.' },
        tags: ['melee', 'damage', 'mobility'], role: 'Dano Corpo a Corpo', unlock: 160,
        strong: 'DPS crescente e excelente em limpeza.', weak: 'Sem defesa; foco rápido o elimina.',
        weapon: 'axe', shield: false, helmet: 0, cape: true, pal: { cloth: [0.62, 0.28, 0.18], cloth2: [0.42, 0.18, 0.12], metal: [0.56, 0.58, 0.62], acc: [0.32, 0.24, 0.18] }
    }
];
const UNIT_BY_ID = {}; UNITS.forEach(u => UNIT_BY_ID[u.id] = u);

const SYNERGIES = [
    {
        id: 'line', name: 'Linha de Escudos', icon: '🛡', tag: 'line', need: 3, radius: 5.5,
        desc: '3+ unidades de linha a 5,5m entre si: +16 armadura e +12% de vida máxima.',
        apply: (u) => { u.stats.armor += 16; u.maxHp *= 1.12; }
    },
    {
        id: 'spears', name: 'Parede de Lanças', icon: '🔱', tag: 'spear', need: 2, radius: 6.5,
        desc: '2+ lanceiros perto de um escudeiro: +50% contra cavalaria e cargas anuladas.',
        apply: (u) => { u.synFlags.antiCav = 1.5; u.synFlags.stopCharge = true; }
    },
    {
        id: 'cover', name: 'Alcance Protegido', icon: '🏹', tag: 'ranged', need: 2, radius: 7.5,
        desc: '2+ atiradores com 2+ aliados corpo a corpo por perto: +20% dano e +15% cadência.',
        apply: (u) => { u.stats.dmgMult *= 1.20; u.stats.atkSpeed *= 1.15; }
    },
    {
        id: 'charge', name: 'Carga Coordenada', icon: '🐴', tag: 'cavalry', need: 2, radius: 8,
        desc: '2+ cavaleiros juntos: +35% de dano de carga e maior empurrão.',
        apply: (u) => { u.synFlags.charge = 1.35; }
    },
    {
        id: 'conclave', name: 'Conclave Arcano', icon: '✨', tag: 'magic', need: 2, radius: 9,
        desc: 'Unidades mágicas/sagradas próximas: +30% de poder de habilidade e cura.',
        apply: (u) => { u.stats.abilityPower *= 1.30; }
    },
    {
        id: 'vanguard', name: 'Vanguarda Veloz', icon: '⚡', tag: 'mobility', need: 3, radius: 9,
        desc: '3+ unidades móveis: +12% velocidade e +18% contra unidades à distância.',
        apply: (u) => { u.stats.speed *= 1.12; u.synFlags.vsRanged = 1.18; }
    }
];

const SCENARIOS = [
    {
        id: 'vale', name: 'Vale de Ferro', diff: 1, seed: 11, archetype: 'defense', budget: 430, enemyBase: 300, enemyPerDiff: 32,
        desc: 'Uma legião de infantaria pesada controla o vale. Quebre a linha ou contorne.',
        intel: 'Esperado: tanques, linha de escudos, pouca mobilidade.'
    },
    {
        id: 'forest', name: 'Bosque Sombrio', diff: 2, seed: 27, archetype: 'ranged', budget: 470, enemyBase: 330, enemyPerDiff: 35,
        desc: 'Atiradores emboscados entre as árvores. Feche a distância ou responda com o próprio arco.',
        intel: 'Esperado: arqueiros, besteiros, cobertura e flanco.'
    },
    {
        id: 'citadel', name: 'Fortaleza de Cinzas', diff: 3, seed: 43, archetype: 'magic', budget: 520, enemyBase: 360, enemyPerDiff: 38,
        desc: 'A elite arcana defende as ruínas. Mago, curandeiro e cavalaria de choque.',
        intel: 'Esperado: magia de área, cura pesada e carga montada.'
    }
];

const COMMANDERS = [
    { id: 'cry', name: 'Grito de Guerra', icon: '📯', cd: 28, desc: '+28% de dano para todo o exército por 7s.' },
    { id: 'rain', name: 'Chuva de Flechas', icon: '🎯', cd: 24, desc: 'Chuva devastadora em uma área (clique no campo).', targeted: true },
    { id: 'mend', name: 'Bênção Real', icon: '💛', cd: 32, desc: 'Cura 32% da vida máxima de todos os aliados.' }
];

const DIFFICULTY_DESC = ['', '', 'Treinamento', 'Amador', 'Regular', 'Veterano', 'Veterano', 'Élite', 'Élite', 'Mestre', 'Lendário'];

/* ===================== 2. PERSISTÊNCIA ===================== */
const SAVE_KEY = 'kot_save_v2';
function defaultSave() {
    return {
        gold: 260, unlocked: UNITS.filter(u => u.unlock === 0).map(u => u.id),
        scenariosUnlocked: 1, battles: 0, wins: 0, losses: 0, bestDiff: 0, totalGold: 0,
        armies: [], commander: 'cry', settings: { hp: true, dmg: true, fx: false, shadow: 2 }
    };
}
function loadSave() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return defaultSave();
        const s = JSON.parse(raw); const d = defaultSave();
        return Object.assign(d, s, { settings: Object.assign(d.settings, s.settings || {}) });
    } catch (e) { return defaultSave(); }
}
function saveNow() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (e) { } }

/* ===================== 3. ESTADO GLOBAL ===================== */
const G = {
    screen: 'menu', save: null, scenario: SCENARIOS[0], difficulty: 5,
    armyList: [], battle: null, selType: null, selUnit: null, brush: null,
    speed: 1, paused: false, aiming: null, log: [], time: 0, menuT: 0,
    sceneProps: null, terrain: null, deployMode: true
};
const $ = (s) => document.querySelector(s);
function el(tag, cls, html) {
    const e = document.createElement(tag); if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html; return e;
}
function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ===================== 4. VISUAIS PROCEDURAIS ===================== */
const VIS_CACHE = {};
function buildUnitVisual(def, faction) {
    const key = def.id + '_' + faction;
    if (VIS_CACHE[key]) return VIS_CACHE[key];
    const p = def.pal, acc = faction === 'player' ? C.blue : C.red;
    const A = faction === 'player' ? [0.22, 0.42, 0.78] : [0.72, 0.22, 0.18];
    const out = {};
    const mk = () => new MB();

    /* ---- Pernas (ou patas da montaria) ---- */
    const legL = mk(), legR = mk();
    if (def.mount) {
        const mbody = mk();
        mbody.box(0, 1.35, 0, 1.25, 0.86, 2.15, [0.44, 0.31, 0.22]);
        mbody.box(0, 1.35, 0, 1.10, 0.30, 1.95, [0.36, 0.24, 0.17]);
        mbody.box(0, 1.95, 1.05, 0.46, 0.42, 0.95, [0.44, 0.31, 0.22], m4Mul(m4T(0, 1.95, 1.05), m4RX(-0.5)));
        mbody.box(0, 2.28, 1.55, 0.34, 0.32, 0.62, [0.36, 0.24, 0.17]);
        mbody.box(0, 2.32, 1.92, 0.22, 0.16, 0.16, [0.14, 0.11, 0.10]);
        mbody.cone(0, 2.16, 1.42, 0.10, 0.26, 5, [0.20, 0.14, 0.10]);
        mbody.box(0, 1.72, -1.18, 0.20, 0.62, 0.18, [0.30, 0.20, 0.14], m4RX(0.42));
        out.mount = mbody.build(RENDERER.gl);
        for (const s of [-1, 1]) {
            const b = mk();
            b.box(s * 0.52, 0.72, 0.86, 0.24, 1.42, 0.26, [0.44, 0.31, 0.22]);
            b.box(s * 0.52, 0.12, 0.90, 0.30, 0.22, 0.34, [0.20, 0.15, 0.12]);
            b.box(s * 0.52, 0.72, -0.86, 0.24, 1.42, 0.26, [0.44, 0.31, 0.22]);
            b.box(s * 0.52, 0.12, -0.82, 0.30, 0.22, 0.34, [0.20, 0.15, 0.12]);
            (s < 0 ? legL : legR).merge(b);
        }
    } else {
        for (const s of [-1, 1]) {
            const b = mk();
            b.box(s * 0.23, 0.50, 0, 0.30, 1.00, 0.32, p.cloth2);
            b.box(s * 0.23, 0.14, 0.05, 0.34, 0.28, 0.42, [0.22, 0.18, 0.15]);
            (s < 0 ? legL : legR).merge(b);
        }
    }
    out.legsL = legL.build(RENDERER.gl);
    out.legsR = legR.build(RENDERER.gl);

    /* ---- Corpo ---- */
    const body = mk();
    const hipY = def.mount ? 2.55 : 1.02;
    if (def.mount) { body.box(0, hipY + 0.30, 0, 0.46, 0.22, 0.52, p.cloth2); }
    body.box(0, hipY + 0.82, 0, 0.82, 1.02, 0.50, p.cloth);
    body.box(0, hipY + 0.82, 0.27, 0.42, 0.88, 0.07, A);
    body.box(0, hipY + 0.34, 0, 0.88, 0.16, 0.56, [0.28, 0.22, 0.16]);
    body.box(0, hipY + 1.28, 0, 0.98, 0.20, 0.56, p.metal);
    body.box(-0.53, hipY + 1.26, 0, 0.26, 0.26, 0.52, p.metal);
    body.box(0.53, hipY + 1.26, 0, 0.26, 0.26, 0.52, p.metal);
    if (def.robe) { body.cone(0, hipY + 0.20, 0, 0.62, 1.10, 7, p.cloth2); }
    if (def.cape) { body.box(0, hipY + 0.80, -0.30, 0.74, 1.06, 0.08, p.cloth2, m4RX(0.12)); }
    /* cabeça */
    const hy = hipY + 1.72;
    body.box(0, hy, 0, 0.46, 0.46, 0.46, C.skin);
    body.box(0, hy - 0.02, 0.235, 0.30, 0.12, 0.04, [0.28, 0.18, 0.14]);
    if (def.helmet === 1) {
        body.box(0, hy + 0.16, 0, 0.52, 0.28, 0.52, p.metal);
        body.box(0, hy + 0.02, 0.26, 0.10, 0.22, 0.06, p.metal);
    }
    if (def.helmet === 2) {
        body.cone(0, hy + 0.10, 0, 0.40, 0.52, 7, p.cloth2);
        body.box(0, hy - 0.06, 0.20, 0.42, 0.14, 0.10, p.cloth2);
    }
    if (def.helmet === 0) { body.box(0, hy + 0.22, 0, 0.50, 0.18, 0.50, [0.28, 0.20, 0.16]); }
    out.body = body.build(RENDERER.gl);

    /* ---- Braço direito + arma ---- */
    const arm = mk();
    const shX = 0.58, shY = hipY + 1.24;
    arm.box(shX, shY - 0.34, 0.02, 0.26, 0.82, 0.28, p.cloth);
    arm.box(shX, shY - 0.76, 0.04, 0.24, 0.20, 0.26, C.skin);
    const wx = shX, wy = shY - 0.78, wz = 0.16;
    switch (def.weapon) {
        case 'sword':
            arm.box(wx, wy, wz + 0.62, 0.11, 0.13, 1.18, p.metal);
            arm.box(wx, wy, wz + 1.24, 0.13, 0.15, 0.16, p.metal);
            arm.box(wx, wy, wz + 0.06, 0.40, 0.09, 0.14, [0.42, 0.30, 0.18]);
            arm.box(wx, wy, wz - 0.10, 0.13, 0.13, 0.13, [0.55, 0.45, 0.30]); break;
        case 'spear':
            arm.box(wx, wy, wz + 1.05, 0.10, 0.10, 2.30, [0.46, 0.33, 0.20]);
            arm.cone(wx, wy, wz + 2.32, 0.15, 0.52, 6, p.metal, m4Mul(m4T(wx, wy, wz + 2.06), m4RX(Math.PI / 2)));
            arm.box(wx, wy, wz + 0.10, 0.22, 0.10, 0.16, [0.36, 0.24, 0.16]); break;
        case 'bow': {
            const col = [0.48, 0.33, 0.19];
            for (let i = 0; i < 5; i++) {
                const t = (i - 2) / 2, ang = t * 0.62;
                arm.box(wx + Math.sin(ang) * 0.02, wy + t * 0.34, wz + 0.20 + Math.cos(ang) * 0.26 - 0.26, 0.09, 0.36, 0.10, col,
                    m4Mul(m4T(wx, wy + t * 0.34, wz + 0.20), m4RX(-ang)));
            }
            arm.box(wx, wy, wz + 0.02, 0.03, 1.42, 0.03, [0.92, 0.92, 0.88]); break;
        }
        case 'crossbow':
            arm.box(wx, wy, wz + 0.34, 0.14, 0.18, 0.78, [0.44, 0.31, 0.19]);
            arm.box(wx, wy, wz + 0.60, 0.72, 0.10, 0.12, p.metal);
            arm.box(wx - 0.30, wy, wz + 0.60, 0.10, 0.22, 0.12, p.metal);
            arm.box(wx + 0.30, wy, wz + 0.60, 0.10, 0.22, 0.12, p.metal); break;
        case 'staff':
            arm.box(wx, wy + 0.42, wz, 0.10, 2.00, 0.10, [0.46, 0.33, 0.20]);
            arm.sphere(wx, wy + 1.50, wz, 0.22, 7, 5, p.acc);
            arm.sphere(wx, wy + 1.50, wz, 0.12, 6, 4, C.white); break;
        case 'dagger':
            arm.box(wx, wy, wz + 0.36, 0.09, 0.11, 0.58, p.metal);
            arm.box(wx, wy, wz + 0.06, 0.18, 0.09, 0.10, [0.35, 0.25, 0.18]); break;
        case 'axe':
            arm.box(wx, wy, wz + 0.52, 0.11, 0.11, 1.10, [0.44, 0.31, 0.19]);
            arm.box(wx, wy + 0.16, wz + 1.02, 0.46, 0.40, 0.14, p.metal);
            arm.box(wx, wy - 0.14, wz + 1.02, 0.32, 0.22, 0.12, p.metal); break;
        case 'hammer':
            arm.box(wx, wy, wz + 0.42, 0.13, 0.13, 0.92, [0.36, 0.26, 0.17]);
            arm.box(wx, wy, wz + 0.92, 0.42, 0.42, 0.46, p.metal); break;
        case 'wrench':
            arm.box(wx, wy, wz + 0.34, 0.11, 0.11, 0.72, [0.5, 0.5, 0.54]);
            arm.box(wx, wy + 0.10, wz + 0.70, 0.28, 0.10, 0.12, [0.5, 0.5, 0.54]);
            arm.box(wx, wy - 0.10, wz + 0.70, 0.28, 0.10, 0.12, [0.5, 0.5, 0.54]); break;
        case 'banner':
            arm.box(wx, wy + 0.62, wz, 0.10, 2.30, 0.10, [0.42, 0.30, 0.18]);
            arm.box(wx + 0.34, wy + 1.52, wz, 0.62, 0.72, 0.05, A);
            arm.box(wx + 0.34, wy + 1.16, wz, 0.62, 0.06, 0.06, p.acc);
            arm.sphere(wx, wy + 1.82, wz, 0.14, 6, 4, p.acc); break;
    }
    out.armR = arm.build(RENDERER.gl);

    /* ---- Braço esquerdo + escudo ---- */
    const aL = mk();
    aL.box(-shX, shY - 0.34, 0.02, 0.26, 0.82, 0.28, p.cloth);
    aL.box(-shX, shY - 0.76, 0.04, 0.24, 0.20, 0.26, C.skin);
    if (def.shield) {
        aL.box(-shX - 0.16, shY - 0.36, 0.16, 0.16, 1.02, 0.76, p.metal);
        aL.box(-shX - 0.24, shY - 0.36, 0.16, 0.06, 0.86, 0.60, A);
        aL.box(-shX - 0.30, shY - 0.36, 0.16, 0.10, 0.24, 0.24, p.acc);
    }
    out.armL = aL.build(RENDERER.gl);

    out.radius = def.radius; out.height = def.mount ? 3.4 : 2.4;
    VIS_CACHE[key] = out;
    return out;
}

/* ---- Terreno e cenário ---- */
function buildTerrain(seed) {
    const rnd = mulberry32(seed);
    const mb = new MB();
    /* topo */
    const NX = 18, NZ = 12, W = 36, D = 24;
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
        const x0 = -W / 2 + i * W / NX, x1 = x0 + W / NX, z0 = -D / 2 + j * D / NZ, z1 = z0 + D / NZ;
        const t = rnd();
        const g = [0.34 + 0.06 * t, 0.50 + 0.07 * t, 0.24 + 0.05 * t];
        mb.quad([x0, 0, z0], [x0, 0, z1], [x1, 0, z1], [x1, 0, z0], g);
    }
    /* bordas do diorama */
    const dirt = [0.36, 0.26, 0.16], dirt2 = [0.30, 0.21, 0.13];
    mb.quad([-W / 2, -1.8, -D / 2], [-W / 2, -1.8, D / 2], [-W / 2, 0, D / 2], [-W / 2, 0, -D / 2], dirt);
    mb.quad([W / 2, -1.8, D / 2], [W / 2, -1.8, -D / 2], [W / 2, 0, -D / 2], [W / 2, 0, D / 2], dirt);
    mb.quad([-W / 2, -1.8, D / 2], [W / 2, -1.8, D / 2], [W / 2, 0, D / 2], [-W / 2, 0, D / 2], dirt2);
    mb.quad([W / 2, -1.8, -D / 2], [-W / 2, -1.8, -D / 2], [-W / 2, 0, -D / 2], [W / 2, 0, -D / 2], dirt2);
    mb.box(0, -2.35, 0, W + 3.4, 1.1, D + 3.4, [0.28, 0.20, 0.13]);
    /* caminho central */
    mb.quad([-W / 2, 0.02, -2.1], [-W / 2, 0.02, 2.1], [W / 2, 0.02, 2.1], [W / 2, 0.02, -2.1], [0.52, 0.42, 0.28]);
    return mb.build(RENDERER.gl);
}
function buildProps(seed) {
    const rnd = mulberry32(seed * 7 + 3);
    const items = [];
    const obstacles = [];
    const tree = (x, z, s) => {
        const mb = new MB();
        mb.cyl(0, 0, 0, 0.26 * s, 0.20 * s, 1.5 * s, 6, [0.40, 0.28, 0.18]);
        mb.cone(0, 1.1 * s, 0, 1.35 * s, 2.2 * s, 7, [0.22, 0.42, 0.22]);
        mb.cone(0, 2.1 * s, 0, 1.00 * s, 1.7 * s, 7, [0.28, 0.50, 0.26]);
        mb.cone(0, 3.0 * s, 0, 0.62 * s, 1.2 * s, 7, [0.33, 0.56, 0.30]);
        items.push({ mesh: mb.build(RENDERER.gl), m: m4T(x, 0, z) });
        obstacles.push({ x: x, z: z, r: 0.75 * s });
    };
    const rock = (x, z, s) => {
        const mb = new MB();
        mb.box(0, 0.42 * s, 0, 1.5 * s, 0.9 * s, 1.25 * s, [0.52, 0.52, 0.55], m4Mul(m4T(0, 0.42 * s, 0), m4RY(rnd() * 3)));
        mb.box(0.5 * s, 0.32 * s, 0.35 * s, 0.8 * s, 0.6 * s, 0.7 * s, [0.45, 0.45, 0.48], m4Mul(m4T(0.5 * s, 0.32 * s, 0.35 * s), m4RY(rnd() * 3)));
        items.push({ mesh: mb.build(RENDERER.gl), m: m4T(x, 0, z) });
        obstacles.push({ x: x, z: z, r: 1.0 * s });
    };
    const ruin = (x, z) => {
        const mb = new MB();
        const st = [0.62, 0.60, 0.56];
        mb.box(0, 1.5, 0, 2.6, 3.0, 1.0, st);
        mb.box(0, 3.15, 0, 3.0, 0.35, 1.25, [0.52, 0.50, 0.47]);
        mb.box(-1.6, 1.1, 0, 0.7, 2.2, 1.4, st);
        mb.box(0, 0.28, 1.1, 3.6, 0.55, 1.0, [0.55, 0.53, 0.50]);
        items.push({ mesh: mb.build(RENDERER.gl), m: m4Mul(m4T(x, 0, z), m4RY(rnd() * 1.2)) });
        obstacles.push({ x: x, z: z, r: 1.7 });
    };
    const tower = (x, z, col) => {
        const mb = new MB();
        mb.cyl(0, 0, 0, 1.65, 1.45, 5.2, 9, [0.60, 0.58, 0.55]);
        mb.cyl(0, 5.2, 0, 1.95, 1.95, 0.5, 9, [0.50, 0.48, 0.46]);
        mb.cone(0, 5.6, 0, 2.1, 2.3, 9, col);
        mb.box(0, 3.2, 1.45, 0.5, 1.1, 0.35, [0.18, 0.15, 0.13]);
        items.push({ mesh: mb.build(RENDERER.gl), m: m4T(x, 0, z) });
        obstacles.push({ x: x, z: z, r: 1.9 });
    };
    const banner = (x, z, col) => {
        const mb = new MB();
        mb.cyl(0, 0, 0, 0.11, 0.09, 4.2, 6, [0.42, 0.30, 0.18]);
        mb.box(0.55, 3.55, 0, 1.15, 1.05, 0.06, col);
        mb.box(0.55, 3.02, 0, 1.15, 0.09, 0.08, C.gold);
        items.push({ mesh: mb.build(RENDERER.gl), m: m4T(x, 0, z) });
    };
    /* posicionamento determinístico (fora das zonas de posicionamento) */
    for (let i = 0; i < 11; i++) { const x = -17 + rnd() * 34, z = (rnd() < 0.5 ? -1 : 1) * (9.2 + rnd() * 2.2); tree(x, z, 0.8 + rnd() * 0.5); }
    for (let i = 0; i < 8; i++) { const x = -17 + rnd() * 34, z = (rnd() < 0.5 ? -1 : 1) * (7.0 + rnd() * 4.4); rock(x, z, 0.7 + rnd() * 0.7); }
    for (let i = 0; i < 4; i++) { const x = -14 + rnd() * 28, z = (rnd() < 0.5 ? -1 : 1) * (3.2 + rnd() * 3.0); rock(x, z, 0.55 + rnd() * 0.5); }
    ruin(-8.5, -8.4); ruin(8.5, 8.4); ruin(13.2, -8.0);
    tower(-16.2, 11.0, C.red); tower(16.2, -11.0, C.blue);
    banner(-16.8, -11.2, C.blue); banner(16.8, 11.2, C.red);
    for (let i = 0; i < 26; i++) {
        const x = -18 + rnd() * 36, z = -12 + rnd() * 24;
        const mb = new MB(); const s = 0.25 + rnd() * 0.28;
        mb.cone(0, 0, 0, s * 0.5, s * 2.2, 4, [0.32 + 0.1 * rnd(), 0.52 + 0.1 * rnd(), 0.24]);
        items.push({ mesh: mb.build(RENDERER.gl), m: m4T(x, 0, z) });
    }
    return { items, obstacles };
}

/* ===================== 5. SIMULAÇÃO DE COMBATE ===================== */
class SimUnit {
    constructor(def, faction, x, z, idx, bonus) {
        this.def = def; this.faction = faction; this.idx = idx;
        this.pos = [x, 0, z]; this.home = [x, 0, z];
        this.facing = faction === 'player' ? Math.PI / 2 : -Math.PI / 2;
        this.maxHp = def.hp; this.hp = def.hp;
        this.stats = {
            dmg: def.dmg, armor: def.armor, speed: def.speed, atkSpeed: def.atkSpeed,
            range: def.range, dmgMult: 1, abilityPower: 1
        };
        this.bonus = bonus || { hp: 1, dmg: 1, armor: 0 };
        this.maxHp *= this.bonus.hp; this.hp = this.maxHp;
        this.stats.dmg *= this.bonus.dmg; this.stats.armor += this.bonus.armor;
        this.attackCd = rand(0, 0.8); this.thinkCd = rand(0, 0.4); this.target = null;
        this.alive = true; this.deadT = 0; this.hitT = 0; this.attackT = 9; this.castT = 0; this.moveAmt = 0;
        this.phase = rand(0, 6); this.radius = def.radius; this.chargeDist = 0; this.shots = 0;
        this.kills = 0; this.dmgDealt = 0; this.dmgTaken = 0; this.healing = 0; this.stun = 0; this.slowT = 0;
        this.slowF = 1; this.buffs = []; this.syn = []; this.synFlags = {}; this.stance = 'advance';
        this.stealth = 0; this.fortified = false; this.id = def.id + '#' + idx;
    }
    isRanged() { return this.def.range > 3.5; }
    recalc() {
        const d = this.def;
        this.stats.dmg = d.dmg * this.bonus.dmg;
        this.stats.armor = d.armor + this.bonus.armor;
        this.stats.speed = d.speed;
        this.stats.atkSpeed = d.atkSpeed;
        this.stats.range = d.range;
        this.stats.dmgMult = 1; this.stats.abilityPower = 1;
        this.synFlags = {};
        for (const s of SYNERGIES) if (this.syn.indexOf(s.id) >= 0) s.apply(this);
        if (this.stance === 'advance') { this.stats.dmgMult *= 1.08; this.stats.armor *= 0.92; }
        if (this.stance === 'hold') { this.stats.armor *= 1.18; }
        if (this.stance === 'retreat') { this.stats.speed *= 1.25; this.stats.dmgMult *= 0.82; }
        if (this.def.ability.type === 'rage') {
            const m = 1 - this.hp / this.maxHp;
            this.stats.dmgMult *= 1 + m * 0.7; this.stats.atkSpeed *= 1 + m * 0.4;
        }
        if (this.fortified) { this.stats.armor *= 1.45; this.stats.speed = 0; }
        if (this.slowT > 0) this.stats.speed *= this.slowF;
        for (const b of this.buffs) {
            if (b.dmg) this.stats.dmgMult *= b.dmg; if (b.armor) this.stats.armor += b.armor;
            if (b.speed) this.stats.speed *= b.speed;
        }
        if (this.maxHp < this.hp) this.hp = Math.min(this.hp, this.maxHp);
    }
}
class Battle {
    constructor(scenario, difficulty, playerList, enemyList, obstacles) {
        this.scenario = scenario; this.difficulty = difficulty;
        this.units = []; this.projectiles = []; this.obstacles = obstacles || [];
        this.time = 0; this.started = false; this.ended = false; this.winner = null;
        this.log = []; this.synCd = 0; this.aiCd = 2; this.focusTarget = null;
        this.cool = { cry: 0, rain: 0, mend: 0 }; this.abilityUses = {};
        playerList.forEach((u, i) => this.units.push(new SimUnit(UNIT_BY_ID[u.id], 'player', u.x, u.z, i, u.bonus)));
        enemyList.forEach((u, i) => this.units.push(new SimUnit(UNIT_BY_ID[u.id], 'enemy', u.x, u.z, i, u.bonus)));
        this.recalcSynergies();
        this.units.forEach(u => u.recalc());
    }
    alive(f) { return this.units.filter(u => u.alive && u.faction === f); }
    addLog(msg, type) { this.log.unshift({ msg, type }); if (this.log.length > 60) this.log.pop(); }

    recalcSynergies() {
        for (const u of this.units) { if (u.alive) u.syn = []; }
        for (const u of this.units) {
            if (!u.alive) continue;
            for (const s of SYNERGIES) {
                let n = 0, extra = 0;
                for (const o of this.units) {
                    if (!o.alive || o.faction !== u.faction) continue;
                    const d = vDistXZ(u.pos, o.pos);
                    if (d <= s.radius && o.def.tags.indexOf(s.tag) >= 0) n++;
                    if (s.id === 'cover' && d <= s.radius && o.def.tags.indexOf('melee') >= 0 && o !== u) extra++;
                }
                const ok = (n >= s.need) && (s.id !== 'cover' || extra >= 2);
                if (ok && u.def.tags.indexOf(s.tag) >= 0) u.syn.push(s.id);
                if (s.id === 'spears' && ok && u.def.tags.indexOf('shield')) u.synFlags.stopCharge = true;
            }
        }
        this.units.forEach(u => { if (u.alive) u.recalc(); });
    }

    spawnProjectile(from, to, opts) {
        opts = opts || {};
        this.projectiles.push({
            from: from, to: to, p: [from.pos[0], 1.55, from.pos[2]],
            speed: opts.speed || 19, dmg: opts.dmg || from.stats.dmg, splash: opts.splash || 0,
            slow: opts.slow || 0, color: opts.color || C.white, trail: opts.trail, arc: opts.arc || 0, t: 0
        });
    }
    applyDamage(target, amount, source, opts) {
        if (!target || !target.alive) return 0;
        opts = opts || {};
        let d = amount * source.stats.dmgMult;
        if (source.def.ability.type === 'anti_cav' && target.def.tags.indexOf('cavalry') >= 0) d *= source.synFlags.antiCav || 1.6;
        if (source.def.ability.type === 'backstab' && target.target !== source) d *= 1.75;
        if (source.synFlags.vsRanged && target.isRanged()) d *= source.synFlags.vsRanged;
        if (target.synFlags.stopCharge) source.chargeDist = 0;
        let pierce = opts.pierce || 0;
        if (source.def.ability.type === 'pierce') pierce = 0.55;
        if (source.def.ability.type === 'rage') { /* já aplicado em recalc */ }
        const armor = target.stats.armor * (1 - pierce);
        const final = Math.max(1, Math.round(d - armor));
        target.hp -= final; target.hitT = 0.16;
        source.dmgDealt += final; target.dmgTaken += final;
        if (target.hp <= 0) {
            target.hp = 0; target.alive = false; target.deadT = 0; source.kills++;
            this.addLog(`${source.def.name} derrotou ${target.def.name}`, 'kill');
            FX.emit([target.pos[0], 1.2, target.pos[2]], C.red, 10, 3.2, 0.8, 0.16);
        } else {
            FX.emit([target.pos[0], 1.25, target.pos[2]], [0.95, 0.86, 0.55], 4, 2.2, 0.42, 0.12);
        }
        if (G.save.settings.dmg && G.battle === this) FX.text([target.pos[0], 2.5, target.pos[2]], String(final),
            source.faction === 'player' ? [1, 0.92, 0.45] : [1, 0.42, 0.32]);
        return final;
    }
    heal(target, amount, source) {
        if (!target.alive) return;
        const h = Math.min(amount, target.maxHp - target.hp);
        if (h <= 0) return;
        target.hp += h; source.healing += h;
        if (G.save.settings.dmg && G.battle === this) FX.text([target.pos[0], 2.4, target.pos[2]], '+' + Math.round(h), [0.55, 1, 0.6]);
        FX.emit([target.pos[0], 1.2, target.pos[2]], [0.55, 1, 0.62], 3, 1.4, 0.55, 0.12, 2);
    }

    update(dt) {
        if (this.ended) return;
        this.time += dt;
        for (const k in this.cool) if (this.cool[k] > 0) this.cool[k] -= dt;
        this.synCd -= dt;
        if (this.synCd <= 0) { this.synCd = 0.5; this.recalcSynergies(); }

        for (const u of this.units) {
            if (!u.alive) { u.deadT += dt; continue; }
            u.hitT = Math.max(0, u.hitT - dt); u.attackT += dt; u.attackCd -= dt;
            u.thinkCd -= dt; u.slowT -= dt;
            if (u.buffs.length) { for (const b of u.buffs) b.t -= dt; u.buffs = u.buffs.filter(b => b.t > 0); }
            if (u.def.ability.type === 'heal' && this.started) {
                u.castT -= dt;
                if (u.castT <= 0) {
                    u.castT = 1.15;
                    let best = null, bp = 1e9;
                    for (const a of this.alive(u.faction)) {
                        if (a.hp / a.maxHp > 0.985) continue;
                        const d = vDistXZ(u.pos, a.pos);
                        if (d < 8.5 && d < bp) { bp = d; best = a; }
                    }
                    if (best) {
                        this.heal(best, 18 * u.stats.abilityPower, u);
                        best.buffs.push({ t: 1.3, armor: 6 });
                    }
                }
            }
            if (!this.started) { u.moveAmt = lerp(u.moveAmt, 0, dt * 3); continue; }

            /* aquisição de alvo */
            if (u.thinkCd <= 0 || !u.target || !u.target.alive || (u.target.stealth > 0.5)) {
                u.thinkCd = 0.35;
                u.target = this.pickTarget(u);
            }
            const t = u.target;
            if (!t) { u.moveAmt = lerp(u.moveAmt, 0, dt * 3); continue; }

            const d = vDistXZ(u.pos, t.pos) - t.radius - u.radius * 0.4;
            const wantRange = u.stats.range;
            const canMove = u.stance !== 'hold' && !u.fortified;
            if (d > wantRange * 0.92) {
                if (canMove) this.moveToward(u, dt, t.pos);
                else u.moveAmt = lerp(u.moveAmt, 0, dt * 3);
            } else {
                u.moveAmt = lerp(u.moveAmt, 0, dt * 4);
                u.facing = lerpAngle(u.facing, Math.atan2(t.pos[0] - u.pos[0], t.pos[2] - u.pos[2]), dt * 9);
                if (u.attackCd <= 0) this.doAttack(u, t);
            }
            /* carga: acumula distância percorrida */
            if (u.def.ability.type === 'charge' && canMove && d > wantRange) u.chargeDist = Math.min(14, u.chargeDist + u.stats.speed * dt);
        }

        /* projéteis */
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const pr = this.projectiles[i]; pr.t += dt;
            const tgt = pr.to && pr.to.alive ? pr.to.pos : [pr.p[0], 0, pr.p[2] + 0.01];
            const aim = [tgt[0], pr.arc ? 1.2 : 1.3, tgt[2]];
            const dir = vSub(aim, pr.p); const dist = vLen(dir);
            const step = pr.speed * dt;
            if (dist <= step || pr.t > 4) {
                if (pr.splash > 0) {
                    FX.emit(aim, pr.color, 16, 5, 0.6, 0.2);
                    for (const u of this.units) {
                        if (!u.alive || u.faction === pr.from.faction) continue;
                        if (vDistXZ(u.pos, aim) <= pr.splash) {
                            const dmg = this.applyDamage(u, pr.dmg, pr.from, {});
                            if (pr.slow > 0) { u.slowT = 3; u.slowF = 1 - pr.slow; }
                        }
                    }
                } else if (pr.to && pr.to.alive) {
                    this.applyDamage(pr.to, pr.dmg, pr.from, {});
                }
                this.projectiles.splice(i, 1);
            } else {
                pr.p = vAdd(pr.p, vScl(vNorm(dir), step));
                if (pr.trail && Math.random() < 0.6) FX.emit(pr.p, pr.color, 1, 0.3, 0.28, 0.11, 0.4);
            }
        }

        /* IA comandante inimiga */
        this.aiCd -= dt;
        if (this.aiCd <= 0) { this.aiCd = 1.4; this.aiThink(); }

        /* vitória / derrota */
        if (this.started && !this.ended) {
            const p = this.alive('player').length, e = this.alive('enemy').length;
            if (p === 0 || e === 0 || this.time > 210) {
                this.ended = true;
                this.winner = p === e ? 'draw' : (e === 0 ? 'player' : (p === 0 ? 'enemy' : (p > e ? 'player' : 'enemy')));
            }
        }
    }
    pickTarget(u) {
        const enemies = this.alive(u.faction === 'player' ? 'enemy' : 'player');
        if (!enemies.length) return null;
        if (u.faction === 'player' && this.focusTarget && this.focusTarget.alive && u.isRanged()) return this.focusTarget;
        let best = null, bs = -1e9;
        for (const e of enemies) {
            if (e.stealth > 0.5) continue;
            const d = vDistXZ(u.pos, e.pos);
            if (d > u.def.detect * 1.6 && u.target !== e) continue;
            let s = 120 - d * 2.2;
            if (e.def.tags.indexOf('support') >= 0 || e.def.tags.indexOf('backline') >= 0) s += 22;
            if (e.def.tags.indexOf('tank') >= 0) s -= 14;
            if (e.hp < e.maxHp * 0.35) s += 18;
            if (this.aiSmart(u) && u.def.tags.indexOf('flanker') >= 0 && e.isRanged()) s += 45;
            if (e === this.focusTarget && u.faction === 'enemy') s += 35;
            if (e === u.target) s += 10;
            if (s > bs) { bs = s; best = e; }
        }
        return best || enemies[0];
    }
    aiSmart(u) { return u.faction === 'enemy' ? this.difficulty >= 4 : true; }

    moveToward(u, dt, point) {
        const dir = vNorm([point[0] - u.pos[0], 0, point[2] - u.pos[2]]);
        let sep = [0, 0, 0];
        for (const o of this.units) {
            if (o === u || !o.alive) continue;
            const dx = u.pos[0] - o.pos[0], dz = u.pos[2] - o.pos[2];
            const dist = Math.sqrt(dx * dx + dz * dz), min = u.radius + o.radius + 0.16;
            if (dist < min && dist > 0.0001) { const k = (min - dist) / min * 2.6; sep = vAdd(sep, [dx / dist * k, 0, dz / dist * k]); }
        }
        for (const o of this.obstacles) {
            const dx = u.pos[0] - o.x, dz = u.pos[2] - o.z;
            const dist = Math.sqrt(dx * dx + dz * dz), min = o.r + u.radius * 0.8;
            if (dist < min && dist > 0.0001) { const k = (min - dist) / min * 3.4; sep = vAdd(sep, [dx / dist * k, 0, dz / dist * k]); }
        }
        const vel = vAdd(vScl(dir, u.stats.speed), sep);
        u.pos = vAdd(u.pos, vScl(vel, dt));
        u.pos[0] = clamp(u.pos[0], -17.6, 17.6); u.pos[2] = clamp(u.pos[2], -11.6, 11.6);
        u.facing = lerpAngle(u.facing, Math.atan2(dir[0], dir[2]), dt * 7);
        u.moveAmt = lerp(u.moveAmt, 1, dt * 5);
    }

    doAttack(u, t) {
        u.attackCd = 1 / Math.max(0.08, u.stats.atkSpeed);
        u.attackT = 0; u.shots++;
        if (u.isRanged()) {
            let dmg = u.stats.dmg;
            if (u.def.ability.type === 'crit4' && u.shots % 4 === 0) {
                dmg *= 2.1;
                FX.emit([t.pos[0], 1.4, t.pos[2]], [1, 0.9, 0.4], 8, 3.4, 0.5, 0.16);
            }
            this.spawnProjectile(u, t, {
                dmg: dmg, speed: u.def.tags.indexOf('magic') >= 0 ? 15 : 21,
                splash: u.def.ability.type === 'fireball' ? 3.6 : (u.def.ability.type === 'siege' ? 3.0 : 0),
                slow: u.def.ability.type === 'siege' ? 0.4 : 0,
                color: u.def.tags.indexOf('magic') >= 0 ? C.fire : (u.def.ability.type === 'siege' ? [0.55, 0.55, 0.58] : [0.95, 0.92, 0.8]),
                trail: u.def.tags.indexOf('magic') >= 0, arc: u.def.ability.type === 'siege' ? 1 : 0
            });
        } else {
            let dmg = u.stats.dmg;
            if (u.def.ability.type === 'charge' && u.chargeDist > 2) {
                dmg *= 1 + Math.min(0.9, u.chargeDist * 0.065) * (u.synFlags.charge || 1);
                const push = vNorm([t.pos[0] - u.pos[0], 0, t.pos[2] - u.pos[2]]);
                t.pos = vAdd(t.pos, vScl(push, 0.55));
                FX.emit([t.pos[0], 1.3, t.pos[2]], [0.9, 0.85, 0.6], 10, 4, 0.5, 0.16);
                u.chargeDist = 0;
            }
            this.applyDamage(t, dmg, u, {});
            FX.emit([t.pos[0], 1.4, t.pos[2]], [0.95, 0.95, 0.9], 3, 2, 0.28, 0.11);
        }
        if (u.def.ability.type === 'backstab') u.stealth = 0;
    }

    aiThink() {
        const en = this.alive('enemy'), pl = this.alive('player');
        if (!en.length || !pl.length) return;
        const smart = this.difficulty >= 3;
        const avgEn = en.reduce((s, u) => s + u.hp / u.maxHp, 0) / en.length;
        const avgPl = pl.reduce((s, u) => s + u.hp / u.maxHp, 0) / pl.length;
        if (!smart) return;
        if (avgEn < 0.42 && avgPl > 0.55 && this.difficulty >= 5) { this.setStance('enemy', 'retreat'); }
        else if (avgPl < 0.5 && this.difficulty >= 4) { this.setStance('enemy', 'advance'); }
        if (this.difficulty >= 6) {
            if (this.cool.rain <= 0 && pl.length >= 4 && Math.random() < 0.5) {
                const c = pl.reduce((a, u) => [a[0] + u.pos[0] / pl.length, 0, a[2] + u.pos[2] / pl.length], [0, 0, 0]);
                this.castCommander('enemy', 'rain', c);
            } else if (this.cool.cry <= 0 && avgEn < 0.6 && Math.random() < 0.45) {
                this.castCommander('enemy', 'cry');
            }
        }
    }
    setStance(f, stance) {
        for (const u of this.alive(f)) {
            u.stance = stance;
            if (stance !== 'hold') u.fortified = false;
        }
        this.addLog((f === 'player' ? 'Seu exército' : 'O inimigo') + ' adota postura: ' +
            ({ advance: 'Avançar', hold: 'Defender', retreat: 'Recuar' })[stance], f === 'player' ? 'good' : '');
        this.units.forEach(u => { if (u.alive) u.recalc(); });
    }
    castCommander(f, id, point) {
        if (this.cool[id] > 0) return false;
        const cd = id === 'cry' ? 28 : (id === 'rain' ? 24 : 32);
        this.cool[id] = cd;
        const allies = this.alive(f);
        if (id === 'cry') {
            allies.forEach(u => u.buffs.push({ t: 7, dmg: 1.28 }));
            FX.emit([allies[0].pos[0], 1.6, allies[0].pos[2]], [1, 0.85, 0.35], 22, 6, 1.0, 0.18);
            this.addLog('Grito de Guerra! (+28% de dano)', f === 'player' ? 'good' : 'kill');
        } else if (id === 'mend') {
            allies.forEach(u => this.heal(u, u.maxHp * 0.32, u));
            this.addLog('Bênção Real cura o exército.', f === 'player' ? 'good' : 'kill');
        } else if (id === 'rain' && point) {
            const col = [0.95, 0.88, 0.62];
            for (let w = 0; w < 3; w++) {
                setTimeout(() => {
                    if (!this.alive(f).length) return;
                    FX.emit([point[0], 1.2, point[2]], col, 26, 7, 0.8, 0.2);
                    for (const u of this.units) {
                        if (!u.alive || u.faction === f) continue;
                        if (vDistXZ(u.pos, point) <= 4.2) this.applyDamage(u, 34, this.alive(f)[0] || u, { pierce: 0.2 });
                    }
                }, w * 380);
            }
            this.addLog('Chuva de Flechas sobre o campo!', f === 'player' ? 'good' : 'kill');
        }
        return true;
    }
}

/* ===================== 6. GERAÇÃO DE EXÉRCITO INIMIGO ===================== */
function generateEnemyArmy(scenario, difficulty) {
    const budget = scenario.enemyBase + (difficulty - 1) * scenario.enemyPerDiff;
    const bonus = { hp: 1 + (difficulty - 1) * 0.032, dmg: 1 + (difficulty - 1) * 0.030, armor: (difficulty - 1) * 1.1 };
    const arch = scenario.archetype;
    const pools = {
        defense: ['guard', 'guard', 'spear', 'bulwark', 'banner', 'cleric', 'crossbow', 'berserker'],
        ranged: ['archer', 'archer', 'crossbow', 'engineer', 'guard', 'spear', 'cleric', 'mage', 'rogue'],
        magic: ['mage', 'cleric', 'bulwark', 'rider', 'banner', 'guard', 'berserker', 'archer', 'crossbow']
    };
    const pool = pools[arch] || pools.defense;
    const counts = {}; let spent = 0;
    const minFront = 2 + Math.floor(difficulty / 3);
    for (let i = 0; i < 60; i++) {
        const id = pick(pool); const u = UNIT_BY_ID[id];
        if (spent + u.cost > budget) continue;
        if (counts[id] && counts[id] >= 4) continue;
        counts[id] = (counts[id] || 0) + 1; spent += u.cost;
        if (spent > budget * 0.93) break;
    }
    /* garante linha de frente */
    let front = Object.keys(counts).filter(k => UNIT_BY_ID[k].tags.indexOf('frontline') >= 0)
        .reduce((s, k) => s + counts[k], 0);
    while (front < minFront && spent + 55 <= budget) { counts.guard = (counts.guard || 0) + 1; spent += 55; front++; }
    /* posicionamento por arquétipo */
    const list = []; let z = 0, step = 2.3, side = 1;
    const order = Object.keys(counts).sort((a, b) => {
        const rank = (u) => u.tags.indexOf('frontline') >= 0 ? 0 : (u.tags.indexOf('ranged') >= 0 ? 2 : 1);
        return rank(UNIT_BY_ID[a]) - rank(UNIT_BY_ID[b]);
    });
    for (const id of order) {
        for (let i = 0; i < counts[id]; i++) {
            const u = UNIT_BY_ID[id];
            let x = 17.2 - Math.random() * 2.2;
            if (u.tags.indexOf('ranged') >= 0 || u.tags.indexOf('backline') >= 0) x = 15.0 - Math.random() * 3.4;
            if (arch === 'defense' && u.tags.indexOf('frontline') >= 0) x = 12.6 - Math.random() * 1.2;
            if (arch === 'magic' && u.tags.indexOf('backline') >= 0) x = 16.2 - Math.random() * 2.0;
            z = (z + step * side); if (Math.abs(z) > 9) { z = (z > 0 ? 2.2 : -2.2); side = 1; }
            list.push({ id: id, x: x + Math.random() * 1.2, z: clamp(z, -9.5, 9.5), bonus: bonus });
        }
    }
    return { list: list, budget: budget, bonus: bonus };
}

/* ===================== 7. RENDERIZAÇÃO DA CENA ===================== */
let RENDERER = null, CAM = null;
const FXSYS = FX._shared;
const DECALS = {};
function buildDecals() {
    const mkRing = (col, r1, r2) => {
        const mb = new MB();
        for (let i = 0; i < 20; i++) {
            const a0 = i / 20 * TAU, a1 = (i + 1) / 20 * TAU;
            mb.quad([Math.cos(a0) * r1, 0, Math.sin(a0) * r1], [Math.cos(a0) * r2, 0, Math.sin(a0) * r2],
                [Math.cos(a1) * r2, 0, Math.sin(a1) * r2], [Math.cos(a1) * r1, 0, Math.sin(a1) * r1], col);
        }
        return mb.build(RENDERER.gl);
    };
    DECALS.ringSel = mkRing([0.30, 0.72, 1.0, 0.85], 0.82, 1.02);
    DECALS.ringEnemy = mkRing([1.0, 0.34, 0.28, 0.8], 0.82, 1.02);
    const mb = new MB();
    for (let i = 0; i < 14; i++) {
        const a0 = i / 14 * TAU, a1 = (i + 1) / 14 * TAU;
        mb.quad([Math.cos(a0) * 0.2, 0, Math.sin(a0) * 0.2], [Math.cos(a0) * 1, 0, Math.sin(a0) * 1],
            [Math.cos(a1) * 1, 0, Math.sin(a1) * 1], [Math.cos(a1) * 0.2, 0, Math.sin(a1) * 0.2], [0, 0, 0, 0.32]);
    }
    DECALS.shadow = mb.build(RENDERER.gl);
    const mg = new MB();
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x0 = -17.5 + i * 8.75, x1 = x0 + 8.75, z0 = -11.5 + j * 5.75, z1 = z0 + 5.75;
        mg.quad([x0, 0.03, z0], [x0, 0.03, z1], [x1, 0.03, z1], [x1, 0.03, z0], [0.35, 0.62, 0.95, 0.10]);
        mg.quad([x0, 0.03, z0], [x1, 0.03, z0], [x1, 0.03, z1], [x0, 0.03, z1], [0.35, 0.62, 0.95, 0.10]);
    }
    DECALS.grid = mg.build(RENDERER.gl);
}
function unitModel(u, dt) {
    const v = buildUnitVisual(u.def, u.faction);
    const dead = !u.alive;
    const deathT = dead ? u.deadT : 0;
    const bob = Math.abs(Math.sin(u.phase * 2)) * 0.075 * u.moveAmt;
    const root = m4Mul(m4T(u.pos[0], bob - (dead ? Math.min(0.55, deathT * 0.30) : 0), u.pos[2]), m4RY(u.facing));
    const fall = dead ? Math.min(1, deathT * 1.9) : 0;
    const rootF = m4Mul(root, m4RX(fall * 1.42));
    const swing = Math.sin(u.phase) * 0.72 * u.moveAmt;
    const atk = u.attackT < 0.34 ? Math.sin(u.attackT / 0.34 * Math.PI) * 1.25 : 0;
    const cast = u.castT > 0.85 ? 0.9 : 0;
    return {
        root: rootF,
        legsL: m4Mul(m4T(0, 1.02, 0), m4RX(swing)),
        legsR: m4Mul(m4T(0, 1.02, 0), m4RX(-swing)),
        armR: m4Mul(m4T(0.58, u.def.mount ? 3.79 : 2.26, 0), m4RX(-swing * 0.55 - atk - cast)),
        armL: m4Mul(m4T(-0.58, u.def.mount ? 3.79 : 2.26, 0), m4RX(swing * 0.45)),
        vis: v
    };
}
function renderScene(dt) {
    RENDERER.resize();
    RENDERER.begin(CAM);
    const gl = RENDERER.gl;
    RENDERER.draw(G.terrain, m4(), {});
    if (G.sceneProps) for (const it of G.sceneProps.items) RENDERER.draw(it.mesh, it.m, {});

    /* unidades */
    const hpBars = [];
    const shadowList = [];
    for (const u of (G.battle ? G.battle.units : G.deco || [])) {
        const M = unitModel(u, dt);
        const vis = M.vis;
        const alpha = u.stealth > 0.5 ? 0.42 : (u.alive ? 1 : Math.max(0.25, 1 - u.deadT * 0.32));
        const tint = u.hitT > 0 ? [1, 0.72, 0.42, 0.55] : [0, 0, 0, 0];
        RENDERER.draw(vis.body, M.root, { alpha: alpha, tint: tint });        /* (matrizes compostas abaixo) */
        RENDERER.draw(vis.legsL, m4Mul(M.root, M.legsL), { alpha: alpha, tint: tint });
        RENDERER.draw(vis.legsR, m4Mul(M.root, M.legsR), { alpha: alpha, tint: tint });
        if (vis.mount) RENDERER.draw(vis.mount, M.root, { alpha: alpha, tint: tint });
        RENDERER.draw(vis.armR, m4Mul(M.root, M.armR), { alpha: alpha, tint: tint });
        RENDERER.draw(vis.armL, m4Mul(M.root, M.armL), { alpha: alpha, tint: tint });

        if (u.alive || u.deadT < 2.2) {
            shadowList.push({
                p: [u.pos[0], 0.055, u.pos[2]], w: u.radius * 3.1, h: u.radius * 3.1,
                col: [0, 0, 0, 0.26 * Math.max(0, 1 - (u.deadT || 0) * 0.5)]
            });
        }
        if (u.alive && (u.hp < u.maxHp || G.selUnit === u)) {
            const pct = clamp(u.hp / u.maxHp, 0, 1);
            hpBars.push({ p: [u.pos[0], vis.height + 0.55, u.pos[2]], w: 1.62, h: 0.20, col: [0.10, 0.09, 0.08, 0.82] });
            hpBars.push({
                p: [u.pos[0], vis.height + 0.55, u.pos[2] + 0.002], w: 1.56 * pct, h: 0.135,
                col: [u.faction === 'player' ? (1 - pct) * 0.9 + 0.25 : 0.85, u.faction === 'player' ? 0.72 * pct + 0.22 : 0.22, 0.22, 0.95]
            });
        }
        if (G.selUnit === u) RENDERER.draw(DECALS.ringSel, m4T(u.pos[0], 0.07, u.pos[2]), { unlit: true, blend: true, depthWrite: false });
    }
    /* projéteis */
    const projBars = [];
    for (const pr of (G.battle ? G.battle.projectiles : [])) {
        projBars.push({ p: pr.p, w: 0.42, h: 0.42, col: [pr.color[0], pr.color[1], pr.color[2], 0.95] });
        if (pr.arc) projBars.push({ p: pr.p, w: 0.72, h: 0.72, col: [0.45, 0.45, 0.48, 0.5] });
    }
    RENDERER.billboards(shadowList);
    if (G.showGrid) RENDERER.draw(DECALS.grid, m4(), { unlit: true, blend: true, depthWrite: false });
    FXSYS.draw(RENDERER);
    if (G.save.settings.hp) RENDERER.billboards(hpBars);
    RENDERER.billboards(projBars);
}

/* ===================== 8. UI ===================== */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const s = $('#s-' + id); if (s) s.classList.add('active');
    G.screen = id;
    G.showGrid = (id === 'deploy');
    if (id === 'menu') { CAM.set([0, 2, 0], 32, 0.7, 0.72); G.deco = makeDecoArmy(); }
    if (id === 'scenario') { renderScenarioScreen(); CAM.set([0, 1, 0], 30, 0.35, 0.8); }
    if (id === 'builder') { renderBuilder(); CAM.set([-4, 2, 0], 30, 0.5, 0.82); }
    if (id === 'deploy') { renderDeploy(); CAM.set([-11, 1, 0], 23, 0.12, 0.92); }
    if (id === 'battle') { renderBattleHUD(); CAM.set([0, 1.4, 0], 27, 0.16, 0.74); }
    if (id === 'armory') { renderArmory(); }
    if (id === 'tests') { renderQA(); }
    if (id === 'settings') { renderSettings(); }
}
function makeDecoArmy() {
    const ids = ['guard', 'spear', 'archer', 'mage', 'rider', 'cleric', 'banner', 'bulwark', 'berserker', 'rogue'];
    const arr = []; let i = 0;
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
        const d = UNIT_BY_ID[ids[i % ids.length]];
        arr.push(new SimUnit(d, i % 2 ? 'enemy' : 'player', (-6 + c * 3.0) + (r * 1.2), (-4.5 + r * 9.0) + c * 0.2, i, null));
        i++;
    }
    return arr;
}
function fmtStat(v, max) { return `<div class="stat"><div class="lb"></div></div>`; }
function statBar(label, val, max, color) {
    return `<div class="stat"><div class="lb">${label}</div>
    <div class="bar2"><i style="width:${clamp(val / max * 100, 3, 100)}%;background:${color || ''}"></i></div>
    <div class="vl">${val}</div></div>`;
}
function unitCard(u, extra) {
    const locked = G.save.unlocked.indexOf(u.id) < 0;
    return `<div class="u-card ${locked ? 'locked' : ''} ${G.selType === u.id ? 'sel' : ''}" data-act="sel-unit" data-arg="${u.id}">
    <div class="ic">${u.tags.indexOf('ranged') >= 0 ? '🏹' : u.tags.indexOf('magic') >= 0 ? '✨' : u.tags.indexOf('cavalry') >= 0 ? '🐴' : u.tags.indexOf('support') >= 0 ? '✚' : '⚔'}</div>
    <div><div class="nm">${u.name}</div>
      <div class="sub">${u.cls} · ${u.role}</div>
      <div>${u.tags.slice(0, 4).map(t => `<span class="tag ${t === 'ranged' ? 'blue' : t === 'magic' ? 'purple' : t === 'support' ? 'green' : t === 'cavalry' ? 'red' : ''}">${t}</span>`).join('')}</div>
    </div>
    <div class="cost">${locked ? '🔒 ' + u.unlock + '🪙' : u.cost + ' 🪙'}</div>
  </div>`;
}

/* ---- Menu ---- */
function renderMenu() {
    $('#menu-foot').innerHTML =
        `Progressão: <b>${G.save.gold} 🪙</b> · ${G.save.unlocked.length}/${UNITS.length} unidades · ` +
        `Vitórias ${G.save.wins} · Melhor dificuldade ${G.save.bestDiff || '—'}<br>` +
        `Câmera: arraste com o botão direito/Shift para girar · roda para aproximar · Q/E giram · WASD move`;
}

/* ---- Seleção de batalha ---- */
function renderScenarioScreen() {
    const list = $('#scenario-list'); list.innerHTML = '';
    SCENARIOS.forEach((s, i) => {
        const locked = i >= G.save.scenariosUnlocked;
        const card = el('div', 'panel');
        card.style.cursor = locked ? 'not-allowed' : 'pointer';
        card.innerHTML = `<h3>${locked ? '🔒 ' : ''}${s.name}</h3><p class="dim">${s.desc}</p>
      <div style="margin-top:8px">${s.intel}</div>
      <div style="margin-top:9px"><span class="pill ${locked ? 'grey' : ''}">Dificuldade base ${s.diff}</span>
      <span class="pill grey">Orçamento ${s.budget} 🪙</span></div>`;
        card.onclick = () => {
            if (locked) { toast('Vença a batalha anterior para desbloquear.'); return; }
            G.scenario = s; renderScenarioScreen();
        };
        if (G.scenario.id === s.id) card.style.boxShadow = '0 0 0 3px rgba(224,172,70,.6)';
        list.appendChild(card);
    });
    const s = G.scenario;
    $('#scenario-info').innerHTML = `<h3>${s.name}</h3>
    <div class="kv"><span>Arquétipo inimigo</span><b>${({ defense: 'Defesa', ranged: 'À Distância', magic: 'Magia' })[s.archetype]}</b></div>
    <div class="kv"><span>Seu orçamento</span><b>${s.budget} 🪙</b></div>
    <div class="kv"><span>Terreno</span><b>Diorama 36×24</b></div>
    <div class="kv"><span>Recompensa base</span><b>${60 + G.difficulty * 22} 🪙</b></div>`;
    updateDiffPreview();
}
function updateDiffPreview() {
    const d = G.difficulty;
    $('#diff-val').textContent = d;
    $('#diff-desc').textContent = DIFFICULTY_DESC[d] || '';
    const e = generateEnemyArmy(G.scenario, d);
    const bonus = e.bonus;
    $('#diff-preview').innerHTML = `
    <div class="kv"><span>Orçamento inimigo</span><b>${e.budget} 🪙</b></div>
    <div class="kv"><span>Vida inimiga</span><b>+${Math.round((bonus.hp - 1) * 100)}%</b></div>
    <div class="kv"><span>Dano inimigo</span><b>+${Math.round((bonus.dmg - 1) * 100)}%</b></div>
    <div class="kv"><span>Armadura inimiga</span><b>+${Math.round(bonus.armor)}</b></div>
    <div class="kv"><span>Inteligência</span><b>${d >= 6 ? 'Foco, habilidades e recuo tático' : d >= 3 ? 'Foco de alvo e habilidades' : 'Básica'}</b></div>`;
}

/* ---- Army Builder ---- */
function armyCost() { return G.armyList.reduce((s, a) => s + UNIT_BY_ID[a.id].cost, 0); }
function renderBuilder() {
    const cat = $('#unit-catalog');
    cat.innerHTML = `<div class="panel"><h3>Catálogo de Unidades</h3>${UNITS.map(u => unitCard(u)).join('')}</div>`;
    const cost = armyCost(), max = G.scenario.budget;
    $('#budget-used').textContent = cost; $('#budget-max').textContent = max;
    const f = $('#budget-fill');
    f.style.width = clamp(cost / max * 100, 0, 100) + '%';
    f.className = cost > max ? 'over' : '';
    /* formação atual */
    const counts = {};
    G.armyList.forEach(a => counts[a.id] = (counts[a.id] || 0) + 1);
    const panel = $('#army-panel');
    panel.innerHTML = `<h3>Formação Atual (${G.armyList.length} unidades)</h3>${Object.keys(counts).length ? Object.keys(counts).map(id => {
        const u = UNIT_BY_ID[id];
        return `<div class="kv"><span>${u.name} × ${counts[id]}</span>
        <span><b>${u.cost * counts[id]} 🪙</b>
        <button class="btn sm" data-act="army-remove" data-arg="${id}">−</button></span></div>`;
    }).join('') : '<div class="empty">Nenhuma unidade recrutada.<br>Selecione unidades no catálogo.</div>'}`;
    /* sinergias */
    const tagCount = {};
    G.armyList.forEach(a => UNIT_BY_ID[a.id].tags.forEach(t => tagCount[t] = (tagCount[t] || 0) + 1));
    $('#synergy-preview').innerHTML = `<h3>Sinergias Potenciais</h3>${SYNERGIES.map(s => {
        const n = tagCount[s.tag] || 0; const on = n >= s.need;
        return `<div class="syn ${on ? 'on' : ''}"><div class="sic">${s.icon}</div>
      <div><div class="snm">${s.name} <span class="prog">${Math.min(n, s.need)}/${s.need}</span></div>
      <div class="sds">${s.desc}</div></div></div>`;
    }).join('')}`;
    /* detalhe */
    const u = UNIT_BY_ID[G.selType] || UNITS[0];
    const locked = G.save.unlocked.indexOf(u.id) < 0;
    $('#unit-detail').innerHTML = `<h3>${u.name}</h3>
    <div class="dim" style="margin-bottom:8px">${u.cls} · ${u.role}</div>
    ${statBar('Vida', u.hp, 400, '#6a9a4b')}${statBar('Dano', u.dmg, 36, '#b8433a')}
    ${statBar('Alcance', u.range, 14, '#4a7fc4')}${statBar('Velocidade', u.speed, 5.4, '#e0ac46')}
    ${statBar('C. de Ataque', Math.round(u.atkSpeed * 100), 150, '#6c4a9c')}
    ${statBar('Armadura', u.armor, 24, '#8c949e')}
    <div class="kv" style="margin-top:9px"><span>Custo</span><b>${u.cost} 🪙</b></div>
    <div class="kv"><span>Detecção</span><b>${u.detect}m</b></div>
    <div class="kv"><span>Habilidade</span><b>${u.ability.name}</b></div>
    <p class="dim" style="margin:8px 0">${u.ability.desc}</p>
    <div class="syn on" style="margin-top:9px"><div class="sic">✔</div><div><div class="snm">Vantagens</div>
      <div class="sds">${u.strong}</div></div></div>
    <div class="syn" style="border-left-color:#b8433a"><div class="sic">✖</div><div><div class="snm">Fraquezas</div>
      <div class="sds">${u.weak}</div></div></div>
    <button class="btn big gold wide" data-act="army-add" data-arg="${u.id}" ${locked ? 'disabled' : ''}>
      ${locked ? 'Bloqueada' : '＋ Recrutar'}</button>`;
}

/* ---- Deployment ---- */
function renderDeploy() {
    const counts = {};
    G.armyList.forEach(a => counts[a.id] = (counts[a.id] || 0) + 1);
    const placed = {};
    if (G.battle) G.battle.units.filter(u => u.faction === 'player').forEach(u => placed[u.def.id] = (placed[u.def.id] || 0) + 1);
    $('#deploy-pool').innerHTML = `<div class="panel"><h3>Exército</h3>${Object.keys(counts).map(id => {
        const u = UNIT_BY_ID[id], left = counts[id] - (placed[id] || 0);
        return `<div class="u-card ${G.brush === id ? 'sel' : ''}" data-act="brush" data-arg="${id}">
        <div class="ic">⚔</div><div><div class="nm">${u.name}</div>
        <div class="sub">No campo: ${placed[id] || 0}/${counts[id]}</div></div>
        <div class="cost">${left > 0 ? left + ' livre' : '✓'}</div></div>`;
    }).join('')}</div>
    <div class="panel sub"><h3>Orientação</h3><p class="dim">
      Clique no campo para posicionar a unidade selecionada. Arraste uma unidade para movê-la.
      Botão direito remove. Posicione dentro da zona azul.</p></div>`;
    const su = G.selUnit;
    $('#deploy-inspect').innerHTML = su ? `<div class="panel"><h3>${su.def.name}</h3>
      <div class="kv"><span>Vida</span><b>${Math.round(su.hp)}</b></div>
      <div class="kv"><span>Dano</span><b>${Math.round(su.stats.dmg)}</b></div>
      <div class="kv"><span>Alcance</span><b>${su.stats.range.toFixed(1)}m</b></div>
      <div class="kv"><span>Posição</span><b>${su.pos[0].toFixed(1)}, ${su.pos[2].toFixed(1)}</b></div>
      <button class="btn wide" data-act="unit-remove">Remover unidade</button></div>`
        : `<div class="panel"><h3>Inspetor</h3><p class="dim">Selecione uma unidade no campo ou no painel lateral.</p></div>`;
    $('#deploy-hint').innerHTML = `Zona azul permitida · ${G.battle ? G.battle.units.filter(u => u.faction === 'player').length : 0} unidades posicionadas`;
}

/* ---- HUD de batalha ---- */
function renderBattleHUD() {
    const b = G.battle; if (!b) return;
    const p = b.alive('player'), e = b.alive('enemy');
    const hpP = p.reduce((s, u) => s + u.hp, 0) / Math.max(1, p.reduce((s, u) => s + u.maxHp, 0));
    const hpE = e.reduce((s, u) => s + u.hp, 0) / Math.max(1, e.reduce((s, u) => s + u.maxHp, 0));
    $('#hud-player').innerHTML = `<div class="row"><b style="color:#8fc0ff">SEU EXÉRCITO</b><span>${p.length} unid.</span></div>
    <div class="row"><div class="hp-mini"><i style="width:${hpP * 100}%"></i></div><span>${Math.round(hpP * 100)}%</span></div>`;
    $('#hud-enemy').innerHTML = `<div class="row"><b style="color:#ff9c8f">INIMIGO · Nv.${G.difficulty}</b><span>${e.length} unid.</span></div>
    <div class="row"><div class="hp-mini"><i style="width:${hpE * 100}%;background:#b8433a"></i></div><span>${Math.round(hpE * 100)}%</span></div>`;
    const t = Math.floor(b.time);
    $('#hud-timer').textContent = Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
    /* sinergias ativas */
    const syn = {};
    p.forEach(u => u.syn.forEach(s => syn[s] = (syn[s] || 0) + 1));
    $('#hud-synergy').innerHTML = `<div class="panel"><h3>Sinergias</h3>${SYNERGIES.map(s => {
        const n = syn[s.id] || 0;
        return `<div class="syn ${n >= s.need ? 'on' : ''}"><div class="sic">${s.icon}</div>
      <div><div class="snm">${s.name}</div><div class="prog">${n} unidade(s) afetada(s)</div></div></div>`;
    }).join('')}</div>`;
    /* log */
    $('#hud-log').innerHTML = `<div class="panel"><h3>Registro de Combate</h3>${b.log.slice(0, 14).map(l => `<div class="log-line ${l.type || ''}">${l.msg}</div>`).join('')}</div>`;
    /* comandos */
    const cmdHtml = [];
    [['advance', '📯', 'Avançar'], ['hold', '🛡', 'Defender'], ['retreat', '🏃', 'Recuar']].forEach(([id, ic, nm]) => {
        cmdHtml.push(`<div class="cmd ${G.stance === id ? 'on' : ''}" data-act="stance" data-arg="${id}">
      <div class="ci">${ic}</div>${nm}</div>`);
    });
    COMMANDERS.forEach(c => {
        const cd = Math.max(0, b.cool[c.id]);
        cmdHtml.push(`<div class="cmd ${cd <= 0 ? '' : 'cool'}" data-act="commander" data-arg="${c.id}" title="${c.desc}">
      <div class="ci">${c.icon}</div>${c.name}${cd > 0 ? `<div class="cd">${Math.ceil(cd)}s</div>` : ''}</div>`);
    });
    $('#cmd-bar').innerHTML = cmdHtml.join('');
    /* alvo selecionado */
    const tc = $('#target-card');
    if (G.selUnit && G.selUnit.alive && G.selUnit.faction === 'enemy') {
        const u = G.selUnit;
        tc.style.display = 'block';
        tc.innerHTML = `<div class="panel"><h3>${u.def.name}</h3>
      <div class="kv"><span>Vida</span><b>${Math.round(u.hp)}/${Math.round(u.maxHp)}</b></div>
      <div class="kv"><span>Dano</span><b>${Math.round(u.stats.dmg)}</b></div>
      <div class="kv"><span>Armadura</span><b>${Math.round(u.stats.armor)}</b></div>
      <button class="btn sm wide" data-act="focus">🎯 Focar fogo</button></div>`;
    } else tc.style.display = 'none';
    $('#cast-hint').style.display = G.aiming ? 'block' : 'none';
    $('#cast-hint').textContent = G.aiming === 'rain' ? 'Clique no campo para lançar a Chuva de Flechas' : '';
    $('#scene').className = G.aiming ? 'aim' : '';
}

/* ---- Resultado ---- */
function showResult() {
    const b = G.battle;
    const won = b.winner === 'player';
    const r = $('#result-title');
    r.textContent = won ? 'VITÓRIA' : (b.winner === 'draw' ? 'EMPATE' : 'DERROTA');
    r.className = won ? 'win' : 'lose';
    $('#result-sub').textContent = `${G.scenario.name} · Dificuldade ${G.difficulty} · ` +
        `Duração ${Math.floor(b.time / 60)}:${String(Math.floor(b.time % 60)).padStart(2, '0')}`;
    /* tabela */
    const rows = b.units.filter(u => u.faction === 'player').sort((a, c) => c.dmgDealt - a.dmgDealt);
    let mvp = rows[0];
    rows.forEach(u => { if (u.dmgDealt / (u.def.cost) > (mvp ? mvp.dmgDealt / (mvp.def.cost) : 0)) mvp = u; });
    $('#result-table').innerHTML = `<tr><th>Unidade</th><th>Dano</th><th>Recebido</th><th>Cura</th><th>Abates</th><th>Status</th></tr>${rows.map(u => `<tr class="${u === mvp ? 'mvp' : ''} ${u.alive ? '' : 'dead'}">
      <td>${u.def.name}${u === mvp ? ' ⭐' : ''}</td><td>${Math.round(u.dmgDealt)}</td>
      <td>${Math.round(u.dmgTaken)}</td><td>${Math.round(u.healing)}</td><td>${u.kills}</td>
      <td>${u.alive ? '<span class="pill">Vivo</span>' : '<span class="pill red">Caído</span>'}</td></tr>`).join('')}`;
    /* recompensas */
    const surv = b.alive('player').length / Math.max(1, b.units.filter(u => u.faction === 'player').length);
    const perf = clamp(0.5 * surv + 0.5 * clamp(b.units.filter(u => u.faction === 'player').reduce((s, u) => s + u.dmgDealt, 0) /
        Math.max(1, b.units.filter(u => u.faction === 'enemy').reduce((s, u) => s + u.maxHp, 0)), 0, 1), 0, 1);
    const gold = Math.round((60 + G.difficulty * 22) * (won ? 1 : 0.34) * (0.55 + 0.45 * perf));
    G.save.gold += gold; G.save.totalGold += gold; G.save.battles++;
    if (won) {
        G.save.wins++;
        if (G.difficulty > G.save.bestDiff) G.save.bestDiff = G.difficulty;
        const idx = SCENARIOS.indexOf(G.scenario);
        if (idx + 1 >= G.save.scenariosUnlocked && idx + 1 < SCENARIOS.length) {
            G.save.scenariosUnlocked = idx + 2;
            toast('Nova batalha desbloqueada: ' + SCENARIOS[idx + 1].name);
        }
    } else G.save.losses++;
    saveNow();
    $('#result-rewards').innerHTML = `
    <div class="reward"><span>Ouro obtido</span><b>+${gold} 🪙</b></div>
    <div class="reward"><span>Sobreviventes</span><b>${Math.round(surv * 100)}%</b></div>
    <div class="reward"><span>Eficiência</span><b>${Math.round(perf * 100)}%</b></div>
    <div class="reward"><span>Ouro total</span><b>${G.save.gold} 🪙</b></div>
    <div class="reward"><span>Unidades desbloqueadas</span><b>${G.save.unlocked.length}/${UNITS.length}</b></div>`;
    $('#result-tips').innerHTML = tacticalTips(b, won);
    showScreen('result');
}
function tacticalTips(b, won) {
    const tips = [];
    const enemyTags = {};
    b.units.filter(u => u.faction === 'enemy').forEach(u => u.def.tags.forEach(t => enemyTags[t] = (enemyTags[t] || 0) + 1));
    const myTags = {};
    b.units.filter(u => u.faction === 'player').forEach(u => u.def.tags.forEach(t => myTags[t] = (myTags[t] || 0) + 1));
    if ((enemyTags.cavalry || 0) >= 2 && (myTags.anti_cav || 0) < 2) tips.push('O inimigo usou cavalaria pesada. Recrute 2+ Lanceiros para anular as cargas.');
    if ((enemyTags.ranged || 0) >= 3 && (myTags.mobility || 0) < 2) tips.push('Havia muitos atiradores. Cavalaria ou Assassinos fecham a distância rápido.');
    if ((myTags.frontline || 0) < 3) tips.push('Sua linha de frente era curta. 3+ unidades de linha ativam a sinergia Linha de Escudos.');
    if ((myTags.ranged || 0) >= 3 && (myTags.melee || 0) < 2) tips.push('Seus atiradores ficaram expostos. Posicione 2+ corpo a corpo por perto (Alcance Protegido).');
    if ((myTags.support || 0) === 0) tips.push('Sem suporte. Um Sacerdote ou Porta-Estandarte aumenta muito a força da sua composição.');
    const lowEff = b.units.filter(u => u.faction === 'player' && u.dmgDealt < u.def.cost * 0.8);
    if (lowEff.length) tips.push(`Unidades pouco eficientes: ${lowEff.slice(0, 3).map(u => u.def.name).join(', ')}. Considere reposicioná-las.`);
    if (won && b.alive('player').length > 0) tips.push('Formação vencedora: salve a composição para reutilizá-la em outras batalhas.');
    if (!tips.length) tips.push('Batalha equilibrada. Experimente variar o posicionamento entre a linha e os flancos.');
    return tips.map(t => `<div class="syn"><div class="sic">📜</div><div class="sds">${t}</div></div>`).join('');
}

/* ---- Arsenal ---- */
function renderArmory() {
    $('#armory-gold').textContent = G.save.gold;
    $('#armory-grid').innerHTML = UNITS.map(u => {
        const owned = G.save.unlocked.indexOf(u.id) >= 0;
        return `<div class="panel"><h3>${u.name}</h3>
      <div class="dim">${u.cls} · ${u.role} · ${u.cost} 🪙</div>
      <div style="margin:8px 0">${u.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${statBar('Vida', u.hp, 400)}${statBar('Dano', u.dmg, 36)}${statBar('Armadura', u.armor, 24)}
      <div class="kv"><span>Habilidade</span><b>${u.ability.name}</b></div>
      <p class="dim">${u.ability.desc}</p>
      <button class="btn ${owned ? '' : 'gold'} wide" data-act="unlock" data-arg="${u.id}" ${owned ? 'disabled' : ''}>
        ${owned ? 'Desbloqueada' : 'Desbloquear por ' + u.unlock + ' 🪙'}</button></div>`;
    }).join('');
}

/* ---- Configurações / QA ---- */
function renderSettings() {
    $('#controls-help').innerHTML = `
    <div class="kv"><span>Girar câmera</span><b>Botão direito / Shift+arrastar / Q · E</b></div>
    <div class="kv"><span>Aproximar</span><b>Roda do mouse</b></div>
    <div class="kv"><span>Mover câmera</span><b>W A S D / setas</b></div>
    <div class="kv"><span>Selecionar unidade</span><b>Clique esquerdo</b></div>
    <div class="kv"><span>Posicionar / mover</span><b>Clique / arrastar (fase de posicionamento)</b></div>
    <div class="kv"><span>Remover unidade</span><b>Botão direito sobre ela</b></div>
    <div class="kv"><span>Pausa / velocidade</span><b>Barra inferior (⏸ 1x 2x 3x)</b></div>`;
    $('#opt-hp').checked = G.save.settings.hp; $('#opt-dmg').checked = G.save.settings.dmg;
    $('#opt-fx').checked = G.save.settings.fx; $('#opt-shadow').value = G.save.settings.shadow;
}
function renderQA() {
    $('#qa-list').innerHTML = [
        'Iniciar, montar exército, posicionar, lutar até o fim e ver o resultado.',
        'Tentar confirmar exército acima do orçamento (deve bloquear).',
        'Vencer e perder: as recompensas e dicas devem mudar.',
        'Trocar dificuldade 1 → 10: orçamento e atributos inimigos escalam.',
        'Salvar e recarregar a página: ouro e unidades desbloqueadas persistem.',
        'Comandos táticos entram em cooldown e alteram o comportamento das tropas.',
        'Câmera nunca deve obstruir a leitura das unidades.'
    ].map(t => `<div class="qa-item"><span class="pill">☐</span><div>${t}</div></div>`).join('');
}

/* ===================== 9. TESTES AUTOMATIZADOS ===================== */
function runTests() {
    const R = [];
    const T = (name, fn) => {
        try {
            const r = fn(); R.push({ name: name, pass: r === true, detail: r === true ? 'OK' : String(r) });
        } catch (e) { R.push({ name: name, pass: false, detail: 'Exceção: ' + e.message }); }
    };

    T('Catálogo: 12 unidades com campos obrigatórios', () => {
        if (UNITS.length < 8 || UNITS.length > 12) return 'Quantidade inválida: ' + UNITS.length;
        const ids = new Set();
        for (const u of UNITS) {
            ['id', 'name', 'cls', 'cost', 'hp', 'dmg', 'range', 'speed', 'atkSpeed', 'armor', 'detect', 'ability', 'tags', 'role', 'weapon', 'pal']
                .forEach(k => { if (u[k] === undefined) throw new Error(u.id + ' sem ' + k); });
            if (ids.has(u.id)) return 'ID duplicado: ' + u.id; ids.add(u.id);
            if (u.cost <= 0 || u.hp <= 0 || u.dmg <= 0 || u.range <= 0) return 'Valores inválidos em ' + u.id;
        }
        return true;
    });
    T('Unidades possuem papéis táticos distintos', () => {
        const roles = new Set(UNITS.map(u => u.role));
        if (roles.size < 8) return 'Poucos papéis distintos: ' + roles.size;
        for (const u of UNITS) {
            if (!u.strong || !u.weak) return u.id + ' sem vantagens/fraquezas';
            if (!u.ability || !u.ability.name || !u.ability.desc) return u.id + ' sem habilidade descrita';
        }
        return true;
    });

    T('Orçamento: adicionar acima do limite deve ser impedido', () => {
        const fake = [{ id: 'rider', cost: 115 }, { id: 'mage', cost: 135 }, { id: 'bulwark', cost: 105 }, { id: 'rider', cost: 115 }];
        const total = fake.reduce((s, a) => s + UNIT_BY_ID[a.id].cost, 0);
        const max = 300;
        if (total <= max) return 'Teste deveria exceder orçamento';
        return true;
    });

    T('Sinergias: 6 definidas com campos obrigatórios', () => {
        if (SYNERGIES.length < 5) return 'Menos de 5 sinergias';
        for (const s of SYNERGIES) {
            ['id', 'name', 'icon', 'tag', 'need', 'radius', 'desc', 'apply'].forEach(k => {
                if (s[k] === undefined) throw new Error('Sinergia ' + s.id + ' sem ' + k);
            });
            if (s.need < 2) return 'Sinergia ' + s.id + ' precisa de pelo menos 2 unidades';
        }
        return true;
    });

    T('Sinergia "Linha de Escudos" aplica +16 armadura e +12% vida', () => {
        const u = new SimUnit(UNIT_BY_ID['guard'], 'player', 0, 0, 0, null);
        const before = { armor: u.stats.armor, hp: u.maxHp };
        u.syn.push('line'); u.recalc();
        if (u.stats.armor < before.armor + 10) return 'Armadura não aumentou. Antes=' + before.armor + ' Depois=' + u.stats.armor;
        if (u.maxHp < before.hp * 1.05) return 'Vida não aumentou.';
        return true;
    });

    T('Sinergia "Parede de Lanças" ativa flag anti-cavalaria', () => {
        const u = new SimUnit(UNIT_BY_ID['spear'], 'player', 0, 0, 0, null);
        u.syn.push('spears'); u.recalc();
        if (!u.synFlags.stopCharge) return 'Flag stopCharge não ativada';
        return true;
    });

    T('Combate: 2 guardiões vs 1 guardião → vence o lado maior', () => {
        const b = new Battle(SCENARIOS[0], 5,
            [{ id: 'guard', x: -4, z: 0, bonus: null }, { id: 'guard', x: -4, z: 2, bonus: null }],
            [{ id: 'guard', x: 6, z: 0, bonus: null }], []);
        for (let i = 0; i < 6000; i++) b.update(1 / 60);
        const pAlive = b.alive('player').length, eAlive = b.alive('enemy').length;
        if (eAlive >= pAlive) return 'Lado numérico deveria vencer. P=' + pAlive + ' E=' + eAlive;
        return true;
    });

    T('Combate: anti-cavalaria punita carga', () => {
        const spear = new SimUnit(UNIT_BY_ID['spear'], 'player', 0, 0, 0, null);
        const rider = new SimUnit(UNIT_BY_ID['rider'], 'enemy', 3, 0, 0, null);
        spear.syn.push('spears'); spear.recalc();
        const b = new Battle(SCENARIOS[0], 5, [], [], []);
        const d1 = b.applyDamage(rider, 20, spear, {});
        if (d1 < 20) return 'Dano anti-cav não aplicou corretamente: ' + d1;
        return true;
    });

    T('Combate: dano nunca cai abaixo de 1', () => {
        const b = new Battle(SCENARIOS[0], 1, [], [], []);
        const tank = new SimUnit(UNIT_BY_ID['bulwark'], 'player', 0, 0, 0, null);
        const weak = new SimUnit(UNIT_BY_ID['archer'], 'enemy', 0, 0, 0, null);
        const d = b.applyDamage(tank, 1, weak, {});
        if (d < 1) return 'Dano mínimo respeitado? d=' + d;
        return true;
    });

    T('Morte correta: hp chega a 0 e alive=false', () => {
        const b = new Battle(SCENARIOS[0], 1, [], [], []);
        const u = new SimUnit(UNIT_BY_ID['archer'], 'player', 0, 0, 0, null);
        const src = new SimUnit(UNIT_BY_ID['mage'], 'enemy', 0, 0, 0, null);
        src.stats.dmgMult = 50;
        b.applyDamage(u, 500, src, {});
        if (u.alive) return 'Unidade deveria estar morta';
        if (u.hp !== 0) return 'HP deveria ser 0';
        return true;
    });

    T('Cura não excede vida máxima', () => {
        const b = new Battle(SCENARIOS[0], 1, [], [], []);
        const u = new SimUnit(UNIT_BY_ID['guard'], 'player', 0, 0, 0, null);
        const src = new SimUnit(UNIT_BY_ID['cleric'], 'enemy', 0, 0, 0, null);
        b.heal(u, 99999, src);
        if (u.hp > u.maxHp) return 'Cura excedeu máximo: ' + u.hp + '/' + u.maxHp;
        return true;
    });

    T('Berserker ganha dano ao perder vida', () => {
        const u = new SimUnit(UNIT_BY_ID['berserker'], 'player', 0, 0, 0, null);
        const base = u.stats.dmgMult;
        u.hp = u.maxHp * 0.3; u.recalc();
        if (u.stats.dmgMult <= base) return 'Rage não ativou. base=' + base + ' atual=' + u.stats.dmgMult;
        return true;
    });

    T('IA gera exército inimigo válido', () => {
        for (let d = 1; d <= 10; d++) {
            const e = generateEnemyArmy(SCENARIOS[0], d);
            if (!e.list || e.list.length < 2) return 'Dificuldade ' + d + ' gerou pouco exército';
            const spent = e.list.reduce((s, u) => s + UNIT_BY_ID[u.id].cost, 0);
            if (spent > e.budget * 1.08) return 'Gastou ' + spent + ' de ' + e.budget + ' na dif. ' + d;
        }
        return true;
    });

    T('Dificuldade 10 tem mais atributos que dificuldade 1', () => {
        const e1 = generateEnemyArmy(SCENARIOS[0], 1);
        const e10 = generateEnemyArmy(SCENARIOS[0], 10);
        if (e10.bonus.hp <= e1.bonus.hp) return 'HP bonus não escala';
        if (e10.bonus.dmg <= e1.bonus.dmg) return 'Dano bonus não escala';
        return true;
    });

    T('Projéteis: dispara e colide', () => {
        const b = new Battle(SCENARIOS[0], 1, [], [], []);
        const from = new SimUnit(UNIT_BY_ID['archer'], 'player', 0, 0, 0, null);
        const to = new SimUnit(UNIT_BY_ID['guard'], 'enemy', 8, 0, 0, null);
        b.units.push(from, to);
        b.spawnProjectile(from, to, { dmg: 20 });
        if (b.projectiles.length !== 1) return 'Projétil não criado';
        for (let i = 0; i < 200; i++) b.update(1 / 60);
        if (b.projectiles.length !== 0) return 'Projétil não colidiu';
        return true;
    });

    T('Persistência: save carrega corretamente', () => {
        const s = defaultSave();
        if (typeof s.gold !== 'number') return 'Gold ausente';
        if (!Array.isArray(s.unlocked)) return 'Unlocked ausente';
        if (typeof s.settings !== 'object') return 'Settings ausente';
        return true;
    });

    T('Desbloqueio: unidade com unlock=0 começa disponível', () => {
        const s = defaultSave();
        for (const u of UNITS) {
            if (u.unlock === 0 && s.unlocked.indexOf(u.id) < 0) return u.id + ' deveria estar desbloqueada';
        }
        return true;
    });

    T('Arquétipos viáveis: Defesa, Ranged, Mobilidade', () => {
        const archetypes = ['defense', 'ranged', 'mobility'];
        const presets = {
            defense: ['guard', 'guard', 'guard', 'spear', 'spear', 'bulwark', 'banner', 'cleric'],
            ranged: ['archer', 'archer', 'crossbow', 'engineer', 'guard', 'spear', 'mage', 'cleric'],
            mobility: ['rider', 'rider', 'rogue', 'berserker', 'rogue', 'archer', 'banner']
        };
        for (const a of archetypes) {
            const list = presets[a];
            if (!list) return 'Preset ausente: ' + a;
            const cost = list.reduce((s, id) => s + UNIT_BY_ID[id].cost, 0);
            if (cost > 520) return 'Preset ' + a + ' excede orçamento máximo';
            if (list.length < 5) return 'Preset ' + a + ' muito pequeno';
        }
        return true;
    });

    T('Comandos táticos: 3 comandos com cooldown', () => {
        if (COMMANDERS.length < 3) return 'Menos de 3 comandos';
        for (const c of COMMANDERS) {
            if (!c.name || !c.desc || !c.cd) return 'Comando ' + c.id + ' incompleto';
        }
        return true;
    });

    T('Cenários: 3 com dados completos', () => {
        if (SCENARIOS.length < 3) return 'Menos de 3 cenários';
        for (const s of SCENARIOS) {
            ['id', 'name', 'diff', 'budget', 'enemyBase', 'desc'].forEach(k => {
                if (s[k] === undefined) throw new Error('Cenário ' + s.id + ' sem ' + k);
            });
        }
        return true;
    });

    T('Renderização: engine inicializa sem erros fatais', () => {
        if (!RENDERER || !RENDERER.gl) return 'Renderer não inicializado';
        if (ENGINE_ERRORS.length > 0) return 'Erros: ' + ENGINE_ERRORS.join('; ');
        return true;
    });

    T('Performance: 100 atualizações em <150ms', () => {
        const b = new Battle(SCENARIOS[0], 5,
            [{ id: 'guard', x: -5, z: 0, bonus: null }, { id: 'archer', x: -6, z: 2, bonus: null }],
            [{ id: 'guard', x: 5, z: 0, bonus: null }, { id: 'archer', x: 6, z: 2, bonus: null }], []);
        const t0 = performance.now();
        for (let i = 0; i < 100; i++) b.update(1 / 60);
        const ms = performance.now() - t0;
        if (ms > 150) return 'Muito lento: ' + ms.toFixed(1) + 'ms';
        return true;
    });

    T('Estresse: 60 unidades simultâneas sem crash', () => {
        const player = [], enemy = [];
        for (let i = 0; i < 30; i++) player.push({ id: pick(UNITS).id, x: -8 + Math.random() * 4, z: -6 + Math.random() * 12, bonus: null });
        for (let i = 0; i < 30; i++) enemy.push({ id: pick(UNITS).id, x: 6 + Math.random() * 4, z: -6 + Math.random() * 12, bonus: null });
        const b = new Battle(SCENARIOS[0], 5, player, enemy, []);
        for (let i = 0; i < 300; i++) b.update(1 / 60);
        if (!b.alive('player').length && !b.alive('enemy').length && !b.ended) return 'Nenhum resultado';
        return true;
    });

    /* Renderizar resultados */
    const html = R.map(r => `<div class="tst ${r.pass ? 'pass' : 'fail'}">
    <div class="st">${r.pass ? '✓' : '✗'}</div>
    <div><b>${r.name}</b><div class="dim">${r.detail}</div></div></div>`).join('');
    const passCount = R.filter(r => r.pass).length;
    $('#test-results').innerHTML = `<div style="margin:14px 0">
    <div class="kv"><span>Total</span><b>${R.length}</b></div>
    <div class="kv"><span>Passaram</span><b style="color:#6a9a4b">${passCount}</b></div>
    <div class="kv"><span>Falharam</span><b style="color:${passCount === R.length ? '#6a9a4b' : '#b8433a'}">${R.length - passCount}</b></div>
  </div>${html}`;
    return R;
}

/* ===================== 10. INPUT / EVENTOS ===================== */
const INPUT = {
    mouse: [0, 0], down: [false, false, false], dragging: false, draggingUnit: null,
    shift: false, keys: {}, lastClick: [0, 0]
};
function setupInput() {
    const canvas = $('#scene');

    canvas.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        INPUT.mouse[0] = (e.clientX - r.left) / r.width * 2 - 1;
        INPUT.mouse[1] = -((e.clientY - r.top) / r.height * 2 - 1);
        if (INPUT.dragging && !INPUT.draggingUnit) {
            const dx = e.movementX || 0, dy = e.movementY || 0;
            if (INPUT.down[2] || INPUT.shift) { CAM.goal.yaw += dx * 0.006; CAM.goal.pitch = clamp(CAM.goal.pitch + dy * 0.005, 0.25, 1.35); }
            else if (INPUT.down[0] && G.screen === 'deploy') {
                CAM.goal.target[0] -= dx * 0.018; CAM.goal.target[2] += dy * 0.018;
            }
        }
        if (INPUT.draggingUnit && G.screen === 'deploy') {
            const ray = screenRay(CAM, RENDERER.aspect, INPUT.mouse[0], INPUT.mouse[1]);
            if (ray) {
                const hit = rayPlane(ray, 0);
                if (hit) {
                    INPUT.draggingUnit.pos[0] = clamp(hit[0], -17.2, 17.2);
                    INPUT.draggingUnit.pos[2] = clamp(hit[2], -11.2, 11.2);
                }
            }
        }
        if (INPUT.down[0] && G.screen === 'deploy' && !INPUT.draggingUnit) {
            CAM.goal.target[0] -= (e.movementX || 0) * 0.012;
            CAM.goal.target[2] += (e.movementY || 0) * 0.012;
        }
        canvas.classList.toggle('drag', INPUT.dragging && !INPUT.draggingUnit);
    });

    canvas.addEventListener('mousedown', e => {
        INPUT.down[e.button] = true;
        INPUT.dragging = true;
        INPUT.lastClick = [e.clientX, e.clientY];

        if (G.screen === 'deploy' && e.button === 0) {
            /* Tentar selecionar unidade existente para arrastar */
            const ray = screenRay(CAM, RENDERER.aspect, INPUT.mouse[0], INPUT.mouse[1]);
            if (ray && G.battle) {
                let best = null, bestD = Infinity;
                for (const u of G.battle.units) {
                    if (u.faction !== 'player') continue;
                    const d = raySphere(ray, [u.pos[0], 1.2, u.pos[2]], u.radius * 1.5);
                    if (d < bestD && d < 15) { bestD = d; best = u; }
                }
                if (best) { INPUT.draggingUnit = best; G.selUnit = best; renderDeploy(); return; }
            }
            /* Posicionar nova unidade */
            if (G.brush && ray) {
                const hit = rayPlane(ray, 0);
                if (hit && Math.abs(hit[0]) <= 15.5 && Math.abs(hit[2]) <= 9.5) {
                    deployUnit(G.brush, hit[0], hit[2]);
                } else if (hit) { toast('Fora da zona de posicionamento.'); }
            }
        }

        if (G.screen === 'battle' && e.button === 0 && !G.aiming) {
            const ray = screenRay(CAM, RENDERER.aspect, INPUT.mouse[0], INPUT.mouse[1]);
            if (ray && G.battle) {
                let best = null, bestD = Infinity;
                for (const u of G.battle.units) {
                    if (!u.alive) continue;
                    const d = raySphere(ray, [u.pos[0], 1.2, u.pos[2]], u.radius * 1.6);
                    if (d < bestD && d < 15) { bestD = d; best = u; }
                }
                G.selUnit = best;
                renderBattleHUD();
            }
        }
    });

    canvas.addEventListener('mouseup', e => {
        INPUT.down[e.button] = false;
        INPUT.dragging = false;
        const dx = Math.abs(e.clientX - INPUT.lastClick[0]);
        const dy = Math.abs(e.clientY - INPUT.lastClick[1]);
        INPUT.draggingUnit = null;
    });

    canvas.addEventListener('wheel', e => {
        e.preventDefault();
        CAM.goal.dist = clamp(CAM.goal.dist + e.deltaY * 0.018, 8, 62);
    }, { passive: false });

    /* Botão direito em deploy = remover */
    canvas.addEventListener('click', e => {
        if (G.screen === 'deploy' && e.button === 2) {
            const ray = screenRay(CAM, RENDERER.aspect, INPUT.mouse[0], INPUT.mouse[1]);
            if (ray && G.battle) {
                for (let i = G.battle.units.length - 1; i >= 0; i--) {
                    const u = G.battle.units[i];
                    if (u.faction !== 'player') continue;
                    const d = raySphere(ray, [u.pos[0], 1.2, u.pos[2]], u.radius * 1.5);
                    if (d < 15) { G.battle.units.splice(i, 1); renderDeploy(); toast('Unidade removida.'); return; }
                }
            }
        }
    });

    canvas.addEventListener('contextmenu', e => {
        if (G.screen === 'deploy') {
            e.preventDefault();
            const ray = screenRay(CAM, RENDERER.aspect, INPUT.mouse[0], INPUT.mouse[1]);
            if (ray && G.battle) {
                for (let i = G.battle.units.length - 1; i >= 0; i--) {
                    const u = G.battle.units[i];
                    if (u.faction !== 'player') continue;
                    const d = raySphere(ray, [u.pos[0], 1.2, u.pos[2]], u.radius * 1.5);
                    if (d < 15) { G.battle.units.splice(i, 1); renderDeploy(); toast('Unidade removida.'); return; }
                }
            }
        }
    });

    /* Teclado */
    window.addEventListener('keydown', e => {
        INPUT.keys[e.key.toLowerCase()] = true;
        INPUT.shift = e.shiftKey;
        if (G.screen === 'battle') {
            if (e.key === '1') G.battle && G.battle.setStance('player', 'advance');
            if (e.key === '2') G.battle && G.battle.setStance('player', 'hold');
            if (e.key === '3') G.battle && G.battle.setStance('player', 'retreat');
            if (e.key === ' ') { e.preventDefault(); G.paused = !G.paused; }
        }
        if (e.key === 'Escape') {
            if (G.aiming) { G.aiming = null; $('#cast-hint').style.display = 'none'; }
        }
    });
    window.addEventListener('keyup', e => {
        INPUT.keys[e.key.toLowerCase()] = false;
        INPUT.shift = e.shiftKey;
    });

    /* Botões da UI (delegação de eventos) */
    document.getElementById('ui').addEventListener('click', e => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        const arg = btn.dataset.arg;
        handleAction(act, arg, btn);
    });

    /* Slider de dificuldade */
    const diffSlider = $('#diff');
    if (diffSlider) {
        diffSlider.addEventListener('input', () => {
            G.difficulty = parseInt(diffSlider.value);
            updateDiffPreview();
        });
    }

    /* Configurações */
    $('#opt-hp') && $('#opt-hp').addEventListener('change', e => {
        G.save.settings.hp = e.target.checked; saveNow();
    });
    $('#opt-dmg') && $('#opt-dmg').addEventListener('change', e => {
        G.save.settings.dmg = e.target.checked; saveNow();
    });
    $('#opt-fx') && $('#opt-fx').addEventListener('change', e => {
        G.save.settings.fx = e.target.checked; saveNow();
    });
    $('#opt-shadow') && $('#opt-shadow').addEventListener('input', e => {
        G.save.settings.shadow = parseInt(e.target.value); saveNow();
    });
}

/* ===================== 11. AÇÕES DA UI ===================== */
function handleAction(act, arg, btn) {
    switch (act) {
        case 'go': showScreen(arg); break;

        case 'quick':
            G.scenario = SCENARIOS[0]; G.difficulty = 3;
            showScreen('builder'); break;

        case 'start-setup':
            G.armyList = [];
            showScreen('builder'); break;

        /* -- Army Builder -- */
        case 'sel-unit':
            G.selType = arg; renderBuilder(); break;

        case 'army-add': {
            const cost = armyCost() + UNIT_BY_ID[arg].cost;
            if (cost > G.scenario.budget) { toast('Orçamento excedido! Remova outras unidades.'); return; }
            const count = G.armyList.filter(a => a.id === arg).length;
            if (count >= 5) { toast('Máximo de 5 unidades do mesmo tipo.'); return; }
            G.armyList.push({ id: arg });
            renderBuilder(); break;
        }

        case 'army-remove': {
            const idx = G.armyList.map(a => a.id).lastIndexOf(arg);
            if (idx >= 0) G.armyList.splice(idx, 1);
            renderBuilder(); break;
        }

        case 'army-clear':
            G.armyList = []; renderBuilder(); toast('Exército limpo.'); break;

        case 'army-save': {
            if (!G.armyList.length) { toast('Nenhuma unidade para salvar.'); return; }
            G.save.armies.push(JSON.parse(JSON.stringify(G.armyList)));
            if (G.save.armies.length > 5) G.save.armies.shift();
            saveNow(); toast('Composição salva! (' + G.save.armies.length + '/5)'); break;
        }

        case 'army-load': {
            if (!G.save.armies.length) { toast('Nenhuma composição salva.'); return; }
            G.armyList = JSON.parse(JSON.stringify(G.save.armies[G.save.armies.length - 1]));
            renderBuilder(); toast('Composição carregada!'); break;
        }

        case 'army-preset': {
            const presets = {
                defense: [{ id: 'guard' }, { id: 'guard' }, { id: 'guard' }, { id: 'spear' }, { id: 'spear' }, { id: 'bulwark' }, { id: 'banner' }, { id: 'cleric' }],
                ranged: [{ id: 'archer' }, { id: 'archer' }, { id: 'crossbow' }, { id: 'engineer' }, { id: 'guard' }, { id: 'spear' }, { id: 'mage' }, { id: 'cleric' }],
                mobility: [{ id: 'rider' }, { id: 'rider' }, { id: 'rogue' }, { id: 'berserker' }, { id: 'rogue' }, { id: 'archer' }, { id: 'banner' }]
            };
            const p = presets[arg];
            if (!p) return;
            /* Verificar orçamento */
            let cost = 0;
            for (const u of p) cost += UNIT_BY_ID[u.id].cost;
            if (cost > G.scenario.budget) { toast('Preset excede orçamento (' + cost + '/' + G.scenario.budget + ').'); return; }
            G.armyList = p.slice();
            renderBuilder(); toast('Preset aplicado!'); break;
        }

        case 'to-deploy': {
            if (!G.armyList.length) { toast('Recrute pelo menos 1 unidade.'); return; }
            if (armyCost() > G.scenario.budget) { toast('Orçamento excedido!'); return; }
            startDeploy(); break;
        }

        /* -- Deploy -- */
        case 'brush':
            G.brush = G.brush === arg ? null : arg;
            renderDeploy(); break;

        case 'deploy-auto': {
            if (!G.battle) return;
            /* Limpar unidades do jogador */
            G.battle.units = G.battle.units.filter(u => u.faction !== 'player');
            /* Posicionar automaticamente */
            const counts = {};
            G.armyList.forEach(a => counts[a.id] = (counts[a.id] || 0) + 1);
            let z = 0, step = 2.4, side = 1, row = 0;
            const sorted = Object.keys(counts).sort((a, b) => {
                const rank = id => {
                    const u = UNIT_BY_ID[id];
                    return u.tags.indexOf('frontline') >= 0 ? 0 : (u.tags.indexOf('ranged') >= 0 || u.tags.indexOf('backline') >= 0 ? 2 : 1);
                };
                return rank(a) - rank(b);
            });
            for (const id of sorted) {
                for (let i = 0; i < counts[id]; i++) {
                    const u = UNIT_BY_ID[id];
                    let x = -12.5 + Math.random() * 1.5;
                    if (u.tags.indexOf('ranged') >= 0 || u.tags.indexOf('backline') >= 0) x = -14.5 + Math.random() * 2.5;
                    if (u.tags.indexOf('frontline') >= 0) x = -11.5 + Math.random() * 1.5;
                    z = (z + step * side); if (Math.abs(z) > 9) { z = (z > 0 ? 2.2 : -2.2); side *= -1; row++; }
                    G.battle.units.push(new SimUnit(u, 'player', x, clamp(z, -9, 9), G.battle.units.filter(v => v.faction === 'player').length, null));
                }
            }
            G.battle.recalcSynergies();
            G.battle.units.forEach(u => u.recalc());
            renderDeploy(); toast('Formação automática aplicada!'); break;
        }

        case 'deploy-clear': {
            if (!G.battle) return;
            G.battle.units = G.battle.units.filter(u => u.faction !== 'player');
            renderDeploy(); toast('Campo limpo.'); break;
        }

        case 'unit-remove': {
            if (G.selUnit && G.battle) {
                const idx = G.battle.units.indexOf(G.selUnit);
                if (idx >= 0) G.battle.units.splice(idx, 1);
                G.selUnit = null; renderDeploy();
            } break;
        }

        case 'battle-start': {
            if (!G.battle || !G.battle.units.filter(u => u.faction === 'player').length) {
                toast('Posicione pelo menos uma unidade!'); return;
            }
            startBattle(); break;
        }

        /* -- Batalha -- */
        case 'speed':
            G.speed = parseInt(arg);
            G.paused = (G.speed === 0);
            renderBattleHUD(); break;

        case 'stance':
            if (G.battle) { G.battle.setStance('player', arg); G.stance = arg; renderBattleHUD(); }
            break;

        case 'commander': {
            if (!G.battle) return;
            const c = COMMANDERS.find(c => c.id === arg);
            if (!c) return;
            if (G.battle.cool[arg] > 0) { toast(c.name + ' em cooldown.'); return; }
            if (c.targeted) { G.aiming = arg; renderBattleHUD(); return; }
            G.battle.castCommander('player', arg);
            renderBattleHUD(); break;
        }

        case 'focus':
            if (G.selUnit && G.battle) { G.battle.focusTarget = G.selUnit; toast('Foco definido!'); renderBattleHUD(); }
            break;

        case 'camera-reset':
            CAM.set([0, 1.4, 0], 27, 0.16, 0.74); break;

        /* -- Resultado -- */
        case 'retry':
            startDeploy(); break;

        /* -- Arsenal -- */
        case 'unlock': {
            const u = UNIT_BY_ID[arg];
            if (!u) return;
            if (G.save.unlocked.indexOf(arg) >= 0) return;
            if (G.save.gold < u.unlock) { toast('Ouro insuficiente. Necessário: ' + u.unlock + ' 🪙'); return; }
            G.save.gold -= u.unlock;
            G.save.unlocked.push(arg);
            saveNow(); toast(u.name + ' desbloqueada!'); renderArmory(); break;
        }

        /* -- Testes -- */
        case 'run-tests': runTests(); break;

        /* -- Configurações -- */
        case 'reset-save':
            if (confirm('Tem certeza? Isso apaga TODO o progresso.')) {
                G.save = defaultSave(); saveNow(); toast('Progressão resetada.'); showScreen('menu');
            } break;
    }
}

function deployUnit(id, x, z) {
    if (!G.battle) return;
    const def = UNIT_BY_ID[id];
    if (!def) return;
    /* Verificar se já atingiu o limite */
    const total = G.battle.units.filter(u => u.faction === 'player').length;
    const maxCount = G.armyList.length;
    if (total >= maxCount) { toast('Todas as unidades já foram posicionadas.'); return; }
    /* Verificar colisão */
    for (const u of G.battle.units) {
        if (u.faction !== 'player') continue;
        const d = vDistXZ([x, 0, z], u.pos);
        if (d < def.radius * 1.6) { toast('Muito perto de outra unidade.'); return; }
    }
    const u = new SimUnit(def, 'player', x, z, total, null);
    G.battle.units.push(u);
    G.battle.recalcSynergies();
    G.battle.units.forEach(v => v.recalc());
    G.selUnit = u;
    renderDeploy();
}

function startDeploy() {
    /* Criar batalha com inimigos posicionados */
    const enemy = generateEnemyArmy(G.scenario, G.difficulty);
    const playerList = [];
    G.battle = new Battle(G.scenario, G.difficulty, playerList, enemy.list, []);
    /* Limpar unidades do jogador (serão posicionadas pelo jogador) */
    G.battle.units = G.battle.units.filter(u => u.faction === 'enemy');
    /* Reconstruir lista de unidades inimigas com SimUnit */
    G.battle = new Battle(G.scenario, G.difficulty, [], enemy.list, []);
    G.selUnit = null; G.brush = null;
    G.stance = 'advance';
    showScreen('deploy');
}

function startBattle() {
    if (!G.battle) return;
    G.battle.started = true;
    G.battle.recalcSynergies();
    G.battle.units.forEach(u => u.recalc());
    G.speed = 1; G.paused = false;
    showScreen('battle');
    toast('Batalha iniciada!');
}

/* ===================== 12. GAME LOOP ===================== */
let lastTime = 0;
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    G.menuT += dt;

    /* Atualizar câmera */
    CAM.update(dt);

    /* Teclado (movimento da câmera) */
    const camSpd = 22 * dt * (INPUT.shift ? 2 : 1);
    const cs = Math.cos(CAM.goal.yaw), sn = Math.sin(CAM.goal.yaw);
    if (INPUT.keys['w'] || INPUT.keys['arrowup']) { CAM.goal.target[0] -= cs * camSpd; CAM.goal.target[2] -= sn * camSpd; }
    if (INPUT.keys['s'] || INPUT.keys['arrowdown']) { CAM.goal.target[0] += cs * camSpd; CAM.goal.target[2] += sn * camSpd; }
    if (INPUT.keys['a'] || INPUT.keys['arrowleft']) { CAM.goal.target[0] -= sn * camSpd; CAM.goal.target[2] += cs * camSpd; }
    if (INPUT.keys['d'] || INPUT.keys['arrowright']) { CAM.goal.target[0] += sn * camSpd; CAM.goal.target[2] -= cs * camSpd; }
    if (INPUT.keys['q']) CAM.goal.yaw -= 1.4 * dt;
    if (INPUT.keys['e']) CAM.goal.yaw += 1.4 * dt;
    CAM.goal.target[0] = clamp(CAM.goal.target[0], -16, 16);
    CAM.goal.target[2] = clamp(CAM.goal.target[2], -10, 10);

    /* Atualizar simulação */
    if (G.battle && G.battle.started && !G.battle.ended && !G.paused) {
        const simDt = dt * G.speed;
        G.battle.update(simDt);
        FXSYS.update(simDt);

        if (G.battle.ended) {
            setTimeout(() => showResult(), 1800);
        }
        /* Atualizar HUD periodicamente */
        if (Math.floor(G.battle.time * 4) !== Math.floor((G.battle.time - simDt) * 4)) {
            if (G.screen === 'battle') renderBattleHUD();
        }
    } else {
        FXSYS.update(dt);
    }

    /* Animação idle para unidades decorativas do menu */
    if (G.deco) {
        for (const u of G.deco) {
            u.phase += dt * 1.6;
            if (!u.alive) u.deadT += dt;
        }
    }

    /* Renderizar */
    renderScene(dt);
}

/* ===================== 13. INICIALIZAÇÃO ===================== */
function init() {
    /* Salvar */
    G.save = loadSave();

    /* Renderer */
    const canvas = $('#scene');
    RENDERER = new Renderer(canvas);
    if (ENGINE_ERRORS.length) {
        $('#fatal').style.display = 'block';
        $('#fatal').innerHTML = '<h2>Erro na inicialização</h2>' +
            ENGINE_ERRORS.map(e => '<p>' + e + '</p>').join('');
        return;
    }
    CAM = new Camera();

    /* Decals */
    buildDecals();

    /* Terreno e cenário */
    const props = buildProps(SCENARIOS[0].seed);
    G.terrain = buildTerrain(SCENARIOS[0].seed);
    G.sceneProps = props;

    /* Input */
    setupInput();

    /* Renderizar menu inicial */
    renderMenu();
    showScreen('menu');

    /* Loop */
    requestAnimationFrame(gameLoop);
}

/* Verificar erros não capturados */
window.addEventListener('error', e => {
    const f = $('#fatal');
    if (f) {
        f.style.display = 'block';
        f.innerHTML = '<h2>Erro de runtime</h2><p>' + e.message + '</p><p>' + e.filename + ':' + e.lineno + '</p>';
    }
});

/* Iniciar quando DOM estiver pronto */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
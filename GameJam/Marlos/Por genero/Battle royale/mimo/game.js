(function () {
    "use strict";

    // ═══════════════════════════════════════════════════════
    //  CONSTANTS
    // ═══════════════════════════════════════════════════════
    var MW = 2000, MH = 2000, CX = MW / 2, CY = MH / 2;
    var BASE_R = 12, BASE_HP = 100, BASE_SPD = 180;
    var BSPD = 360, RSPD = 540, NSPD = 300;
    var BDMG = 15, BRAD = 4;
    var CDN = 500, CDR = 150, CDS = 800;
    var SPR = Math.PI / 6, NVC = 16;
    var BOTS = 19, MLV = 10;
    var ZDUR = 180000, ZR0 = 1000, ZR1 = 100, ZDMG = 8;
    var NUR = 8, NUP = 25, MXP = 400;

    // ═══════════════════════════════════════════════════════
    //  CANVAS
    // ═══════════════════════════════════════════════════════
    var cv = document.getElementById("gc");
    var cx = cv.getContext("2d");
    var ui = document.getElementById("ui");

    function resize() { cv.width = innerWidth; cv.height = innerHeight; }
    addEventListener("resize", resize);
    resize();

    // ═══════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════
    var st = "menu", ents = [], buls = [], nucs = [], parts = [], decos = [];
    var pl = null, cam = { x: 0, y: 0 };
    var zR = ZR0, zStart = 0, alive = 0, res = "", lt = 0, endTO = null;

    // ═══════════════════════════════════════════════════════
    //  INPUT
    // ═══════════════════════════════════════════════════════
    var keys = {}, mx = 0, my = 0;

    document.addEventListener("keydown", function (e) {
        keys[e.key.toLowerCase()] = true;
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(e.key.toLowerCase()) >= 0) e.preventDefault();
    });
    document.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });
    cv.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    // ═══════════════════════════════════════════════════════
    //  MATH
    // ═══════════════════════════════════════════════════════
    function dist(x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); }
    function angl(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); }
    function rnd(a, b) { return Math.random() * (b - a) + a; }
    function clp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function lrp(a, b, t) { return a + (b - a) * t; }

    function rrect(x, y, w, h, r) {
        cx.beginPath();
        cx.moveTo(x + r, y); cx.lineTo(x + w - r, y);
        cx.quadraticCurveTo(x + w, y, x + w, y + r);
        cx.lineTo(x + w, y + h - r);
        cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        cx.lineTo(x + r, y + h);
        cx.quadraticCurveTo(x, y + h, x, y + h - r);
        cx.lineTo(x, y + r);
        cx.quadraticCurveTo(x, y, x + r, y);
        cx.closePath();
    }

    function w2s(wx, wy) { return { x: wx - cam.x, y: wy - cam.y }; }

    // ═══════════════════════════════════════════════════════
    //  EVOLUTION TABLES
    // ═══════════════════════════════════════════════════════
    function nNeed(lv) { return lv >= MLV ? 0 : lv <= 3 ? 1 : lv <= 7 ? 2 : 3; }
    function nDrop(lv) { return lv <= 3 ? 1 : lv <= 7 ? 2 : lv <= 9 ? 3 : 5; }
    function eHP(lv)   { return lv <= 3 ? BASE_HP : lv <= 7 ? BASE_HP * 1.5 : lv <= 9 ? BASE_HP * 2.5 : BASE_HP * 5; }
    function eR(lv)    { return lv <= 3 ? BASE_R : lv <= 7 ? BASE_R * 1.5 : lv <= 9 ? BASE_R * 2 : BASE_R * 3; }
    function eAT(lv)   { return lv <= 3 ? 0 : lv <= 7 ? 1 : lv <= 9 ? 2 : 3; }
    function eCD(lv)   { return lv <= 7 ? CDN : lv <= 9 ? CDR : CDS; }
    function eSpd(lv)  { return BASE_SPD * (1 - (eR(lv) - BASE_R) / (BASE_R * 3) * 0.22); }

    // ═══════════════════════════════════════════════════════
    //  ENTITY FACTORY
    // ═══════════════════════════════════════════════════════
    function mkE(x, y, isP) {
        var hue = ~~rnd(0, 360);
        return {
            x: x, y: y, lv: 1, nuc: 0,
            hp: BASE_HP, mhp: BASE_HP,
            r: BASE_R, spd: BASE_SPD,
            alive: true, isP: isP,
            cd: 0, ang: rnd(0, 6.283),
            vx: 0, vy: 0,
            col: isP ? "#00ff88" : "hsl(" + hue + ",65%,58%)",
            tx: 0, ty: 0, ai: "w", wt: 0, fl: 0
        };
    }

    function rSt(e) { e.mhp = eHP(e.lv); e.hp = e.mhp; e.r = eR(e.lv); e.spd = eSpd(e.lv); }

    function addN(e, n) {
        e.nuc += n;
        while (e.lv < MLV) {
            var nd = nNeed(e.lv);
            if (nd === 0 || e.nuc < nd) break;
            e.nuc -= nd; e.lv++; rSt(e); fxLv(e.x, e.y);
        }
    }

    // ═══════════════════════════════════════════════════════
    //  BULLETS
    // ═══════════════════════════════════════════════════════
    function mkB(x, y, a, s, o) {
        return { x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: BRAD, dmg: BDMG, own: o, alive: true, life: 2200 };
    }

    function shoot(e) {
        if (e.cd > 0) return;
        var t = eAT(e.lv), o = e.r + 4, i, a;
        if (t === 0) {
            e.cd = CDN;
            buls.push(mkB(e.x + Math.cos(e.ang) * o, e.y + Math.sin(e.ang) * o, e.ang, BSPD, e));
        } else if (t === 1) {
            e.cd = CDN;
            for (i = -1; i <= 1; i++) {
                a = e.ang + i * SPR / 2;
                buls.push(mkB(e.x + Math.cos(a) * o, e.y + Math.sin(a) * o, a, BSPD, e));
            }
        } else if (t === 2) {
            e.cd = CDR;
            buls.push(mkB(e.x + Math.cos(e.ang) * o, e.y + Math.sin(e.ang) * o, e.ang + rnd(-0.07, 0.07), RSPD, e));
        } else {
            e.cd = CDS;
            for (i = 0; i < NVC; i++) {
                a = (6.283 / NVC) * i;
                buls.push(mkB(e.x + Math.cos(a) * o, e.y + Math.sin(a) * o, a, NSPD, e));
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    //  NUCLEI
    // ═══════════════════════════════════════════════════════
    function spN(x, y, c) {
        for (var i = 0; i < c; i++) {
            var a = rnd(0, 6.283), d = rnd(10, 40);
            nucs.push({ x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, r: NUR, alive: true, pu: rnd(0, 6.28) });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  PARTICLES
    // ═══════════════════════════════════════════════════════
    function fxDeath(x, y, col) {
        for (var i = 0; i < 18; i++) {
            if (parts.length >= MXP) return;
            var a = rnd(0, 6.283), s = rnd(80, 350);
            parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 700, ml: 700, r: rnd(2, 7), col: col });
        }
    }
    function fxLv(x, y) {
        for (var i = 0; i < 20; i++) {
            if (parts.length >= MXP) return;
            var a = (6.283 / 20) * i, s = rnd(140, 340);
            parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 800, ml: 800, r: rnd(2, 5), col: "#ffdd00" });
        }
    }
    function fxPick(x, y) {
        for (var i = 0; i < 6; i++) {
            if (parts.length >= MXP) return;
            var a = rnd(0, 6.283), s = rnd(40, 120);
            parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 350, ml: 350, r: rnd(1.5, 3.5), col: "#00eeff" });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  ZONE
    // ═══════════════════════════════════════════════════════
    function getZR() {
        return st !== "playing" ? ZR0 : lrp(ZR0, ZR1, clp((performance.now() - zStart) / ZDUR, 0, 1));
    }
    function inZ(x, y) { return dist(x, y, CX, CY) <= zR; }

    // ═══════════════════════════════════════════════════════
    //  BOT AI
    // ═══════════════════════════════════════════════════════
    function botAI(b, dt) {
        var dc = dist(b.x, b.y, CX, CY), i, d;

        // Priority 1: Flee from gas
        if (!inZ(b.x, b.y) || dc > zR - 90) {
            var fa = angl(b.x, b.y, CX, CY);
            b.tx = CX + Math.cos(fa + rnd(-0.3, 0.3)) * rnd(0, 80);
            b.ty = CY + Math.sin(fa + rnd(-0.3, 0.3)) * rnd(0, 80);
            b.ai = "f";
        } else {
            // Priority 2: Collect nucleus
            var bn = null, bd = 400;
            for (i = 0; i < nucs.length; i++) {
                var n = nucs[i]; if (!n.alive) continue;
                d = dist(b.x, b.y, n.x, n.y);
                if (d < bd) { bd = d; bn = n; }
            }
            if (bn) {
                b.tx = bn.x; b.ty = bn.y; b.ai = "c";
            } else {
                // Priority 3: Hunt
                var tgt = null, td = 520;
                for (i = 0; i < ents.length; i++) {
                    var o = ents[i]; if (!o.alive || o === b) continue;
                    d = dist(b.x, b.y, o.x, o.y);
                    if (d < td) { td = d; tgt = o; }
                }
                if (tgt) {
                    b.tx = tgt.x; b.ty = tgt.y;
                    b.ang = angl(b.x, b.y, tgt.x, tgt.y);
                    b.ai = "h";
                    if (td < 480) shoot(b);
                } else {
                    b.wt -= dt;
                    if (b.wt <= 0) {
                        b.tx = clp(b.x + rnd(-400, 400), 80, MW - 80);
                        b.ty = clp(b.y + rnd(-400, 400), 80, MH - 80);
                        b.wt = rnd(1200, 3000);
                    }
                    b.ai = "w";
                }
            }
        }

        // Opportunistic fire
        if (b.ai !== "h") {
            var ne = null, nd2 = 280;
            for (var k = 0; k < ents.length; k++) {
                var ek = ents[k]; if (!ek.alive || ek === b) continue;
                var d2 = dist(b.x, b.y, ek.x, ek.y);
                if (d2 < nd2) { nd2 = d2; ne = ek; }
            }
            if (ne) { b.ang = angl(b.x, b.y, ne.x, ne.y); shoot(b); }
        }

        // Movement
        var md = dist(b.x, b.y, b.tx, b.ty);
        if (md > 5) {
            var ma = angl(b.x, b.y, b.tx, b.ty);
            b.vx = Math.cos(ma) * b.spd;
            b.vy = Math.sin(ma) * b.spd;
            if (b.ai !== "h") b.ang = ma;
        } else {
            b.vx = 0; b.vy = 0;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  CAMERA
    // ═══════════════════════════════════════════════════════
    function upCam() {
        if (!pl || !pl.alive) return;
        cam.x = clp(pl.x - cv.width / 2, 0, Math.max(0, MW - cv.width));
        cam.y = clp(pl.y - cv.height / 2, 0, Math.max(0, MH - cv.height));
    }

    // ═══════════════════════════════════════════════════════
    //  DECORATIONS
    // ═══════════════════════════════════════════════════════
    function mkDeco() {
        decos = [];
        for (var i = 0; i < 50; i++) {
            decos.push({
                x: rnd(0, MW), y: rnd(0, MH), r: rnd(50, 200),
                c: "rgba(" + ~~rnd(10, 30) + "," + ~~rnd(15, 45) + "," + ~~rnd(35, 75) + ",.22)"
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    //  KILL
    // ═══════════════════════════════════════════════════════
    function killE(e) {
        e.alive = false;
        fxDeath(e.x, e.y, e.col);
        spN(e.x, e.y, nDrop(e.lv));
        if (e.isP) { st = "gameover"; res = "lose"; showEnd(); }
    }

    // ═══════════════════════════════════════════════════════
    //  UI SCREENS
    // ═══════════════════════════════════════════════════════
    function showMenu() {
        ui.classList.remove("hidden");
        ui.innerHTML =
            '<h1>MICRO ROYALE</h1>' +
            '<h2>EVOLUÇÃO</h2>' +
            '<p>20 jogadores. 1 sobrevive. Colete Núcleos para evoluir.</p>' +
            '<p>Fique dentro da zona vermelha ou perca HP.</p>' +
            '<p class="keys">WASD / Setas = mover &nbsp;&bull;&nbsp; Mouse = mirar &nbsp;&bull;&nbsp; Tiro automático</p>' +
            '<button onclick="window._go()">INICIAR PARTIDA</button>';
    }

    function showEnd() {
        endTO = setTimeout(function () {
            ui.classList.remove("hidden");
            var title, sub, col;
            if (res === "win") {
                title = "VITÓRIA"; sub = "Último sobrevivente!"; col = "#ffdd00";
            } else {
                title = "ELIMINADO"; sub = "Top " + alive + " de " + (BOTS + 1); col = "#ff3344";
            }
            ui.innerHTML =
                '<h1 style="color:' + col + '">' + title + '</h1>' +
                '<h2 style="color:#777">' + sub + '</h2>' +
                '<p style="color:#999">Nível alcançado: ' + (pl ? pl.lv : 1) + '</p>' +
                '<button onclick="window._go()">JOGAR NOVAMENTE</button>';
        }, 1400);
    }

    // ═══════════════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════════════
    function init() {
        if (endTO) { clearTimeout(endTO); endTO = null; }
        ents = []; buls = []; nucs = []; parts = [];
        zR = ZR0; zStart = performance.now(); res = ""; lt = 0;
        mkDeco();

        var px = rnd(350, MW - 350), py = rnd(350, MH - 350);
        pl = mkE(px, py, true);
        ents.push(pl);

        for (var i = 0; i < BOTS; i++) {
            var bx, by, tries = 0;
            do {
                bx = rnd(120, MW - 120); by = rnd(120, MH - 120); tries++;
            } while (dist(bx, by, px, py) < 400 && tries < 50);
            ents.push(mkE(bx, by, false));
        }

        for (var j = 0; j < 45; j++) spN(rnd(120, MW - 120), rnd(120, MH - 120), 1);

        st = "playing";
        ui.classList.add("hidden");
    }

    window._go = init;

    // ═══════════════════════════════════════════════════════
    //  UPDATE
    // ═══════════════════════════════════════════════════════
    function update(dt) {
        zR = getZR();
        var i, j, e, b, n, p;

        // Timers
        for (i = 0; i < ents.length; i++) {
            e = ents[i]; if (!e.alive) continue;
            if (e.cd > 0) e.cd = Math.max(0, e.cd - dt);
            if (e.fl > 0) e.fl = Math.max(0, e.fl - dt);
        }

        // Player input
        if (pl.alive) {
            var dx = 0, dy = 0;
            if (keys["w"] || keys["arrowup"]) dy = -1;
            if (keys["s"] || keys["arrowdown"]) dy = 1;
            if (keys["a"] || keys["arrowleft"]) dx = -1;
            if (keys["d"] || keys["arrowright"]) dx = 1;
            if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }
            pl.vx = dx * pl.spd; pl.vy = dy * pl.spd;
            pl.ang = angl(pl.x, pl.y, mx + cam.x, my + cam.y);
            shoot(pl);
        }

        // Bot AI
        for (i = 0; i < ents.length; i++) { e = ents[i]; if (!e.alive || e.isP) continue; botAI(e, dt); }

        // Move
        for (i = 0; i < ents.length; i++) {
            e = ents[i]; if (!e.alive) continue;
            e.x += e.vx * dt / 1000;
            e.y += e.vy * dt / 1000;
            e.x = clp(e.x, e.r, MW - e.r);
            e.y = clp(e.y, e.r, MH - e.r);
        }

        // Entity push
        for (i = 0; i < ents.length; i++) {
            for (j = i + 1; j < ents.length; j++) {
                var ea = ents[i], eb = ents[j];
                if (!ea.alive || !eb.alive) continue;
                var cd = dist(ea.x, ea.y, eb.x, eb.y), mn = ea.r + eb.r;
                if (cd < mn && cd > 0.01) {
                    var ov = (mn - cd) / 2, ca = angl(ea.x, ea.y, eb.x, eb.y);
                    ea.x -= Math.cos(ca) * ov; ea.y -= Math.sin(ca) * ov;
                    eb.x += Math.cos(ca) * ov; eb.y += Math.sin(ca) * ov;
                }
            }
        }

        // Bullets
        for (i = buls.length - 1; i >= 0; i--) {
            b = buls[i]; if (!b.alive) continue;
            b.x += b.vx * dt / 1000; b.y += b.vy * dt / 1000; b.life -= dt;
            if (b.x < -10 || b.x > MW + 10 || b.y < -10 || b.y > MH + 10 || b.life <= 0) { b.alive = false; continue; }
            for (j = 0; j < ents.length; j++) {
                e = ents[j]; if (!e.alive || e === b.own) continue;
                if (dist(b.x, b.y, e.x, e.y) < b.r + e.r) {
                    e.hp -= b.dmg; e.fl = 120; b.alive = false;
                    if (e.hp <= 0) killE(e);
                    break;
                }
            }
        }

        // Pickup
        for (i = 0; i < ents.length; i++) {
            e = ents[i]; if (!e.alive) continue;
            for (j = nucs.length - 1; j >= 0; j--) {
                n = nucs[j]; if (!n.alive) continue;
                if (dist(e.x, e.y, n.x, n.y) < e.r + NUP) { n.alive = false; addN(e, 1); fxPick(n.x, n.y); }
            }
        }

        // Zone damage
        for (i = 0; i < ents.length; i++) {
            e = ents[i]; if (!e.alive) continue;
            if (!inZ(e.x, e.y)) {
                e.hp -= ZDMG * dt / 1000; e.fl = 60;
                if (e.hp <= 0) killE(e);
            }
        }

        // Particles
        for (i = 0; i < parts.length; i++) {
            p = parts[i];
            p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
            var fr = Math.pow(0.955, dt / 16.667);
            p.vx *= fr; p.vy *= fr; p.life -= dt;
        }

        // Cleanup
        buls = buls.filter(function (b) { return b.alive; });
        nucs = nucs.filter(function (n) { return n.alive; });
        parts = parts.filter(function (p) { return p.life > 0; });

        alive = 0;
        for (i = 0; i < ents.length; i++) if (ents[i].alive) alive++;

        if (st === "playing" && pl.alive && alive === 1) { st = "gameover"; res = "win"; showEnd(); }

        upCam();
    }

    // ═══════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════
    function render() {
        var W = cv.width, H = cv.height, i, p, e, b, n, d, s;
        cx.clearRect(0, 0, W, H);

        // Background
        cx.fillStyle = "#0c0c1a";
        cx.fillRect(0, 0, W, H);

        // Decorations
        for (i = 0; i < decos.length; i++) {
            d = decos[i]; p = w2s(d.x, d.y);
            if (p.x + d.r < -10 || p.x - d.r > W + 10 || p.y + d.r < -10 || p.y - d.r > H + 10) continue;
            cx.fillStyle = d.c;
            cx.beginPath(); cx.arc(p.x, p.y, d.r, 0, 6.283); cx.fill();
        }

        // Grid
        var gs = 100, gx0 = -(cam.x % gs), gy0 = -(cam.y % gs);
        cx.strokeStyle = "rgba(255,255,255,.035)";
        cx.lineWidth = 1;
        for (var gx = gx0; gx < W; gx += gs) { cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, H); cx.stroke(); }
        for (var gy = gy0; gy < H; gy += gs) { cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(W, gy); cx.stroke(); }

        // Map border
        var tl = w2s(0, 0), br = w2s(MW, MH);
        cx.strokeStyle = "rgba(255,255,255,.12)";
        cx.lineWidth = 2.5;
        cx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

        // ── ZONE ──
        drawZone(W, H);

        // Nuclei
        var now = performance.now();
        for (i = 0; i < nucs.length; i++) {
            n = nucs[i]; if (!n.alive) continue;
            p = w2s(n.x, n.y);
            if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) continue;
            n.pu += 0.055;
            var glow = 0.55 + Math.sin(n.pu) * 0.35;

            // Outer glow
            cx.save();
            cx.globalAlpha = glow * 0.35;
            cx.fillStyle = "#00ffff";
            cx.beginPath(); cx.arc(p.x, p.y, NUR * 2.2, 0, 6.283); cx.fill();
            cx.globalAlpha = glow;
            cx.shadowColor = "#00ffff";
            cx.shadowBlur = 22;
            cx.fillStyle = "#00eeff";
            cx.fillRect(p.x - NUR, p.y - NUR, NUR * 2, NUR * 2);
            cx.shadowBlur = 0;
            cx.restore();

            // Bright core
            var cs = NUR * 0.45 + Math.sin(n.pu * 1.4) * 1.8;
            cx.fillStyle = "#ccffff";
            cx.fillRect(p.x - cs, p.y - cs, cs * 2, cs * 2);
        }

        // Particles
        for (i = 0; i < parts.length; i++) {
            p = parts[i]; s = w2s(p.x, p.y);
            if (s.x < -15 || s.x > W + 15 || s.y < -15 || s.y > H + 15) continue;
            var al = clp(p.life / p.ml, 0, 1);
            cx.globalAlpha = al;
            cx.fillStyle = p.col;
            cx.beginPath(); cx.arc(s.x, s.y, p.r * al, 0, 6.283); cx.fill();
        }
        cx.globalAlpha = 1;

        // Bullets
        for (i = 0; i < buls.length; i++) {
            b = buls[i]; if (!b.alive) continue;
            p = w2s(b.x, b.y);
            if (p.x < -15 || p.x > W + 15 || p.y < -15 || p.y > H + 15) continue;
            var ba = angl(0, 0, b.vx, b.vy);
            cx.save();
            cx.translate(p.x, p.y); cx.rotate(ba);
            var isPB = b.own === pl;
            cx.fillStyle = isPB ? "#00ff88" : "#ff4433";
            cx.shadowColor = isPB ? "#00ff88" : "#ff4433";
            cx.shadowBlur = 10;
            cx.beginPath();
            cx.moveTo(BRAD * 1.8, 0);
            cx.lineTo(-BRAD, -BRAD * 0.65);
            cx.lineTo(-BRAD * 0.4, 0);
            cx.lineTo(-BRAD, BRAD * 0.65);
            cx.closePath();
            cx.fill();
            cx.shadowBlur = 0;
            cx.restore();
        }

        // Entities (sorted by Y)
        var sorted = [];
        for (i = 0; i < ents.length; i++) if (ents[i].alive) sorted.push(ents[i]);
        sorted.sort(function (a, b) { return a.y - b.y; });

        for (i = 0; i < sorted.length; i++) {
            e = sorted[i]; p = w2s(e.x, e.y);
            if (p.x < -80 || p.x > W + 80 || p.y < -100 || p.y > H + 50) continue;
            drawEnt(e, p);
        }

        // HUD
        drawHUD(W, H, now);
    }

    // ═══════════════════════════════════════════════════════
    //  DRAW ZONE (corrected — no destination-out)
    // ═══════════════════════════════════════════════════════
    function drawZone(W, H) {
        var c = w2s(CX, CY);
        var now = performance.now();

        // Red overlay OUTSIDE safe zone using inverse-clip path
        cx.save();
        cx.beginPath();
        // Full screen rect (clockwise)
        cx.rect(0, 0, W, H);
        // Circle hole (counter-clockwise)
        cx.arc(c.x, c.y, Math.max(zR, 0), 0, 6.283, true);
        cx.closePath();
        cx.fillStyle = "rgba(160,18,18,.13)";
        cx.fill();
        cx.restore();

        // Dashed border
        cx.strokeStyle = "rgba(255,40,40,.65)";
        cx.lineWidth = 3;
        cx.setLineDash([12, 7]);
        cx.beginPath(); cx.arc(c.x, c.y, zR, 0, 6.283); cx.stroke();
        cx.setLineDash([]);

        // Animated pulse ring
        var pulse = (now % 2500) / 2500;
        cx.strokeStyle = "rgba(255,40,40," + (0.18 * (1 - pulse)) + ")";
        cx.lineWidth = 6 + pulse * 10;
        cx.beginPath(); cx.arc(c.x, c.y, zR + pulse * 20, 0, 6.283); cx.stroke();
    }

    // ═══════════════════════════════════════════════════════
    //  DRAW ENTITY
    // ═══════════════════════════════════════════════════════
    function drawEnt(e, sp) {
        var r = e.r;

        // Shadow
        cx.fillStyle = "rgba(0,0,0,.25)";
        cx.beginPath(); cx.ellipse(sp.x + 3, sp.y + r * 0.6, r * 0.9, r * 0.35, 0, 0, 6.283); cx.fill();

        // Body
        cx.save();
        cx.shadowColor = e.fl > 0 ? "#ffffff" : e.col;
        cx.shadowBlur = e.fl > 0 ? 28 : (e.isP ? 22 : 12);
        cx.fillStyle = e.fl > 0 ? "#ffffff" : e.col;
        cx.beginPath(); cx.arc(sp.x, sp.y, r, 0, 6.283); cx.fill();
        cx.shadowBlur = 0;

        // Inner ring
        cx.strokeStyle = "rgba(255,255,255,.25)";
        cx.lineWidth = 1.5;
        cx.beginPath(); cx.arc(sp.x, sp.y, r * 0.65, 0, 6.283); cx.stroke();

        // Highlight
        cx.fillStyle = "rgba(255,255,255,.18)";
        cx.beginPath(); cx.arc(sp.x - r * 0.22, sp.y - r * 0.22, r * 0.38, 0, 6.283); cx.fill();

        // Muzzle indicator
        var tipX = sp.x + Math.cos(e.ang) * (r + 7);
        var tipY = sp.y + Math.sin(e.ang) * (r + 7);
        cx.fillStyle = e.isP ? "#aaffcc" : "#fff";
        cx.beginPath(); cx.arc(tipX, tipY, 3.5, 0, 6.283); cx.fill();
        cx.restore();

        // HP bar
        var bw = Math.max(r * 2.8, 28), bh = 5;
        var bx = sp.x - bw / 2, by = sp.y - r - 16;
        cx.fillStyle = "rgba(0,0,0,.6)";
        cx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);
        var ratio = clp(e.hp / e.mhp, 0, 1);
        var hpC = ratio > 0.55 ? "#00ff88" : ratio > 0.25 ? "#ffaa00" : "#ff2222";
        cx.fillStyle = hpC;
        cx.fillRect(bx, by, bw * ratio, bh);

        // Level
        cx.fillStyle = "#fff";
        cx.font = "bold 11px 'Courier New',monospace";
        cx.textAlign = "center"; cx.textBaseline = "bottom";
        cx.fillText("Lv" + e.lv, sp.x, sp.y - r - 19);

        // Player label
        if (e.isP) {
            cx.fillStyle = "#00ff88";
            cx.font = "bold 9px 'Courier New',monospace";
            cx.fillText("VOCÊ", sp.x, sp.y - r - 30);
        }

        // Lv10 crown
        if (e.lv >= MLV) {
            cx.fillStyle = "#ffdd00";
            cx.font = "bold 14px 'Courier New',monospace";
            cx.fillText("♛", sp.x, sp.y - r - 30);
        }
    }

    // ═══════════════════════════════════════════════════════
    //  HUD
    // ═══════════════════════════════════════════════════════
    function drawHUD(W, H, now) {
        // Alive counter
        cx.fillStyle = "rgba(0,0,0,.55)";
        rrect(W / 2 - 85, 10, 170, 38, 8); cx.fill();
        cx.fillStyle = "#fff";
        cx.font = "bold 15px 'Courier New',monospace";
        cx.textAlign = "center"; cx.textBaseline = "middle";
        cx.fillText("VIVOS: " + alive + " / " + (BOTS + 1), W / 2, 29);

        // Player panel
        if (pl && pl.alive) {
            var panW = 235, panH = 65;
            cx.fillStyle = "rgba(0,0,0,.5)";
            rrect(12, H - panH - 12, panW, panH, 10); cx.fill();

            cx.fillStyle = "#00ff88";
            cx.font = "bold 13px 'Courier New',monospace";
            cx.textAlign = "left"; cx.textBaseline = "top";
            cx.fillText("Nível " + pl.lv + "   HP " + ~~pl.hp + "/" + pl.mhp, 22, H - panH - 2);

            // Nucleus bar
            var need = nNeed(pl.lv);
            var prog = need > 0 ? clp(pl.nuc / need, 0, 1) : 1;
            cx.fillStyle = "rgba(255,255,255,.08)";
            cx.fillRect(22, H - 28, 200, 12);
            cx.fillStyle = "#00ddff";
            cx.fillRect(22, H - 28, 200 * prog, 12);
            cx.fillStyle = "#fff";
            cx.font = "bold 9px 'Courier New',monospace";
            cx.textAlign = "center";
            cx.fillText(need > 0 ? pl.nuc + " / " + need + " Núcleos" : "NÍVEL MÁXIMO", 122, H - 22);

            // Crosshair
            cx.strokeStyle = "rgba(0,255,136,.55)";
            cx.lineWidth = 1.5;
            cx.beginPath(); cx.arc(mx, my, 16, 0, 6.283); cx.stroke();
            cx.beginPath();
            cx.moveTo(mx - 22, my); cx.lineTo(mx - 9, my);
            cx.moveTo(mx + 9, my); cx.lineTo(mx + 22, my);
            cx.moveTo(mx, my - 22); cx.lineTo(mx, my - 9);
            cx.moveTo(mx, my + 9); cx.lineTo(mx, my + 22);
            cx.stroke();
            cx.fillStyle = "rgba(0,255,136,.7)";
            cx.beginPath(); cx.arc(mx, my, 2, 0, 6.283); cx.fill();
        }

        // Minimap
        drawMinimap(W, H);
    }

    // ═══════════════════════════════════════════════════════
    //  MINIMAP
    // ═══════════════════════════════════════════════════════
    function drawMinimap(W, H) {
        var ms = 135, mmX = W - ms - 14, mmY = H - ms - 14, sc = ms / MW;

        cx.fillStyle = "rgba(0,0,0,.6)";
        rrect(mmX - 5, mmY - 5, ms + 10, ms + 10, 6); cx.fill();

        // Zone on minimap
        cx.strokeStyle = "rgba(255,40,40,.55)";
        cx.lineWidth = 1.5;
        cx.beginPath(); cx.arc(mmX + CX * sc, mmY + CY * sc, zR * sc, 0, 6.283); cx.stroke();

        // Entities
        for (var i = 0; i < ents.length; i++) {
            var e = ents[i]; if (!e.alive) continue;
            var ex = mmX + e.x * sc, ey = mmY + e.y * sc;
            cx.fillStyle = e.isP ? "#00ff88" : "rgba(255,255,255,.4)";
            cx.beginPath(); cx.arc(ex, ey, e.isP ? 3.5 : 1.8, 0, 6.283); cx.fill();
            if (e.isP) {
                cx.strokeStyle = "rgba(0,255,136,.4)";
                cx.lineWidth = 1;
                cx.beginPath(); cx.arc(ex, ey, 7, 0, 6.283); cx.stroke();
            }
        }

        // Nuclei (tiny dots)
        cx.fillStyle = "rgba(0,230,255,.3)";
        for (var j = 0; j < nucs.length; j++) {
            var n = nucs[j]; if (!n.alive) continue;
            cx.fillRect(mmX + n.x * sc - 0.7, mmY + n.y * sc - 0.7, 1.4, 1.4);
        }

        // Border
        cx.strokeStyle = "rgba(255,255,255,.18)";
        cx.lineWidth = 1;
        cx.strokeRect(mmX, mmY, ms, ms);
    }

    // ═══════════════════════════════════════════════════════
    //  GAME LOOP
    // ═══════════════════════════════════════════════════════
    function loop(t) {
        requestAnimationFrame(loop);
        if (lt === 0) lt = t;
        var dt = t - lt;
        lt = t;
        if (dt > 100) dt = 100;
        if (st === "playing") update(dt);
        render();
    }

    // ═══════════════════════════════════════════════════════
    //  BOOT
    // ═══════════════════════════════════════════════════════
    showMenu();
    requestAnimationFrame(loop);
})();
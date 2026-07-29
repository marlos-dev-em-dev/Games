// ============================================
// collision.js — Colisões com efeitos de status
// ============================================

const collision = {

    _dist(x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    _circ(ax, ay, ar, bx, by, br) {
        const dx = ax - bx, dy = ay - by;
        return dx * dx + dy * dy <= (ar + br) * (ar + br);
    },

    projeteisRobVsInimigos() {
        const remover = [];
        for (let pi = 0; pi < game.projeteis.length; pi++) {
            const proj = game.projeteis[pi];
            for (const e of game.inimigos) {
                if (!e.vivo || e.surgindoTimer > 0) continue;
                if (this._circ(proj.x, proj.y, proj.tamanho, e.x, e.y, e.tamanho / 2)) {
                    const dist = this._dist(proj.x, proj.y, e.x, e.y);
                    const kdX = (proj.x - e.x) / Math.max(dist, 1);
                    const kdY = (proj.y - e.y) / Math.max(dist, 1);

                    const morreu = enemyManager.receberDano(e, proj.dano, kdX, kdY, proj.knockbackMult);

                    // Efeito visual de impacto
                    effects.criarParticulas(proj.x, proj.y, proj.cor, 4);
                    effects.criarTextoFlutuante(e.x, e.y - e.tamanho / 2 - 5, proj.dano, '#ff4444', 13);

                    // ── Aplicar efeitos de status ──
                    if (proj.efeitos && proj.efeitos.length > 0) {
                        for (const efeito of proj.efeitos) {
                            if (efeito.TIPO === 'vento' || efeito.TIPO === 'sangue' || efeito.TIPO === 'raio' || efeito.TIPO === 'luz' || efeito.TIPO === 'sombra' || efeito.TIPO === 'cristal') {
                                continue; // efeitos passivos, não aplicam no inimigo
                            }
                            enemyManager.aplicarEfeito(e, {
                                tipo: efeito.TIPO,
                                dano: efeito.DANO || 0,
                                duracao: efeito.DURACAO || 0,
                                intervalo: efeito.INTERVALO || 0.5,
                                slowMult: efeito.SLOW_MULT || 1
                            });
                        }
                    }

                    // ── Lifesteal ──
                    if (proj.rouboVida > 0) {
                        game.rob.vida = Math.min(game.rob.vidaMax, game.rob.vida + proj.rouboVida);
                        effects.criarTextoFlutuante(game.rob.x, game.rob.y - 25, '+' + proj.rouboVida + ' ❤️', '#2ecc71', 12);
                    }

                    if (morreu) {
                        enemyManager.processarMorte(e);
                    }

                    remover.push(pi);
                    break;
                }
            }
        }
        for (let i = remover.length - 1; i >= 0; i--) game.projeteis.splice(remover[i], 1);
    },

    projeteisInimigosVsRob() {
        const rob = game.rob;
        if (!rob || !rob.vivo || rob.invencivelTimer > 0) return;
        const remover = [];
        for (let i = 0; i < game.projeteisInimigos.length; i++) {
            const p = game.projeteisInimigos[i];
            if (this._circ(p.x, p.y, p.tamanho, rob.x, rob.y, rob.tamanho / 2)) {
                player.receberDano(p.dano);
                const kb = Math.max(Math.sqrt(p.vx * p.vx + p.vy * p.vy), 1);
                player.knockback(p.vx / kb, p.vy / kb, 120);
                effects.criarTextoFlutuante(rob.x, rob.y - 20, p.dano, '#ff4444', 15);
                effects.shake(4);
                remover.push(i);
            }
        }
        for (let i = remover.length - 1; i >= 0; i--) game.projeteisInimigos.splice(remover[i], 1);
    },

    inimigosVsRob() {
        const rob = game.rob;
        if (!rob || !rob.vivo || rob.invencivelTimer > 0) return;
        for (const e of game.inimigos) {
            if (!e.vivo || e.surgindoTimer > 0) continue;
            if (this._circ(rob.x, rob.y, rob.tamanho / 2, e.x, e.y, e.tamanho / 2)) {
                player.receberDano(e.dano);
                const dx = rob.x - e.x, dy = rob.y - e.y;
                const dist = Math.max(this._dist(rob.x, rob.y, e.x, e.y), 1);
                player.knockback(dx / dist, dy / dist, 200);
                effects.criarTextoFlutuante(rob.x, rob.y - 20, e.dano, '#ff4444', 15);
                effects.shake(5);
            }
        }
    }
};
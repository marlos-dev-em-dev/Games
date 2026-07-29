// ============================================
// projectile.js — Projéteis com efeitos
// ============================================

const projectileManager = {

    criarProjetilRob(alvoX, alvoY, stats) {
        const rob = game.rob;
        const dx = alvoX - rob.x, dy = alvoY - rob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return;

        game.projeteis.push({
            x: rob.x, y: rob.y,
            vx: (dx / dist) * stats.velocidade,
            vy: (dy / dist) * stats.velocidade,
            tamanho: stats.tamanho,
            dano: stats.dano,
            cor: stats.cor,
            corParticula: stats.corParticula || stats.cor,
            vidaUtil: 2.0,
            rouboVida: stats.rouboVida || 0,
            knockbackMult: stats.knockbackMult || 1,
            efeitos: (stats.efeitos || []).map(e => ({ ...e }))
        });
    },

    criarProjetilInimigo(e, ax, ay, vel, dano, cor) {
        const dx = ax - e.x, dy = ay - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) return;
        game.projeteisInimigos.push({
            x: e.x, y: e.y,
            vx: (dx / dist) * vel, vy: (dy / dist) * vel,
            tamanho: 5, dano, cor: cor || '#e74c3c', vidaUtil: 3.5
        });
    },

    criarProjetilAngulo(e, ang, vel, dano, cor) {
        game.projeteisInimigos.push({
            x: e.x, y: e.y,
            vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
            tamanho: 5, dano, cor: cor || '#f1c40f', vidaUtil: 3.5
        });
    },

    atualizarProjeteisRob(dt) {
        game.projeteis = game.projeteis.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vidaUtil -= dt;
            if (Math.random() < 0.35) {
                game.particulas.push({
                    x: p.x + (Math.random() - 0.5) * 4,
                    y: p.y + (Math.random() - 0.5) * 4,
                    vx: -p.vx * 0.1 + (Math.random() - 0.5) * 20,
                    vy: -p.vy * 0.1 + (Math.random() - 0.5) * 20,
                    cor: p.corParticula || p.cor,
                    vida: 0.15 + Math.random() * 0.15, raio: p.tamanho * 0.4
                });
            }
            if (p.x < -10 || p.x > SALA.LARGURA + 10) return false;
            if (p.y < -10 || p.y > SALA.ALTURA + 10) return false;
            return p.vidaUtil > 0;
        });
    },

    atualizarProjeteisInimigos(dt) {
        game.projeteisInimigos = game.projeteisInimigos.filter(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vidaUtil -= dt;
            if (p.x < -10 || p.x > SALA.LARGURA + 10) return false;
            if (p.y < -10 || p.y > SALA.ALTURA + 10) return false;
            return p.vidaUtil > 0;
        });
    }
};
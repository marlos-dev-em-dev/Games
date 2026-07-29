// ============================================
// effects.js — Partículas, manchas, shake, textos
// ============================================

const effects = {

    screenShakeAmount: 0,

    criarParticulas(x, y, cor, qtd) {
        for (let i = 0; i < qtd; i++) {
            const ang = Math.random() * Math.PI * 2;
            const vel = 60 + Math.random() * 100;
            game.particulas.push({
                x, y,
                vx: Math.cos(ang) * vel,
                vy: Math.sin(ang) * vel,
                cor, vida: 0.3 + Math.random() * 0.4,
                raio: 2 + Math.random() * 3
            });
        }
    },

    criarMancha(x, y, raio) {
        game.manchas.push({
            x, y, raio, alpha: 0.35,
            timerTotal: EFEITOS.MANCHA_DURACAO + EFEITOS.MANCHA_FADE,
            timerFade: EFEITOS.MANCHA_FADE
        });
    },

    criarTextoFlutuante(x, y, texto, cor, tamanho) {
        game.textosFlutuantes.push({
            x: x + (Math.random() - 0.5) * 10, y,
            texto: String(texto),
            cor: cor || '#ffffff',
            tamanho: tamanho || 14,
            vida: 0.9, vy: -55
        });
    },

    shake(amount) {
        this.screenShakeAmount = Math.max(this.screenShakeAmount, amount);
    },

    update(dt) {
        game.particulas = game.particulas.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt;
            p.vx *= 0.94; p.vy *= 0.94;
            p.vida -= dt;
            return p.vida > 0;
        });

        game.manchas = game.manchas.filter(m => {
            m.timerTotal -= dt;
            if (m.timerTotal < m.timerFade) m.alpha = (m.timerTotal / m.timerFade) * 0.35;
            return m.timerTotal > 0;
        });

        game.textosFlutuantes = game.textosFlutuantes.filter(t => {
            t.y += t.vy * dt; t.vy *= 0.97; t.vida -= dt;
            return t.vida > 0;
        });

        if (this.screenShakeAmount > 0) {
            this.screenShakeAmount *= 0.85;
            if (this.screenShakeAmount < 0.5) this.screenShakeAmount = 0;
        }
    },

    getShakeOffset() {
        if (this.screenShakeAmount < 0.5) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * this.screenShakeAmount * 2,
            y: (Math.random() - 0.5) * this.screenShakeAmount * 2
        };
    }
};
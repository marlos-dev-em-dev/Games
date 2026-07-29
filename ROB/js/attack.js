// ============================================
// attack.js — Ataque automático com efeitos
// ============================================

const attack = {

    update(dt) {
        const rob = game.rob;
        if (!rob || !rob.vivo) return;

        if (game.levelUpsPendentes > 0) {
            levelSystem.iniciarLevelUp();
            return;
        }

        rob.attackTimer -= dt;
        if (rob.attackTimer > 0) return;

        const alvo = this._alvoMaisProximo();
        if (!alvo) return;

        const stats = this._calcularStats();
        projectileManager.criarProjetilRob(alvo.x, alvo.y, stats);
        rob.attackTimer = stats.intervalo;
    },

    _alvoMaisProximo() {
        const rob = game.rob;
        let maisPerto = null;
        let menorD = Infinity;
        for (const e of game.inimigos) {
            if (!e.vivo || e.surgindoTimer > 0) continue;
            const dx = e.x - rob.x, dy = e.y - rob.y;
            const d = dx * dx + dy * dy;
            if (d < menorD) { menorD = d; maisPerto = e; }
        }
        return maisPerto;
    },

    _calcularStats() {
        const slot1 = game.slotsUso[0];
        const slot2 = game.slotsUso[1];
        const slot3 = game.slotsUso[2];

        let stats = {
            tipo: 'terra_base',
            dano: ATAQUE_BASE.DANO,
            velocidade: ATAQUE_BASE.VELOCIDADE,
            tamanho: ATAQUE_BASE.TAMANHO,
            cor: ATAQUE_BASE.COR,
            corParticula: ATAQUE_BASE.COR_RASTRO,
            intervalo: ATAQUE_BASE.INTERVALO,
            rouboVida: 0,
            knockbackMult: 1,
            efeitos: []
        };

        // Coletar efeitos de TODOS os slots
        const slots = [slot1, slot2, slot3];
        for (const slot of slots) {
            if (!slot) continue;

            const a = slot.ATAQUE;
            stats.dano += a.DANO_BONUS;
            stats.velocidade += a.VELOCIDADE_BONUS;
            stats.tamanho += a.TAMANHO_BONUS;
            stats.cor = a.COR;
            stats.corParticula = a.COR_PARTICULA || a.COR;
            stats.intervalo *= a.INTERVALO_MULT;
            stats.rouboVida = Math.max(stats.rouboVida, a.ROUBO_VIDA || 0);

            // Adicionar efeito de status
            if (slot.EFEITO) {
                stats.efeitos.push({ ...slot.EFEITO });

                // Knockback especial do vento
                if (slot.EFEITO.TIPO === 'vento') {
                    stats.knockbackMult = Math.max(stats.knockbackMult, slot.EFEITO.KNOCKBACK_MULT || 1);
                }
            }

            if (slot === slot1) stats.tipo = slot.ID;
        }

        // Verificar sinergia entre slot1 e slot2
        if (slot1 && slot2) {
            const s = cardData.buscarSinergia(slot1.ID, slot2.ID);
            if (s) {
                stats.tipo = 'sinergia';
                stats.dano += s.DANO_BONUS || 0;
                stats.velocidade += s.VELOCIDADE_BONUS || 0;
                stats.tamanho += s.TAMANHO_BONUS || 0;
                stats.cor = s.COR;
                stats.corParticula = s.COR;
                stats.intervalo *= s.INTERVALO_MULT || 1;
            }
        }

        return stats;
    }
};
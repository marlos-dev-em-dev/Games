// ============================================
// hud.js — Interface: vidas, XP, slots, info
// ============================================

const hud = {

    draw(ctx) {
        if (!game.rob) return;

        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, TELA.LARGURA, 48);
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.fillRect(0, 47, TELA.LARGURA, 1);

        this._vidas(ctx);
        this._xp(ctx);
        this._slots(ctx);
        this._info(ctx);
    },

    _vidas(ctx) {
        const rob = game.rob;
        const startX = 14, y = 16, tam = 14, sp = 4;
        for (let i = 0; i < rob.vidaMax; i++) {
            const x = startX + i * (tam * 2 + sp);
            const cheio = i < rob.vida;
            this._coracao(ctx, x, y, tam, cheio ? '#e74c3c' : '#3a1a1a', cheio ? '#c0392b' : '#2a0a0a');
        }
        const tx = startX + rob.vidaMax * (tam * 2 + sp) + 8;
        renderer.desenharTexto(rob.vida + '/' + rob.vidaMax, tx, y + 4, '#888888', 11, 'left');
    },

    _coracao(ctx, x, y, s, cor, sombra) {
        ctx.save(); ctx.translate(x + s, y + s);
        ctx.fillStyle = sombra;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s, -s * 0.5, -s * 1.5, s * 0.5, 0, s * 1.2);
        ctx.bezierCurveTo(s * 1.5, s * 0.5, s, -s * 0.5, 0, s * 0.3);
        ctx.fill();
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.25);
        ctx.bezierCurveTo(-s * 0.85, -s * 0.55, -s * 1.4, s * 0.3, 0, s * 1.05);
        ctx.bezierCurveTo(s * 1.4, s * 0.3, s * 0.85, -s * 0.55, 0, s * 0.25);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.1, s * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    },

    _xp(ctx) {
        const bx = 14, by = 38, bw = 140, bh = 6;
        const pct = game.xp / game.xpProximoNivel;
        ctx.fillStyle = UI.COR_XP_FUNDO; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = UI.COR_XP; ctx.fillRect(bx, by, bw * pct, bh);
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
        renderer.desenharTexto('Lv.' + game.nivel, bx + bw / 2, by + bh + 10, '#b8a0d0', 10, 'center');
    },

    _slots(ctx) {
        const st = 36, sp = 6;
        const tw = 4 * st + 3 * sp;
        const sx = (TELA.LARGURA - tw) / 2, y = 6;

        for (let i = 0; i < SLOTS.USO; i++) {
            this._slot(ctx, sx + i * (st + sp), y, st, game.slotsUso[i], false, i + 1);
        }

        ctx.fillStyle = '#555555';
        ctx.fillRect(sx + 3 * (st + sp) - sp / 2, y + 4, 1, st - 8);

        this._slot(ctx, sx + 3 * (st + sp), y, st, game.slotCoringa, true, 0);
    },

    _slot(ctx, x, y, tam, carta, ehC, num) {
        if (ehC) {
            ctx.fillStyle = '#1a1a30'; ctx.fillRect(x, y, tam, tam);
            ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 2; ctx.strokeRect(x, y, tam, tam);
            renderer.desenharTexto('🃏', x + tam / 2, y + tam / 2 + 6, '#b8860b', 18, 'center');
        } else {
            ctx.fillStyle = '#1a1a25'; ctx.fillRect(x, y, tam, tam);
            ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 1; ctx.strokeRect(x, y, tam, tam);
            renderer.desenharTexto(String(num), x + tam / 2, y + tam - 4, '#333355', 9, 'center');
        }

        if (carta) {
            ctx.fillStyle = carta.COR_FUNDO; ctx.fillRect(x + 2, y + 2, tam - 4, tam - 4);
            ctx.strokeStyle = carta.COR; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, tam - 4, tam - 4);
            renderer.desenharTexto(carta.ICONE, x + tam / 2, y + tam / 2 + 6, '#ffffff', 18, 'center');
        }
    },

    _info(ctx) {
        const vivos = game.inimigos.filter(e => e.vivo && e.surgindoTimer <= 0).length;
        renderer.desenharTexto('Inimigos: ' + vivos, TELA.LARGURA - 14, 16, '#aaaaaa', 12, 'right');
        const fase = phaseData.pegar(game.faseAtual);
        if (fase) renderer.desenharTexto('Fase ' + fase.NUMERO + ' - ' + fase.NOME, TELA.LARGURA - 14, 32, '#666666', 10, 'right');
    }
};
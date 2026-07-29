// ============================================
// level.js — Level up e seleção de cartas
// ============================================

const levelSystem = {

    opcoes: [],
    cartaIdx: -1,
    fase: 'carta',
    animAlpha: 0,

    iniciarLevelUp() {
        if (game.levelUpsPendentes <= 0) return;
        game.levelUpsPendentes--;
        this.opcoes = cardData.gerarOpcoes(3);
        this.cartaIdx = -1;
        this.fase = 'carta';
        this.animAlpha = 0;
        game.estado = ESTADO.LEVEL_UP;
    },

    update(dt) {
        this.animAlpha = Math.min(1, this.animAlpha + dt * 3);
    },

    draw(ctx) {
        ctx.save(); ctx.globalAlpha = 0.75 * this.animAlpha;
        ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);
        ctx.restore();

        if (this.fase === 'carta') this._drawCartas(ctx);
        else this._drawSlots(ctx);
    },

    _drawCartas(ctx) {
        ctx.save(); ctx.globalAlpha = this.animAlpha;
        renderer.desenharTexto('⬆ LEVEL UP!  Lv.' + game.nivel, TELA.LARGURA / 2, 80, '#9b59b6', 28, 'center');
        renderer.desenharTexto('Escolha uma carta', TELA.LARGURA / 2, 115, '#aaaaaa', 16, 'center');

        const cw = 180, ch = 220, sp = 25;
        const tw = this.opcoes.length * cw + (this.opcoes.length - 1) * sp;
        const sx = (TELA.LARGURA - tw) / 2, sy = 150;
        const mx = input.mouse.x, my = input.mouse.y;

        for (let i = 0; i < this.opcoes.length; i++) {
            const c = this.opcoes[i];
            const cx = sx + i * (cw + sp);
            const hov = mx >= cx && mx <= cx + cw && my >= sy && my <= sy + ch;

            ctx.fillStyle = hov ? '#2a2a4a' : '#1a1a2e'; ctx.fillRect(cx, sy, cw, ch);
            ctx.strokeStyle = hov ? '#ffffff' : c.COR; ctx.lineWidth = hov ? 3 : 2; ctx.strokeRect(cx, sy, cw, ch);

            renderer.desenharTexto(c.ICONE, cx + cw / 2, sy + 60, '#ffffff', 42, 'center');
            renderer.desenharTexto(c.NOME, cx + cw / 2, sy + 110, '#ffffff', 18, 'center');
            renderer.desenharTexto(c.DESCRICAO, cx + cw / 2, sy + 140, '#888888', 12, 'center');

            let corR;
            switch (c.RARIDADE) { case 'comum': corR = '#7f8c8d'; break; case 'rara': corR = '#2980b9'; break; case 'epica': corR = '#f1c40f'; break; }
            renderer.desenharTexto(c.RARIDADE.toUpperCase(), cx + cw / 2, sy + 170, corR, 11, 'center');

            if (game.slotsUso[0]) {
                const sin = cardData.buscarSinergia(game.slotsUso[0].ID, c.ID);
                if (sin) {
                    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(cx + 5, sy + ch - 40, cw - 10, 32);
                    ctx.strokeStyle = sin.COR; ctx.lineWidth = 1; ctx.strokeRect(cx + 5, sy + ch - 40, cw - 10, 32);
                    renderer.desenharTexto(sin.ICONE + ' ' + sin.NOME, cx + cw / 2, sy + ch - 20, sin.COR, 11, 'center');
                }
            }

            if (hov && input.clicou()) { this.cartaIdx = i; this.fase = 'slot'; }
        }
        ctx.restore();
    },

    _drawSlots(ctx) {
        const c = this.opcoes[this.cartaIdx];
        ctx.save(); ctx.globalAlpha = this.animAlpha;
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);

        renderer.desenharTexto(c.ICONE + ' ' + c.NOME, TELA.LARGURA / 2, 80, c.COR, 26, 'center');
        renderer.desenharTexto('Escolha um slot', TELA.LARGURA / 2, 115, '#aaaaaa', 16, 'center');

        const st = 70, sp = 20;
        const total = SLOTS.USO + SLOTS.CORINGA;
        const tw = total * st + (total - 1) * sp;
        const sx = (TELA.LARGURA - tw) / 2, y = 180;
        const mx = input.mouse.x, my = input.mouse.y;

        for (let i = 0; i < total; i++) {
            const x = sx + i * (st + sp);
            const ehC = i === SLOTS.USO;
            const carta = ehC ? game.slotCoringa : game.slotsUso[i];
            const hov = mx >= x && mx <= x + st && my >= y && my <= y + st;

            ctx.fillStyle = hov ? '#2a2a4a' : '#1a1a25'; ctx.fillRect(x, y, st, st);
            ctx.strokeStyle = ehC ? '#b8860b' : (hov ? '#ffffff' : '#3a3a5a');
            ctx.lineWidth = hov ? 3 : 2; ctx.strokeRect(x, y, st, st);

            renderer.desenharTexto(ehC ? 'Coringa' : 'Slot ' + (i + 1), x + st / 2, y - 8, ehC ? '#b8860b' : '#666666', 11, 'center');

            if (carta) {
                ctx.fillStyle = carta.COR_FUNDO; ctx.fillRect(x + 4, y + 4, st - 8, st - 8);
                renderer.desenharTexto(carta.ICONE, x + st / 2, y + st / 2 + 10, '#ffffff', 28, 'center');
            } else {
                renderer.desenharTexto(ehC ? '🃏' : String(i + 1), x + st / 2, y + st / 2 + 8, '#333355', ehC ? 24 : 20, 'center');
            }

            if (hov && input.clicou()) {
                cards.adicionarNoSlot(c, i);
                this._finalizar();
            }
        }

        // Pular
        const by = y + st + 40, bx = TELA.LARGURA / 2 - 80, bw = 160, bh = 36;
        const hovB = mx >= bx && mx <= bx + bw && my >= by && my <= by + bh;
        ctx.fillStyle = hovB ? '#3a3a3a' : '#222222'; ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#555555'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, bw, bh);
        renderer.desenharTexto('Pular', TELA.LARGURA / 2, by + 24, '#888888', 14, 'center');

        if (hovB && input.clicou()) this._finalizar();
        ctx.restore();
    },

    _finalizar() {
        this.fase = 'carta';
        this.cartaIdx = -1;
        game.estado = ESTADO.FASE;
    }
};
// ============================================
// death.js — Tela de morte (reseta nível)
// ============================================

const death = {

    tempo: 0,
    mensagem: '',
    botaoAlpha: 0,
    btnVoltar: null,

    init() {
        this.tempo = 0;
        this.botaoAlpha = 0;
        this.btnVoltar = null;
        this.mensagem = MENSAGENS_MORTE[Math.floor(Math.random() * MENSAGENS_MORTE.length)];
    },

    update(dt) {
        this.tempo += dt;
        if (this.tempo > 2.0) this.botaoAlpha = Math.min(1, this.botaoAlpha + dt * 1.5);
    },

    draw(ctx) {
        const overlayAlpha = Math.min(0.85, this.tempo * 0.8);
        ctx.fillStyle = 'rgba(0,0,0,' + overlayAlpha + ')';
        ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);

        if (this.tempo < 0.5) return;

        const luzY = Math.min(TELA.ALTURA / 2, this.tempo * 80);
        const gradLuz = ctx.createRadialGradient(TELA.LARGURA / 2, luzY - 100, 0, TELA.LARGURA / 2, luzY, 200);
        gradLuz.addColorStop(0, 'rgba(255,255,220,0.15)');
        gradLuz.addColorStop(1, 'rgba(255,255,220,0)');
        ctx.fillStyle = gradLuz;
        ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);

        if (this.tempo > 0.8) this._desenharRobAnjo(ctx);

        if (this.tempo > 1.5) {
            ctx.save(); ctx.globalAlpha = Math.min(1, (this.tempo - 1.5) * 2);
            renderer.desenharTexto(this.mensagem, TELA.LARGURA / 2, TELA.ALTURA / 2 + 70, '#aaaaaa', 18, 'center');
            ctx.restore();
        }

        if (this.botaoAlpha > 0) {
            const btnW = 200, btnH = 50;
            const btnX = TELA.LARGURA / 2 - btnW / 2;
            const btnY = TELA.ALTURA / 2 + 110;
            const mx = input.mouse.x, my = input.mouse.y;
            const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;

            ctx.save(); ctx.globalAlpha = this.botaoAlpha;
            ctx.fillStyle = hover ? '#2a2a2a' : '#1a1a1a'; ctx.fillRect(btnX, btnY, btnW, btnH);
            ctx.strokeStyle = hover ? '#ffffff' : '#555555'; ctx.lineWidth = hover ? 3 : 1;
            ctx.strokeRect(btnX, btnY, btnW, btnH);
            renderer.desenharTexto('Acordar', TELA.LARGURA / 2, btnY + 32, '#ecf0f1', 22, 'center');
            ctx.restore();

            this.btnVoltar = { x: btnX, y: btnY, w: btnW, h: btnH };
        }

        // Clique no botão
        if (this.btnVoltar && input.clicou() && this.botaoAlpha >= 0.8) {
            const b = this.btnVoltar;
            const mx = input.mouse.x, my = input.mouse.y;
            if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
                // RESETAR: cartas + nível
                game.resetarRun();
                game.estado = ESTADO.MAPA;
                map.init();
            }
        }
    },

    _desenharRobAnjo(ctx) {
        const cx = TELA.LARGURA / 2, cy = TELA.ALTURA / 2 - 20, r = 20;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (this.tempo - 0.8) * 2);

        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy); ctx.quadraticCurveTo(cx - 50, cy - 40, cx - 40, cy + 10);
        ctx.quadraticCurveTo(cx - 25, cy + 5, cx - 10, cy + 10); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy); ctx.quadraticCurveTo(cx + 50, cy - 40, cx + 40, cy + 10);
        ctx.quadraticCurveTo(cx + 25, cy + 5, cx + 10, cy + 10); ctx.closePath(); ctx.fill();

        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(200,200,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();

        ctx.strokeStyle = '#333333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 9, cy - 4); ctx.lineTo(cx - 3, cy - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 3, cy - 4); ctx.lineTo(cx + 9, cy - 4); ctx.stroke();

        const aureolaY = cy - r - 10 + Math.sin(game.tempoTotal * 2) * 3;
        ctx.strokeStyle = '#f1c40f'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, aureolaY, 16, 5, 0, 0, Math.PI * 2); ctx.stroke();

        ctx.restore();
    }
};
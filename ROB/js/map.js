// ============================================
// map.js — Mapa do tesouro com navegação A/D
// O jogador fica parado, aperta A ou D para
// mover Rob entre as fases
// ============================================

const map = {

    posicoes: [],
    faseAtualVisual: 0,    // fase que Rob está visualmente
    robX: 0,
    robY: 0,
    robAlvoX: 0,
    robAlvoY: 0,
    tempo: 0,

    init() {
        this.tempo = 0;

        // Posições das fases (linha vertical, de baixo pra cima)
        const espaco = 90;
        const startY = TELA.ALTURA - 80;
        this.posicoes = [];

        for (let i = 0; i < phaseData.total(); i++) {
            this.posicoes.push({
                x: TELA.LARGURA / 2 + Math.sin(i * 1.5) * 100,
                y: startY - i * espaco,
                fase: phaseData.pegar(i)
            });
        }

        // Rob começa na fase atual (ou fase 0)
        this.faseAtualVisual = game.faseAtual;
        const pos = this.posicoes[this.faseAtualVisual] || this.posicoes[0];
        this.robX = pos.x;
        this.robY = pos.y;
        this.robAlvoX = pos.x;
        this.robAlvoY = pos.y;
    },

    update(dt) {
        this.tempo += dt;

        // ── Navegar com A/D ou ←/→ ──
        const disponiveis = this._fasesDisponiveis();
        const idxAtual = disponiveis.indexOf(this.faseAtualVisual);

        if (input.acabouDePressionar('a') || input.acabouDePressionar('arrowleft')) {
            // Ir para fase anterior
            if (idxAtual > 0) {
                this.faseAtualVisual = disponiveis[idxAtual - 1];
            }
        }

        if (input.acabouDePressionar('d') || input.acabouDePressionar('arrowright')) {
            // Ir para próxima fase disponível
            if (idxAtual < disponiveis.length - 1) {
                this.faseAtualVisual = disponiveis[idxAtual + 1];
            }
        }

        // ── Animar Rob até a posição ──
        const pos = this.posicoes[this.faseAtualVisual];
        if (pos) {
            this.robAlvoX = pos.x;
            this.robAlvoY = pos.y - 35;
        }

        this.robX += (this.robAlvoX - this.robX) * 0.08;
        this.robY += (this.robAlvoY - this.robY) * 0.08;
    },

    draw(ctx) {
        // Fundo pergaminho
        const grad = ctx.createLinearGradient(0, 0, 0, TELA.ALTURA);
        grad.addColorStop(0, '#d4a574');
        grad.addColorStop(0.5, '#c49a6c');
        grad.addColorStop(1, '#b8895e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);

        // Textura
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < TELA.ALTURA; i += 3) {
            ctx.fillStyle = i % 6 === 0 ? '#000000' : '#ffffff';
            ctx.fillRect(0, i, TELA.LARGURA, 1);
        }
        ctx.restore();

        // Título
        renderer.desenharTexto('MAPA', TELA.LARGURA / 2, 35, '#3a2a1a', 26, 'center');

        // Linha tracejada conectando fases
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        for (let i = 0; i < this.posicoes.length; i++) {
            const p = this.posicoes[i];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Fases
        for (let i = 0; i < this.posicoes.length; i++) {
            const p = this.posicoes[i];
            const completa = game.fasesCompletas.includes(i);
            const disponivel = i === 0 || game.fasesCompletas.includes(i - 1);
            const selecionada = i === this.faseAtualVisual;
            const raio = 22;

            ctx.beginPath();
            ctx.arc(p.x, p.y, raio, 0, Math.PI * 2);

            if (completa) {
                ctx.fillStyle = '#5a8a3a';
                ctx.fill();
                ctx.strokeStyle = '#3a6a2a';
                ctx.lineWidth = 3;
                ctx.stroke();
                renderer.desenharTexto('✓', p.x, p.y + 6, '#ffffff', 18, 'center');
            } else if (disponivel) {
                ctx.fillStyle = selecionada ? '#aa8844' : '#8a6a3a';
                ctx.fill();
                ctx.strokeStyle = selecionada ? '#ffdd88' : '#c49a6c';
                ctx.lineWidth = selecionada ? 4 : 3;
                ctx.stroke();
                renderer.desenharTexto(String(i + 1), p.x, p.y + 7, '#ffffff', 18, 'center');
            } else {
                ctx.fillStyle = '#4a3a2a';
                ctx.fill();
                ctx.strokeStyle = '#6a5a4a';
                ctx.lineWidth = 2;
                ctx.stroke();
                renderer.desenharTexto('?', p.x, p.y + 7, '#7a6a5a', 18, 'center');
            }

            // Nome da fase
            if (disponivel || completa) {
                renderer.desenharTexto(
                    p.fase.NOME,
                    p.x + (p.x > TELA.LARGURA / 2 ? -1 : 1) * (raio + 12),
                    p.y + 5,
                    '#3a2a1a', 13,
                    p.x > TELA.LARGURA / 2 ? 'right' : 'left'
                );
            }
        }

        // ── Rob no mapa ──
        const r = 12;

        // Sombra
        renderer.desenharCirculo(this.robX, this.robY + r * 0.6, r * 0.7, '#000000', 0.15);

        // Corpo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.robX, this.robY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Olhos (olha para a fase selecionada)
        const faseAlvo = this.posicoes[this.faseAtualVisual];
        let olhaX = 0, olhaY = 0;
        if (faseAlvo) {
            const dx = faseAlvo.x - this.robX;
            const dy = (faseAlvo.y - 35) - this.robY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            olhaX = dx / dist;
            olhaY = dy / dist;
        }

        const olhoDist = r * 0.3;
        const olhoRaio = r * 0.2;
        const pupilaRaio = r * 0.12;
        const shiftX = olhaX * r * 0.1;
        const shiftY = olhaY * r * 0.1;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.robX - olhoDist + shiftX, this.robY - 1 + shiftY, olhoRaio, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.robX + olhoDist + shiftX, this.robY - 1 + shiftY, olhoRaio, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(this.robX - olhoDist + shiftX + olhaX * 1.5, this.robY - 1 + shiftY + olhaY * 1.5, pupilaRaio, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.robX + olhoDist + shiftX + olhaX * 1.5, this.robY - 1 + shiftY + olhaY * 1.5, pupilaRaio, 0, Math.PI * 2);
        ctx.fill();

        // ── Instruções ──
        renderer.desenharTexto(
            'A/D ou ←/→ para navegar  |  ENTER para entrar',
            TELA.LARGURA / 2, TELA.ALTURA - 20,
            '#5a3a1a', 12, 'center'
        );

        // ── Nome da fase selecionada (destaque) ──
        const faseSel = this.posicoes[this.faseAtualVisual];
        if (faseSel) {
            const nome = faseSel.fase.NOME;

            // Fundo sutil
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(TELA.LARGURA / 2 - 130, TELA.ALTURA - 60, 260, 28);

            renderer.desenharTexto(
                '▸ ' + nome + ' ▸',
                TELA.LARGURA / 2, TELA.ALTURA - 40,
                '#3a2a1a', 16, 'center'
            );
        }
    },

    // ── Fases disponíveis (desbloqueadas) ──
    _fasesDisponiveis() {
        const lista = [];
        for (let i = 0; i < phaseData.total(); i++) {
            if (i === 0 || game.fasesCompletas.includes(i - 1)) {
                lista.push(i);
            }
        }
        return lista;
    }
};
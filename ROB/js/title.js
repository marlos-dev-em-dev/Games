// ============================================
// title.js — Tela de título elegante
// ============================================

const title = {

    tempo: 0,
    letrasAlpha: [0, 0, 0],
    textoAlpha: 0,
    pronta: false,

    init() {
        this.tempo = 0;
        this.letrasAlpha = [0, 0, 0];
        this.textoAlpha = 0;
        this.pronta = false;
    },

    update(dt) {
        this.tempo += dt;

        // Cada letra aparece suavemente com intervalo curto
        for (let i = 0; i < 3; i++) {
            const delay = 0.6 + i * 0.35;
            if (this.tempo > delay) {
                this.letrasAlpha[i] = Math.min(1, (this.tempo - delay) * 2.0);
            }
        }

        // "Começar adventura"
        if (this.tempo > 2.8) {
            this.textoAlpha = Math.min(1, (this.tempo - 2.8) * 1.2);
            this.pronta = true;
        }
    },

    draw(ctx) {
        // Fundo preto total
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);

        // Letras R O B — grandes, quadradas, juntas
        const letras = ['R', 'O', 'B'];
        const tamanhoFonte = 120;
        const espaco = 2; // bem juntas
        const fonte = 'bold ' + tamanhoFonte + 'px "Courier New", monospace';

        // Calcular largura total
        ctx.font = fonte;
        let totalW = 0;
        const larguras = [];
        for (let i = 0; i < 3; i++) {
            const w = ctx.measureText(letras[i]).width;
            larguras.push(w);
            totalW += w;
            if (i < 2) totalW += espaco;
        }

        const startX = (TELA.LARGURA - totalW) / 2;
        const baseY = TELA.ALTURA / 2 - 10;

        let cursorX = startX;

        for (let i = 0; i < 3; i++) {
            const alpha = this.letrasAlpha[i];
            if (alpha <= 0) {
                cursorX += larguras[i] + espaco;
                continue;
            }

            const centerX = cursorX + larguras[i] / 2;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Leve brilho de fundo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.font = fonte;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letras[i], centerX, baseY);

            // Letra principal
            ctx.fillStyle = '#ffffff';
            ctx.fillText(letras[i], centerX, baseY);

            // Reflexo sutil embaixo
            ctx.save();
            ctx.globalAlpha = alpha * 0.06;
            ctx.scale(1, -0.3);
            ctx.fillText(letras[i], centerX, -baseY - tamanhoFonte * 1.5);
            ctx.restore();

            ctx.restore();

            cursorX += larguras[i] + espaco;
        }

        // "Começar adventura"
        if (this.textoAlpha > 0) {
            ctx.save();
            ctx.globalAlpha = this.textoAlpha;
            ctx.fillStyle = '#555555';
            ctx.font = 'italic 18px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Enter Para Começar', TELA.LARGURA / 2, baseY + 70);
            ctx.restore();
        }

        // Dica
        if (this.textoAlpha > 0.5) {
            ctx.save();
            ctx.globalAlpha = (this.textoAlpha - 0.5) * 1.5;
            ctx.fillStyle = '#2a2a2a';
            ctx.font = '12px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('ENTER ou clique', TELA.LARGURA / 2, TELA.ALTURA - 40);
            ctx.restore();
        }
    },

    verificarAcao() {
        if (!this.pronta) return false;
        return input.clicou() || input.acabouDePressionar('enter');
    }
};
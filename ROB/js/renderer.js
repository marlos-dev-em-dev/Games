// ============================================
// renderer.js — Canvas adaptativo
// ============================================

const renderer = {

    canvas: null,
    ctx: null,

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.width = TELA.LARGURA;
        this.canvas.height = TELA.ALTURA;
        this.ctx = this.canvas.getContext('2d');
        this._redimensionar();

        window.addEventListener('resize', () => {
            this._redimensionar();
        });
    },

    _redimensionar() {
        const escala = TELA.ESCALA;
        this.canvas.style.width = (TELA.LARGURA * escala) + 'px';
        this.canvas.style.height = (TELA.ALTURA * escala) + 'px';
    },

    limpar() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, TELA.LARGURA, TELA.ALTURA);
    },

    desenharCirculo(x, y, raio, cor, alpha) {
        const ctx = this.ctx;
        ctx.save();
        if (alpha !== undefined) ctx.globalAlpha = alpha;
        ctx.fillStyle = cor;
        ctx.beginPath();
        ctx.arc(x, y, raio, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    desenharRetangulo(x, y, w, h, cor, alpha) {
        const ctx = this.ctx;
        ctx.save();
        if (alpha !== undefined) ctx.globalAlpha = alpha;
        ctx.fillStyle = cor;
        ctx.fillRect(x, y, w, h);
        ctx.restore();
    },

    desenharBorda(x, y, w, h, cor, espessura) {
        this.ctx.strokeStyle = cor;
        this.ctx.lineWidth = espessura;
        this.ctx.strokeRect(x, y, w, h);
    },

    desenharTexto(texto, x, y, cor, tamanho, alinhamento, fonte) {
        const ctx = this.ctx;
        ctx.fillStyle = cor;
        ctx.font = (tamanho || 16) + 'px ' + (fonte || '"Courier New", monospace');
        ctx.textAlign = alinhamento || 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(texto, x, y);
    }
};
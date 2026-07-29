// ============================================
// spawner.js — Sistema de ondas
// ============================================

const spawner = {

    ondaAtual: 0,
    timerOnda: 0,
    inimigosPorOnda: {},
    todasOndasEnviadas: false,
    portoes: [],

    init(faseIndex) {
        const fase = phaseData.pegar(faseIndex);
        if (!fase) return;

        this.ondaAtual = 0;
        this.timerOnda = 0;
        this.todasOndasEnviadas = false;
        this.portoes = [];

        this.inimigosPorOnda = {};
        for (let i = 0; i < fase.ONDAS.length; i++) {
            const onda = fase.ONDAS[i];
            this.inimigosPorOnda[i + 1] = [];
            for (const grupo of onda.INIMIGOS) {
                for (let j = 0; j < grupo.QTD; j++) {
                    this.inimigosPorOnda[i + 1].push(grupo.TIPO);
                }
            }
        }

        this.enviarOnda(1);
    },

    update(dt) {
        this.portoes = this.portoes.filter(g => { g.timer -= dt; return g.timer > 0; });
        if (this.todasOndasEnviadas) return;

        const vivos = game.inimigos.filter(e => e.vivo).length;
        if (vivos === 0) {
            this.timerOnda += dt;
            if (this.timerOnda >= 1.5) {
                this.timerOnda = 0;
                const prox = this.ondaAtual + 1;
                if (this.inimigosPorOnda[prox]) {
                    this.enviarOnda(prox);
                } else {
                    this.todasOndasEnviadas = true;
                }
            }
        }
    },

    enviarOnda(num) {
        this.ondaAtual = num;
        const tipos = this.inimigosPorOnda[num];
        if (!tipos) return;

        const totalOndas = Object.keys(this.inimigosPorOnda).length;
        game.mensagemCentral = 'Onda ' + num + '/' + totalOndas;
        game.mensagemCentralTimer = 1.2;

        const posicoes = this._posicoesBorda(tipos.length);
        for (let i = 0; i < tipos.length; i++) {
            const pos = posicoes[i];
            const e = enemyManager.create(pos.x, pos.y, tipos[i]);
            game.inimigos.push(e);
            this.portoes.push({ x: pos.x, y: pos.y, timer: EFEITOS.SURGIMENTO_DURACAO, timerMax: EFEITOS.SURGIMENTO_DURACAO, cor: INIMIGOS[tipos[i]].COR });
        }
    },

    _posicoesBorda(qtd) {
        const posicoes = [];
        const m = SALA.PAREDE + 20;
        for (let i = 0; i < qtd; i++) {
            const lado = Math.floor(Math.random() * 4);
            let x, y;
            switch (lado) {
                case 0: x = m + Math.random() * (SALA.LARGURA - m * 2); y = m; break;
                case 1: x = m + Math.random() * (SALA.LARGURA - m * 2); y = SALA.ALTURA - m; break;
                case 2: x = m; y = m + Math.random() * (SALA.ALTURA - m * 2); break;
                case 3: x = SALA.LARGURA - m; y = m + Math.random() * (SALA.ALTURA - m * 2); break;
            }
            posicoes.push({ x, y });
        }
        return posicoes;
    },

    tudoCompleto() {
        return this.todasOndasEnviadas && game.inimigos.filter(e => e.vivo).length === 0;
    },

    drawGates(ctx) {
        for (const g of this.portoes) {
            const pct = g.timer / g.timerMax;
            ctx.save(); ctx.globalAlpha = pct * 0.5;
            renderer.desenharCirculo(g.x, g.y, 30 * pct, g.cor);
            ctx.strokeStyle = g.cor; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(g.x, g.y, 30 * pct + 8, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
    }
};
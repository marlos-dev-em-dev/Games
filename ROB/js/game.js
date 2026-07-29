// ============================================
// game.js — Gerencia estado do jogo (XP plano)
// ============================================

class Game {

    constructor() {
        this.estado = ESTADO.TITULO;
        this.tempoTotal = 0;
        this.faseAtual = 0;
        this.fasesCompletas = [];
        this.rob = null;
        this.inimigos = [];
        this.projeteis = [];
        this.projeteisInimigos = [];
        this.particulas = [];
        this.manchas = [];
        this.textosFlutuantes = [];
        this.slotsUso = [null, null, null];
        this.slotCoringa = null;
        this.nivel = 1;
        this.xp = 0;
        this.xpProximoNivel = LEVEL_UP.XP_BASE;
        this.levelUpsPendentes = 0;
        this.mensagemCentral = '';
        this.mensagemCentralTimer = 0;
    }

    iniciarRun() {
        this.faseAtual = 0;
        this.fasesCompletas = [];
        this.slotsUso = [null, null, null];
        this.slotCoringa = null;
        this.nivel = 1;
        this.xp = 0;
        this.xpProximoNivel = LEVEL_UP.XP_BASE;
        this.levelUpsPendentes = 0;
    }

    entrarFase(indice) {
        this.faseAtual = indice;
        this.inimigos = [];
        this.projeteis = [];
        this.projeteisInimigos = [];
        this.particulas = [];
        this.manchas = [];
        this.textosFlutuantes = [];
        this.levelUpsPendentes = 0;

        this.rob = {
            x: SALA.LARGURA / 2,
            y: SALA.ALTURA / 2,
            tamanho: ROB.TAMANHO,
            velocidade: ROB.VELOCIDADE,
            vida: ROB.VIDA_MAX,
            vidaMax: ROB.VIDA_MAX,
            direcao: { x: 0, y: 1 },
            vivo: true,
            invencivelTimer: 0,
            flashTimer: 0,
            knockX: 0,
            knockY: 0,
            attackTimer: 0.5
        };

        this.estado = ESTADO.FASE;
    }

    robMorreu() {
        this.rob.vivo = false;
        this.estado = ESTADO.MORTE;
    }

    faseCompleta() {
        if (!this.fasesCompletas.includes(this.faseAtual)) {
            this.fasesCompletas.push(this.faseAtual);
        }
        this.estado = ESTADO.MAPA;
    }

    // XP SEMPRE igual (sem multiplicador)
    ganharXP(quantidade) {
        this.xp += quantidade;
        while (this.xp >= this.xpProximoNivel) {
            this.xp -= this.xpProximoNivel;
            this.nivel++;
            // XP necessário NÃO muda
            this.levelUpsPendentes++;
        }
        return this.levelUpsPendentes > 0;
    }

    // Resetar nível e cartas (morte)
    resetarRun() {
        this.slotsUso = [null, null, null];
        this.slotCoringa = null;
        this.nivel = 1;
        this.xp = 0;
        this.xpProximoNivel = LEVEL_UP.XP_BASE;
        this.levelUpsPendentes = 0;
    }
}
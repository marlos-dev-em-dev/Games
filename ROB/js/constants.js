// ============================================
// constants.js — CONFIGURAÇÃO CENTRAL DO ROB
// ============================================

const TELA = {
    LARGURA: 800,
    ALTURA: 600,
    // Calculado automaticamente para caber na janela
    get ESCALA() {
        const escalaW = window.innerWidth / this.LARGURA;
        const escalaH = window.innerHeight / this.ALTURA;
        return Math.min(escalaW, escalaH);
    }
};

const ESTADO = {
    TITULO:    'TITULO',
    MAPA:      'MAPA',
    FASE:      'FASE',
    LEVEL_UP:  'LEVEL_UP',
    MORTE:     'MORTE'
};

const ROB = {
    VELOCIDADE: 180,
    VIDA_MAX: 3,
    TAMANHO: 28,
    COR: '#ffffff'
};

const ATAQUE_BASE = {
    VELOCIDADE: 300,
    DANO: 1,
    INTERVALO: 1.2,
    TAMANHO: 10,
    COR: '#8B4513',
    COR_RASTRO: '#D2B48C'
};

const INIMIGOS = {
    SOLDADO: {
        NOME: 'Soldado', VIDA: 3, DANO: 1, VELOCIDADE: 60,
        TAMANHO: 24, COR: '#c0392b', COR_CONTORNO: '#e74c3c',
        XP: 5, FORMATO: 'quadrado'
    },
    ARQUEIRO: {
        NOME: 'Arqueiro', VIDA: 2, DANO: 1, VELOCIDADE: 40,
        TAMANHO: 22, COR: '#27ae60', COR_CONTORNO: '#2ecc71',
        XP: 8, FORMATO: 'losango',
        DISTANCIA_IDEAL: 200, TIRO_INTERVALO: 2.0
    },
    CAPITAO: {
        NOME: 'Capitão', VIDA: 12, DANO: 2, VELOCIDADE: 35,
        TAMANHO: 34, COR: '#7f8c8d', COR_CONTORNO: '#95a5a6',
        XP: 15, FORMATO: 'retangulo'
    },
    CAO: {
        NOME: 'Cão', VIDA: 1, DANO: 1, VELOCIDADE: 150,
        TAMANHO: 18, COR: '#d35400', COR_CONTORNO: '#e67e22',
        XP: 3, FORMATO: 'triangulo'
    },
    REI: {
        NOME: 'Rei Cavalheiro', VIDA: 50, DANO: 2, VELOCIDADE: 45,
        TAMANHO: 48, COR: '#d4a017', COR_CONTORNO: '#f1c40f',
        XP: 50, FORMATO: 'retangulo'
    }
};

const LEVEL_UP = {
    XP_BASE: 10
};

const SLOTS = {
    USO: 3,
    CORINGA: 1
};

const SALA = {
    LARGURA: 800, ALTURA: 600, PAREDE: 30,
    COR_PAREDE: '#2c2c54', COR_CHAO: '#3a3a2a'
};

const EFEITOS = {
    MANCHA_DURACAO: 2.0,
    MANCHA_FADE: 1.5,
    FLASH_DANO: 0.15,
    SURGIMENTO_DURACAO: 0.8
};

const MENSAGENS_MORTE = [
    "Vamos lá, você consegue Rob",
    "ACORDA ROB!!",
    "Não foi dessa vez Rob",
    "Rob...",
    "Levanta, Rob...",
    "Tá dormindo Rob?!",
    "Não desiste, Rob...",
    "De novo, Rob. De novo."
];

const UI = {
    COR_VIDA: '#e74c3c',
    COR_VIDA_FUNDO: '#2c2c2c',
    COR_XP: '#9b59b6',
    COR_XP_FUNDO: '#2c2c2c',
    COR_TEXTO: '#ecf0f1',
    COR_TEXTO_ESCURO: '#7f8c8d'
};
// ============================================
// cardData.js — Cartas, efeitos únicos e sinergias
// ============================================

const cardData = {

    todas: [
        {
            ID: 'fogo', NOME: 'Fogo', ICONE: '🔥',
            RARIDADE: 'comum', COR: '#e74c3c', COR_FUNDO: '#7f1d1d',
            DESCRICAO: 'Inimigo pega fogo (dano com o tempo)',
            ATAQUE: {
                DANO_BONUS: 1, VELOCIDADE_BONUS: 20, TAMANHO_BONUS: 3,
                INTERVALO_MULT: 0.95, COR: '#e74c3c', COR_PARTICULA: '#ff6633'
            },
            EFEITO: { TIPO: 'fogo', DANO: 1, DURACAO: 3, INTERVALO: 0.5 }
        },
        {
            ID: 'gelo', NOME: 'Gelo', ICONE: '❄️',
            RARIDADE: 'comum', COR: '#3498db', COR_FUNDO: '#1a3a5c',
            DESCRICAO: 'Inimigo fica mais lento',
            ATAQUE: {
                DANO_BONUS: 1, VELOCIDADE_BONUS: 10, TAMANHO_BONUS: 2,
                INTERVALO_MULT: 0.95, COR: '#3498db', COR_PARTICULA: '#88ccff'
            },
            EFEITO: { TIPO: 'gelo', SLOW_MULT: 0.45, DURACAO: 2.5 }
        },
        {
            ID: 'raio', NOME: 'Raio', ICONE: '⚡',
            RARIDADE: 'rara', COR: '#f1c40f', COR_FUNDO: '#7f6a0a',
            DESCRICAO: 'Raio rápido, mais dano',
            ATAQUE: {
                DANO_BONUS: 3, VELOCIDADE_BONUS: 80, TAMANHO_BONUS: 0,
                INTERVALO_MULT: 0.85, COR: '#f1c40f', COR_PARTICULA: '#ffff88'
            },
            EFEITO: { TIPO: 'raio' }
        },
        {
            ID: 'veneno', NOME: 'Veneno', ICONE: '☠️',
            RARIDADE: 'comum', COR: '#27ae60', COR_FUNDO: '#145a32',
            DESCRICAO: 'Inimigo envenenado (dano com o tempo)',
            ATAQUE: {
                DANO_BONUS: 0, VELOCIDADE_BONUS: -30, TAMANHO_BONUS: 6,
                INTERVALO_MULT: 1.1, COR: '#27ae60', COR_PARTICULA: '#44ff44'
            },
            EFEITO: { TIPO: 'veneno', DANO: 1, DURACAO: 4, INTERVALO: 0.8 }
        },
        {
            ID: 'vento', NOME: 'Vento', ICONE: '💨',
            RARIDADE: 'comum', COR: '#bdc3c7', COR_FUNDO: '#616a6b',
            DESCRICAO: 'Balas mais rápidos, empurra mais',
            ATAQUE: {
                DANO_BONUS: 0, VELOCIDADE_BONUS: 100, TAMANHO_BONUS: 1,
                INTERVALO_MULT: 0.8, COR: '#bdc3c7', COR_PARTICULA: '#dddddd'
            },
            EFEITO: { TIPO: 'vento', KNOCKBACK_MULT: 2.0 }
        },
        {
            ID: 'sombra', NOME: 'Sombra', ICONE: '🌑',
            RARIDADE: 'rara', COR: '#8e44ad', COR_FUNDO: '#4a235a',
            DESCRICAO: 'Bala grande e lenta',
            ATAQUE: {
                DANO_BONUS: 2, VELOCIDADE_BONUS: -50, TAMANHO_BONUS: 8,
                INTERVALO_MULT: 1.2, COR: '#8e44ad', COR_PARTICULA: '#aa66cc'
            },
            EFEITO: { TIPO: 'sombra' }
        },
        {
            ID: 'luz', NOME: 'Luz', ICONE: '✨',
            RARIDADE: 'rara', COR: '#f5f5dc', COR_FUNDO: '#7f7f6e',
            DESCRICAO: 'Feixe de luz rápido',
            ATAQUE: {
                DANO_BONUS: 2, VELOCIDADE_BONUS: 120, TAMANHO_BONUS: 0,
                INTERVALO_MULT: 0.9, COR: '#f5f5dc', COR_PARTICULA: '#ffffcc'
            },
            EFEITO: { TIPO: 'luz' }
        },
        {
            ID: 'sangue', NOME: 'Sangue', ICONE: '🩸',
            RARIDADE: 'epica', COR: '#c0392b', COR_FUNDO: '#6e1c14',
            DESCRICAO: 'Rouba vida ao acertar',
            ATAQUE: {
                DANO_BONUS: 2, VELOCIDADE_BONUS: 0, TAMANHO_BONUS: 2,
                INTERVALO_MULT: 1.0, COR: '#c0392b', COR_PARTICULA: '#ff3333',
                ROUBO_VIDA: 1
            },
            EFEITO: { TIPO: 'sangue', ROUBO_VIDA: 1 }
        },
        {
            ID: 'cristal', NOME: 'Cristal', ICONE: '💎',
            RARIDADE: 'epica', COR: '#00ced1', COR_FUNDO: '#006b69',
            DESCRICAO: 'Fragmentos afiados',
            ATAQUE: {
                DANO_BONUS: 3, VELOCIDADE_BONUS: 40, TAMANHO_BONUS: 4,
                INTERVALO_MULT: 0.85, COR: '#00ced1', COR_PARTICULA: '#44ffff'
            },
            EFEITO: { TIPO: 'cristal' }
        }
    ],

    sinergias: {
        'fogo+terra':    { NOME: 'Terra em Chamas', ICONE: '🌋', COR: '#ff6600', DESCRICAO: 'Terra explode em fogo', DANO_BONUS: 2, TAMANHO_BONUS: 5, INTERVALO_MULT: 0.9 },
        'gelo+fogo':     { NOME: 'Vapor', ICONE: '♨️', COR: '#cccccc', DESCRICAO: 'Nuvem que cega', DANO_BONUS: 1, TAMANHO_BONUS: 8, INTERVALO_MULT: 0.9 },
        'raio+gelo':     { NOME: 'Gelo Elétrico', ICONE: '🧊', COR: '#88ccff', DESCRICAO: 'Congela vizinhos', DANO_BONUS: 2, VELOCIDADE_BONUS: 30, INTERVALO_MULT: 0.85 },
        'veneno+fogo':   { NOME: 'Toxina Ardente', ICONE: '🧪', COR: '#88ff00', DESCRICAO: 'Veneno que pega fogo', DANO_BONUS: 2, TAMANHO_BONUS: 4, INTERVALO_MULT: 1.0 },
        'vento+fogo':    { NOME: 'Tornado de Fogo', ICONE: '🌪️', COR: '#ff8800', DESCRICAO: 'Gira ao redor de Rob', DANO_BONUS: 1, VELOCIDADE_BONUS: 50, INTERVALO_MULT: 0.8 },
        'terra+gelo':    { NOME: 'Granito', ICONE: '🏔️', COR: '#8899aa', DESCRICAO: 'Devagar mas muito dano', DANO_BONUS: 3, VELOCIDADE_BONUS: -60, TAMANHO_BONUS: 6, INTERVALO_MULT: 1.2 },
        'sombra+veneno': { NOME: 'Miasma', ICONE: '💜', COR: '#440066', DESCRICAO: 'Nuvem que persegue', DANO_BONUS: 2, TAMANHO_BONUS: 6, INTERVALO_MULT: 1.1 },
        'luz+raio':      { NOME: 'Julgamento', ICONE: '⚖️', COR: '#ffffaa', DESCRICAO: 'Raio de luz gigante', DANO_BONUS: 4, VELOCIDADE_BONUS: 100, INTERVALO_MULT: 0.7 },
        'sangue+terra':  { NOME: 'Lava Viva', ICONE: '🫠', COR: '#ff3300', DESCRICAO: 'Dano massivo em área', DANO_BONUS: 3, TAMANHO_BONUS: 8, INTERVALO_MULT: 1.0 },
        'cristal+gelo':  { NOME: 'Espinhos de Gelo', ICONE: '🔷', COR: '#aaddff', DESCRICAO: 'Fragmentos congelantes', DANO_BONUS: 2, TAMANHO_BONUS: 4, INTERVALO_MULT: 0.85 }
    },

    pegar(id) {
        return this.todas.find(c => c.ID === id);
    },

    buscarSinergia(id1, id2) {
        return this.sinergias[id1 + '+' + id2] || this.sinergias[id2 + '+' + id1] || null;
    },

    gerarOpcoes(quantidade) {
        const pool = [...this.todas];
        const escolhidos = [];
        for (let i = 0; i < quantidade && pool.length > 0; i++) {
            const pesos = pool.map(c => {
                switch (c.RARIDADE) { case 'comum': return 50; case 'rara': return 25; case 'epica': return 10; default: return 30; }
            });
            const total = pesos.reduce((a, b) => a + b, 0);
            let sorteio = Math.random() * total;
            let idx = 0;
            for (let j = 0; j < pesos.length; j++) { sorteio -= pesos[j]; if (sorteio <= 0) { idx = j; break; } }
            escolhidos.push(pool.splice(idx, 1)[0]);
        }
        return escolhidos;
    }
};
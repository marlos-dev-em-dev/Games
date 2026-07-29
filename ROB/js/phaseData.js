// ============================================
// phaseData.js — Dados de todas as fases
// ============================================

const phaseData = {

    fases: [
        {
            NUMERO: 1,
            NOME: 'Portão do Castelo',
            AMBIENTE: 'patio',
            COR_CHAO: '#3a3a2a',
            COR_PAREDE: '#2c2c54',
            ONDAS: [
                { INIMIGOS: [{ TIPO: 'SOLDADO', QTD: 4 }] }
            ]
        },
        {
            NUMERO: 2,
            NOME: 'Guarita',
            AMBIENTE: 'torre',
            COR_CHAO: '#3a3530',
            COR_PAREDE: '#3c3c5c',
            ONDAS: [
                { INIMIGOS: [{ TIPO: 'SOLDADO', QTD: 5 }] },
                { INIMIGOS: [{ TIPO: 'ARQUEIRO', QTD: 3 }] }
            ]
        },
        {
            NUMERO: 3,
            NOME: 'Salão do Trono',
            AMBIENTE: 'salao',
            COR_CHAO: '#3a2a2a',
            COR_PAREDE: '#4c3c3c',
            ONDAS: [
                { INIMIGOS: [{ TIPO: 'SOLDADO', QTD: 6 }] },
                { INIMIGOS: [{ TIPO: 'ARQUEIRO', QTD: 4 }] },
                { INIMIGOS: [{ TIPO: 'SOLDADO', QTD: 3 }, { TIPO: 'CAPITAO', QTD: 2 }] }
            ]
        },
        {
            NUMERO: 4,
            NOME: 'Masmorra',
            AMBIENTE: 'masmorra',
            COR_CHAO: '#2a2a2a',
            COR_PAREDE: '#1c1c3c',
            ONDAS: [
                { INIMIGOS: [{ TIPO: 'SOLDADO', QTD: 4 }, { TIPO: 'CAO', QTD: 2 }] },
                { INIMIGOS: [{ TIPO: 'ARQUEIRO', QTD: 3 }, { TIPO: 'CAO', QTD: 2 }] },
                { INIMIGOS: [{ TIPO: 'CAPITAO', QTD: 1 }, { TIPO: 'SOLDADO', QTD: 4 }] }
            ]
        },
        {
            NUMERO: 5,
            NOME: 'O Trono do Rei',
            AMBIENTE: 'trono',
            COR_CHAO: '#3a3a20',
            COR_PAREDE: '#4c4c2c',
            CHEFE: true,
            ONDAS: [
                { INIMIGOS: [{ TIPO: 'REI', QTD: 1 }] }
            ]
        }
    ],

    pegar(indice) {
        return this.fases[indice] || null;
    },

    total() {
        return this.fases.length;
    }
};
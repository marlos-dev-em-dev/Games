// ============================================
// cards.js — Gerencia cartas e slots
// ============================================

const cards = {

    adicionarNoSlot(carta, idx) {
        if (idx < SLOTS.USO) game.slotsUso[idx] = carta;
        else game.slotCoringa = carta;
    },

    mover(origem, destino) {
        let cartaO, cartaD;
        cartaO = origem < SLOTS.USO ? game.slotsUso[origem] : game.slotCoringa;
        cartaD = destino < SLOTS.USO ? game.slotsUso[destino] : game.slotCoringa;
        if (origem < SLOTS.USO) game.slotsUso[origem] = cartaD; else game.slotCoringa = cartaD;
        if (destino < SLOTS.USO) game.slotsUso[destino] = cartaO; else game.slotCoringa = cartaO;
    },

    resetar() {
        game.slotsUso = [null, null, null];
        game.slotCoringa = null;
    }
};
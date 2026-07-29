// ============================================
// sprites.js — Gerencia carregamento de imagens
// Quando tiver sprites, aponte aqui
// ============================================

const spritesManager = {

    imagens: {},
    tudoCarregado: false,

    // ADICIONAR IMAGENS AQUI quando tiver:
    listaImagens: [
        // { chave: 'rob_body', caminho: 'assets/images/rob/body.png' },
    ],

    carregar(callback) {
        if (this.listaImagens.length === 0) {
            this.tudoCarregado = true;
            if (callback) callback();
            return;
        }

        let carregadas = 0;
        const total = this.listaImagens.length;

        for (const item of this.listaImagens) {
            const img = new Image();
            img.onload = () => {
                this.imagens[item.chave] = img;
                carregadas++;
                if (carregadas >= total) { this.tudoCarregado = true; if (callback) callback(); }
            };
            img.onerror = () => {
                console.log('Sprite não encontrado: ' + item.caminho);
                this.imagens[item.chave] = null;
                carregadas++;
                if (carregadas >= total) { this.tudoCarregado = true; if (callback) callback(); }
            };
            img.src = item.caminho;
        }
    },

    pegar(chave) {
        return this.imagens[chave] || null;
    }
};
// ============================================
// player.js — Movimento e estado do Rob
// ============================================

const player = {

    update(dt) {
        const rob = game.rob;
        if (!rob || !rob.vivo) return;

        const mov = input.movimento();

        if (rob.knockX !== 0 || rob.knockY !== 0) {
            rob.x += rob.knockX * dt;
            rob.y += rob.knockY * dt;
            rob.knockX *= 0.85;
            rob.knockY *= 0.85;
            if (Math.abs(rob.knockX) < 3) rob.knockX = 0;
            if (Math.abs(rob.knockY) < 3) rob.knockY = 0;
        }

        rob.x += mov.x * rob.velocidade * dt;
        rob.y += mov.y * rob.velocidade * dt;

        if (mov.x !== 0 || mov.y !== 0) {
            const len = Math.sqrt(mov.x * mov.x + mov.y * mov.y);
            if (len > 0) { rob.direcao.x = mov.x / len; rob.direcao.y = mov.y / len; }
        }

        const m = rob.tamanho / 2;
        rob.x = Math.max(SALA.PAREDE + m, Math.min(SALA.LARGURA - SALA.PAREDE - m, rob.x));
        rob.y = Math.max(SALA.PAREDE + m, Math.min(SALA.ALTURA - SALA.PAREDE - m, rob.y));

        if (rob.invencivelTimer > 0) rob.invencivelTimer -= dt;
        if (rob.flashTimer > 0) rob.flashTimer -= dt;
    },

    receberDano(quantidade) {
        const rob = game.rob;
        if (!rob || !rob.vivo || rob.invencivelTimer > 0) return;

        rob.vida -= quantidade;
        rob.invencivelTimer = 1.0;
        rob.flashTimer = EFEITOS.FLASH_DANO;

        if (rob.vida <= 0) { rob.vida = 0; game.robMorreu(); }
    },

    knockback(dx, dy, forca) {
        const rob = game.rob;
        if (!rob) return;
        rob.knockX = dx * forca;
        rob.knockY = dy * forca;
    }
};
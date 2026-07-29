// ============================================
// main.js — Game loop
// ============================================

var game;
var _ultimoTempo = 0;
var faseCompletaFlag = false;
var faseCompletandoTimer = 0;

window.addEventListener('load', () => {
    renderer.init();
    input.init(renderer.canvas);
    game = new Game();
    title.init();
    spritesManager.carregar(() => {
        _ultimoTempo = performance.now();
        requestAnimationFrame(loop);
    });
});

function loop(tempo) {
    const dt = Math.min((tempo - _ultimoTempo) / 1000, 0.05);
    _ultimoTempo = tempo;
    game.tempoTotal += dt;
    atualizar(dt);
    desenhar();
    input.limparFrame();
    requestAnimationFrame(loop);
}

function atualizar(dt) {
    switch (game.estado) {

        case ESTADO.TITULO:
            title.update(dt);
            if (title.verificarAcao()) {
                game.iniciarRun();
                game.estado = ESTADO.MAPA;
                map.init();
            }
            break;

        case ESTADO.MAPA:
            map.update(dt);
            // ENTER entra na fase selecionada
            if (input.acabouDePressionar('enter')) {
                const fi = map.faseAtualVisual;
                const disponivel = fi === 0 || game.fasesCompletas.includes(fi - 1);
                if (disponivel) {
                    game.faseAtual = fi;
                    game.entrarFase(fi);
                    spawner.init(fi);
                    faseCompletaFlag = false;
                    faseCompletandoTimer = 0;
                }
            }
            break;

        case ESTADO.FASE:
            atualizarFase(dt);
            break;

        case ESTADO.LEVEL_UP:
            levelSystem.update(dt);
            break;

        case ESTADO.MORTE:
            death.update(dt);
            effects.update(dt);
            break;
    }
}

function atualizarFase(dt) {
    if (input.acabouDePressionar('escape')) {
        game.estado = ESTADO.MAPA;
        map.init();
        return;
    }

    if (faseCompletaFlag) {
        faseCompletandoTimer -= dt;
        effects.update(dt);
        if (faseCompletandoTimer <= 0) {
            game.faseCompleta();
            map.init();
        }
        return;
    }

    player.update(dt);
    for (const e of game.inimigos) enemyManager.update(dt, e);
    spawner.update(dt);
    attack.update(dt);
    projectileManager.atualizarProjeteisRob(dt);
    projectileManager.atualizarProjeteisInimigos(dt);
    collision.projeteisRobVsInimigos();
    collision.projeteisInimigosVsRob();
    collision.inimigosVsRob();
    effects.update(dt);

    if (game.mensagemCentralTimer > 0) game.mensagemCentralTimer -= dt;

    if (!game.rob.vivo) {
        game.estado = ESTADO.MORTE;
        death.init();
        return;
    }

    if (spawner.tudoCompleto() && !faseCompletaFlag) {
        faseCompletaFlag = true;
        faseCompletandoTimer = 2.0;
        game.mensagemCentral = '✦ FASE COMPLETA! ✦';
        game.mensagemCentralTimer = 2.0;
        effects.shake(8);
        effects.criarParticulas(game.rob.x, game.rob.y, '#f1c40f', 20);
    }
}

function desenhar() {
    const ctx = renderer.ctx;
    renderer.limpar();

    switch (game.estado) {
        case ESTADO.TITULO:
            title.draw(ctx);
            break;
        case ESTADO.MAPA:
            map.draw(ctx);
            break;
        case ESTADO.FASE:
            desenharGameplay(ctx);
            break;
        case ESTADO.LEVEL_UP:
            desenharGameplay(ctx);
            levelSystem.draw(ctx);
            break;
        case ESTADO.MORTE:
            desenharGameplay(ctx);
            death.draw(ctx);
            break;
    }
}

function desenharGameplay(ctx) {
    const shake = effects.getShakeOffset();
    if (shake.x || shake.y) { ctx.save(); ctx.translate(shake.x, shake.y); }

    const fase = phaseData.pegar(game.faseAtual);

    drawHelper.sala(ctx, fase);
    for (const m of game.manchas) drawHelper.mancha(ctx, m);
    spawner.drawGates(ctx);
    for (const e of game.inimigos) drawHelper.inimigo(ctx, e);
    for (const p of game.projeteis) drawHelper.projetil(ctx, p);
    for (const p of game.projeteisInimigos) drawHelper.projetil(ctx, p);
    drawHelper.rob(ctx, game.rob);
    for (const p of game.particulas) drawHelper.particula(ctx, p);
    for (const t of game.textosFlutuantes) drawHelper.textoFlutuante(ctx, t);

    if (shake.x || shake.y) ctx.restore();

    hud.draw(ctx);

    if (game.mensagemCentralTimer > 0 && game.mensagemCentral) {
        const alpha = Math.min(1, game.mensagemCentralTimer / 0.5);
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, TELA.ALTURA / 2 - 30, TELA.LARGURA, 60);
        renderer.desenharTexto(game.mensagemCentral, TELA.LARGURA / 2, TELA.ALTURA / 2 + 7, '#ffdd57', 24, 'center');
        ctx.restore();
    }
}
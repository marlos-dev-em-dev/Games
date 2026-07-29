// ============================================
// enemy.js — Inimigos com efeitos de status
// ============================================

const enemyManager = {

    create(x, y, tipo) {
        const cfg = INIMIGOS[tipo];
        return {
            x, y, tipo,
            vida: cfg.VIDA,
            vidaMax: cfg.VIDA,
            velocidade: cfg.VELOCIDADE,
            tamanho: cfg.TAMANHO,
            dano: cfg.DANO,
            direcao: { x: 0, y: 1 },
            vivo: true,
            flashTimer: 0,
            surgindoTimer: EFEITOS.SURGIMENTO_DURACAO,
            knockX: 0,
            knockY: 0,
            knockbackCooldown: 0,
            // IA
            tiroTimer: 1.5 + Math.random() * 0.5,
            zigzagTimer: 0,
            zigzagDir: Math.random() > 0.5 ? 1 : -1,
            bossFase: 1,
            bossTimer: 2.0,
            // Efeitos de status
            efeitos: []
        };
    },

    update(dt, e) {
        if (!e.vivo) return;
        if (e.surgindoTimer > 0) { e.surgindoTimer -= dt; return; }

        const rob = game.rob;
        if (!rob || !rob.vivo) return;

        const dx = rob.x - e.x;
        const dy = rob.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) { e.direcao.x = dx / dist; e.direcao.y = dy / dist; }

        // Knockback cooldown
        if (e.knockbackCooldown > 0) e.knockbackCooldown -= dt;
        this._knockback(e, dt);
        if (e.flashTimer > 0) e.flashTimer -= dt;

        // ── Processar efeitos de status ──
        let slowMult = 1;
        for (let i = e.efeitos.length - 1; i >= 0; i--) {
            const ef = e.efeitos[i];
            ef.duracao -= dt;
            if (ef.duracao <= 0) { e.efeitos.splice(i, 1); continue; }

            switch (ef.tipo) {
                case 'fogo':
                    ef.timer = (ef.timer || 0) + dt;
                    if (ef.timer >= ef.intervalo) {
                        ef.timer = 0;
                        e.vida -= ef.dano;
                        effects.criarTextoFlutuante(e.x, e.y - e.tamanho / 2 - 5, ef.dano, '#ff6600', 11);
                        if (e.vida <= 0) { e.vida = 0; e.vivo = false; this.processarMorte(e); return; }
                    }
                    break;
                case 'veneno':
                    ef.timer = (ef.timer || 0) + dt;
                    if (ef.timer >= ef.intervalo) {
                        ef.timer = 0;
                        e.vida -= ef.dano;
                        effects.criarTextoFlutuante(e.x, e.y - e.tamanho / 2 - 5, ef.dano, '#44ff44', 11);
                        if (e.vida <= 0) { e.vida = 0; e.vivo = false; this.processarMorte(e); return; }
                    }
                    break;
                case 'gelo':
                    slowMult = Math.min(slowMult, ef.slowMult || 0.45);
                    break;
            }
        }

        // Velocidade afetada por gelo
        const velEfetiva = e.velocidade * slowMult;

        // IA por tipo (passa velocidade efetiva)
        switch (e.tipo) {
            case 'SOLDADO':
            case 'CAPITAO':
                this._mover(e, rob.x, rob.y, dt, velEfetiva);
                break;
            case 'ARQUEIRO':
                this._arqueiro(e, rob, dt, velEfetiva);
                break;
            case 'CAO':
                this._cao(e, rob.x, rob.y, dt, velEfetiva);
                break;
            case 'REI':
                this._rei(e, rob, dt);
                break;
        }

        this._limitar(e);
    },

    _mover(e, ax, ay, dt, vel) {
        const dx = ax - e.x, dy = ay - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) return;
        e.x += (dx / dist) * vel * dt;
        e.y += (dy / dist) * vel * dt;
    },

    _arqueiro(e, rob, dt, vel) {
        const dx = rob.x - e.x, dy = rob.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ideal = INIMIGOS.ARQUEIRO.DISTANCIA_IDEAL;

        if (dist < ideal - 40) {
            e.x -= (dx / dist) * vel * dt;
            e.y -= (dy / dist) * vel * dt;
        } else if (dist > ideal + 60) {
            e.x += (dx / dist) * vel * dt;
            e.y += (dy / dist) * vel * dt;
        }

        e.tiroTimer -= dt;
        if (e.tiroTimer <= 0 && dist < 400) {
            e.tiroTimer = INIMIGOS.ARQUEIRO.TIRO_INTERVALO;
            projectileManager.criarProjetilInimigo(e, rob.x, rob.y, 200, e.dano, '#e74c3c');
        }
    },

    _cao(e, ax, ay, dt, vel) {
        e.zigzagTimer += dt;
        if (e.zigzagTimer > 0.35) { e.zigzagTimer = 0; e.zigzagDir *= -1; }
        const dx = ax - e.x, dy = ay - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2) return;
        const bx = dx / dist, by = dy / dist;
        e.x += (bx + (-by) * e.zigzagDir * 0.5) * vel * dt;
        e.y += (by + bx * e.zigzagDir * 0.5) * vel * dt;
    },

    _rei(e, rob, dt) {
        const hp = e.vida / e.vidaMax;
        if (hp < 0.25) e.bossFase = 3; else if (hp < 0.5) e.bossFase = 2;
        const cfg = INIMIGOS.REI;

        switch (e.bossFase) {
            case 1:
                e.velocidade = cfg.VELOCIDADE;
                this._mover(e, rob.x, rob.y, dt, e.velocidade);
                e.bossTimer -= dt;
                if (e.bossTimer <= 0) { e.bossTimer = 2.5; projectileManager.criarProjetilInimigo(e, rob.x, rob.y, 180, cfg.DANO, '#f1c40f'); }
                break;
            case 2:
                e.velocidade = cfg.VELOCIDADE * 1.4;
                this._mover(e, rob.x, rob.y, dt, e.velocidade);
                e.bossTimer -= dt;
                if (e.bossTimer <= 0) {
                    e.bossTimer = 2.0;
                    const ab = Math.atan2(rob.y - e.y, rob.x - e.x);
                    for (let i = -2; i <= 2; i++) projectileManager.criarProjetilAngulo(e, ab + i * 0.25, 160, cfg.DANO, '#ff8800');
                }
                break;
            case 3:
                e.velocidade = cfg.VELOCIDADE * 1.8;
                this._mover(e, rob.x, rob.y, dt, e.velocidade);
                e.bossTimer -= dt;
                if (e.bossTimer <= 0) {
                    e.bossTimer = 1.2;
                    for (let i = 0; i < 8; i++) projectileManager.criarProjetilAngulo(e, (Math.PI * 2 / 8) * i, 140, cfg.DANO, '#ff4444');
                }
                break;
        }
    },

    receberDano(e, quantidade, kdX, kdY, knockbackMult) {
        e.vida -= quantidade;
        e.flashTimer = EFEITOS.FLASH_DANO;

        // Knockback com cooldown
        if (e.knockbackCooldown <= 0) {
            const forca = (50 + (20 / (e.tamanho / 20)) * 25) * (knockbackMult || 1);
            e.knockX = kdX * forca;
            e.knockY = kdY * forca;
            e.knockbackCooldown = 0.4; // 0.4s entre knockbacks
        }

        if (e.vida <= 0) { e.vida = 0; e.vivo = false; return true; }
        return false;
    },

    processarMorte(e) {
        const cfg = INIMIGOS[e.tipo];
        effects.criarMancha(e.x, e.y, e.tamanho * 0.7);
        effects.criarParticulas(e.x, e.y, cfg.COR, 10);
        effects.criarTextoFlutuante(e.x + 15, e.y - 5, '+' + cfg.XP + ' XP', '#b088d0', 12);
        effects.shake(3);
        game.ganharXP(cfg.XP);
    },

    aplicarEfeito(e, efeito) {
        const existente = e.efeitos.find(ef => ef.tipo === efeito.tipo);
        if (existente) {
            existente.duracao = efeito.duracao;
        } else {
            e.efeitos.push({
                tipo: efeito.tipo,
                dano: efeito.dano || 0,
                duracao: efeito.duracao || 0,
                intervalo: efeito.intervalo || 0.5,
                slowMult: efeito.slowMult || 1,
                timer: 0
            });
        }
    },

    _knockback(e, dt) {
        if (e.knockX !== 0 || e.knockY !== 0) {
            e.x += e.knockX * dt;
            e.y += e.knockY * dt;
            e.knockX *= 0.88;
            e.knockY *= 0.88;
            if (Math.abs(e.knockX) < 2) e.knockX = 0;
            if (Math.abs(e.knockY) < 2) e.knockY = 0;
        }
    },

    _limitar(e) {
        const m = e.tamanho / 2;
        e.x = Math.max(SALA.PAREDE + m, Math.min(SALA.LARGURA - SALA.PAREDE - m, e.x));
        e.y = Math.max(SALA.PAREDE + m, Math.min(SALA.ALTURA - SALA.PAREDE - m, e.y));
    }
};
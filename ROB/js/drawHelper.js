// ============================================
// drawHelper.js — Desenhos de entidades visuais
// ============================================

const drawHelper = {

    // ══════════════════ SALA ══════════════════

    sala(ctx, fase) {
        const p = SALA.PAREDE;
        const w = SALA.LARGURA;
        const h = SALA.ALTURA;
        const corChao = fase ? fase.COR_CHAO : SALA.COR_CHAO;
        const corParede = fase ? fase.COR_PAREDE : SALA.COR_PAREDE;

        // Chão
        ctx.fillStyle = corChao;
        ctx.fillRect(p, p, w - p * 2, h - p * 2);

        // Textura do chão
        ctx.save();
        ctx.globalAlpha = 0.06;
        for (let gx = p; gx < w - p; gx += 40) {
            for (let gy = p; gy < h - p; gy += 40) {
                ctx.fillStyle = ((gx + gy) % 80 === 0) ? '#ffffff' : '#000000';
                ctx.fillRect(gx, gy, 40, 40);
            }
        }
        ctx.restore();

        // Paredes
        ctx.fillStyle = corParede;
        ctx.fillRect(0, 0, w, p);
        ctx.fillRect(0, h - p, w, p);
        ctx.fillRect(0, 0, p, h);
        ctx.fillRect(w - p, 0, p, h);

        // Tijolos
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#555588';
        ctx.lineWidth = 1;
        for (let bx = 0; bx < w; bx += 30) {
            ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, p); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(bx, h - p); ctx.lineTo(bx, h); ctx.stroke();
        }
        for (let by = 0; by < h; by += 15) {
            ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(p, by); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - p, by); ctx.lineTo(w, by); ctx.stroke();
        }
        ctx.restore();

        // Borda interna
        ctx.strokeStyle = '#4a4a7a';
        ctx.lineWidth = 1;
        ctx.strokeRect(p, p, w - p * 2, h - p * 2);
    },

    // ══════════════════ ROB ══════════════════

    rob(ctx, rob) {
        if (!rob || !rob.vivo) return;
        const x = rob.x;
        const y = rob.y;
        const r = rob.tamanho / 2;

        const piscar = rob.invencivelTimer > 0 && Math.floor(game.tempoTotal * 14) % 2 === 0;
        if (piscar) { ctx.save(); ctx.globalAlpha = 0.3; }

        if (rob.flashTimer > 0) renderer.desenharCirculo(x, y, r + 6, '#ffffff', 0.5);

        // Sombra
        renderer.desenharCirculo(x, y + r * 0.6, r * 0.8, '#000000', 0.2);

        // Sprite ou forma
        const sprite = spritesManager.pegar('rob_body');
        if (sprite) {
            ctx.drawImage(sprite, x - r, y - r, rob.tamanho, rob.tamanho);
        } else {
            // Corpo branco
            ctx.fillStyle = ROB.COR;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Contorno sutil
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (piscar) ctx.restore();

        // Olhos
        this._desenharOlhos(ctx, rob);

        // Aura de carta
        if (game.slotsUso[0]) {
            ctx.save();
            ctx.globalAlpha = 0.12 + Math.sin(game.tempoTotal * 3) * 0.06;
            renderer.desenharCirculo(x, y, r + 8, game.slotsUso[0].COR);
            ctx.restore();
        }
    },

    _desenharOlhos(ctx, rob) {
        const r = rob.tamanho / 2;
        const dirX = rob.direcao.x;
        const dirY = rob.direcao.y;

        const olhoRaio = r * 0.28;
        const pupilaRaio = r * 0.16;
        const olhoDist = r * 0.35;

        const shiftX = dirX * r * 0.12;
        const shiftY = dirY * r * 0.12;
        const baseY = rob.y - r * 0.08 + dirY * (-r * 0.1);

        const olhoEsqX = rob.x - olhoDist + shiftX;
        const olhoEsqY = baseY + shiftY * 0.4;
        const olhoDirX = rob.x + olhoDist + shiftX;
        const olhoDirY = baseY + shiftY * 0.4;

        // Branco dos olhos (grandes, exbugalhados)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(olhoEsqX, olhoEsqY, olhoRaio, olhoRaio * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(olhoDirX, olhoDirY, olhoRaio, olhoRaio * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Contorno dos olhos
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(olhoEsqX, olhoEsqY, olhoRaio, olhoRaio * 1.15, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(olhoDirX, olhoDirY, olhoRaio, olhoRaio * 1.15, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Pupilas
        const pDist = pupilaRaio * 1.0;
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(olhoEsqX + dirX * pDist, olhoEsqY + dirY * pDist, pupilaRaio, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(olhoDirX + dirX * pDist, olhoDirY + dirY * pDist, pupilaRaio, 0, Math.PI * 2);
        ctx.fill();

        // Reflexo nas pupilas
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(
            olhoEsqX + dirX * pDist - pupilaRaio * 0.3,
            olhoEsqY + dirY * pDist - pupilaRaio * 0.3,
            pupilaRaio * 0.35, 0, Math.PI * 2
        );
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
            olhoDirX + dirX * pDist - pupilaRaio * 0.3,
            olhoDirY + dirY * pDist - pupilaRaio * 0.3,
            pupilaRaio * 0.35, 0, Math.PI * 2
        );
        ctx.fill();
    },

    // ══════════════════ INIMIGOS ══════════════════

    inimigo(ctx, e) {
        if (!e.vivo) return;
        const cfg = INIMIGOS[e.tipo];
        const x = e.x;
        const y = e.y;
        const s = cfg.TAMANHO;

        // Efeito de surgimento
        if (e.surgindoTimer > 0) {
            const pct = 1 - (e.surgindoTimer / EFEITOS.SURGIMENTO_DURACAO);
            ctx.save();
            ctx.globalAlpha = pct;
            const esc = 0.3 + pct * 0.7;
            ctx.translate(x, y);
            ctx.scale(esc, esc);
            ctx.translate(-x, -y);
        }

        const cor = e.flashTimer > 0 ? '#ffffff' : cfg.COR;
        const borda = e.flashTimer > 0 ? '#ffffff' : cfg.COR_CONTORNO;

        // Sombra
        renderer.desenharCirculo(x, y + s * 0.4, s * 0.35, '#000000', 0.2);

        // Sprite ou forma geométrica
        const sprite = spritesManager.pegar('enemy_' + e.tipo.toLowerCase());
        if (sprite) {
            ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
        } else {
            switch (cfg.FORMATO) {
                case 'quadrado':
                    ctx.fillStyle = cor;
                    ctx.fillRect(x - s / 2, y - s / 2, s, s);
                    ctx.strokeStyle = borda;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - s / 2, y - s / 2, s, s);
                    // Olhos
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - 5, y - 4, 4, 4);
                    ctx.fillRect(x + 2, y - 4, 4, 4);
                    break;

                case 'losango':
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(Math.PI / 4);
                    ctx.fillStyle = cor;
                    ctx.fillRect(-s / 2.8, -s / 2.8, s / 1.4, s / 1.4);
                    ctx.strokeStyle = borda;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-s / 2.8, -s / 2.8, s / 1.4, s / 1.4);
                    ctx.restore();
                    // Olhos
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - 4, y - 3, 3, 3);
                    ctx.fillRect(x + 2, y - 3, 3, 3);
                    break;

                case 'retangulo':
                    ctx.fillStyle = cor;
                    ctx.fillRect(x - s / 2, y - s / 2.5, s, s / 1.25);
                    ctx.strokeStyle = borda;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x - s / 2, y - s / 2.5, s, s / 1.25);
                    // Olhos
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x - 7, y - 5, 5, 5);
                    ctx.fillRect(x + 3, y - 5, 5, 5);
                    // Coroa para o Rei
                    if (e.tipo === 'REI') {
                        this._coroa(ctx, x, y - s / 2.5 - 12);
                    }
                    break;

                case 'triangulo':
                    const dir = e.direcao || { x: 0, y: 1 };
                    const ang = Math.atan2(dir.y, dir.x);
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(ang);
                    ctx.fillStyle = cor;
                    ctx.beginPath();
                    ctx.moveTo(s / 2, 0);
                    ctx.lineTo(-s / 2, -s / 2.5);
                    ctx.lineTo(-s / 2, s / 2.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = borda;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    // Olho
                    ctx.fillStyle = '#000000';
                    ctx.beginPath();
                    ctx.arc(s * 0.15, -s * 0.08, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
            }
        }

        // ── Efeitos visuais de status ──
        if (e.efeitos) {
            for (const ef of e.efeitos) {
                // FOGO: chamas ao redor
                if (ef.tipo === 'fogo') {
                    ctx.save();
                    for (let i = 0; i < 3; i++) {
                        const fx = x + Math.sin(game.tempoTotal * 10 + i * 2.1) * (s * 0.3);
                        const fy = y - s * 0.3 - Math.abs(Math.sin(game.tempoTotal * 8 + i * 1.7)) * (s * 0.4);
                        const fr = 2 + Math.sin(game.tempoTotal * 12 + i * 3) * 1;
                        renderer.desenharCirculo(fx, fy, fr, i === 0 ? '#ff4400' : '#ffaa00', 0.7);
                    }
                    ctx.restore();
                }
                // GELO: tom azulado
                if (ef.tipo === 'gelo') {
                    ctx.save();
                    ctx.globalAlpha = 0.25;
                    ctx.fillStyle = '#3498db';
                    ctx.fillRect(x - s / 2 - 2, y - s / 2 - 2, s + 4, s + 4);
                    ctx.restore();
                }
                // VENENO: partículas verdes
                if (ef.tipo === 'veneno') {
                    ctx.save();
                    for (let i = 0; i < 2; i++) {
                        const gx = x + Math.sin(game.tempoTotal * 5 + i * 3) * (s * 0.3);
                        const gy = y - Math.cos(game.tempoTotal * 6 + i * 2) * (s * 0.3);
                        renderer.desenharCirculo(gx, gy, 2.5, '#44ff44', 0.6);
                    }
                    ctx.restore();
                }
            }
        }

        // Barra de vida (se dano)
        if (e.vida < cfg.VIDA) {
            const bw = s + 8;
            const bh = 4;
            const bx = x - bw / 2;
            const by = y - s / 2 - 10;
            const pct = e.vida / cfg.VIDA;

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(bx, by, bw, bh);
            ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(bx, by, bw * pct, bh);
        }

        if (e.surgindoTimer > 0) ctx.restore();
    },

    _coroa(ctx, x, y) {
        ctx.save();
        ctx.fillStyle = '#f1c40f';
        ctx.strokeStyle = '#d4a017';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - 12, y + 8);
        ctx.lineTo(x - 10, y);
        ctx.lineTo(x - 5, y + 4);
        ctx.lineTo(x, y - 4);
        ctx.lineTo(x + 5, y + 4);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x + 12, y + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Joia
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x, y + 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    },

    // ══════════════════ PROJÉTEIS ══════════════════

    projetil(ctx, proj) {
        // Rastro
        ctx.save();
        ctx.globalAlpha = 0.3;
        renderer.desenharCirculo(
            proj.x - proj.vx * 0.015,
            proj.y - proj.vy * 0.015,
            proj.tamanho * 0.7,
            proj.cor
        );
        ctx.restore();

        // Corpo do projétil
        renderer.desenharCirculo(proj.x, proj.y, proj.tamanho, proj.cor);

        // Brilho externo
        ctx.save();
        ctx.globalAlpha = 0.3;
        renderer.desenharCirculo(proj.x, proj.y, proj.tamanho + 4, proj.cor);
        ctx.restore();

        // Efeito visual por tipo de ataque
        if (proj.efeitos) {
            for (const ef of proj.efeitos) {
                if (ef.TIPO === 'fogo') {
                    // Chama no projétil
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    renderer.desenharCirculo(
                        proj.x + (Math.random() - 0.5) * 4,
                        proj.y - proj.tamanho * 0.5,
                        proj.tamanho * 0.6,
                        '#ff6600'
                    );
                    ctx.restore();
                }
                if (ef.TIPO === 'gelo') {
                    // Brilho gelado
                    ctx.save();
                    ctx.globalAlpha = 0.25;
                    renderer.desenharCirculo(proj.x, proj.y, proj.tamanho + 6, '#88ccff');
                    ctx.restore();
                }
                if (ef.TIPO === 'veneno') {
                    // Nuvem verde
                    ctx.save();
                    ctx.globalAlpha = 0.2;
                    renderer.desenharCirculo(proj.x, proj.y, proj.tamanho + 5, '#44ff44');
                    ctx.restore();
                }
            }
        }
    },

    // ══════════════════ EFEITOS ══════════════════

    mancha(ctx, m) {
        ctx.save();
        ctx.globalAlpha = m.alpha;
        renderer.desenharCirculo(m.x, m.y, m.raio, '#0a0a0a');
        ctx.restore();
    },

    particula(ctx, p) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.vida / 0.3);
        renderer.desenharCirculo(
            p.x, p.y,
            p.raio * Math.max(0.2, p.vida / 0.5),
            p.cor
        );
        ctx.restore();
    },

    textoFlutuante(ctx, t) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, t.vida / 0.3);
        renderer.desenharTexto(t.texto, t.x, t.y, t.cor, t.tamanho || 14, 'center');
        ctx.restore();
    }
};
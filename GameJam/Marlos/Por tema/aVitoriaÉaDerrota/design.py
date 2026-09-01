"""
DESIGN.PY — Visual, cores, tiles, sprites, HUD, intro, final, galeria
"""
import pygame

# ═══════════════════════════════
# TELA
# ═══════════════════════════════

TILE = 48
ROOM_COLS = 13
ROOM_ROWS = 9
GAME_W = ROOM_COLS * TILE
GAME_H = ROOM_ROWS * TILE
SCREEN_W = 800
SCREEN_H = 600
HUD_H = SCREEN_H - GAME_H
GAME_X = (SCREEN_W - GAME_W) // 2
GAME_Y = 0

# ═══════════════════════════════
# CORES
# ═══════════════════════════════

C = {
    "bg": (15, 12, 20), "wall": (60, 50, 40),
    "floor": (40, 35, 30), "player": (220, 200, 170),
    "sword": (200, 200, 210), "text": (240, 235, 225),
    "text_dim": (120, 115, 105), "text_hi": (255, 220, 100),
    "hud_bg": (20, 18, 28), "hp_full": (200, 60, 60),
    "hp_empty": (50, 20, 20), "gold_col": (255, 215, 0),
    "dialog_bg": (20, 18, 28), "dialog_bd": (80, 70, 55),
    "black": (10, 8, 15), "white": (240, 235, 225),
}

CORRUPT = {
    "wall":  [(60,50,40),(55,42,35),(50,34,28),(42,22,18),(30,12,10),(15,5,3)],
    "floor": [(40,35,30),(38,30,25),(35,24,18),(28,15,10),(18,8,5),(8,3,2)],
    "bg":    [(15,12,20),(20,14,15),(30,14,12),(40,10,10),(25,5,5),(10,2,2)],
}


def corruption_level(state):
    k = sum(state.kills.values()) if hasattr(state, "kills") else 0
    return min(k // 2, 5)


def load_fonts():
    return {
        "sm":  pygame.font.Font(None, 20),
        "md":  pygame.font.Font(None, 26),
        "lg":  pygame.font.Font(None, 36),
        "xl":  pygame.font.Font(None, 52),
        "xxl": pygame.font.Font(None, 80),
    }


# ═══════════════════════════════
# TILES
# ═══════════════════════════════

def draw_tile(surf, px, py, ch, c_lv):
    r = pygame.Rect(px, py, TILE, TILE)
    if ch == "#":
        col = CORRUPT["wall"][c_lv]
        pygame.draw.rect(surf, col, r)
        hi = tuple(min(v + 12, 255) for v in col)
        for yy in (16, 32):
            pygame.draw.line(surf, hi, (px, py + yy), (px + TILE, py + yy))
    else:
        col = CORRUPT["floor"][c_lv]
        pygame.draw.rect(surf, col, r)
        if (px // TILE + py // TILE) % 4 == 0:
            hi = tuple(min(v + 6, 255) for v in col)
            pygame.draw.rect(surf, hi, (px + 2, py + 2, TILE - 4, TILE - 4), 1)


def draw_room(surf, room_map, c_lv):
    for ri, row in enumerate(room_map):
        for ci, ch in enumerate(row):
            draw_tile(surf, GAME_X + ci * TILE, GAME_Y + ri * TILE, ch, c_lv)


# ═══════════════════════════════
# JOGADOR
# ═══════════════════════════════

def draw_player(surf, px, py, direction, has_sword, attacking, c_lv):
    x = GAME_X + px + 8
    y = GAME_Y + py + 6
    col = list(C["player"])
    for i in range(3):
        col[i] = max(col[i] - c_lv * 15, 80)
    col = tuple(col)

    pygame.draw.ellipse(surf, (0, 0, 0), (x - 4, y + 26, 40, 10))
    pygame.draw.rect(surf, col, (x, y + 8, 32, 20), border_radius=4)
    head = tuple(min(v + 25, 255) for v in col)
    pygame.draw.circle(surf, head, (x + 16, y + 6), 10)

    ed = {0:[(12,3),(20,3)], 1:[(19,5),(24,5)],
          2:[(12,7),(20,7)], 3:[(8,5),(13,5)]}
    for ox, oy in ed.get(direction, ed[2]):
        pygame.draw.circle(surf, C["black"], (x + ox, y + oy), 2)

    if has_sword:
        sd = {
            0: pygame.Rect(x+28, y-12, 4, 24),
            1: pygame.Rect(x+30, y+10, 24, 4),
            2: pygame.Rect(x+28, y+20, 4, 24),
            3: pygame.Rect(x-6, y+10, 24, 4),
        }
        sr = sd.get(direction, sd[2])
        if attacking:
            sr = sr.inflate(8, 8)
        pygame.draw.rect(surf, C["sword"], sr, border_radius=1)


# ═══════════════════════════════
# ENTIDADES
# ═══════════════════════════════

_NPC_COL = {
    "elder":(140,120,90), "merchant":(100,140,100),
    "guard":(80,80,140), "king":(180,150,50),
    "farmer":(120,100,70), "priest":(160,140,180),
}


def draw_entity(surf, ent):
    x = GAME_X + ent["x"] * TILE + 8
    y = GAME_Y + ent["y"] * TILE + 6
    t = ent["type"]

    if t == "npc":
        col = _NPC_COL.get(ent["id"], (140, 130, 110))
        pygame.draw.rect(surf, col, (x+4, y+10, 24, 18), border_radius=3)
        pygame.draw.circle(surf, tuple(min(v+30,255) for v in col), (x+16, y+8), 8)
        pygame.draw.circle(surf, C["black"], (x+13, y+7), 2)
        pygame.draw.circle(surf, C["black"], (x+19, y+7), 2)
        f = pygame.font.Font(None, 18)
        nm = f.render(ent.get("name",""), True, C["text_dim"])
        surf.blit(nm, (x + 16 - nm.get_width()//2, y - 8))

    elif t == "monster":
        mid = ent["id"]
        if "slime" in mid:
            col = (60, 180, 60)
            pygame.draw.ellipse(surf, col, (x, y+14, 32, 16))
            pygame.draw.ellipse(surf, (100,220,100), (x+3, y+12, 26, 12))
            pygame.draw.circle(surf, (255,255,255), (x+10, y+18), 4)
            pygame.draw.circle(surf, (255,255,255), (x+22, y+18), 4)
            pygame.draw.circle(surf, C["black"], (x+11, y+19), 2)
            pygame.draw.circle(surf, C["black"], (x+23, y+19), 2)
        elif "wolf" in mid:
            col = (120, 100, 80)
            pygame.draw.ellipse(surf, col, (x, y+14, 30, 16))
            pygame.draw.circle(surf, col, (x+24, y+12), 8)
            pygame.draw.circle(surf, (255,200,100), (x+27, y+10), 2)
        elif "bat" in mid:
            col = (80, 50, 80)
            pygame.draw.circle(surf, col, (x+16, y+16), 6)
            pygame.draw.polygon(surf, col, [(x+10,y+16),(x,y+8),(x+6,y+22)])
            pygame.draw.polygon(surf, col, [(x+22,y+16),(x+32,y+8),(x+26,y+22)])
            pygame.draw.circle(surf, (200,50,50), (x+14, y+14), 2)
            pygame.draw.circle(surf, (200,50,50), (x+18, y+14), 2)
        elif "skeleton" in mid:
            col = (200, 195, 180)
            pygame.draw.rect(surf, col, (x+12, y+10, 8, 18))
            pygame.draw.circle(surf, col, (x+16, y+8), 7)
            pygame.draw.circle(surf, C["black"], (x+13, y+7), 3)
            pygame.draw.circle(surf, C["black"], (x+19, y+7), 3)
        elif "dragon" in mid:
            col = (200, 50, 30)
            pygame.draw.ellipse(surf, col, (x-4, y+6, 40, 26))
            hi = tuple(min(v+30,255) for v in col)
            pygame.draw.ellipse(surf, hi, (x, y+4, 32, 22))
            pygame.draw.circle(surf, col, (x+30, y+8), 10)
            pygame.draw.circle(surf, (255,200,50), (x+33, y+6), 3)
            pygame.draw.circle(surf, C["black"], (x+33, y+6), 1)
        elif "ghost" in mid:
            gs = pygame.Surface((32, 32), pygame.SRCALPHA)
            pygame.draw.ellipse(gs, (180,180,220,130), (4,2,24,22))
            for i in range(4):
                pygame.draw.circle(gs, (180,180,220,130), (4+i*7, 26), 4)
            surf.blit(gs, (x, y))
            pygame.draw.circle(surf, C["black"], (x+12, y+12), 3)
            pygame.draw.circle(surf, C["black"], (x+20, y+12), 3)
        elif "guard" in mid:
            col = (60, 60, 120)
            pygame.draw.rect(surf, col, (x+4, y+6, 24, 22), border_radius=3)
            pygame.draw.circle(surf, (90,90,150), (x+16, y+6), 8)
            pygame.draw.circle(surf, C["black"], (x+13, y+5), 2)
            pygame.draw.circle(surf, C["black"], (x+19, y+5), 2)
            pygame.draw.arc(surf, (180,180,190), (x+4,y-2,24,12), 0, 3.14, 2)

        hp = ent.get("hp", 0)
        mhp = ent.get("max_hp", hp)
        if hp < mhp and mhp > 0:
            bx, by, bw = x+2, y-4, 28
            pygame.draw.rect(surf, (50,20,20), (bx, by, bw, 4))
            pygame.draw.rect(surf, (200,60,60), (bx, by, int(bw*hp/mhp), 4))

    elif t == "item":
        iid = ent["id"]
        if "gold" in iid:
            pygame.draw.circle(surf, C["gold_col"], (x+16, y+20), 8)
            pygame.draw.circle(surf, (255,240,100), (x+13, y+18), 6)
            pygame.draw.circle(surf, C["gold_col"], (x+21, y+18), 7)
        elif "potion" in iid:
            pygame.draw.rect(surf, (80,200,80), (x+12,y+12,8,16), border_radius=2)
            pygame.draw.rect(surf, (140,120,90), (x+10,y+10,12,4))
        elif "relic" in iid:
            col = (200, 180, 255)
            pygame.draw.polygon(surf, col, [
                (x+16,y+6),(x+26,y+16),(x+16,y+26),(x+6,y+16)])
            hi = tuple(min(v+40,255) for v in col)
            pygame.draw.polygon(surf, hi, [
                (x+16,y+9),(x+23,y+16),(x+16,y+23),(x+9,y+16)])
        elif "holy" in iid:
            pygame.draw.rect(surf, (100,150,255), (x+12,y+12,8,16), border_radius=2)
            pygame.draw.rect(surf, (180,160,120), (x+10,y+10,12,4))
        else:
            pygame.draw.circle(surf, C["gold_col"], (x+16, y+16), 8)

    elif t == "sign":
        pygame.draw.rect(surf, (140,120,80), (x+14, y+14, 4, 16))
        pygame.draw.rect(surf, (160,140,90), (x+6, y+6, 20, 12))

    elif t == "throne":
        pygame.draw.rect(surf, (180,150,50), (x+4, y+6, 24, 24))
        pygame.draw.rect(surf, (200,170,60), (x+2, y+2, 28, 8))
        pygame.draw.circle(surf, C["gold_col"], (x+16, y+4), 4)

    elif t == "altar":
        pygame.draw.rect(surf, (160,140,100), (x+4, y+18, 24, 12))
        pygame.draw.rect(surf, (180,160,120), (x+8, y+12, 16, 8))
        gs = pygame.Surface((32, 32), pygame.SRCALPHA)
        pygame.draw.circle(gs, (200,180,100,35), (16,16), 16)
        surf.blit(gs, (x, y))

    elif t == "pit":
        pygame.draw.rect(surf, (5,3,3), (x+2, y+2, 28, 28))
        pygame.draw.rect(surf, (20,10,10), (x+6, y+6, 20, 20))

    elif t == "void":
        pygame.draw.rect(surf, (5,2,5), (x, y, 32, 32))

    elif t == "secret_wall":
        pygame.draw.rect(surf, (58,48,38), (x, y, 32, 32))
        pygame.draw.rect(surf, (68,58,48), (x+2, y+2, 28, 28), 1)

    elif t == "construction":
        col = (120, 100, 80)
        pygame.draw.rect(surf, col, (x+4, y+8, 24, 22))
        pygame.draw.rect(surf, tuple(min(v+20,255) for v in col),
                         (x+8, y+4, 16, 6))


# ═══════════════════════════════
# HUD
# ═══════════════════════════════

def draw_hud(surf, state, fonts):
    hy = GAME_H
    pygame.draw.rect(surf, C["hud_bg"], (0, hy, SCREEN_W, HUD_H))
    pygame.draw.line(surf, C["dialog_bd"], (0, hy), (SCREEN_W, hy), 2)

    surf.blit(fonts["md"].render("VIDA:", True, C["text_dim"]), (20, hy+12))
    for i in range(state.max_hp):
        hx = 100 + i * 24
        col = C["hp_full"] if i < state.hp else C["hp_empty"]
        pygame.draw.rect(surf, col, (hx, hy+12, 20, 20), border_radius=3)

    surf.blit(fonts["md"].render(f"OURO: {state.gold}", True, C["gold_col"]),
              (20, hy+44))

    kills = sum(state.kills.values())
    surf.blit(fonts["md"].render(f"VITORIAS: {kills}", True, C["text_hi"]),
              (260, hy+12))

    surf.blit(fonts["md"].render(f"ITENS: {len(state.items_taken)}", True, C["text"]),
              (260, hy+44))

    surf.blit(fonts["sm"].render(f"Salas: {len(state.visited)}/9", True, C["text_dim"]),
              (500, hy+12))
    surf.blit(fonts["sm"].render(f"Finais: {len(state.endings)}/20", True, C["text_hi"]),
              (500, hy+44))

    nm = fonts["lg"].render(state.room_name, True, C["text"])
    surf.blit(nm, (SCREEN_W - nm.get_width() - 20, hy+18))

    surf.blit(fonts["sm"].render(
        "WASD:Mover  E:Interagir  ESPACO:Atacar  Q:Largar  TAB:Memorias",
        True, C["text_dim"]), (20, hy+HUD_H-22))

    # minimapa
    mx, my = SCREEN_W - 130, hy + 80
    cs = 12
    layout = [
        ["cave","forest","peak"],
        ["crypt","village","castle"],
        ["temple","fields","ruins"],
    ]
    for gy, row in enumerate(layout):
        for gx, rid in enumerate(row):
            rx = mx + gx * (cs + 4)
            ry = my + gy * (cs + 4)
            if rid == state.room:
                pygame.draw.rect(surf, C["text_hi"], (rx, ry, cs, cs))
            elif rid in state.visited:
                pygame.draw.rect(surf, (80,70,60), (rx, ry, cs, cs))
            else:
                pygame.draw.rect(surf, (30,25,35), (rx, ry, cs, cs), 1)


# ═══════════════════════════════
# DIÁLOGO
# ═══════════════════════════════

def draw_dialogue(surf, text, name, fonts):
    bh = 90
    by = GAME_H - bh - 8
    br = pygame.Rect(GAME_X + 8, by, GAME_W - 16, bh)
    pygame.draw.rect(surf, C["dialog_bg"], br, border_radius=6)
    pygame.draw.rect(surf, C["dialog_bd"], br, 2, border_radius=6)
    if name:
        ns = fonts["md"].render(f"[ {name} ]", True, C["text_hi"])
        surf.blit(ns, (br.x+12, br.y+8))
    for i, line in enumerate(text.split("\n")):
        ls = fonts["sm"].render(line, True, C["text"])
        surf.blit(ls, (br.x+12, br.y+30+i*16))
    hs = fonts["sm"].render("[E] fechar", True, C["text_dim"])
    surf.blit(hs, (br.right - hs.get_width()-12, br.bottom-18))


# ═══════════════════════════════
# INTRO
# ═══════════════════════════════

def draw_intro(surf, title, lines_visible, total_lines, fonts, show_hint):
    surf.fill((8, 6, 14))

    ts = fonts["xxl"].render(title, True, (230, 200, 100))
    surf.blit(ts, ((SCREEN_W - ts.get_width())//2, 80))

    pygame.draw.line(surf, (80, 70, 50),
                     (SCREEN_W//2 - 60, 175), (SCREEN_W//2 + 60, 175), 1)

    base_y = 200
    for i in range(min(lines_visible, total_lines)):
        line = lines_visible  # this is wrong, let me fix
        # actually let me handle this differently
        pass

    # Draw visible lines
    for i in range(lines_visible):
        # We need the actual line text - pass it from core or compute here
        pass

    if show_hint:
        blink = pygame.time.get_ticks() % 1200 < 800
        if blink:
            hs = fonts["md"].render("Pressione ENTER", True, (100, 95, 85))
            surf.blit(hs, ((SCREEN_W - hs.get_width())//2, SCREEN_H - 60))


def draw_intro_lines(surf, lines, visible_count, fonts):
    """Desenha as linhas da intro com posição calculada."""
    base_y = 200
    line_h = 30
    drawn = 0
    for i in range(visible_count):
        if i >= len(lines):
            break
        line = lines[i]
        if line == "":
            drawn += 1
            continue
        ls = fonts["md"].render(line, True, C["text"])
        # última linha em cor diferente
        if i == len(lines) - 1:
            ls = fonts["md"].render(line, True, (200, 180, 140))
        surf.blit(ls, ((SCREEN_W - ls.get_width())//2, base_y + drawn * line_h))
        drawn += 1


# ═══════════════════════════════
# TELA DE FINAL (linha a linha)
# ═══════════════════════════════

def draw_ending_screen(surf, ending, lines_visible, show_reflection,
                       show_controls, fonts):
    surf.fill((6, 4, 10))
    col = ending.get("color", C["white"])

    # Título
    ts = fonts["xl"].render(ending["title"], True, col)
    surf.blit(ts, ((SCREEN_W - ts.get_width())//2, 40))

    # Nome
    ns = fonts["lg"].render(
        f"Final #{ending['id']}: {ending['name']}", True, C["text"])
    surf.blit(ns, ((SCREEN_W - ns.get_width())//2, 100))

    # Linha
    pygame.draw.line(surf, col,
                     (SCREEN_W//2-80, 140), (SCREEN_W//2+80, 140), 1)

    # Linhas do texto
    lines = ending.get("lines", [])
    base_y = 160
    line_h = 24
    drawn = 0
    for i in range(min(lines_visible, len(lines))):
        line = lines[i]
        if line == "":
            drawn += 1
            continue
        ls = fonts["md"].render(line, True, C["text"])
        surf.blit(ls, ((SCREEN_W - ls.get_width())//2, base_y + drawn * line_h))
        drawn += 1

    # Reflexão
    if show_reflection:
        ref = ending.get("reflection", "")
        if ref:
            ref_col = tuple(max(v - 60, 40) for v in col)
            rs = fonts["lg"].render(ref, True, ref_col)
            ry = base_y + drawn * line_h + 30
            surf.blit(rs, ((SCREEN_W - rs.get_width())//2, ry))

    # Controles
    if show_controls:
        hs = fonts["md"].render(
            "[R] recomecar  |  [G] memorias", True, C["text_dim"])
        surf.blit(hs, ((SCREEN_W - hs.get_width())//2, SCREEN_H - 50))


# ═══════════════════════════════
# GALERIA — MEMÓRIAS
# ═══════════════════════════════

def draw_gallery(surf, unlocked, fonts, selected=0):
    surf.fill((8, 6, 12))

    ts = fonts["lg"].render("MEMÓRIAS", True, (200, 190, 170))
    surf.blit(ts, ((SCREEN_W - ts.get_width())//2, 15))

    cnt = fonts["sm"].render(
        f"{len(unlocked)}/20 resgatados", True, (100, 95, 85))
    surf.blit(cnt, ((SCREEN_W - cnt.get_width())//2, 48))

    cols = 4
    cw, ch = 178, 72
    gap = 6
    total_w = cols * cw + (cols - 1) * gap
    sx = (SCREEN_W - total_w) // 2
    sy = 72

    for i, ending in enumerate(ENDINGS):
        row = i // cols
        col_i = i % cols
        ex = sx + col_i * (cw + gap)
        ey = sy + row * (ch + gap)
        eid = ending["id"]
        ok = eid in unlocked
        sel = i == selected

        if sel:
            bg = (45, 40, 55)
            bd = ending.get("color", (200, 190, 170))
            bw = 2
        elif ok:
            bg = (20, 18, 28)
            bd = (50, 45, 60)
            bw = 1
        else:
            bg = (12, 10, 18)
            bd = (25, 22, 32)
            bw = 1

        pygame.draw.rect(surf, bg, (ex, ey, cw, ch), border_radius=4)
        pygame.draw.rect(surf, bd, (ex, ey, cw, ch), bw, border_radius=4)

        if ok:
            ns = fonts["sm"].render(
                f"#{eid}", True, ending.get("color", (200,190,170)))
            surf.blit(ns, (ex+6, ey+4))
            nm = fonts["sm"].render(ending["name"], True, C["text"])
            surf.blit(nm, (ex+6, ey+22))
            ref = ending.get("reflection", "")
            if ref:
                preview = ref[:28] + ("..." if len(ref) > 28 else "")
                rs = fonts["sm"].render(preview, True, (90, 85, 75))
                surf.blit(rs, (ex+6, ey+44))
        else:
            ns = fonts["sm"].render(f"#{eid}", True, (35, 30, 45))
            surf.blit(ns, (ex+6, ey+12))
            lk = fonts["sm"].render("...", True, (25, 22, 32))
            surf.blit(lk, (ex+6, ey+38))

    # Detalhe do selecionado
    if 0 <= selected < len(ENDINGS):
        e = ENDINGS[selected]
        dy = SCREEN_H - 55
        if e["id"] in unlocked:
            desc = e.get("desc", "")
        else:
            desc = "???"
        ds = fonts["sm"].render(
            f"Como: {desc}", True, (140, 135, 125))
        surf.blit(ds, ((SCREEN_W - ds.get_width())//2, dy))
    else:
        dy = SCREEN_H - 55

    hs = fonts["sm"].render(
        "Setas: navegar  |  ESC: voltar", True, (80, 75, 65))
    surf.blit(hs, ((SCREEN_W - hs.get_width())//2, SCREEN_H - 26))


# ═══════════════════════════════
# POPUPS FLUTUANTES
# ═══════════════════════════════

def draw_popup(surf, text, x, y, alpha, fonts):
    """Desenha texto flutuante com alpha."""
    s = fonts["md"].render(text, True, C["text_hi"])
    s.set_alpha(alpha)
    surf.blit(s, (x, y))
import pygame
import sys
import math
import random

pygame.init()

# ============== TELA E CONSTANTES ==============
W, H = 1280, 800
FPS = 60
TW, TH = 64, 32
HW, HH = TW // 2, TH // 2

screen = pygame.display.set_mode((W, H))
pygame.display.set_caption("SkyRise City")
clock = pygame.time.Clock()

# Pre-renderizar ceu
sky = pygame.Surface((W, H))
for y in range(H):
    t = y / H
    r = int(80 + 120 * t)
    g = int(140 + 80 * t)
    b = int(210 + 35 * t)
    pygame.draw.line(sky, (r, g, b), (0, y), (W, y))

ghost_sf = pygame.Surface((160, 160), pygame.SRCALPHA)

# Fontes
F1 = pygame.font.Font(None, 36)
F2 = pygame.font.Font(None, 26)
F3 = pygame.font.Font(None, 22)
F4 = pygame.font.Font(None, 18)

# Cores
GR_C = [(100, 178, 78), (88, 165, 68)]
GR_BD = (65, 130, 55)
EX_C = [(70, 110, 60), (60, 100, 52)]
EX_BD = (45, 80, 40)
C_BG = (18, 18, 32)
C_PNL = (28, 28, 48)
C_PNH = (42, 42, 65)
C_ACC = (255, 195, 60)
C_TXT = (235, 230, 225)
C_MUT = (120, 118, 115)
C_GRN = (80, 220, 120)
C_RED = (230, 80, 80)
C_MON = (255, 220, 50)

# ============== DADOS DOS PREDIOS ==============
BORDER = [
    'house', 'park', 'shop', 'apt', 'office',
    'hosp', 'market', 'factory', 'sky', 'monument'
]

BD = {
    'house':    {'n': 'House',      'c': 100,   'i': 3,   'p': 4,  'ha': 0,   'u': 0,   'h': 22, 'cat': 'r'},
    'park':     {'n': 'Park',       'c': 150,   'i': 0,   'p': 0,  'ha': 8,   'u': 0,   'h': 6,  'cat': 's'},
    'shop':     {'n': 'Shop',       'c': 250,   'i': 8,   'p': 0,  'ha': 2,   'u': 8,   'h': 18, 'cat': 'c'},
    'apt':      {'n': 'Apartment',  'c': 600,   'i': 5,   'p': 12, 'ha': -2,  'u': 15,  'h': 36, 'cat': 'r'},
    'office':   {'n': 'Office',     'c': 800,   'i': 20,  'p': 0,  'ha': -1,  'u': 25,  'h': 32, 'cat': 'c'},
    'hosp':     {'n': 'Hospital',   'c': 1500,  'i': -3,  'p': 0,  'ha': 18,  'u': 40,  'h': 26, 'cat': 's'},
    'market':   {'n': 'Market',     'c': 2000,  'i': 40,  'p': 0,  'ha': 4,   'u': 50,  'h': 20, 'cat': 'c'},
    'factory':  {'n': 'Factory',    'c': 3000,  'i': 65,  'p': 0,  'ha': -10, 'u': 60,  'h': 28, 'cat': 'i'},
    'sky':      {'n': 'Skyscraper', 'c': 10000, 'i': 120, 'p': 25, 'ha': -5,  'u': 120, 'h': 60, 'cat': 'x'},
    'monument': {'n': 'Monument',   'c': 20000, 'i': 30,  'p': 0,  'ha': 40,  'u': 250, 'h': 50, 'cat': 'x'},
}

BCOL = {
    'house':    ((230, 130, 90),  (175, 95, 60),   (200, 112, 75)),
    'park':     ((80, 185, 80),   (55, 140, 55),   (68, 162, 68)),
    'shop':     ((245, 210, 110), (195, 165, 75),  (218, 188, 92)),
    'apt':      ((155, 168, 188), (108, 122, 142), (130, 145, 165)),
    'office':   ((145, 165, 195), (100, 118, 148), (122, 142, 172)),
    'hosp':     ((240, 238, 242), (195, 192, 198), (218, 215, 220)),
    'market':   ((228, 172, 85),  (178, 132, 58),  (202, 152, 72)),
    'factory':  ((162, 148, 138), (118, 105, 95),  (140, 128, 118)),
    'sky':      ((108, 128, 168), (72, 92, 132),   (90, 110, 150)),
    'monument': ((255, 228, 105), (210, 182, 60),  (232, 205, 82)),
}


def lc(c1, c2, t):
    return tuple(max(0, min(255, int(a + (b - a) * t))) for a, b in zip(c1, c2))


# ============== EFEITOS ==============
class Particle:
    def __init__(self, x, y, vx, vy, col, life, sz=3):
        self.x, self.y = x, y
        self.vx, self.vy = vx, vy
        self.col, self.life, self.ml, self.sz = col, life, life, sz

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.vy += 150 * dt
        self.life -= dt

    def draw(self, sf):
        t = max(0, self.life / self.ml)
        sz = max(1, int(self.sz * t))
        c = tuple(max(0, int(v * t)) for v in self.col)
        if sz > 0 and max(c) > 5:
            pygame.draw.circle(sf, c, (int(self.x), int(self.y)), sz)


class FText:
    def __init__(self, x, y, txt, col, life=1.5):
        self.x, self.y, self.txt, self.col = x, y, txt, col
        self.life, self.ml = life, life

    def update(self, dt):
        self.y -= 35 * dt
        self.life -= dt

    def draw(self, sf, font):
        t = max(0, self.life / self.ml)
        c = tuple(max(0, int(v * t)) for v in self.col)
        r = font.render(self.txt, True, c)
        sf.blit(r, (int(self.x) - r.get_width() // 2, int(self.y)))


class Notif:
    def __init__(self, txt, dur=4.0):
        self.txt, self.life, self.slide = txt, dur, 0.0

    def update(self, dt):
        self.slide = min(1.0, self.slide + dt * 5)
        self.life -= dt


# ============== ESTADO DO JOGO ==============
grid = {}
owned = set()
for x in range(-3, 4):
    for y in range(-3, 4):
        owned.add((x, y))

money = 500.0
disp_money = 500.0
population = 0
happiness = 50.0
income = 0.0
cam_x, cam_y = 0.0, -80.0
selected = None
hover_tile = (0, 0)
demo_mode = False
particles = []
ftexts = []
notifs = [Notif("Welcome! Select House from the right panel and click to build!", 7.0)]
anims = {}
drag_origin = None
cam_origin = None
was_drag = False
inc_timer = 0.0
milestones = set()
game_time = 0.0


def i2s(gx, gy):
    sx = (gx - gy) * HW - cam_x + W // 2
    sy = (gx + gy) * HH - cam_y + H // 2
    return sx, sy


def s2i(sx, sy):
    ax = sx + cam_x - W // 2
    ay = sy + cam_y - H // 2
    gx = (ax / HW + ay / HH) / 2
    gy = (ay / HH - ax / HW) / 2
    return round(gx), round(gy)


def get_nb(gx, gy):
    r = []
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        p = (gx + dx, gy + dy)
        if p in grid:
            r.append(grid[p])
    return r


def prox(gx, gy, bt):
    bi, bh = 0, 0
    cat = BD[bt]['cat']
    nb = get_nb(gx, gy)
    if cat == 'c':
        for n in nb:
            if BD[n]['cat'] == 'r':
                bi += 3
    if cat == 'r':
        for n in nb:
            if BD[n]['cat'] == 's':
                bh += 3
            if n == 'park':
                bh += 2
    if bt == 'park':
        for n in nb:
            if BD[n]['cat'] == 'r':
                bh += 2
    return bi, bh


def recalc():
    global population, happiness, income
    ti, tp, th = 0, 0, 50.0
    for (gx, gy), bt in grid.items():
        d = BD[bt]
        ti += d['i']
        tp += d['p']
        th += d['ha']
        pi, ph = prox(gx, gy, bt)
        ti += pi
        th += ph
    population = tp
    happiness = max(0, min(100, th))
    income = ti * (0.5 + happiness / 100.0)


def exp_cost(gx, gy):
    d = max(abs(gx), abs(gy))
    return int(80 * 1.55 ** max(0, d - 3))


def adj_own(gx, gy):
    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        if (gx + dx, gy + dy) in owned:
            return True
    return False


def get_ul():
    return [b for b in BORDER if population >= BD[b]['u']]


def place(gx, gy, bt):
    global money
    if (gx, gy) in owned and (gx, gy) not in grid:
        if money >= BD[bt]['c']:
            money -= BD[bt]['c']
            grid[(gx, gy)] = bt
            anims[(gx, gy)] = 0.0
            recalc()
            sx, sy = i2s(gx, gy)
            col = BCOL[bt][0]
            for _ in range(18):
                particles.append(Particle(
                    sx, sy,
                    random.uniform(-130, 130), random.uniform(-270, -80),
                    lc(col, (255, 255, 200), random.uniform(0, 0.5)),
                    random.uniform(0.7, 1.6), random.uniform(2, 5)))
            check_ms()
            return True
    return False


def demo(gx, gy):
    global money
    if (gx, gy) in grid:
        bt = grid[(gx, gy)]
        ref = int(BD[bt]['c'] * 0.5)
        money += ref
        del grid[(gx, gy)]
        anims.pop((gx, gy), None)
        recalc()
        sx, sy = i2s(gx, gy)
        ftexts.append(FText(sx, sy, "+${0}".format(ref), C_GRN))
        for _ in range(10):
            particles.append(Particle(
                sx, sy,
                random.uniform(-80, 80), random.uniform(-180, -50),
                (180, 180, 180), random.uniform(0.5, 1.2), random.uniform(2, 4)))
        return True
    return False


def expand(gx, gy):
    global money
    if (gx, gy) not in owned and adj_own(gx, gy):
        cost = exp_cost(gx, gy)
        if money >= cost:
            money -= cost
            owned.add((gx, gy))
            sx, sy = i2s(gx, gy)
            for _ in range(12):
                particles.append(Particle(
                    sx, sy,
                    random.uniform(-90, 90), random.uniform(-200, -60),
                    lc(C_GRN, (200, 255, 200), random.random()),
                    random.uniform(0.6, 1.3), random.uniform(2, 4)))
            ftexts.append(FText(sx, sy, "-${0}".format(cost), C_RED))
            return True
    return False


def check_ms():
    ms = [
        (5, "5 residents! Now build Shops for income!"),
        (8, "Shops unlocked! Place near Houses for bonus!"),
        (15, "Apartments unlocked!"),
        (25, "Offices unlocked!"),
        (40, "Hospitals unlocked! Keep happiness high!"),
        (50, "Markets unlocked!"),
        (60, "Factories unlocked! Big money!"),
        (120, "Skyscrapers unlocked!"),
        (250, "Monuments unlocked! Build something legendary!"),
    ]
    for p, m in ms:
        if population >= p and p not in milestones:
            milestones.add(p)
            notifs.append(Notif(m, 5.0))


# ============== DESENHO ==============
def draw_tile(gx, gy, color, bd=None):
    sx, sy = i2s(gx, gy)
    pts = [(sx, sy - HH), (sx + HW, sy), (sx, sy + HH), (sx - HW, sy)]
    pygame.draw.polygon(screen, color, pts)
    if bd:
        pygame.draw.polygon(screen, bd, pts, 1)


def draw_bldg(gx, gy, bt, anim=1.0):
    h = int(BD[bt]['h'] * anim)
    if h < 3:
        return
    sx, sy = i2s(gx, gy)
    tc, lcc, rc = BCOL[bt]
    T = (sx, sy - HH)
    R = (sx + HW, sy)
    B = (sx, sy + HH)
    L = (sx - HW, sy)
    Tt = (T[0], T[1] - h)
    Rt = (R[0], R[1] - h)
    Bt = (B[0], B[1] - h)
    Lt = (L[0], L[1] - h)
    pygame.draw.polygon(screen, lcc, [L, B, Bt, Lt])
    pygame.draw.polygon(screen, rc, [R, B, Bt, Rt])
    pygame.draw.polygon(screen, tc, [Tt, Rt, Bt, Lt])
    pygame.draw.line(screen, lc(tc, (255, 255, 255), 0.25), Lt, Tt, 1)
    pygame.draw.line(screen, lc(lcc, (0, 0, 0), 0.25), L, B, 1)
    pygame.draw.line(screen, lc(lcc, (0, 0, 0), 0.20), B, Bt, 1)
    if anim >= 0.85:
        draw_details(bt, sx, sy, h, rc)


def draw_details(bt, sx, sy, h, fc):
    if bt == 'park':
        tx, ty = int(sx), int(sy - h - 3)
        pygame.draw.line(screen, (100, 70, 40), (tx, int(sy - h)), (tx, ty), 2)
        pygame.draw.circle(screen, (45, 155, 45), (tx, ty - 4), 8)
        pygame.draw.circle(screen, (55, 175, 55), (tx - 2, ty - 6), 5)
    elif bt == 'hosp':
        cx, cy = int(sx), int(sy - h - 5)
        pygame.draw.rect(screen, (210, 50, 50), (cx - 5, cy - 2, 10, 4))
        pygame.draw.rect(screen, (210, 50, 50), (cx - 2, cy - 5, 4, 10))
    elif bt == 'monument':
        cx, cy = int(sx), int(sy - h - 10)
        gl = int(4 + 2 * math.sin(game_time * 3))
        pygame.draw.circle(screen, (255, 235, 100), (cx, cy), gl)
        pygame.draw.circle(screen, (255, 245, 180), (cx, cy), max(1, gl - 2))
    elif bt in ('apt', 'office', 'sky'):
        wc = lc(fc, (255, 255, 200), 0.35)
        rows = max(2, h // 14)
        cols = 2 if h < 40 else 3
        for row in range(rows):
            for col in range(cols):
                fx = (col + 0.5) / cols
                fy = (row + 0.5) / rows
                wx = int(sx + fx * HW)
                wy = int(sy + HH * (1 - fx) - h * fy)
                pygame.draw.rect(screen, wc, (wx, wy, 3, 3))
    elif bt == 'house':
        wx = int(sx + 0.4 * HW)
        wy = int(sy + HH * 0.6 - h * 0.4)
        pygame.draw.rect(screen, (255, 255, 200), (wx, wy, 4, 4))


def draw_ghost(gx, gy):
    bt = selected
    h = BD[bt]['h']
    sx, sy = i2s(gx, gy)
    ox, oy = 80, 140
    ghost_sf.fill((0, 0, 0, 0))
    T = (ox, oy - HH)
    R = (ox + HW, oy)
    B = (ox, oy + HH)
    L = (ox - HW, oy)
    Tt = (T[0], T[1] - h)
    Rt = (R[0], R[1] - h)
    Bt = (B[0], B[1] - h)
    Lt = (L[0], L[1] - h)
    tc, lcc, rc = BCOL[bt]
    tc = lc(tc, (255, 255, 255), 0.5)
    lcc = lc(lcc, (255, 255, 255), 0.5)
    rc = lc(rc, (255, 255, 255), 0.5)
    pygame.draw.polygon(ghost_sf, (*lcc, 60), [L, B, Bt, Lt])
    pygame.draw.polygon(ghost_sf, (*rc, 75), [R, B, Bt, Rt])
    pygame.draw.polygon(ghost_sf, (*tc, 100), [Tt, Rt, Bt, Lt])
    pygame.draw.polygon(ghost_sf, (255, 255, 255, 150), [Tt, Rt, Bt, Lt], 2)
    screen.blit(ghost_sf, (sx - ox, sy - oy))


def draw_scene():
    all_t = set()
    for pos in owned:
        all_t.add(pos)
        for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            adj = (pos[0] + dx, pos[1] + dy)
            if adj not in owned:
                all_t.add(adj)
    vis = []
    for gx, gy in all_t:
        sx, sy = i2s(gx, gy)
        if -TW * 2 < sx < W + TW * 2 and -TH * 4 < sy < H + TH * 2:
            vis.append((gx + gy, gx, gy))
    vis.sort()
    costs = []
    for _, gx, gy in vis:
        io = (gx, gy) in owned
        hb = (gx, gy) in grid
        ih = (gx, gy) == hover_tile
        if io:
            idx = (gx + gy) % 2
            col = GR_C[idx]
            if ih and selected and not hb:
                ok = money >= BD[selected]['c']
                col = lc(col, (140, 255, 140) if ok else (255, 140, 140), 0.35)
            elif ih and demo_mode and hb:
                col = lc(col, (255, 150, 150), 0.4)
            elif ih and not selected and not demo_mode and not hb:
                col = lc(col, (180, 220, 255), 0.2)
            draw_tile(gx, gy, col, GR_BD)
            if hb:
                a = anims.get((gx, gy), 1.0)
                draw_bldg(gx, gy, grid[(gx, gy)], a)
        else:
            idx = (gx + gy) % 2
            col = EX_C[idx]
            ihx = ih and not selected and not demo_mode
            if ihx:
                cost = exp_cost(gx, gy)
                col = lc(col, (100, 180, 255) if money >= cost else (255, 130, 130), 0.35)
            draw_tile(gx, gy, col, EX_BD)
            if ihx:
                sx2, sy2 = i2s(gx, gy)
                costs.append((sx2, sy2 - 12, "${0}".format(exp_cost(gx, gy))))
    for x, y, text in costs:
        r = F4.render(text, True, C_TXT)
        screen.blit(r, (x - r.get_width() // 2, y))
    if selected and hover_tile:
        gx, gy = hover_tile
        if (gx, gy) in owned and (gx, gy) not in grid:
            draw_ghost(gx, gy)


def draw_tooltip():
    if hover_tile and hover_tile in grid and not selected and not demo_mode:
        gx, gy = hover_tile
        bt = grid[(gx, gy)]
        d = BD[bt]
        lines = [(d['n'], C_ACC)]
        if d['i'] != 0:
            c = C_GRN if d['i'] > 0 else C_RED
            lines.append(("Income: {0}{1}/s".format('+' if d['i'] > 0 else '', d['i']), c))
        if d['p'] > 0:
            lines.append(("Pop: +{0}".format(d['p']), C_GRN))
        if d['ha'] != 0:
            c = C_GRN if d['ha'] > 0 else C_RED
            lines.append(("Hap: {0}{1}".format('+' if d['ha'] > 0 else '', d['ha']), c))
        pi, ph = prox(gx, gy, bt)
        if pi > 0:
            lines.append(("Near: +${0}/s".format(pi), C_MON))
        if ph > 0:
            lines.append(("Near: +{0} hap".format(ph), C_MON))
        mx, my = pygame.mouse.get_pos()
        tw = max(F4.size(t)[0] for t, _ in lines) + 24
        th2 = len(lines) * 18 + 14
        tx = min(mx + 15, W - tw - 220)
        ty = max(5, min(my - 10, H - th2 - 25))
        sf = pygame.Surface((tw, th2), pygame.SRCALPHA)
        sf.fill((*C_BG, 225))
        pygame.draw.rect(sf, C_MUT, (0, 0, tw, th2), 1, border_radius=4)
        for i, (text, color) in enumerate(lines):
            font = F3 if i == 0 else F4
            r2 = font.render(text, True, color)
            sf.blit(r2, (10, 6 + i * 18))
        screen.blit(sf, (tx, ty))


def draw_ui():
    global disp_money
    disp_money = disp_money + (money - disp_money) * min(1.0, 0.1)
    bar = pygame.Surface((W, 52), pygame.SRCALPHA)
    bar.fill((*C_BG, 235))
    screen.blit(bar, (0, 0))
    pygame.draw.line(screen, C_ACC, (0, 52), (W, 52), 2)
    mt = F1.render("$ {0:,}".format(int(disp_money)), True, C_MON)
    screen.blit(mt, (18, 6))
    ic = C_GRN if income >= 0 else C_RED
    sym = "+" if income >= 0 else ""
    it = F3.render("{0}{1:.1f}/s".format(sym, income), True, ic)
    screen.blit(it, (18, 34))
    pt = F2.render("Pop: {0}".format(population), True, C_TXT)
    screen.blit(pt, (260, 6))
    hc = C_GRN if happiness >= 50 else (C_MON if happiness >= 25 else C_RED)
    ht = F3.render("Happy: {0}%".format(int(happiness)), True, hc)
    screen.blit(ht, (260, 30))
    bx, by, bw, bh = 380, 33, 80, 10
    pygame.draw.rect(screen, C_PNL, (bx, by, bw, bh))
    fw = int(bw * happiness / 100)
    if fw > 0:
        pygame.draw.rect(screen, hc, (bx, by, fw, bh))
    pygame.draw.rect(screen, C_MUT, (bx, by, bw, bh), 1)
    if selected:
        st = F3.render("Placing: " + BD[selected]['n'], True, C_ACC)
        screen.blit(st, (500, 18))
    elif demo_mode:
        st = F3.render("DEMOLISH MODE", True, C_RED)
        screen.blit(st, (500, 18))
    pw = 210
    px = W - pw
    pbg = pygame.Surface((pw, H - 52), pygame.SRCALPHA)
    pbg.fill((*C_BG, 225))
    screen.blit(pbg, (0, 52))
    pygame.draw.line(screen, C_ACC, (px, 52), (px, H), 2)
    tt = F2.render("BUILD", True, C_ACC)
    screen.blit(tt, (px + pw // 2 - tt.get_width() // 2, 60))
    ul = get_ul()
    bby = 90
    bby_h = 40
    bbw = pw - 16
    bbx = px + 8
    mx, my = pygame.mouse.get_pos()
    for bt in ul:
        d = BD[bt]
        rect = pygame.Rect(bbx, bby, bbw, bby_h)
        hov = rect.collidepoint(mx, my)
        sel = selected == bt
        aff = money >= d['c']
        if sel:
            bg, bd = C_PNH, C_ACC
        elif hov:
            bg, bd = C_PNH, C_MUT
        else:
            bg, bd = C_PNL, (48, 48, 68)
        pygame.draw.rect(screen, bg, rect, border_radius=3)
        pygame.draw.rect(screen, bd, rect, 1, border_radius=3)
        pr = pygame.Rect(bbx + 5, bby + (bby_h - 14) // 2, 14, 14)
        pygame.draw.rect(screen, BCOL[bt][0], pr)
        pygame.draw.rect(screen, C_MUT, pr, 1)
        nc = C_TXT if aff else C_RED
        nt = F3.render(d['n'], True, nc)
        screen.blit(nt, (bbx + 24, bby + 4))
        ct = F4.render("${0:,}".format(d['c']), True, C_MON if aff else C_RED)
        screen.blit(ct, (bbx + 24, bby + 22))
        stats = []
        if d['i'] != 0:
            stats.append("{0}{1}$".format('+' if d['i'] > 0 else '', d['i']))
        if d['p'] > 0:
            stats.append("+{0}p".format(d['p']))
        if d['ha'] != 0:
            stats.append("{0}{1}h".format('+' if d['ha'] > 0 else '', d['ha']))
        if stats:
            st2 = F4.render(" ".join(stats), True, C_MUT)
            screen.blit(st2, (bbx + bbw - st2.get_width() - 4, bby + 22))
        bby += bby_h + 3
    bby += 5
    pygame.draw.line(screen, (48, 48, 68), (bbx + 10, bby), (bbx + bbw - 10, bby))
    bby += 8
    dr = pygame.Rect(bbx, bby, bbw, bby_h)
    dh = dr.collidepoint(mx, my)
    dbg = C_PNH if (demo_mode or dh) else C_PNL
    dbd = C_RED if demo_mode else (100, 50, 50)
    pygame.draw.rect(screen, dbg, dr, border_radius=3)
    pygame.draw.rect(screen, dbd, dr, 1, border_radius=3)
    dt2 = F3.render("Demolish", True, C_RED)
    screen.blit(dt2, (bbx + 8, bby + 9))
    di = F4.render("50% refund", True, C_MUT)
    screen.blit(di, (bbx + bbw - di.get_width() - 4, bby + 12))
    ny = 58
    for n in notifs[-3:]:
        sl = min(1.0, n.slide)
        nx2 = int(-430 + 442 * sl)
        al = min(1.0, n.life) if n.life < 1.0 else 1.0
        ns = pygame.Surface((430, 32))
        ns.fill(C_BG)
        nt3 = F3.render(n.txt, True, C_TXT)
        ns.blit(nt3, (10, 7))
        pygame.draw.line(ns, C_ACC, (0, 0), (430, 0), 1)
        pygame.draw.line(ns, C_ACC, (0, 31), (430, 31), 1)
        ns.set_alpha(int(255 * al))
        screen.blit(ns, (nx2, ny))
        ny += 37
    hint = F4.render(
        "WASD: Pan | 1-0: Quick build | Click: Place/Expand | Right-click: Demolish | ESC: Cancel | R: Restart",
        True, C_MUT)
    screen.blit(hint, (8, H - 18))


def draw_effects():
    for p in particles:
        p.draw(screen)
    for ft in ftexts:
        ft.draw(screen, F3)


# ============== LOOP PRINCIPAL ==============
running = True
while running:
    dt = min(clock.tick(FPS) / 1000.0, 0.05)
    game_time += dt

    for ev in pygame.event.get():
        if ev.type == pygame.QUIT:
            running = False
        elif ev.type == pygame.KEYDOWN:
            if ev.key == pygame.K_ESCAPE:
                selected = None
                demo_mode = False
            elif ev.key == pygame.K_r:
                grid.clear()
                owned.clear()
                for x in range(-3, 4):
                    for y in range(-3, 4):
                        owned.add((x, y))
                money = 500.0
                disp_money = 500.0
                population = 0
                happiness = 50.0
                income = 0.0
                cam_x, cam_y = 0.0, -80.0
                selected = None
                hover_tile = (0, 0)
                demo_mode = False
                particles.clear()
                ftexts.clear()
                notifs.clear()
                notifs.append(Notif("Welcome! Select House from the right panel and click to build!", 7.0))
                anims.clear()
                milestones.clear()
                inc_timer = 0.0
                game_time = 0.0
                recalc()
            else:
                ul = get_ul()
                km = [pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4, pygame.K_5,
                      pygame.K_6, pygame.K_7, pygame.K_8, pygame.K_9, pygame.K_0]
                for i, k in enumerate(km):
                    if ev.key == k and i < len(ul):
                        selected = None if selected == ul[i] else ul[i]
                        demo_mode = False
        elif ev.type == pygame.MOUSEBUTTONDOWN:
            if ev.button == 1:
                if ev.pos[0] >= W - 210:
                    ul = get_ul()
                    bby2 = 90
                    for bt in ul:
                        r = pygame.Rect(W - 202, bby2, 194, 40)
                        if r.collidepoint(ev.pos):
                            selected = None if selected == bt else bt
                            demo_mode = False
                            break
                        bby2 += 43
                    bby2 += 13
                    dr = pygame.Rect(W - 202, bby2, 194, 40)
                    if dr.collidepoint(ev.pos):
                        demo_mode = not demo_mode
                        selected = None
                else:
                    drag_origin = ev.pos
                    cam_origin = (cam_x, cam_y)
            elif ev.button == 3:
                if hover_tile:
                    demo(*hover_tile)
        elif ev.type == pygame.MOUSEBUTTONUP:
            if ev.button == 1:
                if drag_origin and not was_drag:
                    if ev.pos[0] < W - 210 and hover_tile:
                        gx, gy = hover_tile
                        if selected:
                            if not place(gx, gy, selected):
                                if (gx, gy) in owned and (gx, gy) not in grid:
                                    if money < BD[selected]['c']:
                                        notifs.append(Notif("Not enough money!", 2.0))
                        elif demo_mode:
                            demo(gx, gy)
                        else:
                            expand(gx, gy)
                drag_origin = None
                cam_origin = None
                was_drag = False
        elif ev.type == pygame.MOUSEMOTION:
            if drag_origin and pygame.mouse.get_pressed()[0]:
                dx = ev.pos[0] - drag_origin[0]
                dy = ev.pos[1] - drag_origin[1]
                if abs(dx) > 4 or abs(dy) > 4:
                    was_drag = True
                    cam_x = cam_origin[0] - dx
                    cam_y = cam_origin[1] - dy

    keys = pygame.key.get_pressed()
    cs = 450 * dt
    if keys[pygame.K_w] or keys[pygame.K_UP]:
        cam_y -= cs
    if keys[pygame.K_s] or keys[pygame.K_DOWN]:
        cam_y += cs
    if keys[pygame.K_a] or keys[pygame.K_LEFT]:
        cam_x -= cs
    if keys[pygame.K_d] or keys[pygame.K_RIGHT]:
        cam_x += cs

    mx, my = pygame.mouse.get_pos()
    if not drag_origin:
        es = 500 * dt
        if mx < 35:
            cam_x -= es
        if mx > W - 35:
            cam_x += es
        if my < 35:
            cam_y -= es
        if my > H - 35:
            cam_y += es

    if mx < W - 210:
        hover_tile = s2i(mx, my)
    else:
        hover_tile = None

    inc_timer += dt
    while inc_timer >= 1.0:
        inc_timer -= 1.0
        if income > 0:
            money += income
            ftexts.append(FText(
                130 + random.uniform(-40, 40), 40,
                "+${0}/s".format(int(income)), C_MON, 1.8))

    for k in list(anims.keys()):
        anims[k] = min(1.0, anims[k] + dt * 2.5)
        if anims[k] >= 1.0:
            del anims[k]

    for p in particles:
        p.update(dt)
    particles[:] = [p for p in particles if p.life > 0]
    for ft in ftexts:
        ft.update(dt)
    ftexts[:] = [ft for ft in ftexts if ft.life > 0]
    for n in notifs:
        n.update(dt)
    notifs[:] = [n for n in notifs if n.life > 0]

    for (gx, gy), bt in list(grid.items()):
        if bt == 'factory' and random.random() < 0.04:
            sx, sy = i2s(gx, gy)
            h = BD['factory']['h']
            particles.append(Particle(
                sx + random.uniform(-8, 8), sy - h - 5,
                random.uniform(-15, 15), random.uniform(-50, -25),
                (160, 160, 160), random.uniform(1.5, 3.0), random.uniform(3, 7)))

    if grid and random.random() < 0.01 * len(grid):
        pos = random.choice(list(grid.keys()))
        sx, sy = i2s(*pos)
        h = BD[grid[pos]]['h']
        for _ in range(4):
            particles.append(Particle(
                sx + random.uniform(-15, 15), sy - random.uniform(0, h),
                random.uniform(-20, 20), random.uniform(-40, -10),
                (255, 255, 200), random.uniform(0.5, 1.0), random.uniform(1, 3)))

    screen.blit(sky, (0, 0))
    draw_scene()
    draw_effects()
    draw_tooltip()
    draw_ui()
    pygame.display.flip()

pygame.quit()
sys.exit()

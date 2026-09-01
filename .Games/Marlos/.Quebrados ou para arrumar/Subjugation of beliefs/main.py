# ════════════════════════════════════════════════════════════
# main.py — Boot. Carrega dados, conecta sistemas, roda loop.
# Zero regras de jogo. Zero desenho.
# ════════════════════════════════════════════════════════════

import pygame, sys, json, os, random

pygame.init()

from game import Game, EventBus
from render import Render, snd, W, H, CW, CH, HY, LN, LW, LGAP, LX0, LY, LH_BOARD

# ── Carregar dados ─────────────────────────────────────────

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "data.json")
with open(DATA_PATH, encoding="utf-8") as f:
    DATA = json.load(f)

SAVE_FILE = "deck_presets.json"
NUM_PRESETS = 3

def load_presets():
    try:
        with open(SAVE_FILE) as f: return json.load(f)
    except: return {}

def save_presets(data):
    try:
        with open(SAVE_FILE, "w") as f: json.dump(data, f, indent=2, ensure_ascii=False)
    except: pass

def get_presets(hid):
    data = load_presets()
    if hid in data and isinstance(data[hid], list) and len(data[hid]) == NUM_PRESETS:
        return data[hid]
    default = list(DATA["decks"].get(hid, []))
    presets = [{"name": f"Deck {i+1}", "cards": default if i==0 else []} for i in range(NUM_PRESETS)]
    data[hid] = presets; save_presets(data); return presets

def set_presets(hid, presets):
    data = load_presets(); data[hid] = presets; save_presets(data)


# ═══════════════════════════════════════════════════════════
#  APP — Conecta Game + Render, gerencia estados
# ═══════════════════════════════════════════════════════════

class App:
    def __init__(self):
        self.bus = EventBus()
        self.game = None
        self.render = Render(DATA)
        self.state = "menu"
        self.render.enter_menu()
        self.ai_wait = 0; self.ai_speed = 25
        self.selected = -1; self.valid_lanes = []

    def run(self):
        while True:
            dt = clock.tick(60) / 1000.0
            events = pygame.event.get()

            for ev in events:
                if ev.type == pygame.QUIT:
                    pygame.quit(); sys.exit()
                if ev.type == pygame.KEYDOWN:
                    self._handle_key(ev)

            # Render processa UI events e retorna acoes
            actions = self.render.process_events(events,
                self.game.get_state() if self.game else None)
            for a in actions:
                self._handle_action(a)

            # Game update (IA)
            if self.state == "play" and self.game:
                g = self.game
                if g.current_idx == 1 and g.phase != "game_over":
                    self.ai_wait -= 1
                    if self.ai_wait <= 0:
                        g.ai_turn()
                        self._after_turn()
                        if g.phase == "game_over":
                            self.state = "over"; self.render.enter_over()

            # Render
            state = self.game.get_state() if self.game else None
            self.render.draw(state, self.game.drain_events() if self.game else [])

            clock.tick(60)

    def _handle_action(self, a):
        t = a["type"]

        if t == "quit": pygame.quit(); sys.exit()
        elif t == "go_menu": self.state = "menu"; self.game = None; self.render.enter_menu()
        elif t == "go_select": self.state = "select"; self.render.enter_select(DATA["heroes"])
        elif t == "select_hero":
            self.state = "deck"; self._selected_hero = a["hero"]
            presets = get_presets(a["hero"])
            self.render.enter_deck_builder(a["hero"], DATA["heroes"][a["hero"]], DATA["cards"], DATA["decks"], presets)
        elif t == "db_clear":
            self.render.db_deck.clear(); self._save_db()
            self.render._rebuild_db_names(); self._refresh_db_lists()
        elif t == "db_add":
            cid = a["card"]
            if len(self.render.db_deck) < DATA["config"]["deck_max"] and self.render.db_deck.count(cid) < DATA["config"]["max_copies"]:
                self.render.db_deck.append(cid); self._save_db()
                self.render.db_preview = cid
                self.render._rebuild_db_names(); self._refresh_db_lists(); snd.play('add')
            else: snd.play('error')
        elif t == "db_rem":
            cid = a["card"]
            if cid in self.render.db_deck:
                self.render.db_deck.remove(cid); self._save_db()
                self.render.db_preview = cid
                self.render._rebuild_db_names(); self._refresh_db_lists(); snd.play('remove')
        elif t == "db_start":
            if len(self.render.db_deck) >= DATA["config"]["deck_min"]:
                self._start_game()
            else: snd.play('error')
        elif t == "preset_switch":
            i = a["index"]
            # Save current name
            name = self.render.preset_entry.get_text().strip()
            if name: self.render.db_presets[self.render.db_active]["name"] = name
            self._save_db()
            self.render.db_active = i
            self.render.db_deck = list(self.render.db_presets[i]["cards"])
            self.render.preset_entry.set_text(self.render.db_presets[i]["name"])
            self.render._rebuild_db_names(); self._refresh_db_lists(); snd.play('select')
        elif t == "preset_rename":
            name = a["name"].strip()
            self.render.db_presets[self.render.db_active]["name"] = name if name else f"Deck {self.render.db_active+1}"
            self._save_db(); snd.play('save')
        elif t == "end_turn":
            if self.game and self.game.current_idx == 0 and self.game.phase == "play":
                self.game.end_turn()
                self._after_turn()
                if self.game.phase == "game_over":
                    self.state = "over"; self.render.enter_over()
                else:
                    self.ai_wait = self.ai_speed
                    self.render.anim.banners.append(self._banner("Turno do Oponente", (200,50,50)))

    def _save_db(self):
        self.render.db_presets[self.render.db_active]["cards"] = list(self.render.db_deck)
        set_presets(self._selected_hero, self.render.db_presets)

    def _refresh_db_lists(self):
        """Recria UISelectionLists."""
        r = self.render
        for el in (r.avail_list, r.deck_list):
            try: el.kill()
            except: pass
        list_h = 520 - 55
        from render import DB_LEFT_X, DB_TOP, DB_LEFT_W, DB_MID_X, DB_MID_W, DB_LIST_H, SURF, SURF2
        r.avail_list = pygame_gui.elements.UISelectionList(
            pygame.Rect(DB_LEFT_X, DB_TOP, DB_LEFT_W, list_h), r.db_avail_names, r.mgr, allow_double_clicks=True)
        r.deck_list = pygame_gui.elements.UISelectionList(
            pygame.Rect(DB_MID_X, DB_TOP, DB_MID_W, list_h), r.db_deck_names, r.mgr, allow_double_clicks=True)
        n = len(r.db_deck)
        can = DATA["config"]["deck_min"] <= n <= DATA["config"]["deck_max"]
        r.db_start.set_text(f"Jogar [{n}]")
        if can: r.db_start.enable()
        else: r.db_start.disable()

    def _start_game(self):
        hid = self._selected_hero
        ai = random.choice([h for h in DATA["heroes"] if h != hid] or [hid])
        d2 = list(DATA["decks"].get(ai, []))
        self.game = Game(DATA, self.bus)
        self.game.setup(hid, ai, list(self.render.db_deck), d2)
        self.state = "play"; self.selected = -1; self.valid_lanes = []
        self.render.enter_play()
        self.render.hp_display = [float(DATA["heroes"][hid]["hp"]), float(DATA["heroes"][ai]["hp"])]

    def _after_turn(self):
        if self.game:
            state = self.game.get_state()
            self.valid_lanes = []
            self.selected = -1

    def _handle_key(self, ev):
        if self.state == "play" and self.game and self.game.current_idx == 0 and self.game.phase == "play":
            g = self.game; p = g.current
            if pygame.K_1 <= ev.key <= pygame.K_5:
                lane = ev.key - pygame.K_1
                if 0 <= self.selected < len(p.hand) and lane in self.valid_lanes:
                    if g.play_card(self.selected, lane):
                        self.selected = -1; self.valid_lanes = []
            hks = [pygame.K_q,pygame.K_w,pygame.K_e,pygame.K_r,pygame.K_t,pygame.K_y,pygame.K_u]
            for i, hk in enumerate(hks):
                if ev.key == hk and i < len(p.hand):
                    old = self.selected
                    self.selected = i if self.selected != i else -1
                    g.update_valid_lanes(self.selected)
                    self.valid_lanes = g.valid_lanes
                    snd.play('select' if self.selected != old else 'desel')
            if ev.key == pygame.K_SPACE:
                if g.current_idx == 0 and g.phase == "play":
                    g.end_turn(); self._after_turn()
                    if g.phase == "game_over":
                        self.state = "over"; self.render.enter_over()
                    else:
                        self.ai_wait = self.ai_speed
                        self.render.anim.banners.append(self._banner("Turno do Oponente", (200,50,50)))

        if ev.key == pygame.K_ESCAPE:
            if self.state == "play": self.state = "menu"; self.game = None; self.render.enter_menu()
            elif self.state == "deck": self.state = "select"; self.render.enter_select(DATA["heroes"])
            else: pygame.quit(); sys.exit()
        if ev.key == pygame.K_TAB and self.state == "play":
            self.ai_speed = {25:12, 12:4, 4:25}[self.ai_speed]
        if ev.key == pygame.K_m:
            snd.toggle()

    def _banner(self, text, color):
        from render import Banner
        return Banner(text, color)

    # Game click para lanes (mouse)
    def handle_game_click(self, pos):
        if self.state != "play" or not self.game: return
        g = self.game
        if g.current_idx != 0 or g.phase != "play": return
        p = g.current; mx, my = pos; sx, sy = self.render.anim.shake.ox, self.render.anim.shake.oy
        if 0 <= self.selected < len(p.hand):
            for li in range(LN):
                lx = LX0 + li * (LW + LGAP) + sx
                slot_y = LY + LH_BOARD // 2 + 5 + sy
                if pygame.Rect(lx + 5, slot_y, LW - 10, 132).collidepoint(mx, my):
                    if li in self.valid_lanes:
                        if g.play_card(self.selected, li):
                            self.selected = -1; self.valid_lanes = []
                    else: snd.play('error')
                    return
        # Selecionar carta
        hand = p.hand
        hx0 = (W - len(hand) * (CW + 8)) // 2
        for i in range(len(hand)):
            cx = hx0 + i * (CW + 8)
            if cx <= mx <= cx + CW and HY <= my <= HY + CH:
                old = self.selected
                self.selected = i if self.selected != i else -1
                g.update_valid_lanes(self.selected)
                self.valid_lanes = g.valid_lanes
                snd.play('select' if self.selected != old else 'desel')
                return

import pygame_gui
clock = pygame.time.Clock()

if __name__ == "__main__":
    app = App()
    # Injetar referência para game click
    _orig_run = app.run
    def _run():
        while True:
            dt = clock.tick(60) / 1000.0
            events = pygame.event.get()
            for ev in events:
                if ev.type == pygame.QUIT: pygame.quit(); sys.exit()
                if ev.type == pygame.KEYDOWN: app._handle_key(ev)
                if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 1 and app.state == "play":
                    app.handle_game_click(ev.pos)
                if ev.type == pygame.MOUSEBUTTONDOWN and ev.button == 3 and app.state == "play":
                    app.selected = -1; app.valid_lanes = []; snd.play('desel')
            actions = app.render.process_events(events, app.game.get_state() if app.game else None)
            for a in actions: app._handle_action(a)
            if app.state == "play" and app.game:
                g = app.game
                if g.current_idx == 1 and g.phase != "game_over":
                    app.ai_wait -= 1
                    if app.ai_wait <= 0:
                        g.ai_turn(); app._after_turn()
                        if g.phase == "game_over":
                            app.state = "over"; app.render.enter_over()
            state = app.game.get_state() if app.game else None
            evts = app.game.drain_events() if app.game else []
            app.render.draw(state, evts)
    _run()
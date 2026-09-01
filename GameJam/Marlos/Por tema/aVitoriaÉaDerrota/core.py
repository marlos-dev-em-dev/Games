"""
CORE.PY — Motor do jogo HERÓI
Execute: python core.py
"""
import pygame
import sys

from logic import (
    GameState, ENDINGS, ROOMS, ROOM_COLS, ROOM_ROWS,
    DIR_DELTA, check_endings, get_ending,
    INTRO_TITLE, INTRO_LINES,
)
from design import (
    TILE, GAME_W, GAME_H, SCREEN_W, SCREEN_H, GAME_X, GAME_Y,
    C, CORRUPT, corruption_level, load_fonts,
    draw_room, draw_player, draw_entity, draw_hud,
    draw_dialogue, draw_ending_screen, draw_gallery,
    draw_intro, draw_intro_lines, draw_popup,
)

# Estados
INTRO    = 0
PLAYING  = 1
DIALOGUE = 2
ENDING   = 3
GALLERY  = 4

# Timing do final (em frames, 60fps)
LINE_DELAY   = 40   # ~0.67s por linha
PAUSE_DELAY  = 80   # pausa antes da reflexão
HINT_DELAY   = 60   # pausa antes dos controles


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        pygame.display.set_caption("HEROI")
        self.clock = pygame.time.Clock()
        self.fonts = load_fonts()
        self.state = GameState()
        self.entities = []
        self.room_map = []

        # Estado da máquina
        self.state_map = INTRO
        self.prev_state = PLAYING
        self.dialogue_text = ""
        self.dialogue_name = ""
        self.current_ending = None
        self.gallery_sel = 0
        self.show_intro = True

        # Intro
        self.intro_visible = 0
        self.intro_timer = 0
        self.intro_done = False

        # Final — animação
        self.end_visible = 0
        self.end_timer = 0
        self.end_phase = 0  # 0=linhas 1=pause 2=reflexão 3=controles

        # Combate
        self.attack_timer = 0

        # Popups flutuantes: [(texto, x, y, frames_restantes)]
        self.popups = []

        # Posição pixel do jogador
        self.px = self.state.tile_x * TILE
        self.py = self.state.tile_y * TILE
        self.target_px = self.px
        self.target_py = self.py
        self.moving = False
        self.move_speed = 5

        self._load_room(self.state.room)

    # ───── SALAS ─────

    def _load_room(self, room_id):
        room = ROOMS[room_id]
        self.room_map = room["map"]
        self.state.room_name = room["name"]
        self.entities = []
        for e in room.get("entities", []):
            key = (room_id, e["id"])
            if key in self.state.dead_entities:
                continue
            if key in self.state.items_taken:
                continue
            ent = dict(e)
            ent["max_hp"] = ent.get("hp", 0)
            self.entities.append(ent)

    def _enter_room(self, room_id, spawn_x, spawn_y):
        monsters = [e for e in self.entities
                    if e["type"] == "monster" and e.get("hp", 0) > 0]
        if monsters:
            self.state.fled += 1

        self.state.room = room_id
        self.state.tile_x = spawn_x
        self.state.tile_y = spawn_y
        self.state.visited.add(room_id)
        self.state.room_name = ROOMS[room_id]["name"]
        self.px = spawn_x * TILE
        self.py = spawn_y * TILE
        self.target_px = self.px
        self.target_py = self.py
        self.moving = False
        self._load_room(room_id)

        if room_id == "cave" and not self.state.has_sword:
            self.state.entered_cave_no_sword = True

    # ───── LOOP ─────

    def run(self):
        running = True
        while running:
            self.clock.tick(60)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    self._handle_key(event.key)
            self._update()
            self._render()
        pygame.quit()
        sys.exit()

    # ───── INPUT ─────

    def _handle_key(self, key):
        # INTRO
        if self.state_map == INTRO:
            if self.intro_done and key == pygame.K_RETURN:
                self.state_map = PLAYING
                self.show_intro = False
            else:
                # Pular animação
                self.intro_visible = len(INTRO_LINES)
                self.intro_done = True
            return

        # GALERIA
        if self.state_map == GALLERY:
            if key == pygame.K_ESCAPE:
                self.state_map = self.prev_state
            elif key == pygame.K_LEFT:
                self.gallery_sel = max(0, self.gallery_sel - 1)
            elif key == pygame.K_RIGHT:
                self.gallery_sel = min(len(ENDINGS) - 1, self.gallery_sel + 1)
            elif key == pygame.K_UP:
                self.gallery_sel = max(0, self.gallery_sel - 4)
            elif key == pygame.K_DOWN:
                self.gallery_sel = min(len(ENDINGS) - 1, self.gallery_sel + 4)
            return

        # FINAL
        if self.state_map == ENDING:
            if self.end_phase < 3:
                # Pular animação
                self._skip_ending()
                return
            if key == pygame.K_r:
                self._restart()
            elif key == pygame.K_g:
                self.prev_state = ENDING
                self.state_map = GALLERY
                self.gallery_sel = 0
            return

        # DIÁLOGO
        if self.state_map == DIALOGUE:
            if key == pygame.K_e:
                self.state_map = PLAYING
            return

        # PLAYING
        if key == pygame.K_TAB:
            self.prev_state = PLAYING
            self.state_map = GALLERY
            self.gallery_sel = 0
        elif key == pygame.K_SPACE:
            self._attack()
        elif key == pygame.K_e:
            self._interact()
        elif key == pygame.K_q:
            self._discard_sword()

    # ───── UPDATE ─────

    def _update(self):
        # Intro animação
        if self.state_map == INTRO:
            self.intro_timer += 1
            if self.intro_timer >= 40 and not self.intro_done:
                self.intro_timer = 0
                self.intro_visible += 1
                if self.intro_visible >= len(INTRO_LINES):
                    self.intro_done = True
            return

        # Final animação
        if self.state_map == ENDING:
            self.end_timer += 1
            lines = self.current_ending.get("lines", [])
            if self.end_phase == 0:
                if self.end_timer >= LINE_DELAY:
                    self.end_timer = 0
                    self.end_visible += 1
                    if self.end_visible >= len(lines):
                        self.end_phase = 1
            elif self.end_phase == 1:
                if self.end_timer >= PAUSE_DELAY:
                    self.end_phase = 2
                    self.end_timer = 0
            elif self.end_phase == 2:
                if self.end_timer >= HINT_DELAY:
                    self.end_phase = 3
            return

        if self.state_map != PLAYING:
            return

        self._handle_movement()

        # Idle
        keys = pygame.key.get_pressed()
        moving_now = (keys[pygame.K_w] or keys[pygame.K_s] or
                      keys[pygame.K_a] or keys[pygame.K_d] or
                      keys[pygame.K_UP] or keys[pygame.K_DOWN] or
                      keys[pygame.K_LEFT] or keys[pygame.K_RIGHT])
        if not moving_now and not self.moving:
            self.state.idle_frames += 1
            self.state.total_idle += 1
        else:
            self.state.idle_frames = 0

        if self.attack_timer > 0:
            self.attack_timer -= 1

        self._update_player_pos()

        # Popups
        self.popups = [(t, x, y, f-1) for t, x, y, f in self.popups if f > 1]

        # Finais
        eid = check_endings(self.state)
        if eid is not None:
            self._trigger_ending(eid)

    def _skip_ending(self):
        if self.current_ending:
            self.end_visible = len(self.current_ending.get("lines", []))
        self.end_phase = 3

    # ───── MOVIMENTO ─────

    def _handle_movement(self):
        if self.moving:
            return
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        if keys[pygame.K_w] or keys[pygame.K_UP]:
            dy = -1; self.state.direction = 0
        elif keys[pygame.K_s] or keys[pygame.K_DOWN]:
            dy = 1;  self.state.direction = 2
        elif keys[pygame.K_a] or keys[pygame.K_LEFT]:
            dx = -1; self.state.direction = 3
        elif keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            dx = 1;  self.state.direction = 1
        if dx == 0 and dy == 0:
            return

        nx = self.state.tile_x + dx
        ny = self.state.tile_y + dy

        if not (0 <= nx < ROOM_COLS and 0 <= ny < ROOM_ROWS):
            return
        if self.room_map[ny][nx] == "#":
            return

        for e in self.entities:
            if e["x"] == nx and e["y"] == ny:
                if e["type"] == "monster" and e.get("hp", 0) > 0:
                    self._take_damage(e.get("damage", 1))
                    return
                if e["type"] == "npc":
                    return

        self.state.tile_x = nx
        self.state.tile_y = ny
        self.target_px = nx * TILE
        self.target_py = ny * TILE
        self.moving = True

    def _update_player_pos(self):
        if not self.moving:
            return
        dx = self.target_px - self.px
        dy = self.target_py - self.py
        sp = self.move_speed
        if abs(dx) <= sp and abs(dy) <= sp:
            self.px = self.target_px
            self.py = self.target_py
            self.moving = False
            self._on_tile_enter()
        else:
            if dx != 0:
                self.px += sp if dx > 0 else -sp
            if dy != 0:
                self.py += sp if dy > 0 else -sp

    def _on_tile_enter(self):
        self._check_item_pickup()
        self._check_door()

    def _check_door(self):
        x, y = self.state.tile_x, self.state.tile_y
        rd = ROOMS[self.state.room]
        info = None
        if y == 0 and "north" in rd:
            info = rd["north"]
        elif y == ROOM_ROWS - 1 and "south" in rd:
            info = rd["south"]
        elif x == 0 and "west" in rd:
            info = rd["west"]
        elif x == ROOM_COLS - 1 and "east" in rd:
            info = rd["east"]
        if info:
            self._enter_room(*info)
            self._check_item_pickup()

    def _check_item_pickup(self):
        x, y = self.state.tile_x, self.state.tile_y
        remove = []
        for ent in self.entities:
            if ent["x"] == x and ent["y"] == y and ent["type"] == "item":
                remove.append(ent)
        for ent in remove:
            key = (self.state.room, ent["id"])
            self.state.items_taken.add(key)
            self.entities.remove(ent)

            g = ent.get("gold", 0)
            if g > 0:
                self.state.gold += g
                self.popups.append((
                    f"+{g} OURO",
                    GAME_X + x * TILE, GAME_Y + y * TILE, 60))
            elif ent.get("potion"):
                self.state.drank_potion = True
                self.state.hp = min(self.state.hp + 2, self.state.max_hp)
                self.popups.append((
                    "POÇÃO!",
                    GAME_X + x * TILE, GAME_Y + y * TILE, 60))
            elif ent.get("heal", 0) > 0:
                self.state.hp = min(
                    self.state.hp + ent["heal"], self.state.max_hp)
                self.popups.append((
                    "+VIDA",
                    GAME_X + x * TILE, GAME_Y + y * TILE, 60))

    # ───── ATAQUE ─────

    def _attack(self):
        if self.attack_timer > 0 or not self.state.has_sword:
            return
        self.attack_timer = 12
        dx, dy = DIR_DELTA[self.state.direction]
        tx = self.state.tile_x + dx
        ty = self.state.tile_y + dy

        for ent in list(self.entities):
            if ent["x"] != tx or ent["y"] != ty:
                continue

            if ent["type"] == "monster" and ent.get("hp", 0) > 0:
                ent["hp"] -= 1
                if ent["hp"] <= 0:
                    key = (self.state.room, ent["id"])
                    self.state.dead_entities.add(key)
                    mid = ent["id"]
                    self.state.kills[mid] = self.state.kills.get(mid, 0) + 1
                    self.entities.remove(ent)
                    self.popups.append((
                        "VITORIA!",
                        GAME_X + tx * TILE, GAME_Y + ty * TILE, 70))
                    if self.state.damage_taken == 0:
                        self.state.actions.add("perfect_fight")
                return

            if ent["type"] == "npc":
                self.state.hit_npc = True
                key = (self.state.room, ent["id"])
                self.state.dead_entities.add(key)
                self.entities.remove(ent)
                return

    # ───── INTERAÇÃO ─────

    def _interact(self):
        dx, dy = DIR_DELTA[self.state.direction]
        fx, fy = self.state.tile_x + dx, self.state.tile_y + dy
        px, py = self.state.tile_x, self.state.tile_y

        for ent in list(self.entities):
            ex, ey = ent["x"], ent["y"]
            if not ((ex == fx and ey == fy) or (ex == px and ey == py)):
                continue
            t = ent["type"]

            if t == "npc":
                self.state.talked.add(ent["id"])
                self._show_dialogue(ent.get("dialogue","..."), ent.get("name",""))
                return

            if t == "sign":
                self.state.read_signs.add(ent["id"])
                self._show_dialogue(ent.get("text","..."), "Placa")
                return

            if t == "throne":
                self.state.sat_throne = True
                self._show_dialogue(
                    "Você se sentou no trono.\nA coroa desce.\nO peso é eterno.",
                    "Trono")
                return

            if t == "altar":
                self.state.destroyed_altar = True
                key = (self.state.room, ent["id"])
                self.state.dead_entities.add(key)
                self.entities.remove(ent)
                self._show_dialogue(
                    "O altar se despedaça!\nO chão treme.\nAlgo desperta...",
                    "Altar")
                return

            if t == "pit":
                self._show_dialogue(
                    "Um abismo sem fundo.\nVozes chamam seu nome.",
                    "Abismo")
                return

            if t == "void":
                self.state.left_map = True
                self._show_dialogue(
                    "'Não existe lá fora.'\n\nSó vazio. Só silêncio.",
                    "Abismo")
                return

            if t == "secret_wall":
                self.state.found_secret = True
                key = (self.state.room, ent["id"])
                self.state.dead_entities.add(key)
                self.entities.remove(ent)
                self._show_dialogue(
                    "A parede se dissolve...\n\nDentro: código.\nVocê é uma variável.",
                    "???")
                return

            if t == "construction":
                self.state.constructions += 1
                n = ent.get("name", "estrutura")
                extra = ""
                if self.state.constructions >= 4:
                    extra = "\n\nTudo começa a tremer..."
                self._show_dialogue(
                    f"Você examina {n}.\n"
                    f"Construções: {self.state.constructions}/4{extra}",
                    n)
                return

            if t == "monster" and ent.get("hp", 0) > 0:
                self._take_damage(ent.get("damage", 1))
                return

    # ───── AÇÕES ─────

    def _discard_sword(self):
        if not self.state.has_sword:
            return
        self.state.has_sword = False
        self.state.discarded_sword = True

    def _take_damage(self, amount):
        self.state.hp -= amount
        self.state.damage_taken += amount
        if self.state.hp <= 0:
            self._die()

    def _die(self):
        self.state.actions.add("died")
        self.state.hp = self.state.max_hp

    def _show_dialogue(self, text, name):
        self.dialogue_text = text
        self.dialogue_name = name
        self.state_map = DIALOGUE

    def _trigger_ending(self, eid):
        ending = get_ending(eid)
        if ending and eid not in self.state.endings:
            self.state.endings.add(eid)
        self.current_ending = ending
        self.end_visible = 0
        self.end_timer = 0
        self.end_phase = 0
        self.state_map = ENDING

    def _restart(self):
        unlocked = set(self.state.endings)
        self.state = GameState()
        self.state.endings = unlocked
        self.px = self.state.tile_x * TILE
        self.py = self.state.tile_y * TILE
        self.target_px = self.px
        self.target_py = self.py
        self.moving = False
        self.attack_timer = 0
        self.popups = []
        self._load_room(self.state.room)
        self.state_map = PLAYING

    # ───── RENDER ─────

    def _render(self):
        c_lv = corruption_level(self.state)

        # ── INTRO ──
        if self.state_map == INTRO:
            self.screen.fill((8, 6, 14))
            ts = self.fonts["xxl"].render(INTRO_TITLE, True, (230, 200, 100))
            self.screen.blit(ts, ((SCREEN_W - ts.get_width())//2, 80))
            pygame.draw.line(self.screen, (80, 70, 50),
                             (SCREEN_W//2-60, 175), (SCREEN_W//2+60, 175), 1)
            draw_intro_lines(self.screen, INTRO_LINES,
                             self.intro_visible, self.fonts)
            if self.intro_done:
                tick = pygame.time.get_ticks() % 1200 < 800
                if tick:
                    hs = self.fonts["md"].render(
                        "Pressione ENTER", True, (100, 95, 85))
                    self.screen.blit(hs,
                        ((SCREEN_W - hs.get_width())//2, SCREEN_H - 60))
            pygame.display.flip()
            return

        # ── GALERIA ──
        if self.state_map == GALLERY:
            draw_gallery(self.screen, self.state.endings,
                         self.fonts, self.gallery_sel)
            pygame.display.flip()
            return

        # ── FINAL ──
        if self.state_map == ENDING and self.current_ending:
            draw_ending_screen(
                self.screen, self.current_ending,
                self.end_visible,
                self.end_phase >= 2,
                self.end_phase >= 3,
                self.fonts)
            pygame.display.flip()
            return

        # ── JOGO ──
        bg = CORRUPT["bg"][c_lv]
        self.screen.fill(bg)
        draw_room(self.screen, self.room_map, c_lv)

        # Entidades + jogador ordenados por Y
        drawables = []
        for ent in self.entities:
            drawables.append((ent["y"] * TILE, ent))
        drawables.append((self.py, None))
        drawables.sort(key=lambda d: d[0])

        for _, item in drawables:
            if item is None:
                draw_player(self.screen, self.px, self.py,
                            self.state.direction, self.state.has_sword,
                            self.attack_timer > 0, c_lv)
            else:
                draw_entity(self.screen, item)

        # Popups
        for text, x, y, frames in self.popups:
            alpha = int(255 * frames / 70)
            offset = int((70 - frames) * 0.6)
            draw_popup(self.screen, text, x, y - offset, alpha, self.fonts)

        # HUD
        draw_hud(self.screen, self.state, self.fonts)

        # Diálogo
        if self.state_map == DIALOGUE:
            draw_dialogue(self.screen, self.dialogue_text,
                          self.dialogue_name, self.fonts)

        pygame.display.flip()


if __name__ == "__main__":
    Game().run()
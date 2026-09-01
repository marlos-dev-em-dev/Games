# ════════════════════════════════════════════════════════════
# game.py — Motor do jogo. Zero pygame. Logica pura.
#
# Arquitetura:
#   EventBus       → desacoplamento de eventos
#   Systems        → organizacao interna
#   GameState      → representacao limpa para render
# ════════════════════════════════════════════════════════════

import random
from collections import defaultdict


# ═══════════════════════════════════════════════════════════
#  EVENT BUS
# ═══════════════════════════════════════════════════════════

class EventBus:
    def __init__(self):
        self._l = defaultdict(list)

    def on(self, event, cb):
        self._l[event].append(cb)

    def emit(self, event, data=None):
        for cb in self._l[event]:
            cb(data)


# ═══════════════════════════════════════════════════════════
#  RUNTIME CLASSES
# ═══════════════════════════════════════════════════════════

class Card:
    __slots__ = (
        "id", "name", "card_type", "mana", "atk", "hp", "max_hp",
        "side", "rarity", "tags", "keywords", "abilities", "desc",
        "color", "armored", "anti_hero", "owner_id", "state", "lane",
        "has_attacked", "just_played", "frozen", "silenced",
    )

    def __init__(self, cid, data, owner_id):
        self.id = cid
        self.name = data["name"]
        self.card_type = data["type"]
        self.mana = data["mana"]
        self.atk = data["atk"]
        self.hp = data["hp"]
        self.max_hp = data["hp"]
        self.side = data["side"]
        self.rarity = data.get("rarity", "common")
        self.tags = list(data.get("tags", []))
        self.keywords = list(data.get("keywords", []))
        self.abilities = list(data.get("abilities", []))
        self.desc = data.get("desc", "")
        self.color = tuple(data.get("color", [100, 100, 100]))
        self.armored = data.get("armored", 0)
        self.anti_hero = data.get("anti_hero", 0)
        self.owner_id = owner_id
        self.state = "deck"
        self.lane = -1
        self.has_attacked = False
        self.just_played = True
        self.frozen = False
        self.silenced = False

    def get_atk(self, empty_lane=False):
        v = self.atk
        if empty_lane and "anti_hero" in self.keywords and self.anti_hero:
            v += self.anti_hero
        return v

    def take_damage(self, amount):
        actual = max(0, amount - self.armored)
        self.hp -= actual
        return actual

    def heal(self, amount):
        old = self.hp
        self.hp = min(self.max_hp, self.hp + amount)
        return self.hp - old

    def buff(self, a, h):
        self.atk += a
        self.hp += h
        self.max_hp += h

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "type": self.card_type,
            "mana": self.mana, "atk": self.atk, "hp": self.hp,
            "max_hp": self.max_hp, "rarity": self.rarity,
            "tags": self.tags, "keywords": self.keywords,
            "desc": self.desc, "color": self.color,
            "armored": self.armored, "lane": self.lane,
            "frozen": self.frozen, "silenced": self.silenced,
            "just_played": self.just_played,
            "effective_atk": self.get_atk(),
        }


class Player:
    def __init__(self, pid, hero_data):
        self.id = pid
        self.hero = hero_data
        self.hp = hero_data["hp"]
        self.max_hp = hero_data["hp"]
        self.mana = 0
        self.max_mana = 0
        self.deck = []
        self.hand = []
        self.graveyard = []
        self.lanes = [None] * 5
        self.block_meter = 0

    def to_dict(self, visible_hand=False):
        lanes = []
        for c in self.lanes:
            lanes.append(c.to_dict() if c else None)
        hand = []
        if visible_hand:
            for c in self.hand:
                hand.append(c.to_dict())
        return {
            "hero_name": self.hero["name"],
            "hero_side": self.hero["side"],
            "hero_color": self.hero.get("color", [100, 100, 100]),
            "hp": self.hp, "max_hp": self.max_hp,
            "mana": self.mana, "max_mana": self.max_mana,
            "block_meter": self.block_meter,
            "block_max": 4,
            "deck_count": len(self.deck),
            "hand_count": len(self.hand),
            "hand": hand,
            "lanes": lanes,
            "graveyard_count": len(self.graveyard),
        }


# ═══════════════════════════════════════════════════════════
#  GAME — Systems organizados internamente
# ═══════════════════════════════════════════════════════════

class Game:
    MAX_DEATH_LOOPS = 60

    def __init__(self, data, bus):
        self.data = data
        self.bus = bus
        self.cfg = data["config"]
        self.cards_db = data["cards"]
        self.heroes_db = data["heroes"]
        self.decks_db = data["decks"]

        self.players = []
        self.current_idx = 0
        self.round_num = 0
        self.phase = "idle"
        self.winner = None
        self.log = []
        self.pending_events = []
        self.valid_lanes = []
        self.selected_hand = -1

    @property
    def current(self):
        return self.players[self.current_idx]

    @property
    def opponent(self):
        return self.players[1 - self.current_idx]

    def _log(self, msg):
        self.log.append(msg)
        if len(self.log) > 200:
            self.log = self.log[-130:]

    def _evt(self, etype, **kw):
        self.pending_events.append({"type": etype, **kw})
        self.bus.emit(etype, kw)

    def drain_events(self):
        evts = list(self.pending_events)
        self.pending_events.clear()
        return evts

    # ── Setup ────────────────────────────────────────────

    def setup(self, p1_hero, p2_hero, p1_deck_ids, p2_deck_ids):
        self.players = [
            Player(0, self.heroes_db[p1_hero]),
            Player(1, self.heroes_db[p2_hero]),
        ]
        for cid in p1_deck_ids:
            if cid in self.cards_db:
                self.players[0].deck.append(Card(cid, self.cards_db[cid], 0))
        for cid in p2_deck_ids:
            if cid in self.cards_db:
                self.players[1].deck.append(Card(cid, self.cards_db[cid], 1))
        for p in self.players:
            random.shuffle(p.deck)
        self.round_num = 0
        self.winner = None
        self.phase = "playing"
        self.log.clear()
        self.pending_events.clear()
        for p in self.players:
            for _ in range(self.cfg["start_hand"]):
                self._draw(p)
        self.current_idx = 0
        self._begin_turn()

    def can_play_anything(self):
        p = self.current
        for c in p.hand:
            if p.mana < c.mana:
                continue
            if c.card_type == "trick":
                return True
            if c.card_type == "unit":
                if any(s is None for s in p.lanes):
                    return True
        return False

    # ── Turn System ──────────────────────────────────────

    def _begin_turn(self):
        p = self.current
        if self.current_idx == 0:
            self.round_num += 1
        if p.max_mana < self.cfg["max_mana"]:
            p.max_mana += 1
        p.mana = p.max_mana
        drawn = self._draw(p)
        if drawn:
            self._log(f"{p.hero['name']} comprou {drawn.name}.")
            self._evt("DRAW_CARD", player=p.id)
        for c in p.lanes:
            if c:
                c.has_attacked = False
                c.just_played = False
                c.frozen = False
        for c in list(p.lanes):
            if c:
                for ab in c.abilities:
                    if ab["trigger"] == "start_of_turn":
                        self._exec_ability(ab, c, p)
        self._resolve_deaths()
        self.phase = "play"
        self._log(f"── Turno {p.hero['name']} | {p.mana}/{p.max_mana} ──")
        self._evt("TURN_START", player=p.id, round=self.round_num)

    def end_turn(self):
        p = self.current
        self._evt("TURN_END", player=p.id)
        for c in list(p.lanes):
            if c:
                for ab in c.abilities:
                    if ab["trigger"] == "end_of_turn":
                        self._exec_ability(ab, c, p)
        self._resolve_deaths()
        self._combat_phase()
        if self._check_win():
            return
        self.current_idx = 1 - self.current_idx
        self._begin_turn()

    # ── Card System ──────────────────────────────────────

    def play_card(self, hand_idx, lane=-1):
        p = self.current
        if hand_idx < 0 or hand_idx >= len(p.hand):
            return False
        card = p.hand[hand_idx]
        if p.mana < card.mana:
            return False

        if card.card_type == "unit":
            if lane < 0 or lane >= self.cfg["lanes"] or p.lanes[lane] is not None:
                return False
            p.mana -= card.mana
            p.hand.remove(card)
            p.lanes[lane] = card
            card.lane = lane
            card.state = "field"
            card.just_played = True
            self._log(f"{p.hero['name']} jogou {card.name} L{lane+1}.")
            self._evt("CARD_PLAYED", name=card.name, lane=lane,
                      player=p.id, ctype="unit")
            for ab in card.abilities:
                if ab["trigger"] == "when_played":
                    self._exec_ability(ab, card, p)
            self._resolve_deaths()
            self._check_win()
            return True

        elif card.card_type == "trick":
            p.mana -= card.mana
            p.hand.remove(card)
            card.state = "graveyard"
            p.graveyard.append(card)
            self._log(f"{p.hero['name']} lancou {card.name}.")
            self._evt("CARD_PLAYED", name=card.name, lane=-1,
                      player=p.id, ctype="trick")
            for ab in card.abilities:
                if ab["trigger"] == "when_played":
                    self._exec_ability(ab, card, p)
            self._resolve_deaths()
            self._check_win()
            return True
        return False

    def update_valid_lanes(self, hand_idx):
        self.valid_lanes = []
        self.selected_hand = -1
        if hand_idx < 0 or hand_idx >= len(self.current.hand):
            return
        card = self.current.hand[hand_idx]
        if self.current.mana < card.mana:
            return
        self.selected_hand = hand_idx
        if card.card_type == "unit":
            self.valid_lanes = [i for i in range(self.cfg["lanes"])
                                if self.current.lanes[i] is None]
        elif card.card_type == "trick":
            self.valid_lanes = list(range(self.cfg["lanes"]))

    # ── Combat System ────────────────────────────────────

    def _combat_phase(self):
        atk_p = self.current
        def_p = self.opponent
        for lane in range(self.cfg["lanes"]):
            unit = atk_p.lanes[lane]
            if unit is None or unit.has_attacked or unit.frozen:
                continue
            if unit.just_played and "charge" not in unit.keywords:
                continue
            unit.has_attacked = True
            strikes = 2 if "double_strike" in unit.keywords else 1
            for _ in range(strikes):
                if unit.hp <= 0:
                    break
                blocker = def_p.lanes[lane]
                self._evt("COMBAT_ATTACK", lane=lane, attacker=atk_p.id)
                if blocker and blocker.hp > 0:
                    self._lane_fight(unit, blocker, lane, atk_p, def_p)
                else:
                    dmg = unit.get_atk(empty_lane=True)
                    self._hero_damage(def_p, dmg, unit)
                    self._log(f"  L{lane+1}: {unit.name} -> {dmg} direto")
                self._resolve_deaths()
                if self._check_win():
                    return

    def _lane_fight(self, atk, dfn, lane, atk_p, def_p):
        ad = atk.get_atk(empty_lane=False)
        dd = dfn.get_atk(empty_lane=False)
        a2d = dfn.take_damage(ad)
        a2a = atk.take_damage(dd)
        self._log(f"  L{lane+1}: {atk.name}({ad}) vs {dfn.name}({dd})")
        self._evt("UNIT_HIT", player=def_p.id, lane=lane, value=a2d)
        self._evt("UNIT_HIT", player=atk_p.id, lane=atk.lane, value=a2a)

        if "deadly" in atk.keywords and a2d > 0:
            dfn.hp = 0
        if "deadly" in dfn.keywords and a2a > 0:
            atk.hp = 0

        if "strikethrough" in atk.keywords and dfn.hp <= 0:
            self._hero_damage(def_p, ad, atk)

        if "frenzy" in atk.keywords and dfn.hp <= 0 and atk.hp > 0:
            bonus = atk.get_atk(empty_lane=True)
            self._hero_damage(def_p, bonus, atk)

        if a2a > 0 and atk.hp > 0:
            for ab in atk.abilities:
                if ab["trigger"] == "when_hurt":
                    self._exec_ability(ab, atk, atk_p)
        if a2d > 0 and dfn.hp > 0:
            for ab in dfn.abilities:
                if ab["trigger"] == "when_hurt":
                    self._exec_ability(ab, dfn, def_p)

    def _hero_damage(self, player, amount, source):
        if amount <= 0:
            return False
        if "bullseye" not in source.keywords:
            player.block_meter += 1
            if player.block_meter >= self.cfg["block_max"]:
                player.block_meter = 0
                if player.hero.get("superpowers") and len(player.hand) < self.cfg["max_hand"]:
                    sp_id = random.choice(player.hero["superpowers"])
                    if sp_id in self.cards_db:
                        sp = Card(sp_id, self.cards_db[sp_id], player.id)
                        sp.state = "hand"
                        player.hand.append(sp)
                self._log(f"  BLOQUEIO! {player.hero['name']} ganha SP!")
                self._evt("BLOCK", player=player.id)
                return True
        player.hp -= amount
        self._evt("HERO_HIT", player=player.id, value=amount)
        return False

    # ── Death System ─────────────────────────────────────

    def _resolve_deaths(self):
        loops = 0
        while loops < self.MAX_DEATH_LOOPS:
            loops += 1
            dead = None
            for p in self.players:
                for i, u in enumerate(p.lanes):
                    if u and u.hp <= 0:
                        dead = (u, p, i)
                        break
                if dead:
                    break
            if not dead:
                break
            unit, owner, lane = dead
            self._log(f"  {unit.name} morreu!")
            self._evt("UNIT_DIED", name=unit.name, lane=lane, player=owner.id)
            for ab in unit.abilities:
                if ab["trigger"] == "when_destroyed":
                    self._exec_ability(ab, unit, owner)
            owner.lanes[lane] = None
            unit.state = "graveyard"
            unit.lane = -1
            owner.graveyard.append(unit)

    def _check_win(self):
        for i, p in enumerate(self.players):
            if p.hp <= 0:
                self.winner = 1 - i
                self.phase = "game_over"
                self._log(f"★ {self.players[self.winner].hero['name']} VENCEU! ★")
                self._evt("GAME_OVER", winner=self.winner)
                return True
        return False

    # ── Ability System ───────────────────────────────────

    def _exec_ability(self, ab, source, owner):
        targets = self._resolve_target(ab.get("target", "self"), source, owner)
        for t in targets:
            self._apply_action(ab, source, t, owner)

    def _resolve_target(self, tgt, source, owner):
        enemy = self.players[1 - owner.id]
        if tgt == "self":
            return [source]
        elif tgt == "all_allies":
            return [c for c in owner.lanes if c and c.hp > 0]
        elif tgt == "all_enemies":
            return [c for c in enemy.lanes if c and c.hp > 0]
        elif tgt == "random_enemy":
            pool = [c for c in enemy.lanes if c and c.hp > 0]
            return [random.choice(pool)] if pool else []
        elif tgt == "random_ally":
            pool = [c for c in owner.lanes if c and c.hp > 0 and c is not source]
            if not pool:
                pool = [c for c in owner.lanes if c and c.hp > 0]
            return [random.choice(pool)] if pool else []
        elif tgt == "owner_hero":
            return [("hero", owner)]
        elif tgt == "enemy_hero":
            return [("hero", enemy)]
        elif tgt == "all":
            return [c for c in owner.lanes + enemy.lanes if c and c.hp > 0]
        return []

    def _apply_action(self, ab, source, target, owner):
        act = ab["action"]
        val = ab.get("value", 0)
        if act == "damage":
            if isinstance(target, tuple):
                pl = target[1]
                self._hero_damage(pl, val, source)
                self._evt("HERO_HIT", player=pl.id, value=val)
                self._log(f"    {source.name}: {val} dano heroi.")
            elif isinstance(target, Card):
                actual = target.take_damage(val)
                self._evt("UNIT_HIT", player=target.owner_id,
                          lane=target.lane, value=actual)
                self._log(f"    {source.name}: {actual} dano {target.name}.")
                if actual > 0 and target.hp > 0:
                    for a2 in target.abilities:
                        if a2["trigger"] == "when_hurt":
                            self._exec_ability(a2, target,
                                               self.players[target.owner_id])
        elif act == "heal":
            if isinstance(target, tuple):
                pl = target[1]
                old = pl.hp
                pl.hp = min(pl.max_hp, pl.hp + val)
                self._evt("HERO_HEAL", player=pl.id, value=pl.hp - old)
                self._log(f"    {source.name}: curou {pl.hp - old} heroi.")
            elif isinstance(target, Card):
                h = target.heal(val)
                if h:
                    self._evt("UNIT_HEAL", player=target.owner_id,
                              lane=target.lane, value=h)
                    self._log(f"    {source.name}: +{h} {target.name}.")
        elif act == "buff":
            if isinstance(target, Card):
                target.buff(val, val)
                self._evt("UNIT_BUFF", player=target.owner_id,
                          lane=target.lane, value=val)
                self._log(f"    {target.name} +{val}/+{val}.")
        elif act == "draw":
            for _ in range(val):
                d = self._draw(owner)
                if d:
                    self._evt("DRAW_CARD", player=owner.id)
                    self._log(f"    Comprou {d.name}.")
        elif act == "destroy":
            if isinstance(target, Card):
                target.hp = 0
                self._log(f"    {target.name} destruido!")

    # ── Deck System ──────────────────────────────────────

    def _draw(self, player):
        if not player.deck:
            return None
        if len(player.hand) >= self.cfg["max_hand"]:
            b = player.deck.pop(0)
            b.state = "graveyard"
            player.graveyard.append(b)
            self._log(f"Mao cheia! {b.name} queimou.")
            return None
        c = player.deck.pop(0)
        c.state = "hand"
        player.hand.append(c)
        return c

    # ── AI System ────────────────────────────────────────

    def ai_turn(self):
        p = self.current
        if self.phase == "game_over":
            return
        loops = 0
        changed = True
        while changed and loops < 25:
            changed = False
            loops += 1
            for card in list(p.hand):
                if p.mana < card.mana:
                    continue
                if card.card_type == "unit":
                    empty = [l for l in range(self.cfg["lanes"])
                             if p.lanes[l] is None]
                    if not empty:
                        continue
                    enemy = self.players[1 - p.id]
                    block = [l for l in empty if enemy.lanes[l]]
                    lane = random.choice(block) if block else random.choice(empty)
                    idx = p.hand.index(card)
                    if self.play_card(idx, lane):
                        changed = True
                        break
                elif card.card_type == "trick":
                    idx = p.hand.index(card)
                    if self.play_card(idx):
                        changed = True
                        break
        self.end_turn()

    # ── GameState ────────────────────────────────────────

    def get_state(self):
        return {
            "phase": self.phase,
            "turn": self.round_num,
            "current_player": self.current_idx,
            "winner": self.winner,
            "players": [
                self.players[0].to_dict(visible_hand=True),
                self.players[1].to_dict(visible_hand=False),
            ],
            "log": self.log[-15:],
            "valid_lanes": self.valid_lanes,
            "selected_hand": self.selected_hand,
            "can_play": self.can_play_anything() if self.phase == "play" else False,
        }
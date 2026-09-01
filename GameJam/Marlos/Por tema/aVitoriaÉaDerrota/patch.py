"""
patch.py — Tier 1 + Tier 2 para main.py
Execute: python patch.py
Depois:  python main.py
"""
import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")
with open(path, "r", encoding="utf-8") as f:
    code = f.read()

orig = code
n = 0

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P1 — Bloco de dados + funcoes auxiliares
#     Insere antes de class Game:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M1 = "class Game:"
if M1 in code and "KILL_MSGS" not in code:
    B1 = (
        "\n# ══ PATCH TIER 1+2 ══\n"
        "\n"
        "KILL_MSGS = [\n"
        '    "VITORIA!", "HEROI!", "INCRIVEL!", "HEROI INCRIVEL!",\n'
        '    "O MUNDO ESTA MAIS SEGURO!", "DEFENSOR DA PATRIA!",\n'
        '    "LENDA VIVA!", "DEUS DA GUERRA!", "PURIFICADOR!", "O ESCOLHIDO!"\n'
        "]\n"
        "\n"
        "ACH_DEFS = {\n"
        '    "first_kill": {"name": "PRIMEIRA VITORIA", "desc": "Mate algo que nunca te ameacou", "col": (200,180,100)},\n'
        '    "purifier":   {"name": "PURIFICADOR",      "desc": "Mate 5 criaturas",                "col": (200,80,80)},\n'
        '    "legend":     {"name": "LENDA VIVA",        "desc": "Mate 10 seres vivos",             "col": (200,200,80)},\n'
        '    "perfect":    {"name": "SIMULACAO",         "desc": "Eram todos atores",               "col": (180,180,220)},\n'
        '    "blood":      {"name": "MONSTRO",           "desc": "O heroi morreu. Restou voce.",    "col": (180,40,40)},\n'
        "}\n"
        "\n"
        "NPC_CORRUPT = {\n"
        '    "elder": [\n'
        '        (0, "Heroi! O dragao ameaca o reino!\\nVa ao norte e derrote-o!\\nO mundo precisa de voce!"),\n'
        '        (2, "Voce... esta diferente.\\nSeus olhos...\\nVai, termine logo."),\n'
        '        (4, "Por favor... nao se aproxime.\\nEu te imploro."),\n'
        '        (5, "...fica longe."),\n'
        "    ],\n"
        '    "merc": [\n'
        '        (0, "Bem-vindo, viajante.\\nO mundo e maior do que parece.\\n...ou menor."),\n'
        '        (2, "Nao quero problemas.\\nLeva o que quiser.\\nSo vai embora."),\n'
        '        (4, "Toma. Toma tudo.\\nSo nao me toca."),\n'
        '        (5, "..."),\n'
        "    ],\n"
        '    "guard": [\n'
        '        (0, "O castelo fica ao leste.\\nO rei aguarda sua presenca.\\nNao o decepcione."),\n'
        '        (2, "Eu... te conheco?\\nVoce mudou."),\n'
        '        (4, "Mantenha distancia.\\nOrdens do rei."),\n'
        '        (5, "Se chegar mais perto...\\n...nao, esquece."),\n'
        "    ],\n"
        '    "king": [\n'
        '        (0, "Bem-vindo, heroi.\\nDerrote o dragao e seu\\nnome sera eternizado."),\n'
        '        (2, "Ouvi relatos...\\nVoce nao e mais o mesmo."),\n'
        '        (4, "Guardas! Mantenham-no\\nao menos a 3 passos."),\n'
        '        (5, "...quem e voce?"),\n'
        "    ],\n"
        '    "farmer": [\n'
        '        (0, "Os campos ja foram verdes.\\nAntes dos herois aparecerem.\\nAgora so resta cinza."),\n'
        '        (2, "E voce veio de novo...\\nPor que herois sempre voltam?"),\n'
        '        (4, "Nao. Nao. NAO.\\nSai dos meus campos!"),\n'
        '        (5, "......"),\n'
        "    ],\n"
        '    "priest": [\n'
        '        (0, "O altar contem um poder\\nantigo. Nao o perturbe.\\nOu perturbe. Escolha sua."),\n'
        '        (2, "As oracoes pararam de\\nfuncionar. Desde que voce\\nchegou."),\n'
        '        (4, "Deus nos abandonou.\\nOu fomos nos que\\nabandonamos ele."),\n'
        '        (5, "..."),\n'
        "    ],\n"
        '    "child": [\n'
        '        (0, "Voce e meu heroi!\\nMe proteja!\\nNao deixa os monstros me pegar!"),\n'
        '        (2, "Voce vai salvar todo mundo, ne?\\n...ne?"),\n'
        '        (4, "...voce ta com manchas...\\nSao... vermelhas..."),\n'
        '        (5, "FICA LONGE DE MIM!"),\n'
        "    ],\n"
        "}\n"
        "\n"
        "SIGN_CORRUPT = {\n"
        '    "s1": [(0, None), (5, "Voce ainda esta lendo placas?\\nOs monstros nao tiveram\\nessa chance.")],\n'
        '    "s2": [(0, None), (3, "As arvores nao sussurram\\nmais. Estao mortas.")],\n'
        '    "s6": [(0, None), (3, "O dragao nao esta mais aqui.\\nNinguem esta.")],\n'
        '    "s7": [(0, None), (5, "Agora so crescem\\nmemorias de violencia.")],\n'
        "}\n"
        "\n"
        "\n"
        "def _get_npc_dlg(nid, kl):\n"
        "    e = NPC_CORRUPT.get(nid)\n"
        "    if not e:\n"
        "        return None\n"
        "    r = e[0][1]\n"
        "    for th, txt in e:\n"
        "        if kl >= th:\n"
        "            r = txt\n"
        "    return r\n"
        "\n"
        "\n"
        "def _get_sign_text(sid, kl):\n"
        "    e = SIGN_CORRUPT.get(sid)\n"
        "    if not e:\n"
        "        return None\n"
        "    r = None\n"
        "    for th, txt in e:\n"
        "        if kl >= th and txt is not None:\n"
        "            r = txt\n"
        "    return r\n"
        "\n"
        "\n"
        "def _mirror_text(st):\n"
        "    kl = sum(st.kills.values())\n"
        "    g = st.gold\n"
        "    rm = len(st.visited)\n"
        "    lines = [\n"
        '        f"Voce matou {kl} criaturas.",\n'
        '        "Nenhuma era um monstro." if kl > 0 else "Ainda.",\n'
        '        "",\n'
        '        f"Coletou {g} moedas.",\n'
        '        "Cada uma era uma alma." if g > 0 else "",\n'
        '        "",\n'
        '        f"Visitou {rm} salas.",\n'
        '        "Cada uma ficou mais vazia." if rm > 1 else "",\n'
        '        "",\n'
        '        "Espelho, espelho meu...",\n'
        "    ]\n"
        '    return "\\n".join(l for l in lines if l is not None)\n'
        "\n"
        "\n"
        "def _draw_ach_banner(sf, data, timer, fn):\n"
        "    if timer <= 0:\n"
        "        return\n"
        "    if timer > 200:\n"
        "        t = (240 - timer) / 40.0\n"
        "    elif timer < 40:\n"
        "        t = timer / 40.0\n"
        "    else:\n"
        "        t = 1.0\n"
        "    t = max(0.0, min(1.0, t))\n"
        "    bw, bh = 340, 50\n"
        "    bx = (SW - bw) // 2\n"
        "    by = int(-bh + (bh + 8) * t)\n"
        '    col = data.get("col", (200, 180, 100))\n'
        "    bg = pygame.Surface((bw, bh), pygame.SRCALPHA)\n"
        "    pygame.draw.rect(bg, (15, 12, 20, 220), (0, 0, bw, bh), border_radius=6)\n"
        "    pygame.draw.rect(bg, (*col, 180), (0, 0, bw, bh), 2, border_radius=6)\n"
        "    sf.blit(bg, (bx, by))\n"
        '    ts = fn["xs"].render("CONQUISTA DESBLOQUEADA", True, col)\n'
        "    sf.blit(ts, (bx + bw // 2 - ts.get_width() // 2, by + 6))\n"
        '    ns = fn["md"].render(data["name"], True, C_T)\n'
        "    sf.blit(ns, (bx + bw // 2 - ns.get_width() // 2, by + 24))\n"
        "\n\n"
    )
    code = code.replace(M1, B1 + M1, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P2 — Adicionar Crianca + Espelho na vila
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M2 = '            {"t": "itm", "id": "g1", "x": 5, "y": 3, "nm": "Saco de Ouro", "gold": 25},'
if M2 in code and '"child"' not in code:
    ins = (
        '            {"t": "npc", "id": "child", "x": 8, "y": 5, "nm": "Crianca", "dlg": "..."},\n'
        '            {"t": "npc", "id": "mirror", "x": 1, "y": 4, "nm": "Espelho", "dlg": "__MIRROR__"},\n'
    )
    code = code.replace(M2, ins + M2, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P3 — Confetti + achievements no __init__
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M3 = '        self.popups = []'
R3 = (
    '        self.popups = []\n'
    '        self.confetti = []\n'
    '        self.ach_queue = []\n'
    '        self.ach_shown = set()'
)
if M3 in code and 'self.confetti' not in code:
    code = code.replace(M3, R3, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P4 — Kill messages + confetti + achievements no _attack
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M4 = (
    '                    self.ents.remove(e)\n'
    '                    self._popup("VITORIA!", tx, ty)\n'
    '                    self.hitstop = 4\n'
    '                    if self.st.dmg == 0:\n'
    '                        self.st.acts.add("perfect")'
)
R4 = (
    '                    self.ents.remove(e)\n'
    '                    kl = sum(self.st.kills.values())\n'
    '                    msg = KILL_MSGS[min(kl, len(KILL_MSGS) - 1)]\n'
    '                    self._popup(msg, tx, ty)\n'
    '                    self.hitstop = 4\n'
    '                    self._spawn_confetti(tx * TILE + TILE // 2, ty * TILE + TILE // 2)\n'
    '                    self._check_ach(kl)\n'
    '                    if self.st.dmg == 0:\n'
    '                        self.st.acts.add("perfect")\n'
    '                        if "perfect" not in self.ach_shown:\n'
    '                            self._grant_ach("perfect")'
)
if M4 in code and '_spawn_confetti' not in code:
    code = code.replace(M4, R4, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P5 — NPC dialogo dinamico no _interact
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M5 = (
    '            if t == "npc":\n'
    '                self.st.talked.add(e["id"])\n'
    '                self._talk(e.get("dlg", "..."), e.get("nm", ""))\n'
    '                return'
)
R5 = (
    '            if t == "npc":\n'
    '                self.st.talked.add(e["id"])\n'
    '                nid = e["id"]\n'
    '                kl = sum(self.st.kills.values())\n'
    '                if nid == "mirror":\n'
    '                    self._talk(_mirror_text(self.st), "Espelho")\n'
    '                elif nid == "child":\n'
    '                    if kl >= 10:\n'
    '                        self._talk("...ela fugiu.\\nSo restou um brinquedo no chao.", "...")\n'
    '                        k2 = (self.st.room, e["id"])\n'
    '                        self.st.dead.add(k2)\n'
    '                        self.ents.remove(e)\n'
    '                    else:\n'
    '                        dlgs = NPC_CORRUPT.get("child")\n'
    '                        if dlgs:\n'
    '                            dlg = dlgs[0][1]\n'
    '                            for th, txt in dlgs:\n'
    '                                if kl >= th:\n'
    '                                    dlg = txt\n'
    '                            self._talk(dlg, "Crianca")\n'
    '                        else:\n'
    '                            self._talk(e.get("dlg", "..."), "Crianca")\n'
    '                else:\n'
    '                    dlg = _get_npc_dlg(nid, kl)\n'
    '                    if dlg is None:\n'
    '                        dlg = e.get("dlg", "...")\n'
    '                    self._talk(dlg, e.get("nm", ""))\n'
    '                return'
)
if M5 in code and '_get_npc_dlg' not in code:
    code = code.replace(M5, R5, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P6 — Sign texto dinamico no _interact
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M6 = (
    '            if t == "sign":\n'
    '                self.st.signs_r.add(e["id"])\n'
    '                self._talk(e.get("text", "..."), "Placa")\n'
    '                return'
)
R6 = (
    '            if t == "sign":\n'
    '                self.st.signs_r.add(e["id"])\n'
    '                kl = sum(self.st.kills.values())\n'
    '                txt = _get_sign_text(e["id"], kl)\n'
    '                if txt is None:\n'
    '                    txt = e.get("text", "...")\n'
    '                self._talk(txt, "Placa")\n'
    '                return'
)
if M6 in code and '_get_sign_text' not in code:
    code = code.replace(M6, R6, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P7 — Metodos auxiliares antes de _restart
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M7 = '    def _restart(self):'
R7 = (
    '    def _spawn_confetti(self, cx, cy):\n'
    '        cols = [(255,215,0),(255,180,50),(255,100,80),(200,60,60),(255,255,200)]\n'
    '        for _ in range(20):\n'
    '            self.confetti.append([\n'
    '                cx + random.randint(-10, 10),\n'
    '                cy + random.randint(-10, 10),\n'
    '                random.uniform(-3.5, 3.5),\n'
    '                random.uniform(-6, -1.5),\n'
    '                random.randint(35, 65),\n'
    '                random.choice(cols),\n'
    '                random.randint(2, 4),\n'
    '            ])\n'
    '\n'
    '    def _check_ach(self, kl):\n'
    '        if kl >= 1 and "first_kill" not in self.ach_shown:\n'
    '            self._grant_ach("first_kill")\n'
    '        if kl >= 5 and "purifier" not in self.ach_shown:\n'
    '            self._grant_ach("purifier")\n'
    '        if kl >= 10 and "legend" not in self.ach_shown:\n'
    '            self._grant_ach("legend")\n'
    '\n'
    '    def _grant_ach(self, key):\n'
    '        self.ach_shown.add(key)\n'
    '        d = ACH_DEFS.get(key)\n'
    '        if d:\n'
    '            self.ach_queue.append([d, 240])\n'
    '\n'
    '    def _restart(self):'
)
if M7 in code and '_spawn_confetti' not in code:
    code = code.replace(M7, R7, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P8 — Limpar confetti no _restart
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M8 = (
    '        self.popups = []\n'
    '        self._load_room(self.st.room)'
)
R8 = (
    '        self.popups = []\n'
    '        self.confetti = []\n'
    '        self.ach_queue = []\n'
    '        self._load_room(self.st.room)'
)
if M8 in code and 'self.confetti = []\n        self._load_room' not in code:
    code = code.replace(M8, R8, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P9a — Assinatura draw_player com kills
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M9a = 'def draw_player(sf, px, py, dr, sword, atk, cv):'
R9a = 'def draw_player(sf, px, py, dr, sword, atk, cv, kills=0):'
if M9a in code and 'kills=0' not in code:
    code = code.replace(M9a, R9a, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P9b — Sangue no sprite do jogador
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M9b = '        pygame.draw.rect(sf, (200, 200, 210), sr, border_radius=1)'
R9b = (
    '        pygame.draw.rect(sf, (200, 200, 210), sr, border_radius=1)\n'
    '    if kills > 0:\n'
    '        random.seed(kills * 7 + 42)\n'
    '        ba = min(kills * 18, 130)\n'
    '        bs = pygame.Surface((32, 24), pygame.SRCALPHA)\n'
    '        for _ in range(min(kills, 8)):\n'
    '            bx = random.randint(2, 30)\n'
    '            by = random.randint(2, 22)\n'
    '            br = random.randint(1, 3)\n'
    '            pygame.draw.circle(bs, (160, 20, 20, ba), (bx, by), br)\n'
    '        sf.blit(bs, (x, y + 6))\n'
    '        random.seed()'
)
if M9b in code and 'random.seed(kills' not in code:
    code = code.replace(M9b, R9b, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P10 — Chamada draw_player com kills
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M10 = (
    '                draw_player(self.scr, self.px + sx, self.py + sy,\n'
    '                            self.st.dr, self.st.sword, self.atk_t > 0, cv)'
)
R10 = (
    '                draw_player(self.scr, self.px + sx, self.py + sy,\n'
    '                            self.st.dr, self.st.sword, self.atk_t > 0, cv,\n'
    '                            sum(self.st.kills.values()))'
)
if M10 in code:
    code = code.replace(M10, R10, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P11 — Update confetti + achievements no _update
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M11 = '        # Check endings'
R11 = (
    '        # Confetti\n'
    '        for c in self.confetti:\n'
    '            c[0] += c[2]\n'
    '            c[1] += c[3]\n'
    '            c[3] += 0.15\n'
    '            c[4] -= 1\n'
    '        self.confetti = [c for c in self.confetti if c[4] > 0]\n'
    '        for a in self.ach_queue:\n'
    '            a[1] -= 1\n'
    '        self.ach_queue = [a for a in self.ach_queue if a[1] > 0]\n'
    '\n'
    '        # Check endings'
)
if M11 in code and 'c[3] += 0.15' not in code:
    code = code.replace(M11, R11, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P12 — Desenhar confetti + achievements no _draw
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M12 = '        # HUD'
R12 = (
    '        # Confetti\n'
    '        for c in self.confetti:\n'
    '            a = int(255 * c[4] / 65)\n'
    '            col_c = (*c[5][:3], min(a, 255))\n'
    '            cs = pygame.Surface((c[6] * 2, c[6] * 2), pygame.SRCALPHA)\n'
    '            pygame.draw.rect(cs, col_c, (0, 0, c[6] * 2, c[6] * 2))\n'
    '            self.scr.blit(cs, (OX + int(c[0]), int(c[1])))\n'
    '        # Achievements\n'
    '        for ad, at in self.ach_queue:\n'
    '            _draw_ach_banner(self.scr, ad, at, self.fn)\n'
    '\n'
    '        # HUD'
)
if M12 in code and '_draw_ach_banner(self.scr' not in code:
    code = code.replace(M12, R12, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# P13 — Achievement de morte no _dmg
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
M13 = (
    '            self.st.acts.add("died")\n'
    '            self.st.hp = self.st.mhp'
)
R13 = (
    '            self.st.acts.add("died")\n'
    '            self.st.hp = self.st.mhp\n'
    '            if "blood" not in self.ach_shown:\n'
    '                self._grant_ach("blood")'
)
if M13 in code and '"blood" not in self.ach_shown' not in code:
    code = code.replace(M13, R13, 1)
    n += 1

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RESULTADO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if code == orig:
    print("Nenhuma alteracao feita. Ja foi aplicado?")
else:
    with open(path, "w", encoding="utf-8") as f:
        f.write(code)
    checks = [
        "KILL_MSGS", "NPC_CORRUPT", "SIGN_CORRUPT",
        "_spawn_confetti", "_get_npc_dlg", "_get_sign_text",
        "_mirror_text", "_draw_ach_banner",
        "self.confetti", "self.ach_queue", "self.ach_shown",
        '"child"', '"mirror"', "kills=0",
    ]
    missing = [c for c in checks if c not in code]
    if missing:
        print(f"Patch aplicado ({n}) MAS faltou: {missing}")
    else:
        print(f"Patch aplicado! {n} alteracoes. Verificacao: OK")
    print("Rode: python main.py")
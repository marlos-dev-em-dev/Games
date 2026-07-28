"""
HEROI — A Vitoria e uma Derrota
Game Jam — Estilo Reventure, 20 finais
Execute: python heroi.py   (precisa de pygame-ce)
"""
import pygame
import sys
import random
import math

pygame.init()

# ═══════════════════════════════════════════════
# CONSTANTES
# ═══════════════════════════════════════════════
TILE = 48
NC, NR = 13, 9
GW, GH = NC * TILE, NR * TILE
SW, SH = 800, 600
HUD_H = SH - GH
OX = (SW - GW) // 2
DD = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}
BLOCK = {"npc", "throne", "altar", "secret"}
S_INT, S_PLAY, S_TALK, S_END, S_MEM = 0, 1, 2, 3, 4

# ═══════════════════════════════════════════════
# PALETA DE CORRUPÇÃO (6 niveis)
# ═══════════════════════════════════════════════
WCOL = [(58,48,38),(52,40,32),(46,32,24),(38,22,16),(28,12,8),(14,6,4)]
FCOL = [(38,33,28),(35,28,22),(32,22,16),(26,14,10),(16,8,4),(8,4,2)]
BCOL = [(14,12,20),(18,14,16),(26,14,12),(36,10,8),(22,5,4),(10,3,2)]
DKV  = [0, 55, 95, 135, 165, 190]
LRAD = [170, 150, 130, 105, 80, 55]
PCOL = [(180,170,140),(160,140,120),(140,100,80),(100,60,50),(60,40,35),(30,15,12)]

# UI
C_T = (230, 220, 200)
C_D = (110, 100, 85)
C_H = (220, 180, 80)
C_G = (255, 210, 60)
C_R = (190, 55, 55)
C_HB = (18, 15, 24)
C_BD = (65, 55, 45)
C_BK = (8, 6, 12)


def chi(c, v=15):
    return tuple(min(x + v, 255) for x in c)


def clo(c, v=10):
    return tuple(max(x - v, 0) for x in c)


def gclv(s):
    return min(sum(s.kills.values()) // 2, 5)


# ═══════════════════════════════════════════════
# GAME STATE
# ═══════════════════════════════════════════════
class State:
    def __init__(self):
        self.endings = set()
        self.reset()

    def reset(self):
        self.room = "village"
        self.tx, self.ty = 6, 4
        self.dr = 2
        self.hp, self.mhp = 6, 6
        self.sword = True
        self.gold = 0
        self.kills = {}
        self.talked = set()
        self.signs_r = set()
        self.visited = {"village"}
        self.items = set()
        self.dead = set()
        self.dmg = 0
        self.fled = 0
        self.tidle = 0
        self.acts = set()
        self.builds = 0
        self.rname = "Vila de Eldoria"
        self.throne = False
        self.potion = False
        self.altar = False
        self.npc_hit = False
        self.secret = False
        self.nosword = False
        self.void = False


# ═══════════════════════════════════════════════
# INTRO
# ═══════════════════════════════════════════════
INTRO_T = "HEROI"
INTRO_L = [
    "Todo mundo tem um heroi.",
    "Alguem que faz o que precisa ser feito.",
    "", "Voce e esse alguem.", "",
    "O dragao precisa morrer.",
    "O reino precisa de salvacao.",
    "", "Ninguem perguntou ao dragao.",
]


# ═══════════════════════════════════════════════
# 20 FINAIS
# ═══════════════════════════════════════════════
ENDINGS = [
    {"id": 1, "nm": "O Heroi", "how": "Mate o dragao",
     "title": "VITORIA DO HEROI", "col": (255, 215, 0),
     "txt": [
         "Voce derrotou o dragao.", "O reino esta salvo!", "",
         "Os sinos tocam. O povo danca.", "Seu nome sera lembrado.", "",
         "Mas ninguem percebeu", "que o ceu ficou mais escuro.", "",
         "O dragao era a ultima barreira", "contra a Praga das Sombras.", "",
         "O reino que voce salvou", "vai morrer devagar.",
         "E ninguem vai saber por que.",
     ],
     "ref": "Parabens, Heroi.",
     "chk": lambda s: s.kills.get("dragon", 0) > 0},

    {"id": 2, "nm": "O Rei", "how": "Sente no trono",
     "title": "O REI ETERNO", "col": (180, 150, 50),
     "txt": [
         "Voce sentou no trono.", "A coroa desceu sobre sua cabeca.", "",
         "O peso e eterno.", "",
         "As paredes se fecham.", "O tempo para.", "",
         "Voce reinara sobre cinzas", "para sempre.", "",
         "Todo rei e um prisioneiro.", "Agora voce tambem e.",
     ],
     "ref": "Longa vida ao Rei.",
     "chk": lambda s: s.throne},

    {"id": 3, "nm": "O Ganancioso", "how": "Colete 100+ ouro",
     "title": "OURO SUJO", "col": (255, 200, 50),
     "txt": [
         "Voce coletou cada moeda.", "Riqueza infinita.", "",
         "Mas quando contou...", "cada moeda pesava como uma alma.", "",
         "Porque era uma alma.", "Alguem viveu aqui.",
         "Alguem morreu aqui.", "Agora elas sao suas.", "",
         "E elas tem fome.",
     ],
     "ref": "Voce contou cada moeda. Esqueceu cada rosto.",
     "chk": lambda s: s.gold >= 100},

    {"id": 4, "nm": "O Purificador", "how": "Mate 10 inimigos",
     "title": "O PURIFICADOR", "col": (200, 60, 60),
     "txt": [
         "Voce eliminou todas as ameacas.", "O reino esta limpo.", "",
         "Dez monstros. Dez vitorias.", "",
         "Mas os monstros eram uma raca", "antiga e pacifica.", "",
         "Eles cantavam antes de dormir.", "Eles tinham filhos.", "",
         "Voce cometeu um genocidio.", "E o reino te aplaude.",
     ],
     "ref": "Dez e tudo que uma raca vale.",
     "chk": lambda s: sum(s.kills.values()) >= 10},

    {"id": 5, "nm": "O Pacifista", "how": "Nao faca nada por 3 min",
     "title": "O OBSERVADOR", "col": (100, 100, 120),
     "txt": [
         "Voce nao fez nada.", "",
         "A aldeia queimou sem voce.", "O rei morreu sem voce.",
         "O dragao fugiu sem voce.", "",
         "O mundo nao esperou.", "",
         "Mas voce estava seguro.", "Observando.",
     ],
     "ref": "A inacao tambem e uma escolha.",
     "chk": lambda s: s.tidle >= 10800},

    {"id": 6, "nm": "O Covarde", "how": "Fuja de 3 salas com monstros",
     "title": "A FUGA", "col": (80, 80, 140),
     "txt": [
         "Voce fugiu de todas as lutas.", "",
         "Mas os monstros nao te perseguiram.", "Eles te protegiam.", "",
         "Sem eles, a escuridao venceu.", "",
         "Voce assistiu", "do outro lado da porta.",
     ],
     "ref": "Covarde ou prudente? O mundo nao liga.",
     "chk": lambda s: s.fled >= 3},

    {"id": 7, "nm": "O Sabio", "how": "Leia todas as placas",
     "title": "CONHECIMENTO PROIBIDO", "col": (100, 180, 220),
     "txt": [
         "Voce leu todas as placas.", "Sabe a verdade.", "",
         "A verdade e simples:", "voce e o monstro.", "",
         "Sempre foi.", "",
         "Agora voce sabe.", "E nao pode des-saber.",
     ],
     "ref": "O conhecimento liberta. E depois?",
     "chk": lambda s: len(s.signs_r) >= 7},

    {"id": 8, "nm": "O Inocente", "how": "Beba a pocao",
     "title": "O REMEDIO", "col": (80, 200, 80),
     "txt": [
         "Voce bebeu a pocao.", "Energia te encheu.", "",
         "Mas a pocao era um parasita.", "",
         "Ele se espalha por tudo", "que voce toca.", "",
         "Cada passo e uma contaminacao.", "",
         "Voce e a cura e a doenca.",
     ],
     "ref": "O remedio e o veneno eram o mesmo frasco.",
     "chk": lambda s: s.potion},

    {"id": 9, "nm": "O Traidor", "how": "Ataque um NPC",
     "title": "A TRAICAO", "col": (180, 40, 40),
     "txt": [
         "Voce atacou alguem do seu lado.", "",
         "Ele caiu sem dizer nada.", "Os olhos nao se fecharam.", "",
         "Eles confiavam em voce.", "", "Confiam menos agora.",
     ],
     "ref": "Herois nao atacam aliados. Voce atacou.",
     "chk": lambda s: s.npc_hit},

    {"id": 10, "nm": "O Corajoso", "how": "Entre na caverna sem espada",
     "title": "O INCAUTO", "col": (220, 180, 100),
     "txt": [
         "Voce entrou na caverna sem espada.", "Sem defesa. Sem preparo.", "",
         "E encontrou a saida.", "",
         "Uma porta que nao existia antes.",
         "Do outro lado: o menu inicial.", "", "O jogo acabou.",
     ],
     "ref": "Voce venceu?",
     "chk": lambda s: s.nosword},

    {"id": 11, "nm": "O Libertado", "how": "Jogue fora a espada (Q)",
     "title": "A LIBERTACAO", "col": (100, 220, 130),
     "txt": [
         "Voce largou a espada.", "", "Sem arma. Sem violencia.", "",
         "O mundo respirou.", "As arvores voltaram.",
         "Os animais voltaram.", "A musica tocou de novo.", "",
         "FALHA NA MISSAO.",
     ],
     "ref": "O unico final feliz e considerado falha.",
     "chk": lambda s: not s.sword},

    {"id": 12, "nm": "O Perdido", "how": "Interaja com o abismo",
     "title": "ALEM DOS MUROS", "col": (60, 60, 80),
     "txt": [
         "Voce olhou para o abismo.", "",
         "E o abismo respondeu:", "", "'Nao existe la fora.'", "",
         "Voce e real?", "O mundo e real?", "", "O vazio nao mente.",
     ],
     "ref": "Voce olhou para o vazio. Era um espelho.",
     "chk": lambda s: s.void},

    {"id": 13, "nm": "O Curioso", "how": "Encontre a sala secreta",
     "title": "OS BASTIDORES", "col": (150, 255, 150),
     "txt": [
         "Voce encontrou a sala secreta.", "",
         "Dentro: o codigo fonte do jogo.", "",
         "Tudo e numeros. Strings. Lambdas.", "Voce e uma variavel.", "",
         "Sua vida e um inteiro.", "Suas escolhas sao funcoes.",
     ],
     "ref": "Isso muda alguma coisa?",
     "chk": lambda s: s.secret},

    {"id": 14, "nm": "O Destruidor", "how": "Interaja com 4 construcoes",
     "title": "O TERREMOTO", "col": (160, 120, 80),
     "txt": [
         "Voce examinou cada pedra.", "Cutucou cada estrutura.", "",
         "Quatro toques. Quatro tremores.", "",
         "E o mundo desabou.", "",
         "O mundo nao suporta curiosidade.",
     ],
     "ref": "Tudo que voce tocou, quebrou.",
     "chk": lambda s: s.builds >= 4},

    {"id": 15, "nm": "O Amigo", "how": "Converse com todos os NPCs",
     "title": "A ILUSAO", "col": (180, 160, 200),
     "txt": [
         "Voce conversou com todos.",
         "Cada um te contou uma historia.", "",
         "Mas quando olhou para tras...", "ninguem estava la.", "",
         "Eles nunca existiram.", "", "So existiam para te ouvir.",
     ],
     "ref": "Solidao e conversar com fantasmas.",
     "chk": lambda s: len(s.talked) >= 7},

    {"id": 16, "nm": "O Imortal", "how": "Morra e renasca",
     "title": "A RESSURREICAO", "col": (200, 30, 30),
     "txt": [
         "Voce morreu.", "", "E voltou.", "",
         "Mas seus olhos sao vermelhos.", "Suas maos tremem de raiva.", "",
         "A morte nao te libertou.", "Te transformou.", "",
         "Agora voce e o monstro.",
     ],
     "ref": "A morte nao te libertou. Te fez igual.",
     "chk": lambda s: "died" in s.acts},

    {"id": 17, "nm": "O Perfeito", "how": "Venca luta sem tomar dano",
     "title": "A SIMULACAO", "col": (200, 200, 220),
     "txt": [
         "Voce lutou perfeitamente.", "Sem um arranhao.", "",
         "Porque era tudo encenado.", "Os inimigos seguiam um roteiro.",
         "Suas escolhas eram previstas.", "",
         "Parabens.", "Voce seguiu o script certinho.",
     ],
     "ref": "Perfeito demais. Isso e suspeito.",
     "chk": lambda s: "perfect" in s.acts},

    {"id": 18, "nm": "O Esquecido", "how": "Fique parado na vila",
     "title": "O SUBSTITUTO", "col": (120, 120, 100),
     "txt": [
         "Voce ficou parado.", "",
         "O mundo nao esperou.", "Outro heroi apareceu.",
         "Mais rapido. Mais forte.", "",
         "Ele completou sua missao.", "",
         "Ninguem lembra do seu nome.",
     ],
     "ref": "O mundo nao precisa de voce. Precisa de um heroi.",
     "chk": lambda s: (s.tidle >= 3600 and s.room == "village"
                       and len(s.visited) <= 1)},

    {"id": 19, "nm": "O Herege", "how": "Destrua o altar do templo",
     "title": "O DESTERRO", "col": (100, 20, 60),
     "txt": [
         "Voce destruiu o altar sagrado.",
         "O chao tremeu.", "O ceu escureceu.", "",
         "O que estava preso sob o altar", "agora esta livre.", "",
         "E ele lembra de voce.",
     ],
     "ref": "Voce nao libertou o mal. Lembrou ele.",
     "chk": lambda s: s.altar},

    {"id": 20, "nm": "O Verdadeiro", "how": "Colete as 5 reliquias",
     "title": "O ACUMULO", "col": (255, 255, 200),
     "txt": [
         "Voce coletou todas as reliquias.",
         "O poder supremo e seu!", "",
         "Mas as reliquias sao fragmentos",
         "de algo que nao deveria ser reunido.", "",
         "Juntas, elas se completam.",
         "E se destroem.", "E levam tudo junto.", "",
         "Voce fez de tudo.", "E tudo foi em vao.",
     ],
     "ref": "Completar um jogo nao e vencer.",
     "chk": lambda s: sum(1 for r, i in s.items if "relic" in i) >= 5},
]


def chk_end(st):
    for e in ENDINGS:
        try:
            if e["chk"](st):
                return e["id"]
        except Exception:
            pass
    return None


def get_end(eid):
    for e in ENDINGS:
        if e["id"] == eid:
            return e
    return None


# ═══════════════════════════════════════════════
# SALAS  (grade 3x3, mapa 13x9)
# ═══════════════════════════════════════════════
ROOMS = {
    "cave": {
        "name": "Caverna Escura", "map": [
            "#############", "#...........#", "#..##...##..#",
            "#...........#", "#............", "#...........#",
            "#..##...##..#", "#...........#", "######.######"],
        "east": ("forest", 1, 4), "south": ("crypt", 6, 1),
        "ent": [
            {"t": "mob", "id": "bat1", "x": 5, "y": 3, "hp": 2, "d": 1, "nm": "Morcego"},
            {"t": "mob", "id": "bat2", "x": 8, "y": 6, "hp": 2, "d": 1, "nm": "Morcego"},
            {"t": "itm", "id": "g3", "x": 3, "y": 5, "nm": "Moedas Antigas", "gold": 25},
            {"t": "itm", "id": "r3", "x": 10, "y": 2, "nm": "Reliquia das Sombras", "relic": True},
            {"t": "sign", "id": "s5", "x": 2, "y": 1,
             "text": "Os morcegos eram guardioes.\nNao eram seus inimigos."},
            {"t": "bld", "id": "stal", "x": 9, "y": 4, "nm": "Estalactite"},
        ]},
    "forest": {
        "name": "Floresta Sombria", "map": [
            "#############", "#...........#", "#..#.....#..#",
            "#...........#", ".............", "#...........#",
            "#..#.....#..#", "#...........#", "######.######"],
        "west": ("cave", 11, 4), "east": ("peak", 1, 4),
        "south": ("village", 6, 1),
        "ent": [
            {"t": "mob", "id": "slime", "x": 4, "y": 3, "hp": 2, "d": 1, "nm": "Slime"},
            {"t": "mob", "id": "wolf", "x": 8, "y": 5, "hp": 3, "d": 1, "nm": "Lobo"},
            {"t": "itm", "id": "pot", "x": 2, "y": 6, "nm": "Pocao Misteriosa", "pot": True},
            {"t": "itm", "id": "g2", "x": 9, "y": 1, "nm": "Moedas", "gold": 25},
            {"t": "sign", "id": "s2", "x": 6, "y": 1,
             "text": "As arvores sussurram:\n'Volte enquanto pode.'"},
            {"t": "itm", "id": "r2", "x": 3, "y": 7, "nm": "Reliquia da Floresta", "relic": True},
            {"t": "bld", "id": "tree", "x": 10, "y": 3, "nm": "Casa na Arvore"},
        ]},
    "peak": {
        "name": "Pico do Dragao", "map": [
            "#############", "#...........#", "#...........#",
            "#...........#", "............#", "#...........#",
            "#...........#", "#...........#", "######.######"],
        "west": ("forest", 11, 4), "south": ("castle", 6, 1),
        "ent": [
            {"t": "mob", "id": "dragon", "x": 6, "y": 2, "hp": 8, "d": 2, "nm": "DRAGAO"},
            {"t": "itm", "id": "gd", "x": 4, "y": 5, "nm": "Tesouro do Dragao", "gold": 50},
            {"t": "itm", "id": "r4", "x": 9, "y": 6, "nm": "Reliquia do Fogo", "relic": True},
            {"t": "sign", "id": "s6", "x": 2, "y": 7,
             "text": "O dragao protegia o reino\nha mil anos.\nEle nao e seu inimigo."},
        ]},
    "crypt": {
        "name": "Cripta Antiga", "map": [
            "######.######", "#...........#", "#..#.....#..#",
            "#...........#", "#............", "#...........#",
            "#..#.....#..#", "#...........#", "######.######"],
        "north": ("cave", 6, 7), "east": ("village", 1, 4),
        "south": ("temple", 6, 1),
        "ent": [
            {"t": "mob", "id": "skel", "x": 5, "y": 4, "hp": 3, "d": 1, "nm": "Esqueleto"},
            {"t": "itm", "id": "g4", "x": 3, "y": 2, "nm": "Ouro dos Mortos", "gold": 25},
            {"t": "sign", "id": "s4", "x": 8, "y": 6,
             "text": "Aqui jaz o ultimo rei\nque acreditou em herois."},
            {"t": "bld", "id": "tomb", "x": 9, "y": 2, "nm": "Tumba Real"},
        ]},
    "village": {
        "name": "Vila de Eldoria", "map": [
            "######.######", "#...........#", "#...........#",
            "#...........#", ".............", "#...........#",
            "#...........#", "#...........#", "######.######"],
        "north": ("forest", 6, 7), "south": ("fields", 6, 1),
        "west": ("crypt", 11, 4), "east": ("castle", 1, 4),
        "ent": [
            {"t": "npc", "id": "elder", "x": 3, "y": 2, "nm": "Anciao",
             "dlg": "Heroi! O dragao ameaca o reino!\nVa ao norte e derrote-o!\nO mundo precisa de voce!"},
            {"t": "npc", "id": "merc", "x": 9, "y": 2, "nm": "Mercador",
             "dlg": "Bem-vindo, viajante.\nO mundo e maior do que parece.\n...ou menor."},
            {"t": "npc", "id": "guard", "x": 6, "y": 6, "nm": "Guarda",
             "dlg": "O castelo fica ao leste.\nO rei aguarda sua presenca.\nNao o decepcione."},
            {"t": "itm", "id": "g1", "x": 5, "y": 3, "nm": "Saco de Ouro", "gold": 25},
            {"t": "sign", "id": "s1", "x": 2, "y": 7,
             "text": "WASD:mover E:interagir\nESPACO:atacar Q:largar espada\nTAB:memorias"},
            {"t": "itm", "id": "r1", "x": 10, "y": 7, "nm": "Reliquia Antiga", "relic": True},
            {"t": "bld", "id": "well", "x": 7, "y": 4, "nm": "Poco"},
        ]},
    "castle": {
        "name": "Castelo do Rei", "map": [
            "######.######", "#...........#", "#...........#",
            "#...........#", "............#", "#...........#",
            "#...........#", "#...........#", "######.######"],
        "north": ("peak", 6, 7), "west": ("village", 11, 4),
        "south": ("ruins", 6, 1),
        "ent": [
            {"t": "npc", "id": "king", "x": 6, "y": 2, "nm": "Rei",
             "dlg": "Bem-vindo, heroi.\nDerrote o dragao e seu\nnome sera eternizado."},
            {"t": "mob", "id": "gl", "x": 4, "y": 5, "hp": 4, "d": 1, "nm": "Guarda Real"},
            {"t": "mob", "id": "gr", "x": 8, "y": 5, "hp": 4, "d": 1, "nm": "Guarda Real"},
            {"t": "throne", "id": "throne", "x": 6, "y": 1, "nm": "Trono"},
            {"t": "itm", "id": "g5", "x": 2, "y": 3, "nm": "Tesouro Real", "gold": 25},
            {"t": "sign", "id": "s3", "x": 10, "y": 7,
             "text": "Os guardas protegem o rei.\nNao sao seus inimigos.\nA menos que voce ataque."},
            {"t": "bld", "id": "pillar", "x": 2, "y": 1, "nm": "Coluna do Trono"},
        ]},
    "temple": {
        "name": "Templo Sagrado", "map": [
            "######.######", "#...........#", "#...........#",
            "#...........#", "#............", "#...........#",
            "#...........#", "#...........#", "#############"],
        "north": ("crypt", 6, 7), "east": ("fields", 1, 4),
        "ent": [
            {"t": "npc", "id": "priest", "x": 4, "y": 3, "nm": "Sacerdote",
             "dlg": "O altar contem um poder\nantigo. Nao o perturbe.\nOu perturbe. Escolha sua."},
            {"t": "altar", "id": "altar", "x": 6, "y": 2, "nm": "Altar Sagrado"},
            {"t": "itm", "id": "holy", "x": 8, "y": 4, "nm": "Agua Benta", "heal": 3},
            {"t": "itm", "id": "r5", "x": 2, "y": 7, "nm": "Reliquia Divina", "relic": True},
            {"t": "bld", "id": "font", "x": 9, "y": 7, "nm": "Pia Batismal"},
        ]},
    "fields": {
        "name": "Campos de Eldoria", "map": [
            "######.######", "#...........#", "#...........#",
            "#...........#", ".............", "#...........#",
            "#...........#", "#...........#", "#############"],
        "north": ("village", 6, 7), "west": ("temple", 11, 4),
        "east": ("ruins", 1, 4),
        "ent": [
            {"t": "npc", "id": "farmer", "x": 4, "y": 4, "nm": "Fazendeiro",
             "dlg": "Os campos ja foram verdes.\nAntes dos herois aparecerem.\nAgora so resta cinza."},
            {"t": "itm", "id": "g6", "x": 8, "y": 6, "nm": "Moedas de Colheita", "gold": 25},
            {"t": "sign", "id": "s7", "x": 2, "y": 2,
             "text": "Aqui cresciam flores.\nAntes do primeiro heroi\nchegar com sua espada."},
        ]},
    "ruins": {
        "name": "Ruinas Esquecidas", "map": [
            "######.######", "#...........#", "#...........#",
            "#...........#", "............#", "#...........#",
            "#...........#", "#...........#", "#############"],
        "north": ("castle", 6, 7), "west": ("fields", 11, 4),
        "ent": [
            {"t": "mob", "id": "ghost", "x": 7, "y": 3, "hp": 3, "d": 1, "nm": "Fantasma"},
            {"t": "void", "id": "abyss", "x": 12, "y": 4, "nm": "Abismo"},
            {"t": "secret", "id": "secret", "x": 6, "y": 0, "nm": "Parede Suspeita"},
            {"t": "bld", "id": "statue", "x": 3, "y": 6, "nm": "Estatua Quebrada"},
        ]},
}


# ═══════════════════════════════════════════════
# FONTES + EFEITOS PRE-RENDERIZADOS
# ═══════════════════════════════════════════════
def load_fonts():
    ser = None
    for n in ["georgia", "palatinolinotype", "timesnewroman", "garamond"]:
        try:
            f = pygame.font.SysFont(n, 20)
            if f.size("T")[0] > 2:
                ser = n
                break
        except Exception:
            pass

    def mk(sz):
        return pygame.font.SysFont(ser, sz) if ser else pygame.font.Font(None, sz)

    return {"xs": mk(16), "sm": mk(20), "md": mk(26),
            "lg": mk(36), "xl": mk(52), "xxl": mk(80)}


def mk_vignette():
    s = pygame.Surface((GW, GH), pygame.SRCALPHA)
    for i in range(25):
        t = i / 24
        sc = 1.2 - 0.7 * t
        a = int(180 * (1 - t) ** 2.2)
        sx, sy = int(GW * sc), int(GH * sc)
        r = pygame.Rect((GW - sx) // 2, (GH - sy) // 2,
                        max(sx, 1), max(sy, 1))
        pygame.draw.ellipse(s, (0, 0, 0, a), r)
    return s


def mk_grain():
    s = pygame.Surface((GW, GH), pygame.SRCALPHA)
    for _ in range(GW * GH // 18):
        x = random.randint(0, GW - 1)
        y = random.randint(0, GH - 1)
        v = random.randint(12, 35)
        s.set_at((x, y), (v, v, v, 10))
    return s


# ═══════════════════════════════════════════════
# DESENHO — TILES
# ═══════════════════════════════════════════════
def draw_tiles(sf, tmap, cv):
    wc, fc = WCOL[cv], FCOL[cv]
    for ri, row in enumerate(tmap):
        for ci, ch in enumerate(row):
            px, py = OX + ci * TILE, ri * TILE
            r = pygame.Rect(px, py, TILE, TILE)
            if ch == "#":
                pygame.draw.rect(sf, wc, r)
                h = chi(wc, 8)
                for ly in (TILE // 3, 2 * TILE // 3):
                    pygame.draw.line(sf, h, (px, py + ly), (px + TILE, py + ly))
                jx = px + (TILE // 2 if ri % 2 == 0 else TILE // 4)
                pygame.draw.line(sf, clo(wc, 5), (jx, py), (jx, py + TILE // 3))
            else:
                pygame.draw.rect(sf, fc, r)
                if (ci + ri) % 4 == 0:
                    pygame.draw.rect(sf, chi(fc, 4), r, 1)


# ═══════════════════════════════════════════════
# DESENHO — JOGADOR
# ═══════════════════════════════════════════════
def draw_player(sf, px, py, dr, sword, atk, cv):
    x, y = OX + px + 8, py + 6
    bc = list(C_T[:3])
    for i in range(3):
        bc[i] = max(bc[i] - cv * 15, 80)
    bc = tuple(bc)
    pygame.draw.ellipse(sf, (5, 3, 3), (x - 2, y + 27, 36, 8))
    pygame.draw.rect(sf, bc, (x, y + 8, 32, 20), border_radius=4)
    hd = chi(bc, 25)
    pygame.draw.circle(sf, hd, (x + 16, y + 6), 10)
    ed = {0: [(12, 3), (20, 3)], 1: [(19, 5), (24, 5)],
          2: [(12, 7), (20, 7)], 3: [(8, 5), (13, 5)]}
    for ox, oy in ed.get(dr, ed[2]):
        pygame.draw.circle(sf, C_BK, (x + ox, y + oy), 2)
    if sword:
        sd = {0: (x + 28, y - 12, 4, 24), 1: (x + 30, y + 10, 24, 4),
              2: (x + 28, y + 20, 4, 24), 3: (x - 6, y + 10, 24, 4)}
        sr = pygame.Rect(sd.get(dr, sd[2]))
        if atk:
            sr = sr.inflate(8, 8)
        pygame.draw.rect(sf, (200, 200, 210), sr, border_radius=1)


# ═══════════════════════════════════════════════
# DESENHO — ENTIDADES
# ═══════════════════════════════════════════════
_NPC_C = {"elder": (140, 120, 90), "merc": (100, 140, 100),
          "guard": (80, 80, 140), "king": (180, 150, 50),
          "farmer": (120, 100, 70), "priest": (160, 140, 180)}


def draw_ent(sf, e, tick):
    x = OX + e["x"] * TILE + 8
    y = e["y"] * TILE + 6
    bob = math.sin(tick * 0.004 + e["x"] * 2.3 + e["y"] * 1.7) * 2
    yb = y + int(bob)
    t = e["t"]

    if t == "npc":
        c = _NPC_C.get(e["id"], (140, 130, 110))
        pygame.draw.ellipse(sf, (5, 3, 3), (x + 2, y + 28, 28, 6))
        pygame.draw.rect(sf, c, (x + 6, yb + 12, 20, 16), border_radius=3)
        pygame.draw.circle(sf, chi(c, 25), (x + 16, yb + 8), 8)
        pygame.draw.circle(sf, (20, 15, 10), (x + 13, yb + 7), 2)
        pygame.draw.circle(sf, (20, 15, 10), (x + 19, yb + 7), 2)
        f = pygame.font.Font(None, 18)
        nm = f.render(e.get("nm", ""), True, C_D)
        sf.blit(nm, (x + 16 - nm.get_width() // 2, y - 8))

    elif t == "mob":
        mid = e["id"]
        hp = e.get("hp", 0)
        mhp = e.get("max_hp", hp)

        if "slime" in mid:
            c = (60, 180, 60)
            pygame.draw.ellipse(sf, c, (x, yb + 14, 32, 16))
            pygame.draw.ellipse(sf, chi(c, 40), (x + 3, yb + 12, 26, 12))
            for ex in (10, 22):
                pygame.draw.circle(sf, (255, 255, 255), (x + ex, yb + 18), 4)
                pygame.draw.circle(sf, C_BK, (x + ex + 1, yb + 19), 2)
        elif "wolf" in mid:
            c = (120, 100, 80)
            pygame.draw.ellipse(sf, c, (x, yb + 14, 30, 16))
            pygame.draw.circle(sf, c, (x + 24, yb + 12), 8)
            pygame.draw.circle(sf, (255, 200, 100), (x + 27, yb + 10), 2)
        elif "bat" in mid:
            c = (80, 50, 80)
            pygame.draw.circle(sf, c, (x + 16, yb + 16), 6)
            pygame.draw.polygon(sf, c, [(x+10,yb+16),(x,yb+8),(x+6,yb+22)])
            pygame.draw.polygon(sf, c, [(x+22,yb+16),(x+32,yb+8),(x+26,yb+22)])
            for ex in (14, 18):
                pygame.draw.circle(sf, (200, 50, 50), (x + ex, yb + 14), 2)
        elif "skel" in mid:
            c = (200, 195, 180)
            pygame.draw.rect(sf, c, (x + 12, yb + 10, 8, 18))
            pygame.draw.circle(sf, c, (x + 16, yb + 8), 7)
            for ex in (13, 19):
                pygame.draw.circle(sf, C_BK, (x + ex, yb + 7), 3)
        elif "dragon" in mid:
            c = (200, 50, 30)
            pygame.draw.ellipse(sf, c, (x - 4, yb + 6, 40, 26))
            pygame.draw.ellipse(sf, chi(c, 30), (x, yb + 4, 32, 22))
            pygame.draw.circle(sf, c, (x + 30, yb + 8), 10)
            pygame.draw.circle(sf, (255, 200, 50), (x + 33, yb + 6), 3)
            pygame.draw.circle(sf, C_BK, (x + 33, yb + 6), 1)
            pygame.draw.polygon(sf, (150, 40, 20),
                                [(x+24, yb), (x+26, yb+8), (x+22, yb+4)])
            pygame.draw.polygon(sf, (150, 40, 20),
                                [(x+34, yb), (x+32, yb+8), (x+36, yb+4)])
        elif "ghost" in mid:
            gs = pygame.Surface((32, 32), pygame.SRCALPHA)
            pygame.draw.ellipse(gs, (180, 180, 220, 100), (4, 2, 24, 22))
            for i in range(4):
                pygame.draw.circle(gs, (180, 180, 220, 100), (4 + i * 7, 26), 4)
            sf.blit(gs, (x, yb))
            for ex in (12, 20):
                pygame.draw.circle(sf, C_BK, (x + ex, yb + 12), 3)
        elif "gl" in mid or "gr" in mid:
            c = (60, 60, 120)
            pygame.draw.rect(sf, c, (x + 4, yb + 6, 24, 22), border_radius=3)
            pygame.draw.circle(sf, chi(c, 30), (x + 16, yb + 6), 8)
            for ex in (13, 19):
                pygame.draw.circle(sf, C_BK, (x + ex, yb + 5), 2)
            pygame.draw.arc(sf, (180, 180, 190),
                            (x + 4, yb - 2, 24, 12), 0, 3.14, 2)
        else:
            pygame.draw.rect(sf, (150, 60, 60), (x + 4, yb + 6, 24, 22))
            for ex in (13, 19):
                pygame.draw.circle(sf, C_BK, (x + ex, yb + 12), 2)

        # HP bar
        if hp < mhp and mhp > 0:
            bw = 28
            pygame.draw.rect(sf, (40, 15, 15), (x + 2, y - 4, bw, 4))
            pygame.draw.rect(sf, C_R, (x + 2, y - 4, int(bw * hp / mhp), 4))

    elif t == "itm":
        iid = e["id"]
        if "gold" in iid or iid.startswith("g"):
            pygame.draw.circle(sf, C_G, (x + 16, yb + 20), 8)
            pygame.draw.circle(sf, (255, 240, 100), (x + 13, yb + 18), 6)
            pygame.draw.circle(sf, C_G, (x + 21, yb + 18), 7)
        elif "pot" in iid:
            pygame.draw.rect(sf, (80, 200, 80), (x+12, yb+12, 8, 16), border_radius=2)
            pygame.draw.rect(sf, (140, 120, 90), (x+10, yb+10, 12, 4))
        elif "relic" in iid or iid.startswith("r"):
            c = (200, 180, 255)
            pygame.draw.polygon(sf, c,
                                [(x+16,yb+6),(x+26,yb+16),(x+16,yb+26),(x+6,yb+16)])
            pygame.draw.polygon(sf, chi(c, 40),
                                [(x+16,yb+9),(x+23,yb+16),(x+16,yb+23),(x+9,yb+16)])
        elif "holy" in iid:
            pygame.draw.rect(sf, (100, 150, 255), (x+12, yb+12, 8, 16), border_radius=2)
            pygame.draw.rect(sf, (180, 160, 120), (x+10, yb+10, 12, 4))
        else:
            pygame.draw.circle(sf, C_G, (x + 16, yb + 16), 8)

    elif t == "sign":
        pygame.draw.rect(sf, (140, 120, 80), (x + 14, yb + 14, 4, 16))
        pygame.draw.rect(sf, (160, 140, 90), (x + 6, yb + 6, 20, 12))

    elif t == "throne":
        pygame.draw.rect(sf, (180, 150, 50), (x + 4, yb + 6, 24, 24))
        pygame.draw.rect(sf, (200, 170, 60), (x + 2, yb + 2, 28, 8))
        pygame.draw.circle(sf, C_G, (x + 16, yb + 4), 4)

    elif t == "altar":
        pygame.draw.rect(sf, (160, 140, 100), (x + 4, yb + 18, 24, 12))
        pygame.draw.rect(sf, (180, 160, 120), (x + 8, yb + 12, 16, 8))
        gs = pygame.Surface((32, 32), pygame.SRCALPHA)
        pygame.draw.circle(gs, (200, 180, 100, 30), (16, 16), 16)
        sf.blit(gs, (x, yb))

    elif t == "void":
        pygame.draw.rect(sf, (5, 2, 5), (x, yb, 32, 32))

    elif t == "secret":
        pygame.draw.rect(sf, (58, 48, 38), (x, yb, 32, 32))
        pygame.draw.rect(sf, (68, 58, 48), (x + 2, yb + 2, 28, 28), 1)

    elif t == "bld":
        c = (120, 100, 80)
        pygame.draw.rect(sf, c, (x + 4, yb + 8, 24, 22))
        pygame.draw.rect(sf, chi(c, 20), (x + 8, yb + 4, 16, 6))


# ═══════════════════════════════════════════════
# DESENHO — HUD
# ═══════════════════════════════════════════════
def draw_hud(sf, st, fn):
    hy = GH
    pygame.draw.rect(sf, C_HB, (0, hy, SW, HUD_H))
    pygame.draw.line(sf, C_BD, (0, hy), (SW, hy), 2)

    sf.blit(fn["md"].render("VIDA:", True, C_D), (20, hy + 12))
    for i in range(st.mhp):
        hx = 100 + i * 24
        c = C_R if i < st.hp else (45, 18, 18)
        pygame.draw.rect(sf, c, (hx, hy + 12, 20, 20), border_radius=3)

    sf.blit(fn["md"].render(f"OURO: {st.gold}", True, C_G), (20, hy + 44))
    kl = sum(st.kills.values())
    sf.blit(fn["md"].render(f"VITORIAS: {kl}", True, C_H), (260, hy + 12))
    sf.blit(fn["md"].render(f"ITENS: {len(st.items)}", True, C_T), (260, hy + 44))
    sf.blit(fn["xs"].render(f"Salas: {len(st.visited)}/9", True, C_D), (500, hy + 12))
    sf.blit(fn["xs"].render(f"Memorias: {len(st.endings)}/20", True, C_H),
            (500, hy + 44))
    nm = fn["lg"].render(st.rname, True, C_T)
    sf.blit(nm, (SW - nm.get_width() - 20, hy + 18))
    sf.blit(fn["xs"].render(
        "WASD:Mover  E:Interagir  ESPACO:Atacar  Q:Largar  TAB:Memorias",
        True, C_D), (20, hy + HUD_H - 22))

    # minimapa
    mx, my, cs = SW - 130, hy + 80, 12
    lay = [["cave", "forest", "peak"],
           ["crypt", "village", "castle"],
           ["temple", "fields", "ruins"]]
    for gy, row in enumerate(lay):
        for gx, rid in enumerate(row):
            rx, ry = mx + gx * (cs + 4), my + gy * (cs + 4)
            if rid == st.room:
                pygame.draw.rect(sf, C_H, (rx, ry, cs, cs))
            elif rid in st.visited:
                pygame.draw.rect(sf, (65, 58, 50), (rx, ry, cs, cs))
            else:
                pygame.draw.rect(sf, (28, 24, 32), (rx, ry, cs, cs), 1)


# ═══════════════════════════════════════════════
# DESENHO — DIÁLOGO
# ═══════════════════════════════════════════════
def draw_dialog(sf, text, name, fn):
    bh = 90
    by = GH - bh - 8
    br = pygame.Rect(OX + 8, by, GW - 16, bh)
    pygame.draw.rect(sf, C_HB, br, border_radius=6)
    pygame.draw.rect(sf, C_BD, br, 2, border_radius=6)
    if name:
        ns = fn["md"].render(f"[ {name} ]", True, C_H)
        sf.blit(ns, (br.x + 12, br.y + 8))
    for i, line in enumerate(text.split("\n")):
        sf.blit(fn["sm"].render(line, True, C_T), (br.x + 12, br.y + 30 + i * 16))
    sf.blit(fn["sm"].render("[E] fechar", True, C_D),
            (br.right - 80, br.bottom - 18))


# ═══════════════════════════════════════════════
# DESENHO — INTRO
# ═══════════════════════════════════════════════
def draw_intro(sf, vis, done, fn):
    sf.fill((8, 6, 14))
    ts = fn["xxl"].render(INTRO_T, True, (230, 200, 100))
    sf.blit(ts, ((SW - ts.get_width()) // 2, 80))
    pygame.draw.line(sf, (70, 60, 45), (SW // 2 - 60, 175), (SW // 2 + 60, 175))
    by, lh = 200, 30
    dn = 0
    for i in range(vis):
        if i >= len(INTRO_L):
            break
        if INTRO_L[i] == "":
            dn += 1
            continue
        c = (200, 180, 140) if i == len(INTRO_L) - 1 else C_T
        ls = fn["md"].render(INTRO_L[i], True, c)
        sf.blit(ls, ((SW - ls.get_width()) // 2, by + dn * lh))
        dn += 1
    if done:
        if pygame.time.get_ticks() % 1200 < 800:
            hs = fn["md"].render("Pressione ENTER", True, (100, 95, 85))
            sf.blit(hs, ((SW - hs.get_width()) // 2, SH - 60))


# ═══════════════════════════════════════════════
# DESENHO — TELA DE FINAL
# ═══════════════════════════════════════════════
def draw_ending(sf, end, vis, show_ref, show_ctrl, fn):
    sf.fill((6, 4, 10))
    col = end.get("col", C_T)
    ts = fn["xl"].render(end["title"], True, col)
    sf.blit(ts, ((SW - ts.get_width()) // 2, 40))
    ns = fn["lg"].render(f"Final #{end['id']}: {end['nm']}", True, C_T)
    sf.blit(ns, ((SW - ns.get_width()) // 2, 100))
    pygame.draw.line(sf, col, (SW // 2 - 80, 140), (SW // 2 + 80, 140))
    lines = end.get("txt", [])
    by, lh = 160, 24
    dn = 0
    for i in range(min(vis, len(lines))):
        if lines[i] == "":
            dn += 1
            continue
        ls = fn["md"].render(lines[i], True, C_T)
        sf.blit(ls, ((SW - ls.get_width()) // 2, by + dn * lh))
        dn += 1
    if show_ref:
        ref = end.get("ref", "")
        if ref:
            rc = tuple(max(v - 60, 40) for v in col)
            rs = fn["lg"].render(ref, True, rc)
            sf.blit(rs, ((SW - rs.get_width()) // 2, by + dn * lh + 30))
    if show_ctrl:
        hs = fn["md"].render("[R] recomecar  |  [G] memorias", True, C_D)
        sf.blit(hs, ((SW - hs.get_width()) // 2, SH - 50))


# ═══════════════════════════════════════════════
# DESENHO — GALERIA (MEMORIAS)
# ═══════════════════════════════════════════════
def draw_gallery(sf, unlocked, fn, sel=0):
    sf.fill((8, 6, 12))
    ts = fn["lg"].render("MEMORIAS", True, (200, 190, 170))
    sf.blit(ts, ((SW - ts.get_width()) // 2, 15))
    ct = fn["sm"].render(f"{len(unlocked)}/20 resgatados", True, (100, 95, 85))
    sf.blit(ct, ((SW - ct.get_width()) // 2, 48))

    cols, cw, ch, gap = 4, 178, 72, 6
    tw = cols * cw + (cols - 1) * gap
    sx = (SW - tw) // 2
    sy = 72

    for i, e in enumerate(ENDINGS):
        row, ci = i // cols, i % cols
        ex = sx + ci * (cw + gap)
        ey = sy + row * (ch + gap)
        eid, ok, selected = e["id"], e["id"] in unlocked, i == sel

        if selected:
            bg, bd, bw = (45, 40, 55), e.get("col", (200, 190, 170)), 2
        elif ok:
            bg, bd, bw = (20, 18, 28), (50, 45, 60), 1
        else:
            bg, bd, bw = (12, 10, 18), (25, 22, 32), 1

        pygame.draw.rect(sf, bg, (ex, ey, cw, ch), border_radius=4)
        pygame.draw.rect(sf, bd, (ex, ey, cw, ch), bw, border_radius=4)

        if ok:
            sf.blit(fn["sm"].render(f"#{eid}", True, e.get("col", C_T)), (ex + 6, ey + 4))
            sf.blit(fn["sm"].render(e["nm"], True, C_T), (ex + 6, ey + 22))
            ref = e.get("ref", "")
            if ref:
                pv = ref[:28] + ("..." if len(ref) > 28 else "")
                sf.blit(fn["sm"].render(pv, True, (80, 75, 68)), (ex + 6, ey + 44))
        else:
            sf.blit(fn["sm"].render(f"#{eid}", True, (35, 30, 45)), (ex + 6, ey + 12))
            sf.blit(fn["sm"].render("...", True, (25, 22, 32)), (ex + 6, ey + 38))

    # Dica
    if 0 <= sel < len(ENDINGS):
        e = ENDINGS[sel]
        desc = e.get("how", "") if e["id"] in unlocked else "???"
        ds = fn["sm"].render(f"Como: {desc}", True, (140, 135, 125))
        sf.blit(ds, ((SW - ds.get_width()) // 2, SH - 55))
    sf.blit(fn["sm"].render("Setas: navegar  |  ESC: voltar", True, (80, 75, 65)),
            ((SW - 200) // 2, SH - 28))


# ═══════════════════════════════════════════════
# CLASSE PRINCIPAL
# ═══════════════════════════════════════════════
class Game:
    def __init__(self):
        self.scr = pygame.display.set_mode((SW, SH))
        pygame.display.set_caption("HEROI")
        self.clk = pygame.time.Clock()
        self.fn = load_fonts()
        self.st = State()
        self.ents = []
        self.tmap = []
        self.sm = S_INT
        self.pm = S_PLAY

        # Intro
        self.ivis = 0
        self.itmr = 0
        self.idone = False

        # Ending anim
        self.evis = 0
        self.etmr = 0
        self.ephase = 0

        # Gallery
        self.gsel = 0

        # Dialog
        self.dtext = ""
        self.dname = ""

        # Current ending ref
        self.cend = None

        # Combat
        self.atk_t = 0
        self.hitstop = 0

        # Transition
        self.trans = 0
        self.troom = None
        self.tsx = self.tsy = 0

        # Effects
        self.shake_t = 0
        self.shk_x = self.shk_y = 0
        self.flash_t = 0

        # Popups [(text, x, y, frames)]
        self.popups = []

        # Particles [x, y, vx, vy, life, max_life, size]
        self.parts = []
        for _ in range(18):
            self.parts.append(self._new_part())

        # Pre-rendered surfaces
        self.vignette = mk_vignette()
        self.grain = mk_grain()
        self.light_ov = pygame.Surface((GW, GH))
        self.part_sf = pygame.Surface((GW, GH), pygame.SRCALPHA)

        # Player pixel pos
        self.px = self.st.tx * TILE
        self.py = self.st.ty * TILE
        self.tpx = self.px
        self.tpy = self.py
        self.moving = False
        self.spd = 5

        self._load_room(self.st.room)

    def _new_part(self):
        return [random.uniform(0, GW), random.uniform(0, GH),
                random.uniform(-0.15, 0.15), random.uniform(-0.25, -0.03),
                0, 0, random.randint(1, 2)]

    # ─── SALAS ───

    def _load_room(self, rid):
        rm = ROOMS[rid]
        self.tmap = rm["map"]
        self.st.rname = rm["name"]
        self.ents = []
        for e in rm.get("ent", []):
            k = (rid, e["id"])
            if k in self.st.dead or k in self.st.items:
                continue
            ent = dict(e)
            ent["max_hp"] = ent.get("hp", 0)
            self.ents.append(ent)

    def _enter_room(self, rid, sx, sy):
        mobs = [e for e in self.ents if e["t"] == "mob" and e.get("hp", 0) > 0]
        if mobs:
            self.st.fled += 1
        self.st.room = rid
        self.st.tx, self.st.ty = sx, sy
        self.st.visited.add(rid)
        self.st.rname = ROOMS[rid]["name"]
        self.px, self.py = sx * TILE, sy * TILE
        self.tpx, self.tpy = self.px, self.py
        self.moving = False
        self._load_room(rid)
        if rid == "cave" and not self.st.sword:
            self.st.nosword = True

    # ─── LOOP ───

    def run(self):
        run = True
        while run:
            self.clk.tick(60)
            for ev in pygame.event.get():
                if ev.type == pygame.QUIT:
                    run = False
                elif ev.type == pygame.KEYDOWN:
                    self._key(ev.key)
            self._update()
            self._draw()
        pygame.quit()
        sys.exit()

    # ─── INPUT ───

    def _key(self, k):
        if self.sm == S_INT:
            if self.idone and k == pygame.K_RETURN:
                self.sm = S_PLAY
            else:
                self.ivis = len(INTRO_L)
                self.idone = True
            return

        if self.sm == S_MEM:
            if k == pygame.K_ESCAPE:
                self.sm = self.pm
            elif k == pygame.K_LEFT:
                self.gsel = max(0, self.gsel - 1)
            elif k == pygame.K_RIGHT:
                self.gsel = min(len(ENDINGS) - 1, self.gsel + 1)
            elif k == pygame.K_UP:
                self.gsel = max(0, self.gsel - 4)
            elif k == pygame.K_DOWN:
                self.gsel = min(len(ENDINGS) - 1, self.gsel + 4)
            return

        if self.sm == S_END:
            if self.ephase < 3:
                self._skip_end()
                return
            if k == pygame.K_r:
                self._restart()
            elif k == pygame.K_g:
                self.pm = S_END
                self.sm = S_MEM
                self.gsel = 0
            return

        if self.sm == S_TALK:
            if k == pygame.K_e:
                self.sm = S_PLAY
            return

        # PLAY
        if k == pygame.K_TAB:
            self.pm = S_PLAY
            self.sm = S_MEM
            self.gsel = 0
        elif k == pygame.K_SPACE:
            self._attack()
        elif k == pygame.K_e:
            self._interact()
        elif k == pygame.K_q:
            self._discard()

    # ─── UPDATE ───

    def _update(self):
        tick = pygame.time.get_ticks()

        # Intro
        if self.sm == S_INT:
            self.itmr += 1
            if self.itmr >= 40 and not self.idone:
                self.itmr = 0
                self.ivis += 1
                if self.ivis >= len(INTRO_L):
                    self.idone = True
            return

        # Ending
        if self.sm == S_END:
            self.etmr += 1
            lines = self.cend.get("txt", [])
            if self.ephase == 0:
                if self.etmr >= 50:
                    self.etmr = 0
                    self.evis += 1
                    if self.evis >= len(lines):
                        self.ephase = 1
            elif self.ephase == 1 and self.etmr >= 90:
                self.ephase = 2
                self.etmr = 0
            elif self.ephase == 2 and self.etmr >= 60:
                self.ephase = 3
            return

        if self.sm != S_PLAY:
            return

        # Hitstop
        if self.hitstop > 0:
            self.hitstop -= 1
            return

        # Transition
        if self.trans > 0:
            self.trans -= 1
            if self.trans == 15:
                self._enter_room(self.troom, self.tsx, self.tsy)
                self._pickup()
            return

        # Shake
        if self.shake_t > 0:
            self.shake_t -= 1
            self.shk_x = random.randint(-3, 3)
            self.shk_y = random.randint(-3, 3)
        else:
            self.shk_x = self.shk_y = 0

        # Flash
        if self.flash_t > 0:
            self.flash_t -= 1

        # Atk timer
        if self.atk_t > 0:
            self.atk_t -= 1

        # Movement
        self._move()

        # Idle
        keys = pygame.key.get_pressed()
        mv = any(keys[k] for k in [pygame.K_w, pygame.K_s, pygame.K_a, pygame.K_d,
                                    pygame.K_UP, pygame.K_DOWN,
                                    pygame.K_LEFT, pygame.K_RIGHT])
        if not mv and not self.moving:
            self.st.tidle += 1
        self._update_pos()

        # Particles
        for p in self.parts:
            p[0] += p[2]
            p[1] += p[3]
            p[2] += random.uniform(-0.01, 0.01)
            p[4] -= 1
            if p[4] <= 0 or p[1] < -5:
                p[0] = random.uniform(0, GW)
                p[1] = random.uniform(0, GH)
                p[2] = random.uniform(-0.15, 0.15)
                p[3] = random.uniform(-0.25, -0.03)
                p[4] = random.randint(150, 400)
                p[5] = p[4]
                p[6] = random.randint(1, 2)

        # Popups
        self.popups = [(t, x, y, f - 1) for t, x, y, f in self.popups if f > 1]

        # Check endings
        eid = chk_end(self.st)
        if eid is not None:
            self._trigger_end(eid)

    def _skip_end(self):
        if self.cend:
            self.evis = len(self.cend.get("txt", []))
        self.ephase = 3

    # ─── MOVEMENT ───

    def _move(self):
        if self.moving:
            return
        keys = pygame.key.get_pressed()
        dx, dy = 0, 0
        if keys[pygame.K_w] or keys[pygame.K_UP]:
            dy, self.st.dr = -1, 0
        elif keys[pygame.K_s] or keys[pygame.K_DOWN]:
            dy, self.st.dr = 1, 2
        elif keys[pygame.K_a] or keys[pygame.K_LEFT]:
            dx, self.st.dr = -1, 3
        elif keys[pygame.K_d] or keys[pygame.K_RIGHT]:
            dx, self.st.dr = 1, 1
        if dx == 0 and dy == 0:
            return

        nx, ny = self.st.tx + dx, self.st.ty + dy
        if not (0 <= nx < NC and 0 <= ny < NR):
            return
        if self.tmap[ny][nx] == "#":
            return

        for e in self.ents:
            if e["x"] == nx and e["y"] == ny:
                if e["t"] == "mob" and e.get("hp", 0) > 0:
                    self._dmg(e.get("d", 1))
                    return
                if e["t"] in BLOCK:
                    return

        self.st.tx, self.st.ty = nx, ny
        self.tpx, self.tpy = nx * TILE, ny * TILE
        self.moving = True

    def _update_pos(self):
        if not self.moving:
            return
        dx = self.tpx - self.px
        dy = self.tpy - self.py
        if abs(dx) <= self.spd and abs(dy) <= self.spd:
            self.px, self.py = self.tpx, self.tpy
            self.moving = False
            self._on_tile()
        else:
            self.px += self.spd if dx > 0 else (-self.spd if dx < 0 else 0)
            self.py += self.spd if dy > 0 else (-self.spd if dy < 0 else 0)

    def _on_tile(self):
        self._pickup()
        self._check_door()

    def _check_door(self):
        x, y = self.st.tx, self.st.ty
        rd = ROOMS[self.st.room]
        info = None
        if y == 0 and "north" in rd:
            info = rd["north"]
        elif y == NR - 1 and "south" in rd:
            info = rd["south"]
        elif x == 0 and "west" in rd:
            info = rd["west"]
        elif x == NC - 1 and "east" in rd:
            info = rd["east"]
        if info:
            self.trans = 30
            self.troom, self.tsx, self.tsy = info

    def _pickup(self):
        x, y = self.st.tx, self.st.ty
        rm = []
        for e in self.ents:
            if e["x"] == x and e["y"] == y and e["t"] == "itm":
                rm.append(e)
        for e in rm:
            k = (self.st.room, e["id"])
            self.st.items.add(k)
            self.ents.remove(e)
            g = e.get("gold", 0)
            if g > 0:
                self.st.gold += g
                self._popup(f"+{g} OURO", x, y)
            elif e.get("pot"):
                self.st.potion = True
                self.st.hp = min(self.st.hp + 2, self.st.mhp)
                self._popup("POCAO!", x, y)
            elif e.get("heal", 0) > 0:
                self.st.hp = min(self.st.hp + e["heal"], self.st.mhp)
                self._popup("+VIDA", x, y)

    # ─── ATAQUE ───

    def _attack(self):
        if self.atk_t > 0 or not self.st.sword:
            return
        self.atk_t = 12
        dx, dy = DD[self.st.dr]
        tx, ty = self.st.tx + dx, self.st.ty + dy

        for e in list(self.ents):
            if e["x"] != tx or e["y"] != ty:
                continue
            if e["t"] == "mob" and e.get("hp", 0) > 0:
                e["hp"] -= 1
                if e["hp"] <= 0:
                    k = (self.st.room, e["id"])
                    self.st.dead.add(k)
                    self.st.kills[e["id"]] = self.st.kills.get(e["id"], 0) + 1
                    self.ents.remove(e)
                    self._popup("VITORIA!", tx, ty)
                    self.hitstop = 4
                    if self.st.dmg == 0:
                        self.st.acts.add("perfect")
                return
            if e["t"] == "npc":
                self.st.npc_hit = True
                k = (self.st.room, e["id"])
                self.st.dead.add(k)
                self.ents.remove(e)
                return

    # ─── INTERAÇÃO ───

    def _interact(self):
        dx, dy = DD[self.st.dr]
        fx, fy = self.st.tx + dx, self.st.ty + dy
        px, py = self.st.tx, self.st.ty

        for e in list(self.ents):
            ex, ey = e["x"], e["y"]
            if not ((ex == fx and ey == fy) or (ex == px and ey == py)):
                continue
            t = e["t"]

            if t == "npc":
                self.st.talked.add(e["id"])
                self._talk(e.get("dlg", "..."), e.get("nm", ""))
                return
            if t == "sign":
                self.st.signs_r.add(e["id"])
                self._talk(e.get("text", "..."), "Placa")
                return
            if t == "throne":
                self.st.throne = True
                self._talk("Voce sentou no trono.\nA coroa desce.\nO peso e eterno.", "Trono")
                return
            if t == "altar":
                self.st.altar = True
                k = (self.st.room, e["id"])
                self.st.dead.add(k)
                self.ents.remove(e)
                self._talk("O altar se despedacou!\nO chao treme.\nAlgo desperta...", "Altar")
                return
            if t == "void":
                self.st.void = True
                self._talk("'Nao existe la fora.'\n\nSo vazio. So silencio.", "Abismo")
                return
            if t == "secret":
                self.st.secret = True
                k = (self.st.room, e["id"])
                self.st.dead.add(k)
                self.ents.remove(e)
                self._talk("A parede se dissolve...\n\nDentro: codigo.\nVoce e uma variavel.", "???")
                return
            if t == "bld":
                self.st.builds += 1
                n = e.get("nm", "estrutura")
                extra = "\n\nTudo comeca a tremer..." if self.st.builds >= 4 else ""
                self._talk(f"Voce examina {n}.\nConstrucoes: {self.st.builds}/4{extra}", n)
                return

    def _discard(self):
        if self.st.sword:
            self.st.sword = False

    def _dmg(self, amt):
        self.st.hp -= amt
        self.st.dmg += amt
        self.flash_t = 12
        self.shake_t = 10
        if self.st.hp <= 0:
            self.st.acts.add("died")
            self.st.hp = self.st.mhp

    def _talk(self, text, name):
        self.dtext, self.dname = text, name
        self.sm = S_TALK

    def _popup(self, text, tx, ty):
        self.popups.append([text, OX + tx * TILE, ty * TILE, 70])

    def _trigger_end(self, eid):
        e = get_end(eid)
        if e and eid not in self.st.endings:
            self.st.endings.add(eid)
        self.cend = e
        self.evis = 0
        self.etmr = 0
        self.ephase = 0
        self.sm = S_END

    def _restart(self):
        saved = set(self.st.endings)
        self.st = State()
        self.st.endings = saved
        self.px, self.py = self.st.tx * TILE, self.st.ty * TILE
        self.tpx, self.tpy = self.px, self.py
        self.moving = False
        self.atk_t = 0
        self.hitstop = 0
        self.popups = []
        self.parts = []
        for _ in range(18):
            self.parts.append(self._new_part())
        self._load_room(self.st.room)
        self.sm = S_PLAY

    # ─── RENDER ───

    def _draw(self):
        tick = pygame.time.get_ticks()

        # INTRO
        if self.sm == S_INT:
            draw_intro(self.scr, self.ivis, self.idone, self.fn)
            pygame.display.flip()
            return

        # GALERIA
        if self.sm == S_MEM:
            draw_gallery(self.scr, self.st.endings, self.fn, self.gsel)
            pygame.display.flip()
            return

        # FINAL
        if self.sm == S_END and self.cend:
            draw_ending(self.scr, self.cend, self.evis,
                        self.ephase >= 2, self.ephase >= 3, self.fn)
            pygame.display.flip()
            return

        # JOGO
        cv = gclv(self.st)
        bg = BCOL[cv]
        self.scr.fill(bg)

        # Shake offset
        sx, sy = self.shk_x, self.shk_y

        # Tiles
        draw_tiles(self.scr, self.tmap, cv)

        # Entidades + jogador (ordenados por Y)
        drawables = []
        for e in self.ents:
            drawables.append((e["y"] * TILE, e))
        drawables.append((self.py, None))
        drawables.sort(key=lambda d: d[0])

        for _, item in drawables:
            if item is None:
                draw_player(self.scr, self.px + sx, self.py + sy,
                            self.st.dr, self.st.sword, self.atk_t > 0, cv)
            else:
                draw_ent(self.scr, item, tick)

        # Particulas
        self.part_sf.fill((0, 0, 0, 0))
        pc = PCOL[cv]
        for p in self.parts:
            if p[4] > 0:
                a = int(45 * p[4] / max(p[5], 1))
                pygame.draw.circle(self.part_sf, (*pc, a),
                                   (int(p[0]), int(p[1])), p[6])
        self.scr.blit(self.part_sf, (OX, 0))

        # ILUMINAÇÃO
        dk = DKV[cv]
        if dk > 0:
            lr = LRAD[cv]
            # Pulso de vida baixa
            if self.st.hp <= 2:
                spd = 0.08 if self.st.hp == 1 else 0.05
                lr = int(lr * (1.0 + 0.12 * math.sin(tick * spd)))
            # Respiração
            lr = int(lr + math.sin(tick * 0.003) * 3)
            self.light_ov.fill((dk, dk, dk))
            cx = int(self.px + TILE // 2)
            cy = int(self.py + TILE // 2)
            steps = 20
            for i in range(steps, 0, -1):
                r = max(int(lr * i / steps), 1)
                v = int(dk * (1 - i / steps))
                pygame.draw.circle(self.light_ov, (v, v, v), (cx, cy), r)
            self.scr.blit(self.light_ov, (OX, 0),
                          special_flags=pygame.BLEND_SUB)

        # Vignette
        self.scr.blit(self.vignette, (OX, 0))

        # Grain
        self.scr.blit(self.grain, (OX, 0))

        # Flash de dano
        if self.flash_t > 0:
            fs = pygame.Surface((GW, GH))
            fs.fill((180, 30, 30))
            fs.set_alpha(int(100 * self.flash_t / 12))
            self.scr.blit(fs, (OX, 0))

        # Transição
        if self.trans > 0:
            if self.trans > 15:
                a = int(255 * (30 - self.trans) / 15)
            else:
                a = int(255 * self.trans / 15)
            fs = pygame.Surface((GW, GH))
            fs.fill((0, 0, 0))
            fs.set_alpha(a)
            self.scr.blit(fs, (OX, 0))

        # Popups
        for text, px, py, frames in self.popups:
            alpha = int(255 * frames / 70)
            offset = int((70 - frames) * 0.6)
            s = self.fn["md"].render(text, True, C_H)
            s.set_alpha(alpha)
            self.scr.blit(s, (px, py - offset))

        # HUD
        draw_hud(self.scr, self.st, self.fn)

        # Diálogo
        if self.sm == S_TALK:
            draw_dialog(self.scr, self.dtext, self.dname, self.fn)

        pygame.display.flip()


# ═══════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    Game().run()
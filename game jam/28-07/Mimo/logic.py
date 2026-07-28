"""
LOGIC.PY — Dados, finais, intro, condições e lógica do jogo HERÓI
"""


class GameState:
    def __init__(self):
        self.endings = set()
        self.reset()

    def reset(self):
        self.room = "village"
        self.tile_x = 6
        self.tile_y = 4
        self.direction = 2
        self.hp = 6
        self.max_hp = 6
        self.has_sword = True
        self.gold = 0
        self.kills = {}
        self.talked = set()
        self.read_signs = set()
        self.visited = {"village"}
        self.items_taken = set()
        self.dead_entities = set()
        self.damage_taken = 0
        self.fled = 0
        self.idle_frames = 0
        self.total_idle = 0
        self.actions = set()
        self.constructions = 0
        self.room_name = "Vila de Eldoria"
        self.sat_throne = False
        self.drank_potion = False
        self.discarded_sword = False
        self.destroyed_altar = False
        self.hit_npc = False
        self.found_secret = False
        self.entered_cave_no_sword = False
        self.left_map = False


# ═══════════════════════════════
# INTRO
# ═══════════════════════════════

INTRO_TITLE = "HERÓI"
INTRO_LINES = [
    "Todo mundo tem um herói.",
    "Alguém que faz o que precisa ser feito.",
    "",
    "Você é esse alguém.",
    "",
    "O dragão precisa morrer.",
    "O reino precisa de salvação.",
    "",
    "Ninguém perguntou ao dragão.",
]


# ═══════════════════════════════
# 20 FINAIS
# ═══════════════════════════════

ENDINGS = [
    {
        "id": 1, "name": "O Herói", "desc": "Mate o dragão",
        "title": "VITÓRIA DO HERÓI",
        "lines": [
            "Você derrotou o dragão.", "O reino está salvo.",
            "", "Os sinos tocam. O povo dança.",
            "Seu nome será lembrado para sempre.", "",
            "Mas ninguém percebeu", "que o céu ficou mais escuro.",
            "", "O dragão era a última barreira",
            "contra a Praga das Sombras.", "",
            "O reino que você salvou", "vai morrer devagar.",
            "E ninguém vai saber por quê.",
        ],
        "reflection": "Parabéns, Herói.",
        "color": (255, 215, 0),
        "check": lambda s: s.kills.get("dragon", 0) > 0,
    },
    {
        "id": 2, "name": "O Rei", "desc": "Sente no trono",
        "title": "O REI ETERNO",
        "lines": [
            "Você se sentou no trono.", "A coroa desceu sobre sua cabeça.",
            "", "O peso é eterno.", "",
            "As paredes se fecham.", "O tempo para.",
            "", "Você reinará sobre cinzas", "para sempre.",
            "", "Todo rei é um prisioneiro.",
            "Agora você também é.",
        ],
        "reflection": "Longa vida ao Rei.",
        "color": (180, 150, 50),
        "check": lambda s: s.sat_throne,
    },
    {
        "id": 3, "name": "O Ganancioso", "desc": "Colete todo o ouro",
        "title": "OURO SUJO",
        "lines": [
            "Você coletou cada moeda.", "Riqueza infinita.",
            "", "Mas quando contou...", "cada moeda pesava como uma alma.",
            "", "Porque era uma alma.",
            "Alguém viveu aqui.", "Alguém morreu aqui.",
            "Agora elas são suas.", "",
            "E elas têm fome.",
        ],
        "reflection": "Você contou cada moeda. Esqueceu cada rosto.",
        "color": (255, 200, 50),
        "check": lambda s: s.gold >= 100,
    },
    {
        "id": 4, "name": "O Purificador", "desc": "Mate 10 inimigos",
        "title": "O PURIFICADOR",
        "lines": [
            "Você eliminou todas as ameaças.", "O reino está limpo.",
            "", "Dez monstros. Dez vitórias.", "",
            "Mas os monstros eram uma raça", "antiga e pacífica.",
            "", "Eles cantavam antes de dormir.",
            "Eles tinham filhos.", "",
            "Você cometeu um genocídio.", "E o reino te aplaude.",
        ],
        "reflection": "Dez é tudo que uma raça vale.",
        "color": (200, 60, 60),
        "check": lambda s: sum(s.kills.values()) >= 10,
    },
    {
        "id": 5, "name": "O Pacifista", "desc": "Não faça nada por 3 min",
        "title": "O OBSERVADOR",
        "lines": [
            "Você não fez nada.", "",
            "A aldeia queimou sem você.",
            "O rei morreu sem você.",
            "O dragão fugiu sem você.", "",
            "O mundo não esperou.",
            "", "Mas você estava seguro.",
            "Observando.",
        ],
        "reflection": "A inação também é uma escolha.",
        "color": (100, 100, 120),
        "check": lambda s: s.total_idle >= 10800,
    },
    {
        "id": 6, "name": "O Covarde", "desc": "Fuja de 3 salas com monstros",
        "title": "A FUGA",
        "lines": [
            "Você fugiu de todas as lutas.", "",
            "Mas os monstros não te perseguiram.", "Eles te protegiam.",
            "", "Sem eles, a escuridão venceu.",
            "", "E você assistiu",
            "do outro lado da porta.",
        ],
        "reflection": "Covarde ou prudente? O mundo não liga.",
        "color": (80, 80, 140),
        "check": lambda s: s.fled >= 3,
    },
    {
        "id": 7, "name": "O Sábio", "desc": "Leia todas as placas",
        "title": "CONHECIMENTO PROIBIDO",
        "lines": [
            "Você leu todas as placas.", "Sabe a verdade.",
            "", "A verdade é simples:",
            "você é o monstro.", "",
            "Sempre foi.", "",
            "Agora você sabe.", "E não pode des-saber.",
        ],
        "reflection": "O conhecimento liberta. E depois?",
        "color": (100, 180, 220),
        "check": lambda s: len(s.read_signs) >= 7,
    },
    {
        "id": 8, "name": "O Inocente", "desc": "Beba a poção",
        "title": "O REMÉDIO",
        "lines": [
            "Você bebeu a poção.", "Energia te encheu.",
            "", "Mas a poção era um parasita.",
            "Ele se espalha por tudo", "que você toca.",
            "", "Cada passo é uma contaminação.",
            "Cada espada, uma praga.", "",
            "Você é a cura e a doença.",
        ],
        "reflection": "O remédio e o veneno eram o mesmo frasco.",
        "color": (80, 200, 80),
        "check": lambda s: s.drank_potion,
    },
    {
        "id": 9, "name": "O Traidor", "desc": "Ataque um NPC",
        "title": "A TRAIÇÃO",
        "lines": [
            "Você atacou alguém do seu lado.", "",
            "Ele caiu sem dizer nada.",
            "Os olhos não se fecharam.",
            "", "Eles confiavam em você.",
            "", "Confiam menos agora.",
        ],
        "reflection": "Heróis não atacam aliados. Você atacou.",
        "color": (180, 40, 40),
        "check": lambda s: s.hit_npc,
    },
    {
        "id": 10, "name": "O Corajoso", "desc": "Entre na caverna sem espada",
        "title": "O INCAUTO",
        "lines": [
            "Você entrou na caverna sem espada.", "Sem defesa. Sem preparo.",
            "", "E encontrou a saída.",
            "", "Uma porta que não existia antes.",
            "Do outro lado: o menu inicial.",
            "", "O jogo acabou.",
        ],
        "reflection": "Você venceu?",
        "color": (220, 180, 100),
        "check": lambda s: s.entered_cave_no_sword,
    },
    {
        "id": 11, "name": "O Libertado", "desc": "Jogue fora a espada (Q)",
        "title": "A LIBERTAÇÃO",
        "lines": [
            "Você largou a espada.",
            "", "Sem arma. Sem violência.",
            "", "O mundo respirou.",
            "As árvores voltaram.",
            "Os animais voltaram.",
            "A música tocou de novo.",
            "", "FALHA NA MISSÃO.",
        ],
        "reflection": "O único final feliz é considerado falha.",
        "color": (100, 220, 130),
        "check": lambda s: s.discarded_sword,
    },
    {
        "id": 12, "name": "O Perdido", "desc": "Interaja com o abismo",
        "title": "ALÉM DOS MUROS",
        "lines": [
            "Você olhou para o abismo.", "",
            "E o abismo respondeu:", "",
            "'Não existe lá fora.'", "",
            "Você é real?", "O mundo é real?",
            "", "O vazio não mente.",
        ],
        "reflection": "Você olhou para o vazio. Era um espelho.",
        "color": (60, 60, 80),
        "check": lambda s: s.left_map,
    },
    {
        "id": 13, "name": "O Curioso", "desc": "Encontre a sala secreta",
        "title": "OS BASTIDORES",
        "lines": [
            "Você encontrou a sala secreta.",
            "", "Dentro: o código fonte do jogo.",
            "", "Tudo é números. Strings. Lambdas.",
            "Você é uma variável.",
            "", "Sua vida é um inteiro.",
            "Suas escolhas são funções.",
        ],
        "reflection": "Isso muda alguma coisa?",
        "color": (150, 255, 150),
        "check": lambda s: s.found_secret,
    },
    {
        "id": 14, "name": "O Destruidor", "desc": "Interaja com 4 construções",
        "title": "O TERREMOTO",
        "lines": [
            "Você examinou cada pedra.", "Cutucou cada estrutura.",
            "", "Quatro toques. Quatro tremores.",
            "", "E o mundo desabou.",
            "", "O mundo não suporta curiosidade.",
        ],
        "reflection": "Tudo que você tocou, quebrou.",
        "color": (160, 120, 80),
        "check": lambda s: s.constructions >= 4,
    },
    {
        "id": 15, "name": "O Amigo", "desc": "Converse com todos os NPCs",
        "title": "A ILUSÃO",
        "lines": [
            "Você conversou com todos.",
            "Cada um te contou uma história.",
            "", "Mas quando olhou para trás...",
            "ninguém estava lá.",
            "", "Eles nunca existiram.",
            "", "Só existiam para te ouvir.",
        ],
        "reflection": "Solidão é conversar com fantasmas.",
        "color": (180, 160, 200),
        "check": lambda s: len(s.talked) >= 7,
    },
    {
        "id": 16, "name": "O Imortal", "desc": "Morra e renasça",
        "title": "A RESSURREIÇÃO",
        "lines": [
            "Você morreu.",
            "", "E voltou.",
            "", "Mas seus olhos são vermelhos.",
            "Suas mãos tremem de raiva.",
            "", "A morte não te libertou.",
            "Te transformou.",
            "", "Agora você é o monstro.",
        ],
        "reflection": "A morte não te libertou. Te fez igual.",
        "color": (200, 30, 30),
        "check": lambda s: "died" in s.actions,
    },
    {
        "id": 17, "name": "O Perfeito", "desc": "Vença luta sem tomar dano",
        "title": "A SIMULAÇÃO",
        "lines": [
            "Você lutou perfeitamente.", "Sem um arranhão.",
            "", "Porque era tudo encenado.",
            "Os inimigos seguiam um roteiro.",
            "Suas escolhas eram previstas.",
            "", "Parabéns.",
            "Você seguiu o script certinho.",
        ],
        "reflection": "Perfeito demais. Isso é suspeito.",
        "color": (200, 200, 220),
        "check": lambda s: "perfect_fight" in s.actions,
    },
    {
        "id": 18, "name": "O Esquecido", "desc": "Fique parado na vila",
        "title": "O SUBSTITUTO",
        "lines": [
            "Você ficou parado.", "",
            "O mundo não esperou.",
            "Outro herói apareceu.",
            "Mais rápido. Mais forte.",
            "", "Ele completou sua missão.",
            "", "Ninguém lembra do seu nome.",
        ],
        "reflection": "O mundo não precisa de você. Precisa de um herói.",
        "color": (120, 120, 100),
        "check": lambda s: (
            s.total_idle >= 3600 and s.room == "village"
            and len(s.visited) <= 1
        ),
    },
    {
        "id": 19, "name": "O Herege", "desc": "Destrua o altar do templo",
        "title": "O DESTERRO",
        "lines": [
            "Você destruiu o altar sagrado.",
            "O chão tremeu.", "O céu escureceu.",
            "", "O que estava preso sob o altar",
            "agora está livre.",
            "", "E ele lembra de você.",
        ],
        "reflection": "Você não libertou o mal. Lembrou ele.",
        "color": (100, 20, 60),
        "check": lambda s: s.destroyed_altar,
    },
    {
        "id": 20, "name": "O Verdadeiro", "desc": "Colete as 5 relíquias",
        "title": "O ACÚMULO",
        "lines": [
            "Você coletou todas as relíquias.",
            "O poder supremo é seu!",
            "", "Mas as relíquias são fragmentos",
            "de algo que não deveria ser reunido.",
            "", "Juntas, elas se completam.",
            "E se destroem.", "E levam tudo junto.",
            "", "Você fez de tudo.",
            "E tudo foi em vão.",
        ],
        "reflection": "Completar um jogo não é vencer.",
        "color": (255, 255, 200),
        "check": lambda s: sum(
            1 for r, i in s.items_taken if "relic" in i
        ) >= 5,
    },
]


def check_endings(state):
    for ending in ENDINGS:
        try:
            if ending["check"](state):
                return ending["id"]
        except Exception:
            pass
    return None


def get_ending(eid):
    for e in ENDINGS:
        if e["id"] == eid:
            return e
    return None


# ═══════════════════════════════
# SALAS (grade 3x3, mapa 13x9)
# ═══════════════════════════════

ROOMS = {
    "cave": {
        "name": "Caverna Escura",
        "map": [
            "#############",
            "#...........#",
            "#..##...##..#",
            "#...........#",
            "#............",
            "#...........#",
            "#..##...##..#",
            "#...........#",
            "######.######",
        ],
        "east": ("forest", 1, 4),
        "south": ("crypt", 6, 1),
        "entities": [
            {"type":"monster","id":"bat_1","x":5,"y":3,
             "name":"Morcego","hp":2,"damage":1},
            {"type":"monster","id":"bat_2","x":8,"y":6,
             "name":"Morcego","hp":2,"damage":1},
            {"type":"item","id":"gold_3","x":3,"y":5,
             "name":"Moedas Antigas","gold":25},
            {"type":"item","id":"relic_3","x":10,"y":2,
             "name":"Relíquia das Sombras","relic":True},
            {"type":"sign","id":"sign_5","x":2,"y":1,
             "text":"Os morcegos eram guardiões.\nNão eram seus inimigos."},
            {"type":"construction","id":"stalactite","x":9,"y":4,
             "name":"Estalactite"},
        ],
    },
    "forest": {
        "name": "Floresta Sombria",
        "map": [
            "#############",
            "#...........#",
            "#..#.....#..#",
            "#...........#",
            ".............",
            "#...........#",
            "#..#.....#..#",
            "#...........#",
            "######.######",
        ],
        "west": ("cave", 11, 4),
        "east": ("peak", 1, 4),
        "south": ("village", 6, 1),
        "entities": [
            {"type":"monster","id":"slime","x":4,"y":3,
             "name":"Slime","hp":2,"damage":1},
            {"type":"monster","id":"wolf","x":8,"y":5,
             "name":"Lobo","hp":3,"damage":1},
            {"type":"item","id":"potion","x":2,"y":6,
             "name":"Poção Misteriosa","potion":True},
            {"type":"item","id":"gold_2","x":9,"y":1,
             "name":"Moedas","gold":25},
            {"type":"sign","id":"sign_2","x":6,"y":1,
             "text":"As árvores sussurram:\n'Volte enquanto pode.'"},
            {"type":"item","id":"relic_2","x":3,"y":7,
             "name":"Relíquia da Floresta","relic":True},
            {"type":"construction","id":"treehouse","x":10,"y":3,
             "name":"Casa na Árvore"},
        ],
    },
    "peak": {
        "name": "Pico do Dragão",
        "map": [
            "#############",
            "#...........#",
            "#...........#",
            "#...........#",
            "............#",
            "#...........#",
            "#...........#",
            "#...........#",
            "######.######",
        ],
        "west": ("forest", 11, 4),
        "south": ("castle", 6, 1),
        "entities": [
            {"type":"monster","id":"dragon","x":6,"y":2,
             "name":"DRAGÃO","hp":8,"damage":2},
            {"type":"item","id":"gold_dragon","x":4,"y":5,
             "name":"Tesouro do Dragão","gold":50},
            {"type":"item","id":"relic_4","x":9,"y":6,
             "name":"Relíquia do Fogo","relic":True},
            {"type":"sign","id":"sign_6","x":2,"y":7,
             "text":"O dragão protegia o reino\nhá mil anos.\nEle não é seu inimigo."},
        ],
    },
    "crypt": {
        "name": "Cripta Antiga",
        "map": [
            "######.######",
            "#...........#",
            "#..#.....#..#",
            "#...........#",
            "#............",
            "#...........#",
            "#..#.....#..#",
            "#...........#",
            "######.######",
        ],
        "north": ("cave", 6, 7),
        "east": ("village", 1, 4),
        "south": ("temple", 6, 1),
        "entities": [
            {"type":"monster","id":"skeleton","x":5,"y":4,
             "name":"Esqueleto","hp":3,"damage":1},
            {"type":"item","id":"gold_4","x":3,"y":2,
             "name":"Ouro dos Mortos","gold":25},
            {"type":"sign","id":"sign_4","x":8,"y":6,
             "text":"Aqui jaz o último rei\nque acreditou em heróis."},
            {"type":"construction","id":"tomb","x":9,"y":2,
             "name":"Tumba Real"},
        ],
    },
    "village": {
        "name": "Vila de Eldoria",
        "map": [
            "######.######",
            "#...........#",
            "#...........#",
            "#...........#",
            ".............",
            "#...........#",
            "#...........#",
            "#...........#",
            "######.######",
        ],
        "north": ("forest", 6, 7),
        "south": ("fields", 6, 1),
        "west": ("crypt", 11, 4),
        "east": ("castle", 1, 4),
        "entities": [
            {"type":"npc","id":"elder","x":3,"y":2,
             "name":"Ancião",
             "dialogue":"Herói! O dragão ameaça o reino!\nVá ao norte e derrote-o!\nO mundo precisa de você!"},
            {"type":"npc","id":"merchant","x":9,"y":2,
             "name":"Mercador",
             "dialogue":"Bem-vindo, viajante.\nO mundo é maior do que parece.\n...ou menor."},
            {"type":"npc","id":"guard","x":6,"y":6,
             "name":"Guarda",
             "dialogue":"O castelo fica ao leste.\nO rei aguarda sua presença.\nNão o decepcione."},
            {"type":"item","id":"gold_1","x":5,"y":3,
             "name":"Saco de Ouro","gold":25},
            {"type":"sign","id":"sign_1","x":2,"y":7,
             "text":"WASD:mover E:interagir\nESPACO:atacar Q:largar espada"},
            {"type":"item","id":"relic_1","x":10,"y":7,
             "name":"Relíquia Antiga","relic":True},
            {"type":"construction","id":"well","x":7,"y":4,
             "name":"Poço"},
        ],
    },
    "castle": {
        "name": "Castelo do Rei",
        "map": [
            "######.######",
            "#...........#",
            "#...........#",
            "#...........#",
            "............#",
            "#...........#",
            "#...........#",
            "#...........#",
            "######.######",
        ],
        "north": ("peak", 6, 7),
        "west": ("village", 11, 4),
        "south": ("ruins", 6, 1),
        "entities": [
            {"type":"npc","id":"king","x":6,"y":2,
             "name":"Rei",
             "dialogue":"Bem-vindo, herói.\nDerrote o dragão e seu\nnome será eternizado."},
            {"type":"monster","id":"guard_l","x":4,"y":5,
             "name":"Guarda Real","hp":4,"damage":1},
            {"type":"monster","id":"guard_r","x":8,"y":5,
             "name":"Guarda Real","hp":4,"damage":1},
            {"type":"throne","id":"throne","x":6,"y":1,
             "name":"Trono"},
            {"type":"item","id":"gold_5","x":2,"y":3,
             "name":"Tesouro Real","gold":25},
            {"type":"sign","id":"sign_3","x":10,"y":7,
             "text":"Os guardas protegem o rei.\nNão são seus inimigos.\nA menos que você ataque."},
            {"type":"construction","id":"pillar","x":2,"y":1,
             "name":"Coluna do Trono"},
        ],
    },
    "temple": {
        "name": "Templo Sagrado",
        "map": [
            "######.######",
            "#...........#",
            "#...........#",
            "#...........#",
            "#............",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############",
        ],
        "north": ("crypt", 6, 7),
        "east": ("fields", 1, 4),
        "entities": [
            {"type":"npc","id":"priest","x":4,"y":3,
             "name":"Sacerdote",
             "dialogue":"O altar contém um poder\nantigo. Não o perturbe.\nOu perturbe. Escolha sua."},
            {"type":"altar","id":"altar","x":6,"y":2,
             "name":"Altar Sagrado"},
            {"type":"item","id":"holy_water","x":8,"y":4,
             "name":"Água Benta","heal":3},
            {"type":"item","id":"relic_5","x":2,"y":7,
             "name":"Relíquia Divina","relic":True},
            {"type":"construction","id":"font","x":9,"y":7,
             "name":"Pia Batismal"},
        ],
    },
    "fields": {
        "name": "Campos de Eldoria",
        "map": [
            "######.######",
            "#...........#",
            "#...........#",
            "#...........#",
            ".............",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############",
        ],
        "north": ("village", 6, 7),
        "west": ("temple", 11, 4),
        "east": ("ruins", 1, 4),
        "entities": [
            {"type":"npc","id":"farmer","x":4,"y":4,
             "name":"Fazendeiro",
             "dialogue":"Os campos já foram verdes.\nAntes dos heróis aparecerem.\nAgora só resta cinza."},
            {"type":"item","id":"gold_6","x":8,"y":6,
             "name":"Moedas de Colheita","gold":25},
            {"type":"sign","id":"sign_7","x":2,"y":2,
             "text":"Aqui cresciam flores.\nAntes do primeiro herói\nchegar com sua espada."},
        ],
    },
    "ruins": {
        "name": "Ruínas Esquecidas",
        "map": [
            "######.######",
            "#...........#",
            "#...........#",
            "#...........#",
            "............#",
            "#...........#",
            "#...........#",
            "#...........#",
            "#############",
        ],
        "north": ("castle", 6, 7),
        "west": ("fields", 11, 4),
        "entities": [
            {"type":"monster","id":"ghost","x":7,"y":3,
             "name":"Fantasma","hp":3,"damage":1},
            {"type":"void","id":"abyss","x":12,"y":4,
             "name":"Abismo"},
            {"type":"secret_wall","id":"secret","x":6,"y":0,
             "name":"Parede Suspeita"},
            {"type":"construction","id":"statue","x":3,"y":6,
             "name":"Estátua Quebrada"},
        ],
    },
}


ROOM_COLS = 13
ROOM_ROWS = 9
DIR_DELTA = {0: (0, -1), 1: (1, 0), 2: (0, 1), 3: (-1, 0)}
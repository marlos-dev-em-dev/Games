import pygame
import math

# --- CORES TEMÁTICAS (Illuminati + Monument Valley) ---
BLACK = (0, 0, 0)          # Fundo principal
GOLD = (255, 215, 0)        # Símbolos e luzes
WHITE = (255, 255, 255)    # Olho e detalhes
STONE_GRAY = (80, 80, 80)   # Paredes e textura de pedra
SHADOW_GRAY = (30, 30, 30)  # Sombras

# --- TAMANHOS PADRÃO ---
SYMBOL_SIZE = 40            # Tamanho dos símbolos (triângulo, olho, obelisco)
BEAM_WIDTH = 5              # Largura do feixe de luz
WALL_THICKNESS = 20        # Espessura das paredes

# --- FUNÇÕES DE DESENHO ---

def draw_triangle(screen, center, size, color):
    """Desenha um triângulo (símbolo do Illuminati)."""
    points = [
        (center[0], center[1] - size // 2),  # Ponta superior
        (center[0] - size // 2, center[1] + size // 2),  # Base esquerda
        (center[0] + size // 2, center[1] + size // 2)   # Base direita
    ]
    pygame.draw.polygon(screen, color, points)

def draw_eye(screen, center, size, color):
    """Desenha um olho (símbolo do Illuminati)."""
    # Círculo externo (pálpebra)
    pygame.draw.circle(screen, color, center, size // 2, 2)
    # Pupila preta
    pygame.draw.circle(screen, BLACK, center, size // 4)

def draw_obelisk(screen, center, size, color):
    """Desenha um obelisco (coluna do Illuminati)."""
    # Base do obelisco (retângulo vertical)
    pygame.draw.rect(
        screen,
        color,
        (center[0] - size // 4, center[1] - size // 2, size // 2, size)
    )
    # Detalhe no topo (triângulo)
    top_points = [
        (center[0], center[1] - size // 2),
        (center[0] - size // 4, center[1] - size // 2 + 10),
        (center[0] + size // 4, center[1] - size // 2 + 10)
    ]
    pygame.draw.polygon(screen, color, top_points)

def draw_beam(screen, start, end, color):
    """Desenha um feixe de luz entre dois pontos."""
    pygame.draw.line(screen, color, start, end, BEAM_WIDTH)

def draw_wall(screen, rect, color):
    """Desenha uma parede (retângulo)."""
    pygame.draw.rect(screen, color, rect)

def draw_background(screen, width, height):
    """Desenha o fundo com textura de pedra."""
    screen.fill(BLACK)
    # Linhas horizontais para simular textura de pedra
    for y in range(0, height, 30):
        pygame.draw.line(screen, STONE_GRAY, (0, y), (width, y), 1)
    # Linhas verticais para profundidade
    for x in range(0, width, 50):
        pygame.draw.line(screen, STONE_GRAY, (x, 0), (x, height), 1)

def draw_shadow(screen, points, color):
    """Desenha uma sombra (polígono)."""
    pygame.draw.polygon(screen, color, points)
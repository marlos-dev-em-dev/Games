import pygame
import math
from design import (
    draw_triangle, draw_eye, draw_obelisk, draw_beam, draw_shadow, BLACK, GOLD, WHITE, SHADOW_GRAY
)

# --- CLASSE SYMBOL (SÍMBOLOS DO JOGO) ---
class Symbol:
    def __init__(self, x, y, type_):
        """
        Inicializa um símbolo (triângulo, olho ou obelisco).
        :param x: Posição inicial em X.
        :param y: Posição inicial em Y.
        :param type_: Tipo do símbolo ("triangle", "eye", "obelisk").
        """
        self.base_x = x  # Posição base (sem rotação)
        self.base_y = y
        self.type = type_
        self.size = 40  # Tamanho padrão
        self.angle = 0  # Ângulo de rotação (em graus)

    def rotate(self, angle):
        """Rotaciona o símbolo em torno do centro da tela."""
        self.angle = (self.angle + angle) % 360

    def get_position(self):
        """
        Retorna a posição do símbolo após a rotação.
        :return: Tupla (x, y) com a posição rotacionada.
        """
        center = (400, 300)  # Centro da tela (800x600)
        rad = math.radians(self.angle)
        dx = self.base_x - center[0]
        dy = self.base_y - center[1]

        # Aplica rotação
        new_x = center[0] + dx * math.cos(rad) - dy * math.sin(rad)
        new_y = center[1] + dx * math.sin(rad) + dy * math.cos(rad)
        return (new_x, new_y)

    def draw(self, screen):
        """Desenha o símbolo na tela."""
        pos = self.get_position()
        if self.type == "triangle":
            draw_triangle(screen, pos, self.size, GOLD)
        elif self.type == "eye":
            draw_eye(screen, pos, self.size, WHITE)
        elif self.type == "obelisk":
            draw_obelisk(screen, pos, self.size, GOLD)

# --- CLASSE PUZZLE (LÓGICA DO JOGO) ---
class Puzzle:
    def __init__(self):
        """Inicializa o puzzle com 3 símbolos e configurações padrão."""
        self.symbols = [
            Symbol(200, 200, "triangle"),  # Triângulo (esquerda)
            Symbol(400, 400, "eye"),       # Olho (centro inferior)
            Symbol(600, 200, "obelisk")   # Obelisco (direita)
        ]
        self.rotation_angle = 0  # Ângulo global do mapa
        self.solved = False      # Estado do puzzle (resolvido ou não)
        self.center = (400, 300) # Centro da tela

    def rotate(self, angle):
        """
        Rotaciona todos os símbolos em torno do centro da tela.
        :param angle: Ângulo de rotação (em graus).
        """
        self.rotation_angle = (self.rotation_angle + angle) % 360
        for symbol in self.symbols:
            symbol.rotate(angle)

    def check_alignment(self):
        """
        Verifica se os 3 símbolos estão alinhados (horizontal ou verticalmente).
        :return: True se alinhados, False caso contrário.
        """
        pos1 = self.symbols[0].get_position()
        pos2 = self.symbols[1].get_position()
        pos3 = self.symbols[2].get_position()

        # Tolerância para alinhamento (10 pixels)
        tolerance = 10

        # Alinhamento horizontal (Y aproximadamente igual)
        if (abs(pos1[1] - pos2[1]) < tolerance and
            abs(pos2[1] - pos3[1]) < tolerance):
            self.solved = True
            return True

        # Alinhamento vertical (X aproximadamente igual)
        if (abs(pos1[0] - pos2[0]) < tolerance and
            abs(pos2[0] - pos3[0]) < tolerance):
            self.solved = True
            return True

        self.solved = False
        return False

    def draw(self, screen):
        """Desenha todos os símbolos e o feixe de luz (se resolvido)."""
        for symbol in self.symbols:
            symbol.draw(screen)

        # Se o puzzle estiver resolvido, desenha o feixe de luz
        if self.solved:
            pos1 = self.symbols[0].get_position()
            pos3 = self.symbols[2].get_position()
            draw_beam(screen, pos1, pos3, GOLD)

            # Desenha sombra atrás dos símbolos (para efeito visual)
            shadow_points = [
                (pos1[0] - 5, pos1[1] + 5),
                (pos2[0] - 5, pos2[1] + 5),
                (pos3[0] - 5, pos3[1] + 5),
                (pos3[0] + 5, pos3[1] + 5),
                (pos2[0] + 5, pos2[1] + 5),
                (pos1[0] + 5, pos1[1] + 5)
            ]
            draw_shadow(screen, shadow_points, SHADOW_GRAY)
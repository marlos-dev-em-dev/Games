import pygame
import sys
from design import draw_background
from game_logic import Puzzle

# --- CLASSE GAME_CORE (LOOP PRINCIPAL) ---
class GameCore:
    def __init__(self):
        """Inicializa o jogo: tela, clock, puzzle e estado."""
        pygame.init()
        self.screen = pygame.display.set_mode((800, 600))
        pygame.display.set_caption("Illuminati: O Labirinto da Luz")
        self.clock = pygame.time.Clock()
        self.puzzle = Puzzle()  # Inicializa o puzzle
        self.running = True
        self.font = pygame.font.SysFont("Arial", 30)

    def handle_events(self):
        """Trata eventos do teclado (setas para girar, ESC para sair)."""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_LEFT:
                    self.puzzle.rotate(90)  # Gira 90° no sentido horário
                if event.key == pygame.K_RIGHT:
                    self.puzzle.rotate(-90)  # Gira 90° no sentido anti-horário
                if event.key == pygame.K_ESCAPE:
                    self.running = False

        # Verifica se o puzzle foi resolvido
        self.puzzle.check_alignment()

    def draw(self):
        """Desenha tudo na tela: fundo, puzzle e mensagens."""
        draw_background(self.screen, 800, 600)  # Fundo de pedra
        self.puzzle.draw(self.screen)  # Desenha símbolos e feixe de luz

        # Mensagem de vitória (se o puzzle estiver resolvido)
        if self.puzzle.solved:
            victory_text = self.font.render("PUZZLE RESOLVIDO!", True, (255, 215, 0))
            self.screen.blit(victory_text, (800 // 2 - victory_text.get_width() // 2, 50))

        pygame.display.flip()  # Atualiza a tela

    def run(self):
        """Loop principal do jogo."""
        while self.running:
            self.handle_events()  # Trata input
            self.draw()            # Desenha tudo
            self.clock.tick(60)    # 60 FPS
        pygame.quit()
        sys.exit()
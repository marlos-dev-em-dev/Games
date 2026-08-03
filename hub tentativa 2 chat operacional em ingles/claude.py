import pygame
import random
import math
from enum import Enum
from dataclasses import dataclass
from typing import List, Optional

pygame.init()

WIDTH = 800
HEIGHT = 600
FPS = 60

class GameState(Enum):
    MENU = 0
    PLAYING = 1
    GAME_OVER = 2
    LEVEL_COMPLETE = 3

class TileType(Enum):
    EMPTY = 0
    WALL = 1
    WATER = 2
    GOAL = 3

@dataclass
class Vec2:
    x: float
    y: float
    
    def __add__(self, other):
        return Vec2(self.x + other.x, self.y + other.y)
    
    def __mul__(self, scalar):
        return Vec2(self.x * scalar, self.y * scalar)
    
    def distance_to(self, other):
        return math.sqrt((self.x - other.x) ** 2 + (self.y - other.y) ** 2)
    
    def normalized(self):
        length = math.sqrt(self.x ** 2 + self.y ** 2)
        if length == 0:
            return Vec2(0, 0)
        return Vec2(self.x / length, self.y / length)

class Particle:
    def __init__(self, pos: Vec2, vel: Vec2, life: float, color: tuple):
        self.pos = pos
        self.vel = vel
        self.life = life
        self.max_life = life
        self.color = color
    
    def update(self, dt: float):
        self.pos = self.pos + self.vel * dt
        self.life -= dt
    
    def draw(self, surface):
        alpha = self.life / self.max_life
        size = int(4 * alpha)
        if size > 0:
            pygame.draw.circle(surface, self.color, (int(self.pos.x), int(self.pos.y)), size)

class Player:
    def __init__(self, pos: Vec2):
        self.pos = pos
        self.vel = Vec2(0, 0)
        self.radius = 8
        self.max_speed = 250
        self.acceleration = 800
        self.friction = 0.85
        self.charge = 0
        self.max_charge = 2
        self.charge_time = 0.15
        self.is_charging = False
        self.recently_dashed = False
        self.dash_cooldown = 0.3
        self.dash_timer = 0
        
    def update(self, dt: float, keys: dict):
        self.dash_timer = max(0, self.dash_timer - dt)
        
        accel = Vec2(0, 0)
        if keys['up']:
            accel.y -= 1
        if keys['down']:
            accel.y += 1
        if keys['left']:
            accel.x -= 1
        if keys['right']:
            accel.x += 1
        
        if accel.x != 0 or accel.y != 0:
            accel = accel.normalized()
            self.vel = self.vel + accel * self.acceleration * dt
            speed = math.sqrt(self.vel.x ** 2 + self.vel.y ** 2)
            if speed > self.max_speed:
                self.vel = (self.vel.normalized()) * self.max_speed
        
        self.vel = self.vel * self.friction
        self.pos = self.pos + self.vel * dt
        
        if self.pos.x - self.radius < 0:
            self.pos.x = self.radius
            self.vel.x = 0
        if self.pos.x + self.radius > WIDTH:
            self.pos.x = WIDTH - self.radius
            self.vel.x = 0
        if self.pos.y - self.radius < 0:
            self.pos.y = self.radius
            self.vel.y = 0
        if self.pos.y + self.radius > HEIGHT:
            self.pos.y = HEIGHT - self.radius
            self.vel.y = 0
    
    def draw(self, surface):
        pygame.draw.circle(surface, (255, 200, 100), (int(self.pos.x), int(self.pos.y)), self.radius)
        pygame.draw.circle(surface, (255, 150, 50), (int(self.pos.x), int(self.pos.y)), self.radius, 2)
        
        if self.charge > 0:
            charge_radius = self.radius + 3 + (self.charge / self.max_charge) * 5
            alpha = int(100 * (self.charge / self.max_charge))
            s = pygame.Surface((int(charge_radius * 2), int(charge_radius * 2)), pygame.SRCALPHA)
            pygame.draw.circle(s, (255, 255, 150, alpha), (int(charge_radius), int(charge_radius)), int(charge_radius))
            surface.blit(s, (int(self.pos.x - charge_radius), int(self.pos.y - charge_radius)))

class Enemy:
    def __init__(self, pos: Vec2, level: int):
        self.pos = pos
        self.target_pos = pos
        self.vel = Vec2(0, 0)
        self.radius = 7
        self.speed = 80 + level * 15
        self.patrol_distance = 120
        self.patrol_direction = 1
        self.original_x = pos.x
        self.level = level
        
    def update(self, dt: float, player_pos: Vec2, obstacles: List[Vec2]):
        dist_to_player = self.pos.distance_to(player_pos)
        
        if dist_to_player < 180:
            direction = (player_pos + Vec2(-self.pos.x, -self.pos.y)).normalized()
            self.pos = self.pos + direction * self.speed * dt
        else:
            self.pos.x += self.patrol_direction * self.speed * 0.4 * dt
            
            if abs(self.pos.x - self.original_x) > self.patrol_distance:
                self.patrol_direction *= -1
        
        if self.pos.x < self.radius:
            self.pos.x = self.radius
        if self.pos.x > WIDTH - self.radius:
            self.pos.x = WIDTH - self.radius
        if self.pos.y < self.radius:
            self.pos.y = self.radius
        if self.pos.y > HEIGHT - self.radius:
            self.pos.y = HEIGHT - self.radius
    
    def draw(self, surface):
        pygame.draw.circle(surface, (255, 100, 100), (int(self.pos.x), int(self.pos.y)), self.radius)
        pygame.draw.circle(surface, (200, 50, 50), (int(self.pos.x), int(self.pos.y)), self.radius, 2)

class Projectile:
    def __init__(self, pos: Vec2, direction: Vec2, speed: float = 400):
        self.pos = pos
        self.vel = direction.normalized() * speed
        self.radius = 4
        self.lifetime = 5
        self.age = 0
    
    def update(self, dt: float):
        self.pos = self.pos + self.vel * dt
        self.age += dt
    
    def is_alive(self):
        return self.age < self.lifetime and 0 <= self.pos.x < WIDTH and 0 <= self.pos.y < HEIGHT
    
    def draw(self, surface):
        pygame.draw.circle(surface, (255, 255, 100), (int(self.pos.x), int(self.pos.y)), self.radius)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Nexus")
        self.clock = pygame.time.Clock()
        self.running = True
        self.state = GameState.MENU
        self.font_large = pygame.font.Font(None, 48)
        self.font_medium = pygame.font.Font(None, 32)
        self.font_small = pygame.font.Font(None, 24)
        
        self.level = 0
        self.score = 0
        self.reset_game()
    
    def reset_game(self):
        self.level = 0
        self.score = 0
        self.load_level(0)
    
    def load_level(self, level_num: int):
        self.level = level_num
        self.player = Player(Vec2(WIDTH // 2, HEIGHT - 50))
        self.enemies: List[Enemy] = []
        self.projectiles: List[Projectile] = []
        self.particles: List[Particle] = []
        self.goal_pos = Vec2(WIDTH // 2, 50)
        
        enemy_count = 1 + (level_num // 3)
        for i in range(enemy_count):
            x = random.randint(50, WIDTH - 50)
            y = random.randint(80, 300)
            self.enemies.append(Enemy(Vec2(x, y), level_num))
        
        self.level_start_time = pygame.time.get_ticks() / 1000.0
        self.state = GameState.PLAYING
    
    def spawn_particles(self, pos: Vec2, count: int, color: tuple, vel_range: float = 100):
        for _ in range(count):
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(50, vel_range)
            vel = Vec2(math.cos(angle) * speed, math.sin(angle) * speed)
            life = random.uniform(0.3, 0.8)
            self.particles.append(Particle(pos, vel, life, color))
    
    def update(self, dt: float):
        if self.state == GameState.PLAYING:
            keys = {
                'up': pygame.key.get_pressed()[pygame.K_UP] or pygame.key.get_pressed()[pygame.K_w],
                'down': pygame.key.get_pressed()[pygame.K_DOWN] or pygame.key.get_pressed()[pygame.K_s],
                'left': pygame.key.get_pressed()[pygame.K_LEFT] or pygame.key.get_pressed()[pygame.K_a],
                'right': pygame.key.get_pressed()[pygame.K_RIGHT] or pygame.key.get_pressed()[pygame.K_d],
            }
            
            self.player.update(dt, keys)
            
            for enemy in self.enemies:
                enemy.update(dt, self.player.pos, [])
            
            for projectile in self.projectiles[:]:
                projectile.update(dt)
                if not projectile.is_alive():
                    self.projectiles.remove(projectile)
                else:
                    for enemy in self.enemies[:]:
                        if projectile.pos.distance_to(enemy.pos) < projectile.radius + enemy.radius:
                            self.enemies.remove(enemy)
                            self.projectiles.remove(projectile)
                            self.score += 10 + self.level * 5
                            self.spawn_particles(enemy.pos, 10, (255, 100, 100), 200)
                            break
            
            for particle in self.particles[:]:
                particle.update(dt)
                if particle.life <= 0:
                    self.particles.remove(particle)
            
            for enemy in self.enemies:
                if self.player.pos.distance_to(enemy.pos) < self.player.radius + enemy.radius:
                    self.state = GameState.GAME_OVER
            
            if self.player.pos.distance_to(self.goal_pos) < self.player.radius + 15:
                self.state = GameState.LEVEL_COMPLETE
                self.score += 50 + self.level * 10
                self.spawn_particles(self.goal_pos, 20, (100, 255, 100), 250)
    
    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if self.state == GameState.MENU:
                    if event.key == pygame.K_SPACE:
                        self.load_level(0)
                elif self.state == GameState.PLAYING:
                    if event.key == pygame.K_SPACE:
                        if len(self.enemies) > 0:
                            angle = random.uniform(-0.3, 0.3)
                            direction = Vec2(0, -1)
                            direction = Vec2(
                                direction.x * math.cos(angle) - direction.y * math.sin(angle),
                                direction.x * math.sin(angle) + direction.y * math.cos(angle)
                            )
                            projectile = Projectile(self.player.pos, direction)
                            self.projectiles.append(projectile)
                            self.spawn_particles(self.player.pos, 5, (255, 200, 100), 150)
                elif self.state == GameState.GAME_OVER:
                    if event.key == pygame.K_SPACE:
                        self.reset_game()
                    elif event.key == pygame.K_ESCAPE:
                        self.state = GameState.MENU
                elif self.state == GameState.LEVEL_COMPLETE:
                    if event.key == pygame.K_SPACE:
                        self.load_level(self.level + 1)
    
    def draw(self):
        self.screen.fill((20, 20, 30))
        
        if self.state == GameState.MENU:
            title = self.font_large.render("NEXUS", True, (100, 200, 255))
            subtitle = self.font_medium.render("Reach the Nexus", True, (150, 150, 200))
            instructions = self.font_small.render("Arrow Keys or WASD to move | SPACE to shoot", True, (150, 150, 150))
            start = self.font_medium.render("Press SPACE to start", True, (100, 255, 100))
            
            self.screen.blit(title, (WIDTH // 2 - title.get_width() // 2, HEIGHT // 2 - 100))
            self.screen.blit(subtitle, (WIDTH // 2 - subtitle.get_width() // 2, HEIGHT // 2 - 20))
            self.screen.blit(instructions, (WIDTH // 2 - instructions.get_width() // 2, HEIGHT // 2 + 40))
            self.screen.blit(start, (WIDTH // 2 - start.get_width() // 2, HEIGHT // 2 + 100))
        
        elif self.state == GameState.PLAYING:
            pygame.draw.circle(self.screen, (100, 255, 100), (int(self.goal_pos.x), int(self.goal_pos.y)), 15)
            pygame.draw.circle(self.screen, (50, 200, 50), (int(self.goal_pos.x), int(self.goal_pos.y)), 15, 2)
            
            self.player.draw(self.screen)
            
            for enemy in self.enemies:
                enemy.draw(self.screen)
            
            for projectile in self.projectiles:
                projectile.draw(self.screen)
            
            for particle in self.particles:
                particle.draw(self.screen)
            
            level_text = self.font_medium.render(f"Level {self.level + 1}", True, (200, 200, 200))
            score_text = self.font_small.render(f"Score: {self.score}", True, (200, 200, 200))
            enemy_text = self.font_small.render(f"Enemies: {len(self.enemies)}", True, (200, 100, 100))
            
            self.screen.blit(level_text, (20, 20))
            self.screen.blit(score_text, (20, 60))
            self.screen.blit(enemy_text, (WIDTH - enemy_text.get_width() - 20, 20))
        
        elif self.state == GameState.GAME_OVER:
            game_over = self.font_large.render("GAME OVER", True, (255, 100, 100))
            final_score = self.font_medium.render(f"Score: {self.score}", True, (200, 200, 200))
            level_reached = self.font_small.render(f"Level Reached: {self.level + 1}", True, (200, 200, 200))
            restart = self.font_medium.render("Press SPACE to restart", True, (100, 200, 100))
            menu = self.font_small.render("Press ESC for menu", True, (150, 150, 150))
            
            self.screen.blit(game_over, (WIDTH // 2 - game_over.get_width() // 2, HEIGHT // 2 - 100))
            self.screen.blit(final_score, (WIDTH // 2 - final_score.get_width() // 2, HEIGHT // 2))
            self.screen.blit(level_reached, (WIDTH // 2 - level_reached.get_width() // 2, HEIGHT // 2 + 50))
            self.screen.blit(restart, (WIDTH // 2 - restart.get_width() // 2, HEIGHT // 2 + 120))
            self.screen.blit(menu, (WIDTH // 2 - menu.get_width() // 2, HEIGHT // 2 + 170))
        
        elif self.state == GameState.LEVEL_COMPLETE:
            complete = self.font_large.render("NEXUS REACHED", True, (100, 255, 100))
            level_score = self.font_medium.render(f"Level Score: +{50 + self.level * 10}", True, (200, 200, 200))
            total_score = self.font_small.render(f"Total Score: {self.score}", True, (200, 200, 200))
            next_level = self.font_medium.render("Press SPACE for next level", True, (100, 200, 100))
            
            self.screen.blit(complete, (WIDTH // 2 - complete.get_width() // 2, HEIGHT // 2 - 100))
            self.screen.blit(level_score, (WIDTH // 2 - level_score.get_width() // 2, HEIGHT // 2))
            self.screen.blit(total_score, (WIDTH // 2 - total_score.get_width() // 2, HEIGHT // 2 + 50))
            self.screen.blit(next_level, (WIDTH // 2 - next_level.get_width() // 2, HEIGHT // 2 + 120))
        
        pygame.display.flip()
    
    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            self.handle_input()
            self.update(dt)
            self.draw()
        
        pygame.quit()

if __name__ == "__main__":
    game = Game()
    game.run()

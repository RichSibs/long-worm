import pygame
import random
import sys
import os
import sqlite3
from typing import List, Tuple

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 1200  # Swapped for landscape
WINDOW_HEIGHT = 800
GRID_SIZE = 40  # Size of each grid cell
GRID_WIDTH = WINDOW_WIDTH // GRID_SIZE
GRID_HEIGHT = WINDOW_HEIGHT // GRID_SIZE

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
DARK_GREEN = (0, 100, 0)
LIGHT_GREEN = (0, 120, 0)
YELLOW = (255, 255, 0)
BLUE = (0, 0, 255)

# Soccer pitch measurements (in grid units)
PITCH_WIDTH = GRID_WIDTH - 2  # Leave 1 grid unit border on each side
PITCH_HEIGHT = GRID_HEIGHT - 2
PENALTY_AREA_WIDTH = 6   # About 16% of half pitch width
PENALTY_AREA_HEIGHT = 14  # About 40% of pitch height
PENALTY_ARC_RADIUS = 3    # Radius for the penalty area arc
CENTER_CIRCLE_RADIUS = 3

# Character Types
INVESTMENT_FUND = "investment"
FOOTBALL_OWNER = "football"

# Load and scale images
def load_and_scale_image(image_path: str, size: Tuple[int, int]) -> pygame.Surface:
    try:
        image = pygame.image.load(image_path)
        return pygame.transform.scale(image, size)
    except:
        surface = pygame.Surface(size)
        surface.fill(RED if "Unknown" in image_path else WHITE)
        return surface

# Load images and fonts
HEAD_SIZE = (GRID_SIZE, GRID_SIZE)
THUMBNAIL_SIZE = (GRID_SIZE * 3, GRID_SIZE * 3)  # Larger size for selection thumbnails
FOOD_SIZE = (int(GRID_SIZE * 1.8), GRID_SIZE)  # Make food rectangular like a banknote

# Load character images
investment_images = {
    "right": load_and_scale_image("bald_man_right.png", HEAD_SIZE),
    "left": load_and_scale_image("bald_man_left.png", HEAD_SIZE),
    "up": load_and_scale_image("bald_man_up.png", HEAD_SIZE),
    "down": load_and_scale_image("bald_man_down.png", HEAD_SIZE),
    "thumbnail": load_and_scale_image("bald_man_left.png", THUMBNAIL_SIZE)
}

football_images = {
    "right": load_and_scale_image("AF_facing_right.png", HEAD_SIZE),
    "left": load_and_scale_image("AF_facing_left.png", HEAD_SIZE),
    "up": load_and_scale_image("AF_facing_up.png", HEAD_SIZE),
    "down": load_and_scale_image("AF_facing_down.png", HEAD_SIZE),
    "thumbnail": load_and_scale_image("AF_facing_left.png", THUMBNAIL_SIZE)
}

food_image = load_and_scale_image("five_pound_note.png", FOOD_SIZE)
game_font = pygame.font.SysFont('Arial Black', 36)  # Bold font for score
title_font = pygame.font.SysFont('Arial Black', 48)  # Larger bold font for game over

# Initialize database
def init_database():
    conn = sqlite3.connect('highscores.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS highscores
                 (name TEXT, score INTEGER)''')
    conn.commit()
    conn.close()

def get_top_scores():
    try:
        conn = sqlite3.connect('highscores.db')
        c = conn.cursor()
        c.execute('SELECT name, score FROM highscores ORDER BY score DESC LIMIT 10')
        scores = c.fetchall()
        conn.close()
        print(f"Loaded {len(scores)} scores from database")  # Debug print
        return scores
    except Exception as e:
        print(f"Error loading scores: {e}")
        return []

def save_score(name, score):
    try:
        conn = sqlite3.connect('highscores.db')
        c = conn.cursor()
        c.execute('INSERT INTO highscores (name, score) VALUES (?, ?)', (name, score))
        conn.commit()
        print(f"Score saved: {name} - £{score*5}")  # Debug print
        conn.close()
    except Exception as e:
        print(f"Error saving score: {e}")

# Initialize the database
init_database()

class CharacterSelect:
    def __init__(self, screen):
        self.screen = screen
        self.selected = None
        self.hover = None

    def handle_input(self, event):
        if event.type == pygame.MOUSEMOTION:
            mouse_pos = pygame.mouse.get_pos()
            # Check if mouse is over investment fund option
            if self.get_investment_rect().collidepoint(mouse_pos):
                self.hover = INVESTMENT_FUND
            # Check if mouse is over football owner option
            elif self.get_football_rect().collidepoint(mouse_pos):
                self.hover = FOOTBALL_OWNER
            else:
                self.hover = None

        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            if self.get_investment_rect().collidepoint(mouse_pos):
                self.selected = INVESTMENT_FUND
            elif self.get_football_rect().collidepoint(mouse_pos):
                self.selected = FOOTBALL_OWNER

    def get_investment_rect(self):
        return pygame.Rect(WINDOW_WIDTH//4 - THUMBNAIL_SIZE[0]//2,
                         WINDOW_HEIGHT//2 - THUMBNAIL_SIZE[1]//2,
                         THUMBNAIL_SIZE[0], THUMBNAIL_SIZE[1])

    def get_football_rect(self):
        return pygame.Rect(3*WINDOW_WIDTH//4 - THUMBNAIL_SIZE[0]//2,
                         WINDOW_HEIGHT//2 - THUMBNAIL_SIZE[1]//2,
                         THUMBNAIL_SIZE[0], THUMBNAIL_SIZE[1])

    def draw(self):
        self.screen.fill(BLACK)
        
        # Draw title
        title = title_font.render("Choose Your Character", True, YELLOW)
        title_rect = title.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//4))
        self.screen.blit(title, title_rect)

        # Draw investment fund option
        inv_rect = self.get_investment_rect()
        pygame.draw.rect(self.screen, 
                        BLUE if self.hover == INVESTMENT_FUND else WHITE,
                        inv_rect, 3)
        self.screen.blit(investment_images["thumbnail"], inv_rect)
        inv_text = game_font.render("Investment Fund", True, WHITE)
        inv_text_rect = inv_text.get_rect(center=(WINDOW_WIDTH//4, WINDOW_HEIGHT//2 + THUMBNAIL_SIZE[1]))
        self.screen.blit(inv_text, inv_text_rect)

        # Draw football owner option
        foot_rect = self.get_football_rect()
        pygame.draw.rect(self.screen,
                        BLUE if self.hover == FOOTBALL_OWNER else WHITE,
                        foot_rect, 3)
        self.screen.blit(football_images["thumbnail"], foot_rect)
        foot_text = game_font.render("Football Team Owner", True, WHITE)
        foot_text_rect = foot_text.get_rect(center=(3*WINDOW_WIDTH//4, WINDOW_HEIGHT//2 + THUMBNAIL_SIZE[1]))
        self.screen.blit(foot_text, foot_text_rect)

        pygame.display.flip()

class Snake:
    def __init__(self, character_type):
        self.body = [(GRID_WIDTH // 4, GRID_HEIGHT // 2)]
        self.direction = (1, 0)
        self.grow = False
        self.character_type = character_type
        self.head_images = {
            (1, 0): football_images["right"] if character_type == FOOTBALL_OWNER else investment_images["right"],
            (-1, 0): football_images["left"] if character_type == FOOTBALL_OWNER else investment_images["left"],
            (0, -1): football_images["up"] if character_type == FOOTBALL_OWNER else investment_images["up"],
            (0, 1): football_images["down"] if character_type == FOOTBALL_OWNER else investment_images["down"]
        }
        self.segment_scales = [1.0] * len(self.body)  # Track scale of each segment
        self.food_position = -1  # Track which segment the food is passing through (-1 means not in snake)

    def update_food_animation(self):
        if self.food_position >= 0:
            # Reset previous segment if it exists
            if self.food_position < len(self.segment_scales):
                self.segment_scales[self.food_position] = 1.0
            
            # Move food to next segment
            self.food_position += 1
            
            # If food reaches end, mark for growth
            if self.food_position >= len(self.segment_scales):
                self.food_position = -1
                self.grow = True
            else:
                # Scale up current segment
                self.segment_scales[self.food_position] = 1.2

    def move(self) -> None:
        head = self.body[0]
        new_head = (head[0] + self.direction[0], head[1] + self.direction[1])
        
        if not self.grow:
            self.body.pop()
        else:
            self.grow = False
            
        self.body.insert(0, new_head)

    def get_rotated_head(self) -> pygame.Surface:
        return self.head_images[self.direction]

    def check_collision(self) -> bool:
        head = self.body[0]
        
        # Check wall collision
        if (head[0] < 0 or head[0] >= GRID_WIDTH or 
            head[1] < 0 or head[1] >= GRID_HEIGHT):
            return True
            
        # Check self collision
        if head in self.body[1:]:
            return True
            
        return False

class Food:
    def __init__(self):
        self.position = self.generate_position()
        self.width = int(GRID_SIZE * 1.8)  # Width of the food image
        self.height = GRID_SIZE

    def generate_position(self):
        return (random.randint(0, GRID_WIDTH - 2), random.randint(0, GRID_HEIGHT - 1))

    def get_occupied_cells(self):
        # Return both cells the food occupies (for wider food image)
        return [(self.position[0], self.position[1]), 
                (self.position[0] + 1, self.position[1])]

class HighScoreEntry:
    def __init__(self, screen, score):
        self.screen = screen
        self.score = score
        self.name = ""
        self.done = False
        self.max_chars = 7  # Limit name length to 7 characters

    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_RETURN and self.name:
                self.save_score()
                self.done = True
            elif event.key == pygame.K_BACKSPACE:
                self.name = self.name[:-1]
            elif len(self.name) < self.max_chars and event.unicode.isalnum():
                self.name += event.unicode.upper()

    def save_score(self):
        print(f"Saving score for {self.name}: £{self.score*5}")  # Debug print
        save_score(self.name.strip(), self.score)

class HighScoreDisplay:
    def __init__(self, screen):
        self.screen = screen
        self.done = False
        self.retro_font = pygame.font.SysFont('Arial Black', 36)
        self.title_font = pygame.font.SysFont('Arial Black', 48)
        self.scores = get_top_scores()  # Load scores when display is created
        print("Initialized high score display")  # Debug print

    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_r:
                self.done = True

    def draw(self):
        self.screen.fill(BLACK)

        # Draw title
        title = self.title_font.render("HIGH SCORES", True, YELLOW)
        title_rect = title.get_rect(center=(WINDOW_WIDTH//2, 80))
        self.screen.blit(title, title_rect)

        # Display scores
        start_y = 160
        if not self.scores:  # If no scores are available
            no_scores_text = self.retro_font.render("NO SCORES YET!", True, WHITE)
            no_scores_rect = no_scores_text.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT//2))
            self.screen.blit(no_scores_text, no_scores_rect)
        else:
            for i, (name, score) in enumerate(self.scores, 1):
                # Draw position number with retro effect
                pos_color = YELLOW if i == 1 else BLUE if i == 2 else RED if i == 3 else WHITE
                pos_text = self.retro_font.render(f"{i:2d}", True, pos_color)
                self.screen.blit(pos_text, (WINDOW_WIDTH//2 - 200, start_y))

                # Draw name
                name_text = self.retro_font.render(f"{name:<10}", True, pos_color)
                self.screen.blit(name_text, (WINDOW_WIDTH//2 - 150, start_y))

                # Draw score with £ symbol
                score_text = self.retro_font.render(f"£{score*5:,}", True, pos_color)
                self.screen.blit(score_text, (WINDOW_WIDTH//2 + 50, start_y))

                start_y += 50

        # Draw instruction
        instruction = self.retro_font.render("PRESS R TO RESTART", True, YELLOW)
        instruction_rect = instruction.get_rect(center=(WINDOW_WIDTH//2, WINDOW_HEIGHT - 80))
        self.screen.blit(instruction, instruction_rect)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Long Worm - Football Capitalist Edition - Chase the money to build your football empire!")
        self.clock = pygame.time.Clock()
        self.high_score_entry = None
        self.high_score_display = None
        self.character_select = CharacterSelect(self.screen)
        self.selected_character = None
        self.reset_game()

    def draw_pitch(self):
        # Draw alternating stripes
        stripe_width = GRID_SIZE * 2
        for x in range(0, WINDOW_WIDTH, stripe_width):
            stripe_color = LIGHT_GREEN if (x // stripe_width) % 2 == 0 else DARK_GREEN
            pygame.draw.rect(self.screen, stripe_color, 
                           (x, 0, stripe_width, WINDOW_HEIGHT))

        # Draw pitch outline
        pygame.draw.rect(self.screen, WHITE, 
                        (GRID_SIZE, GRID_SIZE, 
                         (GRID_WIDTH-2)*GRID_SIZE, (GRID_HEIGHT-2)*GRID_SIZE), 2)

        # Draw center line
        mid_x = WINDOW_WIDTH // 2
        pygame.draw.line(self.screen, WHITE, 
                        (mid_x, GRID_SIZE), 
                        (mid_x, WINDOW_HEIGHT-GRID_SIZE), 2)

        # Draw center circle
        pygame.draw.circle(self.screen, WHITE,
                         (WINDOW_WIDTH//2, WINDOW_HEIGHT//2),
                         CENTER_CIRCLE_RADIUS * GRID_SIZE, 2)

        # Draw penalty areas
        penalty_width = PENALTY_AREA_WIDTH * GRID_SIZE
        penalty_height = PENALTY_AREA_HEIGHT * GRID_SIZE
        
        # Left penalty area
        penalty_left_x = GRID_SIZE
        penalty_left_y = WINDOW_HEIGHT//2 - penalty_height//2
        pygame.draw.rect(self.screen, WHITE,
                        (penalty_left_x, penalty_left_y,
                         penalty_width, penalty_height), 2)
        
        # Left penalty arc (facing away from goal)
        arc_center_x = penalty_left_x + penalty_width
        pygame.draw.arc(self.screen, WHITE,
                       (arc_center_x - PENALTY_ARC_RADIUS * GRID_SIZE,
                        penalty_left_y + penalty_height//4,
                        PENALTY_ARC_RADIUS * GRID_SIZE * 2,
                        penalty_height//2),
                       -1.57079, 1.57079, 2)
        
        # Right penalty area
        penalty_right_x = WINDOW_WIDTH - GRID_SIZE - penalty_width
        pygame.draw.rect(self.screen, WHITE,
                        (penalty_right_x, penalty_left_y,
                         penalty_width, penalty_height), 2)
        
        # Right penalty arc (facing away from goal)
        arc_center_x = penalty_right_x
        pygame.draw.arc(self.screen, WHITE,
                       (arc_center_x - PENALTY_ARC_RADIUS * GRID_SIZE,
                        penalty_left_y + penalty_height//4,
                        PENALTY_ARC_RADIUS * GRID_SIZE * 2,
                        penalty_height//2),
                       1.57079, 4.71238, 2)

        # Draw six-yard boxes
        six_yard_width = PENALTY_AREA_WIDTH // 2 * GRID_SIZE
        six_yard_height = PENALTY_AREA_HEIGHT // 2 * GRID_SIZE
        six_yard_y = WINDOW_HEIGHT//2 - six_yard_height//2

        # Left six-yard box
        pygame.draw.rect(self.screen, WHITE,
                        (GRID_SIZE, six_yard_y,
                         six_yard_width, six_yard_height), 2)

        # Right six-yard box
        pygame.draw.rect(self.screen, WHITE,
                        (WINDOW_WIDTH - GRID_SIZE - six_yard_width, six_yard_y,
                         six_yard_width, six_yard_height), 2)

    def reset_game(self):
        global snake, food
        self.selected_character = None  # Reset character selection
        self.score = 0
        self.game_over = False
        self.speed = 10
        snake.body = [(GRID_WIDTH // 4, GRID_HEIGHT // 2)]
        snake.direction = (1, 0)
        snake.grow = False
        snake.segment_scales = [1.0] * len(snake.body)
        snake.food_position = -1

    def handle_input(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_UP:
                    if snake.direction != (0, 1):
                        snake.direction = (0, -1)
                elif event.key == pygame.K_DOWN:
                    if snake.direction != (0, -1):
                        snake.direction = (0, 1)
                elif event.key == pygame.K_LEFT:
                    if snake.direction != (1, 0):
                        snake.direction = (-1, 0)
                elif event.key == pygame.K_RIGHT:
                    if snake.direction != (-1, 0):
                        snake.direction = (1, 0)
                elif event.key == pygame.K_r and self.game_over:
                    self.reset_game()

    def update(self):
        if not self.game_over:
            # Update snake position
            head = snake.body[0]
            new_head = (head[0] + snake.direction[0], head[1] + snake.direction[1])

            # Check for collisions with walls
            if (new_head[0] < 0 or new_head[0] >= GRID_WIDTH or
                new_head[1] < 0 or new_head[1] >= GRID_HEIGHT):
                self.game_over = True
                return

            # Check for collisions with self
            if new_head in snake.body:
                self.game_over = True
                return

            # Move snake
            snake.body.insert(0, new_head)
            
            # Check for food collision
            food_cells = food.get_occupied_cells()
            if new_head in food_cells:
                # Start food animation through snake
                snake.food_position = 0
                snake.segment_scales[0] = 1.2
                self.score += 1
                food.position = food.generate_position()
                self.speed = min(20, 10 + self.score)
            elif not snake.grow:
                snake.body.pop()

            # Update food animation
            snake.update_food_animation()

    def draw(self):
        self.draw_pitch()
        
        # Draw snake with scaling
        for i, segment in enumerate(snake.body):
            if i == 0:
                # Draw head
                head_img = snake.head_images[snake.direction]
                scale = snake.segment_scales[i]
                scaled_size = int(GRID_SIZE * scale)
                offset = (scaled_size - GRID_SIZE) // 2
                self.screen.blit(pygame.transform.scale(head_img, (scaled_size, scaled_size)),
                               (segment[0] * GRID_SIZE - offset, 
                                segment[1] * GRID_SIZE - offset))
            else:
                # Draw body segment with scaling
                scale = snake.segment_scales[i] if i < len(snake.segment_scales) else 1.0
                scaled_size = int(GRID_SIZE * scale)
                offset = (scaled_size - GRID_SIZE) // 2
                pygame.draw.rect(self.screen, WHITE,
                               (segment[0] * GRID_SIZE - offset,
                                segment[1] * GRID_SIZE - offset,
                                scaled_size - 1, scaled_size - 1))

        # Draw food (both cells)
        for cell in food.get_occupied_cells():
            self.screen.blit(food_image,
                           (cell[0] * GRID_SIZE,
                            cell[1] * GRID_SIZE))

        # Draw score (in £5 increments)
        score_text = game_font.render(f"£{self.score*5:,}", True, WHITE)
        self.screen.blit(score_text, (10, 10))

        # Draw game over message
        if self.game_over:
            game_over_text = title_font.render("Game Over! Press R to restart", True, WHITE)
            text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
            self.screen.blit(game_over_text, text_rect)

        pygame.display.flip()

    def handle_game_over(self):
        if self.high_score_entry is None:
            self.high_score_entry = HighScoreEntry(self.screen, self.score)
        
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            self.high_score_entry.handle_input(event)

        self.high_score_entry.draw()
        pygame.display.flip()

        if self.high_score_entry.done:
            self.high_score_entry = None
            self.high_score_display = HighScoreDisplay(self.screen)

    def handle_high_scores(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            self.high_score_display.handle_input(event)

        self.high_score_display.draw()
        pygame.display.flip()

        if self.high_score_display.done:
            self.high_score_display = None
            self.reset_game()  # This will now reset character selection too

    def run(self):
        while True:
            if not self.selected_character:
                for event in pygame.event.get():
                    if event.type == pygame.QUIT:
                        pygame.quit()
                        sys.exit()
                    self.character_select.handle_input(event)
                
                self.character_select.draw()
                
                if self.character_select.selected:
                    self.selected_character = self.character_select.selected
                    self.reset_game()
            elif self.game_over:
                if self.high_score_entry is not None:
                    self.handle_game_over()
                elif self.high_score_display is not None:
                    self.handle_high_scores()
                else:
                    self.high_score_entry = HighScoreEntry(self.screen, self.score)
            else:
                self.handle_input()
                self.update()
                self.draw()
                self.clock.tick(self.speed)

if __name__ == "__main__":
    game = Game()
    game.run() 
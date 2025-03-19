# Long Worm Game

A classic Snake game implementation using Python and Pygame.

## Requirements

- Python 3.6 or higher
- Pygame 2.5.2

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

## How to Play

Run the game:
```bash
python game.py
```

### Controls

- **↑**: Move Up
- **←**: Move Left
- **→**: Move Right
- **↓**: Move Down
- **R**: Restart game (when game is over)

### Game Rules

1. Control the snake using the arrow keys
2. Eat the red food to grow longer and increase your score
3. Avoid hitting the walls or the snake's own body
4. The game speed increases as you collect more food
5. Try to achieve the highest score possible!

## Features

- Smooth controls
- Progressive difficulty (speed increases with score)
- Score display
- Game over screen with restart option
- Clean, modern implementation 
// Game constants
const GRID_SIZE = 40;
const CELL_SIZE = 20;
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 800;
const GRID_WIDTH = GAME_WIDTH / CELL_SIZE;
const GRID_HEIGHT = GAME_HEIGHT / CELL_SIZE;

const INVESTMENT_FUND = "investment";
const FOOTBALL_OWNER = "football";

// Game state
let snake = [];
let food = {};
let direction = 'RIGHT';
let score = 0;
let gameOver = false;
let gameStarted = false;
let highScores = [];

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Load images
const headRight = new Image();
const headLeft = new Image();
const headUp = new Image();
const headDown = new Image();
const foodImg = new Image();

headRight.src = 'bald_man_right.png';
headLeft.src = 'bald_man_left.png';
headUp.src = 'bald_man_up.png';
headDown.src = 'bald_man_down.png';
foodImg.src = 'five_pound_note.png';

class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
        this.gridSize = GRID_SIZE;
        this.score = 0;
        this.gameOver = false;
        this.speed = 50; // Slower initial speed
        this.lastRenderTime = 0;
        this.characterType = null;
        this.animationFrameId = null;
        this.highScores = [];
        this.frameCount = 0;

        // Load all images
        this.images = {
            investment: {
                right: this.loadImage('bald_man_right.png'),
                left: this.loadImage('bald_man_left.png'),
                up: this.loadImage('bald_man_up.png'),
                down: this.loadImage('bald_man_down.png')
            },
            football: {
                right: this.loadImage('AF_facing_right.png'),
                left: this.loadImage('AF_facing_left.png'),
                up: this.loadImage('AF_facing_up.png'),
                down: this.loadImage('AF_facing_down.png')
            },
            food: this.loadImage('five_pound_note.png')
        };

        // Character selection screen elements
        this.setupCharacterSelection();
        this.loadHighScores();
    }

    setupCharacterSelection() {
        const selectionDiv = document.getElementById('character-select');
        if (!selectionDiv) {
            const div = document.createElement('div');
            div.id = 'character-select';
            div.style.textAlign = 'center';
            div.style.marginBottom = '20px';
            
            const title = document.createElement('h2');
            title.textContent = 'Choose Your Character';
            title.style.color = '#FFD700';
            div.appendChild(title);

            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '40px';

            const investmentBtn = this.createCharacterButton(INVESTMENT_FUND, 'Investment Fund', 'bald_man_left.png');
            const footballBtn = this.createCharacterButton(FOOTBALL_OWNER, 'Football Team Owner', 'AF_facing_left.png');

            buttonContainer.appendChild(investmentBtn);
            buttonContainer.appendChild(footballBtn);
            div.appendChild(buttonContainer);

            document.getElementById('game-container').insertBefore(div, this.canvas);
        }
    }

    createCharacterButton(type, text, image) {
        const container = document.createElement('div');
        container.style.cursor = 'pointer';
        container.style.padding = '10px';
        container.style.border = '2px solid white';
        container.style.borderRadius = '10px';
        container.style.backgroundColor = '#333';

        const img = document.createElement('img');
        img.src = image;
        img.style.width = '120px';
        img.style.height = '120px';
        img.style.display = 'block';
        img.style.margin = '0 auto';

        const label = document.createElement('div');
        label.textContent = text;
        label.style.color = 'white';
        label.style.marginTop = '10px';

        container.appendChild(img);
        container.appendChild(label);

        container.addEventListener('mouseover', () => {
            container.style.backgroundColor = '#444';
            container.style.borderColor = '#FFD700';
        });

        container.addEventListener('mouseout', () => {
            container.style.backgroundColor = '#333';
            container.style.borderColor = 'white';
        });

        container.addEventListener('click', () => {
            this.selectCharacter(type);
        });

        return container;
    }

    selectCharacter(type) {
        this.characterType = type;
        document.getElementById('character-select').style.display = 'none';
        this.startGame();
    }

    async loadHighScores() {
        try {
            const response = await fetch('http://localhost:3000/api/scores');
            this.highScores = await response.json();
        } catch (error) {
            console.error('Error loading scores:', error);
            this.highScores = [];
        }
    }

    async saveScore() {
        // Removed high score functionality
        this.gameOver = true;
    }

    resetGame() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.score = 0;
        this.gameOver = false;
        this.speed = 50; // Reset to initial slower speed
        this.lastRenderTime = 0;
        this.characterType = null;
        const selectionDiv = document.getElementById('character-select');
        if (selectionDiv) {
            selectionDiv.style.display = 'block';
        } else {
            this.setupCharacterSelection();
        }
        document.getElementById('score').textContent = 'Score: £0';
    }

    startGame() {
        this.snake = new Snake(this.characterType, this.images);
        this.food = this.generateFood();
        this.gameLoop();
    }

    generateFood() {
        const position = {
            x: Math.floor(Math.random() * (this.canvas.width / this.gridSize - 1)),  // -1 to account for width
            y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
        };
        return position;
    }

    getFoodCells() {
        return [
            {x: this.food.x, y: this.food.y},
            {x: this.food.x + 1, y: this.food.y}
        ];
    }

    drawPitch() {
        // Draw alternating stripes
        const stripeWidth = this.gridSize * 2;
        for (let x = 0; x < this.canvas.width; x += stripeWidth) {
            this.ctx.fillStyle = (x / stripeWidth) % 2 === 0 ? '#3a702f' : '#2d5a27';
            this.ctx.fillRect(x, 0, stripeWidth, this.canvas.height);
        }

        // Draw pitch markings
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;

        // Outline
        this.ctx.strokeRect(
            this.gridSize, 
            this.gridSize, 
            this.canvas.width - 2 * this.gridSize, 
            this.canvas.height - 2 * this.gridSize
        );

        // Center line
        const midX = this.canvas.width / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(midX, this.gridSize);
        this.ctx.lineTo(midX, this.canvas.height - this.gridSize);
        this.ctx.stroke();

        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(
            this.canvas.width / 2,
            this.canvas.height / 2,
            3 * this.gridSize,
            0,
            Math.PI * 2
        );
        this.ctx.stroke();

        // Penalty areas
        const penaltyWidth = 6 * this.gridSize;
        const penaltyHeight = 14 * this.gridSize;
        const penaltyY = (this.canvas.height - penaltyHeight) / 2;

        // Left penalty area
        this.ctx.strokeRect(this.gridSize, penaltyY, penaltyWidth, penaltyHeight);
        // Right penalty area
        this.ctx.strokeRect(
            this.canvas.width - this.gridSize - penaltyWidth,
            penaltyY,
            penaltyWidth,
            penaltyHeight
        );
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pitch
        this.drawPitch();

        // Draw snake with scaling
        for (let i = 0; i < this.snake.body.length; i++) {
            const segment = this.snake.body[i];
            const scale = this.snake.segmentScales[i] || 1.0;
            const scaledSize = this.gridSize * scale;
            const offset = (scaledSize - this.gridSize) / 2;

            if (i === 0) {
                // Draw head
                const headImage = this.snake.getHeadImage();
                this.ctx.drawImage(
                    headImage,
                    segment.x * this.gridSize - offset,
                    segment.y * this.gridSize - offset,
                    scaledSize,
                    scaledSize
                );
            } else {
                // Draw body segment
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(
                    segment.x * this.gridSize - offset,
                    segment.y * this.gridSize - offset,
                    scaledSize - 1,
                    scaledSize - 1
                );
            }
        }

        // Draw food (single image spanning two cells)
        this.ctx.drawImage(
            this.images.food,
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize * 1.8,
            this.gridSize
        );

        // Draw score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`£${this.score * 5}`, 10, 40);

        // Draw game over
        if (this.gameOver) {
            // Semi-transparent black overlay
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Game Over text
            this.ctx.fillStyle = '#FFD700'; // Gold color
            this.ctx.font = 'bold 64px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 60);

            // Final Score
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.fillText(`Final Score: £${this.score * 5}`, this.canvas.width / 2, this.canvas.height / 2);

            // Restart instruction
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '24px Arial';
            this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 60);
        }
    }

    update() {
        if (this.gameOver) return;

        // Move snake
        this.snake.move();
        
        // Update food animation
        this.snake.updateFoodAnimation();

        // Check collisions
        const head = this.snake.body[0];
        
        // Wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            this.gameOver = true;
            this.saveScore();
            return;
        }

        // Self collision
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                this.gameOver = true;
                this.saveScore();
                return;
            }
        }

        // Food collision (check both cells)
        const foodCells = this.getFoodCells();
        if (foodCells.some(cell => head.x === cell.x && head.y === cell.y)) {
            // Start food animation
            this.snake.foodPosition = 0;
            this.snake.animationCounter = 0;
            this.snake.segmentScales[0] = this.snake.maxScale;
            this.food = this.generateFood();
            this.score++;
            document.getElementById('score').textContent = `Score: £${this.score * 5}`;
            
            // Increase speed every 5 food items by 10%
            if (this.score % 5 === 0) {
                this.speed = this.speed * 1.1;
            }
        }
    }

    gameLoop(currentTime = 0) {
        if (this.lastRenderTime === 0) {
            this.lastRenderTime = currentTime;
        }

        const elapsed = currentTime - this.lastRenderTime;
        
        if (elapsed > 1000 / (this.speed / 10)) {
            this.update();
            this.draw();
            this.lastRenderTime = currentTime;
            this.frameCount++;
        }

        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupControls() {
        document.addEventListener('keydown', (event) => {
            // Prevent page scrolling with arrow keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }

            if (this.gameOver && event.code === 'KeyR') {
                this.resetGame();
                return;
            }

            if (!this.characterType || this.gameOver) return;

            switch(event.code) {
                case 'ArrowUp':
                    if (this.snake.direction.y !== 1) {
                        this.snake.direction = {x: 0, y: -1};
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake.direction.y !== -1) {
                        this.snake.direction = {x: 0, y: 1};
                    }
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction.x !== 1) {
                        this.snake.direction = {x: -1, y: 0};
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake.direction.x !== -1) {
                        this.snake.direction = {x: 1, y: 0};
                    }
                    break;
            }
        });
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }
}

class Snake {
    constructor(characterType, images) {
        this.body = [{
            x: Math.floor(GAME_WIDTH / GRID_SIZE / 4),
            y: Math.floor(GAME_HEIGHT / GRID_SIZE / 2)
        }];
        this.direction = {x: 1, y: 0};
        this.characterType = characterType;
        this.images = images;
        this.grow = false;
        this.segmentScales = [1.0];  // Track scale of each segment
        this.foodPosition = -1;  // Track which segment the food is passing through
        this.animationSpeed = 2; // Control how fast the food moves through segments (reduced from 4 to make it even faster)
        this.animationCounter = 0;
        this.transitionProgress = 0; // Track progress of current segment transition
        this.maxScale = 1.5; // Maximum scale for segments
        this.minScale = 1.0; // Minimum scale for segments
    }

    getHeadImage() {
        const images = this.images[this.characterType];
        if (this.direction.x === 1) return images.right;
        if (this.direction.x === -1) return images.left;
        if (this.direction.y === -1) return images.up;
        if (this.direction.y === 1) return images.down;
    }

    move() {
        const head = this.body[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        this.body.unshift(newHead);
        if (!this.grow) {
            this.body.pop();
        } else {
            // Add scale for new segment
            this.segmentScales.push(this.minScale);
        }
        this.grow = false;
    }

    updateFoodAnimation() {
        if (this.foodPosition >= 0) {
            this.animationCounter++;
            
            // Update transition progress
            if (this.animationCounter >= this.animationSpeed) {
                this.animationCounter = 0;
                
                // Reset previous segment
                if (this.foodPosition < this.segmentScales.length) {
                    this.segmentScales[this.foodPosition] = this.minScale;
                }
                
                // Move to next segment
                this.foodPosition++;
                
                // If we've reached the end, trigger growth
                if (this.foodPosition >= this.segmentScales.length) {
                    this.foodPosition = -1;
                    this.grow = true;
                    // Reset all scales
                    this.segmentScales = this.segmentScales.map(() => this.minScale);
                }
            }

            // Calculate smooth transitions for current and adjacent segments
            if (this.foodPosition >= 0 && this.foodPosition < this.segmentScales.length) {
                const progress = this.animationCounter / this.animationSpeed;
                
                // Current segment scales up then down
                this.segmentScales[this.foodPosition] = this.minScale + 
                    (this.maxScale - this.minScale) * 
                    Math.sin(progress * Math.PI);
                
                // Next segment starts scaling up as current segment is scaling down
                if (this.foodPosition + 1 < this.segmentScales.length) {
                    this.segmentScales[this.foodPosition + 1] = this.minScale + 
                        (this.maxScale - this.minScale) * 
                        Math.max(0, Math.sin((progress - 0.5) * Math.PI));
                }
            }
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.setupControls();
}); 
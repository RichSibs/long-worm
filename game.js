// Game constants
const GRID_SIZE = 60;
const CELL_SIZE = 30;
const GAME_WIDTH = 900;
const GAME_HEIGHT = 540;
const GRID_WIDTH = GAME_WIDTH / CELL_SIZE;
const GRID_HEIGHT = GAME_HEIGHT / CELL_SIZE;

const INVESTMENT_FUND = "investment";
const FOOTBALL_OWNER = "football";

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating game instance...');
    new Game();
});

class Game {
    constructor() {
        console.log('Game constructor called');
        this.initialize();
    }

    initialize() {
        console.log('Initializing game...');
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        console.log('Canvas found:', this.canvas);

        this.ctx = this.canvas.getContext('2d');
        this.pitchSvg = document.getElementById('pitch-svg');
        this.gameArea = document.getElementById('game-area');

        // Add game title
        const gameTitle = document.createElement('div');
        gameTitle.id = 'game-title';
        
        const line1 = document.createElement('span');
        line1.className = 'line1';
        line1.textContent = 'LONG WORM';
        
        const line2 = document.createElement('span');
        line2.className = 'line2';
        line2.textContent = 'Capitalist Football Edition';
        
        gameTitle.appendChild(line1);
        gameTitle.appendChild(line2);
        document.getElementById('game-container').appendChild(gameTitle);

// Load images
        console.log('Loading images...');
        this.images = {
            [INVESTMENT_FUND]: {
                right: this.loadImage('bald_man_right.png'),
                left: this.loadImage('bald_man_left.png'),
                up: this.loadImage('bald_man_up.png'),
                down: this.loadImage('bald_man_down.png')
            },
            [FOOTBALL_OWNER]: {
                right: this.loadImage('AF_facing_right.png'),
                left: this.loadImage('AF_facing_left.png'),
                up: this.loadImage('AF_facing_up.png'),
                down: this.loadImage('AF_facing_down.png')
            },
            food: this.loadImage('five_pound_note.png')
        };
        
        // Set initial canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize game state
        this.resetGame();
        
        // Setup controls
        this.setupControls();
        
        // Start game loop
        this.lastTime = 0;
        this.frameCount = 0;
        console.log('Starting game loop...');
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));

        this.ffpImage = new Image();
        this.ffpImage.src = 'FFP.png';
        this.ffp = null;
        this.ffpSize = 30; // Size of the FFP icon
        this.ffpSpawnInterval = 10000; // Spawn every 10 seconds
        this.lastFfpSpawn = 0;
    }

    resizeCanvas() {
        const containerWidth = this.gameArea.clientWidth;
        const containerHeight = this.gameArea.clientHeight;
        
        // Set canvas size to match container
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;
        
        // Update grid size based on container dimensions
        this.gridSize = Math.min(containerWidth, containerHeight) / 15;
        
        // Update snake and food positions if game is running
        if (this.snake) {
            this.snake.resize(this.gridSize);
        }
        if (this.food) {
            this.food.resize(this.gridSize);
        }
    }

    setupCharacterSelection() {
        // Remove existing character select if it exists
        const existingSelect = document.getElementById('character-select');
        if (existingSelect) {
            existingSelect.remove();
        }

        // Create new character select
        const div = document.createElement('div');
        div.id = 'character-select';
        div.style.position = 'absolute';
        div.style.top = '50%';
        div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.zIndex = '1000';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        div.style.padding = '20px';
        div.style.borderRadius = '10px';
        div.style.textAlign = 'center';
        
        const title = document.createElement('h2');
        title.textContent = 'Choose Your Chairman';
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

        // Add to game container
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(div);

        // Log to verify creation
        console.log('Character selection created');
    }

    createCharacterButton(type, text, image) {
        const container = document.createElement('div');
        container.className = 'character-button';
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
            console.log('Character selected:', type);
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
        
        // Clear the canvas
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Hide game area and pitch
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.visibility = 'hidden';
        }

        // Hide restart button
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.style.display = 'none';
        }

        // Hide score and controls
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.style.display = 'none';
            scoreElement.textContent = 'Transfer War Chest: £0';
        }

        const controls = document.querySelector('.controls');
        if (controls) {
            controls.style.display = 'none';
        }
        
        // Show character selection
        this.setupCharacterSelection();

        this.ffp = null;
        this.lastFfpSpawn = 0;
    }

    startGame() {
        // Make game area visible again
        const gameArea = document.getElementById('game-area');
        if (gameArea) {
            gameArea.style.visibility = 'visible';
        }

        this.snake = new Snake(this.gridSize, this.characterType, this.images);
        this.food = this.generateFood();
        
        // Show score and controls
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.style.display = 'block';
        }

        // Show controls on mobile
        if (window.innerWidth <= 768) {
            const controls = document.querySelector('.controls');
            if (controls) {
                controls.style.display = 'flex';
            }
        }

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
        // Draw solid green pitch
        this.ctx.fillStyle = '#3a702f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set line style for pitch markings
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;

        // Calculate pitch dimensions with margins (using standard 1.5:1 ratio)
        const margin = 20;
        const pitchWidth = this.canvas.width - (margin * 2);
        const pitchHeight = this.canvas.height - (margin * 2);

        // Draw main pitch outline
        this.ctx.beginPath();
        this.ctx.rect(margin, margin, pitchWidth, pitchHeight);
        this.ctx.stroke();

        // Draw center line
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, margin);
        this.ctx.lineTo(centerX, this.canvas.height - margin);
        this.ctx.stroke();

        // Draw center circle (10 yards = 9.15m radius)
        const centerCircleRadius = Math.min(pitchWidth, pitchHeight) * 0.1;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, centerCircleRadius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw center spot
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw penalty areas (18 yard box)
        const penaltyAreaWidth = pitchWidth * 0.165; // 18 yards = 16.5m
        const penaltyAreaHeight = pitchHeight * 0.44; // Matches reference images

        // Left penalty area
        this.ctx.beginPath();
        this.ctx.rect(margin, (this.canvas.height - penaltyAreaHeight) / 2, penaltyAreaWidth, penaltyAreaHeight);
        this.ctx.stroke();

        // Right penalty area
        this.ctx.beginPath();
        this.ctx.rect(this.canvas.width - margin - penaltyAreaWidth, (this.canvas.height - penaltyAreaHeight) / 2, penaltyAreaWidth, penaltyAreaHeight);
        this.ctx.stroke();

        // Draw penalty spots (12 yards = 11m from goal line)
        const penaltySpotDistance = pitchWidth * 0.11;
        
        // Left penalty spot
        this.ctx.beginPath();
        this.ctx.arc(margin + penaltySpotDistance, centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Right penalty spot
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - margin - penaltySpotDistance, centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw penalty arcs
        const penaltyArcRadius = centerCircleRadius;
        
        // Left penalty arc
        this.ctx.beginPath();
        this.ctx.arc(margin + penaltySpotDistance, centerY, penaltyArcRadius, -Math.PI/6, Math.PI/6);
        this.ctx.stroke();

        // Right penalty arc
        this.ctx.beginPath();
        this.ctx.arc(this.canvas.width - margin - penaltySpotDistance, centerY, penaltyArcRadius, Math.PI - Math.PI/6, Math.PI + Math.PI/6);
        this.ctx.stroke();
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
                    scaledSize * 1.2,
                    scaledSize * 1.2
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
            this.gridSize * 2,
            this.gridSize * 1.2
        );

        // Draw FFP if it exists
        if (this.ffp && this.ffpImage.complete) {
            this.ctx.drawImage(
                this.ffpImage,
                this.ffp.x,
                this.ffp.y,
                this.ffpSize,
                this.ffpSize
            );
        }

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

            // Show restart button only when game is over
            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.style.display = 'block';
            }
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
            document.getElementById('score').textContent = `Transfer War Chest: £${this.score * 5}`;
            
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
            // Handle FFP spawning
            if (!this.ffp && currentTime - this.lastFfpSpawn > this.ffpSpawnInterval) {
                this.generateFfp();
                this.lastFfpSpawn = currentTime;
            }

            if (!this.gameOver) {
                this.update();
                // Check FFP collision after movement
                this.checkFfpCollision();
            }

            this.draw();
            this.lastRenderTime = currentTime;
            this.frameCount++;
        }

        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) {
                if (e.key.toLowerCase() === 'r') {
                    this.resetGame();
                }
        return;
    }

            switch(e.key) {
        case 'ArrowUp':
                    e.preventDefault();
                    this.snake.setDirection('up');
            break;
        case 'ArrowDown':
                    e.preventDefault();
                    this.snake.setDirection('down');
            break;
        case 'ArrowLeft':
                    e.preventDefault();
                    this.snake.setDirection('left');
            break;
        case 'ArrowRight':
                    e.preventDefault();
                    this.snake.setDirection('right');
            break;
    }
});

        // Touch controls
        const upBtn = document.getElementById('up-btn');
        const downBtn = document.getElementById('down-btn');
        const leftBtn = document.getElementById('left-btn');
        const rightBtn = document.getElementById('right-btn');
        const restartBtn = document.getElementById('restart-btn');

        const handleTouch = (direction) => {
            if (this.gameOver) return;
            this.snake.setDirection(direction);
        };

        upBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTouch('up');
        });

        downBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTouch('down');
        });

        leftBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTouch('left');
        });

        rightBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleTouch('right');
        });

        // Restart button - handle both click and touch events
        restartBtn.addEventListener('click', () => {
            if (this.gameOver) {
                this.resetGame();
            }
        });

        restartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.gameOver) {
                this.resetGame();
            }
        });
    }

    loadImage(src) {
        const img = new Image();
        img.onload = () => console.log(`Image loaded: ${src}`);
        img.onerror = () => console.error(`Error loading image: ${src}`);
        img.src = src;
        return img;
    }

    generateFfp() {
        const gridSize = this.gridSize;
        let x, y;
        do {
            x = Math.floor(Math.random() * (this.canvas.width / gridSize)) * gridSize;
            y = Math.floor(Math.random() * (this.canvas.height / gridSize)) * gridSize;
        } while (this.isPositionOccupied(x, y));

        this.ffp = { x, y };
    }

    isPositionOccupied(x, y) {
        // Check if position overlaps with snake
        for (const segment of this.snake.body) {
            if (segment.x === x && segment.y === y) return true;
        }
        // Check if position overlaps with food
        if (this.food && this.food.x === x && this.food.y === y) return true;
        return false;
    }

    checkFfpCollision() {
        if (!this.ffp) return false;
        
        const head = this.snake.body[0];
        if (head.x === this.ffp.x && head.y === this.ffp.y) {
            // Apply 50% penalty
            this.score = Math.floor(this.score * 0.5);
            this.updateScore();
            this.ffp = null; // Remove FFP item
            return true;
        }
        return false;
    }

    checkCollision() {
        const head = this.snake.body[0];
        
        // Wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // Self collision
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && head.y === this.snake.body[i].y) {
                return true;
            }
        }

        return false;
    }

    checkFoodCollision() {
        const head = this.snake.body[0];
        const foodCells = this.getFoodCells();
        return foodCells.some(cell => head.x === cell.x && head.y === cell.y);
    }

    updateScore() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Transfer War Chest: £${this.score * 5}`;
        }
    }
}

class Snake {
    constructor(gridSize, characterType, images) {
        this.gridSize = gridSize;
        this.characterType = characterType;
        this.images = images;
        this.reset();
        this.animationSpeed = 2; // Faster wave animation
        this.maxScale = 1.5; // 50% larger
        this.minScale = 1.0;
        this.transitionProgress = 0;
        this.foodPosition = 0;
        this.segmentScales = [];
        this.grow = false;
    }

    reset() {
        this.body = [
            {x: 5, y: 5}
        ];
        this.direction = {x: 1, y: 0};
        this.nextDirection = {x: 1, y: 0};
        this.segmentScales = [this.minScale];
    }

    setDirection(direction) {
        const newDirection = {
            up: {x: 0, y: -1},
            down: {x: 0, y: 1},
            left: {x: -1, y: 0},
            right: {x: 1, y: 0}
        }[direction];

        // Prevent 180-degree turns
        if (this.direction.x !== -newDirection.x || this.direction.y !== -newDirection.y) {
            this.nextDirection = newDirection;
        }
    }

    getHeadImage() {
        const images = this.images[this.characterType];
        if (this.direction.x === 1) return images.right;
        if (this.direction.x === -1) return images.left;
        if (this.direction.y === -1) return images.up;
        if (this.direction.y === 1) return images.down;
    }

    move() {
        // Apply next direction if it exists
        if (this.nextDirection) {
            this.direction = this.nextDirection;
        }

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

    resize(gridSize) {
        this.gridSize = gridSize;
        this.body.forEach(segment => {
            segment.x = Math.floor(segment.x / this.gridSize) * this.gridSize;
            segment.y = Math.floor(segment.y / this.gridSize) * this.gridSize;
        });
    }

    grow() {
        // Implement grow logic
    }
} 
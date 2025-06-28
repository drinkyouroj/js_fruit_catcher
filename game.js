// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const BASKET_WIDTH = 100;
const BASKET_HEIGHT = 80;
const FRUIT_SIZE = 50;
const GRAVITY = 0.2;
const INITIAL_MAX_FRUIT_SPEED = 2; // Reduced initial speed
const MAX_POSSIBLE_FRUIT_SPEED = 8; // Maximum possible speed after difficulty increases
const INITIAL_SPAWN_INTERVAL = 2000; // Longer initial spawn interval (milliseconds)
const MIN_SPAWN_INTERVAL = 500; // Minimum spawn interval after difficulty increases
const DIFFICULTY_INCREASE_INTERVAL = 10000; // Increase difficulty every 10 seconds

// Game variables
let canvas, ctx;
let score = 0;
let lives = 3;
let gameActive = false;
let basket = {
    x: 0,
    y: 0,
    width: BASKET_WIDTH,
    height: BASKET_HEIGHT,
    speed: 15,
    image: null // Will hold the basket image
};
let fruits = [];
let spawnTimer;
let animationId;
let lastTime = 0;
let gameTimer = 0; // Track total game time
let currentMaxFruitSpeed = INITIAL_MAX_FRUIT_SPEED; // Current maximum fruit speed
let currentSpawnInterval = INITIAL_SPAWN_INTERVAL; // Current spawn interval
let difficultyLevel = 1; // Track difficulty level
let heartImage = null; // Will hold the heart image

// Key state tracking
let keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false
};

// Fruit types with different point values
const fruitTypes = [
    { name: 'apple', points: 10, color: 'red', image: null },
    { name: 'orange', points: 15, color: 'orange', image: null },
    { name: 'pear', points: 20, color: 'green', image: null },
    { name: 'grapes', points: 25, color: 'purple', image: null },
    { name: 'lemon', points: 30, color: 'yellow', image: null }
];

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Load basket image
    basket.image = new Image();
    basket.image.src = 'assets/basket.png';
    
    // Load heart image
    heartImage = new Image();
    heartImage.src = 'assets/heart.png';
    
    // Load fruit images
    fruitTypes.forEach(fruit => {
        fruit.image = new Image();
        fruit.image.src = `assets/${fruit.name}.png`;
    });
    
    // Set canvas dimensions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', startGame);
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch controls
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchstart', handleTouchStart);
    
    // Initialize basket position
    resetBasket();
    
    // Initialize lives display
    updateLivesDisplay();
};

// Resize canvas to fit container
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    
    // Adjust basket position after resize
    if (basket) {
        basket.y = canvas.height - basket.height - 10;
    }
}

// Reset basket to starting position
function resetBasket() {
    basket.x = canvas.width / 2 - basket.width / 2;
    basket.y = canvas.height - basket.height - 10;
}

// Start the game
function startGame() {
    // Reset game state
    score = 0;
    lives = 3;
    fruits = [];
    gameActive = true;
    gameTimer = 0; // Reset game timer
    currentMaxFruitSpeed = INITIAL_MAX_FRUIT_SPEED; // Reset difficulty
    currentSpawnInterval = INITIAL_SPAWN_INTERVAL;
    difficultyLevel = 1;
    
    // Update UI
    document.getElementById('score').textContent = score;
    updateLivesDisplay();
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Start spawning fruits
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnFruit, currentSpawnInterval);
    
    // Start game loop
    cancelAnimationFrame(animationId);
    lastTime = performance.now();
    gameLoop(lastTime);
}

// Game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Update game timer and check for difficulty increase
    gameTimer += deltaTime;
    updateDifficulty();
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update basket position based on key states
    updateBasketPosition(deltaTime);
    
    // Draw basket
    drawBasket();
    
    // Update and draw fruits
    updateFruits(deltaTime);
    
    // Check if game is still active
    if (gameActive) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Update difficulty based on game timer
function updateDifficulty() {
    // Check if it's time to increase difficulty
    const newDifficultyLevel = Math.floor(gameTimer / DIFFICULTY_INCREASE_INTERVAL) + 1;
    
    // If difficulty level has increased
    if (newDifficultyLevel > difficultyLevel) {
        difficultyLevel = newDifficultyLevel;
        
        // Increase max fruit speed (with a cap)
        currentMaxFruitSpeed = Math.min(
            INITIAL_MAX_FRUIT_SPEED + (difficultyLevel - 1) * 0.5,
            MAX_POSSIBLE_FRUIT_SPEED
        );
        
        // Decrease spawn interval (with a minimum)
        currentSpawnInterval = Math.max(
            INITIAL_SPAWN_INTERVAL - (difficultyLevel - 1) * 150,
            MIN_SPAWN_INTERVAL
        );
        
        // Update spawn timer with new interval
        clearInterval(spawnTimer);
        spawnTimer = setInterval(spawnFruit, currentSpawnInterval);
        
        console.log(`Difficulty increased to level ${difficultyLevel}. Speed: ${currentMaxFruitSpeed}, Interval: ${currentSpawnInterval}ms`);
    }
}

// Update basket position based on key states
function updateBasketPosition(deltaTime) {
    if (!gameActive) return;
    
    const moveAmount = basket.speed * (deltaTime / 16); // Normalize for 60fps
    
    // Horizontal movement
    if (keys.ArrowLeft || keys.ArrowUp) { // Added ArrowUp for left movement
        basket.x -= moveAmount;
    }
    if (keys.ArrowRight || keys.ArrowDown) { // Added ArrowDown for right movement
        basket.x += moveAmount;
    }
    
    keepBasketInBounds();
}

// Draw the basket
function drawBasket() {
    if (basket.image && basket.image.complete) {
        // Draw the image if it's loaded
        ctx.drawImage(basket.image, basket.x, basket.y, basket.width, basket.height);
    } else {
        // Fallback to rectangle if image isn't loaded yet
        ctx.fillStyle = 'brown';
        ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
        
        // Draw basket handle/details
        ctx.fillStyle = 'saddlebrown';
        ctx.fillRect(basket.x + 10, basket.y - 10, basket.width - 20, 10);
    }
}

// Spawn a new fruit
function spawnFruit() {
    if (!gameActive) return;
    
    const fruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    const fruit = {
        x: Math.random() * (canvas.width - FRUIT_SIZE),
        y: -FRUIT_SIZE,
        width: FRUIT_SIZE,
        height: FRUIT_SIZE,
        speed: 1 + Math.random() * currentMaxFruitSpeed, // Use current max speed based on difficulty
        type: fruitType
    };
    
    fruits.push(fruit);
}

// Update all fruits
function updateFruits(deltaTime) {
    for (let i = fruits.length - 1; i >= 0; i--) {
        const fruit = fruits[i];
        
        // Move fruit down
        fruit.y += fruit.speed * (deltaTime / 16); // Normalize for 60fps
        
        // Draw fruit
        if (fruit.type.image && fruit.type.image.complete) {
            ctx.drawImage(fruit.type.image, fruit.x, fruit.y, FRUIT_SIZE, FRUIT_SIZE);
        } else {
            // Fallback to colored circle if image isn't loaded
            ctx.fillStyle = fruit.type.color;
            ctx.beginPath();
            ctx.arc(fruit.x + FRUIT_SIZE/2, fruit.y + FRUIT_SIZE/2, FRUIT_SIZE/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Check for collision with basket
        if (checkCollision(fruit, basket)) {
            // Caught fruit
            score += fruit.type.points;
            document.getElementById('score').textContent = score;
            fruits.splice(i, 1);
        } 
        // Check if fruit is out of bounds
        else if (fruit.y > canvas.height) {
            // Missed fruit
            lives--;
            updateLivesDisplay();
            fruits.splice(i, 1);
            
            // Check for game over
            if (lives <= 0) {
                gameOver();
            }
        }
    }
}

// Check collision between two objects
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Handle keyboard input
function handleKeyDown(e) {
    if (!gameActive) return;
    
    // Update key state
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || e.key === 'ArrowDown') { // Added Up and Down arrows
        keys[e.key] = true;
        e.preventDefault(); // Prevent scrolling when using arrow keys
    }
}

// Handle key release
function handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
        e.key === 'ArrowUp' || e.key === 'ArrowDown') { // Added Up and Down arrows
        keys[e.key] = false;
    }
}

// Handle touch input
function handleTouchMove(e) {
    if (!gameActive) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    // Center basket on touch position
    basket.x = touchX - basket.width / 2;
    keepBasketInBounds();
}

// Handle touch start
function handleTouchStart(e) {
    e.preventDefault();
}

// Keep basket within canvas bounds
function keepBasketInBounds() {
    if (basket.x < 0) {
        basket.x = 0;
    } else if (basket.x + basket.width > canvas.width) {
        basket.x = canvas.width - basket.width;
    }
}

// Update lives display with heart icons
function updateLivesDisplay() {
    const livesContainer = document.getElementById('livesIcons');
    livesContainer.innerHTML = '';
    
    // Create heart icons based on current lives
    for (let i = 0; i < lives; i++) {
        if (heartImage && heartImage.complete) {
            const heartImg = document.createElement('img');
            heartImg.src = 'assets/heart.png';
            heartImg.className = 'life-icon';
            heartImg.width = 25;
            heartImg.height = 25;
            livesContainer.appendChild(heartImg);
        } else {
            // Fallback to CSS heart if image isn't loaded
            const heartIcon = document.createElement('div');
            heartIcon.className = 'life-icon';
            livesContainer.appendChild(heartIcon);
        }
    }
}

// Game over
function gameOver() {
    gameActive = false;
    clearInterval(spawnTimer);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}
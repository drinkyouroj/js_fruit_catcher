// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const BASKET_WIDTH = 100;
const BASKET_HEIGHT = 80;
const FRUIT_SIZE = 50;
const GRAVITY = 0.2;
const MAX_FRUIT_SPEED = 5;
const SPAWN_INTERVAL = 1500; // milliseconds between fruit spawns

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
    speed: 10
};
let fruits = [];
let spawnTimer;
let animationId;
let lastTime = 0;

// Fruit types with different point values
const fruitTypes = [
    { name: 'apple', points: 10, color: 'red' },
    { name: 'orange', points: 15, color: 'orange' },
    { name: 'banana', points: 20, color: 'yellow' },
    { name: 'grape', points: 25, color: 'purple' },
    { name: 'watermelon', points: 30, color: 'green' }
];

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', startGame);
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    
    // Touch controls
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchstart', handleTouchStart);
    
    // Initialize basket position
    resetBasket();
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
    
    // Update UI
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    
    // Start spawning fruits
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnFruit, SPAWN_INTERVAL);
    
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
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw basket
    drawBasket();
    
    // Update and draw fruits
    updateFruits(deltaTime);
    
    // Check if game is still active
    if (gameActive) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Draw the basket
function drawBasket() {
    ctx.fillStyle = 'brown';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    
    // Draw basket handle/details
    ctx.fillStyle = 'saddlebrown';
    ctx.fillRect(basket.x + 10, basket.y - 10, basket.width - 20, 10);
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
        speed: 1 + Math.random() * MAX_FRUIT_SPEED,
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
        ctx.fillStyle = fruit.type.color;
        ctx.beginPath();
        ctx.arc(fruit.x + FRUIT_SIZE/2, fruit.y + FRUIT_SIZE/2, FRUIT_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
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
            document.getElementById('lives').textContent = lives;
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
    
    if (e.key === 'ArrowLeft') {
        moveBasket(-basket.speed);
    } else if (e.key === 'ArrowRight') {
        moveBasket(basket.speed);
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

// Move basket
function moveBasket(dx) {
    basket.x += dx;
    keepBasketInBounds();
}

// Keep basket within canvas bounds
function keepBasketInBounds() {
    if (basket.x < 0) {
        basket.x = 0;
    } else if (basket.x + basket.width > canvas.width) {
        basket.x = canvas.width - basket.width;
    }
}

// Game over
function gameOver() {
    gameActive = false;
    clearInterval(spawnTimer);
    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}
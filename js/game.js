class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        this.player = new Player(this.canvas);
        this.stage = new GameStage(this.canvas);
        this.projectiles = [];
        this.lastFrame = 0;
        this.gameOver = false;
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Start game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    gameLoop(timestamp) {
        if (this.gameOver) return;
        
        // Calculate delta time
        const deltaTime = timestamp - this.lastFrame;
        this.lastFrame = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update game state
        this.update(deltaTime);
        
        // Draw everything
        this.draw();
        
        // Continue game loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    update(deltaTime) {
        // Update player
        this.player.update();
        
        // Get new projectiles from player's shoot method
        const newProjectiles = this.player.shoot();
        if (newProjectiles && newProjectiles.length > 0) {
            this.projectiles.push(...newProjectiles);
        }
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(projectile => {
            // Update position
            if (projectile.angle) {
                projectile.x += Math.cos(projectile.angle) * projectile.speed;
                projectile.y += Math.sin(projectile.angle) * projectile.speed;
            } else {
                projectile.x += projectile.speed; // Move right for player bullets
            }
            
            // Remove if out of bounds
            return (
                projectile.x >= 0 &&
                projectile.x <= this.canvas.width &&
                projectile.y >= 0 &&
                projectile.y <= this.canvas.height
            );
        });
        
        // Update stage (enemies, orbs, etc.) and collect enemy projectiles
        const enemyProjectiles = this.stage.update(this.player);
        if (enemyProjectiles && enemyProjectiles.length > 0) {
            this.projectiles.push(...enemyProjectiles);
        }
        
        // Check collisions
        this.projectiles = this.stage.checkCollisions(this.player, this.projectiles);
        
        // Check game over
        if (this.player.energy <= 0) {
            this.gameOver = true;
            this.showGameOver();
        }
    }
    
    draw() {
        // Draw background (optional: add parallax stars, etc.)
        
        // Draw projectiles
        this.projectiles.forEach(projectile => {
            if (projectile.color === '#ff0000') {
                // Draw enemy laser as a long, thin red rectangle
                this.ctx.save();
                this.ctx.translate(projectile.x, projectile.y);
                this.ctx.rotate(projectile.angle || Math.PI); // Default to left
                this.ctx.fillStyle = '#ff0000';
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 8;
                this.ctx.fillRect(-10, -2, 20, 4); // Laser beam
                this.ctx.restore();
            } else {
                // Draw player/projectile as a circle
                this.ctx.fillStyle = projectile.color || '#00ff00';
                this.ctx.beginPath();
                this.ctx.arc(projectile.x, projectile.y, 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        // Draw stage elements (enemies, orbs, etc.)
        this.stage.draw();
        
        // Draw player
        this.player.draw();
    }
    
    showGameOver() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75';
        gameOverDiv.innerHTML = `
            <h1 class="text-4xl font-bold text-red-500 mb-4">Game Over</h1>
            <p class="text-xl text-white mb-4">Stage ${this.stage.currentStage}</p>
            <button class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    onclick="location.reload()">
                Play Again
            </button>
        `;
        document.body.appendChild(gameOverDiv);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 
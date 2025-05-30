class GameStage {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.enemies = [];
        this.orbs = [];
        this.obstacles = [];
        this.boss = null;
        this.currentStage = 1;
        this.enemySpawnTimer = 0;
        this.orbSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
    }
    
    update(player) {
        const enemyProjectiles = [];
        // Boss only on level 3
        const isBossStage = (this.currentStage === 3);

        // Only spawn regular enemies if not a boss stage and no boss is present
        if (!isBossStage && Date.now() - this.enemySpawnTimer > 2000) {
            this.spawnEnemy();
            this.enemySpawnTimer = Date.now();
        }
        // Spawn orbs
        if (Date.now() - this.orbSpawnTimer > 10000) {
            this.spawnOrb();
            this.orbSpawnTimer = Date.now();
        }
        // Spawn obstacles
        if (Date.now() - this.obstacleSpawnTimer > 3000) {
            this.spawnObstacle();
            this.obstacleSpawnTimer = Date.now();
        }
        // Update enemies and collect projectiles
        this.enemies.forEach(enemy => {
            const projectiles = enemy.update(player);
            if (Array.isArray(projectiles) && projectiles.length > 0) {
                enemyProjectiles.push(...projectiles);
            }
        });
        // Update orbs
        this.orbs.forEach(orb => orb.update());
        // Update obstacles
        this.obstacles.forEach(obstacle => obstacle.update());
        // Update boss if exists
        if (this.boss) {
            const bossProjectiles = this.boss.update(player);
            if (Array.isArray(bossProjectiles) && bossProjectiles.length > 0) {
                enemyProjectiles.push(...bossProjectiles);
            }
        }
        // Check for stage completion
        if (this.enemies.length === 0 && !this.boss) {
            this.currentStage++;
            // Boss only on level 3
            if (this.currentStage === 3) {
                this.spawnBoss();
                // Show boss UI
                const bossHpContainer = document.querySelector('#bossHpContainer');
                if (bossHpContainer) bossHpContainer.classList.remove('hidden');
            } else {
                // Hide boss UI if not a boss stage
                const bossHpContainer = document.querySelector('#bossHpContainer');
                if (bossHpContainer) bossHpContainer.classList.add('hidden');
                this.boss = null;
                this.enemies = [];
            }
        }
        // Hide boss UI if not a boss stage and boss is not present
        if (!isBossStage && !this.boss) {
            const bossHpContainer = document.querySelector('#bossHpContainer');
            if (bossHpContainer) bossHpContainer.classList.add('hidden');
        }
        // Check obstacle collisions
        this.checkObstacleCollisions(player);
        return enemyProjectiles;
    }
    
    spawnEnemy() {
        const x = this.canvas.width;
        const y = Math.random() * (this.canvas.height - 40);
        
        // Randomly choose between alien-1 and alien-2
        const type = Math.random() < 0.6 ? 'alien-1' : 'alien-2';
        
        this.enemies.push(new Enemy(this.canvas, x, y, type, false, this.currentStage));
    }
    
    spawnBoss() {
        const x = this.canvas.width - 100;
        const y = this.canvas.height / 2;
        this.boss = new Enemy(this.canvas, x, y, 'alien-1', true, this.currentStage);
    }
    
    spawnOrb() {
        const x = Math.random() * (this.canvas.width - 30);
        const y = Math.random() * (this.canvas.height - 30);
        
        // Randomly choose orb type with weighted probabilities
        const rand = Math.random();
        let type;
        if (rand < 0.4) {
            type = 'green';  // 40% chance
        } else if (rand < 0.8) {
            type = 'blue';   // 40% chance
        } else {
            type = 'purple'; // 20% chance
        }
        
        this.orbs.push(new Orb(this.canvas, x, y, type));
    }
    
    spawnObstacle() {
        const x = this.canvas.width;
        const y = Math.random() * (this.canvas.height - 40);
        const type = Math.random() < 0.5 ? 'asteriods1' : 'asteriods2';
        this.obstacles.push(new Obstacle(this.canvas, x, y, type));
    }
    
    shouldSpawnBoss() {
        return this.currentStage % GAME_CONFIG.BOSS.SPAWN_INTERVAL === 0 && !this.boss;
    }
    
    getEnemySpawnInterval() {
        // Decrease spawn interval as stage increases
        return Math.max(1000, 3000 - (this.currentStage - 1) * 200);
    }
    
    completeStage() {
        this.currentStage++;
        this.boss = null;
        this.enemies = [];
        this.orbs = [];
        
        // Hide boss HP bar
        document.querySelector('#bossHpContainer').classList.add('hidden');
        
        // Show stage transition
        this.showStageTransition();
    }
    
    showStageTransition() {
        const stageText = document.createElement('div');
        stageText.className = 'fixed inset-0 flex items-center justify-center text-4xl font-bold text-white';
        stageText.style.textShadow = '0 0 10px #00ff00';
        stageText.textContent = `Stage ${this.currentStage}`;
        
        document.body.appendChild(stageText);
        
        // Animate and remove
        setTimeout(() => {
            stageText.style.opacity = '0';
            stageText.style.transition = 'opacity 1s';
            setTimeout(() => stageText.remove(), 1000);
        }, 2000);
    }
    
    checkCollisions(player, projectiles) {
        // Check player-projectile collisions
        projectiles.forEach(projectile => {
            if (this.checkProjectileCollision(projectile, player)) {
                player.takeDamage(projectile.damage);
            }
        });
        
        // Check player-orb collisions
        this.orbs = this.orbs.filter(orb => {
            if (orb.checkCollision(player)) {
                player.collectPowerUp(orb.getPowerUpType());
                return false;
            }
            return true;
        });
        
        // Check projectile-enemy collisions
        this.enemies = this.enemies.filter(enemy => {
            let destroyed = false;
            projectiles = projectiles.filter(projectile => {
                if (!destroyed && this.checkProjectileCollision(projectile, enemy)) {
                    destroyed = enemy.takeDamage(projectile.damage);
                    return !projectile.piercing;
                }
                return true;
            });
            return !destroyed;
        });
        
        // Check projectile-boss collisions
        if (this.boss) {
            projectiles = projectiles.filter(projectile => {
                if (this.checkProjectileCollision(projectile, this.boss)) {
                    this.boss.takeDamage(projectile.damage);
                    return !projectile.piercing;
                }
                return true;
            });
        }
        
        return projectiles;
    }
    
    checkProjectileCollision(projectile, entity) {
        return (
            projectile.x < entity.x + entity.width &&
            projectile.x + 5 > entity.x &&
            projectile.y < entity.y + entity.height &&
            projectile.y + 5 > entity.y
        );
    }
    
    checkObstacleCollisions(player) {
        // Check player-obstacle collisions
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.checkCollision(player)) {
                player.takeDamage(GAME_CONFIG.OBSTACLE.DAMAGE);
                return false;
            }
            return true;
        });
        
        // Remove obstacles that are off screen
        this.obstacles = this.obstacles.filter(obstacle => 
            obstacle.x + obstacle.width > 0
        );
    }
    
    draw() {
        // Draw obstacles
        this.obstacles.forEach(obstacle => obstacle.draw());
        
        // Draw enemies
        this.enemies.forEach(enemy => enemy.draw());
        
        // Draw boss
        if (this.boss) {
            this.boss.draw();
        }
        
        // Draw orbs
        this.orbs.forEach(orb => orb.draw());
    }
} 
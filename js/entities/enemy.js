class Enemy {
    constructor(canvas, x, y, type = 'alien-1', isBoss = false, stage = 1) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = isBoss ? 100 : 40;
        this.height = isBoss ? 80 : 30;
        this.type = type; // 'alien-1', 'alien-2', 'boss', or 'grand-boss'
        this.isBoss = isBoss;
        this.stage = stage;
        
        // Load enemy sprite
        this.sprite = new Image();
        if (isBoss) {
            this.sprite.src = stage >= 10 ? 'assets/boss/grand boss.png' : 'assets/boss/boss.png';
        } else {
            this.sprite.src = `assets/aliens/${type}.png`;
        }
        
        // Stats
        this.hp = this.calculateHP();
        this.maxHp = this.hp;
        this.speed = GAME_CONFIG.ENEMY.BASE_SPEED;
        this.isSlowed = false;
        this.slowEndTime = 0;
        
        // Shooting (only for alien-1)
        this.lastShot = 0;
        this.shootCooldown = 1000; // ms
        if (type === 'alien-2') {
            this.shootCooldown = 2000 + Math.random() * 1000; // 2-3 seconds
        }
        
        // Movement patterns
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = 100;
        this.orbitCenter = { x: this.canvas.width - 150, y: this.canvas.height / 2 };
        
        // Boss-specific
        if (isBoss) {
            this.adaptationType = 'none';
            this.adaptationTimer = 0;
            this.showHpBar();
        }
    }
    
    calculateHP() {
        if (this.isBoss) {
            const baseHP = this.stage >= 10 ? 
                GAME_CONFIG.BOSS.GRAND_BOSS_HP : 
                GAME_CONFIG.BOSS.BASE_HP;
            return baseHP + (this.stage - 1) * GAME_CONFIG.BOSS.HP_SCALE_PER_STAGE;
        }
        return GAME_CONFIG.ENEMY.BASE_HP + 
               (this.stage - 1) * GAME_CONFIG.ENEMY.HP_SCALE_PER_STAGE;
    }
    
    update(player) {
        // Handle slow effect
        if (this.isSlowed && Date.now() > this.slowEndTime) {
            this.isSlowed = false;
            this.speed = GAME_CONFIG.ENEMY.BASE_SPEED;
        }
        let projectiles;
        // Movement
        if (this.isBoss) {
            this.updateBossMovement(player);
        } else {
            if (this.type === 'alien-1') {
                // Simple left movement for alien-1
                this.x -= this.speed * (this.isSlowed ? GAME_CONFIG.ENEMY.SLOW_EFFECT : 1);
            } else {
                // Direct movement for alien-2
                this.updateAlien2Movement(player);
            }
        }
        // Shooting
        if (this.type === 'alien-1' && Date.now() - this.lastShot > this.shootCooldown) {
            if (this.isBoss || Math.random() < GAME_CONFIG.ENEMY.SHOOT_CHANCE) {
                projectiles = this.shoot(player);
                this.lastShot = Date.now();
            }
        } else if (this.type === 'alien-2' && Date.now() - this.lastShot > this.shootCooldown) {
            projectiles = this.shoot(player);
            this.lastShot = Date.now();
        }
        // Boss adaptation
        if (this.isBoss) {
            this.adaptToPlayer(player);
        }
        return projectiles;
    }
    
    updateBossMovement(player) {
        // Basic movement pattern
        const centerY = this.canvas.height / 2;
        const amplitude = 100;
        const frequency = 0.002;
        
        this.y = centerY + Math.sin(Date.now() * frequency) * amplitude;
        this.x = this.canvas.width - 150 + Math.cos(Date.now() * frequency * 0.5) * 30;
    }
    
    updateAlien2Movement(player) {
        // Update orbit angle
        this.angle += 0.02;
        
        // Calculate new position
        const targetX = this.orbitCenter.x + Math.cos(this.angle) * this.orbitRadius;
        const targetY = this.orbitCenter.y + Math.sin(this.angle) * this.orbitRadius;
        
        // Move towards target position
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        // Update orbit center to follow player
        this.orbitCenter.x = Math.max(this.canvas.width - 200, 
            Math.min(this.canvas.width - 100, player.x + 100));
        this.orbitCenter.y = player.y;
    }
    
    shoot(player) {
        const projectiles = [];
        
        if (this.isBoss) {
            switch (this.adaptationType) {
                case 'movement':
                    // Homing missiles
                    const angle = Math.atan2(
                        player.y - this.y,
                        player.x - this.x
                    );
                    projectiles.push({
                        x: this.x,
                        y: this.y + this.height / 2,
                        speed: GAME_CONFIG.PROJECTILES.BOSS.SPEED,
                        damage: GAME_CONFIG.PROJECTILES.BOSS.DAMAGE,
                        angle: angle,
                        homing: true,
                        color: '#ff0000'
                    });
                    break;
                    
                case 'shooting':
                    // Area denial
                    for (let i = 0; i < 3; i++) {
                        projectiles.push({
                            x: this.x,
                            y: this.y + (this.height * i / 2),
                            speed: GAME_CONFIG.PROJECTILES.BOSS.SPEED * 0.7,
                            damage: GAME_CONFIG.PROJECTILES.BOSS.DAMAGE * 0.7,
                            angle: Math.PI,
                            color: '#ff0000'
                        });
                    }
                    break;
                    
                default:
                    // Basic shooting
                    projectiles.push({
                        x: this.x,
                        y: this.y + this.height / 2,
                        speed: GAME_CONFIG.PROJECTILES.ENEMY.SPEED,
                        damage: GAME_CONFIG.PROJECTILES.ENEMY.DAMAGE,
                        angle: Math.PI,
                        color: '#ff0000'
                    });
            }
        } else if (this.type === 'alien-1') {
            // Basic enemy shooting
            projectiles.push({
                x: this.x,
                y: this.y + this.height / 2,
                speed: GAME_CONFIG.PROJECTILES.ENEMY.SPEED,
                damage: GAME_CONFIG.PROJECTILES.ENEMY.DAMAGE,
                angle: Math.PI,
                color: '#ff0000'
            });
        } else if (this.type === 'alien-2') {
            // Alien-2 fires a laser directly at the player
            const angle = Math.atan2(player.y + player.height / 2 - (this.y + this.height / 2), player.x + player.width / 2 - (this.x + this.width / 2));
            projectiles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                speed: GAME_CONFIG.PROJECTILES.ENEMY.SPEED + 2, // Faster laser
                damage: GAME_CONFIG.PROJECTILES.ENEMY.DAMAGE,
                angle: angle,
                color: '#ff0000'
            });
        }
        
        return projectiles;
    }
    
    adaptToPlayer(player) {
        const pattern = player.getMovementPattern();
        
        if (Date.now() - this.adaptationTimer > 5000) {
            if (pattern.totalDistance > GAME_CONFIG.BOSS.ADAPTATION_THRESHOLD.MOVEMENT) {
                this.adaptationType = 'movement';
            } else if (pattern.recentShots > GAME_CONFIG.BOSS.ADAPTATION_THRESHOLD.SHOOTING) {
                this.adaptationType = 'shooting';
            } else {
                this.adaptationType = 'none';
            }
            this.adaptationTimer = Date.now();
        }
    }
    
    takeDamage(amount) {
        // Scale damage based on player's power level
        const scaledDamage = Math.floor(amount * (1 + (this.stage - 1) * 0.1));
        this.hp -= scaledDamage;
        
        if (this.isBoss) {
            this.updateBossHpBar();
        }
        
        // Apply slow effect
        this.isSlowed = true;
        this.slowEndTime = Date.now() + GAME_CONFIG.PLAYER.SLOW_DURATION;
        this.speed = GAME_CONFIG.ENEMY.BASE_SPEED * GAME_CONFIG.ENEMY.SLOW_EFFECT;
        
        return this.hp <= 0;
    }
    
    showHpBar() {
        const container = document.querySelector('#bossHpContainer');
        container.classList.remove('hidden');
        
        // Update boss name
        const bossName = document.querySelector('#bossName');
        bossName.textContent = this.stage >= 10 ? 'Grand Boss' : 'Boss';
    }
    
    updateBossHpBar() {
        const hpBar = document.querySelector('#bossHpBar');
        const percentage = (this.hp / this.maxHp) * 100;
        hpBar.style.width = `${percentage}%`;
        
        // Update HP text
        const hpText = document.querySelector('#bossHpText');
        hpText.textContent = `${this.hp}/${this.maxHp}`;
        
        if (percentage < 30) {
            hpBar.classList.add('boss-hp-warning');
        } else {
            hpBar.classList.remove('boss-hp-warning');
        }
    }
    
    draw() {
        if (this.isBoss) {
            // Draw boss
            this.ctx.save();
            this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            this.ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            this.ctx.restore();
            
            // Draw boss name
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Stage ${this.stage} Boss`, this.x + this.width / 2, this.y - 10);
        } else {
            // Draw regular enemy
            this.ctx.save();
            this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            this.ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
            this.ctx.restore();
        }
    }
} 
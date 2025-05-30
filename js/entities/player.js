class Player {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = 100; // Start from left side
        this.y = canvas.height / 2; // Center vertically
        this.width = 50;
        this.height = 30; // Make ship more horizontal
        this.energy = GAME_CONFIG.PLAYER.INITIAL_ENERGY;
        this.powerLevel = 1;
        this.additionalBullets = 0;
        this.blueBullets = 0;
        this.hasShield = false;
        this.shieldEndTime = 0;
        this.movementHistory = [];
        this.shotHistory = [];
        this.spacePressed = false; // Track if space was just pressed
        this.shouldShoot = false; // Flag to indicate shooting
        
        // Load player sprite
        this.sprite = new Image();
        this.sprite.src = 'assets/player/player.png';
        
        // Removed: Load shield sprite (using drawn circle instead)
        // this.shieldSprite = new Image();
        // this.shieldSprite.src = 'assets/shield.png';
        
        // Movement state
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false,
            Space: false
        };
        
        this.setupControls();
    }
    
    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = true;
                // Only shoot when space is first pressed
                if (e.code === 'Space' && !this.spacePressed) {
                    this.spacePressed = true;
                    this.shouldShoot = true;
                }
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = false;
                // Reset space pressed state when released
                if (e.code === 'Space') {
                    this.spacePressed = false;
                }
            }
        });
    }
    
    update() {
        // Handle movement
        if (this.keys.ArrowLeft) this.x -= GAME_CONFIG.PLAYER.MOVEMENT_SPEED;
        if (this.keys.ArrowRight) this.x += GAME_CONFIG.PLAYER.MOVEMENT_SPEED;
        if (this.keys.ArrowUp) this.y -= GAME_CONFIG.PLAYER.MOVEMENT_SPEED;
        if (this.keys.ArrowDown) this.y += GAME_CONFIG.PLAYER.MOVEMENT_SPEED;
        
        // Keep player in bounds
        this.x = Math.max(0, Math.min(this.canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.canvas.height - this.height, this.y));
        
        // Record movement for boss adaptation
        this.movementHistory.push({ x: this.x, y: this.y, timestamp: Date.now() });
        this.movementHistory = this.movementHistory.filter(h => 
            Date.now() - h.timestamp < 5000
        );
        
        // Check shield duration
        if (this.hasShield && Date.now() > this.shieldEndTime) {
            this.hasShield = false;
        }
    }
    
    shoot() {
        if (!this.shouldShoot) {
            return [];
        }
        
        this.shouldShoot = false; // Reset shooting flag
        this.shotHistory.push(Date.now());
        this.shotHistory = this.shotHistory.filter(t => 
            Date.now() - t < 5000
        );
        
        const projectiles = [];
        const centerX = this.x + this.width;
        const centerY = this.y + this.height / 2;
        
        // Base bullet
        projectiles.push({
            x: centerX,
            y: centerY,
            speed: GAME_CONFIG.PROJECTILES.PLAYER.SPEED,
            damage: GAME_CONFIG.PROJECTILES.PLAYER.DAMAGE * this.powerLevel,
            color: '#00ff00'
        });
        
        // Additional bullets (green orb)
        for (let i = 0; i < this.additionalBullets; i++) {
            const offset = (i + 1) * 15;
            projectiles.push(
                {
                    x: centerX,
                    y: centerY - offset,
                    speed: GAME_CONFIG.PROJECTILES.PLAYER.SPEED,
                    damage: GAME_CONFIG.PROJECTILES.PLAYER.DAMAGE * this.powerLevel,
                    color: '#00ff00'
                },
                {
                    x: centerX,
                    y: centerY + offset,
                    speed: GAME_CONFIG.PROJECTILES.PLAYER.SPEED,
                    damage: GAME_CONFIG.PROJECTILES.PLAYER.DAMAGE * this.powerLevel,
                    color: '#00ff00'
                }
            );
        }
        
        // Blue bullets (blue orb)
        for (let i = 0; i < this.blueBullets; i++) {
            const angle = Math.PI / 6 * (i + 1);
            projectiles.push(
                {
                    x: centerX,
                    y: centerY,
                    speed: GAME_CONFIG.PROJECTILES.PLAYER.SPEED,
                    damage: GAME_CONFIG.PROJECTILES.PLAYER.DAMAGE * this.powerLevel,
                    angle: angle,
                    color: '#00ffff'
                },
                {
                    x: centerX,
                    y: centerY,
                    speed: GAME_CONFIG.PROJECTILES.PLAYER.SPEED,
                    damage: GAME_CONFIG.PROJECTILES.PLAYER.DAMAGE * this.powerLevel,
                    angle: -angle,
                    color: '#00ffff'
                }
            );
        }
        
        return projectiles;
    }
    
    collectPowerUp(type) {
        const powerUp = GAME_CONFIG.POWER_UPS[type.toUpperCase() + '_ORB'];
        if (!powerUp) return;
        
        switch (powerUp.TYPE) {
            case 'additional':
                this.additionalBullets = Math.min(
                    this.additionalBullets + powerUp.POWER_INCREASE,
                    powerUp.MAX_STACK
                );
                break;
                
            case 'blue':
                this.blueBullets = Math.min(
                    this.blueBullets + powerUp.POWER_INCREASE,
                    powerUp.MAX_STACK
                );
                break;
                
            case 'shield':
                this.hasShield = true;
                this.shieldEndTime = Date.now() + powerUp.DURATION;
                break;
        }
        
        // Update HUD
        this.updateHUD();
    }
    
    takeDamage(amount) {
        if (this.hasShield) {
            this.hasShield = false;
            return false;
        }
        
        this.energy = Math.max(0, this.energy - amount);
        
        // Reset power-ups on damage
        this.additionalBullets = 0;
        this.blueBullets = 0;
        
        // Update HUD
        this.updateHUD();
        
        return this.energy <= 0;
    }
    
    updateHUD() {
        // Update energy bar
        document.querySelector('#energyBar').style.width = 
            `${(this.energy / GAME_CONFIG.PLAYER.INITIAL_ENERGY) * 100}%`;
        
        // Update power level display
        const powerLevelText = document.querySelector('#powerLevel span');
        powerLevelText.textContent = this.powerLevel;
        
        // Add visual indicators for active power-ups
        const powerUpIndicators = [];
        if (this.additionalBullets > 0) {
            powerUpIndicators.push(`+${this.additionalBullets} Green`);
        }
        if (this.blueBullets > 0) {
            powerUpIndicators.push(`+${this.blueBullets} Blue`);
        }
        if (this.hasShield) {
            powerUpIndicators.push('Shield');
        }
        
        if (powerUpIndicators.length > 0) {
            powerLevelText.textContent += ` (${powerUpIndicators.join(', ')})`;
        }
    }
    
    draw() {
        // Draw player ship using the sprite
        this.ctx.save();
        this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Check if sprite is loaded before drawing
        if (this.sprite.complete && this.sprite.naturalWidth > 0) {
            this.ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Draw a placeholder if sprite is not loaded
            this.ctx.fillStyle = '#00ff00'; // Green color
            this.ctx.fillRect(
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        }
        this.ctx.restore();
        
        // Draw shield if active
        if (this.hasShield) {
            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width * 0.8,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
        }
    }
    
    getMovementPattern() {
        return {
            totalDistance: this.calculateTotalDistance(),
            recentShots: this.shotHistory.length
        };
    }
    
    calculateTotalDistance() {
        let distance = 0;
        for (let i = 1; i < this.movementHistory.length; i++) {
            const prev = this.movementHistory[i - 1];
            const curr = this.movementHistory[i];
            distance += Math.sqrt(
                Math.pow(curr.x - prev.x, 2) + 
                Math.pow(curr.y - prev.y, 2)
            );
        }
        return distance;
    }
} 
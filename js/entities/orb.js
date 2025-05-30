class Orb {
    constructor(canvas, x, y, type) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.type = type; // 'green' or 'blue' or 'purple'
        
        // Load orb sprite
        this.sprite = new Image();
        this.sprite.src = `assets/orbs/${type} orbs.png`;
        
        // Movement
        this.speed = 2;
        this.rotation = 0;
        this.scale = 1;
        this.pulseDirection = 0.01;
    }
    
    update() {
        // Move left
        this.x -= this.speed;
        
        // Rotation
        this.rotation += 0.02;
        
        // Pulsing effect
        this.scale += this.pulseDirection;
        if (this.scale > 1.2 || this.scale < 0.8) {
            this.pulseDirection *= -1;
        }
    }
    
    draw() {
        this.ctx.save();
        this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        this.ctx.rotate(this.rotation);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw orb using sprite
        this.ctx.drawImage(
            this.sprite,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        
        this.ctx.restore();
    }
    
    checkCollision(player) {
        return (
            this.x < player.x + player.width &&
            this.x + this.width > player.x &&
            this.y < player.y + player.height &&
            this.y + this.height > player.y
        );
    }
    
    getPowerUpType() {
        return this.type;
    }
} 
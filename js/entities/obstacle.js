class Obstacle {
    constructor(canvas, x, y, type = 'asteroid1') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = type;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.speed = 2;
        
        // Load obstacle sprite
        this.sprite = new Image();
        this.sprite.src = `assets/obstacles/${type}.png`;
    }
    
    update() {
        // Move left
        this.x -= this.speed;
        
        // Rotate
        this.rotation += this.rotationSpeed;
    }
    
    draw() {
        this.ctx.save();
        this.ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        this.ctx.rotate(this.rotation);
        this.ctx.drawImage(
            this.sprite,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        this.ctx.restore();
    }
    
    checkCollision(entity) {
        return (
            this.x < entity.x + entity.width &&
            this.x + this.width > entity.x &&
            this.y < entity.y + entity.height &&
            this.y + this.height > entity.y
        );
    }
} 
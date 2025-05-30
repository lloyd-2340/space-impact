const GAME_CONFIG = {
    // Player settings
    PLAYER: {
        INITIAL_ENERGY: 100,
        MOVEMENT_SPEED: 5,
        FIRE_RATE: 250, // ms between shots
        SLOW_DURATION: 1000, // ms
    },
    
    // Enemy settings
    ENEMY: {
        BASE_HP: 1,
        HP_SCALE_PER_STAGE: 1,
        BASE_SPEED: 2,
        SLOW_EFFECT: 0.5, // speed multiplier when slowed
        SHOOT_CHANCE: 0.3, // chance to shoot per second
    },
    
    // Boss settings
    BOSS: {
        SPAWN_INTERVAL: 3, // every 3rd stage
        BASE_HP: 50,
        GRAND_BOSS_HP: 200,
        HP_SCALE_PER_STAGE: 10,
        ADAPTATION_THRESHOLD: {
            MOVEMENT: 100, // pixels moved to trigger movement-based adaptation
            SHOOTING: 10, // shots fired to trigger shooting-based adaptation
        }
    },
    
    // Power-up settings
    POWER_UPS: {
        GREEN_ORB: {
            TYPE: 'additional',
            DURATION: 0, // permanent
            POWER_INCREASE: 1,
            MAX_STACK: 3,
        },
        BLUE_ORB: {
            TYPE: 'blue',
            DURATION: 0, // permanent
            POWER_INCREASE: 1,
            MAX_STACK: 2,
        },
        PURPLE_ORB: {
            TYPE: 'shield',
            DURATION: 15000, // 15 seconds
            POWER_INCREASE: 0,
        },
        MAX_POWER_LEVEL: 5,
    },
    
    // Projectile settings
    PROJECTILES: {
        PLAYER: {
            SPEED: 7,
            DAMAGE: 1,
            DAMAGE_SCALE: 0.1, // damage increase per stage
        },
        ENEMY: {
            SPEED: 4,
            DAMAGE: 10,
        },
        BOSS: {
            SPEED: 5,
            DAMAGE: 20,
        }
    },
    
    // Obstacle settings
    OBSTACLE: {
        DAMAGE: 15,
        SPEED: 2,
    }
}; 
'use strict';

var ParticleEngine = function(options) {
    var defaults = {
        gravityX: 0,
        gravityY: 0
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.particles = [];
};

ParticleEngine.prototype.addParticle = function(particle) {
    this.particles.push(particle);
};

ParticleEngine.prototype.update = function(deltaTime) {
    var i = 0;
    while (i < this.particles.length) {
        this.particles[i].update(deltaTime, this.gravityX, this.gravityY);
        if (this.particles[i].dead) {
            this.particles.splice(i, 1);
        } else {
            ++i;
        }
    }
};

ParticleEngine.prototype.draw = function(ctx) {
    if (ctx instanceof CanvasRenderingContext2D) {
        ctx.save();
    }
    for (var i = 0; i < this.particles.length; ++i) {
        this.particles[i].draw(ctx);
    }
    if (ctx instanceof CanvasRenderingContext2D) {
        ctx.restore();
    }
};

/**
 * A class that can generate particles based on a distribution of angles/velocities.
 * @param {Object} options Options to use on this ParticleEmitter.
 */
var ParticleEmitter = function(options) {
    var defaults = {
        x: 0,
        y: 0,
        positionSpread: 0, // maximum spread radially from the center
        direction: 0, // degrees from positive x axis
        directionSpread: 360, // degrees
        minVelocity: 0,
        maxVelocity: 0,
        minLifetime: 1, // seconds
        maxLifetime: 3, // seconds
        sizeFunc: Particle.fadeOutLinear,
        opacityFunc: Particle.fastAppearSlowDisappear,
        appearance: Particle.Appearance.CIRCLE,
        color: '#f0f'
    };
    this.options = {};
    for(var key in defaults) {
        if (options.hasOwnProperty(key)) {
            this.options[key] = options[key];
        } else {
            this.options[key] = defaults[key];
        }
    }
};

/**
 * Spawn a single particle using this emitter.
 * @param {Object} options Options to override ones set on this ParticleEmitter.
 * @return {Particle} The created particle.
 */
ParticleEmitter.prototype.emitParticle = function(options) {
    var spawnOptions = {};
    for(var key in this.options) {
        if (options.hasOwnProperty(key)) {
            spawnOptions[key] = options[key];
        } else {
            spawnOptions[key] = this.options[key];
        }
    }
    var direction = (spawnOptions.direction + (Math.random() - 0.5) * spawnOptions.directionSpread) * (Math.PI / 180);
    var absoluteVelocity = spawnOptions.minVelocity +
        Math.random() * (spawnOptions.maxVelocity - spawnOptions.minVelocity);
    spawnOptions.velX = Math.cos(direction) * absoluteVelocity;
    spawnOptions.velY = Math.sin(direction) * absoluteVelocity;
    spawnOptions.seed = Math.floor(Math.random() * 65536);
    spawnOptions.lifetime = spawnOptions.minLifetime +
        Math.random() * (spawnOptions.maxLifetime - spawnOptions.minLifetime);
    if (spawnOptions.positionSpread > 0) {
        var spreadDistance = Math.random() * spawnOptions.positionSpread;
        var spreadAngle = Math.random() * (Math.PI * 2.0);
        spawnOptions.x += Math.cos(spreadAngle) * spreadDistance;
        spawnOptions.y += Math.sin(spreadAngle) * spreadDistance;
    }
    return new Particle(spawnOptions);
};

/**
 * Flexible class for implementing particle effects.
 */
var Particle = function(options) {
    var defaults = {
        lifetime: 2, // seconds
        timeAlive: 0,
        x: 0,
        y: 0,
        velX: 0,
        velY: 0,
        inertia: 1,
        size: 5,
        opacity: 1,
        sizeFunc: Particle.fadeOutLinear,
        opacityFunc: Particle.fastAppearSlowDisappear,
        seed: 0,
        appearance: Particle.Appearance.CIRCLE,
        color: '#f0f'
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.dead = false;
};

Particle.Appearance = {
    CIRCLE: 0
};

Particle.fastAppearSlowDisappear = function(t, seed) {
    return Math.sin(Math.sqrt(t) * Math.PI);
};

Particle.fadeOutLinear = function(t, seed) {
    return 1.0 - t;
};

Particle.prototype.update = function (deltaTime, forceX, forceY) {
    this.timeAlive += deltaTime;
    if (this.timeAlive > this.lifetime) {
        this.dead = true;
        this.timeAlive = this.lifetime;
    }
    this.velX += forceX * deltaTime / this.inertia;
    this.velY += forceY * deltaTime / this.inertia;
    
    this.x += this.velX * deltaTime;
    this.y += this.velY * deltaTime;
};

Particle.prototype.draw = function(ctx) {
    var t = this.timeAlive / this.lifetime;
    var size = this.sizeFunc(t, this.seed) * this.size;
    var opacity = this.opacityFunc(t, this.seed) * this.opacity;
    if (typeof(this.appearance) === 'function') {
        this.appearance(ctx, this.x, this.y, size, opacity);
    } else if (this.appearance === Particle.Appearance.CIRCLE) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
};

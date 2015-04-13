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

ParticleEngine.prototype.addParticle = function(options) {
    this.particles.push(new Particle(options));
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

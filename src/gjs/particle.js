'use strict';

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * A particle engine to run particle effects.
 * To get the same appearance for effects as in the particle editor, leave
 * parameters to their default values.
 * @constructor
 * @param {Object} options Options for the particle engine.
 */
GJS.ParticleEngine = function(options) {
    var defaults = {
        gravityX: 0,
        gravityY: 1
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.particles = [];
    this.effects = [];
};

// This scale value is applied to movement and size of particle effects created
// in the effects editor. It is particularly useful if the GJS.ParticleEngine is
// run in world space which has a considerably different scale than the editor.
GJS.ParticleEngine.defaultEditorEffectScale = 1.0;

/**
 * Add a particle to update and draw with this engine.
 * @param {GJS.Particle} particle GJS.Particle to add.
 */
GJS.ParticleEngine.prototype.addParticle = function(particle) {
    this.particles.push(particle);
};

/**
 * Add an effect to update and draw with this engine.
 * @param {GJS.ParticleEffect} effect GJS.Particle effect to add.
 */
GJS.ParticleEngine.prototype.addEffect = function(effect) {
    this.effects.push(effect);
};

/**
 * Update the particle effects.
 * @param {number} deltaTime Time since the last update in seconds.
 */
GJS.ParticleEngine.prototype.update = function(deltaTime) {
    var i = 0;
    while (i < this.effects.length) {
        this.effects[i].update(deltaTime);
        if (this.effects[i].dead) {
            this.effects.splice(i, 1);
        } else {
            ++i;
        }
    }
    i = 0;
    while (i < this.particles.length) {
        this.particles[i].update(deltaTime, this.gravityX * this.particles[i].weight, this.gravityY * this.particles[i].weight);
        if (this.particles[i].dead) {
            this.particles.splice(i, 1);
        } else {
            ++i;
        }
    }
};

/**
 * Draw the particle effects.
 * @param {CanvasRenderingContext2D|Object} ctx A context to draw the particles to. In case you have a custom
 * appearance function, the context will be passed to that.
 */
GJS.ParticleEngine.prototype.render = function(ctx) {
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
 * GJS.Particle emitter class to control emitting particles with respect to time.
 * @constructor
 * @param {Object} options Options for the emitter.
 */
GJS.ParticleTimedEmitter = function(options) {
    var defaults = {
        emitter: null,
        engine: null,
        x: 0,
        y: 0,
        directionMode: GJS.ParticleTimedEmitter.DirectionMode.RELATIVE,
        particleInterval: 1 / 60, // seconds
        lifetime: -1, // seconds, can be negative for infinite duration
        waitTime: 0, // seconds, time to wait until first starting
        maxParticleCount: -1 // maximum particle count to emit, negative for infinite particles
    };
    for(var key in defaults) {
        if (options.hasOwnProperty(key)) {
            this[key] = options[key];
        } else {
            this[key] = defaults[key];
        }
    }
    this.restart();
};

GJS.ParticleTimedEmitter.DirectionMode = {
    RELATIVE: 0,
    ABSOLUTE: 1
};

/** 
 * Update the emitter. This is called by GJS.ParticleEffect.
 * @param {number} deltaTime Time since the last update in seconds.
 */
GJS.ParticleTimedEmitter.prototype.update = function(deltaTime) {
    if (this.dead) {
        return;
    }
    this._time += deltaTime;
    if (this._time < this.waitTime) {
        return;
    }
    var lastTime = this._timeAlive;
    this._timeAlive += deltaTime;
    if (this._lastX === undefined) {
        this._lastX = this.x;
        this._lastY = this.y;
    }
    var directionBase = 0;
    if (this.directionMode === GJS.ParticleTimedEmitter.DirectionMode.RELATIVE) {
        if (this.x != this._lastX || this.y != this._lastY) {
            directionBase = Math.atan2(this.y - this._lastY, this.x - this._lastX) * 180 / Math.PI;
        }
    }
    while (this._timeAlive > this._emittedTime && !this.dead)
    {
        this._emittedTime += this.particleInterval;
        var t = (this._emittedTime - lastTime) / (this._timeAlive - lastTime);
        var emitter = this.emitter;
        emitter.options.x = this._lastX * (1 - t) + this.x * t;
        emitter.options.y = this._lastY * (1 - t) + this.y * t;
        this.engine.addParticle(emitter.emitParticle({direction: emitter.options.direction + directionBase}));
        ++this._emittedCount;
        if (this._emittedCount >= this.maxParticleCount && this.maxParticleCount >= 0) {
            this.dead = true;
        }
    }
    if (this._timeAlive > this.lifetime && this.lifetime >= 0) {
        this.dead = true;
    }
    this._lastX = this.x;
    this._lastY = this.y;
};

/**
 * Set the coordinates where this emitter is emitting particles.
 * @param {number} x Horizontal coordinate
 * @param {number} y Vertical coordinate
 */
GJS.ParticleTimedEmitter.prototype.setCoords = function(x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Restart this emitter.
 */
GJS.ParticleTimedEmitter.prototype.restart = function() {
    this._lastX = undefined;
    this._lastY = undefined;
    this._time = 0;
    this._timeAlive = 0;
    this._emittedTime = 0;
    this.dead = false;
    this._emittedCount = 0;
};

/**
 * Complex particle effect composed of multiple timed emitters.
 * @constructor
 */
GJS.ParticleEffect = function() {
    this.emitters = [];
    this.dead = false;
};

/** 
 * Update the effect. This is called by GJS.ParticleEngine for effects that have been added to the engine.
 * @param {number} deltaTime Time since the last update in seconds.
 */
GJS.ParticleEffect.prototype.update = function(deltaTime) {
    if (!this.dead) {
        this.dead = true;
        for (var i = 0; i < this.emitters.length; ++i) {
            this.emitters[i].update(deltaTime);
            if (!this.emitters[i].dead) {
                this.dead = false;
            }
        }
    }
};

/**
 * @return {boolean} True if the effect never stops.
 */
GJS.ParticleEffect.prototype.isInfinite = function() {
    for (var i = 0; i < this.emitters.length; ++i) {
        if (this.emitters[i].lifetime < 0) {
            return true;
        }
    }
    return false;
};

/**
 * Set the coordinates where this effect is emitting particles.
 * @param {number} x Horizontal coordinate
 * @param {number} y Vertical coordinate
 */
GJS.ParticleEffect.prototype.setCoords = function(x, y) {
    for (var i = 0; i < this.emitters.length; ++i) {
        this.emitters[i].setCoords(x, y);
    }
};

/**
 * Stop this effect.
 */
GJS.ParticleEffect.prototype.stop = function() {
    this.dead = true;
};

/**
 * A class that can generate particles based on a distribution of angles/velocities.
 * The class only has parameters for generating particles - you need to call emitParticle
 * when you actually want to create a particle based on the parameters.
 * @constructor
 * @param {Object} options Options to use on this GJS.ParticleEmitter.
 */
GJS.ParticleEmitter = function(options) {
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
        rotation: 0, // degrees
        rotationMode: GJS.Particle.RotationMode.STATIC,
        appearance: GJS.Particle.defaultAppearance,
        inertia: 1,
        weight: 1
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
 * @param {Object} options Options to override ones set on this GJS.ParticleEmitter.
 * @return {GJS.Particle} The created particle.
 */
GJS.ParticleEmitter.prototype.emitParticle = function(options) {
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
    var part = new GJS.Particle(spawnOptions);
    if (part.rotationMode === GJS.Particle.RotationMode.INITIAL_DIRECTION) {
        // Determine rotation also if velocity is zero.
        if (spawnOptions.rotation !== undefined) {
            part.rotation = spawnOptions.rotation * Math.PI / 180 + direction;
        } else {
            part.rotation = direction;
        }
    }
    return part;
};

/**
 * Flexible class for implementing particle effects.
 * @constructor
 */
GJS.Particle = function(options) {
    var defaults = {
        lifetime: 2, // seconds
        timeAlive: 0,
        x: 0,
        y: 0,
        velX: 0,
        velY: 0,
        inertia: 1,
        weight: 1,
        rotation: 0, // degrees
        rotationMode: GJS.Particle.RotationMode.STATIC,
        seed: 0,
        appearance: GJS.Particle.defaultAppearance
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.rotation *= Math.PI / 180;
    if (this.rotationMode === GJS.Particle.RotationMode.INITIAL_DIRECTION) {
        this.rotation += Math.atan2(this.velY, this.velX);
    }
    if (this.rotationMode === GJS.Particle.RotationMode.RANDOM) {
        this.rotation = Math.random() * Math.PI * 2;
    }
    this.dead = false;
};

GJS.Particle.RotationMode = {
    STATIC: 0,
    INITIAL_DIRECTION: 1,
    CURRENT_DIRECTION: 2,
    RANDOM: 3
};

/**
 * Appearance that uses the GJS.Sprite class from gameutils.js
 * @param {GJS.Sprite} sprite GJS.Sprite to draw.
 * @param {Object} options Appearence options.
 * @return {function} An appearance function that draws the sprite centered on the particle position.
 */
GJS.Particle.spriteAppearance = function(sprite, options) {
    var defaults = {
        size: 5,
        sizeFunc: GJS.Particle.fadeOutLinear,
        sizeFuncInverse: false,
        opacity: 1,
        opacityFunc: GJS.Particle.fastAppearSlowDisappear,
        opacityFuncInverse: false,
        additive: false
    };
    var _options = {};
    for(var key in defaults) {
        if (defaults.hasOwnProperty(key)) {
            if (!options.hasOwnProperty(key)) {
                _options[key] = defaults[key];
            } else {
                _options[key] = options[key];
            }
        }
    }
    return function(ctx, x, y, rotation, seed, t) {
        if (_options.sizeFuncInverse) {
            var sizeNow = Math.max(0, _options.sizeFunc(1.0 - t, seed)) * _options.size;
        } else {
            var sizeNow = Math.max(0, _options.sizeFunc(t, seed)) * _options.size;
        }
        if (_options.opacityFuncInverse) {
            ctx.globalAlpha = Math.max(0, _options.opacityFunc(1.0 - t, seed)) * _options.opacity;
        } else {
            ctx.globalAlpha = Math.max(0, _options.opacityFunc(t, seed)) * _options.opacity;
        }
        if (_options.additive) {
            ctx.globalCompositeOperation = 'lighter';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        sprite.drawRotated(ctx, x, y, rotation, sizeNow);
    };
};

/**
 * Prerendered circle using the GJS.Sprite class from gameutils.js.
 * May be faster than drawing a circle as a path.
 * @param {string} color CSS color string for the circle.
 * @param {number} resolution Resolution of the sprite to create in pixels. Will not affect the size of the particle
 * when drawing.
 * @param {Object} options Appearence options.
 */
GJS.Particle.prerenderedCircleAppearance = function(color, resolution, options) {
    if (color === undefined) {
        color = '#fff';
    }
    var helperCanvas = document.createElement('canvas');
    helperCanvas.width = resolution;
    helperCanvas.height = resolution;
    var helperCtx = helperCanvas.getContext('2d');
    helperCtx.fillStyle = color;
    helperCtx.beginPath();
    helperCtx.arc(resolution * 0.5, resolution * 0.5, resolution * 0.5, 0, Math.PI * 2);
    helperCtx.fill();
    var sprite = new GJS.Sprite(helperCanvas);
    var spriteOptions = {};
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            spriteOptions[key] = options[key];
        }
    }
    if (spriteOptions.size === undefined) {
        spriteOptions.size = 5;
    }
    spriteOptions.size /= resolution;
    return GJS.Particle.spriteAppearance(sprite, spriteOptions);
};

/**
 * A function for fast appearance and slow disappearance.
 * @param {number} t Time.
 * @param {number} seed Random seed.
 */
GJS.Particle.fastAppearSlowDisappear = function(t, seed) {
    return Math.sin(Math.sqrt(t) * Math.PI);
};

/**
 * A function for linear fade out.
 * @param {number} t Time.
 * @param {number} seed Random seed.
 */
GJS.Particle.fadeOutLinear = function(t, seed) {
    return 1.0 - t;
};

/**
 * A function for a constant value.
 * @param {number} t Time.
 * @param {number} seed Random seed.
 */
GJS.Particle.constant = function(t, seed) {
    return 1.0;
};

/** 
 * Update a particle. This is called by GJS.ParticleEngine.
 * @param {number} deltaTime Time since the last update in seconds.
 * @param {number} forceX Force to apply to the particle in horizontal direction.
 * @param {number} forceY Force to apply to the particle in vertical direction.
 */
GJS.Particle.prototype.update = function (deltaTime, forceX, forceY) {
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

/**
 * Draw the particle.
 * @param {CanvasRenderingContext2D|Object} ctx A context to draw the particles to. In case you have a custom
 * appearance function, the context will be passed to that.
 */
GJS.Particle.prototype.draw = function(ctx) {
    var t = this.timeAlive / this.lifetime;
    var rotation = this.rotation;
    if (this.rotationMode === GJS.Particle.RotationMode.CURRENT_DIRECTION) {
        rotation += Math.atan2(this.velY, this.velX);
    }
    this.appearance(ctx, this.x, this.y, rotation, this.seed, t);
};

GJS.Particle.defaultAppearance = GJS.Particle.prerenderedCircleAppearance('#fff', 8, {});

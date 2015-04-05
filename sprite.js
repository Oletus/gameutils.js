'use strict';

/**
 * A sprite that can be drawn on a 2D canvas.
 * @constructor
 * @param {string|HTMLImageElement|HTMLCanvasElement} filename File to load or a graphical element that's already
 * loaded.
 * @param {string=} solidColor Optional CSS color string to turn the Sprite solid colored.
 */
var Sprite = function(filename, /* Optional */ solidColor) {
    var turnSolidColored = function(sprite, cssColor) {
        var canvas2 = document.createElement('canvas');
        canvas2.width = sprite.width;
        canvas2.height = sprite.height;
        var ctx2 = canvas2.getContext('2d');
        ctx2.fillStyle = cssColor;
        ctx2.fillRect(0, 0, canvas2.width, canvas2.height);
        ctx2.globalCompositeOperation = 'destination-in';
        sprite.draw(ctx2, 0, 0);
        sprite.img = canvas2;
    };
    this.filename = filename;
    Sprite.createdCount++;
    if (typeof this.filename != typeof '') {
        this.img = this.filename;
        this.loaded = true;
        Sprite.loadedCount++;
        this.width = this.filename.width;
        this.height = this.filename.height;
        if (solidColor !== undefined) {
            turnSolidColored(this, solidColor);
        }
    } else {
        this.img = document.createElement('img');
        this.img.src = Sprite.gfxPath + filename;
        var that = this;
        this.loaded = false;
        this.img.onload = function() {
            that.loaded = true;
            Sprite.loadedCount++;
            that.width = that.img.width;
            that.height = that.img.height;
            if (solidColor !== undefined) {
                turnSolidColored(that, solidColor);
            }
        };
    }
};

/**
 * Path for graphics files. Set this before creating any Sprite objects.
 */
Sprite.gfxPath = 'assets/gfx/';

/**
 * How many Sprite objects have been created.
 */
Sprite.createdCount = 0;
/**
 * How many Sprite objects have been fully loaded.
 */
Sprite.loadedCount = 0;

/**
 * @return {number} Amount of Sprite objects that have been fully loaded per amount that has been created.
 */
Sprite.loadedFraction = function() {
    return Sprite.loadedCount / Sprite.createdCount;
};

/**
 * Draw this to the given 2D canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} leftX X coordinate of the left edge.
 * @param {number} topY Y coordinate of the top edge.
 */
Sprite.prototype.draw = function(ctx, leftX, topY) {
    if (this.loaded) {
        ctx.drawImage(this.img, leftX, topY);
    }
};

/**
 * Draw the sprite to the given 2D canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} centerX X coordinate of the center of the sprite on the canvas.
 * @param {number} centerY Y coordinate of the center of the sprite on the canvas.
 * @param {number} angleRadians Angle to rotate the sprite with (relative to its center).
 * @param {number} scale Scale to scale the sprite with (relative to its center).
 */
Sprite.prototype.drawRotated = function(ctx, centerX, centerY, angleRadians, /* optional */ scale) {
    if (!this.loaded) {
        return;
    }
    if (angleRadians === undefined) {
        angleRadians = 0.0;
    }
    if (scale === undefined) {
        scale = 1.0;
    }
    if (this.loaded) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRadians);
        ctx.scale(scale, scale);
        ctx.translate(-this.width * 0.5, -this.height * 0.5);
        ctx.drawImage(this.img, 0, 0);
        ctx.restore();
    }
};

/**
 * Draw the sprite to the given 2D canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} centerX X coordinate of the center of the sprite on the canvas.
 * @param {number} centerY Y coordinate of the center of the sprite on the canvas.
 * @param {number} angleRadians Angle to rotate the sprite with (relative to its center).
 * @param {number} scaleX Scale to scale the sprite with along the x axis (relative to its center).
 * @param {number} scaleY Scale to scale the sprite with along the y axis (relative to its center).
 */
Sprite.prototype.drawRotatedNonUniform = function(ctx, centerX, centerY, angleRadians, scaleX, scaleY) {
    if (!this.loaded) {
        return;
    }
    if (angleRadians === undefined) {
        angleRadians = 0.0;
    }
    if (scaleX === undefined) {
        scale = 1.0;
    }
    if (scaleY === undefined) {
        scale = 1.0;
    }
    if (this.loaded) {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleRadians);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-this.width * 0.5, -this.height * 0.5);
        ctx.drawImage(this.img, 0, 0);
        ctx.restore();
    }
};

/**
 * Fill the canvas with the sprite, preserving the sprite's aspect ratio, with the sprite centered on the canvas.
 * @param {CanvasRenderingContext2D} ctx
 */
Sprite.prototype.fillCanvas = function(ctx) {
    if (!this.loaded) {
        return;
    }
    var scale = Math.max(ctx.canvas.width / this.width, ctx.canvas.height / this.height);
    this.drawRotated(ctx, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, 0, scale);
};

/**
 * Fill the canvas with the sprite, preserving the sprite's aspect ratio, with the sprite's bottom touching the bottom
 * of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 */
Sprite.prototype.fillCanvasFitBottom = function(ctx) {
    if (!this.loaded) {
        return;
    }
    var scale = Math.max(ctx.canvas.width / this.width, ctx.canvas.height / this.height);
    this.drawRotated(ctx, ctx.canvas.width * 0.5, ctx.canvas.height - scale * this.height * 0.5, 0, scale);
};

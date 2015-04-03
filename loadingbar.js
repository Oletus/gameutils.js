'use strict';

/**
 * Loading bar.
 * @param {Array.<Object>=} objectsToPoll Objects that contain loadedFraction()
 * function that returns 1 when the object is fully loaded.
 * @constructor
 */
var LoadingBar = function(objectsToPoll) {
    if (objectsToPoll === undefined) {
        objectsToPoll = [];
        if ('Sprite' in window) {
            objectsToPoll.push(Sprite);
        }
        if ('Audio' in window) {
            objectsToPoll.push(Audio);
        }
    }
    this.objectsToPoll = objectsToPoll;
    this.loadedFraction = 0;
    this.allLoaded = false;
};

/**
 * @param {number} deltaTime Time passed from the last frame.
 * @return {boolean} True when fully loaded.
 */
LoadingBar.prototype.update = function(deltaTime) {
    if (this.allLoaded) {
        return this.allLoaded;
    }
    this.loadedFraction = 0;
    this.allLoaded = true;
    for (var i = 0; i < this.objectsToPoll.length; ++i) {
        var loadedFraction = this.objectsToPoll[i].loadedFraction();
        if (loadedFraction < 1) {
            this.allLoaded = false;
        }
        this.loadedFraction += loadedFraction / this.objectsToPoll.length;
    }
    return this.allLoaded;
};

/**
 * @return {boolean} True when fully loaded.
 */
LoadingBar.prototype.finished = function() {
    return this.allLoaded;
};

/** 
 * @param {CanvasRenderingContext2D} ctx Context to draw the loading bar to.
 */
LoadingBar.prototype.render = function(ctx) {
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-100, -30, 200, 60);
    ctx.fillStyle = '#000';
    ctx.fillRect(-95, -25, 190, 50);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-90, -20, 180 * this.loadedFraction, 40);
    ctx.restore();
};

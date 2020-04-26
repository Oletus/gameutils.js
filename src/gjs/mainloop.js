
/**
 * Start a main loop on the provided game with the provided options.
 * @param {Array.<Object>} updateables Objects with two functions: update() and render().
 *   update(deltaTime) should update the game state. The deltaTime parameter
 *   is time passed since the last update in seconds.
 *   render() should draw the current game state and optionally return a
 *   CanvasRenderingContext2D that the following updateables in the array will use.
 *   Updateables that are processed after the first one receive this rendering context
 *   as a parameter.
 * @param {Object} options Takes the following keys (all optional):
 *
 * updateFPS: number OR Object
 *  The rate at which the game state receives update() calls.
 *  Having a fixed update rate can help you to make the game deterministic
 *  and to keep physics calculations stable.
 *  Every update is not necessarily displayed on the screen.
 *  Alternatively an object with keys min and max, like: {min: 59, max: 121},
 *  which will cause updates to come at variable intervals. This is more
 *  suitable for some VR applications.
 *
 * debugMode: boolean
 *  If Mousetrap is imported, you may hold F to speed up the game
 *  execution or G to slow it down while in debug mode.
 *
 * frameLog: boolean
 *  When frame log is on, a timeline of frames is drawn on the canvas returned
 *  from updateables[i].render().
 *  - Green in the log is an update which was rendered to the screen.
 *  - Orange in the log is an update which was not rendered to the screen.
 *  - White in the log is a frame on which the game state was not updated.
 *
 * onRefocus: function
 *  Function that should be called when the window becomes visible after it
 *  has been invisible for a while.
 *
 * requestAnimationFrame: function
 *  Function that should be used as requestAnimationFrame to synchronize updates
 *  with the display. Defaults to using window.requestAnimationFrame. Use this
 *  to redirect to VRDisplay.requestAnimationFrame in VR applications.
 */
var startMainLoop = function(updateables, options) {
    var defaults = {
        updateFPS: 60,
        debugMode: false,
        frameLog: false,
        onRefocus: null,
        requestAnimationFrame: null
    };

    if (options === undefined) {
        options = {};
    }
    for(var key in defaults) {
        if(!options.hasOwnProperty(key)) {
            options[key] = defaults[key];
        }
    }
    if (!(updateables instanceof Array)) {
        updateables = [updateables];
    }

    var now = function() {
        if (typeof performance !== 'undefined' && 'now' in performance) {
            return performance.now();
        } else {
            return Date.now();
        }
    };

    var minUpdateFPS = 60;
    var maxUpdateFPS = 60;
    if (typeof options.updateFPS === 'number') {
        minUpdateFPS = options.updateFPS;
        maxUpdateFPS = options.updateFPS;
    } else {
        minUpdateFPS = options.updateFPS.min;
        maxUpdateFPS = options.updateFPS.max;
    }

    var minTimePerUpdate = 1000 / maxUpdateFPS; // In milliseconds
    var maxTimePerUpdate = 1000 / minUpdateFPS;

    var nextFrameAllowedTime = -1;
    
    var requestAnimationFrameFunc = options.requestAnimationFrame;
    if (requestAnimationFrameFunc === null) {
        requestAnimationFrameFunc = window.requestAnimationFrame;
    }

    var frameLog = [];

    // Convert a time value to x value in log display.
    var logTimeToX = function(time, lastTime, canvasWidth) {
        var fpsMult = Math.max(60, maxUpdateFPS) / 60;
        return (canvasWidth - 1) - (Math.ceil(lastTime / 2000) * 2000 - time) * 0.2 * fpsMult;
    }

    var drawFrameLog = function(ctx, callbackTime) {
        var w = ctx.canvas.width;
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, 10);

        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#0f0';
        var lastTime = callbackTime;
        var i = frameLog.length;
        var x = ctx.canvas.width;
        while (i > 0 && x > 0) {
            --i;
            var frameStats = frameLog[i];
            if (frameStats.updates >= 1) {
                ctx.fillRect(logTimeToX(frameStats.time, lastTime, w), 0, 2, 10);
                    if (frameStats.updates > 1) {
                    ctx.fillStyle = '#f84';
                    for (var j = 1; j < frameStats.updates; ++j) {
                        var updateX = logTimeToX(frameStats.time - (j - 0.5) * minTimePerUpdate, lastTime, w);
                        ctx.fillRect(Math.round(updateX), 0, 2, 10);
                    }
                    ctx.fillStyle = '#0f0';
                }
            } else {
                ctx.fillStyle = '#fff';
                ctx.fillRect(logTimeToX(frameStats.time, lastTime, w), 0, 2, 10);
                ctx.fillStyle = '#0f0';
            }
        }
        ctx.restore();
    };
    
    var visible = true;
    var visibilityChange = function() {
        visible = document.visibilityState == document.PAGE_VISIBLE || (document.hidden === false);
        nextFrameAllowedTime = -1;
        if (visible && options.onRefocus != null) {
            options.onRefocus();
        }
    };
    
    document.addEventListener('visibilitychange', visibilityChange);

    var fastForward = false;
    var slowedDown = false;
    if (options.debugMode && typeof window.Mousetrap !== 'undefined' && window.Mousetrap.bindGlobal !== undefined) {
        var speedUp = function() {
            fastForward = true;
        };
        var noSpeedUp = function() {
            fastForward = false;
        };
        var slowDown = function() {
            slowedDown = true;
        };
        var noSlowDown = function() {
            slowedDown = false;
        };
        window.Mousetrap.bindGlobal('f', speedUp, 'keydown');
        window.Mousetrap.bindGlobal('f', noSpeedUp, 'keyup');
        window.Mousetrap.bindGlobal('g', slowDown, 'keydown');
        window.Mousetrap.bindGlobal('g', noSlowDown, 'keyup');
    }

    var frame = function() {
        // Process a single requestAnimationFrame callback
        if (!visible) {
            requestAnimationFrameFunc(frame);
            return;
        }
        var time = now();
        var callbackTime = time;
        var updated = false;
        var updates = 0;
        if (nextFrameAllowedTime < 0) {
            nextFrameAllowedTime = time - minTimePerUpdate * 0.5;
        }
        // If there's been a long time since the last callback, it can be a sign that the game
        // is running very badly but it is possible that the game has gone out of focus entirely.
        // In either case, it is reasonable to do a maximum of half a second's worth of updates
        // at once.
        if (time - nextFrameAllowedTime > 500) {
            nextFrameAllowedTime = time - 500;
        }
        while (time > nextFrameAllowedTime) {
            var updateDeltaTime = minTimePerUpdate;
            if (minUpdateFPS != maxUpdateFPS) {
                var flexDeltaTime = time - nextFrameAllowedTime + minTimePerUpdate * 0.5;
                if (flexDeltaTime > maxTimePerUpdate) {
                    flexDeltaTime = maxTimePerUpdate;
                } else if (flexDeltaTime < minTimePerUpdate) {
                    flexDeltaTime = minTimePerUpdate;
                }
                updateDeltaTime = flexDeltaTime;
            }
            if (fastForward) {
                nextFrameAllowedTime += updateDeltaTime / 5;
            } else if (slowedDown) {
                nextFrameAllowedTime += updateDeltaTime * 5;
            } else {
                nextFrameAllowedTime += updateDeltaTime;
            }
            for (var i = 0; i < updateables.length; ++i) {
                updateables[i].update(updateDeltaTime * 0.001);
            }
            updates++;
        }
        if (options.frameLog) {
            frameLog.push({time: callbackTime, updates: updates});
        }
        if (updates > 0) {
            var ctx = updateables[0].render();
            for (var i = 1; i < updateables.length; ++i) {
                var candidateCtx = updateables[i].render(ctx);
                if (candidateCtx !== undefined) {
                    ctx = candidateCtx;
                }
            }
            if (options.frameLog && (ctx instanceof CanvasRenderingContext2D)) {
                drawFrameLog(ctx, callbackTime);
                if (frameLog.length >= 1024) {
                    frameLog.splice(0, 512);
                }
            }
        }
        requestAnimationFrameFunc(frame);
    };
    frame();
};

export { startMainLoop }

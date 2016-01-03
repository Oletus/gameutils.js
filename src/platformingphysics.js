'use strict';

/**
 * Helpers for doing platforming physics, including tile classes and a function to evaluate movement with collisions.
 * Using the platforming physics classes requires TileMap.
 */
var PlatformingPhysics = {};

/**
 * A character that moves in the platforming level, colliding into other objects and tile maps.
 * @constructor
 */
var PlatformingCharacter = function() {
};

/**
 * Initialize the character.
 * @param {Object} options Options for the character. May contain:
 *   x: number
 *   y: number
 */
PlatformingCharacter.prototype.init = function(options) {
    var defaults = {
        x: 0,
        y: 0
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.lastX = this.x;
    this.lastY = this.y;
    this.dx = 0;
    this.dy = 0;
    this.color = '#f00';
    this.onGround = true;
    this.airTime = 0;
    this.lastDeltaTime = 0;
    this.collisionGroup = '_all';
};

/**
 * Override this to control the this.dx value that the character uses on each frame.
 * @param {number} deltaTime
 */
PlatformingCharacter.prototype.decideDx = function(deltaTime) {
};

/**
 * Update the x value and do some related bookkeeping.
 * @param {number} deltaTime
 * @param {Array.<PlatformingCharacter>} colliders Objects to collide against.
 */
PlatformingCharacter.prototype.updateX = function(deltaTime, colliders) {
    this.lastDeltaTime = deltaTime;
    this.stayOnGround = this.onGround;
    PlatformingPhysics.moveAndCollide(this, deltaTime, 'x', colliders, this.stayOnGround);
};

/**
 * Override this to control the this.dy value that the character uses on each frame.
 * @param {number} deltaTime
 */
PlatformingCharacter.prototype.decideDy = function(deltaTime) {
    this.dy += 1.0 * deltaTime;
};

/**
 * Update the y value and do some related bookkeeping.
 * @param {number} deltaTime
 * @param {Array.<PlatformingCharacter>} colliders Objects to collide against.
 */
PlatformingCharacter.prototype.updateY = function(deltaTime, colliders) {
    this.onGround = false;
    PlatformingPhysics.moveAndCollide(this, deltaTime, 'y', colliders, this.stayOnGround);
    if (this.onGround) {
        this.airTime = 0.0;
    } else {
        this.airTime += deltaTime;
    }
};

/**
 * Callback when the character touches ground.
 */
PlatformingCharacter.prototype.touchGround = function() {
    this.onGround = true;
    // TODO: The Math.max is problematic if it's desired that a collider would launch the character into the air.
    // On the other hand it's not desired that upwards slopes would launch the character.
    this.dy = Math.max((this.y - this.lastY) / this.lastDeltaTime, 0);
};

/**
 * Callback when the character touches the ceiling.
 */
PlatformingCharacter.prototype.touchCeiling = function() {
    this.dy = 0;
};

/**
 * Debug rendering of the character.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 */
PlatformingCharacter.prototype.render = function(ctx) {
    ctx.fillStyle = this.color;
    var rect = this.getRect();
    ctx.fillRect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
};

/**
 * Get the object's collision rectangle in case the object is positioned at x, y.
 * Override this instead of getRect or getLastRect.
 * @param {number} x Horizontal position.
 * @param {number} y Vertical position.
 * @return {Rect} Collision rectangle.
 */
PlatformingCharacter.prototype.getPositionedRect = function(x, y) {
    var width = 1.0;
    var height = 2.0;
    return new Rect(x - width * 0.5, x + width * 0.5,
                    y - height * 0.5, y + height * 0.5);
};

/**
 * Get the object's collision rectangle with the current coordinates for the object.
 * @return {Rect} Collision rectangle.
 * @final
 */
PlatformingCharacter.prototype.getRect = function() {
    return this.getPositionedRect(this.x, this.y);
};

/**
 * Get the object's collision rectangle with the coordinates for the object in the beginning of the current frame.
 * @return {Rect} Collision rectangle.
 * @final
 */
PlatformingCharacter.prototype.getLastRect = function() {
    return this.getPositionedRect(this.lastX, this.lastY);
};

/**
 * A tile map that can be a part of a platforming level.
 * @constructor
 */
var PlatformingTileMap = function() {
};

PlatformingTileMap.prototype = new PlatformingCharacter();

/**
 * Initialize the tilemap.
 * @param {Object} options Options for the tilemap. May contain:
 *   tileMap: TileMap. Mandatory.
 *   x: number
 *   y: number
 */
PlatformingTileMap.prototype.init = function(options) {
    PlatformingCharacter.prototype.init.call(this, options);
    var defaults = {
        tileMap: null,
        tilesAffectMovingTilemaps: false
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.frameDeltaX = 0;
    this.frameDeltaY = 0;
    this.collisionGroup = '_none';
};

/**
 * Get the object's collision rectangle in case the object is positioned at x, y.
 * @param {number} x Horizontal position.
 * @param {number} y Vertical position.
 * @return {Rect} Collision rectangle.
 */
PlatformingTileMap.prototype.getPositionedRect = function(x, y) {
    return new Rect(x, x + this.tileMap.width,
                    y, y + this.tileMap.height);
};

/**
 * Control the this.dx value that the character uses on each frame.
 * @param {number} deltaTime
 */
PlatformingTileMap.prototype.decideDx = function(deltaTime) {
    this.dx = 0;
};

/**
 * Control the this.dy value that the character uses on each frame.
 * @param {number} deltaTime
 */
PlatformingTileMap.prototype.decideDy = function(deltaTime) {
    this.dy = 0;
};

/**
 * A platforming level composed of tilemaps and objects that collide against them (or against each other).
 * @constructor
 */
var PlatformingLevel = function() {
};

/**
 * Initialize the level.
 */
PlatformingLevel.prototype.init = function() {
    this._objects = [];
    this._tileMapObjects = [];
    this._colliders = {'_all': []}; // All is a special collision group that includes all objects.
};

/**
 * Add an object to the level.
 * @param {PlatformingCharacter} object Object to add.
 * @param {Array.<string>} collisionGroups Collision groups to add the object to. Will automatically be added to
 *     the "_all" collision group.
 */
PlatformingLevel.prototype.pushObject = function(object, collisionGroups) {
    if (object instanceof PlatformingTileMap) {
        this._tileMapObjects.push(object);
    } else {
        this._objects.push(object);
    }
    if (collisionGroups !== undefined) {
        for (var i = 0; i < collisionGroups.length; ++i) {
            if (collisionGroups[i] !== '_all' && collisionGroups[i] !== '_none') {
                if (!this._colliders.hasOwnProperty(collisionGroups[i])) {
                    this._colliders[collisionGroups[i]] = [];
                }
                this._colliders[collisionGroups[i]].push(object);
            }
        }
    }
    this._colliders['_all'].push(object);
};

/**
 * Update all object positions.
 * Tilemap objects may move. Their movement only affects the movement of other objects via collisions (so for example
 * logic for player movement matching moving platforms must be implemented in the decideDx function).
 * When the movement of the tilemap objects themselves is evaluated, the tilemap doesn't affect possible collisions,
 * only the object's bounding geometry does.
 * @param {number} deltaTime
 */
PlatformingLevel.prototype.update = function(deltaTime) {
    for (var i = 0; i < this._objects.length; ++i) {
        var object = this._objects[i];
        object.lastX = object.x;
        object.lastY = object.y;
    }
    for (var i = 0; i < this._tileMapObjects.length; ++i) {
        var object = this._tileMapObjects[i];
        object.lastX = object.x;
        object.lastY = object.y;
        object.decideDx(deltaTime);
    }
    for (var i = 0; i < this._tileMapObjects.length; ++i) {
        var object = this._tileMapObjects[i];
        // tilemaps which affect moving tilemaps may not move.
        if (!object.tilesAffectMovingTilemaps) {
            object.updateX(deltaTime, this._colliders[object.collisionGroup]);
            // Save the real x movement of the tilemap this frame, so that other objects can take it into account
            // when colliding against it.
            object.frameDeltaX = object.x - object.lastX;
        }
    }
    for (var i = 0; i < this._objects.length; ++i) {
        var object = this._objects[i];
        object.decideDx(deltaTime);
    }
    for (var i = 0; i < this._objects.length; ++i) {
        var object = this._objects[i];
        object.updateX(deltaTime, this._colliders[object.collisionGroup]);
    }

    for (var i = 0; i < this._tileMapObjects.length; ++i) {
        var object = this._tileMapObjects[i];
        object.decideDy(deltaTime);
    }
    for (var i = 0; i < this._tileMapObjects.length; ++i) {
        var object = this._tileMapObjects[i];
        // tilemaps which affect moving tilemaps may not move.
        if (!object.tilesAffectMovingTilemaps) {
            object.updateY(deltaTime, this._colliders[object.collisionGroup]);
            // Save the real y movement of the tilemap this frame, so that other objects can take it into account
            // when colliding against it.
            object.frameDeltaY = object.y - object.lastY;
        }
    }
    for (var i = 0; i < this._objects.length; ++i) {
        var object = this._objects[i];
        object.decideDy(deltaTime);
    }
    for (var i = 0; i < this._objects.length; ++i) {
        var object = this._objects[i];
        object.updateY(deltaTime, this._colliders[object.collisionGroup]);
    }
};

 
/**
 * A platforming tile.
 * @constructor
 */
var PlatformingTile = function() {
};

/**
 * @return {number} floor height inside sloping tile.
 */
PlatformingTile.prototype.getFloorRelativeHeight = function(xInTile) {
    return 0.0;
};

/**
 * Set the position of the tile.
 */
PlatformingTile.prototype.setPos = function(x, y) {
    this._x = x;
    this._y = y;
};

/**
 * @return {number} maximum floor height inside sloping tile.
 */
PlatformingTile.prototype.getMaxFloorRelativeHeight = function() {
    return Math.max(this.getFloorRelativeHeight(0), this.getFloorRelativeHeight(1));
};

/**
 * @return {boolean} True if the tile is a wall for movement towards any direction.
 */
PlatformingTile.prototype.isWall = function() {
    return false;
};

/**
 * @return {boolean} True if the tile is a wall for upwards movement (negative y).
 */
PlatformingTile.prototype.isWallUp = function() {
    return false;
};

/**
 * @return {boolean} True if the tile is sloped for objects moving above it.
 */
PlatformingTile.prototype.isFloorSlope = function() {
    return false;
};


/**
 * A tile with a sloped floor.
 * @constructor
 */
var SlopedFloorTile = function(floorLeft, floorRight) {
    this._floorLeft = floorLeft;
    this._floorRight = floorRight;
    this._maxFloor = Math.max(floorLeft, floorRight);
    this._minFloor = Math.min(floorLeft, floorRight);
};

SlopedFloorTile.prototype = new PlatformingTile();

/**
 * @return {number} floor height inside sloping tile. Must be monotonically increasing or decreasing inside the tile.
 */
SlopedFloorTile.prototype.getFloorRelativeHeight = function(xInTile) {
    return mathUtil.clamp(this._minFloor, this._maxFloor, mathUtil.mix(this._floorLeft, this._floorRight, xInTile));
};

/**
 * @return {boolean} True if the tile is sloped for objects moving above it.
 */
SlopedFloorTile.prototype.isFloorSlope = function() {
    return true;
};

/**
 * Render the sloped tile on a canvas.
 * @param {CanvasRenderingContext2D} ctx 2D rendering context to use for drawing.
 */
SlopedFloorTile.prototype.render = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this._x, this._y + 1);
    for (var x = 0; x <= 1; x += 0.25) {
        var h = mathUtil.clamp(0, 1, this.getFloorRelativeHeight(x));
        ctx.lineTo(this._x + x, this._y + 1 - h);
    }
    ctx.lineTo(this._x + 1, this._y + 1);
    ctx.fill();
};

/**
 * A tile that's a wall.
 * @constructor
 * @param {boolean} wallUp True if the wall affects upwards movement (negative y).
 */
var WallTile = function(wallUp) {
    if (wallUp === undefined) {
        wallUp = true;
    }
    this._wallUp = wallUp;
};

WallTile.prototype = new PlatformingTile();

/**
 * @return {boolean} True if the tile is a wall for movement towards any direction.
 */
WallTile.prototype.isWall = function() {
    return true;
};

/**
 * @return {boolean} True if the tile is a wall for upwards movement (negative y).
 */
WallTile.prototype.isWallUp = function() {
    return this._wallUp;
};


/**
 * Get a tile map initializer based on an array of character codes representing tiles.
 * @param {Array} data Tile letter codes in an array in row-major form. Example:
 *         ['xxx.      /xxx ',
 *          '  xx^^^^^^xx   '],
 *     Character codes are:
 *         x: wall.
 *         ^: can be jumped through from below, not passable from above.
 *         .: 45 degree slope rising towards left.
 *         /: 45 degree slope rising towards right.
 *         l: low 26 degree slope rising towards left.
 *         L: high 26 degree slope rising towards left.
 *         r: low 26 degree slope rising towards right.
 *         R: high 26 degree slope rising towards right.
 *          : empty space.
 *
 * @param {boolean?} flippedX Set to true to flip the data in the x direction.
 * @return {function} Function that will initialize a TileMap with PlatformingTiles.
 */
PlatformingPhysics.initFromData = function(data, flippedX) {
    if (flippedX === undefined) {
        flippedX = false;
    }
    var transformedData = [];
    for (var i = 0; i < data.length; ++i) {
        var row = data[i];
        var transformedRow = [];
        for (var j = 0; j < row.length; ++j) {
            var tile = null;
            if (row[j] == 'x') {
                tile = new WallTile(true);
            } else if (row[j] == '^') {
                tile = new WallTile(false);
            } else if ((row[j] == '/' && !flippedX) || (row[j] == '.' && flippedX)) {
                tile = new SlopedFloorTile(0, 1);
            } else if ((row[j] == '.' && !flippedX) || (row[j] == '/' && flippedX)) {
                tile = new SlopedFloorTile(1, 0);
            } else if ((row[j] == 'L' && !flippedX) || (row[j] == 'R' && flippedX)) {
                tile = new SlopedFloorTile(1, 0.5);
            } else if ((row[j] == 'R' && !flippedX) || (row[j] == 'L' && flippedX)) {
                tile = new SlopedFloorTile(0.5, 1);
            } else if ((row[j] == 'l' && !flippedX) || (row[j] == 'r' && flippedX)) {
                tile = new SlopedFloorTile(0.5, 0);
            } else if ((row[j] == 'r' && !flippedX) || (row[j] == 'l' && flippedX)) {
                tile = new SlopedFloorTile(0, 0.5);
            } else  {
                tile = new PlatformingTile();
            }
            var x = j;
            if (flippedX) {
                x = row.length - j - 1;
            }
            tile.setPos(x, i);
            transformedRow.push(tile);
        }
        transformedData.push(transformedRow);
    }
    return TileMap.initFromData(transformedData, flippedX);
};


/**
 * Move an object along one axis, reacting to collisions.
 * @param {Object} movingObj Object that moves. Needs to have the following properties in the world coordinate system:
 *   x, y, dx, dy, getRect()
 * Properties to react to y collisions:
 *   touchGround(), touchCeiling()
 * @param {number} deltaTime Time step to use to move the object.
 * @param {string} dim Either 'x' or 'y' to move the object horizontally or vertically.
 * @param {Array?} colliders List of objects to collide against. The moved object is automatically excluded in case it
 * is in this array. Colliders must report coordinates relative to the world. Colliders must be PlatformingCharacters.
 * @param {boolean} stayOnGround True if the character should try to follow the ground when going down on a slope.
 */
PlatformingPhysics.moveAndCollide = function(movingObj, deltaTime, dim, colliders, stayOnGround) {
    var maxStepUp = 0.1;
    var isWall = function(tile) {
        return tile.isWall();
    };
    var isWallUp = function(tile) {
        return tile.isWallUp();
    };
    var isFloorSlope = function(tile) {
        return tile.isFloorSlope();
    };
    var done = false;
    var delta = 0;
    if (dim == 'x') {
        delta = movingObj.dx * deltaTime;
    } else {
        delta = movingObj.dy * deltaTime;
    }
    var lastDelta = delta;
    var isMovingObjTileMap = (movingObj instanceof PlatformingTileMap);
    while (!done) {
        var rect = movingObj.getRect();
        done = true;
        if (dim == 'x') {
            var rectRightHalfWidth = rect.right - movingObj.x;
            var rectLeftHalfWidth = movingObj.x - rect.left;
            var rectBottomHalfHeight = rect.bottom - movingObj.y;

            movingObj.x += delta;
            var xColliders = [];
            if (colliders !== undefined) {
                for (var i = 0; i < colliders.length; ++i) {
                    if (colliders[i] === movingObj) {
                        continue;
                    }
                    // Ensure that the y value from the begining of the frame is used.
                    // This adds a bit of flexibility: for example, some objects that don't themselves collide with
                    // anything can update their positions in a single update function.
                    var collider = colliders[i].getPositionedRect(colliders[i].x, colliders[i].lastY);
                    if (rect.top < collider.bottom && collider.top < rect.bottom) {
                        if (colliders[i] instanceof PlatformingTileMap && (!isMovingObjTileMap || colliders[i].tilesAffectMovingTilemaps)) {
                            xColliders.push(colliders[i]);
                        } else {
                            xColliders.push(collider);
                        }
                    }
                }
            }
            var slopeFloorY = movingObj.y + rectBottomHalfHeight + TileMap.epsilon * 2;

            var wallXRight = Number.MAX_VALUE;
            var slopeEndXRight = wallXRight;
            var wallXLeft = -Number.MAX_VALUE;
            var slopeEndXLeft = wallXLeft;

            for (var i = 0; i < xColliders.length; ++i) {
                if (xColliders[i] instanceof PlatformingTileMap) {
                    var fromWorldToTileMap = new Vec2(-xColliders[i].lastX, -xColliders[i].lastY);
                    var relativeDelta = delta - xColliders[i].frameDeltaX;
                    var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                    relativeRect.translate(fromWorldToTileMap);
                    if (relativeDelta <= 0) {
                        var wallTileX = xColliders[i].tileMap.nearestTileLeftFromRect(relativeRect, isWallUp, Math.abs(relativeDelta));
                        if (wallTileX != -1 && wallXLeft < wallTileX + 1 + xColliders[i].x) {
                            wallXLeft = wallTileX + 1 + xColliders[i].x;
                        }
                        var slopeTiles = xColliders[i].tileMap.getNearestTilesLeftFromRect(relativeRect, isFloorSlope, Math.abs(relativeDelta));
                        if (slopeTiles.length != 0) {
                            var possibleWallX = slopeTiles[0]._x + 1 + xColliders[i].x;
                            for (var j = 0; j < slopeTiles.length; ++j) {
                                var slopeTile = slopeTiles[j];
                                var slopeBaseY = slopeTile._y + 1 + xColliders[i].lastY;
                                var slopeIsEffectivelyWall = (slopeBaseY - slopeTile.getFloorRelativeHeight(1) < rect.bottom - maxStepUp);
                                if (wallXLeft < possibleWallX && slopeIsEffectivelyWall) {
                                    wallXLeft = possibleWallX;
                                }
                                if (!slopeIsEffectivelyWall) {
                                    slopeEndXLeft = slopeTile._x + xColliders[i].x;
                                    var relativeX = movingObj.x - slopeEndXLeft;
                                    var slopeYLeft = slopeBaseY -
                                        slopeTile.getFloorRelativeHeight(relativeX - rectLeftHalfWidth);
                                    if (slopeFloorY > slopeYLeft) {
                                        slopeFloorY = slopeYLeft;
                                    }
                                }
                            }
                        }
                    } else {
                        var wallTileX = xColliders[i].tileMap.nearestTileRightFromRect(relativeRect, isWallUp, Math.abs(relativeDelta));
                        if (wallTileX != -1 && wallXRight > wallTileX + xColliders[i].x) {
                            wallXRight = wallTileX + xColliders[i].x;
                        }
                        var slopeTiles = xColliders[i].tileMap.getNearestTilesRightFromRect(relativeRect, isFloorSlope, Math.abs(relativeDelta));
                        if (slopeTiles.length != 0) {
                            var possibleWallX = slopeTiles[0]._x + xColliders[i].x;
                            for (var j = 0; j < slopeTiles.length; ++j) {
                                var slopeTile = slopeTiles[j];
                                var slopeBaseY = slopeTile._y + 1 + xColliders[i].lastY;
                                var slopeIsEffectivelyWall = (slopeBaseY - slopeTile.getFloorRelativeHeight(0) < rect.bottom - maxStepUp);
                                if (wallXRight > possibleWallX && slopeIsEffectivelyWall) {
                                    wallXRight = possibleWallX;
                                }
                                if (!slopeIsEffectivelyWall) {
                                    slopeEndXRight = slopeTile._x + 1 + xColliders[i].x;
                                    var relativeX = movingObj.x - (slopeEndXRight - 1);
                                    var slopeYRight = slopeBaseY -
                                        slopeTile.getFloorRelativeHeight(relativeX + rectRightHalfWidth);
                                    if (slopeFloorY > slopeYRight) {
                                        slopeFloorY = slopeYRight;
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (delta < 0 && xColliders[i].left < rect.right && wallXLeft < xColliders[i].right) {
                        wallXLeft = xColliders[i].right;
                    }
                    if (delta > 0 && xColliders[i].right > rect.left && wallXRight > xColliders[i].left) {
                        wallXRight = xColliders[i].left;
                    }
                }
            }
            
            if (movingObj.x > slopeEndXRight - rectRightHalfWidth + TileMap.epsilon * 2) {
                var afterOriginalMove = movingObj.x;
                movingObj.x = slopeEndXRight - rectRightHalfWidth + TileMap.epsilon * 2;
                delta = afterOriginalMove - movingObj.x;
                // Finish this iteration on the tile boundary and continue movement on the next slope tile.
                if (delta > TileMap.epsilon * 2 && delta < lastDelta) {
                    done = false;
                    lastDelta = delta;
                }
            }
            if (movingObj.x < slopeEndXLeft + rectLeftHalfWidth - TileMap.epsilon * 2) {
                var afterOriginalMove = movingObj.x;
                movingObj.x = slopeEndXLeft + rectLeftHalfWidth - TileMap.epsilon * 2;
                delta = afterOriginalMove - movingObj.x;
                // Finish this iteration on the tile boundary and continue movement on the next slope tile.
                if (delta < -TileMap.epsilon * 2 && delta > lastDelta) {
                    done = false;
                    lastDelta = delta;
                }
            }
            if (movingObj.y > slopeFloorY - rectBottomHalfHeight - TileMap.epsilon) {
                movingObj.y = slopeFloorY - rectBottomHalfHeight - TileMap.epsilon;
            }
            
            // Apply walls only when movement is done. When moving along a slope, the code may have placed
            // the object right beyond the tile boundary for the next iteration so that movement wouldn't
            // be stuck in cases like below:
            //         /
            //  obj-> /x
            //
            // .
            // x. <- obj
            if (movingObj.x > wallXRight - rectRightHalfWidth - TileMap.epsilon && done) {
                movingObj.x = wallXRight - rectRightHalfWidth - TileMap.epsilon;
            }
            if (movingObj.x < wallXLeft + rectLeftHalfWidth + TileMap.epsilon && done) {
                movingObj.x = wallXLeft + rectLeftHalfWidth + TileMap.epsilon;
            }
        } // dim == 'x'
        if (dim == 'y') {
            var delta = movingObj.dy * deltaTime;
            var rectBottomHalfHeight = rect.bottom - movingObj.y;
            var rectTopHalfHeight = movingObj.y - rect.top;
            var rectRightHalfWidth = rect.right - movingObj.x;
            var rectLeftHalfWidth = movingObj.x - rect.left;

            movingObj.y += delta;
            var yColliders = [];
            if (colliders !== undefined) {
                for (var i = 0; i < colliders.length; ++i) {
                    if (colliders[i] === movingObj) {
                        continue;
                    }
                    var collider = colliders[i].getRect();
                    if (rect.left < collider.right && collider.left < rect.right) {
                        if (colliders[i] instanceof PlatformingTileMap && (!isMovingObjTileMap || colliders[i].tilesAffectMovingTilemaps)) {
                            yColliders.push(colliders[i]);
                        } else {
                            yColliders.push(collider);
                        }
                    }
                }
            }
            var wallYDown = Number.MAX_VALUE;
            var wallYUp = -Number.MAX_VALUE;
            var hitSlope = false;
            for (var i = 0; i < yColliders.length; ++i) {
                if (yColliders[i] instanceof PlatformingTileMap) {
                    // X movement has already been fully evaluated
                    var fromWorldToTileMap = new Vec2(-yColliders[i].x, -yColliders[i].lastY);
                    var relativeDelta = delta - yColliders[i].frameDeltaY;
                    var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                    relativeRect.translate(fromWorldToTileMap);
                    if (relativeDelta <= 0) {
                        var wallTileY = yColliders[i].tileMap.nearestTileUpFromRect(relativeRect, isWallUp, Math.abs(relativeDelta));
                        if (wallTileY != -1 && wallYUp < wallTileY + 1 + yColliders[i].y) {
                            wallYUp = wallTileY + 1 + yColliders[i].y;
                        }
                    } else {
                        var origBottom = relativeRect.bottom;
                        relativeRect.bottom += 1;
                        var wallTileY = yColliders[i].tileMap.nearestTileDownFromRect(relativeRect, isWall, Math.abs(relativeDelta));
                        if (wallTileY != -1 && wallYDown > wallTileY + yColliders[i].y) {
                            wallYDown = wallTileY + yColliders[i].y;
                            hitSlope = false;
                        }
                        relativeRect.bottom = origBottom;
                        var slopeTiles = yColliders[i].tileMap.getNearestTilesDownFromRect(relativeRect, isFloorSlope,
                                                                                   Math.max(Math.abs(relativeDelta), 1));
                        if (slopeTiles.length != 0 && wallYDown > slopeTiles[0]._y + yColliders[i].y) {
                            for (var j = 0; j < slopeTiles.length; ++j) {
                                var slopeTile = slopeTiles[j];
                                var relativeX = movingObj.x - (slopeTile._x + yColliders[i].x);
                                var slopeBaseY = slopeTile._y + 1 + yColliders[i].y;
                                var slopeYLeft = slopeBaseY -
                                                 slopeTile.getFloorRelativeHeight(relativeX - rectLeftHalfWidth);
                                var slopeYRight = slopeBaseY -
                                                  slopeTile.getFloorRelativeHeight(relativeX + rectRightHalfWidth);
                                if (slopeYLeft < wallYDown) {
                                    wallYDown = slopeYLeft;
                                    hitSlope = true;
                                }
                                if (slopeYRight < wallYDown) {
                                    wallYDown = slopeYRight;
                                    hitSlope = true;
                                }
                            }
                        }
                    }
                } else {
                    if (delta < 0 && yColliders[i].top < rect.bottom && wallYUp < yColliders[i].bottom) {
                        wallYUp = yColliders[i].bottom;
                    }
                    if (delta > 0 && yColliders[i].bottom > rect.top && wallYDown > yColliders[i].top) {
                        wallYDown = yColliders[i].top;
                    }
                }
            }

            if (movingObj.y > wallYDown - rectBottomHalfHeight - TileMap.epsilon) {
                movingObj.y = wallYDown - rectBottomHalfHeight - TileMap.epsilon;
                movingObj.touchGround();
            } else if (hitSlope && stayOnGround) {
                // TODO: There's still a bug where the character teleports downwards when there's a slope like this:
                // .
                // xl
                movingObj.y = wallYDown - rectBottomHalfHeight - TileMap.epsilon;
                movingObj.touchGround();
            }
            if (movingObj.y < wallYUp + rectTopHalfHeight + TileMap.epsilon) {
                movingObj.y = wallYUp + rectTopHalfHeight + TileMap.epsilon;
                movingObj.touchCeiling();
            }
        }
    }
};

/**
 * Render sloped tiles to a canvas.
 * @param {TileMap} tileMap Map to render.
 * @param {CanvasRenderingContext2D} ctx 2D rendering context to use for drawing.
 */
PlatformingPhysics.renderSlopes = function(tileMap, ctx) {
    for (var y = 0; y < tileMap.height; ++y) {
        for (var x = 0; x < tileMap.width; ++x) {
            var tile = tileMap.tiles[y][x];
            if (tile.isFloorSlope()) {
                tile.render(ctx);
            }
        }
    }
};

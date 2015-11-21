'use strict';

/**
 * Using TileMap requires the Vec2 and Rect classes from util2d.
 */

/**
 * A 2D grid made out of tiles. Tiles can be of any type, but they are strings by default.
 * @constructor
 */
var TileMap = function(options) 
{
    var defaults = {
        width: 1,
        height: 1,
        initTile: function(x, y) { return ' '; }, // Function that returns an initial tile. x and y parameters.
        initEdgeTile: null // Function that returns a tile to fill the edges with. x and y parameters. Optional.
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.tiles = [];
    var tile;
    for (var y = 0; y < this.height; ++y) {
        var row = [];
        for (var x = 0; x < this.width; ++x) {  
            if (this.initEdgeTile != null && (x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1)) {
                tile = this.initEdgeTile(x, y);
            } else {
                tile = this.initTile(x, y);
            }
            row.push(tile);
        }
        this.tiles.push(row);
    }
};

/**
 * @param {Array} data Tiles in an array in row-major form.
 * @return {function} Function to pass as an init function to TileMap constructor.
 */
TileMap.initFromData = function(data) {
    return function(x, y) {
        return data[y][x];
    }
};

/**
 * @param {number} x Horizontal float coordinate
 * @param {number} y Vertical float coordinate
 * @return {Vec2} Integer tile coordinates for the specified tile.
 */
TileMap.prototype.tileAt = function(x, y) {
    var tileX = Math.floor(x);
    var tileY = Math.floor(y);
    return new Vec2(tileX, tileY);
};

/**
 * A function for debug rendering of the tiles. Will fill rectangles at the
 * coordinates of tiles that match.
 * @param {CanvasRenderingContext2D} ctx Context to use.
 * @param {function} matchFunc Gets passed a tile and returns true if the tile should be drawn.
 * @param {number?} extraYTop How much to extend the drawn tiles in the y direction. Defaults to 0.
 * @param {number?} extraYBottom How much to extend the drawn tiles in the y direction. Defaults to 0.
 * @param {number?} extraX How much to extend the drawn tiles in the x direction. Defaults to 0.
 */
TileMap.prototype.render = function(ctx, matchFunc, extraYTop, extraYBottom, extraX) {
    if (extraYTop === undefined) {
        extraYTop = 0;
    }
    if (extraYBottom === undefined) {
        extraYBottom = 0;
    }
    if (extraX === undefined) {
        extraX = 0;
    }
    for (var y = 0; y < this.height; ++y) {
        var matchingTiles = 0;
        var firstMatching = 0;
        for (var x = 0; x < this.width; ++x) {
            var tile = this.tiles[y][x];
            var matching = matchFunc(tile);
            if (matching) {
                if (matchingTiles == 0) {
                    firstMatching = x;
                }
                matchingTiles++;
            }
            if ((!matching || x + 1 >= this.width) && matchingTiles > 0) {
                ctx.fillRect(firstMatching - extraX, y - extraYTop,
                             matchingTiles + extraX * 2, 1.0 + extraYTop + extraYBottom);
            }
            if (!matching) {
                matchingTiles = 0;
            }
        }
    }
};

TileMap.epsilon = 0.00001;

/**
 * @param {Vec2} tileMin
 * @param {Vec2} tileMax
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {boolean} True if there are matching tiles within the area limited by tileMin and tileMax
 * Coordinates are inclusive.
 */
TileMap.prototype.tileInArea = function(tileMin, tileMax, matchFunc) {
    for (var y = tileMin.y; y <= tileMax.y; ++y) {
        for (var x = tileMin.x; x <= tileMax.x; ++x) {
            if (matchFunc(this.tiles[y][x])) {
                return true;
            }
        }
    }    
    return false;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {number} x X coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileLeftFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var match = false;
    var minX = Math.floor(rect.left - maxDistance);
    while (!match && tileMin.x >= 0 && tileMin.x >= minX) {
        // Test one column of tiles
        match = this.tileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            --tileMin.x;
            --tileMax.x;
        }
    }
    return match ? tileMin.x : -1;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {number} x X coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileRightFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var match = false;
    var maxX = Math.floor(rect.right + maxDistance);
    while (!match && tileMin.x < this.width && tileMax.x <= maxX) {
        // Test one column of tiles
        match = this.tileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            ++tileMin.x;
            ++tileMax.x;
        }
    }
    return match ? tileMin.x : -1;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {number} y Y coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileUpFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var match = false;
    var minY = Math.floor(rect.top - maxDistance);
    while (!match && tileMin.y >= 0 && tileMin.y >= minY) {
        // Test one row of tiles
        match = this.tileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            --tileMin.y;
            --tileMax.y;
        }
    }
    return match ? tileMin.y : -1;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {number} y Y coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileDownFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    ++tileMin.y;
    ++tileMax.y;
    var match = false;
    var maxY = Math.floor(rect.bottom + maxDistance);
    while (!match && tileMin.y < this.height && tileMax.y <= maxY) {
        // Test one row of tiles
        match = this.tileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            ++tileMin.y;
            ++tileMax.y;
        }
    }
    return match ? tileMin.y : -1;
};

/**
 * @return {boolean} True if matching tiles overlap the given rectangle.
 */
TileMap.prototype.overlapsTiles = function(rect, matchFunc) {
    var epsilon = TileMap.epsilon;
    var tile = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    return this.tileInArea(tile, tileMax, matchFunc);
};

/**
 * Move an object inside the given tile map along one axis, reacting to collisions.
 * @param {Object} movingObj Object that moves inside the TileMap. Needs to have the following
 * properties in the TileMap coordinate system:
 *   x, y, dx, dy, getRect()
 * Properties to react to y collisions:
 *   touchGround(), touchCeiling()
 * @param {number} deltaTime Time step to use to move the object.
 * @param {string} dim Either 'x' or 'y' to move the object horizontally or vertically.
 * @param {function} isWall A function that takes a tile and returns boolean indicating whether
 * it is a wall for the purposes of collision.
 * @param {Array?} colliders List of objects with a getRect() function to collide against. The moved
 * object is automatically excluded in case it is in this array.
 * @param {function?} isWallUp A function that takes a tile and returns whether it is a wall for upwards movement
 * (negative y). By default isWall is used.
 */
TileMap.prototype.moveAndCollide = function(movingObj, deltaTime, dim, isWall, colliders, isWallUp) {
    var rect = movingObj.getRect();
    if (isWallUp === undefined) {
        isWallUp = isWall;
    }
    if (dim == 'x') {
        var delta = movingObj.dx * deltaTime;
        var wallX = movingObj.x; // Position where the character will be stuck if it meets a wall.
        var rectRightHalfWidth = rect.right - movingObj.x;
        var rectLeftHalfWidth = movingObj.x - rect.left;
        if (Math.abs(delta) > 0) {
            movingObj.x += delta;
            var xColliders = [];
            if (colliders !== undefined) {
                for (var i = 0; i < colliders.length; ++i) {
                    if (colliders[i] === movingObj) {
                        continue;
                    }
                    var collider = colliders[i].getRect();
                    if (rect.top < collider.bottom && collider.top < rect.bottom) {
                        xColliders.push(collider);
                    }
                }
            }
            if (delta > 0) {
                wallX = this.nearestTileRightFromRect(rect, isWallUp, Math.abs(delta));
                if (wallX == -1) {
                    wallX = this.width;
                }
                for (var i = 0; i < xColliders.length; ++i) {
                    if (xColliders[i].right > rect.left && wallX > xColliders[i].left) {
                        wallX = xColliders[i].left;
                    }
                }
                if (movingObj.x > wallX - rectRightHalfWidth - TileMap.epsilon) {
                    movingObj.x = wallX - rectRightHalfWidth - TileMap.epsilon;
                }
            } else {
                wallX = this.nearestTileLeftFromRect(rect, isWallUp, Math.abs(delta)) + 1;
                for (var i = 0; i < xColliders.length; ++i) {
                    if (xColliders[i].left < rect.right && wallX < xColliders[i].right) {
                        wallX = xColliders[i].right;
                    }
                }
                if (movingObj.x < wallX + rectLeftHalfWidth + TileMap.epsilon) {
                    movingObj.x = wallX + rectLeftHalfWidth + TileMap.epsilon;
                }
            }
        }
    }
    if (dim == 'y') {
        var delta = movingObj.dy * deltaTime;
        var wallY = movingObj.y; // Position where the character will be stuck if it meets a wall.
        var rectBottomHalfHeight = rect.bottom - movingObj.y;
        var rectTopHalfHeight = movingObj.y - rect.top;
        if (Math.abs(delta) > 0) {
            movingObj.y += delta;
            var yColliders = [];
            if (colliders !== undefined) {
                for (var i = 0; i < colliders.length; ++i) {
                    if (colliders[i] === movingObj) {
                        continue;
                    }
                    var collider = colliders[i].getRect();
                    if (rect.left < collider.right && collider.left < rect.right) {
                        yColliders.push(collider);
                    }
                }
            }
            if (delta > 0) {
                wallY = this.nearestTileDownFromRect(rect, isWall, Math.abs(delta));
                if (wallY == -1) {
                    wallY = this.height;
                }
                for (var i = 0; i < yColliders.length; ++i) {
                    if (yColliders[i].bottom > rect.top && wallY > yColliders[i].top) {
                        wallY = yColliders[i].top;
                    }
                }
                if (movingObj.y > wallY - rectBottomHalfHeight - TileMap.epsilon) {
                    movingObj.y = wallY - rectBottomHalfHeight - TileMap.epsilon;
                    movingObj.touchGround();
                }
            } else {
                wallY = this.nearestTileUpFromRect(rect, isWallUp, Math.abs(delta)) + 1;
                for (var i = 0; i < yColliders.length; ++i) {
                    if (yColliders[i].top < rect.bottom && wallY < yColliders[i].bottom) {
                        wallY = yColliders[i].bottom;
                    }
                }
                if (movingObj.y < wallY + rectTopHalfHeight + TileMap.epsilon) {
                    movingObj.y = wallY + rectTopHalfHeight + TileMap.epsilon;
                    movingObj.touchCeiling();
                }
            }
        }
    }
};

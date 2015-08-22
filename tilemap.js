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
 */
TileMap.prototype.render = function(ctx, matchFunc) {
    for (var y = 0; y < this.height; ++y) {
        for (var x = 0; x < this.width; ++x) {
            var tile = this.tiles[y][x];
            if (matchFunc(tile)) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
};

TileMap.epsilon = 0.0001;

/**
 * @param {Vec2} tileMin
 * @param {Vec2} tileMax
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
 * @return {number} x X coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileLeftFromRect = function(rect, matchFunc) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var match = false;
    while (!match && tileMin.x >= 0) {
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
 * @return {number} x X coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileRightFromRect = function(rect, matchFunc) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var match = false;
    while (!match && tileMin.x < this.width) {
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
 * @return {number} y Y coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileUpFromRect = function(rect, matchFunc) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var match = false;
    while (!match && tileMin.y >= 0) {
        // Test one column of tiles
        match = this.tileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            --tileMin.y;
            --tileMax.y;
        }
    }
    return match ? tileMin.y : -1;
};

/**
 * @return {number} y Y coordinate of the matching tile, or -1 if no match found.
 */
TileMap.prototype.nearestTileDownFromRect = function(rect, matchFunc) {
    var epsilon = TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var match = false;
    while (!match && tileMin.y < this.height) {
        // Test one column of tiles
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

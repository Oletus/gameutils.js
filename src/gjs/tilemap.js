'use strict';

/**
 * Using GJS.TileMap requires the Vec2 and Rect classes and the CardinalDirection enum from util2d.
 */

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * A 2D grid made out of tiles. Tiles can be of any type, but they are strings by default.
 * @constructor
 */
GJS.TileMap = function(options)
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
 * @param {boolean?} flippedX Set to true to flip the data in the x direction.
 * @return {function} Function to pass as an init function to GJS.TileMap constructor.
 */
GJS.TileMap.initFromData = function(data, flippedX) {
    if (flippedX === undefined) {
        flippedX = false;
    }
    if (flippedX) {
        return function(x, y) {
            return data[y][data[y].length - x - 1];
        }
    } else {
        return function(x, y) {
            return data[y][x];
        }
    }
};

/**
 * Resizes the tilemap to a new width / height.
 * @param {number} width New width.
 * @param {number} height New height.
 * @param {function?} initTile Function that returns an initial tile. x and y parameters. If not set will use the initTile for the constructor.
 */
GJS.TileMap.prototype.resize = function(width, height, initTile) {
    if (initTile === undefined) {
        initTile = this.initTile;
    }
    if (height < this.height) {
        this.tiles.splice(height);
    }
    for (var y = 0; y < this.height; ++y) {
        while (width > this.tiles[y].length) {
            this.tiles[y].push(initTile(this.tiles[y].length, y));
        }
        if (width < this.width) {
            this.tiles[y].splice(width);
        }
    }
    for (var y = this.height; y < height; ++y) {
        var row = [];
        for (var x = 0; x < width; ++x) {
            var tile = initTile(x, y);
            row.push(tile);
        }
        this.tiles.push(row);
    }
    this.width = width;
    this.height = height;
};

/**
 * @param {number} x Horizontal float coordinate
 * @param {number} y Vertical float coordinate
 * @return {Vec2} Integer tile coordinates for the specified tile.
 */
GJS.TileMap.prototype.tileAt = function(x, y) {
    var tileX = Math.floor(x);
    var tileY = Math.floor(y);
    return new Vec2(tileX, tileY);
};

/**
 * A function for debug rendering of the tiles. Will fill rectangles at the coordinates of tiles that match.
 * @param {CanvasRenderingContext2D} ctx Context to use.
 * @param {function} matchFunc Gets passed a tile and returns true if the tile should be drawn.
 * @param {number?} extraYTop How much to extend the drawn tiles in the y direction. Defaults to 0.
 * @param {number?} extraYBottom How much to extend the drawn tiles in the y direction. Defaults to 0.
 * @param {number?} extraX How much to extend the drawn tiles in the x direction. Defaults to 0.
 */
GJS.TileMap.prototype.render = function(ctx, matchFunc, extraYTop, extraYBottom, extraX) {
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

GJS.TileMap.epsilon = 0.00001;

/**
 * @param {Vec2} tileMin Integer coordinates for top left corner of the area.
 * @param {Vec2} tileMax Integer coordinates for bottom right corner of the area.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {boolean} True if there are matching tiles within the area limited by tileMin and tileMax
 * Coordinates are inclusive.
 */
GJS.TileMap.prototype.isTileInArea = function(tileMin, tileMax, matchFunc) {
    for (var y = tileMin.y; y <= tileMax.y; ++y) {
        if (y < 0) {
            y = -1;
            continue;
        }
        if (y >= this.height) {
            continue;
        }
        for (var x = tileMin.x; x <= tileMax.x; ++x) {
            if (x < 0) {
                x = -1;
                continue;
            }
            if (x >= this.width) {
                break;
            }
            if (matchFunc(this.tiles[y][x])) {
                return true;
            }
        }
    }
    return false;
};

/**
 * @param {Vec2} tileMin Integer coordinates for top left corner of the area.
 * @param {Vec2} tileMax Integer coordinates for bottom right corner of the area.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {Array.<Vec2>} Coordinates of matching tiles within the area limited by tileMin and tileMax.
 * Coordinates are inclusive.
 */
GJS.TileMap.prototype.getTileCoordsInArea = function(tileMin, tileMax, matchFunc) {
    var tiles = [];
    for (var y = tileMin.y; y <= tileMax.y; ++y) {
        if (y < 0) {
            y = -1;
            continue;
        }
        if (y >= this.height) {
            continue;
        }
        for (var x = tileMin.x; x <= tileMax.x; ++x) {
            if (x < 0) {
                x = -1;
                continue;
            }
            if (x >= this.width) {
                break;
            }
            if (matchFunc(this.tiles[y][x])) {
                tiles.push(new Vec2(x, y));
            }
        }
    }
    return tiles;
};

/**
 * @param {Vec2} tileMin Integer coordinates for top left corner of the area.
 * @param {Vec2} tileMax Integer coordinates for bottom right corner of the area.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {Array.<Object>} Matching tiles within the area limited by tileMin and tileMax.
 * Coordinates are inclusive.
 */
GJS.TileMap.prototype.getTilesInArea = function(tileMin, tileMax, matchFunc) {
    var tileCoords = this.getTileCoordsInArea(tileMin, tileMax, matchFunc);
    var tiles = [];
    for (var i = 0; i < tileCoords.length; ++i) {
        tiles.push(this.tiles[tileCoords[i].y][tileCoords[i].x]);
    }
    return tiles;
};

/*
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {Array.<Vec2>} Coordinates of matching tiles within the tilemap.
 */
GJS.TileMap.prototype.getTileCoords = function(matchFunc) {
    return this.getTileCoordsInArea(new Vec2(0, 0), new Vec2(this.width, this.height), matchFunc);
};

/*
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {Array.<Object>} Matching tiles within the tilemap.
 */
GJS.TileMap.prototype.getTiles = function(matchFunc) {
    return this.getTilesInArea(new Vec2(0, 0), new Vec2(this.width, this.height), matchFunc);
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {number} x X coordinate of the matching tile, or -1 if no match found.
 */
GJS.TileMap.prototype.nearestTileLeftFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var match = false;
    var minX = Math.floor(rect.left - maxDistance);
    while (!match && tileMin.x >= 0 && tileMin.x >= minX) {
        // Test one column of tiles
        match = this.isTileInArea(tileMin, tileMax, matchFunc);
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
GJS.TileMap.prototype.nearestTileRightFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var match = false;
    var maxX = Math.floor(rect.right + maxDistance);
    while (!match && tileMin.x < this.width && tileMax.x <= maxX) {
        // Test one column of tiles
        match = this.isTileInArea(tileMin, tileMax, matchFunc);
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
GJS.TileMap.prototype.nearestTileUpFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var match = false;
    var minY = Math.floor(rect.top - maxDistance);
    while (!match && tileMin.y >= 0 && tileMin.y >= minY) {
        // Test one row of tiles
        match = this.isTileInArea(tileMin, tileMax, matchFunc);
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
GJS.TileMap.prototype.nearestTileDownFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var match = false;
    var maxY = Math.floor(rect.bottom + maxDistance);
    while (!match && tileMin.y < this.height && tileMax.y <= maxY) {
        // Test one row of tiles
        match = this.isTileInArea(tileMin, tileMax, matchFunc);
        if (!match) {
            ++tileMin.y;
            ++tileMax.y;
        }
    }
    return match ? tileMin.y : -1;
};


/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {Array.<Object>} Nearest matching tiles. May be empty if none are found.
 */
GJS.TileMap.prototype.getNearestTilesLeftFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var tiles = [];
    var minX = Math.floor(rect.left - maxDistance);
    while (tiles.length == 0 && tileMin.x >= 0 && tileMin.x >= minX) {
        // Test one column of tiles
        tiles = this.getTilesInArea(tileMin, tileMax, matchFunc);
        --tileMin.x;
        --tileMax.x;
    }
    return tiles;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {Array.<Object>} Nearest matching tiles. May be empty if none are found.
 */
GJS.TileMap.prototype.getNearestTilesRightFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var tiles = [];
    var maxX = Math.floor(rect.right + maxDistance);
    while (tiles.length == 0 && tileMin.x < this.width && tileMax.x <= maxX) {
        // Test one column of tiles
        tiles = this.getTilesInArea(tileMin, tileMax, matchFunc);
        ++tileMin.x;
        ++tileMax.x;
    }
    return tiles;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {Array.<Object>} Nearest matching tiles. May be empty if none are found.
 */
GJS.TileMap.prototype.getNearestTilesUpFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.top + epsilon);
    var tiles = [];
    var minY = Math.floor(rect.top - maxDistance);
    while (tiles.length == 0 && tileMin.y >= 0 && tileMin.y >= minY) {
        // Test one row of tiles
        tiles = this.getTilesInArea(tileMin, tileMax, matchFunc);
        --tileMin.y;
        --tileMax.y;
    }
    return tiles;
};

/**
 * @param {Rect} rect Rect to test.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @param {number} maxDistance How far from the rect to extend the search.
 * @return {Array.<Object>} Nearest matching tiles. May be empty if none are found.
 */
GJS.TileMap.prototype.getNearestTilesDownFromRect = function(rect, matchFunc, maxDistance) {
    var epsilon = GJS.TileMap.epsilon;
    var tileMin = this.tileAt(rect.left + epsilon, rect.bottom - epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    var tiles = [];
    var maxY = Math.floor(rect.bottom + maxDistance);
    while (tiles.length == 0 && tileMin.y < this.height && tileMax.y <= maxY) {
        // Test one row of tiles
        tiles = this.getTilesInArea(tileMin, tileMax, matchFunc);
        ++tileMin.y;
        ++tileMax.y;
    }
    return tiles;
};

/**
 * @param {Vec2} originTile Integer coordinates of the tile to start the search from.
 * @return {Array} Map from GJS.CardinalDirection to how many tiles there are in between the originTile and the
 * first matching tile found in that direction.
 */
GJS.TileMap.prototype.getDistancesByCardinalDirection = function(originTile, matchFunc) {
    var distances = [-1, -1, -1, -1];
    var distance = 1;
    while (originTile.x + distance < this.width && distances[GJS.CardinalDirection.RIGHT] < 0) {
        if (matchFunc(this.tiles[originTile.y][originTile.x + distance])) {
            distances[GJS.CardinalDirection.RIGHT] = distance;
        }
        ++distance;
    }
    distance = 1;
    while (originTile.x - distance >= 0 && distances[GJS.CardinalDirection.LEFT] < 0) {
        if (matchFunc(this.tiles[originTile.y][originTile.x - distance])) {
            distances[GJS.CardinalDirection.LEFT] = distance;
        }
        ++distance;
    }
    distance = 1;
    while (originTile.y + distance < this.height && distances[GJS.CardinalDirection.DOWN] < 0) {
        if (matchFunc(this.tiles[originTile.y + distance][originTile.x])) {
            distances[GJS.CardinalDirection.DOWN] = distance;
        }
        ++distance;
    }
    distance = 0;
    while (originTile.y - distance >= 0 && distances[GJS.CardinalDirection.UP] < 0) {
        if (matchFunc(this.tiles[originTile.y - distance][originTile.x])) {
            distances[GJS.CardinalDirection.UP] = distance;
        }
        ++distance;
    }
    return distances;
};

/**
 * @param {Vec2} originTile Integer coordinates for the tile to start searching from.
 * @param {function} matchFunc Gets passed a tile and returns true if it matches.
 * @return {GJS.CardinalDirection} The cardinal direction of the nearest matching tile, or undefined if no matching
 * tiles found.
 */
GJS.TileMap.prototype.getNearestTileDirection = function(originTile, matchFunc) {
    var distances = this.getDistancesByCardinalDirection(originTile, matchFunc);
    var nearest = -1;
    var nearestDirection = undefined;
    for (var i = 0; i < 4; ++i) {
        if (distances[i] >= 0 && (nearest < 0 || distances[i] < nearest)) {
            nearest = distances[i];
            nearestDirection = i;
        }
    }
    return nearestDirection;
};

/**
 * @return {boolean} True if any matching tiles overlap the given rectangle.
 */
GJS.TileMap.prototype.overlapsTiles = function(rect, matchFunc) {
    var epsilon = GJS.TileMap.epsilon;
    var tile = this.tileAt(rect.left + epsilon, rect.top + epsilon);
    var tileMax = this.tileAt(rect.right - epsilon, rect.bottom - epsilon);
    return this.isTileInArea(tile, tileMax, matchFunc);
};

/**
 * @return {Rect} tileMap rect representing the size of the tilemap.
 */
GJS.TileMap.prototype.getRect = function() {
    return new Rect(0.0, this.width, 0.0, this.height);
};

/**
 * Return a list of Rect objects into which matching tiles have been grouped.
 *
 * The algorithm first searches horizontally and when the line of consecutive
 * matching tiles ends it searches vertically to extend it.
 *
 * @param {function} matchFunc Gets passed a tile and returns true if it should be grouped.
 * @return {Array.<Rect>} Rectangles into which all tiles are grouped.
 */
GJS.TileMap.prototype.groupTilesToRectangles = function(matchFunc) {
    var row, tile;
    var groups = [];
    var currentMatch = undefined;
    
    var inGroups = function(x, y) {
        var searchVec2 = new Vec2(x + 0.5, y + 0.5);
        for (var i = 0; i < groups.length; ++i) {
            if (groups[i].containsVec2(searchVec2)) {
                return true;
            }
        }
        return false;
    }
    
    var that = this;
    
    var expandDown = function(rect) {
        var allmatch = true;
        while (allmatch && rect.bottom < that.height) {
            for (var x = rect.left; x < rect.right; ++x) {
                if (!matchFunc(that.tiles[rect.bottom][x])) {
                    allmatch = false;
                    break;
                }
            }
            if (allmatch) {
                rect.bottom += 1;
            }
        }
    };

    for (var y = 0; y < this.tiles.length; ++y) {
        row = this.tiles[y];
        for (var x = 0; x < row.length; ++x) {
            tile = row[x];
            if (matchFunc(tile) && !inGroups(x, y)) {
                if (currentMatch === undefined) {
                    currentMatch = new Rect(x, x + 1, y, y + 1);
                    groups.push(currentMatch);
                } else {
                    currentMatch.right += 1;
                }
            } else if (currentMatch !== undefined) {
                expandDown(currentMatch);
                currentMatch = undefined;
            }
        }

        if (currentMatch !== undefined) {
            expandDown(currentMatch);
            currentMatch = undefined;
        }
    }
    return groups;
};

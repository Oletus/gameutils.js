/*
 * Copyright Olli Etuaho 2012-2014.
 */

// This file contains following utilities:
// TODO: Split into multiple files.
// CardinalDirection: An enum for storing and operating on a cardinal direction: up, down, left, right.
// Polygon: A class for storing a two-dimensional polygon.
// canvasUtil: Utilities for drawing to a 2D canvas.

import { Vec2 } from "./math/vec2.js";

const CardinalDirection = {
    RIGHT: 0,
    DOWN: 1,
    LEFT: 2,
    UP: 3
};

/**
 * @param {CardinalDirection} direction
 * @return {CardinalDirection} next adjacent direction
 */
CardinalDirection.next = function(direction) {
    return (direction + 1) % 4;
};

/**
 * @param {CardinalDirection} direction
 * @return {CardinalDirection} previous adjacent direction
 */
CardinalDirection.previous = function(direction) {
    if (direction === 0) {
        return 3;
    } else {
        return direction - 1;
    }
};

/**
 * @param {CardinalDirection} direction
 * @return {Vec2} Vector where up corresponds to negative y direction.
 */
CardinalDirection.toVec2 = function(direction) {
    if (direction === CardinalDirection.RIGHT) {
        return new Vec2(1, 0);
    }
    if (direction === CardinalDirection.LEFT) {
        return new Vec2(-1, 0);
    }
    if (direction === CardinalDirection.UP) {
        return new Vec2(0, -1);
    }
    if (direction === CardinalDirection.DOWN) {
        return new Vec2(0, 1);
    }
};

/**
 * @param {Vec2} vec
 * @return {CardinalDirection} The cardinal direction that is closest to the direction of vec.
 */
CardinalDirection.fromVec2 = function(vec) {
    if (Math.abs(vec.x) >= Math.abs(vec.y)) {
        if (vec.x >= 0) {
            return CardinalDirection.RIGHT;
        } else {
            return CardinalDirection.LEFT;
        }
    } else {
        if (vec.y >= 0) {
            return CardinalDirection.DOWN;
        } else {
            return CardinalDirection.UP;
        }
    }
};


/**
 * An arbitrary 2D polygon.
 * @param {Array.<Vec2>} vertices Vertices that make up this polygon, in order.
 * @constructor
 */
var Polygon = function(vertices) {
    this._vertices = vertices;
};

/**
 * @param {Vec2} vec Vector to test.
 * @return {boolean} True if the vector is inside the polygon.
 */
Polygon.prototype.containsVec2 = function(vec) {
    var intersections = 0;
    for (var i = 0; i < this._vertices.length; ++i) {
        var vert1 = this._vertices[i];
        var vert2 = this._vertices[(i + 1) % this._vertices.length];
        // Solve vec + Vec2(t, 0) == vert1 + (vert2 - vert1) * u
        // cy = v1y + (v2y - v1y) * u
        // u = (cy - v1y) / (v2y - v1y)
        // cx + t = v1x + (v2x - v1x) * u
        // t = v1x + (v2x - v1x) * u - cx
        if (vert2.y - vert1.y != 0) {
            var u = (vec.y - vert1.y) / (vert2.y - vert1.y);
            var t = vert1.x + (vert2.x - vert1.x) * u - vec.x;
            if (t > 0) {
                if (vert2.y > vert1.y) {
                    if (u > 0 && u <= 1) {
                        ++intersections;
                    }
                } else {
                    if (u >= 0 && u < 1) {
                        ++intersections;
                    }
                }
            }
        }
    }
    return ((intersections & 1) === 1);
};

/**
 * @param {Vec2} center Center of the circle to test.
 * @param {number} radius Radius of the circle to test.
 * @return {boolean} True if the polygon and circle intersect. If the circle only touches the polygon edge, returns
                     false.
 */
Polygon.prototype.intersectsCircle = function(center, radius) {
    var projected = new Vec2(0, 0);
    // Phase 1: To determine if circle intersects an edge, check closest point on each segment against circle radius.
    for (var i = 0; i < this._vertices.length; ++i) {
        var vert1 = this._vertices[i];
        var vert2 = this._vertices[(i + 1) % this._vertices.length];
        projected.copy(center);
        projected.projectToLineSegment(vert1, vert2);
        if (projected.distanceTo(center) < radius) {
            return true;
        }
    }
    // Phase 2: Check how many segments ray casted towards right from circle center touches.
    return this.containsVec2(center);
};

/**
 * @param {Vec2} aPoint0 First end point of line segment A.
 * @param {Vec2} aPoint1 Second end point of line segment A.
 * @param {Vec2} bPoint0 First end point of line segment B.
 * @param {Vec2} bPoint1 Second end point of line segment B.
 * @return {boolean} True if the line segments intersect at any point.
 */
Polygon.lineSegmentsIntersect = function(aPoint0, aPoint1, bPoint0, bPoint1) {
    // http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
    var rx = aPoint1.x - aPoint0.x;
    var ry = aPoint1.y - aPoint0.y;
    var sx = bPoint1.x - bPoint0.x;
    var sy = bPoint1.y - bPoint0.y;

    var rxs = rx * sy - ry * sx;
    var prod0 = ((bPoint0.x - aPoint0.x) * sy - (bPoint0.y - aPoint0.y) * sx);
    var prod1 = ((aPoint0.x - bPoint0.x) * ry - (aPoint0.y - bPoint0.y) * rx);
    var t = prod0 / rxs;
    var u = prod1 / -rxs;
    if (rxs === 0) {
        if (prod0 === 0) {
            // Colinear
            return true;
        }
        // Parallel
        return false;
    }
    // Return true if the intersection of the lines is within the line segments.
    return (t >= 0.0 && u >= 0.0 && t <= 1.0 && u <= 1.0);
};

/**
 * @param {Polygon} other Polygon to test.
 * @return {boolean} True if this polygon intersects the other polygon. Can return true for polygons with zero area.
 */
Polygon.prototype.intersectsPolygon = function(other) {
    for (var i = 0; i < this._vertices.length; ++i) {
        if (other.containsVec2(this._vertices[i])) {
            // If the other polygon contains any of this polygon's vertices, the two must intersect.
            return true;
        }
        for (var j = 0; j < other._vertices.length; ++j) {
            if (Polygon.lineSegmentsIntersect(this._vertices[i], this._vertices[(i + 1) % this._vertices.length],
                                              other._vertices[j], other._vertices[(j + 1) % other._vertices.length]))
            {
                // If the other polygon's edges intersect this polygon's edges, the two must intersect.
                return true;
            }
        }
    }
    for (var i = 0; i < other._vertices.length; ++i) {
        if (this.containsVec2(other._vertices[i])) {
            // If this contains any of the other polygon's vertices, the two must intersect.
            // It's possible that all of the other polygon's vertices are contained.
            return true;
        }
    }
    return false;
};

/**
 * @param {Rect} rect Rect to test.
 * @return {boolean} True if this polygon intersects the rect.
 */
Polygon.prototype.intersectsRect = function(rect) {
    if (rect.isEmpty()) {
        return false;
    }
    // TODO: quick AABB test.
    var rectPolygon = new Polygon([new Vec2(rect.left, rect.top), new Vec2(rect.right, rect.top),
                                   new Vec2(rect.right, rect.bottom), new Vec2(rect.left, rect.bottom)]);
    return this.intersectsPolygon(rectPolygon);
};

/**
 * Stroke the polygon to the given context.
 * @param {CanvasRenderingContext2D} ctx Context to draw this polygon to.
 */
Polygon.prototype.renderStroke = function(ctx) {
    ctx.beginPath();
    var last = this._vertices[this._vertices.length - 1];
    ctx.moveTo(last.x, last.y);
    for (var i = 0; i < this._vertices.length; ++i) {
        var vert = this._vertices[i];
        ctx.lineTo(vert.x, vert.y);
    }
    ctx.stroke();
};


var canvasUtil = {
    dummySvg: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
};

/**
 * Draw an outlined stroke using the current path.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
 * @param {number} alpha Alpha multiplier for the drawing.
 */
canvasUtil.dualStroke = function(ctx, alpha) {
    if (alpha === undefined) {
        alpha = 1.0;
    }
    ctx.globalAlpha = 0.5 * alpha;
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.globalAlpha = 1.0 * alpha;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#000';
    ctx.stroke();
};

/**
 * Draw a light stroke using the current path.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
 */
canvasUtil.lightStroke = function(ctx) {
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    ctx.globalAlpha = 1.0;
};

/**
 * Set the canvas clip rectangle.
 * @param {CanvasRenderingContext2D} ctx Context to set the rectangle to.
 * @param {Rect} rect Rectangle to set as canvas clip rectangle.
 */
canvasUtil.clipRect = function(ctx, rect) {
    var xywh = rect.getXYWHRoundedOut();
    ctx.beginPath();
    ctx.rect(xywh.x, xywh.y, xywh.w, xywh.h);
    ctx.clip();
};

canvasUtil.flipY = function(ctx) {
    ctx.scale(1, -1);
    ctx.translate(0, -ctx.canvas.height);
};

/**
 * Draw coordinate system axis reference to canvas.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 */
canvasUtil.drawCoordinateSystemRef = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 10);
    ctx.stroke();
};

export { CardinalDirection, Polygon, canvasUtil }

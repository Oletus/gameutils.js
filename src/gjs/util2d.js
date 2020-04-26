/*
 * Copyright Olli Etuaho 2012-2014.
 */

// This file contains following utilities:
// TODO: Split into multiple files.
// mathUtil: Simple math functions.
// CardinalDirection: An enum for storing and operating on a cardinal direction: up, down, left, right.
// Polygon: A class for storing a two-dimensional polygon.
// canvasUtil: Utilities for drawing to a 2D canvas.

import { Vec2 } from "./math/vec2.js";

var mathUtil = {
    mix: null,
    mixSmooth: null,
    fmod: null,
    mixAngles: null,
    angleDifference: null,
    angleGreater: null,
    ease: null,
    clamp: null,
    bezierLength: null,
    randomInt: null,
    factorial: null
};

/**
 * Linear interpolation of a and b by weight f
 * @param {number} a Value a, if f == 0.0, a is returned
 * @param {number} b Value b, if f == 1.0, b is returned
 * @param {number} f Interpolation weight
 * @return {number} Interpolated value between a and b
 */
mathUtil.mix = function(a, b, f) {
    return a + f * (b - a);
};

/**
 * Smooth interpolation of a and b by weight f
 * @param {number} a Value a, if f == 0.0, a is returned
 * @param {number} b Value b, if f == 1.0, b is returned
 * @param {number} f Interpolation weight
 * @return {number} Interpolated value between a and b
 */
mathUtil.mixSmooth = function(a, b, f) {
   var f2 = (1 - Math.cos(f * Math.PI)) / 2;
   return mathUtil.mix(a, b, f2);
};

/**
 * Modulus for floating point numbers.
 * @param {number} a Dividend
 * @param {number} b Divisor
 * @return {number} Float remainder of a / b
 */
mathUtil.fmod = function(a, b) {
    return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
};

/**
 * Mix numbers by weight a and b, wrapping back to 0 at w.
 * @param {number} a Number a, if f == 0.0, a + n * w is returned.
 * @param {number} b Number b, if f == 1.0, b + n * w is returned.
 * @param {number} f Interpolation weight.
 * @param {number} w Number to wrap around at.
 * @return {number} Interpolated value between a and b.
 */
mathUtil.mixWithWrap = function(a, b, f, w) {
    a = mathUtil.fmod(a, w);
    b = mathUtil.fmod(b, w);
    if (Math.abs(a - b) > w * 0.5) {
        if (a > b) {
            b += w;
        } else {
            a += w;
        }
    }
    return mathUtil.fmod(mathUtil.mix(a, b, f), w);
};

/**
 * Linear interpolation of angles a and b in radians by weight f
 * @param {number} a Angle a, if f == 0.0, a + n * PI * 2 is returned.
 * @param {number} b Angle b, if f == 1.0, b + n * PI * 2 is returned.
 * @param {number} f Interpolation weight.
 * @return {number} Interpolated value between a and b.
 */
mathUtil.mixAngles = function(a, b, f) {
    return mathUtil.mixWithWrap(a, b, f, 2 * Math.PI);
};

/**
 * @param {number} a Angle a.
 * @param {number} b Angle b.
 * @return {number} Smallest difference of the angles a + n * PI * 2 and b in radians.
 */
mathUtil.angleDifference = function(a, b) {
    a = mathUtil.fmod(a, Math.PI * 2);
    b = mathUtil.fmod(b, Math.PI * 2);
    if (Math.abs(a - b) > Math.PI) {
        if (a > b) {
            b += Math.PI * 2;
        } else {
            a += Math.PI * 2;
        }
    }
    return Math.abs(a - b);
};

/**
 * @param {number} a Angle a.
 * @param {number} b Angle b.
 * @return {boolean} True if the angle a + n * PI * 2 that is closest to b is greater than b.
 */
mathUtil.angleGreater = function(a, b) {
    a = mathUtil.fmod(a, Math.PI * 2);
    b = mathUtil.fmod(b, Math.PI * 2);
    if (Math.abs(a - b) > Math.PI) {
        if (a > b) {
            return false;
        } else {
            return true;
        }
    }
    return (a > b);
};

/**
 * Smooth interpolation of a and b by transition value f. Starts off quickly but eases towards the end.
 * @param {number} a Value a, if f == 0.0, a is returned
 * @param {number} b Value b, if f == 1.0, b is returned
 * @param {number} f Interpolation transition value
 * @return {number} Interpolated value between a and b
 */
mathUtil.ease = function(a, b, f) {
    return a + Math.sin(f * Math.PI * 0.5) * (b - a);
};

/**
 * Clamps value to range.
 * @param {number} min Minimum bound
 * @param {number} max Maximum bound
 * @param {number} value Value to be clamped
 * @return {number} Clamped value
 */
mathUtil.clamp = function(min, max, value) {
    return value < min ? min : (value > max ? max : value);
};

/**
 * @param {number} x0 Start point x.
 * @param {number} y0 Start point y.
 * @param {number} x1 Control point x.
 * @param {number} y1 Control point y.
 * @param {number} x2 End point x.
 * @param {number} y2 End point y.
 * @param {number} steps How many segments to split the bezier curve to.
 * @return {number} Approximate length of the quadratic bezier curve.
 */
mathUtil.bezierLength = function(x0, y0, x1, y1, x2, y2, steps) {
    var len = 0;
    var prevX = x0;
    var prevY = y0;
    var t = 0;
    var xd, yd;
    for (var i = 0; i < steps; ++i) {
        t += 1.0 / steps;
        xd = x0 * Math.pow(1.0 - t, 2) + x1 * t * (1.0 - t) * 2 + x2 * Math.pow(t, 2);
        yd = y0 * Math.pow(1.0 - t, 2) + y1 * t * (1.0 - t) * 2 + y2 * Math.pow(t, 2);
        len += Math.sqrt(Math.pow(xd - prevX, 2) + Math.pow(yd - prevY, 2));
        prevX = xd;
        prevY = yd;
    }
    return len;
};

/**
 * @return {number} Random integer between 0 and max, inclusive.
 */
mathUtil.randomInt = function(max) {
    if (mathUtil.random) {
        return Math.floor(mathUtil.random() * (max + 1));
    } else {
        return Math.floor(Math.random() * (max + 1));
    }
};

/**
 * @return {number} Binomial coefficient n over k (can be interpreted as number of unique combinations of k elements
 * taken from a set of n elements)
 */
mathUtil.binomialCoefficient = function(n, k) {
    // Use recursive method - don't need to worry about overflow.
    if (k === 0) {
        return 1;
    }
    if (n === k) {
        return 1;
    }
    return mathUtil.binomialCoefficient(n - 1, k - 1) + mathUtil.binomialCoefficient(n - 1, k);
};

/**
 * @param {number} n Positive integer.
 * @return {number} Factorial of n.
 */
mathUtil.factorial = function(n) {
    if (n <= 1) {
        return 1;
    }
    return n * mathUtil.factorial(n - 1);
};


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

export { mathUtil, CardinalDirection, Polygon, canvasUtil }

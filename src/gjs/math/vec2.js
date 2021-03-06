/*
 * Copyright Olli Etuaho 2019.
 */

import { Vector2 } from '../../lib/Vector2.js';

var Vec2 = Vector2;

/**
 * Calculate the angle difference between two vectors, with both vectors'
 * angles calculated from the positive x axis.
 * @param {Vec2} vec The other vector.
 * @return {number} The difference in angles.
 */
Vec2.prototype.angleFrom = function(vec) {
    return this.angle() - vec.angle();
};

/**
 * Calculate slope from this vector to another vector i.e. delta Y / delta X.
 * Does not check for division by zero.
 * @param {Vec2} vec The other vector.
 * @return {number} The slope.
 */
Vec2.prototype.slope = function(vec) {
    return (vec.y - this.y) / (vec.x - this.x);
};

/**
 * Projects this vector to the nearest point on the line defined by two points.
 * @param {Vec2} lineA One point on the line to project to.
 * @param {Vec2} lineB Another point on the line to project to.
 */
Vec2.prototype.projectToLine = function(lineA, lineB) {
    if (lineA.x === lineB.x) {
        this.x = lineA.x;
        return;
    } else if (lineA.y === lineB.y) {
        this.y = lineA.y;
        return;
    }

    // The line's equation: y = lineSlope * x + lineYAtZero
    var lineSlope = lineA.slope(lineB);
    var lineYAtZero = lineA.y - lineSlope * lineA.x;

    var perpVector = new Vec2(1.0, -1.0 / lineSlope);
    perpVector.normalize();
    // perpVector's dot product with a vector that goes from line to this Vec2
    var perpProjLength = perpVector.y *
                         (this.y - (lineSlope * this.x + lineYAtZero));
    this.x -= perpVector.x * perpProjLength;
    this.y -= perpVector.y * perpProjLength;
};

/**
 * Projects this vector to the nearest point on the line segment defined by two points.
 * @param {Vec2} lineA One end point of the line segment to project to.
 * @param {Vec2} lineB Another end point of the line segment to project to.
 */
Vec2.prototype.projectToLineSegment = function(lineA, lineB) {
    var ax = this.x - lineA.x;
    var ay = this.y - lineA.y;
    var projectionTarget = new Vec2(lineB.x - lineA.x, lineB.y - lineA.y);
    projectionTarget.normalize();
    var projectionLength = ax * projectionTarget.x + ay * projectionTarget.y;
    if (projectionLength < 0) {
        this.copy(lineA);
    } else {
        var maxLength = lineB.distanceTo(lineA);
        if (projectionLength > maxLength) {
            this.copy(lineB);
        } else {
            this.x = lineA.x + projectionTarget.x * projectionLength;
            this.y = lineA.y + projectionTarget.y * projectionLength;
        }
    }
};

/**
 * Projects this vector to the nearest point on the given circle.
 * @param {number} x The x coordinate of the center of the circle.
 * @param {number} y The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 */
Vec2.prototype.projectToCircle = function(x, y, radius) {
    var angle = Math.atan2(this.y - y, this.x - x);
    this.x = x + Math.cos(angle) * radius;
    this.y = y + Math.sin(angle) * radius;
};

/**
 * Calculate this vector's distance to the line defined by two points.
 * @param {Vec2} lineA One point on the line.
 * @param {Vec2} lineB Another point on the line.
 * @return {number} This vector's distance to the nearest point on the line.
 */
Vec2.prototype.distanceToLine = function(lineA, lineB) {
    var projection = new Vec2(this.x, this.y);
    projection.projectToLine(lineA, lineB);
    return this.distanceTo(projection);
};

var zeroVec = new Vec2(0, 0);

/**
 * Rotate this vector with a given angle.
 * @param {number} angle Angle to rotate with.
 */
Vec2.prototype.rotate = function(angle) {
    this.rotateAround(zeroVec, angle);
};

export { Vec2 };

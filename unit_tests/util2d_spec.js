/*
 * Copyright Olli Etuaho 2013.
 */

import { mathUtil, Vec2, Rect, Polygon, AffineTransform } from "../src/gjs/util2d.js";
import { cssUtil, colorUtil } from "../src/gjs/utilcolor.js";

beforeEach(function() {
  jasmine.addMatchers({
    toBeNear: function(util, customEqualityTesters) {
      return {
          compare: function(actual, expected, tolerance) {
            let passed = Math.abs(actual - expected) <= tolerance;
            return {
                pass: passed,
                message: 'Expected ' + actual + ' to be near ' + expected + ' within tolerance of ' + tolerance
            };
          }
      }
    }
  });
});

describe('util2d', function() {
    describe('mathUtil', function() {
        it('interpolates linearly', function() {
            expect(mathUtil.mix(1, 4, 0.0)).toBeNear(1, 0.0001);
            expect(mathUtil.mix(1, 4, 0.5)).toBeNear(2.5, 0.0001);
            expect(mathUtil.mix(1, 4, 1.0)).toBeNear(4, 0.0001);
        });

        it('calculates fmod', function() {
            expect(mathUtil.fmod(4.2, 1.3)).toBeNear(0.3, 0.0001);
        });

        it('interpolates with wrap', function() {
            expect(mathUtil.mixWithWrap(1, 4, 0.0, 7.0)).toBeNear(1, 0.0001);
            expect(mathUtil.mixWithWrap(1, 4, 0.5, 7.0)).toBeNear(2.5, 0.0001);
            expect(mathUtil.mixWithWrap(1, 4, 1.0, 7.0)).toBeNear(4, 0.0001);
            expect(mathUtil.mixWithWrap(2.0, 0.5, 0.5, 2.0)).toBeNear(0.25, 0.0001);
            expect(mathUtil.mixWithWrap(1.5, 0, 0.5, 2.0)).toBeNear(1.75, 0.0001);
        });

        it('interpolates angles in radians', function() {
            expect(mathUtil.mixAngles(0, Math.PI * 0.5, 0.0)).toBeNear(0, 0.0001);
            expect(mathUtil.mixAngles(0, Math.PI * 0.5, 0.5)).toBeNear(Math.PI * 0.25, 0.0001);
            expect(mathUtil.mixAngles(0, Math.PI * 0.5, 1.0)).toBeNear(Math.PI * 0.5, 0.0001);
            expect(mathUtil.mixAngles(Math.PI * 2, 0.5, 0.5)).toBeNear(0.25, 0.0001);
            expect(mathUtil.mixAngles(Math.PI * 2 - 0.5, 0, 0.5)).toBeNear(Math.PI * 2 - 0.25, 0.0001);
        });

        it('measures the difference between two angles', function() {
            expect(mathUtil.angleDifference(0, Math.PI)).toBeNear(Math.PI, 0.0001);
            expect(mathUtil.angleDifference(0.25, Math.PI * 2 - 0.25)).toBeNear(0.5, 0.0001);
            expect(mathUtil.angleDifference(1.25 * Math.PI, 0.5 * Math.PI)).toBeNear(0.75 * Math.PI, 0.0001);
            expect(mathUtil.angleDifference(0, 2 * Math.PI)).toBeNear(0, 0.0001);
            expect(mathUtil.angleDifference(0, 4 * Math.PI)).toBeNear(0, 0.0001);
            expect(mathUtil.angleDifference(-3 * Math.PI, 3 * Math.PI)).toBeNear(0, 0.0001);
        });

        it('determines which angle is greater', function() {
            expect(mathUtil.angleGreater(1, 0)).toBe(true);
            expect(mathUtil.angleGreater(0, Math.PI * 0.99)).toBe(false);
            expect(mathUtil.angleGreater(0, Math.PI * 1.01)).toBe(true);
            expect(mathUtil.angleGreater(0.5, 2 * Math.PI)).toBe(true);
            expect(mathUtil.angleGreater(0.5, 4 * Math.PI)).toBe(true);
            expect(mathUtil.angleGreater(-2.5 * Math.PI, 3 * Math.PI)).toBe(true);
        });

        it('interpolates smoothly', function() {
            expect(mathUtil.ease(1, 4, 0.0)).toBeNear(1, 0.0001);
            expect(mathUtil.ease(1, 4, 0.25)).toBeGreaterThan(2);
            expect(mathUtil.ease(1, 4, 0.25)).toBeLessThan(3);
            expect(mathUtil.ease(1, 4, 0.5)).toBeGreaterThan(3);
            expect(mathUtil.ease(1, 4, 0.5)).toBeLessThan(3.5);
            expect(mathUtil.ease(1, 4, 0.75)).toBeGreaterThan(3.5);
            expect(mathUtil.ease(1, 4, 1.0)).toBeNear(4, 0.0001);
        });

        it('approximates the length of a bezier curve', function() {
            expect(mathUtil.bezierLength(0, 0, 0.5, 0.5, 1, 1, 16)).toBeNear(Math.sqrt(2), 0.001);
            expect(mathUtil.bezierLength(0, 0, 0.1, 0.1, 1, 1, 16)).toBeNear(Math.sqrt(2), 0.001);
            expect(mathUtil.bezierLength(0, 0, 0.9, 0.9, 1, 1, 16)).toBeNear(Math.sqrt(2), 0.001);
            expect(mathUtil.bezierLength(0, 0, 0, 3, 0, 0, 16)).toBeNear(2 * 2 * 3 * Math.pow(0.5, 2), 0.001);
            expect(mathUtil.bezierLength(0, 0, 0, 1, 1, 1, 16)).toBeNear(1.62, 0.01);
            expect(mathUtil.bezierLength(0, 0, 1, 0, 1, 1, 16)).toBeNear(1.62, 0.01);
        });

        it('calculates factorial', function() {
            expect(mathUtil.factorial(1)).toBe(1);
            expect(mathUtil.factorial(2)).toBe(2);
            expect(mathUtil.factorial(3)).toBe(6);
            expect(mathUtil.factorial(4)).toBe(24);
            expect(mathUtil.factorial(5)).toBe(120);
            expect(mathUtil.factorial(6)).toBe(720);
        });

        it('calculates binomial coefficient', function() {
            expect(mathUtil.binomialCoefficient(1, 1)).toBe(1);
            expect(mathUtil.binomialCoefficient(10, 1)).toBe(10);
            expect(mathUtil.binomialCoefficient(6, 4)).toBe(15);
            expect(mathUtil.binomialCoefficient(20, 5)).toBe(15504);
            expect(mathUtil.binomialCoefficient(40, 8)).toBe(76904685);
        });
    });

    describe('cssUtil', function() {
        it('converts arrays of values to CSS RGB colors', function() {
            expect(cssUtil.rgbString([12, 34, 56])).toBe('rgb(12,34,56)');
        });

        it('converts arrays of values to CSS RGBA colors', function() {
            var rgbaString = cssUtil.rgbaString([12, 34, 56, 127.5]);
            expect(rgbaString).toBe('rgba(12,34,56,0.5)');
        });

        it('rounds float values down', function() {
            expect(cssUtil.rgbString([12.3, 45.6, 78.9])).toBe('rgb(12,45,78)');
            var rgbaString = cssUtil.rgbaString([12.3, 45.6, 78.9, 127.5]);
            expect(rgbaString).toBe('rgba(12,45,78,0.5)');
        });
    });

    describe('color', function() {

        function toUint8Array(arr) {
            var buffer = new ArrayBuffer(arr.length);
            var uints = new Uint8Array(buffer);
            for (var i = 0; i < arr.length; ++i) {
                uints[i] = arr[i];
            }
            return uints;
        }

        it('unpremultiplies if alpha is 255', function() {
            var testColor = toUint8Array([128, 128, 128, 255]);
            expect(colorUtil.unpremultiply(testColor)).toEqual(testColor);
        });
        it('unpremultiplies if alpha is less than 255', function() {
            var testColor = toUint8Array([128, 128, 128, 128]);
            var resultColor = toUint8Array([255, 255, 255, 128]);
            expect(colorUtil.unpremultiply(testColor)).toEqual(resultColor);
        });
        it('premultiplies if alpha is 255', function() {
            var testColor = toUint8Array([128, 128, 128, 255]);
            expect(colorUtil.premultiply(testColor)).toEqual(testColor);
        });
        it('premultiplies if alpha is less than 255', function() {
            var testColor = toUint8Array([128, 128, 128, 128]);
            var resultColor = toUint8Array([64, 64, 64, 128]);
            expect(colorUtil.premultiply(testColor)).toEqual(resultColor);
        });
        it('blends two color values with dstAlpha being 255', function() {
            var dstRGBA = toUint8Array([12, 34, 56, 255]);
            var srcRGBA = toUint8Array([87, 65, 43, 21]);
            var resultColor = toUint8Array([18, 37, 55, 255]);
            var blended = colorUtil.blend(dstRGBA, srcRGBA);
            expect(blended).toEqual(resultColor);
        });
        it('blends two color values with dstAlpha less than 255', function() {
            var dstRGBA = toUint8Array([12, 34, 56, 78]);
            var srcRGBA = toUint8Array([87, 65, 43, 21]);
            var resultColor = toUint8Array([29, 41, 53, 93]);
            var blended = colorUtil.blend(dstRGBA, srcRGBA);
            expect(blended).toEqual(resultColor);
        });
        it('blends with associativity', function() {
            var RGBAA = toUint8Array([123, 234, 134, 245]);
            var RGBAB = toUint8Array([12, 34, 56, 78]);
            var RGBAC = toUint8Array([87, 65, 43, 21]);
            var blendedBC = colorUtil.blend(RGBAB, RGBAC);
            var resultA = colorUtil.blend(RGBAA, blendedBC);
            var blendedAB = colorUtil.blend(RGBAA, RGBAB);
            var resultB = colorUtil.blend(blendedAB, RGBAC);
            for (var i = 0; i < 4; ++i) {
                expect(resultA[i]).toBeNear(resultB[i], 5);
            }
        });
        it('generates a visually distinct color for a given color', function() {
            var RGB = [255, 127, 255];
            var differentRGB = colorUtil.differentColor(RGB);
            expect(differentRGB[0]).toBeNear(0, 5);
            expect(differentRGB[2]).toBeNear(0, 5);
            RGB = [127, 127, 127];
            differentRGB = colorUtil.differentColor(RGB);
            expect(differentRGB[0]).toBeNear(230, 25);
            expect(differentRGB[1]).toBeNear(230, 25);
            expect(differentRGB[2]).toBeNear(230, 25);
        });
    });

    describe('Vec2', function() {
        it('initializes', function() {
            var vec = new Vec2(1, 2);
            expect(vec.x).toBe(1);
            expect(vec.y).toBe(2);
        });

        it('can be set from another Vec2', function() {
            var vecA = new Vec2(1, 2);
            var vecB = new Vec2(3, 4);
            vecA.setVec2(vecB);
            expect(vecA.x).toBe(3);
            expect(vecA.y).toBe(4);
        });

        it('calculates its length', function() {
            var vec = new Vec2(3, 4);
            expect(vec.length()).toBeNear(5, 0.001);
        });

        it('calculates distance with another Vec2', function() {
            var vecA = new Vec2(3, 4);
            var vecB = new Vec2(7, 7);
            expect(vecA.distance(vecB)).toBeNear(5, 0.001);
        });

        it('can be normalized', function() {
            var vec = new Vec2(3, 4);
            vec.normalize();
            expect(vec.length()).toBeNear(1, 0.001);
        });

        it('rounds its coordinates', function() {
            var vec = new Vec2(3.33, 4.8);
            vec.round();
            expect(vec.x).toBe(3);
            expect(vec.y).toBe(5);
        });

        it('calculates a dot product', function() {
            var vecA = new Vec2(1.2, 3.4);
            var vecB = new Vec2(8.7, 6.5);
            expect(vecA.dotProduct(vecB)).toBeNear(1.2 * 8.7 + 3.4 * 6.5,
                                                   0.001);
        });

        it('scales', function() {
            var vec = new Vec2(1, 2);
            vec.scale(3.4);
            expect(vec.x).toBeNear(3.4, 0.00001);
            expect(vec.y).toBeNear(6.8, 0.00001);
        });

        it('translates', function() {
            var vecA = new Vec2(1, 3);
            var vecB = new Vec2(5, 7);
            vecA.translate(vecB);
            expect(vecA.x).toBe(6);
            expect(vecA.y).toBe(10);
        });

        it('calculates a slope to another Vec2', function() {
            var vecA = new Vec2(1.2, 3.4);
            var vecB = new Vec2(8.7, 6.5);
            expect(vecA.slope(vecB)).toBeNear((6.5 - 3.4) / (8.7 - 1.2), 0.001);
        });

        it('projects to a line', function() {
            var vecA = new Vec2(1.2, 3.4);
            var vecB = new Vec2(8.7, 6.5);
            var vecC = new Vec2(9.0, 1.2);
            vecC.projectToLine(vecA, vecB);
            var deltaY = (vecC.x - vecA.x) * vecA.slope(vecB);
            expect(vecC.y - vecA.y).toBeNear(deltaY, 0.001);
            var origC = new Vec2(9.0, 1.2);
            expect(vecC.slope(origC)).toBeNear(-1.0 / vecA.slope(vecB), 0.001);
        });

        it('projects to a circle', function() {
            var vec = new Vec2(1.2, 3.4);
            var radius = 5.0;
            var center = new Vec2(6.7, 8.9);
            vec.projectToCircle(center.x, center.y, radius);
            expect(vec.distance(center)).toBeNear(radius, 0.00001);
            var projectedAngle = Math.atan2(vec.y - center.y, vec.x - center.x);
            var originalAngle = Math.atan2(3.4 - center.y, 1.2 - center.x);
            expect(projectedAngle).toBeNear(originalAngle, 0.00001);
        });

        it('calculates its distance to a line', function() {
            var vecA = new Vec2(1.2, 3.4);
            var vecB = new Vec2(8.7, 6.5);
            var vecC = new Vec2(9.0, 1.2);
            expect(vecC.distanceToLine(vecA, vecB)).toBeNear(5.0126811, 0.001);
        });

        it('calculates its angle to the positive x axis', function() {
            var vecA = new Vec2(1.0, 0.0);
            expect(vecA.angle()).toBeNear(0, 0.0001);
            var vecB = new Vec2(0.0, 1.0);
            expect(vecB.angle()).toBeNear(Math.PI * 0.5, 0.0001);
            var vecC = new Vec2(-1.0, 0.0);
            expect(vecC.angle()).toBeNear(Math.PI, 0.0001);
            var vecD = new Vec2(0.0, -1.0);
            expect(vecD.angle()).toBeNear(Math.PI * 1.5, 0.0001);
            var vecE = new Vec2(1.0, 1.0);
            expect(vecE.angle()).toBeNear(Math.PI * 0.25, 0.0001);
        });

        it('calculates its angle to another vector', function() {
            var vecA = new Vec2(1.0, 0.0);
            expect(vecA.angleFrom(vecA)).toBeNear(0, 0.0001);
            var vecB = new Vec2(0.0, 1.0);
            expect(vecB.angleFrom(vecA)).toBeNear(Math.PI * 0.5, 0.0001);
            expect(vecA.angleFrom(vecB)).toBeNear(-Math.PI * 0.5, 0.0001);
            var vecC = new Vec2(-1.0, 0.0);
            expect(vecC.angleFrom(vecA)).toBeNear(Math.PI, 0.0001);
            expect(vecC.angleFrom(vecB)).toBeNear(Math.PI * 0.5, 0.0001);
            expect(vecB.angleFrom(vecC)).toBeNear(-Math.PI * 0.5, 0.0001);
            var vecD = new Vec2(0.0, -1.0);
            expect(vecD.angleFrom(vecA)).toBeNear(Math.PI * 1.5, 0.0001);
            expect(vecD.angleFrom(vecB)).toBeNear(Math.PI, 0.0001);
            expect(vecD.angleFrom(vecC)).toBeNear(Math.PI * 0.5, 0.0001);
            expect(vecC.angleFrom(vecD)).toBeNear(-Math.PI * 0.5, 0.0001);
        });

        it('rotates', function() {
            for (var i = 0; i < 10; ++i) {
                var vecA = new Vec2(1.0, 0.0);
                var vecB = new Vec2(1.0, 0.0);
                vecB.rotate(i * 0.2 * Math.PI);
                vecA.rotate(i * 0.1 * Math.PI);
                expect(vecB.angleFrom(vecA)).toBeNear(i * 0.1 * Math.PI, 0.0001);
            }
        });
    });

    function testRect() {
        var left = 1;
        var right = 2;
        var top = 3;
        var bottom = 5;
        return new Rect(left, right, top, bottom);
    }

    function testRect2() {
        var left = 0;
        var right = 3;
        var top = 4;
        var bottom = 6;
        return new Rect(left, right, top, bottom);
    }

    function testRect3() {
        var left = 1;
        var right = 2.5;
        var top = 3;
        var bottom = 5.1;
        return new Rect(left, right, top, bottom);
    }

    function testRect4() {
        var left = 2.7;
        var right = 3.2;
        var top = 5.9;
        var bottom = 5.95;
        return new Rect(left, right, top, bottom);
    }

    describe('Rect', function() {
        it('initializes', function() {
            var rect = testRect();
            expect(rect.left).toBe(1);
            expect(rect.right).toBe(2);
            expect(rect.top).toBe(3);
            expect(rect.bottom).toBe(5);
        });

        it('initializes from a circle', function() {
            var rect = Rect.fromCircle(1, 2, 3);
            expect(rect.left).toBe(-2);
            expect(rect.right).toBe(4);
            expect(rect.top).toBe(-1);
            expect(rect.bottom).toBe(5);
        });

        it('calculates its width and height', function() {
            var rect = testRect();
            expect(rect.width()).toBe(1);
            expect(rect.height()).toBe(2);
        });

        it('calculates its area', function() {
            var rect = testRect();
            expect(rect.area()).toBe(2);
        });

        it ('calculates its center', function() {
            var rect = testRect();
            var center = rect.getCenter();
            expect(center instanceof Vec2).toBe(true);
            expect(center.x).toBe(1.5);
            expect(center.y).toBe(4);
        });

        it('can be made empty', function() {
            var rect = testRect();
            expect(rect.isEmpty()).toBe(false);
            rect.makeEmpty();
            expect(rect.isEmpty()).toBe(true);
        });
        
        it('calculates its union with another Rect', function() {
            var rectA = testRect();
            var rectB = testRect2();
            rectA.unionRect(rectB);
            expect(rectA.left).toBe(0);
            expect(rectA.right).toBe(3);
            expect(rectA.top).toBe(3);
            expect(rectA.bottom).toBe(6);
        });

        it('calculates its intersection with another Rect', function() {
            var rectA = testRect();
            var rectB = testRect2();
            var rect = rectA.getIntersection(rectB);
            expect(rect.isEmpty()).toBe(false);
            expect(rect.left).toBe(1);
            expect(rect.right).toBe(2);
            expect(rect.top).toBe(4);
            expect(rect.bottom).toBe(5);
            
            expect(rectA.intersectsRect(rectB)).toBe(true);

            rectA.intersectRect(rectB);
            expect(rectA.isEmpty()).toBe(false);
            expect(rectA.left).toBe(1);
            expect(rectA.right).toBe(2);
            expect(rectA.top).toBe(4);
            expect(rectA.bottom).toBe(5);
        });

        it('calculates an empty intersection', function() {
            var rectA = testRect3();
            var rectB = testRect4();
            var rect = rectA.getIntersection(rectB);
            expect(rect.isEmpty()).toBe(true);

            expect(rectA.intersectsRect(rectB)).toBe(false);

            rectA.intersectRect(rectB);
            expect(rectA.isEmpty()).toBe(true);
        });

        it('calculates whether it intersects a circle', function() {
            var rect = testRect();
            expect(rect.intersectsCircle(new Vec2(0, 0), 6)).toBe(true);
            expect(rect.intersectsCircle(rect.getCenter(), 0.1)).toBe(true);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.top - 1), 1)).toBe(false);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.top - 1), 2)).toBe(true);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.top - 1), Math.sqrt(2) * 0.99)).toBe(false);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.top - 1), Math.sqrt(2) * 1.01)).toBe(true);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.bottom + 1), Math.sqrt(2) * 0.99)).toBe(false);
            expect(rect.intersectsCircle(new Vec2(rect.left - 1, rect.bottom + 1), Math.sqrt(2) * 1.01)).toBe(true);
            expect(rect.intersectsCircle(new Vec2(rect.right + 1, rect.top - 1), Math.sqrt(2) * 0.99)).toBe(false);
            expect(rect.intersectsCircle(new Vec2(rect.right + 1, rect.top - 1), Math.sqrt(2) * 1.01)).toBe(true);
            expect(rect.intersectsCircle(new Vec2(rect.right + 1, rect.bottom + 1), Math.sqrt(2) * 0.99)).toBe(false);
            expect(rect.intersectsCircle(new Vec2(rect.right + 1, rect.bottom + 1), Math.sqrt(2) * 1.01)).toBe(true);            
        });

        it('determines whether a Vec2 is inside it', function() {
            var rectA = testRect();
            expect(rectA.containsVec2(new Vec2(1, 3))).toBe(true);
            expect(rectA.containsVec2(new Vec2(2, 5))).toBe(true);
            expect(rectA.containsVec2(new Vec2(0.5, 3.5))).toBe(false);
            expect(rectA.containsVec2(new Vec2(2.5, 3.5))).toBe(false);
            expect(rectA.containsVec2(new Vec2(1.5, 2.5))).toBe(false);
            expect(rectA.containsVec2(new Vec2(1.5, 5.5))).toBe(false);
        });

        it('determines whether a Rect is inside it', function() {
            var rectA = testRect3();
            expect(rectA.containsRect(testRect())).toBe(true);
            expect(rectA.containsRect(testRect2())).toBe(false);
            expect(rectA.containsRect(testRect4())).toBe(false);
        });

        it('clips from the top', function() {
            var rectA = testRect();
            rectA.limitTop(1);
            expect(rectA.top).toBe(3);
            rectA.limitTop(3.5);
            expect(rectA.top).toBe(3.5);
            rectA.limitTop(6);
            expect(rectA.top).toBe(5);
        });

        it('clips from the bottom', function() {
            var rectA = testRect();
            rectA.limitBottom(6);
            expect(rectA.bottom).toBe(5);
            rectA.limitBottom(3.5);
            expect(rectA.bottom).toBe(3.5);
            rectA.limitBottom(1);
            expect(rectA.bottom).toBe(3);
        });

        it('clips from the left', function() {
            var rectA = testRect();
            rectA.limitLeft(0.5);
            expect(rectA.left).toBe(1);
            rectA.limitLeft(1.5);
            expect(rectA.left).toBe(1.5);
            rectA.limitLeft(3);
            expect(rectA.left).toBe(2);
        });

        it('clips from the right', function() {
            var rectA = testRect();
            rectA.limitRight(3);
            expect(rectA.right).toBe(2);
            rectA.limitRight(1.5);
            expect(rectA.right).toBe(1.5);
            rectA.limitRight(0.5);
            expect(rectA.right).toBe(1);
        });

        it('determines whether another Rect is mostly inside it', function() {
            var rectA = testRect();
            expect(rectA.isMostlyInside(new Rect(rectA.left - 2,
                                                 rectA.right + rectA.width(),
                                                 rectA.top - rectA.height(),
                                                 rectA.bottom + 2))).toBe(true);
            expect(rectA.isMostlyInside(new Rect(rectA.left +
                                                 rectA.width() * 0.49,
                                                 rectA.right,
                                                 rectA.top,
                                                 rectA.bottom))).toBe(true);
            expect(rectA.isMostlyInside(new Rect(rectA.left +
                                                 rectA.width() * 0.51,
                                                 rectA.right,
                                                 rectA.top,
                                                 rectA.bottom))).toBe(false);
        });
    });
    
    var testPolygon = function() {
        return new Polygon([new Vec2(0, 0), new Vec2(1, 0), new Vec2(0, 1)]);
    };
    
    describe('Polygon', function() {
        it ('initializes', function() {
            var p = testPolygon();
            expect(p._vertices[0].x).toBe(0);
            expect(p._vertices[0].y).toBe(0);
            expect(p._vertices[1].x).toBe(1);
            expect(p._vertices[1].y).toBe(0);
            expect(p._vertices[2].x).toBe(0);
            expect(p._vertices[2].y).toBe(1);
        });

        it ('determines whether a vector is inside', function() {
            var p = testPolygon();
            expect(p.containsVec2(new Vec2(0.1, 0.1))).toBe(true);

            // Customarily points on top or right edge are considered outside, and left and bottom edge inside.
            expect(p.containsVec2(new Vec2(0, 0))).toBe(false);
            expect(p.containsVec2(new Vec2(0, 0.5))).toBe(true);
            expect(p.containsVec2(new Vec2(0.5, 0))).toBe(false);

            expect(p.containsVec2(new Vec2(-0.1, -0.1))).toBe(false);
            expect(p.containsVec2(new Vec2(0.49, 0.49))).toBe(true);
            expect(p.containsVec2(new Vec2(0.51, 0.51))).toBe(false);
        });

        it ('determines if it intersects with a circle', function() {
            var p = testPolygon();
            expect(p.intersectsCircle(new Vec2(0.1, 0.1), 0.01)).toBe(true);
            expect(p.intersectsCircle(new Vec2(-0.1, -0.1), 0.1)).toBe(false);
            expect(p.intersectsCircle(new Vec2(-0.1, -0.1), 0.2)).toBe(true);

            expect(p.intersectsCircle(new Vec2(-0.1, 0.5), 0.09)).toBe(false);
            expect(p.intersectsCircle(new Vec2(-0.1, 0.5), 0.11)).toBe(true);
            expect(p.intersectsCircle(new Vec2(0.5, -0.1), 0.09)).toBe(false);
            expect(p.intersectsCircle(new Vec2(0.5, -0.1), 0.11)).toBe(true);
            expect(p.intersectsCircle(new Vec2(0.5 + 1, 0.5 + 1), 0.99 * Math.sqrt(2))).toBe(false);
            expect(p.intersectsCircle(new Vec2(0.5 + 1, 0.5 + 1), 1.01 * Math.sqrt(2))).toBe(true);

            expect(p.intersectsCircle(new Vec2(0.5, -1.1), 1.0)).toBe(false);
            expect(p.intersectsCircle(new Vec2(-1.1, 0.5), 1.0)).toBe(false);
        });

        it ('determines if it intersects with a rect', function() {
            var p = testPolygon();
            expect(p.intersectsRect(testRect())).toBe(false);
            expect(p.intersectsRect(new Rect(0, 1, 0, 1))).toBe(true);
            expect(p.intersectsRect(new Rect(-1, 2, 0.2, 0.8))).toBe(true);
            expect(p.intersectsRect(new Rect(0.01, 1.01, 0.01, 1.01))).toBe(true);
            expect(p.intersectsRect(new Rect(0.01, 1.01, 0.01, 1.01))).toBe(true);

            // Test identical rect intersection corner case
            var p2 = new Polygon([new Vec2(0, 0), new Vec2(1, 0), new Vec2(1, 1), new Vec2(0, 1)]);
            expect(p2.intersectsRect(new Rect(0, 1, 0, 1))).toBe(true);
        });
    });

    describe('AffineTransform', function() {
        it('initializes', function() {
            var a = new AffineTransform();
            expect(a._translate.x).toBe(0);
            expect(a._translate.y).toBe(0);
            expect(a._scale).toBe(1);
        });

        it('translates a vector', function() {
            var a = new AffineTransform();
            a._translate.x = 7;
            a._translate.y = 11;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(9);
            expect(v.y).toBe(14);
        });

        it('scales a vector', function() {
            var a = new AffineTransform();
            a._scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(10);
            expect(v.y).toBe(15);
        });

        it('scales and translates a vector', function() {
            var a = new AffineTransform();
            a._translate.x = 7;
            a._translate.y = 11;
            a._scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(17);
            expect(v.y).toBe(26);
        });

        it('inverse transforms a vector', function() {
            var a = new AffineTransform();
            a._translate.x = 7;
            a._translate.y = 11;
            a._scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            a.inverseTransform(v);
            expect(v.x).toBe(2);
            expect(v.y).toBe(3);
        });

        it('scales and translates a rectangle', function() {
            var a = new AffineTransform();
            a._translate.x = 7;
            a._translate.y = 11;
            a._scale = 5;
            var r = new Rect(2, 3, 5, 13);
            a.transformRect(r);
            expect(r.left).toBe(17);
            expect(r.right).toBe(22);
            expect(r.top).toBe(36);
            expect(r.bottom).toBe(76);
        });
    });
});

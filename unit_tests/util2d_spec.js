/*
 * Copyright Olli Etuaho 2013.
 */

import { AffineTransform } from "../src/gjs/math/affine_transform.js";
import { Vec2 } from "../src/gjs/math/vec2.js";
import { Rect } from "../src/gjs/math/rect.js";
import { mathUtil, Polygon } from "../src/gjs/util2d.js";
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

    function testRect() {
        var left = 1;
        var right = 2;
        var top = 3;
        var bottom = 5;
        return new Rect(left, right, top, bottom);
    }

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
            expect(a.translate.x).toBe(0);
            expect(a.translate.y).toBe(0);
            expect(a.scale).toBe(1);
        });

        it('translates a vector', function() {
            var a = new AffineTransform();
            a.translate.x = 7;
            a.translate.y = 11;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(9);
            expect(v.y).toBe(14);
        });

        it('scales a vector', function() {
            var a = new AffineTransform();
            a.scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(10);
            expect(v.y).toBe(15);
        });

        it('scales and translates a vector', function() {
            var a = new AffineTransform();
            a.translate.x = 7;
            a.translate.y = 11;
            a.scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            expect(v.x).toBe(17);
            expect(v.y).toBe(26);
        });

        it('inverse transforms a vector', function() {
            var a = new AffineTransform();
            a.translate.x = 7;
            a.translate.y = 11;
            a.scale = 5;
            var v = new Vec2(2, 3);
            a.transform(v);
            a.inverseTransform(v);
            expect(v.x).toBe(2);
            expect(v.y).toBe(3);
        });

        it('scales and translates a rectangle', function() {
            var a = new AffineTransform();
            a.translate.x = 7;
            a.translate.y = 11;
            a.scale = 5;
            var r = new Rect(2, 3, 5, 13);
            a.transformRect(r);
            expect(r.left).toBe(17);
            expect(r.right).toBe(22);
            expect(r.top).toBe(36);
            expect(r.bottom).toBe(76);
        });
    });
});

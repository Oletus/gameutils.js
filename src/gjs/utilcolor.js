/*
 * Copyright Olli Etuaho 2012-2014.
 */

import { rgbToHsl, hslToRgb } from "../lib/hsl.js";

// This file contains following utilities:
// cssUtil: Utilities for working with CSS
// colorUtil: Utilities for working with RGB colors represented as arrays of numbers, including blending

var cssUtil = {
    rgbString: null,
    rgbaString: null
};

/**
 * Create a CSS RGB color based on the input array.
 * @param {Array.<number>|Uint8Array} rgbArray Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {string} CSS color.
 */
cssUtil.rgbString = function(rgbArray) {
    return 'rgb(' + Math.floor(rgbArray[0]) + ',' + Math.floor(rgbArray[1]) +
    ',' + Math.floor(rgbArray[2]) + ')';
};

/**
 * Create a CSS RGBA color based on the input array.
 * @param {Array.<number>|Uint8Array} rgbaArray Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {string} CSS color.
 */
cssUtil.rgbaString = function(rgbaArray) {
    return 'rgba(' + Math.floor(rgbaArray[0]) + ',' + Math.floor(rgbaArray[1]) +
    ',' + Math.floor(rgbaArray[2]) + ',' + (rgbaArray[3] / 255) + ')';
};

var colorUtil = {
    unpremultiply: null,
    premultiply: null,
    blend: null,
    serializeRGB: null,
    differentColor: null,
    blendWithFunction: null,
    blendMultiply: null,
    blendScreen: null,
    blendDarken: null,
    blendLighten: null,
    blendDifference: null,
    blendExclusion: null,
    blendOverlay: null,
    blendHardLight: null,
    blendSoftLight: null,
    blendColorBurn: null,
    blendLinearBurn: null,
    blendVividLight: null,
    blendLinearLight: null,
    blendPinLight: null,
    blendColorDodge: null,
    blendLinearDodge: null
};

/**
 * Unpremultiply a color value.
 * @param {Array.<number>|Uint8Array} premultRGBA Premultiplied color value.
 * Channel values should be 0-255.
 * @return {Array.<number>|Uint8Array} The input array, if the result is
 * identical, or a new array with unpremultiplied color. Channel values 0-255.
 */
colorUtil.unpremultiply = function(premultRGBA) {
    if (premultRGBA[3] === 255) {
        return premultRGBA;
    }
    var buffer = new ArrayBuffer(4);
    var unmultRGBA = new Uint8Array(buffer);
    var alpha = premultRGBA[3] / 255.0;
    if (alpha > 0) {
        for (var i = 0; i < 3; ++i) {
            unmultRGBA[i] = premultRGBA[i] / alpha;
        }
        unmultRGBA[3] = premultRGBA[3];
    } else {
        for (var i = 0; i < 4; ++i) {
            unmultRGBA[i] = 0;
        }
    }
    return unmultRGBA;
};

/**
 * Premultiply a color value.
 * @param {Array.<number>|Uint8Array} unpremultRGBA Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {Array.<number>|Uint8Array} The input array, if the result is
 * identical, or a new array with premultiplied color. Channel values 0-255.
 */
colorUtil.premultiply = function(unpremultRGBA) {
    if (unpremultRGBA[3] === 255) {
        return unpremultRGBA;
    }
    var buffer = new ArrayBuffer(4);
    var premultRGBA = new Uint8Array(buffer);
    var alpha = unpremultRGBA[3] / 255.0;
    if (alpha > 0) {
        for (var i = 0; i < 3; ++i) {
            premultRGBA[i] = unpremultRGBA[i] * alpha;
        }
        premultRGBA[3] = unpremultRGBA[3];
    } else {
        for (var i = 0; i < 4; ++i) {
            premultRGBA[i] = 0;
        }
    }
    return premultRGBA;
};

/**
 * Blend two unpremultiplied color values.
 * @param {Array.<number>|Uint8Array} dstRGBA Destination RGBA value.
 * @param {Array.<number>|Uint8Array} srcRGBA Source RGBA value.
 * @return {Uint8Array} Resulting RGBA color value.
 */
colorUtil.blend = function(dstRGBA, srcRGBA) {
    var srcAlpha = srcRGBA[3] / 255.0;
    var dstAlpha = dstRGBA[3] / 255.0;
    var alpha = srcAlpha + dstAlpha * (1.0 - srcAlpha);
    var buffer = new ArrayBuffer(4);
    var resultRGBA = new Uint8Array(buffer);
    for (var i = 0; i < 3; ++i) {
        resultRGBA[i] = (dstRGBA[i] * dstAlpha * (1.0 - srcAlpha) +
                         srcRGBA[i] * srcAlpha) / alpha + 0.5;
    }
    resultRGBA[3] = alpha * 255 + 0.5;
    return resultRGBA;
};

/**
 * Serialize an RGB value.
 * @param {Array.<number>|Uint8Array} RGB RGB value.
 * @return {Array} Copy of the value suitable for adding to JSON.
 */
colorUtil.serializeRGB = function(RGB) {
    return [RGB[0], RGB[1], RGB[2]];
};

/**
 * Return a color that is visually distinct from the given color. The hue is
 * inverted and the lightness is inverted, unless the lightness is close to
 * 0.5, when the lightness is simply increased.
 * @param {Array.<number>|Uint8Array} color An RGB value.
 * @return {Array.<number>} A different RGB value.
 */
colorUtil.differentColor = function(color) {
    var hsl = rgbToHsl(color[0], color[1], color[2]);
    hsl[0] = (hsl[0] + 0.5) % 1;
    if (hsl[2] < 0.4 || hsl[2] > 0.6) {
        hsl[2] = 1.0 - hsl[2];
    } else {
        hsl[2] = (hsl[2] + 0.4) % 1;
    }
    return hslToRgb(hsl[0], hsl[1], hsl[2]);
};

/**
 * Blend the two single-channel values to each other, taking into account bottom and top layer alpha.
 * @param {function} blendFunction The blend function to use, one of colorUtil.blend*
 * @param {number} target Single-channel color value of the bottom layer, 0 to 255.
 * @param {number} source Single-channel color value of the top layer, 0 to 255.
 * @param {number} targetAlpha Alpha value of the bottom layer, 0.0 to 1.0.
 * @param {number} sourceAlpha Alpha value of the top layer, 0.0 to 1.0.
 * @return {number} Blend result as an integer from 0 to 255.
 */
colorUtil.blendWithFunction = function(blendFunction, target, source, targetAlpha, sourceAlpha) {
    var alpha = targetAlpha + sourceAlpha * (1.0 - targetAlpha);
    if (alpha > 0.0) {
        // First calculate the blending result without taking the transparency of the target into account.
        var rawResult = blendFunction(target, source);
        // Then mix according to weights.
        // See KHR_blend_equation_advanced specification for reference.
        return Math.round((rawResult * targetAlpha * sourceAlpha +
                           source * sourceAlpha * (1.0 - targetAlpha) +
                           target * targetAlpha * (1.0 - sourceAlpha)) / alpha);
    } else {
        return 0.0;
    }
};

/**
 * Multiply blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendMultiply = function(a, b) {
    return a * b / 255.;
};

/**
 * Screen blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendScreen = function(a, b) {
    return 255. - (1. - a / 255.) * (255. - b);
};

/**
 * Overlay blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendOverlay = function(a, b) {
    return a < 127.5 ?
            (2.0 / 255.0 * a * b) :
            (255.0 - 2.0 * (1.0 - b / 255.0) * (255.0 - a));
};

/**
 * Hard Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendHardLight = function(a, b) {
    return b < 127.5 ?
            (2.0 / 255.0 * a * b) :
            (255.0 - 2.0 * (1.0 - b / 255.0) * (255.0 - a));
};

/**
 * Soft Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendSoftLight = function(a, b) {
    a /= 255;
    b /= 255;
    return 255 * (b <= .5 ? a - (1 - 2 * b) * a * (1 - a) :
            b > 0.5 && a <= 0.25 ? a + (2 * b - 1) * a * ((16 * a - 12) * a + 3) :
            a + (2 * b - 1) * (Math.sqrt(a) - a));
};

/**
 * Darken blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendDarken = function(a, b) {
    return a < b ? a : b;
};

/**
 * Lighten blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLighten = function(a, b) {
    return a > b ? a : b;
};

/**
 * Difference blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendDifference = function(a, b) {
    return Math.abs(a - b);
};

/**
 * Exclusion blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendExclusion = function(a, b) {
    return a + b - 2.0 / 255.0 * a * b;
};

/**
 * Color Burn blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendColorBurn = function(a, b) {
    if (a === 255)
        return 255;
    if (b === 0)
        return 0;
    return mathUtil.clamp(0, 255, 255 - (255 - a) / b * 255);
};

/**
 * Linear Burn blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearBurn = function(a, b) {
    return mathUtil.clamp(0, 255, a + b - 255.);
};

/**
 * Vivid Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendVividLight = function(a, b) {
    if (b === 0)
        return 0;
    if (b === 255)
        return 255;
    a /= 255;
    b /= 255;
    return mathUtil.clamp(0, 255, 255 * (b <= .5 ?
            1 - (1 - a) / (2 * b) :
            a / (2 * (1 - b))));
};

/**
 * Linear Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearLight = function(a, b) {
    a /= 255;
    b /= 255;
    return mathUtil.clamp(0, 255, 255 * (b <= .5 ?
            (a + 2 * b - 1) :
            (a + 2 * (b - 0.5))));
};

/**
 * Pin Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendPinLight = function(a, b) {
    a /= 255;
    b /= 255;
    return 255 * (b <= .5 ?
            (Math.min(a, 2 * b)) :
            (Math.max(a, 2 * (b - 0.5))));
};

/**
 * Color Dodge blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendColorDodge = function(a, b) {
    if (a === 0)
        return 0;
    if (b === 255)
        return 255;
    return mathUtil.clamp(0, 255, 255. * a / (255 - b));
};

/**
 * Linear Dodge blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearDodge = function(a, b) {
    return mathUtil.clamp(0, 255, a + b);
};

export { cssUtil, colorUtil }

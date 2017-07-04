'use strict';

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * Bitmap font that uses a simple ISO-8859-1 monospace grid sprite sheet.
 * @param {Object} options Constructor options.
 * @constructor
 */
GJS.MonospaceBitmapFont = function(options) {
    var defaults = {
        spriteSrc: 'bitmapfont-tiny.png',
        characterHeight: 6,
        characterWidth: 4,
        charactersPerRow: undefined,
        color: undefined,
        closerKerningCharacters: [], // list of characters to kern closer when in pairs. for example: ['i', 'l']
        kerningAmount: 1
    };
    objectUtil.initWithDefaults(this, defaults, options);
    if (this.color !== undefined) {
        this.sprite = new GJS.Sprite(this.spriteSrc, GJS.Sprite.turnSolidColored(this.color));
    } else {
        this.sprite = new GJS.Sprite(this.spriteSrc);
    }
};

/**
 * Draw a single character.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 * @param {string} A single-character string to draw.
 */
GJS.MonospaceBitmapFont.prototype.drawCharacter = function(ctx, character) {
    if (this.sprite.loaded) {
        if (this.charactersPerRow === undefined) {
            this.charactersPerRow = this.sprite.width / this.characterWidth;
        }
        var code = character.charCodeAt(0);
        var row = Math.floor(code / this.charactersPerRow);
        var col = code - (row * this.charactersPerRow);
        ctx.drawImage(this.sprite.img,
                      col * this.characterWidth, row * this.characterHeight,
                      this.characterWidth, this.characterHeight,
                      0, 0,
                      this.characterWidth, this.characterHeight);
    }
};

/**
 * Draw a string of text. The "textAlign" property of the canvas context affects its placement.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 * @param {string} string String to draw.
 * @param {number} x Horizontal coordinate.
 * @param {number} y Vertical coordinate.
 */
GJS.MonospaceBitmapFont.prototype.drawText = function(ctx, string, x, y) {
    var drawnWidth = string.length * this.characterWidth;
    var kerningActive = this.closerKerningCharacters.length > 0 && this.kerningAmount != 0;
    var prevCharacterNarrow = false;
    if (kerningActive) {
        for (var i = 0; i < string.length; ++i) {
            if (this.closerKerningCharacters.indexOf(string[i]) >= 0) {
                if (prevCharacterNarrow) {
                    drawnWidth -= this.kerningAmount;
                }
                prevCharacterNarrow = true;
            } else {
                prevCharacterNarrow = false;
            }
        }
    }

    var baselineTranslate = 0; // Default for top and hanging
    if (ctx.textBaseline == 'bottom' || ctx.textBaseline == 'alphabetic' || ctx.textBaseline == 'ideographic') {
        baselineTranslate = -this.characterHeight;
    } else if (ctx.textBaseline == 'middle') {
        baselineTranslate = Math.floor(-this.characterHeight * 0.5);
    }
    var alignTranslate = 0;
    if (ctx.textAlign == 'center') {
        alignTranslate = -Math.floor(drawnWidth * 0.5);
    } else if (ctx.textAlign == 'right') {
        alignTranslate = -Math.floor(drawnWidth);
    }
    ctx.save();
    ctx.translate(x + alignTranslate, y + baselineTranslate);
    for (var i = 0; i < string.length; ++i) {
        this.drawCharacter(ctx, string[i]);
        if (kerningActive) {        
            if (this.closerKerningCharacters.indexOf(string[i]) >= 0 && i + 1 < string.length &&
                this.closerKerningCharacters.indexOf(string[i + 1]) >= 0) {
                ctx.translate(this.characterWidth - this.kerningAmount, 0);
            } else {
                ctx.translate(this.characterWidth, 0);
            }
            
        } else {
            ctx.translate(this.characterWidth, 0);
        }
    }
    ctx.restore();
};

/**
 * Draw a string of text split in several rows. The "textAlign" property of the canvas context affects its placement.
 * The text is split at spaces.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 * @param {string} textToRender String to draw.
 * @param {number} x Horizontal coordinate.
 * @param {number} y Vertical coordinate of the top row.
 * @param {number} maxRowLength Maximum length of row in characters.
 * @param {number} rowHeight Row height in coordinates.
 */
GJS.MonospaceBitmapFont.prototype.drawTextInRows = function(ctx, textToRender, x, y, maxRowLength, rowHeight) {
    var renderedRows = this._splitRows(textToRender, maxRowLength);
    for (var i = 0; i < renderedRows.length; ++i) {
        this.drawText(ctx, renderedRows[i], x, y + i * rowHeight);
    }
};

/**
 * @param {string} textToRender String to draw.
 * @param {number} maxRowLength Maximum length of row in characters.
 * @return {number} Number of rows that would get drawn if drawTextInRows is called with the same arguments.
 */
GJS.MonospaceBitmapFont.prototype.getNumberOfRows = function(textToRender, maxRowLength) {
    return this._splitRows(textToRender, maxRowLength).length;
};

/**
 * Split text into rows. The text is split at spaces.
 * @param {string} textToRender String to draw.
 * @param {number} maxRowLength Maximum length of row in characters.
 * @protected
 */
GJS.MonospaceBitmapFont.prototype._splitRows = function(textToRender, maxRowLength) {
    var renderedRows = textToRender;
    if (!(renderedRows instanceof Array)) {
        if (maxRowLength < 0) {
            renderedRows = [textToRender];
        } else {
            renderedRows = [];
            var rowStartIndex = 0;
            var spaceIndex = textToRender.indexOf(' ');
            while (textToRender.length - rowStartIndex > maxRowLength) {
                var prevSpaceIndex = spaceIndex;
                while (spaceIndex - rowStartIndex < maxRowLength && spaceIndex !== -1) {
                    prevSpaceIndex = spaceIndex;
                    spaceIndex = textToRender.indexOf(' ', prevSpaceIndex + 1);
                }
                renderedRows.push(textToRender.substring(rowStartIndex, prevSpaceIndex));
                rowStartIndex = prevSpaceIndex + 1;
            }
            renderedRows.push(textToRender.substring(rowStartIndex));
        }
    }
    return renderedRows;
};

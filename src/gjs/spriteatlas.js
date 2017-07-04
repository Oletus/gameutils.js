'use strict';

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * @constructor
 * @param {GJS.Sprite} img
 * @param {string} info JSON string holding information about the sprite atlas image.
 */
GJS.SpriteAtlas = function(img, info) {
    this.img = img;
    this.info = JSON.parse(info);
    if (this.img.bakeableFilepath !== null) {
        var index = GJS.Sprite.bakeableSpritePaths.indexOf(this.img.bakeableFilepath);
        if (index >= 0) {
            GJS.Sprite.bakeableSpritePaths.splice(index, 1);
        }
    }
};

/** 
 * @param {string} filepath
 */
GJS.SpriteAtlas.prototype.getSpriteImg = function(filepath) {
    if (this.hasSpriteImg(filepath)) {
        var fileinfo = this.info['imgInfo'][filepath];
        var targetImg = document.createElement('canvas');
        targetImg.width = fileinfo['width'];
        targetImg.height = fileinfo['height'];
        var ctx = targetImg.getContext('2d');
        // TODO: Clean up direct usage of this.img.img
        ctx.drawImage(this.img.img, fileinfo['x'], fileinfo['y'], fileinfo['width'], fileinfo['height'], 0, 0, fileinfo['width'], fileinfo['height']);
        return targetImg;
    } else {
        return GJS.Sprite.getMissingImg(filepath);
    }
};

/** 
 * @param {string} filepath
 */
GJS.SpriteAtlas.prototype.hasSpriteImg = function(filepath) {
    return this.info['imgInfo'].hasOwnProperty(filepath);
};

/**
 * Create a sprite atlas from all loaded GJS.Sprite objects and trigger a download of it.
 */
GJS.SpriteAtlas.bakeLoadedSpritesAndSave = function() {
    GJS.SpriteAtlas.bakeLoadedSprites(function(atlas) {
        var infoBlob = new Blob([JSON.stringify(atlas.info)], {type: 'application/json'});
        window['saveAs'](infoBlob, 'sprite-atlas.json');

        atlas.img.img.toBlob(function(blob) {
            window['saveAs'](blob, 'sprite-atlas.png');
        });
    });
};

/**
 * Create a sprite atlas from all loaded GJS.Sprite objects.
 * This loads all sprites again so that GJS.Sprite allocations are not referenced in any central structure and may be
 * garbage collected.
 * @param {function} doneCallback Callback called with GJS.SpriteAtlas object as a parameter when.
 */
GJS.SpriteAtlas.bakeLoadedSprites = function(doneCallback) {
    // Copy the bakeable paths so that Sprite objects created inside this function don't add to it.
    var bakeablePaths = GJS.Sprite.bakeableSpritePaths.slice();
    // Prune duplicates from bakeablePaths.
    bakeablePaths = bakeablePaths.filter(function(item, pos, that) {
        return that.indexOf(item) === pos;
    });

    var sprites = [];

    var spritesLoadedCount = 0;
    var spriteLoaded = function() {
        ++spritesLoadedCount;
        if (spritesLoadedCount == bakeablePaths.length) {
            doneCallback(GJS.SpriteAtlas.bakeSprites(sprites));
        }
    };
    
    var restoreGfxPath = GJS.Sprite.gfxPath;
    var restoreAtlas = GJS.Sprite.atlas;
    GJS.Sprite.gfxPath = '';
    GJS.Sprite.atlas = null;
    for (var i = 0; i < bakeablePaths.length; ++i) {
        var path = bakeablePaths[i];
        var sprite = new GJS.Sprite(path);
        sprites.push(sprite);
        sprite.addLoadedListener(spriteLoaded);
    }
    GJS.Sprite.gfxPath = restoreGfxPath;
    GJS.Sprite.atlas = restoreAtlas;
};

/**
 * Creates a sprite atlas from a set of GJS.Sprite objects.
 * @param {Array.<GJS.Sprite>} sprites Sprites to bake into an atlas.
 * @return {GJS.SpriteAtlas}
 */
GJS.SpriteAtlas.bakeSprites = function(sprites) {
    var widestWidth = 0;
    var spritesByPath = {};
    for (var i = 0; i < sprites.length; ++i) {
        if (!sprites[i].missing) {
            if (sprites[i].width > widestWidth) {
                widestWidth = sprites[i].width;
            }
            spritesByPath[sprites[i].bakeableFilepath] = sprites[i];
        }
    }

    var compareHeight = function(a, b) {
        if (a.height > b.height) {
            return -1;
        }
        if (b.height > a.height) {
            return 1;
        }
        return 0;
    };

    sprites.sort(compareHeight);

    var binWidth = Math.max(widestWidth, 2048);

    var info = {
        'imgInfo': {}
    };

    var borderWidth = 1;

    var x = 0;
    var y = 0;
    var nextRowY = sprites[0].height + borderWidth * 2;
    var emptyRectTop = null;
    var emptyRectLeft = null;
    var emptyRectBottom = null;
    var inEmptyRect = false;
    var binHeight = 0;
    // Lay out the sprites in a scanline fashion.
    // TODO: This is a really primitive algorithm and could be optimized.
    for (var i = 0; i < sprites.length; ++i) {
        if (sprites[i].missing) {
            console.log('sprite missing: ' + sprites[i].filename)
        } else {
            var filepath = sprites[i].bakeableFilepath;
            if (x + sprites[i].width + borderWidth * 2 > binWidth) {
                x = 0;
                y = nextRowY;
                if (emptyRectTop !== null) {
                    if (sprites[i].width < binWidth - emptyRectLeft && y + sprites[i].height <= emptyRectBottom) {
                        inEmptyRect = true;
                        x = emptyRectLeft;
                    } else {
                        x = 0;
                        y = emptyRectBottom;
                        inEmptyRect = false;
                        emptyRectTop = null;
                        emptyRectLeft = null;
                        emptyRectBottom = null;
                    }
                }
                nextRowY = y + sprites[i].height + borderWidth * 2;
                binHeight = Math.max(binHeight, nextRowY);
            }
            info['imgInfo'][filepath] = {
                'x': x + borderWidth,
                'y': y + borderWidth,
                'width': sprites[i].width,
                'height': sprites[i].height
            };
            if (y + sprites[i].height * 2 < nextRowY && !inEmptyRect && emptyRectTop === null) {
                emptyRectTop = y + sprites[i].height;
                emptyRectLeft = x;
                emptyRectBottom = nextRowY;
                nextRowY = emptyRectTop;
            }
            x += sprites[i].width + borderWidth * 2;
        }
    }

    var img = document.createElement('canvas');
    img.width = binWidth;
    img.height = binHeight;
    var ctx = img.getContext('2d');

    for (var filepath in info['imgInfo']) {
        if (info['imgInfo'].hasOwnProperty(filepath)) {
            var fileinfo = info['imgInfo'][filepath];
            var sprite = spritesByPath[filepath];
            ctx.drawImage(sprite.img, fileinfo.x, fileinfo.y);
        }
    }

    return new GJS.SpriteAtlas(new GJS.Sprite(img), JSON.stringify(info));
};

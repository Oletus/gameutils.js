'use strict';

GJS.Sprite.gfxPath = '../examples/assets/gfx/';

describe('Sprite', function() {
    it('maintains a counter of loaded objects', function() {
        var s;
        runs(function() {
            s = new GJS.Sprite('carrot.png');
            expect(GJS.Sprite.loadedFraction()).toBeLessThan(1);
        });
        waitsFor(function() { return s.loaded; });
        runs(function() {
            expect(GJS.Sprite.loadedFraction()).toBe(1);
        });
    });
    it('can be used before it is loaded', function() {
        var s = new GJS.Sprite('carrot.png');
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        s.draw(ctx, 0, 0);
        s.drawRotated(ctx, 0, 0, 0);
        s.drawRotatedNonUniform(ctx, 0, 0, 0, 0, 0);
        expect(s.loaded).toBe(false);
    });
});
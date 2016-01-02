'use strict';

describe('TileMap', function() {
    it('is created', function() {
        var tilemap = new TileMap({width: 2, height: 3});
        expect(tilemap.width).toBe(2);
        expect(tilemap.height).toBe(3);
        expect(tilemap.tiles.length).toBe(tilemap.height);
        expect(tilemap.tiles[0].length).toBe(tilemap.width);
        expect(tilemap.tiles[0][0]).toBe(' ');
        expect(tilemap.tiles[2][1]).toBe(' ');
    });
});

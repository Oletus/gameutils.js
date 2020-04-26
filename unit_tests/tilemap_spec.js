
import { TileMap } from "../src/gjs/tilemap.js";
import { Rect } from "../src/gjs/math/rect.js";

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
    
    describe('groupTilesToRectangles', function() {
        var matchFunc = function(tile) {
            return tile === 1;
        };

        it('groups a single tile into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[0][0] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(0, 1, 0, 1)]);
        });

        it('groups a single tile at end of row into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[0][9] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(9, 10, 0, 1)]);
        });

        it('groups two tiles horizontal adjacently into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[1][0] = 1;
            tileMap.tiles[1][1] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(0, 2, 1, 2)]);
        });

        it('groups two tiles horizontal adjacently at end of row into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[1][8] = 1;
            tileMap.tiles[1][9] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(8, 10, 1, 2)]);
        });

        it('groups a square of tiles spanning multiple rows into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[2][3] = 1;
            tileMap.tiles[2][4] = 1;
            tileMap.tiles[3][3] = 1;
            tileMap.tiles[3][4] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(3, 5, 2, 4)]);
        });

        it('groups a square of tiles spanning multiple rows at end of row into a rectangle', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[8][8] = 1;
            tileMap.tiles[8][9] = 1;
            tileMap.tiles[9][8] = 1;
            tileMap.tiles[9][9] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(8, 10, 8, 10)]);
        });

        it('covers the entire map if required', function() {
            var initTile = function(x, y) { return 1; };
            var tileMap = new TileMap({ width: 10, height: 10, initTile: initTile });
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(0, 10, 0, 10)]);
        });

        it('creates no groups if there are no matching tiles', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([]);
        });

        it('creates two groups for tiles that cannot be grouped perfectly vertically (v1)', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[5][2] = 1;
            tileMap.tiles[5][3] = 1;
            tileMap.tiles[6][2] = 1;
            tileMap.tiles[6][3] = 1;
            tileMap.tiles[7][1] = 1;
            tileMap.tiles[7][2] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(2, 4, 5, 7), new Rect(1, 3, 7, 8)]);
        });

        it('creates two groups for tiles that cannot be grouped perfectly vertically (v2)', function() {
            var tileMap = new TileMap({ width: 10, height: 10 });
            tileMap.tiles[5][3] = 1;
            tileMap.tiles[6][2] = 1;
            tileMap.tiles[6][3] = 1;
            expect(tileMap.groupTilesToRectangles(matchFunc)).toEqual([new Rect(3, 4, 5, 7), new Rect(2, 3, 6, 7)]);
        });
    });
});

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
    
    var TestCollider = function(width) {
        this.x = 0;
        this.y = 0;
        this.width = width;
        this.height = width;
        this.dx = 0;
        this.dy = 0;
    };
    
    TestCollider.prototype.getRect = function() {
        return new Rect(this.x - this.width * 0.5,
                        this.x + this.width * 0.5,
                        this.y - this.height * 0.5,
                        this.y + this.height * 0.5);
    };
    
    TestCollider.prototype.touchGround = function() {
    };
    
    TestCollider.prototype.touchCeiling = function() {
    };

    it('handles collisions between objects', function() {
        var tilemap = new TileMap({width: 4, height: 3});
        var colliders = [];
        var colliderWidth = 0.2;
        colliders.push(new TestCollider(colliderWidth));
        colliders.push(new TestCollider(colliderWidth));

        var origY = 1.0;
        var origX1 = 1.0; 
        var origX2 = origX1 + colliderWidth + 0.0001;

        colliders[0].x = origX1;
        colliders[0].y = origY;

        colliders[1].x = origX2;
        colliders[1].y = origY;
        
        // Move in y direction
        colliders[0].dy = 0.1;
        colliders[1].dy = 0.1;
        
        // Collide with each other in x direction
        colliders[0].dx = 0;
        colliders[1].dx = -0.1;
        
        var deltaTime = 0.01;
        for (var i = 0; i < colliders.length; ++i) {
            tilemap.moveAndCollide(colliders[i], deltaTime, 'x', function() { return false; }, colliders);
            tilemap.moveAndCollide(colliders[i], deltaTime, 'y', function() { return false; }, colliders);
        }
        expect(colliders[0].x).toBeCloseTo(origX1, 4);
        expect(colliders[0].y).toBeCloseTo(origY + colliders[0].dy * deltaTime, 4);
        expect(colliders[1].x).toBeCloseTo(origX1 + colliderWidth, 3);
        expect(colliders[1].y).toBeCloseTo(origY + colliders[1].dy * deltaTime, 4);
    });
});

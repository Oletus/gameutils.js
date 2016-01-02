'use strict';

describe('PlatformingPhysics', function() {
    var testCollider = function(options) {
        var c = new PlatformingCharacter();
        c.init(options);
        if (options.hasOwnProperty('dx')) {
            var dx = options.dx;
            c.decideDx = function() {
                this.dx = dx;
            };
        }
        if (options.hasOwnProperty('dy')) {
            var dy = options.dy;
            c.decideDy = function() {
                this.dy = dy;
            };
        }
        if (options.hasOwnProperty('width')) {
            var width = options.width;
            c.getRect = function() {
                return new Rect(this.x - width * 0.5,
                                this.x + width * 0.5,
                                this.y - width * 0.5,
                                this.y + width * 0.5);        
            };
            c.getLastRect = function() {
                return new Rect(this.lastX - width * 0.5,
                                this.lastX + width * 0.5,
                                this.lastY - width * 0.5,
                                this.lastY + width * 0.5);        
            };
        }
        c._testTouchGroundCounter = 0;
        c._testTouchCeilingCounter = 0;
        c.touchGround = function() {
            c._testTouchGroundCounter++;
        };
        c.touchCeiling = function() {
            c._testTouchCeilingCounter++;
        };
        return c;
    };
    
    var testPlatformingTileMapWithFloor = function() {
        var testTileMapInitParamsWithFloor = {
            width: 4,
            height: 3,
            initTile: PlatformingPhysics.initFromData(
                [
                    '    ',
                    '    ',
                    'xxxx'
                ], false)
        };
        var c = new PlatformingTileMap();
        c.init({
            x: 0,
            y: 0,
            tileMap: new TileMap(testTileMapInitParamsWithFloor)
        });
        return c;
    };
    
    describe('PlatformingCharacter', function() {
        it('initializes', function() {
            var c = new PlatformingCharacter();
            c.init({x: 12, y: 3});
            expect(c.x).toBe(12);
            expect(c.y).toBe(3);
        });

        it('has a default collision rectangle', function() {
            var c = new PlatformingCharacter();
            c.init({x: 12, y: 3});
            var rect = c.getRect();
            expect(rect.left).toBe(11.5);
            expect(rect.right).toBe(12.5);
            expect(rect.top).toBe(2);
            expect(rect.bottom).toBe(4);
        });
    });
    
    describe('PlatformingLevel', function() {
        it('initializes', function() {
            var level = new PlatformingLevel();
            level.init();
            expect(level._objects.length).toEqual(0);
            expect(level._tileMapObjects.length).toEqual(0);
            expect(level._colliders['_all'].length).toEqual(0);
        });
        
        it('updates when empty', function() {
            var level = new PlatformingLevel();
            level.init();
            var deltaTime = 1 / 60;
            level.update(deltaTime);
        });

        it('adds objects to the "_all" collision group', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testCollider(1, 12, 3);
            level.pushObject(c, []);
            expect(level._objects[0]).toBe(c);
            expect(level._colliders['_all'][0]).toBe(c);
        });

        it('adds tilemap objects to the "_all" collision group', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testPlatformingTileMapWithFloor();
            level.pushObject(c, []);
            expect(level._tileMapObjects[0]).toBe(c);
            expect(level._colliders['_all'][0]).toBe(c);
        });

        it('updates when it has one object', function() {
            var level = new PlatformingLevel();
            level.init();
            level.pushObject(testCollider(1, 12, 3), []);
            var deltaTime = 1 / 60;
            level.update(deltaTime);
        });

        it('updates object y in free fall', function() {
            var level = new PlatformingLevel();
            level.init();
            var obj = testCollider({width: 1, x: 12, y: 3, dy: 4});
            level.pushObject(obj, []);
            var deltaTime = 1;
            level.update(deltaTime);
            expect(obj.lastY).toBe(3);
            expect(obj.y).toBe(7);
        });

        it('updates object x in free fall', function() {
            var level = new PlatformingLevel();
            level.init();
            var obj = testCollider({width: 1, x: 12, y: 3, dx: 2});
            level.pushObject(obj, []);
            var deltaTime = 1;
            level.update(deltaTime);
            expect(obj.lastX).toBe(12);
            expect(obj.x).toBe(14);
        });
        
        it('handles a simple collision between two objects', function() {
            var level = new PlatformingLevel();
            level.init();
            
            var colliderWidth = 1.0;
            
            var origY = 1.0;
            var origX1 = 1.0; 
            var origX2 = origX1 + colliderWidth + 0.0001;
            var testDy = 0.1;
            
            var obj1 = testCollider({width: colliderWidth, x: origX1, y: origY, dx: 0, dy: testDy});
            level.pushObject(obj1, []);
            var obj2 = testCollider({width: colliderWidth, x: origX2, y: origY, dx: -0.1, dy: testDy});
            level.pushObject(obj2, []);
            
            var deltaTime = 0.1;
            level.update(deltaTime);
            expect(obj1.x).toBeCloseTo(origX1, 4);
            expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
            expect(obj2.x).toBeCloseTo(origX1 + colliderWidth, 3);
            expect(obj2.y).toBeCloseTo(origY + testDy * deltaTime, 4);
            
        });
        
        it ('handles an downward collision between a moving object and a stationary tilemap', function() {
            var level = new PlatformingLevel();
            level.init();

            var pTileMap = testPlatformingTileMapWithFloor();
            level.pushObject(pTileMap, []);

            // The object starts from inside the tilemap and moves downwards.
            var colliderWidth = 1.0;
            var origY = 1.0;
            var origX1 = 1.0; 
            var testDy = 1.0;
            var obj1 = testCollider({width: colliderWidth, x: origX1, y: origY, dx: 0, dy: testDy});
            level.pushObject(obj1, []);

            // Move way past the edge of the tilemap. All collisions in between should be detected.
            var deltaTime = pTileMap.getRect().height() * 2;
            level.update(deltaTime);
            expect(obj1.x).toBeCloseTo(origX1, 4);
            expect(obj1.y).toBeCloseTo(pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
            expect(obj1._testTouchGroundCounter).toBe(1);
            expect(obj1._testTouchCeilingCounter).toBe(0);
        });
        
        it ('handles an upward collision between a moving object and a stationary tilemap', function() {
            var level = new PlatformingLevel();
            level.init();

            var pTileMap = testPlatformingTileMapWithFloor();
            level.pushObject(pTileMap, []);

            // The object starts from outside the tilemap and moves towards it from below.
            var colliderWidth = 1.0;
            var origY = pTileMap.getRect().height() + 2;
            var origX1 = 1.0; 
            var testDy = -1.0;
            var obj1 = testCollider({width: colliderWidth, x: origX1, y: origY, dx: 0, dy: testDy});
            level.pushObject(obj1, []);
            

            // Move way past the edge of the tilemap. All collisions in between should be detected.
            var deltaTime = pTileMap.getRect().height() * 2;
            level.update(deltaTime);
            expect(obj1.x).toBeCloseTo(origX1, 4);
            expect(obj1.y).toBeCloseTo(pTileMap.getRect().height() + colliderWidth * 0.5, 3);
            expect(obj1._testTouchGroundCounter).toBe(0);
            expect(obj1._testTouchCeilingCounter).toBe(1);
        });
    });
});

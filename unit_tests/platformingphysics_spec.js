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
    
    var testPlatformingTileMap = function(options, initParams) {
        var c = new PlatformingTileMap();
        var x = 0;
        if (options.hasOwnProperty('x')) {
            x = options.x;
        }
        var y = 0;
        if (options.hasOwnProperty('y')) {
            y = options.y;
        }
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
        c.init({
            x: x,
            y: y,
            tileMap: new TileMap(initParams)
        });
        return c;
    };
    
    
    var testPlatformingTileMapWithFloor = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: PlatformingPhysics.initFromData(
                [
                    '    ',
                    '    ',
                    'xxxx'
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };
    
    var testPlatformingTileMapWithWall = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: PlatformingPhysics.initFromData(
                [
                    '  x ',
                    '  x ',
                    '  x '
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };
    
    var testPlatformingTileMapWithDiagonalWall = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: PlatformingPhysics.initFromData(
                [
                    '   x',
                    ' xx ',
                    'x   '
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
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
    
    describe('PlatformingTileMap', function() {
        it('initializes', function() {
            var c = testPlatformingTileMapWithFloor({x: 12, y: 34});
            expect(c.x).toBe(12);
            expect(c.y).toBe(34);
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
            var c = testPlatformingTileMapWithFloor({});
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
        
        it('updates tilemap x and y when it is moving', function() {
            var level = new PlatformingLevel();
            level.init();
            var obj = testPlatformingTileMapWithFloor({x: 12, y: 34, dx: 2, dy: 5});
            level.pushObject(obj, []);
            var deltaTime = 1;
            level.update(deltaTime);
            expect(obj.lastX).toBe(12);
            expect(obj.x).toBe(14);
            expect(obj.lastY).toBe(34);
            expect(obj.y).toBe(39);
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
        
        describe('stationary tilemap', function() {
            it ('handles a vertical collision with a downwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({});
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
            
            it ('handles a vertical collision with an upwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getRect().height() + 2;
                var origX = 1.0; 
                var testDy = -1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);
                

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().height() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.getRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });
            
            it ('an object does not vertically collide with a tilemap which has been moved', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({x: 10});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getRect().height() + 2;
                var origX = 1.0; 
                var testDy = -1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap.
                var deltaTime = pTileMap.getRect().height() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(origY + deltaTime * testDy, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a horizontal collision with an object moving to the right', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves to the right.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 1.0; 
                var testDx = 1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a horizontal collision with an object moving to the left', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getRect().width() + 2; 
                var testDx = -1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it ('handles a horizontal collision with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left and downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getRect().width() + 2; 
                var testDx = -1.0;
                var testDy = 0.1;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles both x and y collisions on the same frame with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards and to the right.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x + 0.0; 
                var testDx = 1.0;
                var testDy = 0.5;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
        }); // stationary tilemap
        
        describe('moving tilemap', function() {
            it ('handles a vertical collision with a downwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.01, dy: -1});
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
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a vertical collision with an upwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.01, dy: 1});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getRect().height() + 2;
                var origX = 1.0; 
                var testDy = -1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);
                

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().height() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });
            
            it ('handles a horizontal collision with an object moving to the right', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: -1, dy: 0.01});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves to the right.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 1.0; 
                var testDx = 1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a horizontal collision with an object moving to the left', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: 1, dy: 0.01});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getRect().width() + 2; 
                var testDx = -1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a horizontal collision when both the tilemap and the object are moving to the left', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({x: 8.0, dx: -20.0, dy: 0.0});
                level.pushObject(pTileMap, []);

                // The object starts from the left side of the tilemap and moves to the left. The tilemap moves faster.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 5.0; 
                var testDx = -5.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles a horizontal collision when both the tilemap and the object are moving to the right', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({x: -8.0, dx: 20.0, dy: 0.0});
                level.pushObject(pTileMap, []);

                // The object starts from the right side of the tilemap and moves to the right. The tilemap moves faster.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 2.0;
                var testDx = 2.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it ('handles a horizontal collision with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: 1, dy: 0.01});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left and downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getRect().width() + 2; 
                var testDx = -1.0;
                var testDy = 0.1;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles both x and y collisions on the same frame with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0, dx: -1, dy: -1});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards and to the right.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x + 0.0;
                var testDx = 1.0;
                var testDy = 0.5;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it ('handles both x and y collisions on the same frame with an object approaching diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0, dx: -1, dy: -1});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves downwards and to the right.
                // Object is outside the tilemap in the beginning only in the x direction.
                // If it was above or below the object, since x direction gets fully processed first then the
                // collision would not happen. This is by design - the tilemaps are not expected to move so fast that
                // this would create noticeable glitches.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x - 1.0;
                var testDx = 1.0;
                var testDy = 0.5;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = pTileMap.getRect().width() * 2;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('a horizontally moving tilemap catches a vertically moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({x: 12.0, dx: -12.0});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves downwards. The tilemap moves in from the right.
                var colliderWidth = 1.0;
                var origY = 0.0;
                var origX = 1.0;
                var testDx = 0.0;
                var testDy = 10.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it('a vertically moving tilemap catches a horizontally moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({y: 12.0, dy: -24.0});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves downwards. The tilemap moves in from the right.
                var colliderWidth = 1.0;
                var origY = 0.0;
                var origX = -10.0;
                var testDx = 10.0;
                var testDy = 0.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX + testDx * deltaTime, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
        }); // moving tilemap
    }); // PlatformingLevel
});

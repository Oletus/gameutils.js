'use strict';

describe('PlatformingPhysics', function() {
    var testCollider = function(options) {
        var c = new GJS.PlatformingObject();
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
            c.getPositionedCollisionRect = function(x, y) {
                return new Rect(x - width * 0.5,
                                x + width * 0.5,
                                y - width * 0.5,
                                y + width * 0.5);
            };
        }
        c._testTouchGroundCounter = 0;
        c._testTouchCeilingCounter = 0;
        c.touchGround = function() {
            c._testTouchGroundCounter++;
            return false;
        };
        c.touchCeiling = function() {
            c._testTouchCeilingCounter++;
            return false;
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
        if (options.hasOwnProperty('collisionGroup')) {
            c.collisionGroup = options.collisionGroup;
        }
        if (options.hasOwnProperty('tilesAffectMovingTilemaps')) {
            c.tilesAffectMovingTilemaps = options.tilesAffectMovingTilemaps;
        }
        return c;
    };
    
    
    var testPlatformingTileMapWithFloor = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: GJS.PlatformingPhysics.initFromData(
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
            initTile: GJS.PlatformingPhysics.initFromData(
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
            initTile: GJS.PlatformingPhysics.initFromData(
                [
                    '   x',
                    ' xx ',
                    'x   '
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };

    var testPlatformingTileMapWithSlopeRight1 = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: GJS.PlatformingPhysics.initFromData(
                [
                    '   /',
                    '  /x',
                    'xxxx'
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };

    var testPlatformingTileMapWithSlopeLeft1 = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: GJS.PlatformingPhysics.initFromData(
                [
                    '.   ',
                    'x.  ',
                    'xxxx'
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };
    
    var testPlatformingTileMapWithSlopeFloor = function(options) {
        var initParams = {
            width: 4,
            height: 3,
            initTile: GJS.PlatformingPhysics.initFromData(
                [
                    '    ',
                    '    ',
                    ' /. '
                ], false)
        };
        return testPlatformingTileMap(options, initParams);
    };

    describe('GJS.PlatformingObject', function() {
        it('initializes', function() {
            var c = new GJS.PlatformingObject();
            c.init({x: 12, y: 3});
            expect(c.x).toBe(12);
            expect(c.y).toBe(3);
        });

        it('has a default collision rectangle', function() {
            var c = new GJS.PlatformingObject();
            c.init({x: 12, y: 3});
            var rect = c.getCollisionRect();
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
            var c = testCollider({x: 1, y: 12});
            level.pushObject(c, []);
            expect(level._objects[0]).toBe(c);
            expect(level._colliders['_all'][0]).toBe(c);
        });

        it('adds tilemap objects to the "_all" collision group', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testPlatformingTileMapWithFloor({});
            level.pushObject(c, []);
            expect(level._objects[0]).toBe(c);
            expect(level._colliders['_all'][0]).toBe(c);
        });

        it('adds objects to the requested collision groups', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testCollider({x: 1, y: 12});
            level.pushObject(c, ['foo', 'bar']);
            expect(level._objects[0]).toBe(c);
            expect(level._colliders['_all'][0]).toBe(c);
            expect(level._colliders['foo'][0]).toBe(c);
            expect(level._colliders['bar'][0]).toBe(c);
        });
        
        it('removes an object', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testPlatformingTileMapWithFloor({});
            level.pushObject(c, ['foo']);
            level.removeObject(c);
            expect(level._objects.length).toBe(0);
            expect(level._colliders['_all'].length).toBe(0);
            expect(level._colliders['foo'].length).toBe(0);
        });

        it('updates when it has one object', function() {
            var level = new PlatformingLevel();
            level.init();
            level.pushObject(testCollider({x: 1, y: 12}), []);
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
        
        it('uses collision groups to determine objects that are candidates for collision', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testCollider({x: 1, y: 12});
            level.pushObject(c, ['foo', 'bar']);
            var c2 = testCollider({x: 1, y: 12});
            level.pushObject(c2, ['foo']);
            var c3 = testCollider({x: 3, y: 12, collisionGroup: 'foo'});
            c3.moveX = function(deltaTime, colliders) {
                expect(deltaTime).toBe(1 / 2);
                expect(colliders.length).toBe(2);
                expect(colliders[0]).toBe(c);
                expect(colliders[1]).toBe(c2);
            };
            level.pushObject(c3, ['bar']);
            level.update(1 / 2);
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
        
        it('handles a high-velocity collision between two objects', function() {
            var level = new PlatformingLevel();
            level.init();
            
            var colliderWidth = 1.0;
            
            var origY = 1.0;
            var origX1 = 1.0; 
            var origX2 = origX1 + colliderWidth + 0.0001;
            var testDy = 0.1;
            
            // Both objects are moving fast against each other.
            var obj1 = testCollider({width: colliderWidth, x: origX1, y: origY, dx: 50.0, dy: testDy});
            level.pushObject(obj1, []);
            var obj2 = testCollider({width: colliderWidth, x: origX2, y: origY, dx: -100.0, dy: testDy});
            level.pushObject(obj2, []);
            
            var deltaTime = 0.1;
            level.update(deltaTime);
            expect(obj1.x).toBeCloseTo(origX1, 2);
            expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
            expect(obj2.x).toBeCloseTo(obj1.x + colliderWidth, 3);
            expect(obj2.y).toBeCloseTo(origY + testDy * deltaTime, 4);
        });
        
        describe('stationary tilemap', function() {
            it('handles a vertical collision with a downwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX1 = 1.0; 
                var testDy = pTileMap.getCollisionRect().height() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX1, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX1, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a vertical collision with an upwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getCollisionRect().height() + 2;
                var origX = 1.0; 
                var testDy = -pTileMap.getCollisionRect().height() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);
                

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.getCollisionRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });
            
            it('an object does not vertically collide with a tilemap which has been moved', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({x: 10});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getCollisionRect().height() + 2;
                var origX = 1.0; 
                var testDy = -pTileMap.getCollisionRect().height() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(origY + deltaTime * testDy, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a horizontal collision with an object moving to the right', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves to the right.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 1.0; 
                var testDx = pTileMap.getCollisionRect().width() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getCollisionRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a horizontal collision with an object moving to the left', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getCollisionRect().width() + 2; 
                var testDx = -pTileMap.getCollisionRect().width() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getCollisionRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it('handles a horizontal collision with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left and downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getCollisionRect().width() + 2; 
                var testDx = -pTileMap.getCollisionRect().width() * 2;
                var testDy = 1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.getCollisionRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles both x and y collisions on the same frame with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards and to the right.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x + 0.0; 
                var testDx = pTileMap.getCollisionRect().width();
                var testDy = pTileMap.getCollisionRect().width();
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('affects the movement of a moving tilemap inside', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({tilesAffectMovingTilemaps: true});
                level.pushObject(pTileMap, []);

                var movingTileMap = testPlatformingTileMapWithFloor({collisionGroup: '_all', y: -5, dy: 15});
                level.pushObject(movingTileMap, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(movingTileMap.x).toBeCloseTo(0, 4);
                expect(movingTileMap.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - movingTileMap.getCollisionRect().height(), 3);
            });
            
            it('does not take the tilemap into account when evaluating collision with a moving tilemap and tilesAffectMovingTilemaps is false', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({tilesAffectMovingTilemaps: false});
                level.pushObject(pTileMap, []);

                var movingTileMap = testPlatformingTileMapWithFloor({collisionGroup: '_all', y: -5, dy: 15});
                level.pushObject(movingTileMap, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(movingTileMap.x).toBeCloseTo(0, 4);
                expect(movingTileMap.y).toBeCloseTo(pTileMap.y - movingTileMap.getCollisionRect().height(), 3);
            });
        }); // stationary tilemap
        
        describe('moving tilemap', function() {
            it('handles a vertical collision with a downwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.1, dy: -1});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 1.0; 
                var testDy = pTileMap.getCollisionRect().height() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a vertical collision with an upwards moving object', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.1, dy: 1});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves towards it from below.
                var colliderWidth = 1.0;
                var origY = pTileMap.getCollisionRect().height() + 2;
                var origX = 1.0; 
                var testDy = -pTileMap.getCollisionRect().height() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);
                

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });

            it('handles a vertical collision when both the tilemap and the object are moving downwards', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.0, dy: 20.0});
                level.pushObject(pTileMap, []);

                // The object starts from below the tilemap and moves downwards. The tilemap moves faster.
                var colliderWidth = 1.0;
                var origY = 6.0;
                var origX = 1.0; 
                var testDy = 2.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });
            
            it('handles a vertical collision when both the tilemap and the object are moving upwards', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithFloor({dx: 0.0, y: 10.0, dy: -20.0});
                level.pushObject(pTileMap, []);

                // The object starts from above the tilemap and moves upwards. The tilemap moves faster.
                var colliderWidth = 1.0;
                var origY = 6.0;
                var origX = 1.0;
                var testDy = -2.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it('handles a horizontal collision with an object moving to the right', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: -5, dy: 0.1});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves to the right.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = 1.0; 
                var testDx = pTileMap.getCollisionRect().width() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getCollisionRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a horizontal collision with an object moving to the left', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: 4, dy: 0.1});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getCollisionRect().width() + 2; 
                var testDx = -pTileMap.getCollisionRect().width() * 2;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getCollisionRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a horizontal collision when both the tilemap and the object are moving to the left', function() {
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
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getCollisionRect().width() - 2 - colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles a horizontal collision when both the tilemap and the object are moving to the right', function() {
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
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getCollisionRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            it('handles a horizontal collision with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                var pTileMap = testPlatformingTileMapWithWall({dx: 4, dy: 0.1});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves to the left and downwards.
                var colliderWidth = 1.0;
                var origY = 1.0;
                var origX = pTileMap.getCollisionRect().width() + 2; 
                var testDx = -pTileMap.getCollisionRect().width() * 2;
                var testDy = 1.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + pTileMap.getCollisionRect().width() - 1 + colliderWidth * 0.5, 4);
                expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles both x and y collisions on the same frame with an object moving diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0, dx: -5, dy: -5});
                level.pushObject(pTileMap, []);

                // The object starts from inside the tilemap and moves downwards and to the right.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x + 0.0;
                var testDx = pTileMap.getCollisionRect().width() * 2;
                var testDy = pTileMap.getCollisionRect().width();
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            
            it('handles both x and y collisions on the same frame with an object approaching diagonally', function() {
                var level = new PlatformingLevel();
                level.init();

                // A bit of a twist: the tilemap origin is not positioned in the world origin.
                var pTileMap = testPlatformingTileMapWithDiagonalWall({x: 12.0, y: 34.0, dx: -5, dy: -5});
                level.pushObject(pTileMap, []);

                // The object starts from outside the tilemap and moves downwards and to the right.
                // Object is outside the tilemap in the beginning only in the x direction.
                // If it was above or below the object, since x direction gets fully processed first then the
                // collision would not happen. This is by design - the tilemaps are not expected to move so fast that
                // this would create noticeable glitches.
                var colliderWidth = 1.0;
                var origY = pTileMap.y + 1.0;
                var origX = pTileMap.x - 1.0;
                var testDx = pTileMap.getCollisionRect().width() * 2;
                var testDy = pTileMap.getCollisionRect().width();
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                level.pushObject(obj1, []);

                // Move way past the edge of the tilemap. All collisions in between should be detected.
                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
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
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
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
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
        }); // moving tilemap
        
        describe('slopes', function() {
            it('handles an object falling on a slope that rises to the right', function() {
                var level = new PlatformingLevel();
                level.init();
                var tileMapParams = {};
                var pTileMap = testPlatformingTileMapWithSlopeRight1(tileMapParams);
                level.pushObject(pTileMap, []);
                
                var colliderWidth = 1.0;
                var origY = -1.0;
                var testDy = 4.0;
                var origX = 3.1;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 2.6 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            it('handles an object falling on a slope that rises to the left', function() {
                var level = new PlatformingLevel();
                level.init();
                var tileMapParams = {};
                var pTileMap = testPlatformingTileMapWithSlopeLeft1(tileMapParams);
                level.pushObject(pTileMap, []);
                
                var colliderWidth = 1.0;
                var origY = -1.0;
                var testDy = 3.0;
                var origX = 1.1;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - 2.4 - colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(1);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            it('handles an object colliding a floor slope from below', function() {
                var level = new PlatformingLevel();
                level.init();
                var tileMapParams = {};
                var pTileMap = testPlatformingTileMapWithSlopeFloor(tileMapParams);
                level.pushObject(pTileMap, []);
                
                var colliderWidth = 1.0;
                var origY = 5.0;
                var testDy = -6.0;
                var origX = 2.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: 0, dy: testDy});
                level.pushObject(obj1, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(origX, 4);
                expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() + colliderWidth * 0.5, 3);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(1);
            });
            it('handles an object colliding a floor slope from the left', function() {
                var level = new PlatformingLevel();
                level.init();
                var tileMapParams = {};
                var pTileMap = testPlatformingTileMapWithSlopeFloor(tileMapParams);
                level.pushObject(pTileMap, []);
                
                var colliderWidth = 1.0;
                var origX = -1.0;
                var origY = pTileMap.getCollisionRect().height();
                var testDx = 5.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 1 - colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });
            it('handles an object colliding a floor slope from the right', function() {
                var level = new PlatformingLevel();
                level.init();
                var tileMapParams = {};
                var pTileMap = testPlatformingTileMapWithSlopeFloor(tileMapParams);
                level.pushObject(pTileMap, []);
                
                var colliderWidth = 1.0;
                var origX = pTileMap.getCollisionRect().width() + 1.0;
                var origY = pTileMap.getCollisionRect().height();
                var testDx = -5.0;
                var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: 0});
                level.pushObject(obj1, []);

                var deltaTime = 1.0;
                level.update(deltaTime);
                expect(obj1.x).toBeCloseTo(pTileMap.x + 3 + colliderWidth * 0.5, 3);
                expect(obj1.y).toBeCloseTo(origY, 4);
                expect(obj1._testTouchGroundCounter).toBe(0);
                expect(obj1._testTouchCeilingCounter).toBe(0);
            });

            for (var i = 0; i < 16; ++i) {
                (function(moveTilemapHorizontally, moveTilemapVertically, movedTiles) {
                    var movingStr = (moveTilemapHorizontally ? ' horizontally moving' : '');
                    movingStr += (moveTilemapVertically ? ' vertically moving' : '');
                    if (movedTiles < 3) {
                        it('handles an object moving to the right against a' + movingStr + ' upward slope for ' + movedTiles + ' tiles', function() {
                            var level = new PlatformingLevel();
                            level.init();

                            var tileMapParams = {}
                            var testDx = 1.1 + movedTiles;
                            if (moveTilemapHorizontally) {
                                tileMapParams.dx = -1.0;
                                testDx -= 1.0;
                            }
                            if (moveTilemapVertically) {
                                tileMapParams.dy = -1.5;
                            }
                            var pTileMap = testPlatformingTileMapWithSlopeRight1(tileMapParams);
                            level.pushObject(pTileMap, []);

                            // The object starts from inside the tilemap and moves downwards and to the right.
                            var colliderWidth = 1.0;
                            var origY = pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5 - 0.01;
                            var origX = 0.0;
                            var testDy = 1.0;
                            var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                            level.pushObject(obj1, []);

                            // Move against the slope.
                            var deltaTime = 1.0;
                            level.update(deltaTime);
                            expect(obj1.x).toBeCloseTo(origX + deltaTime * testDx, 4);
                            expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - movedTiles - 0.6 - colliderWidth * 0.5, 3);
                            expect(obj1._testTouchGroundCounter).toBe(1);
                            expect(obj1._testTouchCeilingCounter).toBe(0);
                        });
                        
                        it('handles an object moving to the left against a' + movingStr + ' upward slope for ' + movedTiles + ' tiles', function() {
                            var level = new PlatformingLevel();
                            level.init();

                            var tileMapParams = {}
                            var testDx = -1.1 - movedTiles;
                            if (moveTilemapHorizontally) {
                                tileMapParams.dx = 1.0;
                                testDx += 1.0;
                            }
                            if (moveTilemapVertically) {
                                tileMapParams.dy = -1.5;
                            }
                            var pTileMap = testPlatformingTileMapWithSlopeLeft1(tileMapParams);
                            level.pushObject(pTileMap, []);

                            // The object starts from inside the tilemap and moves downwards and to the right.
                            var colliderWidth = 1.0;
                            var origY = pTileMap.getCollisionRect().height() - 1 - colliderWidth * 0.5 - 0.01;
                            var origX = pTileMap.getCollisionRect().width();
                            var testDy = 1.0;
                            var obj1 = testCollider({width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy});
                            level.pushObject(obj1, []);

                            // Move against the slope.
                            var deltaTime = 1.0;
                            level.update(deltaTime);
                            expect(obj1.x).toBeCloseTo(origX + deltaTime * testDx, 4);
                            expect(obj1.y).toBeCloseTo(pTileMap.y + pTileMap.getCollisionRect().height() - movedTiles - 0.6 - colliderWidth * 0.5, 3);
                            expect(obj1._testTouchGroundCounter).toBe(1);
                            expect(obj1._testTouchCeilingCounter).toBe(0);
                        });
                    } // movedTiles < 3

                    it('handles an object moving to the right against a' + movingStr + ' downward slope for ' + movedTiles + ' tiles', function() {
                        var level = new PlatformingLevel();
                        level.init();

                        var tileMapParams = {}
                        var testDx = movedTiles;
                        if (moveTilemapHorizontally) {
                            tileMapParams.dx = -1.0;
                            testDx -= 1.0;
                        }
                        if (moveTilemapVertically) {
                            tileMapParams.dy = -1.5;
                        }
                        var pTileMap = testPlatformingTileMapWithSlopeLeft1(tileMapParams);
                        level.pushObject(pTileMap, []);

                        // The object starts from the edge of the tilemap and moves downwards and to the right.
                        var colliderWidth = 1.0;
                        var origY = -colliderWidth * 0.5;
                        var origX = 0.1;
                        var testDy = 0.1;
                        var obj1 = testCollider({
                            width: colliderWidth, x: origX, y: origY, dx: testDx, dy: testDy,
                            maxStickToGroundDistance: 3
                        });
                        obj1.onGround = true;
                        obj1.groundPlatform = pTileMap;
                        level.pushObject(obj1, []);

                        // Move to the middle of the tilemap.
                        var deltaTime = 1.0;
                        level.update(deltaTime);
                        expect(obj1.x).toBeCloseTo(origX + deltaTime * testDx, 4);
                        expect(obj1.y).toBeCloseTo(pTileMap.y + Math.min((movedTiles - 0.4), 2) - colliderWidth * 0.5, 3);
                        expect(obj1._testTouchGroundCounter).toBe(1);
                        expect(obj1._testTouchCeilingCounter).toBe(0);
                    });
                })((i & 8) != 0, (i & 4) != 0, (i & 3) + 1);
            }
        }); // slopes
    }); // PlatformingLevel
});

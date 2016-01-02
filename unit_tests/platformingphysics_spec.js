'use strict';

describe('PlatformingPhysics', function() {
    var testCollider = function(width, x, y) {
        var c = new PlatformingCharacter();
        c.init({x: x, y: y});
        c.getRect = function() {
            return new Rect(this.x - width * 0.5,
                            this.x + width * 0.5,
                            this.y - width * 0.5,
                            this.y + width * 0.5);        
        }
        return c;
    };
    
    var testInitParams = {
        width: 4,
        height: 3,
        initTile: PlatformingPhysics.initFromData(['    ', '    ', '    '], false)
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
            expect(level._colliders['all'].length).toEqual(0);
        });
        
        it('updates when empty', function() {
            var level = new PlatformingLevel();
            level.init();
            var deltaTime = 1 / 60;
            level.update(deltaTime);
        });

        it('adds objects to the "all" collision group', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testCollider(1, 12, 3);
            level.pushObject(c, []);
            expect(level._objects[0]).toBe(c);
            expect(level._colliders['all'][0]).toBe(c);
        });

        it('adds tilemap objects to the "all" collision group', function() {
            var level = new PlatformingLevel();
            level.init();
            var c = testCollider(1, 12, 3);
            level.pushTileMapObject(c, []);
            expect(level._tileMapObjects[0]).toBe(c);
            expect(level._colliders['all'][0]).toBe(c);
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
            var obj = testCollider(1, 12, 3);
            level.pushObject(obj, []);
            var deltaTime = 1;
            level.update(deltaTime);
            expect(obj.lastY).toBe(3);
            expect(obj.y).toBe(4);
        });

        it('updates object x in free fall', function() {
            var level = new PlatformingLevel();
            level.init();
            var obj = testCollider(1, 12, 3);
            obj.decideDx = function() {
                this.dx = 2.0;
            };
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
            
            var obj1 = testCollider(colliderWidth, origX1, origY);
            obj1.decideDx = function() {
                this.dx = 0;
            };
            obj1.decideDy = function() {
                this.dy = testDy;
            };
            level.pushObject(obj1, []);

            var obj2 = testCollider(colliderWidth, origX2, origY);
            obj2.decideDx = function() {
                this.dx = -0.1;
            };
            obj2.decideDy = function() {
                this.dy = testDy;
            };
            level.pushObject(obj2, []);
            
            var deltaTime = 0.01;
            level.update(deltaTime);
            expect(obj1.x).toBeCloseTo(origX1, 4);
            expect(obj1.y).toBeCloseTo(origY + testDy * deltaTime, 4);
            expect(obj2.x).toBeCloseTo(origX1 + colliderWidth, 3);
            expect(obj2.y).toBeCloseTo(origY + testDy * deltaTime, 4);
            
        });
    });
});

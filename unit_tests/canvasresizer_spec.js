'use strict';

var MockTouchEvent = function(options) {
    var defaults = {
        type: 'touchstart',
        touches: [],
        targetTouches: [],
        changedTouches: []
    };
    objectUtil.initWithDefaults(this, defaults, options);
    for (var i = 0; i < this.changedTouches.length; ++i) {
        if (this.touches.indexOf(this.changedTouches[i]) === -1) {
            this.touches.push(this.changedTouches[i]);
        }
    }
};

MockTouchEvent.prototype.preventDefault = function() {};

var MockTouch = function(options) {
    var defaults = {
        identifier: 'a',
        clientX: 25,
        clientY: 25
    };
    objectUtil.initWithDefaults(this, defaults, options);
};

describe('CanvasResizer', function() {
    
    var createTestResizer = function() {
        var parentElement = {
            style: {},
            appendChild: function(child) {},
            removeChild: function(child) {},
            insertBefore: function(inserted, before) {},
            clientWidth: 16,
            clientHeight: 9
        };
        var resizer = new GJS.CanvasResizer({
            parentElement: parentElement
        });
        resizer._getCanvasBoundingClientRect = function() {
            return {
                left: 20,
                top: 20,
                width: 16,
                height: 9
            };
        };
        return resizer;
    };

    var canBubble = true;
    var cancelable = true;
    var detail = 1;
    var ctrlKey = false;
    var altKey = false;
    var shiftKey = false;
    var metaKey = false;
    
    it('tracks touch positions', function() {
        var testCallback = {
            pressCalled: [],
            releaseCalled: [],
            moveCalled: [],
            canvasPress: function(e) {
                this.pressCalled.push(e);
            },
            canvasRelease: function(e) {
                this.releaseCalled.push(e);
            },
            canvasMove: function(e) {
                this.moveCalled.push(e);
            }
        };
        
        var e;
        var resizer = createTestResizer();
        var listener = resizer.createPointerEventListener(testCallback);
        
        var touchA = new MockTouch({
            identifier: 'a'
        });
        e = new MockTouchEvent({
            type: 'touchstart',
            changedTouches: [touchA]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(1);
        expect(testCallback.releaseCalled.length).toBe(0);
        expect(testCallback.moveCalled.length).toBe(0);
        expect(testCallback.pressCalled[0].current.x).toBe(5.5);
        expect(testCallback.pressCalled[0].current.y).toBe(5.5);
        expect(testCallback.pressCalled[0].index).toBe(1);
        
        var touchB = new MockTouch({
            identifier: 'b',
            clientY: 32
        });
        e = new MockTouchEvent({
            type: 'touchstart',
            touches: [touchA, touchB],
            changedTouches: [touchB]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(2);
        expect(testCallback.releaseCalled.length).toBe(0);
        expect(testCallback.moveCalled.length).toBe(0);
        expect(testCallback.pressCalled[1].current.x).toBe(5.5);
        expect(testCallback.pressCalled[1].current.y).toBe(12.5);
        expect(testCallback.pressCalled[1].index).toBe(2);
        
        touchB.clientY = 30;
        e = new MockTouchEvent({
            type: 'touchmove',
            touches: [touchA, touchB],
            changedTouches: [touchB]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(2);
        expect(testCallback.releaseCalled.length).toBe(0);
        expect(testCallback.moveCalled.length).toBe(1);
        expect(testCallback.moveCalled[0].current.x).toBe(5.5);
        expect(testCallback.moveCalled[0].current.y).toBe(10.5);
        expect(testCallback.moveCalled[0].index).toBe(2);
        
        touchA.clientX = undefined;
        touchA.clientY = undefined;
        e = new MockTouchEvent({
            type: 'touchend',
            touches: [touchB],
            changedTouches: [touchA]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(2);
        expect(testCallback.releaseCalled.length).toBe(1);
        expect(testCallback.moveCalled.length).toBe(1);
        expect(testCallback.releaseCalled[0].current.x).toBe(5.5);
        expect(testCallback.releaseCalled[0].current.y).toBe(5.5);
        expect(testCallback.releaseCalled[0].index).toBe(1);
        
        // Test that a touch event with a new identifier takes over the index previously used by 'a'
        var touchC = new MockTouch({
            identifier: 'c',
            clientX: 30
        });
        e = new MockTouchEvent({
            type: 'touchstart',
            touches: [touchB, touchC],
            changedTouches: [touchC]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(3);
        expect(testCallback.releaseCalled.length).toBe(1);
        expect(testCallback.moveCalled.length).toBe(1);
        expect(testCallback.pressCalled[2].current.x).toBe(10.5);
        expect(testCallback.pressCalled[2].current.y).toBe(5.5);
        expect(testCallback.pressCalled[2].index).toBe(1);
        
        // Test that 'a' gets a different index now that 'c' has taken over its old index.
        touchA.clientX = 33;
        touchA.clientY = 33;
        e = new MockTouchEvent({
            type: 'touchstart',
            touches: [touchB, touchC, touchA],
            changedTouches: [touchA]
        });
        listener(e);
        expect(testCallback.pressCalled.length).toBe(4);
        expect(testCallback.releaseCalled.length).toBe(1);
        expect(testCallback.moveCalled.length).toBe(1);
        expect(testCallback.pressCalled[3].current.x).toBe(13.5);
        expect(testCallback.pressCalled[3].current.y).toBe(13.5);
        expect(testCallback.pressCalled[3].index).toBe(3);
    });
});

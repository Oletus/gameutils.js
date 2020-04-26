
import { Vec2 } from "../src/gjs/util2d.js";
import { CanvasUI, CanvasUIElement } from "../src/gjs/canvasui.js";

describe('CanvasUI', function() {
    var createCursor = function(currentPosition, index) {
        if (index === undefined) {
            index = 0;
        }
        return {
            currentPosition: currentPosition,
            index: index
        };
    };
    
    it('Tracks multiple cursors', function() {
        var ui = new CanvasUI({});
        
        var element1Clicks = [];
        var element2Clicks = [];
        
        var element1 = new CanvasUIElement({
            centerX: 100,
            centerY: 100,
            width: 10,
            height: 10,
            clickCallback: function() {
                element1Clicks.push({});
            }
        });
        var element2 = new CanvasUIElement({
            centerX: 100,
            centerY: 200,
            width: 10,
            height: 10,
            clickCallback: function() {
                element2Clicks.push({});
            }
        });
        
        ui.canvasPress(createCursor(new Vec2(100, 100), 0));
        ui.canvasPress(createCursor(new Vec2(99, 201), 1));
        expect(element1Clicks.length == 0);
        ui.canvasRelease(createCursor(new Vec2(100, 100), 0));
        expect(element1Clicks.length == 1);
        expect(element2Clicks.length == 0);
        ui.canvasRelease(createCursor(new Vec2(99, 201), 1));
        expect(element1Clicks.length == 1);
        expect(element2Clicks.length == 1);
    });
});

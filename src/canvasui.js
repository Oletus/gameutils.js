'use strict';

// Requires util2d.js

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * Class for rendering and interacting with UI elements on a canvas.
 * @constructor
 */
GJS.CanvasUI = function(options) {
    this.clear();
};

/**
 * Update UI element state and animations.
 * @param {number} deltaTime Time passed since the last update in seconds.
 */
GJS.CanvasUI.prototype.update = function(deltaTime) {
    for (var i = 0; i < this.uiElements.length; ++i) {
        this.uiElements[i].update(deltaTime);
    }
};

/**
 * Render the UI.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context to use.
 */
GJS.CanvasUI.prototype.render = function(ctx) {
    var activeCursors = [];
    for (var i = 0; i < this.cursors.length; ++i) {
        if (this.cursors[i].active) {
            activeCursors.push(this.cursors[i]);
        }
    }
    var draggedElements = [];
    var i;
    for (i = 0; i < this.uiElements.length; ++i) {
        if (!this.uiElements[i].dragged) {
            this.uiElements[i].render(ctx, activeCursors);
        } else {
            draggedElements.push(this.uiElements[i]);
        }
    }
    for (i = 0; i < draggedElements.length; ++i) {
        draggedElements[i].render(ctx, activeCursors);
    }
};

/**
 * Clear the UI from all elements.
 */
GJS.CanvasUI.prototype.clear = function() {
    this.uiElements = [];
    this.cursors = [];
};

GJS.CanvasUI.prototype.addElement = function(element) {
    this.uiElements.push(element);
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   current: an x,y vector indicating the last known position of the pointer.
 *   isDown: a boolean indicating whether the pointer is down.
 *   index: numerical index identifying the pointer.
 */
GJS.CanvasUI.prototype.canvasPress = function(cursor) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new GJS.CanvasUICursor(this));
    }
    this.cursors[cursor.index].active = true;
    this.cursors[cursor.index].press(cursor.current);
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   index: numerical index identifying the pointer.
 * @param {boolean} makeInactive Set to true to make the cursor inactive at the same time. Useful for touch cursors.
 */
GJS.CanvasUI.prototype.canvasRelease = function(cursor, makeInactive) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new GJS.CanvasUICursor(this));
    }
    this.cursors[cursor.index].release();
    this.cursors[cursor.index].active = !makeInactive;
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   current: an x,y vector indicating the last known position of the pointer.
 *   isDown: a boolean indicating whether the pointer is down.
 *   index: numerical index identifying the pointer.
 */
GJS.CanvasUI.prototype.canvasMove = function(cursor) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new GJS.CanvasUICursor(this));
    }
    this.cursors[cursor.index].active = true;
    this.cursors[cursor.index].setPosition(cursor.current);
};

/**
 * A single cursor.
 * @param {GJS.CanvasUI} ui UI this cursor belongs to.
 * @constructor
 */
GJS.CanvasUICursor = function(ui) {
    this.ui = ui;
    this.active = false;
    this.x = -Infinity;
    this.y = -Infinity;
    this.downButton = null;
    this.dragging = false;
};

/**
 * Set the cursor position.
 * @param {Object|Vec2} vec New position to set. Needs to have x and y coordinates. Relative to the canvas coordinate
 * space.
 */
GJS.CanvasUICursor.prototype.setPosition = function(pos) {
    this.x = pos.x;
    this.y = pos.y;
    if (this.dragging) {
        this.downButton.draggedX = this.downButton.centerX + (this.x - this.dragStartX);
        this.downButton.draggedY = this.downButton.centerY + (this.y - this.dragStartY);
    }
};

/**
 * Handle a mouse / touch down event.
 * @param {Object|Vec2} pos New position to set. Needs to have x and y coordinates. Relative to the canvas coordinate
 * space.
 */
GJS.CanvasUICursor.prototype.press = function(pos) {
    this.setPosition(pos);
    var uiElements = this.ui.uiElements;
    for (var i = 0; i < uiElements.length; ++i) {
        if (uiElements[i].active && uiElements[i].hitTest(this.x, this.y) && !uiElements[i].isDown) {
            this.downButton = uiElements[i];
            this.downButton.down();
            if (uiElements[i].draggable && !uiElements[i].dragged) {
                this.downButton.dragged = true;
                this.dragStartX = this.x;
                this.dragStartY = this.y;
                this.dragging = true;
            }
        }
    }
    this.setPosition(pos);
};

/**
 * Handle a mouse / touch up event.
 * @param {Object|Vec2=} pos New position to set. Needs to have x and y coordinates. Relative to the canvas coordinate
 * space. May be undefined, in which case the last known position will be used to evaluate the effects.
 */
GJS.CanvasUICursor.prototype.release = function(pos) {
    if (pos !== undefined) {
        this.setPosition(pos);
    }
    if (this.downButton !== null) {
        var clicked = false;
        var uiElements = this.ui.uiElements;
        for (var i = 0; i < uiElements.length; ++i) {
            if (uiElements[i].active && uiElements[i].hitTest(this.x, this.y)) {
                if (this.downButton === uiElements[i]) {
                    clicked = true;
                } else if (uiElements[i].dragTargetCallback !== null && this.downButton.dragged) {
                    uiElements[i].dragTargetCallback(this.downButton.draggedObjectFunc());
                }
            }
        }
        this.downButton.release(clicked);
        if (this.dragging) {
            this.downButton.dragged = false;
            this.dragging = false;
        }
        this.downButton = null;
    }
    console.log(this.x, this.y);
};

/**
 * The default font for UI elements.
 */
GJS.CanvasUI.defaultFont = 'sans-serif';

/**
 * Minimum interval between clicks on the same button in seconds.
 */
GJS.CanvasUI.minimumClickInterval = 0.5;

/**
 * A single UI element to draw on a canvas, typically either a button or a label.
 * Will be rendered with text by default, but can also be drawn with a custom rendering function renderFunc.
 * @constructor
 */
GJS.CanvasUIElement = function(options) {
    var defaults = {
        label: 'Button',
        labelFunc: null, // Function that returns the current text to draw on the element. Overrides label if set.
        renderFunc: null,
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null,
        dragTargetCallback: null, // Called when something is dragged onto this object, with the dragged object as parameter.
        draggedObjectFunc: null,
        active: true, // Active elements are visible and can be interacted with. Inactive elements can't be interacted with.
        draggable: false,
        fontSize: 20, // In pixels
        font: GJS.CanvasUI.defaultFont,
        appearance: undefined // One of GJS.CanvasUIElement.Appearance. By default the appearance is determined based on callbacks.
    };
    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    this.draggedX = this.centerX;
    this.draggedY = this.centerY;
    this.dragged = false;
    this.time = 0.5;
    this.isDown = false;
    this.lastClick = 0;
    if (this.appearance === undefined) {
        if (this.clickCallback !== null) {
            this.appearance = GJS.CanvasUIElement.Appearance.BUTTON;
        } else {
            this.appearance = GJS.CanvasUIElement.Appearance.LABEL;
        }
    }
};

GJS.CanvasUIElement.Appearance = {
    BUTTON: 0,
    LABEL: 1
};

/**
 * Update UI element state and animations.
 * @param {number} deltaTime Time passed since the last update in seconds.
 */
GJS.CanvasUIElement.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

/**
 * Render the element. Will call renderFunc if it is defined.
 * @param {CanvasRenderingContext2D} ctx Context to render to.
 * @param {Array.<GJS.CanvasUICursor>} cursors A list of all active cursors.
 */
GJS.CanvasUIElement.prototype.render = function(ctx, cursors) {
    if (!this.active) {
        return;
    }
    var pressedExtent = this.isDown ? (this.time - this.lastDownTime) * 8.0 : 1.0 - (this.time - this.lastUpTime) * 3.0;
    pressedExtent = mathUtil.clamp(0, 1, pressedExtent);
    var cursorOn = false;
    for (var i = 0; i < cursors.length; ++i) {
        var cursor = cursors[i];
        if (this.hitTest(cursor.x, cursor.y)) {
            cursorOn = true;
        }
    }

    if (this.renderFunc !== null) {
        this.renderFunc(ctx, this, cursorOn, pressedExtent);
        return;
    }

    if (this.appearance === GJS.CanvasUIElement.Appearance.BUTTON) {
        var rect = this.getRect();
        ctx.fillStyle = '#000';
        if (pressedExtent > 0) {
            ctx.globalAlpha = 1.0 - pressedExtent * 0.2;
        } else if (cursorOn) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillRect(rect.left, rect.top, rect.width(), rect.height());
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        if (!this.canClick()) {
            ctx.globalAlpha *= 0.6;
        }
        ctx.strokeRect(rect.left, rect.top, rect.width(), rect.height());
    }
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = this.fontSize + 'px ' + this.font;
    var label = this.label;
    if (this.labelFunc) {
        label = this.labelFunc();
    }
    ctx.fillText(label, this.centerX, this.centerY + 7);
};

/**
 * @return {number} The horizontal position to draw the element at. May be different from the logical position if the
 * element is being dragged.
 */
GJS.CanvasUIElement.prototype.visualX = function() {
    if (this.dragged) {
        return this.draggedX;
    } else {
        return this.centerX;
    }
};

/**
 * @return {number} The vertical position to draw the element at. May be different from the logical position if the
 * element is being dragged.
 */
GJS.CanvasUIElement.prototype.visualY = function() {
    if (this.dragged) {
        return this.draggedY;
    } else {
        return this.centerY;
    }
};

/**
 * @return {boolean} True when the element is being dragged.
 */
GJS.CanvasUIElement.prototype.isDragged = function() {
    return this.dragged;
};

/**
 * @param {number} x Horizontal coordinate to test.
 * @param {number} y Vertical coordinate to test.
 * @return {boolean} Whether the coordinate is within the area of the element.
 */
GJS.CanvasUIElement.prototype.hitTest = function(x, y) {
    if (this.clickCallback !== null) {
        return this.getRect().containsVec2(new Vec2(x, y));
    }
    return false;
};

/**
 * @return boolean True if the element can generate click events right now. False if the click cooldown hasn't
 * completed.
 */
GJS.CanvasUIElement.prototype.canClick = function() {
    var sinceClicked = this.time - this.lastClick;
    return sinceClicked >= GJS.CanvasUI.minimumClickInterval;
};

GJS.CanvasUIElement.prototype.getRect = function() {
    return new Rect(
        this.centerX - this.width * 0.5,
        this.centerX + this.width * 0.5,
        this.centerY - this.height * 0.5,
        this.centerY + this.height * 0.5
    );
};

/**
 * Mark the element as down, for visual purposes only.
 */
GJS.CanvasUIElement.prototype.down = function() {
    this.isDown = true;
    this.lastDownTime = this.time;
};

/**
 * Mark the element as up. Will generate a click event if clicked is true.
 * @param {boolean} clicked True when clicked, false when the cursor position has left the area of the element.
 */
GJS.CanvasUIElement.prototype.release = function(clicked) {
    this.isDown = false;
    this.lastUpTime = this.time;
    if (!clicked || !this.canClick()) {
        return;
    }
    this.lastClick = this.time;
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};

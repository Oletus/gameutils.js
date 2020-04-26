
import { mathUtil, Vec2, Rect } from './util2d.js';

/**
 * Class for rendering and interacting with UI elements on a canvas.
 * @constructor
 */
const CanvasUI = function(options) {
    this.clear();
};

/**
 * Update UI element state and animations.
 * @param {number} deltaTime Time passed since the last update in seconds.
 */
CanvasUI.prototype.update = function(deltaTime) {
    for (var i = 0; i < this.uiElements.length; ++i) {
        this.uiElements[i].update(deltaTime);
    }
};

/**
 * Render the UI.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context to use.
 * @param {function=} matchFunc Set this to only render the matching elements. By default all elements are rendered.
 */
CanvasUI.prototype.render = function(ctx, matchFunc) {
    var activeCursors = this._getActiveCursors();
    var draggedElements = [];
    var i;
    for (i = 0; i < this.uiElements.length; ++i) {
        if (matchFunc === undefined || matchFunc(this.uiElements[i])) {
            if (!this.uiElements[i].dragged) {
                this.uiElements[i].render(ctx, activeCursors);
            } else {
                draggedElements.push(this.uiElements[i]);
            }
        }
    }
    for (i = 0; i < draggedElements.length; ++i) {
        draggedElements[i].render(ctx, activeCursors);
    }
};

/**
 * @return {Array.<Object>} Active cursors.
 * @protected
 */
CanvasUI.prototype._getActiveCursors = function() {
    var activeCursors = [];
    for (var i = 0; i < this.cursors.length; ++i) {
        if (this.cursors[i].active) {
            activeCursors.push(this.cursors[i]);
        }
    }
    return activeCursors;
};

/**
 * Clear the UI from all elements.
 */
CanvasUI.prototype.clear = function() {
    this.uiElements = [];
    this.cursors = [];
};

CanvasUI.prototype.addElement = function(element) {
    this.uiElements.push(element);
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   currentPosition: an x,y vector indicating the last known position of the pointer.
 *   index: numerical index identifying the pointer.
 * @return {boolean} True if an element was pressed.
 */
CanvasUI.prototype.canvasPress = function(cursor) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new CanvasUICursor(this));
    }
    this.cursors[cursor.index].active = true;
    return this.cursors[cursor.index].press(cursor.currentPosition);
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   index: numerical index identifying the pointer.
 * @param {boolean} makeInactive Set to true to make the cursor inactive at the same time. Useful for touch cursors.
 */
CanvasUI.prototype.canvasRelease = function(cursor, makeInactive) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new CanvasUICursor(this));
    }
    this.cursors[cursor.index].release();
    this.cursors[cursor.index].active = !makeInactive;
};

/**
 * @param {Object} cursor Cursor with the following keys:
 *   currentPosition: an x,y vector indicating the last known position of the pointer.
 *   index: numerical index identifying the pointer.
 */
CanvasUI.prototype.canvasMove = function(cursor) {
    while (this.cursors.length <= cursor.index) {
        this.cursors.push(new CanvasUICursor(this));
    }
    this.cursors[cursor.index].active = true;
    this.cursors[cursor.index].setPosition(cursor.currentPosition);
};

/**
 * A single cursor.
 * @param {CanvasUI} ui UI this cursor belongs to.
 * @constructor
 */
const CanvasUICursor = function(ui) {
    this.ui = ui;
    this.active = false;
    this.x = -Infinity;
    this.y = -Infinity;
    this.downButton = null;
    this.dragging = false;
};

/**
 * Set the cursor position.
 * @param {Vec2} vec New position to set. Relative to the canvas coordinate space.
 */
CanvasUICursor.prototype.setPosition = function(pos) {
    this.x = pos.x;
    this.y = pos.y;
    if (this.dragging) {
        this.downButton.draggedX = this.downButton.centerX + (this.x - this.dragStartX);
        this.downButton.draggedY = this.downButton.centerY + (this.y - this.dragStartY);
    } else if (this.downButton) {
        var hit = this.downButton.hitTest(this.x, this.y);
        if (this.downButton.moveWhenDownCallback !== null) {
            this.downButton.moveWhenDownCallback(this.downButton, pos);
        }
        if (!hit) {
            this.downButton.release(false);
        } else {
            this.downButton.down();
        }
    }
};

/**
 * Handle a mouse / touch down event.
 * @param {Object|Vec2} pos New position to set. Needs to have x and y coordinates. Relative to the canvas coordinate
 * space.
 * @return {boolean} True if an element was pressed.
 */
CanvasUICursor.prototype.press = function(pos) {
    this.setPosition(pos);
    var uiElements = this.ui.uiElements;
    for (var i = 0; i < uiElements.length; ++i) {
        if (uiElements[i].active && !uiElements[i].locked &&
            uiElements[i].hitTest(this.x, this.y) && !uiElements[i].isDown)
        {
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
    return this.downButton !== null;
};

/**
 * Handle a mouse / touch up event.
 * @param {Object|Vec2=} pos New position to set. Needs to have x and y coordinates. Relative to the canvas coordinate
 * space. May be undefined, in which case the last known position will be used to evaluate the effects.
 */
CanvasUICursor.prototype.release = function(pos) {
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
 * A single UI element to draw on a canvas, typically either a button or a label.
 * Will be rendered with text by default, but can also be drawn with a custom rendering function renderFunc.
 * @param {Object} options Options for the UI element.
 * @constructor
 */
const CanvasUIElement = function(options) {
    var defaults = {
        label: 'Button',
        labelFunc: null, // Function that returns the current text to draw on the element. Overrides label if set.
        renderFunc: CanvasUIElement.defaultRenderFunc, // Function to draw the element. Takes CanvasRenderingContext2D, CanvasUIElement, cursorOver (boolean), pressedExtent (0 to 1), label (string)
        centerX: 0,
        centerY: 0,
        width: 100,
        height: 50,
        clickCallback: null, // Function that is called when the UI element is clicked or tapped.
        moveWhenDownCallback: null, // Function that is called while the cursor is moved when the element is down. Takes CanvasUIElement, cursor position (Vec2).
        dragTargetCallback: null, // Called when something is dragged onto this object, with the dragged object as parameter.
        draggedObjectFunc: null, // Function that returns the dragged object associated with this UI element.
        active: true, // Active elements are visible and can be interacted with. Inactive elements are invisible and can't be interacted with.
        locked: false, // Locked elements can't be interacted with. Often they'd render with a lock on top.
        draggable: false,
        pressSpeed: CanvasUIElement.defaultPressSpeed,
        depressSpeed: CanvasUIElement.defaultDepressSpeed
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
    this.lastDownTime = -1;
    this.lastUpTime = -1;
};

/**
 * Minimum interval between clicks on the same button in seconds.
 */
CanvasUIElement.minimumClickInterval = 0.5;

/**
 * Visual press/depress speed that affects how fast pressedExtent changes for the element.
 */
CanvasUIElement.defaultPressSpeed = 8.0;
CanvasUIElement.defaultDepressSpeed = 3.0;

/**
 * The default font for UI elements used in defaultRenderFunc.
 */
CanvasUIElement.defaultFont = 'sans-serif';

/**
 * Font size used by defaultRenderFunc in px.
 */
CanvasUIElement.defaultFontSize = 20;

/**
 * Default render function.
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasUIElement} element
 * @param {boolean} cursorOver
 * @param {number} pressedExtent Between 0 and 1. 1 means fully pressed.
 * @param {string} label
 */
CanvasUIElement.defaultRenderFunc = function(ctx, element, cursorOver, pressedExtent, label) {
    var isButton = element.clickCallback !== null;

    if (isButton) {
        var rect = element.getRect();
        ctx.fillStyle = '#000';
        if (pressedExtent > 0) {
            ctx.globalAlpha = 1.0 - pressedExtent * 0.2;
        } else if (cursorOver) {
            ctx.globalAlpha = 1.0;
        } else {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillRect(rect.left, rect.top, rect.width(), rect.height());
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        if (!element.canClick()) {
            ctx.globalAlpha *= 0.6;
        }
        ctx.strokeRect(rect.left, rect.top, rect.width(), rect.height());
    }
    ctx.globalAlpha = 1.0;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = CanvasUIElement.defaultFontSize + 'px ' + CanvasUIElement.defaultFont;
    ctx.fillText(label, element.centerX, element.centerY + 7);
};

/**
 * Update UI element state and animations.
 * @param {number} deltaTime Time passed since the last update in seconds.
 */
CanvasUIElement.prototype.update = function(deltaTime) {
    this.time += deltaTime;
};

/**
 * Render the element. Will call renderFunc if it is defined.
 * @param {CanvasRenderingContext2D} ctx Context to render to.
 * @param {Array.<CanvasUICursor>} cursors A list of all active cursors.
 */
CanvasUIElement.prototype.render = function(ctx, cursors) {
    if (!this.active) {
        return;
    }
    var pressedExtent = this.isDown ? (this.time - this.lastDownTime) * this.pressSpeed
                                    : 1.0 - (this.time - this.lastUpTime) * this.depressSpeed;
    pressedExtent = mathUtil.clamp(0, 1, pressedExtent);
    var cursorOver = false;
    for (var i = 0; i < cursors.length; ++i) {
        var cursor = cursors[i];
        if (cursor.active && this.hitTest(cursor.x, cursor.y)) {
            cursorOver = true;
        }
    }

    var label = this.label;
    if (this.labelFunc !== null) {
        label = this.labelFunc();
    }

    this.renderFunc(ctx, this, cursorOver, pressedExtent, label);
};

/**
 * @return {number} The horizontal position to draw the element at. May be different from the logical position if the
 * element is being dragged.
 */
CanvasUIElement.prototype.visualX = function() {
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
CanvasUIElement.prototype.visualY = function() {
    if (this.dragged) {
        return this.draggedY;
    } else {
        return this.centerY;
    }
};

/**
 * @return {boolean} True when the element is being dragged.
 */
CanvasUIElement.prototype.isDragged = function() {
    return this.dragged;
};

/**
 * @param {number} x Horizontal coordinate to test.
 * @param {number} y Vertical coordinate to test.
 * @return {boolean} Whether the coordinate is within the area of the element.
 */
CanvasUIElement.prototype.hitTest = function(x, y) {
    if (this.clickCallback !== null || this.moveWhenDownCallback !== null) {
        return this.getRect().containsVec2(new Vec2(x, y));
    }
    return false;
};

/**
 * @return boolean True if the element can generate click events right now. False if the click cooldown hasn't
 * completed.
 */
CanvasUIElement.prototype.canClick = function() {
    var sinceClicked = this.time - this.lastClick;
    return sinceClicked >= CanvasUIElement.minimumClickInterval;
};

/**
 * @return {Rect} Rectangle of the element centered around its centerX, centerY.
 */
CanvasUIElement.prototype.getRect = function() {
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
CanvasUIElement.prototype.down = function() {
    if (!this.isDown) {
        this.isDown = true;
        this.lastDownTime = this.time;
    }
};

/**
 * Mark the element as up. Will generate a click event if clicked is true.
 * @param {boolean} clicked True when clicked, false when the cursor position has left the area of the element.
 */
CanvasUIElement.prototype.release = function(clicked) {
    if (this.isDown) {
        this.isDown = false;
        this.lastUpTime = this.time;
    }
    if (!clicked || !this.canClick()) {
        return;
    }
    this.lastClick = this.time;
    if (this.clickCallback !== null) {
        this.clickCallback();
    }
};

export { CanvasUI, CanvasUIElement, CanvasUICursor }

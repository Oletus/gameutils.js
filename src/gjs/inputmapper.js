
import { Gamepad } from "./gamepad.js";

/**
 * Mapper that automatically maps keyboard / gamepad input to different player numbers.
 * This can be used to implement keyboard / gamepad controls for a single player or a local
 * multiplayer game that allows players on the keyboard to play against players on gamepads.
 * Requires gamepad.js, mousetrap.js and mousetrap-global-bind.js to be included.
 * @constructor
 * @param {Object} callbackObj Object on which the callback functions will be called.
 * @param {number} maxPlayers Maximum number of players. If there are more active controllers
 * than this, then two controllers may be mapped to the same player.
 */
const InputMapper = function(callbackObj, maxPlayers) {
    this.gamepads = new Gamepad(this);
    this.callbackObj = callbackObj;
    this.maxPlayers = maxPlayers;
    this.resetPlayerMap();
    this.keysDown = []; // Keyboard keys that are currently down
    this.callbacks = []; // Callback information for mapping callbacks back to buttons
    this.upCallbacksForKey = {}; // Map from keys to lists of callbacks, so each key can have multiple callbacks
    this.downCallbacksForKey = {}; // Map from keys to lists of callbacks, so each key can have multiple callbacks
    this._defaultController = new InputMapper.Controller(InputMapper.GAMEPAD, 0);
};

// Controller types
InputMapper.GAMEPAD = 0;
InputMapper.KEYBOARD = 1;

InputMapper.gamepadIconURL = 'data:image/png;base64,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';

InputMapper.keyboardIconURL = 'data:image/png;base64,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';


/**
 * Helper class to store the controller config each player has.
 * @constructor
 * @param {number} controllerType Controller type: either InputMapper.GAMEPAD or InputMapper.KEYBOARD
 * @param {number} controllerIndex Controller index: in case of keyboard, index into the array of keyboard keys given
 * to addListener. In case of gamepad, index of the gamepad.
 */
InputMapper.Controller = function(controllerType, controllerIndex) {
    this.controllerType = controllerType;
    this.controllerIndex = controllerIndex;
    this.lastUsed = 0; // A timestamp for when this controller was last used
};

/**
 * Reset the map between controllers and player numbers.
 * @param {number?} maxPlayers Maximum player count. Default is to keep existing value.
 */
InputMapper.prototype.resetPlayerMap = function(maxPlayers) {
    if (maxPlayers !== undefined) {
        this.maxPlayers = maxPlayers;
    }
    this.players = []; // An array of arrays of controllers. Each player can have multiple controllers.
    for (var i = 0; i < this.maxPlayers; ++i) {
        this.players.push([]);
    }
};

/**
 * Update the controller state and call listeners based on that.
 */
InputMapper.prototype.update = function() {
    this.gamepads.update();
};

/**
 * Return a player index for a player using a given controller.
 * @param {number} controllerType Controller type: either InputMapper.GAMEPAD or InputMapper.KEYBOARD
 * @param {number} controllerIndex Controller index: in case of keyboard, index into the array of keyboard keys given
 * to addListener. In case of gamepad, index of the gamepad.
 */
InputMapper.prototype.getPlayerIndex = function(controllerType, controllerIndex) {
    for (var i = 0; i < this.players.length; ++i) {
        var player = this.players[i];
        for (var j = 0; j < player.length; ++j) {
            if (player[j].controllerType == controllerType && player[j].controllerIndex == controllerIndex) {
                player[j].lastUsed = Date.now();
                return i;
            }
        }
    }
    var controller = new InputMapper.Controller(controllerType, controllerIndex);
    controller.lastUsed = Date.now();
    // Map the controller for a player without a controller if there is one
    for (var i = 0; i < this.players.length; ++i) {
        var player = this.players[i];
        if (player.length === 0) {
            player.push(controller);
            return i;
        }
    }
    // Map the controller for the first player without this type of a controller
    for (var i = 0; i < this.players.length; ++i) {
        var player = this.players[i];
        var hasSameTypeController = false;
        for (var j = 0; j < player.length; ++j) {
            if (player[j].controllerType == controllerType) {
                hasSameTypeController = true;
            }
        }
        if (!hasSameTypeController) {
            player.push(controller);
            return i;
        }
    }
    // Just map the controller for the first player
    this.players[0].push(controller);
    return 0;
};

/**
 * @param {number} gamepadButton A button from Gamepad.BUTTONS
 * @param {Array} keyboardButtons List of bindings for different players, for example ['up', 'w']
 * @param {function=} downCallback Callback when the button is pressed down, that takes a player number as a parameter.
 * @param {function=} upCallback Callback when the button is released, that takes a player number as a parameter.
 */
InputMapper.prototype.addListener = function(gamepadButton, keyboardButtons, downCallback, upCallback) {
    if (gamepadButton !== undefined) {
        var gamepadDownCallback = function(gamepadNumber) {
            var player = this.getPlayerIndex(InputMapper.GAMEPAD, gamepadNumber);
            if (downCallback !== undefined) {
                downCallback.call(this.callbackObj, player);
            }
        };
        var gamepadUpCallback = function(gamepadNumber) {
            var player = this.getPlayerIndex(InputMapper.GAMEPAD, gamepadNumber);
            if (upCallback !== undefined) {
                upCallback.call(this.callbackObj, player);
            }
        };
        this.gamepads.addButtonChangeListener(gamepadButton, gamepadDownCallback, gamepadUpCallback);
        
        var gamepadInstruction = "";
        
        if (gamepadButton < 100) {
            gamepadInstruction = Gamepad.BUTTON_INSTRUCTION[gamepadButton];
        } else {
            gamepadInstruction = Gamepad.BUTTON_INSTRUCTION[gamepadButton - 100];
        }
        
        if (downCallback !== undefined) {
            this.callbacks.push({key: gamepadInstruction, callback: downCallback, controllerType: InputMapper.GAMEPAD});
        }
        if (upCallback !== undefined) {
            this.callbacks.push({key: gamepadInstruction, callback: upCallback, controllerType: InputMapper.GAMEPAD});
        }
    }

    var that = this;
    for (var i = 0; i < keyboardButtons.length; ++i) {
        (function(kbIndex) {
            if (!that.downCallbacksForKey.hasOwnProperty(keyboardButtons[kbIndex])) {
                that.keysDown[keyboardButtons[kbIndex]] = false;
                that.downCallbacksForKey[keyboardButtons[kbIndex]] = [];
                that.upCallbacksForKey[keyboardButtons[kbIndex]] = [];
                var keyDownCallback = function(e) {
                    var player = that.getPlayerIndex(InputMapper.KEYBOARD, kbIndex);
                    // Down events get generated multiple times while a key is down. Work around this.
                    if (!that.keysDown[keyboardButtons[kbIndex]]) {
                        that.keysDown[keyboardButtons[kbIndex]] = true;
                        var callbacksToCall = that.downCallbacksForKey[keyboardButtons[kbIndex]];
                        for (var i = 0; i < callbacksToCall.length; ++i) {
                            callbacksToCall[i].call(that.callbackObj, player);
                        }
                    }
                    e.preventDefault();
                };
                var keyUpCallback = function(e) {
                    var player = that.getPlayerIndex(InputMapper.KEYBOARD, kbIndex);
                    that.keysDown[keyboardButtons[kbIndex]] = false;
                    var callbacksToCall = that.upCallbacksForKey[keyboardButtons[kbIndex]];
                    for (var i = 0; i < callbacksToCall.length; ++i) {
                        callbacksToCall[i].call(that.callbackObj, player);
                    }
                    e.preventDefault();
                };
                window.Mousetrap.bindGlobal(keyboardButtons[kbIndex], keyDownCallback, 'keydown');
                window.Mousetrap.bindGlobal(keyboardButtons[kbIndex], keyUpCallback, 'keyup');
            }
            if (downCallback !== undefined) {
                that.downCallbacksForKey[keyboardButtons[kbIndex]].push(downCallback);
            }
            if (upCallback !== undefined) {
                that.upCallbacksForKey[keyboardButtons[kbIndex]].push(upCallback);
            }
        })(i);
        if (downCallback !== undefined) {
            this.callbacks.push({key: keyboardButtons[i], callback: downCallback, controllerType: InputMapper.KEYBOARD, kbIndex: i});
        }
        if (upCallback !== undefined) {
            this.callbacks.push({key: keyboardButtons[i], callback: upCallback, controllerType: InputMapper.KEYBOARD, kbIndex: i});
        }
    }
};

/**
 * Check if a given callback uses a given type of controller. Doesn't care about gamepad indices.
 * @protected
 * @param {InputMapper.Controller} controller
 * @param {Object} cbInfo Information on the callback, with keys controllerType and kbIndex in case of a keyboard.
 * @return {boolean} True if the given callback uses the given type of a controller.
 */
InputMapper._usesController = function(controller, cbInfo) {
    if (cbInfo.controllerType === controller.controllerType) {
        if (cbInfo.controllerType === InputMapper.KEYBOARD && controller.controllerIndex !== cbInfo.kbIndex) {
            // Each keyboard "controller" has different key bindings.
            return false;
        }
        return true;
    }
};

/**
 * From an array of controllers, determine the one that was most recently used.
 * @protected
 * @param {Array.<InputMapper.Controller>} player Array of controllers to check.
 * @return {InputMapper.Controller} The most recently used controller.
 */
InputMapper.prototype._getLastUsedController = function(player) {
    var controller;
    var lastUsed = 0;
    for (var j = 0; j < player.length; ++j) {
        if (player[j].lastUsed > lastUsed) {
            controller = player[j];
            lastUsed = player[j].lastUsed;
        }
    }
    return controller;
};

/**
 * Cycle the controller that is used for showing instructions by default.
 */
InputMapper.prototype.cycleDefaultControllerForInstruction = function() {
    if (this._defaultController.controllerType === InputMapper.KEYBOARD) {
        this._defaultController = new InputMapper.Controller(InputMapper.GAMEPAD, 0);
    } else {
        this._defaultController = new InputMapper.Controller(InputMapper.KEYBOARD, 0);
    }
};

InputMapper.prototype._getInstructionController = function(playerIndex) {
    var controller;
    if (playerIndex !== undefined && this.players.length > playerIndex) {
        if (this.players[playerIndex].length > 0) {
            controller = this._getLastUsedController(this.players[playerIndex]);
        } else {
            // Gamepad instructions by default
            controller = this._defaultController;
        }
    }
    return controller;
};

/**
 * @param {number} playerIndex Index of the player to return information for.
 * @return {string} String containing an URL for an icon representing the controller the player is using.
 */
InputMapper.prototype.getControllerIconURL = function(playerIndex) {
    var controller = this._getInstructionController(playerIndex);
    if (controller.controllerType === InputMapper.GAMEPAD) {
        return InputMapper.gamepadIconURL;
    } else {
        return InputMapper.keyboardIconURL;
    }
};

/**
 * Get instruction for a key. Prioritizes gamepad over keyboard if keyboard hasn't been used. If you want to change the
 * controller which is prioritized, call cycleDefaultControllerForInstruction().
 * @param {function} callback A callback that has been previously attached to a button.
 * @param {number} playerIndex Index of the player to return information for. Set to undefined if the listener doesn't
 * care about the player number.
 * @return {string} String identifying the button for the player.
 */
InputMapper.prototype.getKeyInstruction = function(callback, playerIndex) {
    var controller = this._getInstructionController(playerIndex);
    var returnStr = [];
    for (var i = 0; i < this.callbacks.length; ++i) {
        var cbInfo = this.callbacks[i];
        if (cbInfo.callback === callback) {
            if (controller === undefined) {
                // Listener doesn't care about the player number.
                // Determine all keys mapped to that callback from different controllers.
                for (var j = 0; j < this.players.length; ++j) {
                    for (var k = 0; k < this.players[j].length; ++k) {
                        if (InputMapper._usesController(this.players[j][k], cbInfo)) {
                            var hasInstruction = false;
                            var instruction = cbInfo.key.toUpperCase();
                            for (var l = 0; l < returnStr.length; ++l) {
                                if (returnStr[l] == instruction) {
                                    hasInstruction = true;
                                }
                            }
                            if (!hasInstruction) {
                                returnStr.push(instruction);
                            }
                        }
                    }
                }
            } else {
                if (InputMapper._usesController(controller, cbInfo)) {
                    return cbInfo.key.toUpperCase();
                }
            }
        }
    }
    if (controller === undefined) {
        return returnStr.join('/');
    }
    return '';
};

export { InputMapper }

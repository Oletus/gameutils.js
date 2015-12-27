'use strict';

/**
 * A class for runtime developer settings and tuning game parameters.
 * @constructor
 * @param {Object} params An object with parameters that can be adjusted. Example:
 *  {
 *    'playerJumpHeight': {initial: 1, min: 0.1, max: 2},
 *    'muteAudio': false
 *  }
 */
var GameParameters = function(params) {
    this._params = params;
    this._values = {};
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            this._values[key] = params[key].initial;
        }
    }
};

/**
 * Add dat.gui for changing the parameters.
 */
GameParameters.prototype.initGUI = function() {
    var gui = new dat.GUI();
    var params = this._params;
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var param = params[key];
            if (param.min !== undefined) {
                gui.add(this._values, key, param.min, param.max);
            } else {
                gui.add(this._values, key);
            }
        }
    }
};

/**
 * @param {string} key Key for the parameter.
 * @return {Object} The current value of a parameter.
 */
GameParameters.prototype.get = function(key) {
    return this._values[key];
};

/**
 * @param {string} key Key for the parameter.
 * @param {Object} value The value of a parameter to set.
 */
GameParameters.prototype.set = function(key, value) {
    if (this._values.hasOwnProperty(key)) {
        this._values[key] = value;
    }
};

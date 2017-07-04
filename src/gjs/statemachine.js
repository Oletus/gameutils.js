'use strict';

// Requires utiljs.js

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * A very simple state machine. Tracks state and the time that the machine has been in that state.
 * @constructor
 * @param {Object} options Options for the object. Contains keys:
 *   stateSet: An object with number values, each key-value pair identifying a state. Example:
 *     { IDLE: 0, RUNNING: 1 }
 *   id: Number that identifies the initial state.
 */
GJS.StateMachine = function(options) {
    var defaults = {
        id: null,
        stateSet: {}
    };
    objectUtil.initWithDefaults(this, defaults, options);
    if (this.id === null) {
        for (var key in this.stateSet) {
            if (this.stateSet.hasOwnProperty(key)) {
                this.id = this.stateSet[key];
                break;
            }
        }
    }
    this.time = 0;
    this.lifeTime = 0;
};

/**
 * @param {number} newStateId Id of the new state.
 */
GJS.StateMachine.prototype.change = function(newStateId) {
    this.id = newStateId;
    this.time = 0;
};

/**
 * @param {number} newStateId Id of the new state.
 */
GJS.StateMachine.prototype.changeIfDifferent = function(newStateId) {
    if (this.id !== newStateId) {
        this.change(newStateId);
    }
};

/**
 * Call this regularly to update the state machine.
 * @param {number} deltaTime Time change since last call to this function.
 */
GJS.StateMachine.prototype.update = function(deltaTime) {
    this.time += deltaTime;
    this.lifeTime += deltaTime;
};

/**
 * Return amount of time passed since this.lifeTime was lifeTime.
 * @param {number} lifeTime Timestamp to compare against.
 */
GJS.StateMachine.prototype.timeSince = function(lifeTime) {
    return this.lifeTime - lifeTime;
};

'use strict';

// Requires utiljs.js

/**
 * Class to inherit to implement a condition for unlocking a single unlock.
 * @constructor
 */
var UnlockCondition = function(options) {
};

/**
 * Initialize the condition.
 * @param {Object} options Object with the following keys:
 *   unlockId: string Identifier for the unlock.   
 */
UnlockCondition.prototype.initCondition = function(options) {
    var defaults = {
        unlockId: ''
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.fulfilled = false;
};

/**
 * Evaluate unlocking condition and set the member "fulfilled" when the condition is fulfilled.
 * @param {Object} gameState Object that unlocking is based on.
 * @param {number} deltaTime Time that has passed since the last update in seconds.
 */
UnlockCondition.prototype.update = function(gameState, deltaTime) {
    return;
};


/**
 * An unlock condition that always passes.
 * @constructor
 * @param {Object} options Object with the following keys:
 *   unlockId: string Identifier for the unlock.   
 */
var UnlockByDefault = function(options) {
    this.initCondition(options);
    this.fulfilled = true;
};

UnlockByDefault.prototype = new UnlockCondition();


/**
 * @constructor
 * Engine for managing game unlocks. Each unlock is identified by an id, has a condition that's an instance of
 * UnlockCondition based on game state and can be either unlocked (true) or locked (false).
 */
var Unlocker = function(options) {
    var defaults = {
        gameName: 'game',
        needCommitUnlocks: false,
        conditions: []
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this._fulfilledConditions = [];
    this.unlocks = {};
    for (var i = 0; i < this.conditions.length; ++i) {
        var condition = this.conditions[i];
        this.unlocks[condition.unlockId] = false;
        if (condition.fulfilled) {
            this._fulfilledConditions.push(condition.unlockId);
            if (!this.needCommitUnlocks) {
                this.unlocks[condition.unlockId] = true;
            }
        }
    }
};

/**
 * Evaluate unlocking conditions.
 * @param {Object} gameState Object that unlocking is based on.
 * @param {number} deltaTime Time that has passed since the last update in seconds.
 */
Unlocker.prototype.update = function(gameState, deltaTime) {
    for (var i = 0; i < this.conditions.length; ++i) {
        var condition = this.conditions[i];
        if (!this.unlocks[condition.unlockId] && this._fulfilledConditions.indexOf(condition.unlockId) < 0) {
            condition.update(gameState, deltaTime);
            if (condition.fulfilled) {
                this._fulfilledConditions.push(condition.unlockId);
                if (!this.needCommitUnlocks) {
                    this.unlocks[condition.unlockId] = true;
                }
            }
        }
    }
};

/**
 * @return {Array.<string>} List of unlockIds of the conditions that have been fulfilled since the last time this
 * function was called.
 */
Unlocker.prototype.popFulfilledUnlockConditions = function() {
    var fulfilledConditions = this._fulfilledConditions;
    this._fulfilledConditions = [];
    return fulfilledConditions;
};

/**
 * @param {string} unlockId Id to mark as unlocked.
 */
Unlocker.prototype.commitUnlock = function(unlockId) {
    this.unlocks[unlockId] = true;
};

/**
 * Load unlocks from storage.
 * @param {Storage} storage Storage object to load from.
 */
Unlocker.prototype.loadFrom = function(storage) {
    var unlocks = {};
    try {
        unlocks = JSON.parse(storage.getItem(this.gameName + '-gameutilsjs-unlocks'));
    } catch(e) {
        return;
    }
    for (var key in this.unlocks) {
        if (unlocks.hasOwnProperty(key)) {
            this.unlocks[key] = unlocks[key];
        }
    }
};

/**
 * Save unlocks to storage.
 * @param {Storage} storage Storage object to save to.
 */
Unlocker.prototype.saveTo = function(storage) {
    storage.setItem(this.gameName + '-gameutilsjs-unlocks-version', '0');
    storage.setItem(this.gameName + '-gameutilsjs-unlocks', JSON.stringify(this.unlocks));
};

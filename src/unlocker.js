'use strict';

// Requires utiljs.js, statesaver.js

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * Class to inherit to implement a condition for unlocking a single unlock.
 * @constructor
 */
GJS.UnlockCondition = function(options) {
};

/**
 * Initialize the condition.
 * @param {Object} options Object with the following keys:
 *   unlockId: string Identifier for the unlock.   
 */
GJS.UnlockCondition.prototype.initCondition = function(options) {
    var defaults = {
        unlockId: '',
        difficulty: 0  // Higher number means more difficult to unlock. Can be used to sort unlocks.
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.fulfilled = false;
};

/**
 * Compare the difficulty of two unlock conditions.
 */
GJS.UnlockCondition.compareDifficulty = function(condA, condB) {
    if (condA.difficulty < condB.difficulty) {
        return -1;
    } else if (condA.difficulty > condB.difficulty) {
        return 1;
    } else {
        return 0;
    }
};

/**
 * Set the unlock id for the condition. Only call before the condition is added to the GJS.Unlocker.
 * @param {string} unlockId Identifier for the unlock.   
 */
GJS.UnlockCondition.prototype.setId = function(unlockId) {
    this.unlockId = unlockId;
};

/**
 * Evaluate unlocking condition and set the member "fulfilled" when the condition is fulfilled.
 * @param {Object} gameState Object that unlocking is based on.
 * @param {number} deltaTime Time that has passed since the last update in seconds.
 */
GJS.UnlockCondition.prototype.update = function(gameState, deltaTime) {
    return;
};

/**
 * @return {string} A description of the unlock condition.
 */
GJS.UnlockCondition.prototype.getDescription = function() {
    return "";
};


/**
 * An unlock condition that always passes.
 * @constructor
 * @param {Object} options Object with the following keys:
 *   unlockId: string Identifier for the unlock.
 */
GJS.UnlockByDefault = function(options) {
    this.initCondition(options);
    this.fulfilled = true;
};

GJS.UnlockByDefault.prototype = new GJS.UnlockCondition();


/**
 * An unlock condition that never passes.
 * @constructor
 * @param {Object} options Object with the following keys:
 *   unlockId: string Identifier for the unlock.
 */
GJS.NeverUnlock = function(options) {
    this.initCondition(options);
};

GJS.NeverUnlock.prototype = new GJS.UnlockCondition();


/**
 * @constructor
 * Engine for managing game unlocks. Each unlock is identified by an id, has a condition that's an instance of
 * GJS.UnlockCondition based on game state and can be either unlocked (true) or locked (false).
 * If needCommitUnlocks is true, then all unlocks that are not unlocked by default need to be committed by calling
 * popFulfilledUnlockConditions and commitUnlock.
 */
GJS.Unlocker = function(options) {
    var defaults = {
        gameName: 'game',
        needCommitUnlocks: false,
        conditions: []
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this._fulfilledConditions = [];
    this.unlocks = {};

    this.saveState = {
        unlocksInOrder: []
    };
    this.saveStateDefaults = {
        unlocksInOrder: []
    };
    this.saveStateVersion = 1;
    this.saveName = 'gameutilsjs-unlocker';

    for (var i = 0; i < this.conditions.length; ++i) {
        var condition = this.conditions[i];
        this.unlocks[condition.unlockId] = false;
        // The conditions that are fulfilled by default are always committed.
        if (condition.fulfilled) {
            this.commitUnlock(condition.unlockId);
            this.saveStateDefaults.unlocksInOrder.push(condition.unlockId);
        }
    }
};

GJS.Unlocker.prototype = new GJS.Saveable();

/**
 * @param {GJS.UnlockCondition} condition Check if a condition is fulfilled.
 * @protected
 */
GJS.Unlocker.prototype._checkFulfilled = function(condition) {
    if (condition.fulfilled) {
        this._fulfilledConditions.push(condition.unlockId);
        if (!this.needCommitUnlocks) {
            this.commitUnlock(condition.unlockId);
        }
    }
};

/**
 * Evaluate unlocking conditions.
 * @param {Object} gameState Object that unlocking is based on.
 * @param {number} deltaTime Time that has passed since the last update in seconds.
 */
GJS.Unlocker.prototype.update = function(gameState, deltaTime) {
    for (var i = 0; i < this.conditions.length; ++i) {
        var condition = this.conditions[i];
        if (!this.unlocks[condition.unlockId] && this._fulfilledConditions.indexOf(condition.unlockId) < 0) {
            condition.update(gameState, deltaTime);
            this._checkFulfilled(condition);
        }
    }
};

/**
 * @param {string} unlockId Id of the condition to get the condition for.
 * @return {GJS.UnlockCondition} The unlock condition or null.
 */
GJS.Unlocker.prototype.getCondition = function(unlockId) {
    for (var i = 0; i < this.conditions.length; ++i) {
        var condition = this.conditions[i];
        if (condition.unlockId === unlockId) {
            return condition;
        }
    }
    return null;
};

/**
 * @param {string} unlockId Id of the condition to get the description for.
 * @return {string} A description of the unlock condition.
 */
GJS.Unlocker.prototype.getDescription = function(unlockId) {
    var condition = this.getCondition(unlockId);
    if (condition !== null) {
        return condition.getDescription();
    }
    return '';
};

/**
 * @return {Array.<string>} List of unlockIds of the conditions that have been fulfilled since the last time this
 * function was called.
 */
GJS.Unlocker.prototype.popFulfilledUnlockConditions = function() {
    var fulfilledConditions = this._fulfilledConditions;
    this._fulfilledConditions = [];
    return fulfilledConditions;
};

/**
 * @param {string} unlockId Id to mark as unlocked.
 * @return {boolean} True if the unlock was actually stored.
 */
GJS.Unlocker.prototype.commitUnlock = function(unlockId) {
    if (this.unlocks.hasOwnProperty(unlockId)) {
        this.unlocks[unlockId] = true;
        this.saveState.unlocksInOrder.push(unlockId);
        return true;
    }
    return false;
};

/**
 * Called after state has been loaded.
 */
GJS.Unlocker.prototype.postLoadState = function() {
    for (var i = 0; i < this.saveState.unlocksInOrder.length; ++i) {
        var unlockId = this.saveState.unlocksInOrder[i];
        this.unlocks[unlockId] = true;
    }
};

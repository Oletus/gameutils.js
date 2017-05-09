'use strict';

// Requires utiljs.js

if (typeof GJS === "undefined") {
    var GJS = {};
}

/**
 * @constructor
 */
GJS.Saveable = function() {
    // An object containing state that can be passed to JSON.stringify for serialization and loaded by JSON.parse.
    // Any previous state will be cleared completely when loading.
    this.state = {};

    // An object containing the default state of state.
    this.stateDefaults = {};

    // Set to apply defaults recursively when loading state. In case set to 1, keys missing from saved object properties
    // of state will be filled in from defaults. In case set to 2, keys missing from object properties of object
    // properties of state will be filled in. And so on.
    this.applyStateDefaultsRecursivelyLevels = 0;

    // A number that is incremented each time the format of state is changed.
    this.stateVersion = 1;

    // A string identifying this saveable.
    this.saveName = '';
};

/**
 * Called after state has been loaded (for example, to initialize values dependent on state).
 */
GJS.Saveable.prototype.postLoadState = function() {};

/**
 * @return {function(Object):Object} Function to convert from one version of state to another. null if initializing the
 * new parts of state with their default values is enough.
 */
GJS.Saveable.prototype.getStateVersionConversion = function(loadedStateVersion, targetStateVersion) {
    return null;
};


/**
 * @constructor
 * @param {Object} options. Options with the following keys:
 *   savedObjects (Array.<GJS.Saveable>) The objects that get loaded or saved. Each object is handled independently -
 *     the version of the save state of one object can't have an effect on the loading of another object.
 *   prepareSaveState (function) Function to call just before state is saved. Intended to be used if some parts of state
 *     are populated only on demand. May be null.
 *   gameName (string): For identifying the game in local storage.
 */
GJS.StateSaver = function(options) {
    var defaults = {
        savedObjects: [],
        prepareSaveState: null,
        gameName: 'game'
    };
    objectUtil.initWithDefaults(this, defaults, options);
};

/**
 * Load state from storage.
 * @param {Storage} storage Storage object to load from.
 */
GJS.StateSaver.prototype.loadFrom = function(storage) {
    var parsed = {};
    try {
        parsed = JSON.parse(storage.getItem(this.gameName + '-gameutilsjs-state'));
        if (parsed === null) {
            parsed = {};
        }
    } catch(e) {}

    var applyStateDefaultsRecursively = function(state, defaults, levels) {
        for (var key in defaults) {
            if (state.hasOwnProperty(key) && defaults.hasOwnProperty(key) && typeof defaults[key] === 'object') {
                if (levels > 1) {
                    applyStateDefaultsRecursively(state[key], defaults[key], levels - 1);
                }
                objectUtil.fillIn(state[key], defaults[key]);
            }
        }
    };

    for (var i = 0; i < this.savedObjects.length; ++i) {
        var loadedObject = {
            state: {},
            version: this.savedObjects[i].stateVersion
        };
        if (parsed.hasOwnProperty(this.savedObjects[i].saveName)) {
            var loadedObject = parsed[this.savedObjects[i].saveName];
            if (loadedObject.version !== this.savedObjects[i].stateVersion) {
                var conversion = this.savedObjects[i].getStateVersionConversion(
                    loadedObject.version,
                    this.savedObjects[i].stateVersion);
                if (conversion !== null) {
                    loadedObject.state = conversion(loadedObject.state);
                }
            }
        }
        this.savedObjects[i].state = {};
        objectUtil.initWithDefaults(this.savedObjects[i].state, this.savedObjects[i].stateDefaults, loadedObject.state);
        if (this.savedObjects[i].applyStateDefaultsRecursivelyLevels > 0) {
            applyStateDefaultsRecursively(this.savedObjects[i].state, this.savedObjects[i].stateDefaults,
                                          this.savedObjects[i].applyStateDefaultsRecursivelyLevels);
        }
        this.savedObjects[i].postLoadState();
    }
};

/**
 * Save state to storage.
 * @param {Storage} storage Storage object to save to.
 */
GJS.StateSaver.prototype.saveTo = function(storage) {
    if (this.prepareSaveState) {
        this.prepareSaveState();
    }
    var gatheredState = {};
    for (var i = 0; i < this.savedObjects.length; ++i) {
        var savedObject = this.savedObjects[i];
        if (savedObject.saveName === '') {
            throw(new Error('saveName not set on a saveable object'));
        }
        gatheredState[savedObject.saveName] = {
            version: savedObject.stateVersion,
            state: savedObject.state
        };
    }
    storage.setItem(this.gameName + '-gameutilsjs-state', JSON.stringify(gatheredState));
};

/**
 * Erase save state in storage.
 * @param {Storage} storage Storage object to erase from.
 */
GJS.StateSaver.prototype.eraseSave = function(storage) {
    storage.setItem(this.gameName + '-gameutilsjs-state', JSON.stringify({}));
};

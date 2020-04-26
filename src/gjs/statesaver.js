
import { objectUtil } from './utiljs.js';

/**
 * @constructor
 */
const Saveable = function() {
    // An object containing state that can be passed to JSON.stringify for serialization and loaded by JSON.parse.
    // Any previous state will be cleared completely when loading.
    this.saveState = {};

    // An object containing the default state of state.
    this.saveStateDefaults = {};

    // Set to apply defaults recursively when loading state. In case set to 1, keys missing from saved object properties
    // of state will be filled in from defaults. In case set to 2, keys missing from object properties of object
    // properties of state will be filled in. And so on.
    this.applySaveStateDefaultsRecursivelyLevels = 0;

    // A number that is incremented each time the format of state is changed.
    this.saveStateVersion = 1;

    // A string identifying this saveable.
    this.saveName = '';
};

/**
 * Called after state has been loaded (for example, to initialize values dependent on state).
 */
Saveable.prototype.postLoadState = function() {};

/**
 * @return {function(Object):Object} Function to convert from one version of state to another. null if initializing the
 * new parts of state with their default values is enough.
 */
Saveable.prototype.getStateVersionConversion = function(loadedStateVersion, targetStateVersion) {
    return null;
};


/**
 * @constructor
 * @param {Object} options. Options with the following keys:
 *   savedObjects (Array.<Saveable>) The objects that get loaded or saved. Each object is handled independently -
 *     the version of the save state of one object can't have an effect on the loading of another object.
 *   prepareSaveState (function) Function to call just before state is saved. Intended to be used if some parts of state
 *     are populated only on demand. May be null.
 *   gameName (string): For identifying the game in local storage.
 */
StateSaver = function(options) {
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
StateSaver.prototype.loadFrom = function(storage) {
    var parsed = {};
    try {
        parsed = JSON.parse(storage.getItem(this.gameName + '-gameutilsjs-state'));
        if (parsed === null) {
            parsed = {};
        }
    } catch(e) {}

    var applyStateDefaultsRecursively = function(saveState, defaults, levels) {
        for (var key in defaults) {
            if (saveState.hasOwnProperty(key) && defaults.hasOwnProperty(key) && typeof defaults[key] === 'object') {
                if (levels > 1) {
                    applyStateDefaultsRecursively(saveState[key], defaults[key], levels - 1);
                }
                objectUtil.fillIn(saveState[key], defaults[key]);
            }
        }
    };

    for (var i = 0; i < this.savedObjects.length; ++i) {
        var loadedObject = {
            saveState: {},
            version: this.savedObjects[i].saveStateVersion
        };
        if (parsed.hasOwnProperty(this.savedObjects[i].saveName)) {
            var loadedObject = parsed[this.savedObjects[i].saveName];
            if (loadedObject.version !== this.savedObjects[i].saveStateVersion) {
                var conversion = this.savedObjects[i].getStateVersionConversion(
                    loadedObject.version,
                    this.savedObjects[i].saveStateVersion);
                if (conversion !== null) {
                    loadedObject.saveState = conversion(loadedObject.saveState);
                }
            }
        }
        this.savedObjects[i].saveState = {};
        objectUtil.initWithDefaults(this.savedObjects[i].saveState, this.savedObjects[i].saveStateDefaults, loadedObject.saveState);
        if (this.savedObjects[i].applySaveStateDefaultsRecursivelyLevels > 0) {
            applyStateDefaultsRecursively(this.savedObjects[i].saveState, this.savedObjects[i].saveStateDefaults,
                                          this.savedObjects[i].applySaveStateDefaultsRecursivelyLevels);
        }
        this.savedObjects[i].postLoadState();
    }
};

/**
 * Save state to storage.
 * @param {Storage} storage Storage object to save to.
 */
StateSaver.prototype.saveTo = function(storage) {
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
            version: savedObject.saveStateVersion,
            saveState: savedObject.saveState
        };
    }
    storage.setItem(this.gameName + '-gameutilsjs-state', JSON.stringify(gatheredState));
};

/**
 * Erase save state in storage.
 * @param {Storage} storage Storage object to erase from.
 */
StateSaver.prototype.eraseSave = function(storage) {
    storage.setItem(this.gameName + '-gameutilsjs-state', JSON.stringify({}));
};

export { Saveable, StateSaver }

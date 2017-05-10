/*
 * Copyright Olli Etuaho 2017.
 */

'use strict';

var testSaveable = function() {
    var TestSaveable = function() {
        this.saveName = 'testSaveable';
        this.saveState = {'testProp': 1, 'testObj': {'foo': 3}};
        this.saveStateDefaults = {'testProp': 2, 'testObj': {'foo': 4}};
    };

    TestSaveable.prototype = new GJS.Saveable();
    
    TestSaveable.prototype.setStateToOtherValues = function() {
        this.saveState['testProp'] = 545365;
        this.saveState['testObj']['foo'] = 623424;
    };

    return new TestSaveable();
};

describe('StateSaver', function() {
    it('initializes', function() {
        var saveable = testSaveable();
        
        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        expect(saver.gameName).toBe('testGame');
        expect(saver.prepareSaveState).toBe(null);
        expect(saver.savedObjects.length).toBe(1);
        expect(saver.savedObjects[0]).toBe(saveable);
    });

    it('saves to storage', function() {
        var saveable = testSaveable();
        
        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        var storage = testStorage();
        
        saver.saveTo(storage);
    });

    it('loads defaults from empty storage', function() {
        var saveable = testSaveable();
        
        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        var storage = testStorage();
        
        saver.loadFrom(storage);
        
        expect(saveable.saveState['testProp']).toBe(2);
        expect(saveable.saveState['testObj']['foo']).toBe(4);
    });

    it('saves and loads state', function() {
        var saveable = testSaveable();
        
        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        var storage = testStorage();
        
        saver.saveTo(storage);
        
        saveable.setStateToOtherValues();
        
        var saverB = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        saverB.loadFrom(storage);
        
        expect(saveable.saveState['testProp']).toBe(1);
        expect(saveable.saveState['testObj']['foo']).toBe(3);
    });

    it('fills in missing properties from defaults', function() {
        var saveable = testSaveable();
        saveable.saveState = {'testObj': {'foo': 3}};
        saveable.saveStateDefaults = {'testObj': {'foo': 4}};

        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        var storage = testStorage();
        
        saver.saveTo(storage);
        
        saveable = testSaveable();
        saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });
        
        saver.loadFrom(storage);
        
        expect(saveable.saveState['testProp']).toBe(2);
        expect(saveable.saveState['testObj']['foo']).toBe(3);
    });

    it('recursively fills in missing properties from defaults', function() {
        var saveable = testSaveable();

        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });

        var storage = testStorage();

        saver.saveTo(storage);

        saveable.applySaveStateDefaultsRecursivelyLevels = 1;
        saveable.saveStateDefaults['testObj']['bar'] = 1337;

        saver.loadFrom(storage);

        expect(saveable.saveState['testProp']).toBe(1);
        expect(saveable.saveState['testObj']['foo']).toBe(3);
        expect(saveable.saveState['testObj']['bar']).toBe(1337);
    });

    it('handles two savers with different names', function() {
        var saveableA = testSaveable();
        var saveableB = testSaveable();
        saveableB.saveState['testProp'] = 5;
        saveableB.saveState['testObj']['foo'] = 7;

        var saverA = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveableA]
        });

        var saverB = new GJS.StateSaver({
            gameName: 'testGameB',
            savedObjects: [saveableB]
        });

        var storage = testStorage();

        saverA.saveTo(storage);
        saverB.saveTo(storage);

        saveableA.setStateToOtherValues();
        saveableB.setStateToOtherValues();

        saverA.loadFrom(storage);
        saverB.loadFrom(storage);

        expect(saveableA.saveState['testProp']).toBe(1);
        expect(saveableA.saveState['testObj']['foo']).toBe(3);

        expect(saveableB.saveState['testProp']).toBe(5);
        expect(saveableB.saveState['testObj']['foo']).toBe(7);
    });

    it('converts data between versions', function() {
        var saveable = testSaveable();
        saveable.saveStateVersion = 1;

        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });

        var storage = testStorage();

        saver.saveTo(storage);

        saveable.saveStateVersion = 2;
        saveable.getStateVersionConversion = function(loadedStateVersion, targetStateVersion) {
            if (loadedStateVersion === 1 && targetStateVersion === 2) {
                return function(oldState) {
                    var newState = {};
                    newState['testProp'] = oldState['testProp'] + 10;
                    newState['testObj'] = oldState['testObj'];
                    return newState;
                }
            }
        };

        saver.loadFrom(storage);

        expect(saveable.saveState['testProp']).toBe(11);
        expect(saveable.saveState['testObj']['foo']).toBe(3);
    });
});

/*
 * Copyright Olli Etuaho 2017.
 */

'use strict';

var testSaveable = function() {
    var TestSaveable = function() {
        this.saveName = 'testSaveable';
        this.state = {'testProp': 1, 'testObj': {'foo': 3}};
        this.stateDefaults = {'testProp': 2, 'testObj': {'foo': 4}};
    };

    TestSaveable.prototype = new GJS.Saveable();
    
    TestSaveable.prototype.setStateToOtherValues = function() {
        this.state['testProp'] = 545365;
        this.state['testObj']['foo'] = 623424;
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
        
        expect(saveable.state['testProp']).toBe(2);
        expect(saveable.state['testObj']['foo']).toBe(4);
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
        
        expect(saveable.state['testProp']).toBe(1);
        expect(saveable.state['testObj']['foo']).toBe(3);
    });

    it('fills in missing properties from defaults', function() {
        var saveable = testSaveable();
        saveable.state = {'testObj': {'foo': 3}};
        saveable.stateDefaults = {'testObj': {'foo': 4}};

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
        
        expect(saveable.state['testProp']).toBe(2);
        expect(saveable.state['testObj']['foo']).toBe(3);
    });

    it('recursively fills in missing properties from defaults', function() {
        var saveable = testSaveable();

        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });

        var storage = testStorage();

        saver.saveTo(storage);

        saveable.applyStateDefaultsRecursivelyLevels = 1;
        saveable.stateDefaults['testObj']['bar'] = 1337;

        saver.loadFrom(storage);

        expect(saveable.state['testProp']).toBe(1);
        expect(saveable.state['testObj']['foo']).toBe(3);
        expect(saveable.state['testObj']['bar']).toBe(1337);
    });

    it('handles two savers with different names', function() {
        var saveableA = testSaveable();
        var saveableB = testSaveable();
        saveableB.state['testProp'] = 5;
        saveableB.state['testObj']['foo'] = 7;

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

        expect(saveableA.state['testProp']).toBe(1);
        expect(saveableA.state['testObj']['foo']).toBe(3);

        expect(saveableB.state['testProp']).toBe(5);
        expect(saveableB.state['testObj']['foo']).toBe(7);
    });

    it('converts data between versions', function() {
        var saveable = testSaveable();
        saveable.stateVersion = 1;

        var saver = new GJS.StateSaver({
            gameName: 'testGame',
            savedObjects: [saveable]
        });

        var storage = testStorage();

        saver.saveTo(storage);

        saveable.stateVersion = 2;
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

        expect(saveable.state['testProp']).toBe(11);
        expect(saveable.state['testObj']['foo']).toBe(3);
    });
});

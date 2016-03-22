/*
 * Copyright Olli Etuaho 2016.
 */

'use strict';

var testUnlockCondition = function() {
    var TestCondition = function(options) {
        this.initCondition(options);
    };
    
    TestCondition.prototype = new UnlockCondition();
    
    TestCondition.prototype.update = function(gameState, deltaTime) {
        if (gameState.unlocked) {
            this.fulfilled = true;
        }
    };
    
    return new TestCondition({unlockId: 'test'});
};

/**
 * @constructor
 */
var TestGameState = function() {
    this.unlocked = false;
};

describe('unlocker', function() {
    it('initializes a condition', function() {
        var condition = testUnlockCondition();
        expect(condition.unlockId).toBe('test');
        expect(condition.fulfilled).toBe(false);
    });

    it('initializes', function() {
        var unlocker = new Unlocker({
            gameName: 'testGame',
            needCommitUnlocks: true,
            conditions: [testUnlockCondition()]
        });
        expect(unlocker.gameName).toBe('testGame');
        expect(unlocker.needCommitUnlocks).toBe(true);
        expect(unlocker.unlocks['test']).toBe(false);
    });
    
    it('updates', function() {
        var gameState = new TestGameState();
        var unlocker = new Unlocker({
            gameName: 'testGame',
            needCommitUnlocks: false,
            conditions: [testUnlockCondition()]
        });
        unlocker.update(gameState, 1 / 60);
        expect(unlocker.unlocks['test']).toBe(false);
        gameState.unlocked = true;
        unlocker.update(gameState, 1 / 60);
        expect(unlocker.unlocks['test']).toBe(true);
    });
    
    it('manually commits unlocks', function() {
        var gameState = new TestGameState();
        var unlocker = new Unlocker({
            gameName: 'testGame',
            needCommitUnlocks: true,
            conditions: [testUnlockCondition()]
        });
        gameState.unlocked = true;
        unlocker.update(gameState, 1 / 60);
        expect(unlocker.unlocks['test']).toBe(false);
        expect(unlocker._fulfilledConditions.length).toBe(1);

        var fulfilled = unlocker.popFulfilledUnlockConditions();
        expect(fulfilled.length).toBe(1);
        expect(fulfilled[0]).toBe('test');
        expect(unlocker._fulfilledConditions.length).toBe(0);

        unlocker.commitUnlock('test');
        expect(unlocker.unlocks['test']).toBe(true);
    });
});
/*
 * Copyright Olli Etuaho 2016.
 */

'use strict';

var testStorage = function() {
    var TestStorage = function() {
        this.data = {};
    };
    
    TestStorage.prototype.setItem = function(key, value) {
        this.data[key] = String(value);
    };
    
    TestStorage.prototype.getItem = function(key) {
        if (this.data.hasOwnProperty(key)) {
            return this.data[key];
        }
        return null;
    };
    
    return new TestStorage();
};

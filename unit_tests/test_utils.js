/*
 * Copyright Olli Etuaho 2016.
 */

const TestStorage = function() {
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

const testStorage = function() {
    return new TestStorage();
};

export { testStorage }

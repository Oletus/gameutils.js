
import { arrayUtil, stringUtil, objectUtil, querystringUtil } from "../src/gjs/utiljs.js";

describe('arrayUtil', function() {
    var expectIdentical = function(arr, original) {
        for (var i = 0; i < arr.length; ++i) {
            expect(arr[i]).toBe(original[i]);
        }
    };

    it('shuffles an array', function() {
        var arr = [1, 2, 3, 4, 5, 6];
        var original = arr.slice(0);

        var shuffled = arrayUtil.shuffle(arr);
        // Shuffling changes elements
        while (shuffled[0] == arr[0] || shuffled[shuffled.length - 1] == arr[arr.length - 1]) {
            var shuffled = arrayUtil.shuffle(shuffled);
        }
        // Length is preserved
        expect(shuffled.length).toBe(arr.length);
        // Original not changed
        expect(arr).not.toBe(shuffled);
        expectIdentical(arr, original);
    });

    it('removes elements from an array', function() {
        var arr1 = [1, 2, 6, 5, 4, 3];
        var original = arr1.slice(0);

        var arr2 = [3, 6, 1];
        var filtered = arrayUtil.filterArray(arr1, arr2);
        expectIdentical(arr1, original);
        expect(filtered[0]).toBe(2);
        expect(filtered[1]).toBe(5);
        expect(filtered[2]).toBe(4);
    });

    it('generates a random subset of an array', function() {
        var arr1 = [1, 2, 6, 5, 4, 3];
        var original = arr1.slice(0);
        var filtered = arrayUtil.randomSubset(arr1, 3);
        expect(filtered.length).toBe(3);
        
        var filtered = arrayUtil.randomSubset(arr1, 100);
        expect(filtered.length).toBe(6);
        
        expectIdentical(arr1, original);
    });
    
    it('generates subsets of an array in order', function() {
        var arr = [1, 2, 3, 4, 5];
        var original = arr.slice(0);

        expectIdentical(arrayUtil.nthSubset(arr, 5, 0), [1, 2, 3, 4, 5]);

        expectIdentical(arrayUtil.nthSubset(arr, 3, 0), [1, 2, 3]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 1), [1, 2, 4]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 2), [1, 2, 5]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 3), [1, 3, 4]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 4), [1, 3, 5]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 5), [1, 4, 5]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 6), [2, 3, 4]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 7), [2, 3, 5]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 8), [2, 4, 5]);
        expectIdentical(arrayUtil.nthSubset(arr, 3, 9), [3, 4, 5]);

        expectIdentical(arr, original);
    });
    
    it('stable sorts an array', function() {
        var arr = [
            {x: 1, y: 1},
            {x: 1, y: 2},
            {x: 1, y: 3},
            {x: 2, y: 1},
            {x: 2, y: 2},
            {x: 2, y: 3},
            {x: 3, y: 1},
            {x: 3, y: 2},
            {x: 3, y: 3}
        ];
        // Original order
        for (var i = 0; i < arr.length; ++i) {
            expect(arr[i].x).toBe(Math.floor(i / 3) + 1);
            expect(arr[i].y).toBe(i % 3 + 1);
        }

        // Sort to a different order
        arrayUtil.stableSort(arr, function(a, b) {
            if (a.y === b.y) {
                return 0;
            } else if (a.y < b.y) {
                return -1;
            } else {
                return 1;
            }
        });
        expect(arr.length).toBe(9);
        for (var i = 0; i < arr.length; ++i) {
            expect(arr[i].y).toBe(Math.floor(i / 3) + 1);
            expect(arr[i].x).toBe(i % 3 + 1);
        }

        arrayUtil.stableSort(arr, function(a, b) {
            if (a.x === b.x) {
                return 0;
            } else if (a.x < b.x) {
                return -1;
            } else {
                return 1;
            }
        });
        // Original order
        expect(arr.length).toBe(9);
        for (var i = 0; i < arr.length; ++i) {
            expect(arr[i].x).toBe(Math.floor(i / 3) + 1);
            expect(arr[i].y).toBe(i % 3 + 1);
        }
    });
});

describe('stringUtil', function() {
    it('capitalizes the first letter in a string', function() {
        var str = 'i am a string';
        var original = str;
        var str2 = stringUtil.capitalizeFirstLetter(str);
        expect(str2[0]).toBe('I');
        for (var i = 1; i < str.length; ++i) {
            expect(str2[i]).toBe(str[i]);
        }
        expect(str).toEqual(original);
    });
});

describe('objectUtil', function() {
    it('initializes an object with default values', function() {
        var Constructor = function(options) {
            var defaults = {
                a: 0,
                b: 1
            };
            objectUtil.initWithDefaults(this, defaults, options);
        };
        var obj = new Constructor({b: 2, c: 3});
        expect(obj.a).toBe(0);
        expect(obj.b).toBe(2);
        expect(obj.hasOwnProperty('c')).toBe(false);
    });

    it("doesn't store references to default values in initialized values", function() {
        var inited = {};
        var defaults = {
            obj: { field: 0 },
            arr: [2, 3, 4]
        };
        objectUtil.initWithDefaults(inited, defaults, {});
        expect(inited.obj).not.toBe(defaults.obj);
        expect(inited.arr).not.toBe(defaults.arr);
        expect(inited.obj.field).toBe(0);
        expect(inited.arr[0]).toBe(2);
        expect(inited.arr[1]).toBe(3);
        expect(inited.arr[2]).toBe(4);
    });
});

describe('querystringUtil', function() {
    var querystring = '?x=1&y=2';

    it('gets a querystring value by the key', function() {
        expect(querystringUtil.get('x', querystring)).toBe('1');
        expect(querystringUtil.get('y', querystring)).toBe('2');
    });

    it('returns undefined when the key is missing', function() {
        expect(querystringUtil.get('z', querystring)).toBe(undefined);
    });

    it('returns the empty string when the key has no value', function() {
        expect(querystringUtil.get('a', '?a&b=1')).toBe('');
        expect(querystringUtil.get('b', '?a=1&b')).toBe('');
    });
});

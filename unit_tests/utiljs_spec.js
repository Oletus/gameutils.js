'use strict';

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
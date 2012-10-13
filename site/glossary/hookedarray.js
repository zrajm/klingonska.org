////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
//
// FUTURE PLANS
//
// HookedArray should only implement the array functions, and as little extra
// as possible.
//
// On initialization, `new HookedArray([ARRRAYISH])`, one should be able to
// pass any array-like object, and this object's methods (or its prototype's
// methods) should be used in subsequent manipulations of the object. (This so
// that one may chain array-like objects, e.g. have one implementing undo
// functions, another implementing automatic storage, and on top of that use
// this module to invoke callbacks etc.).
//
// The standard array function should work as similar to the standard ones as
// possible. (I.e. the underlying functions should be called directly, with the
// same arguments they were passed.)
//
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////



//
// FIXME: Make sure this constructor function works even without the 'new'
// keyword.
//
//
// This module uses the technique described in "Wrappers. Prototype chain
// injection." in
// [http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/]
//

//
// Usage: $obj = new HookedArray(<CALLBACK>);
//
// Creates an array. Whenever array content is modified <CALLBACK> is invoked,
// if it returns false, the change will be denied (and the user-invoked method
// [e.g. .push()] will return 'false', instead of its normal return value). If
// it returns true, changes are made. (<CALLBACK> may also invoke secondary
// effects, e.g. updating of stuff in the DOM, or similar.)
//
// There is also a postChange callback that will be invoked if any changes were
// made (i.e. if the preChange callback is unset or returns 'true').
//
//
// METHODS
//
//     thingy.set(index, value); // => value
//     thingy.set(index, function); // => value
//
//         Replace the element at specified index with `value`. Return the
//         value passed in, or false. (I.e. does the same as `array[index] =
//         value`.)
//
//         If `function` is given, then that function is invoked using
//         `HookedArray.FUNCTION(oldValues, calledAs)`. If `function` returns a
//         list, then that list wil be inserted instead of the old values,
//         otherwise nothing will be inserted (meaning that the function can
//         also edit values in-place, but that this will mean that the pre- and
//         postChange callbacks will not be able to see the old values.
//
//     thingy.insert(index, values); // => values
//
//         Insert values (an array) into `thingy`, shifting all later values
//         down. Returns the values passed in, or false.
//
// HookedArray inherits from Array -- which means that all methods that can be
// used for arrays also can be used for HookedArrays. Methods that modify the
// HookedArray (sort, reverse, push, pop, shift, unshift and splice), however,
// also invoke the HookedArray callback function.
//
// There are also two special HookedArray methods called 'preChange' and
// 'postChange', which can be used to replace or remove the callbacks.
//
//   thingy.preChange([CALLBACK]);
//   thingy.postChange([CALLBACK]);
//
// CALLBACK INVOCATION
//
//     callback(startIndex, addValues, removeValues, calledAs);
//
// Both callback functions are passed the same arguments: Index of the first
// element modified, list of values (to be) removed, and a list of the values
// (to be) inserted. If values are only inserted (i.e. no values are deleted
// from the array) then `removeValues` is an empty list. If values are only
// deleted (i.e. no new values are inserted) then `addValues` is an empty list.
//
// `calledAs` is the name of the invoked method. E.g. 'push', 'pull', 'splice'
// or 'reverse'.
//
// If both `removeValues` and `addValues` are empty lists, then no callbacks
// will be invoked at all, and the array will remain unchanged. (This happens
// if the user tries to add an empty list somewhere in the array.)
//
// CAVEATS AND LIMITATIONS
//
// When using the 'sort' and 'reverse' methods the callbacks will be passed
// with the entire array as arguments (i.e. the entire old array as
// `removeValues` and the entire sorted/reversed array as `newValues`) -- You
// may still use the callback return value to abort the sort/reverse.
//
// Using the normal array notation (array[index]) to change values in a
// HookedArray is not recommended. It will change the content of the array
// *without* invoking the callback function.
//
function HookedArray(callback) {
    'use strict';
    var obj = [], proto = '__proto__', l;
    if (!HookedArray.prototype.splice) {
        l = HookedArray.prototype = [];
        l.splice = function (index, howMany, values, calledAs) {
            var max, result, length = this.length, oldValues = [];
            if (! values instanceof Array) {
                throw new TypeError('HookedArray.setCallback() argument must be an array');
            }
            // fix incoming values
            if (values === undefined) { values = []; }
            if (index > length) { index = length; }
            if (index < 0) {
                index = length + index;
                if (index < 0) { index = 0; }
            }
            max = length - index;
            if (howMany === undefined || howMany === null || howMany > max) { howMany = max; }
            if (!calledAs) { calledAs = 'splice'; }
            // make change
            if (howMany === 0 && values.length === 0) { return []; } // no change
            if (howMany > 0) { oldValues = this.slice(index, index + howMany); }
            if (!this.preChangeCallback || this.preChangeCallback(index, values, oldValues, calledAs)) {
                if (values instanceof Function) {
                    values = values.call(this, oldValues, calledAs);
                    if (values) {
                        result = [].splice.apply(this, [].concat(index, howMany, values));
                    }
                } else {
                    result = [].splice.apply(this, [].concat(index, howMany, values));
                }
                if (this.postChangeCallback) {
                    this.postChangeCallback(index, values, oldValues, calledAs);
                }
                return result;
            }
            return false;
        };
        l.set = function (index, value) { return this.splice(index, 1, value, 'set') && value; };
        l.insert = function (index, values) { return this.splice(index, 0, values, 'insert') && values; };
        l.sort = function (func) { return this.splice(0, null, [].sort.call(this.concat(), func), 'sort') && this; };
        l.reverse = function () { return this.splice(0, null, [].reverse.call(this.concat()), 'reverse') && this; };
        l.push = function (values) { return this.splice(this.length, 0, values, 'push') && this.length; };
        l.pop = function () { return this.splice(-1, 1, [], 'pop')[0]; };
        l.shift = function () { return this.splice(0, 1, [], 'shift')[0]; };
        l.unshift = function (values) { return this.splice(0, 0, values, 'unshift') && this.length; };
        l.setCallback = function (name, func) {
            if (func && typeof func !== 'function') { // falsy or function
                throw new TypeError('HookedArray.setCallback() argument must be function');
            }
            this[name + 'Callback'] = func;
            return this;
        };
        l.preChange  = function (func) { return this.setCallback('preChange',  func); };
        l.postChange = function (func) { return this.setCallback('postChange', func); };
    } // endif
    obj[proto] = HookedArray.prototype;
    obj.preChange(callback);
    return obj;
}

// eof

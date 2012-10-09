if (typeof require == "function" && typeof module == "object") {
    buster = require("buster");
    require("./livearray");
}

var assert = buster.assert, refute = buster.refute;

buster.testCase('HookedArray() tests', {
    'Inherited methods before object creation': function () {
        assert.isFunction(HookedArray, 'HookedArray() constructor should exist');
        refute.isFunction(HookedArray.prototype.splice, '.splice() method should not exist');
        refute.isFunction(HookedArray.prototype.sort, '.sort() method should not exist');
        refute.isFunction(HookedArray.prototype.reverse, '.reverse() method should not exist');
        refute.isFunction(HookedArray.prototype.push, '.push() method should not exist');
        refute.isFunction(HookedArray.prototype.pop, '.pop() method should not exist');
        refute.isFunction(HookedArray.prototype.shift, '.shift() method should not exist');
        refute.isFunction(HookedArray.prototype.unshift, '.unshift() method should not exist');
        refute.isFunction(HookedArray.prototype.preChange, '.preChange() method should not exist');
        refute.isFunction(HookedArray.prototype.postChange, '.postChange() method should not exist');
    },
    '': {
        setUp: function () {
            this.oldProto = HookedArray.prototype;
            this.object   = new HookedArray();
        },
        tearDown: function () {
            // restore to what is was before invoking 'new HookedArray();'
            HookedArray.prototype = this.oldProto;
        },
        '': {
            'Inherited methods after object creation': function () {
                assert.isFunction(HookedArray, 'HookedArray() constructor should exist');
                assert.isFunction(HookedArray.prototype.splice, '.splice() method should not exist');
                assert.isFunction(HookedArray.prototype.sort, '.sort() method should not exist');
                assert.isFunction(HookedArray.prototype.reverse, '.reverse() method should not exist');
                assert.isFunction(HookedArray.prototype.push, '.push() method should not exist');
                assert.isFunction(HookedArray.prototype.pop, '.pop() method should not exist');
                assert.isFunction(HookedArray.prototype.shift, '.shift() method should not exist');
                assert.isFunction(HookedArray.prototype.unshift, '.unshift() method should not exist');
                assert.isFunction(HookedArray.prototype.preChange, '.preChange() method should not exist');
                assert.isFunction(HookedArray.prototype.postChange, '.postChange() method should not exist');
            },
            // FIXME: Check prototype chain: HookedArray -> Array -> Object (more?)
            'Object instantances': function () {
                var object = this.object;
                assert(object instanceof HookedArray);
                assert(object instanceof Array);
                assert(object instanceof Object);
            },
            'Method:': {
                // FIXME: Add test of .splice()
                setUp: function () {
                    that = this;
                    this.callback = function (indexName, oldName, newName, returnValue) {  // returns a function
                        return function (index, oldValues, newValues) {
                            that[indexName] = index;
                            that[oldName]   = oldValues;
                            that[newName]   = newValues;
                            return returnValue;
                        };
                    };
                },
                'object.sort(sortFunc) => sortedArray': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.push([2,1]);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.sort().concat(), [1,2], 'Should return sorted array');
                    assert.equals(this.startIndex, 0, 'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues, [2,1], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues, [1,2], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(), [1,2], 'Array not properly modified');
                },
                'object.reverse() => reversedArray': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.push([1,2]);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.reverse().concat(), [2,1], 'Should return reversed array');
                    assert.equals(this.startIndex, 0, 'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues, [1,2], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues, [2,1], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(), [2,1], 'Array not properly modified');
                },
                'object.set(newElement) => newElement': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.preChange (this.callback('preIndex',  'preOld',  'preNew',  true));
                    obj.postChange(this.callback('postIndex', 'postOld', 'postNew', true));

                    // set on empty array
                    assert.equals(obj.set(0, 'a'), 'a', '.set() on empty array');
                    assert.equals(this.preIndex, 0, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['a'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a'], 'Array not properly modified');

                    // set() with too large index (should add to end)
                    assert.equals(obj.set(50, 'b'), 'b', '.set() with too large index');
                    assert.equals(this.preIndex, 1, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['b'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a', 'b'], 'Array not properly modified');

                    // set() with too large negative index (should replace first element)
                    assert.equals(obj.set(-50, 'c'), 'c', '.set() with too large negative index');
                    assert.equals(this.preIndex, 0, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, ['a'], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['c'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['c', 'b'], 'Array not properly modified');

                    // set() used normally (should replace specified value)
                    obj.splice(0,obj.length, ['a', 'b', 'c']);
                    assert.equals(obj.set(1, 'x'), 'x', '.set() to replace existing value');
                    assert.equals(this.preIndex, 1, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, ['b'], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['x'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a', 'x', 'c'], 'Array not properly modified');
                },
                'object.insert(newElement) => newElement': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.preChange (this.callback('preIndex',  'preOld',  'preNew',  true));
                    obj.postChange(this.callback('postIndex', 'postOld', 'postNew', true));

                    // insert on empty array
                    assert.equals(obj.insert(0, ['a']), ['a'], '.insert() on empty array');
                    assert.equals(this.preIndex, 0, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['a'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a'], 'Array not properly modified');

                    // insert() with too large index (should add to end)
                    assert.equals(obj.insert(50, ['b']), ['b'], '.insert() with too large index');
                    assert.equals(this.preIndex, 1, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['b'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a', 'b'], 'Array not properly modified');

                    // insert() with too large negative index (should add to beginning)
                    assert.equals(obj.insert(-50, ['c']), ['c'], '.insert() with too large negative index');
                    assert.equals(this.preIndex, 0, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['c'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['c', 'a', 'b'], 'Array not properly modified');

                    // insert() used normally (should insert before specified value)
                    obj.splice(0,obj.length, ['a', 'b', 'c']);
                    assert.equals(obj.insert(1, ['x']), ['x'], '.insert() to before existing value');
                    assert.equals(this.preIndex, 1, 'Pre-callback received incorrect preIndex');
                    assert.equals(this.preOld, [], 'Pre-callback received incorrect preOld');
                    assert.equals(this.preNew, ['x'], 'Pre-callback received incorrect preNew');
                    assert.equals(obj.concat(),['a', 'x', 'b', 'c'], 'Array not properly modified');
                },
                'object.push(addArray) => newLength': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.push(['a', 'b']);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.push(    ['x', 'y']), 4, 'Should return new array length');
                    assert.equals(this.startIndex,    2,        'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues,   [        ], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues,   ['x', 'y'], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(),['a', 'b', 'x', 'y'], 'Array not properly modified');
                },
                'object.pop() => lastElement': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    assert.equals(obj.pop(), undefined, '.pop() on empty array');
                    obj.push(['a', 'b']);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.pop(),    'b',  'Should return last array element');
                    assert.equals(this.startIndex,    1,   'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues,   ['b'], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues,   [   ], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(),['a'], 'Array not properly modified');
                },
                'object.shift() => firstElement': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    assert.equals(obj.shift(), undefined, '.shift() on empty array');
                    obj.push(['a', 'b']);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.shift(),  'a',  'Should return first array element');
                    assert.equals(this.startIndex,    0,   'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues,   ['a'], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues,   [   ], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(),['b'], 'Array not properly modified');
                },
                'object.unshift(addArray) => newLength': function () {
                    var startIndex, oldValues, newValues, obj = new HookedArray();
                    obj.push(['a', 'b']);
                    obj.preChange(this.callback('startIndex', 'oldValues', 'newValues', true));
                    assert.equals(obj.unshift( ['x', 'y']), 4, 'Should return new array length');
                    assert.equals(this.startIndex,    0,        'Pre-callback received incorrect startIndex');
                    assert.equals(this.oldValues,   [        ], 'Pre-callback received incorrect oldValues');
                    assert.equals(this.newValues,   ['x', 'y'], 'Pre-callback received incorrect newValues');
                    assert.equals(obj.concat(),['x', 'y', 'a', 'b'], 'Array not properly modified');
                },
                'object.preChange(callback) => HookedArray': {
                    '(no callback)': function () {
                        var obj      = new HookedArray();
                            postFunc = this.callback('postIndex', 'postOld', 'postNew');
                        obj.push(['a']);
                        assert.same(obj.preChange(),          obj, 'Should return HookedArray object');
                        assert.same(obj.postChange(postFunc), obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']), 2,          'Should succeed without preChange callback');
                        assert.equals(this.postIndex,  1,          'Post-callback received incorrect startIndex');
                        assert.equals(this.postOld,  [   ],        'Post-callback received incorrect oldValues');
                        assert.equals(this.postNew,  ['b'],        'Post-callback received incorrect newValues');
                        assert.equals(obj.concat(),  ['a', 'b'],   'Should contain pushed element');
                    },
                    '(callback returning false)': function () {
                        var obj      = new HookedArray(),
                            preFunc  = this.callback('preIndex',  'preOld',  'preNew',  false),
                            postFunc = this.callback('postIndex', 'postOld', 'postNew');
                        obj.push(['a']);
                        assert.same(obj.preChange(preFunc), obj, 'Should return HookedArray object');
                        assert.same(obj.postChange(postFunc), obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']), false, 'Should fail since preChange returned "true"');
                        assert.equals(this.preIndex,  1,   'Pre-callback received incorrect preIndex');
                        assert.equals(this.preOld,  [   ], 'Pre-callback received incorrect preOld');
                        assert.equals(this.preNew,  ['b'], 'Pre-callback received incorrect preNew');
                        assert.equals(this.postIndex, undefined, 'Post-callback should not have been invoked');
                        assert.equals(this.postOld,   undefined, 'Post-callback should not have been invoked');
                        assert.equals(this.postNew,   undefined, 'Post-callback should not have been invoked');
                        assert.equals(obj.concat(), ['a'], 'Should not contain pushed element');
                    },
                    '(callback returning true)': function () {
                        var obj  = new HookedArray(),
                            preFunc  = this.callback('preIndex',  'preOld',  'preNew',  true),
                            postFunc = this.callback('postIndex', 'postOld', 'postNew');
                        obj.push(['a']);
                        assert.same(obj.preChange(preFunc), obj, 'Should return HookedArray object');
                        assert.same(obj.postChange(postFunc), obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']), 2, 'Should succeed since preChange returned "true"');
                        assert.equals(this.preIndex, 1,  'Pre-callback received incorrect index');
                        assert.equals(this.preOld, [   ], 'Pre-callback received incorrect old values');
                        assert.equals(this.preNew, ['b'], 'Pre-callback received incorrect new values');
                        assert.equals(this.postIndex, 1, 'Post-callback received incorrect index');
                        assert.equals(this.postOld, [   ], 'Post-callback received incorrect old values');
                        assert.equals(this.postNew, ['b'], 'Post-callback received incorrect new values');
                        assert.equals(obj.concat(), ['a', 'b'], 'Should contain pushed element');
                    }
                },
                'object.postChange(callback) => HookedArray': {
                    '(no callback)': function () {
                        var obj = new HookedArray();
                        obj.push(['a']);
                        assert.same(obj.postChange(),        obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']),         2, 'Should succeed without postChange callback');
                        assert.equals(obj.concat(), ['a', 'b'],   'Should contain pushed element');
                    },
                    '(callback returning false)': function () {
                        var obj  = new HookedArray(),
                            preFunc = this.callback('preIndex', 'preOld', 'preNew', false);
                        obj.push(['a']);
                        assert.same(obj.postChange(preFunc), obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']),   2,   'Should return array length after successful push');
                        assert.equals(this.preIndex,   1,   'Pre-callback received incorrect preIndex');
                        assert.equals(this.preOld,  [   ], 'Pre-callback received incorrect preOld');
                        assert.equals(this.preNew,  ['b'], 'Pre-callback received incorrect preNew');
                        assert.equals(obj.concat(),    ['a', 'b'], 'Should contain pushed element');
                    },
                    '(callback returning true)': function () {
                        var obj  = new HookedArray(),
                            preFunc = this.callback('preIndex', 'preOld', 'preNew', true);
                        obj.push(['a']);
                        assert.same(obj.postChange(preFunc), obj, 'Should return HookedArray object');
                        assert.equals(obj.push(['b']),   2,   'Should return array length after successful push');
                        assert.equals(this.preIndex,   1,   'Pre-callback received incorrect preIndex');
                        assert.equals(this.preOld,  [   ], 'Pre-callback received incorrect preOld');
                        assert.equals(this.preNew,  ['b'], 'Pre-callback received incorrect preNew');
                        assert.equals(obj.concat(),    ['a', 'b'], 'Should contain pushed element');
                    }
                },

            }, // 'Method:'
        },
    },
});

// eof

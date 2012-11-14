/* file: compatibility */

/*****************************************************************************\
**                                                                           **
** ECMAScript 5 Compatibility Functions for Older Browsers                   **
**                                                                           **
\*****************************************************************************/
(function () {
    'use strict';
    // Add Object.create()
    if (typeof Object.create !== 'function') {
        Object.create = function (o) {
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
    // Add Object.keys()
    if (!Object.keys) {
        Object.keys = (function () {
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
                dontEnums = [
                    'toString',
                    'toLocaleString',
                    'valueOf',
                    'hasOwnProperty',
                    'isPrototypeOf',
                    'propertyIsEnumerable',
                    'constructor'
                ],
                dontEnumsLength = dontEnums.length;
            return function (obj) {
                var result = [], prop, i;
                if ((typeof obj !== 'object' && typeof obj !== 'function') || obj === null) {
                    throw new TypeError('Object.keys called on non-object');
                }
                for (prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        result.push(prop);
                    }
                }
                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i += 1) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
    }
}());

//eof

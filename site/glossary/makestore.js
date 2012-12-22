/* file:makestore */
/*global localStorage */

function makeStore(storageName) {
    'use strict';
    var proto = makeStore.proto;
    if (!proto) {
        proto = makeStore.proto = {
            load: function () {
                var data, prop;
                // FIXME: better way of handling error?

                // load from localStorage
                if (typeof storageName !== 'string') { return this; }
                data = JSON.parse(localStorage.getItem(storageName));
                if (typeof data !== 'object') { return this; }

                // copy read properties into `this`
                for (prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        this[prop] = data[prop];
                    }
                }
                // remove properties not in read data from `this`
                for (prop in this) {
                    if (this.hasOwnProperty(prop)) {
                        if (!data[prop]) { delete this[prop]; }
                    }
                }
                return this;
            },
            save: function () {
                // FIXME: better way of handling error?
                if (storageName) {
                    localStorage.setItem(storageName, JSON.stringify(this));
                }
                return this;
            },
            set: function (name, prop, value) {
                if (!this[name]) { this[name] = {}; }
                if (this[name][prop] !== value) {
                    this[name][prop] = value;
                    this.save();
                }
                return this;
            },
            get: function (name, prop) {
                return this[name] ? this[name][prop] : undefined;
            },
            keys: function () {
                return Object.keys(this);
            }
        };
    }
    return Object.create(proto).load();
}

//eof

if (typeof global.URL === 'undefined') {
    global.URL = require('url').URL;
}

if (!Object.fromEntries) {
    Object.fromEntries = function (entries) {
        if (!entries || typeof entries[Symbol.iterator] !== 'function') {
            throw new TypeError('Object.fromEntries() requires a single iterable argument');
        }

        let obj = {};
        for (let [key, value] of entries) {
            obj[key] = value;
        }

        return obj;
    };
}

if (!String.prototype.trimEnd) {
    String.prototype.trimEnd = function () {
        return this.replace(/\s+$/, '');
    };
}

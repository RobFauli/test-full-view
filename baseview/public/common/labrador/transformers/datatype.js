export const datatype = {

    object: {

        /**
         * Get member of object by dot-notated string
         * @param  {string} key    The key to get from the object. Support dot-notation
         * @param  {object} object The object to query for the key
         * @param  {boolean} allowUndefined If set to true return undefined if member do not exist. Can be used to check if sometning actually exist.
         * @example object.get("a.b", { a: { b: 2 } }) // will return 2.
         * @return {mixed}         The value from the query or null
         */
        get: (key = '', object = {}, allowUndefined = false) => {
            const callback = (obj, i) => (obj && (typeof (obj[i]) !== 'undefined') ? obj[i] : (allowUndefined ? undefined : null));
            return key.split('.').reduce(callback, object);
        },

        /**
         * Set a value to an object
         * @example objectHelper.set("b.c", [1,2], {a: 1}). Result: {a:1, b:{c: [1,2]}}.
         * @param {string} path  Path for value. Support dot-notation (fields.title)
         * @param {mixed}  value The value to set
         * @param {object} obj   The object to set value on
         */
        set: (path, value, obj) => {
            path.split('.').reduce((prev, cur, idx, arr) => {
                const isLast = (idx === arr.length - 1);
                if (isLast) {
                    prev[cur] = value;
                    return;
                }
                return (datatype.object.isObject(prev[cur])) ? prev[cur] : (prev[cur] = {});
            }, obj);
            return obj;
        },

        /**
         * Check if argument is an object
         * @return {Boolean}
         */
        isObject: (item) => item && typeof (item) === 'object' && !Array.isArray(item),

        // Deep merge
        // If any key contains an array this will not be merged but overridden.
        // source overrides target
        merge: (target, source) => {
            if (Array.isArray(target) && Array.isArray(source)) {
                return source;
            }
            const output = Object.assign(Array.isArray(target) ? [] : {}, target);
            if (datatype.object.isObject(target) && datatype.object.isObject(source)) {
                for (const key of Object.keys(source)) {
                    if (datatype.object.isObject(source[key])) {
                        // Case: target[key] = 'string', source[key] = {object} - Override
                        if (!(key in target) || !datatype.object.isObject(target[key])) {
                            Object.assign(output, { [key]: source[key] });
                        } else {
                            output[key] = datatype.object.merge(target[key], source[key]);
                        }
                    } else {
                        Object.assign(output, { [key]: source[key] });
                    }
                }
            }
            return output;
        }

    },

    string: {
        unique: (chars) => {
            const multiplier = `0x${ 10 ** (chars - 1) }`;
            return Math.floor((1 + Math.random()) * multiplier).toString(16);
        },
        strip_tags: (str = '') => (str || '').replace(/<(?:.|\n)*?>/gm, '').trim()
    }
};

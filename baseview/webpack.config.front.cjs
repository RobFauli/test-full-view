module.exports = {
    mode: 'production',
    entry: {
        app: './index_front.js'
    },
    output: {
        filename: 'baseview.js',
        path: `${ __dirname }/build/front/`,
        library: [ 'labradorView', 'baseview' ],
    },
    target: 'node12.8',
    watch: false
};

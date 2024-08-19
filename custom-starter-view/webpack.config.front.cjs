module.exports = {
    mode: 'production',
    entry: {
        app: './index_front.js'
    },
    output: {
        filename: 'custom-starter-view.js',
        path: `${ __dirname }/build/front/`,
        library: [ 'labradorView', 'custom-starter-view' ],
    },
    target: 'node12.8',
    watch: false
};

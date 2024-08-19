const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        dom: [
            './public/common/imageExpand.js',
            './public/common/ImageZoom.js',
            './public/common/AutoScroller.js',
            './public/common/SwipeHelper.js',
            './public/common/Parallax.js',
            './public/common/TabNavigation.js',
            './public/common/ElementAttributeToggler.js',
            './public/common/Mustache/mustache.min.js'
        ]
    },
    output: {
        filename: 'baseview_dependencies_[name].js',
        path: `${ __dirname }/public/common/build/`
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    format: {
                        comments: false,
                        preamble: `/*!
* Common client JS-dependencies
* (c) Publish Lab AS
* https://www.labradorcms.com
*/`
                    }
                },
                extractComments: false
            })
        ]
    },
    target: 'web',
    watch: false
};

/**
 * The build-file containing the modules is consumed by `public/common/baseview/moduleHandlers.js`
 */

const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    // mode: 'production',
    mode: 'development',
    entry: {
        modules: [
            './public/common/labrador/index.js'
        ]
    },
    output: {
        filename: 'baseview_dependencie_[name].js',
        path: `${ __dirname }/public/common/build/`,
        libraryTarget: 'module',
        chunkFormat: 'module'
    },
    // devtool: 'hidden-source-map',
    devtool: 'source-map',
    experiments: {
        outputModule: true
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
* (c) Labrador CMS AS
* Licence required for usage
* https://labradorcms.com
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

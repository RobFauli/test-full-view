// module.exports = {
//     mode: 'production',
//     entry: {
//         app: './index_front.js'
//     },
//     output: {
//         filename: 'baseview.js',
//         path: `${ __dirname }/build/front/`,
//         library: [ 'labradorView', 'baseview' ],
//     },
//     target: 'node12.8',
//     watch: false
// };



// const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");
// const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
    mode: 'production',
    // mode: 'development',
    entry: {
        client_modules: './index_client.js'
    },
    output: {
        filename: '[name].js',
        path: `${ __dirname }/build/modules/`,
        // library: 'LabradorClient',
        libraryTarget: 'module',
        chunkFormat: 'module'
    },

    // plugins: [new CompressionPlugin({
    //     deleteOriginalAssets: true,
    //     // filename: "[path].gz",
    //     algorithm: "gzip",
    // })],

    experiments: {
        outputModule: true
    },

    // Todo: Uglify ...
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            // parallel: true,
            // terserOptions: {
            //     // compress: true,
            //     // compress: {
            //     //     passes: 2,
            //     // },
            //     // output: {
            //     //     comments: false
            //     // }
            // }
        })],
        concatenateModules: true
    },
    target: 'web',
    // devtool: 'source-map',
    watch: false,
    // plugins: [
    //     new webpack.BannerPlugin({
    //         banner: `Baseview.\nBuild: [fullhash]\n(c) Labrador CMS AS\nhttps://www.labradorcms.com\n`
    //     })
    // ]
};

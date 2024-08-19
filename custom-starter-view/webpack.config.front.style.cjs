const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: glob.sync('./view/content/**/*.scss'),
  output: {
    path: `${ __dirname }/view/css/`,
    filename: 'main.js' // Gives output js files a name, which is ignored later.
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        'sass-loader'
      ]
    }]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'elements.css', // Output css file name
    }),
    new IgnoreEmitPlugin(/\.js$/), // Ignore / do not output js files.
  ],
};

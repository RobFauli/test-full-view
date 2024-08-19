module.exports = {
    mode: 'production',
    entry: {
      editor_modules: './modules/index_editor.js',
    },
    output: {
      filename: '[name].js',
      path: `${__dirname}/build/modules/`,
      libraryTarget: 'module',
      chunkFormat: 'module',
    },
  
    experiments: {
      outputModule: true,
    },
    target: 'web',
    devtool: 'source-map',
    watch: false,
  };

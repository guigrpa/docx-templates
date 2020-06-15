const path = require('path');

module.exports = {
  entry: { app: './client/index.js' },

  output: {
    filename: '[name].bundle.js',
    path: path.resolve(process.cwd(), './public'),
    publicPath: '',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
    ],
  },
};

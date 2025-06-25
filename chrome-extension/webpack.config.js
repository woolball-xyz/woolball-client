const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', 
  devtool: 'source-map',
  entry: {
    popup: './popup.js',
    background: './background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].chunk.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true
            }
          }
        ],
      },
    ],
    parser: {
      javascript: {
        dynamicImportMode: 'eager', 
        dynamicImportPrefetch: true,
        dynamicImportPreload: true 
      }
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '' },
        { from: 'popup.html', to: '' },
        { from: 'styles', to: 'styles' },
        { from: 'icon.svg', to: '' },
      ],
    }),
    new webpack.DefinePlugin({
      'import.meta': JSON.stringify({}) 
    }),
  ],
  experiments: {
    topLevelAwait: true,
  },
  optimization: {
    minimize: false, 
    splitChunks: {
      chunks(chunk) {
        return chunk.name !== 'background';
      },
    },
  },
  target: ['webworker', 'es2020']
};
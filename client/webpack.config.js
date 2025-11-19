const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  return {
    entry: path.resolve(__dirname, 'src/index.tsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'static/js/[name].[contenthash].js' : 'static/js/bundle.js',
      clean: true,
      publicPath: '/',
    },
    // Simpler devtool settings: fast builds in dev, full source maps in prod
    devtool: isProd ? 'source-map' : 'eval',
    resolve: {
      extensions: ['.web.tsx', '.tsx', '.web.ts', '.ts', '.web.js', '.js', '.json'],
      alias: {
        'react-native$': 'react-native-web',
        '@react-native-google-signin/google-signin': path.resolve(
          __dirname,
          'src/services/GoogleSignInWeb.ts',
        ),
        '@screens': path.resolve(__dirname, 'src/screens'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@types': path.resolve(__dirname, 'src/types'),
        '@native': path.resolve(__dirname, 'src/native'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(tsx?|jsx?)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              configFile: path.resolve(__dirname, 'babel.config.js'),
              presets: [
                ['@babel/preset-env', {targets: 'defaults'}],
                ['@babel/preset-react', {runtime: 'automatic'}],
                ['@babel/preset-typescript'],
              ],
            },
          },
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        favicon: undefined,
      }),
    ],
    devServer: {
      static: path.resolve(__dirname, 'public'),
      historyApiFallback: true,
      port: 8080,
      hot: true,
      open: false,
      allowedHosts: 'all',
      client: {
        overlay: true,
      },
    },
    performance: {
      hints: false,
    },
    stats: 'minimal',
  };
};

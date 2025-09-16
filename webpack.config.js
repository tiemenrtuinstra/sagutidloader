const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        main: './assets/ts/sagutid.ts',
        styles: './assets/scss/sagutid.scss',
    serviceworker: './assets/ts/Domain/ServiceWorker/serviceworker.ts'
    },

    devtool: 'source-map',

    output: {
        path: path.resolve(__dirname, 'assets/dist'),
        filename: pathData => {
            // Ensure the service worker output file is written as serviceworker.js (no chunk suffix)
            if (pathData.chunk && pathData.chunk.name === 'serviceworker') return 'serviceworker.js';
            return pathData.chunk && pathData.chunk.name === 'main' ? '[name].bundle.js' : '[name].js';
        },
        chunkFilename: '[name].js'
    },

    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript'],
                        sourceMaps: true
                    }
                }
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                            implementation: require("sass") // Use Dart Sass
                        }
                    }
                ]
            }
        ]
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.scss']
    },

    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/](lit|@lit|@material|tslib|lit-html|lit-element)[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 20,
                    enforce: true
                },
                commons: {
                    name: 'commons',
                    minChunks: 2,
                    priority: 10,
                    reuseExistingChunk: true
                }
            }
        },
        minimize: false,
        // minimizer: [
        //     new TerserPlugin({
        //         extractComments: false,
        //         terserOptions: { sourceMap: true }
        //     })
        // ]
    },

    plugins: [
        new RemoveEmptyScriptsPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css'
        }),
        // Type checking in a separate process
        new ForkTsCheckerWebpackPlugin({
            async: false,
            typescript: {
                configFile: 'tsconfig.json'
            }
        })
    ],

    devServer: {
        static: { directory: path.join(__dirname, 'assets/dist') },
        compress: true,
        port: 9000
    }
};
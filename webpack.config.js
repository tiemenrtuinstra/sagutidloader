const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production', // Use 'development' for debugging
    entry: {
        main: './assets/js/sagutid.js', // Entry point for JavaScript
        styles: './assets/scss/sagutid.scss', // Entry point for SCSS
    },
    output: {
        path: path.resolve(__dirname, 'assets/dist'),
        filename: (pathData) => {
            // Only generate JS for the 'main' entry
            return pathData.chunk.name === 'main' ? '[name].bundle.js' : '[name].js';
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Process JavaScript files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Optional: Use Babel for compatibility
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.scss$/, // Process SCSS files
                use: [
                    MiniCssExtractPlugin.loader, // Extract CSS into separate files
                    'css-loader', // Translates CSS into CommonJS
                    'sass-loader', // Compiles Sass to CSS
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.json', '.scss'], // Add extensions you use
    },
    optimization: {
        minimize: true, // Minify output
        minimizer: [
            new TerserPlugin({
                extractComments: false, // Prevent LICENSE file generation
            }),
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css', // Output CSS file
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'assets/dist'),
        },
        compress: true,
        port: 9000, // Development server port
    },
};
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
module.exports = {
    entry: {
        app: './src/app.js'
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].chunk.js?v=[chunkhash]',
        publicPath: "/test/dist/",
        path: path.resolve(__dirname, 'dist')
        //libraryTarget : "var",
        //library : 'ui'
    },
    plugins: [
        new CleanWebpackPlugin(['dist'])
        /*
        new ManifestPlugin({
            fileName: 'assets.json',
            basePath: '/'
        })

         */
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                include: path.join(__dirname),
                exclude: /(node_modules\/(?!(@saramin)\/).*)|(dist)/,
                use: {
                    loader : 'babel-loader',
                    options : {
                        presets: [
                            ['env', {
                                'targets': {
                                    'browsers': ['last 2 versions', 'ie >= 8']
                                }
                            }]
                        ]
                    }
                },
            }
        ]
    }
};

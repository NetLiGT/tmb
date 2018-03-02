const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const notifier = require('node-notifier')
const packageConfig = require('../package.json')
const vueLoaderConfig = require('./vue-loader.conf')

function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

module.exports = {
    entry: './src/main.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        publicPath: '/',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.js', '.json', '.vue', '.ts', 'tsx'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
            '@': resolve('src'),
        }
    },
    module: {
        rules: [
            /**
             * 如果启动检查，不能用ESLint会有很多Error， 需要用那个TSLint-vue，非官方维护，但是还不错
             * 1、使用方式：VSCode Plugin，关闭 TSLint，下载并启用 TSLint Vue即可
             * 2、在vue-loader中开启tslint-loader选项
             */
            // {
            //     test: /\.ts$/,
            //     exclude: /node_modules/,
            //     enforce: 'pre',
            //     loader: 'tslint-loader'
            // },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: vueLoaderConfig
            },
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    "babel-loader",
                    {
                        loader: "ts-loader",
                        options: { appendTsxSuffixTo: [/\.vue$/] }      // 给所有 .vue 文件添加 .ts的文件名后缀
                    }
                ]
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
            },
            {
                test: /\.css$/,
                loader: "style-loader!css-loader",
                // options: {
                //     limit: 10000,
                //     name: utils.assetsPath('img/[name].[hash:7].[ext]')
                // }
            },
            {
                test: /\.scss$/,
                loader: "style-loader!css-loader!sass-loader!"
            }
        ]
    },
    performance: {
        hints: false    // 超过 250kb 的资源,是否警告
    },
    devtool: 'cheap-module-eval-source-map',
    node: {
        // prevent webpack from injecting useless setImmediate polyfill because Vue
        // source contains it (although only uses it if it's native).
        setImmediate: false,
        // prevent webpack from injecting mocks to Node native modules
        // that does not make sense for the client
        dgram: 'empty',
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        child_process: 'empty'
    },
    devServer: {
        clientLogLevel: 'warning',
        historyApiFallback: {   // 任意的 404 响应都重定向到index.html
            rewrites: [
                { from: /.*/, to: path.posix.join('/', 'index.html') },
            ],
        },
        hot: true,
        contentBase: false, // since we use CopyWebpackPlugin.
        compress: true,     // 是否启动gzip压缩
        host: process.env.HOST || 'localhost',
        port: process.env.PORT && Number(process.env.PORT) || 8080,
        open: false,    // 是否开启浏览器
        overlay: { warnings: false, errors: true }, // 编译出错是否在浏览器上显示
        publicPath: '/',    // 此路径下的打包文件可在浏览器中访问
        proxy: {},
        /**
         * 启用 quiet 后，除了初始启动信息之外的任何内容都不会被打印到控制台。
         * 这也意味着来自 webpack 的错误或警告在控制台不可见。 
         * necessary for FriendlyErrorsPlugin
         */
        quiet: true,
        watchOptions: {     // 使用文件系统，获取文件改动的通知
            poll: false,    // 是否轮询
        }
    },
    plugins: [
        // 使用 webpack 的 DefinePlugin 来指定生产环境，以便在压缩时可以让 UglifyJS 自动删除警告代码块
        // new webpack.DefinePlugin({
        //     'process.env': {
        //         NODE_ENV: '"development"'
        //     },
        //     'mode': '"development"'
        // }),
        // 启用热替换模块, 永远不要在生产环境(production)下启用 HMR
        new webpack.HotModuleReplacementPlugin(),
        // 当开启 HMR 的时候使用该插件会显示模块的相对路径，建议用于开发环境
        // new webpack.NamedModulesPlugin(),
        // 在编译出现错误时，用来跳过输出阶段。这样可以确保输出资源不会包含错误
        // new webpack.NoEmitOnErrorsPlugin(),
        // 自动生成一个 html 模板文件，并且引用相关的 assets 文件(如 css, js)。
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: true
        }),
        // copy custom static assets
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, '../static'),
                to: 'static',
                ignore: ['.*']
            }
        ]),
        new FriendlyErrorsPlugin({
            compilationSuccessInfo: {
                messages: [`Your application is running here: http://localhost:8080`],
            },
            onErrors: (severity, errors) => {
                if (severity !== 'error') return

                const error = errors[0]
                const filename = error.file && error.file.split('!').pop()

                notifier.notify({
                    title: packageConfig.name,
                    message: severity + ': ' + error.name,
                    subtitle: filename || '',
                    icon: path.join(__dirname, 'logo.png')
                })
            }
        })
    ]
}

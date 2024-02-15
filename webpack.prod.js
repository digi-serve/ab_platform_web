const path = require("path");
const APP = path.resolve(__dirname);
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CompressionPlugin = require("compression-webpack-plugin");
const Critters = require("critters-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { sentryWebpackPlugin } = require("@sentry/webpack-plugin");
const webpack = require("webpack");

module.exports = merge(common, {
   mode: "production",
   module: {
      rules: [
         {
            test: /\.css$/i,
            use: [MiniCssExtractPlugin.loader, "css-loader?url=false"],
         },
      ],
   },
   plugins: [
      new HtmlWebpackPlugin({
         template: "./webpack/index.ejs",
         filename: path.join(APP, "..", "web", "assets", "index.html"),
         inject: "body",
         minify: {
            collapseWhitespace: true,
            keepClosingSlash: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: false,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
         },
      }),
      new CompressionPlugin({
         exclude: /index\.ejs/,
      }),
      new MiniCssExtractPlugin(),
      new webpack.DefinePlugin({
         WEBPACK_MODE: JSON.stringify("production"),
         VERSION: JSON.stringify(process.env.npm_package_version),
         SENTRY_DSN: JSON.stringify(
            "https://c16443e39a66eae141954dfd23890812@o144358.ingest.sentry.io/4505832903147520"
         ),
      }),
      new Critters({
         pruneSource: true,
         preload: "swap",
      }),
      sentryWebpackPlugin({
         authToken: process.env.SENTRY_AUTH_TOKEN,
         org: "appdev-designs",
         project: "appbuilder-web",
      }),
   ],
   devtool: "source-map",
   optimization: {
      usedExports: true,
      minimizer: [
         `...`, // <- this tells webpack to use existing minifiers
         new CssMinimizerPlugin(),
      ],
   },
});

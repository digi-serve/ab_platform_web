const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const CompressionPlugin = require("compression-webpack-plugin");
const webpack = require("webpack");

module.exports = merge(common, {
   mode: "production",
   plugins: [
      new CompressionPlugin({
         exclude: /index\.ejs/,
      }),
      new webpack.DefinePlugin({
         WEBPACK_MODE: JSON.stringify("production"),
         VERSION: JSON.stringify(process.env.npm_package_version),
         SENTRY_DSN: JSON.stringify(
            "https://c16443e39a66eae141954dfd23890812@o144358.ingest.sentry.io/4505832903147520"
         ),
      }),
   ],
   devtool: "source-map",
});

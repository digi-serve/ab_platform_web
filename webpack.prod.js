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
      }),
   ],
   devtool: "source-map",
});

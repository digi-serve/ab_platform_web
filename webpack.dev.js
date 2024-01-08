const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const webpack = require("webpack");

module.exports = merge(common, {
   mode: "development",
   devtool: "source-map",
   module: {
      rules: [
         {
            test: /\.css$/,
            use: ["style-loader", "css-loader?url=false"],
         },
      ],
   },
   plugins: [
      new webpack.DefinePlugin({
         WEBPACK_MODE: JSON.stringify("development"),
         VERSION: JSON.stringify(process.env.npm_package_version),
         SENTRY_DSN: JSON.stringify(undefined),
      }),
   ],
});

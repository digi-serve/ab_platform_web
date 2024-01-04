const path = require("path");
const APP = path.resolve(__dirname);
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
   context: APP,
   entry: {
      app: path.join(APP, "index.js"),
   },
   output: {
      path: path.join(APP, "..", "web", "assets"),
      filename: "[name].[contenthash].js",
   },
   module: {
      rules: [
         {
            test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
            use: ["url-loader?limit=10000000"],
         },
         {
            test: /\.js$/,
            enforce: "pre",
            use: ["source-map-loader"],
         },
      ],
   },
   plugins: [
      new HtmlWebpackPlugin({
         template: "./webpack/index.ejs",
         filename: path.join(APP, "..", "web", "assets", "index.html"),
         inject: "body",
         publicPath: "/assets",
      }),
      new CleanWebpackPlugin({
         cleanOnceBeforeBuildPatterns: [
            "*.js",
            "*.js.map",
            "*.gz",
            "*.LICENSE.txt",
         ],
      }),
   ],
   resolve: {
      alias: {
         assets: path.resolve(__dirname, "..", "web", "assets"),
      },
   },
   optimization: {
      moduleIds: "deterministic",
      runtimeChunk: "single",
      splitChunks: {
         cacheGroups: {
            vendor: {
               test: /[\\/]node_modules[\\/](?!pdfjs\-dist)/,
               name: "vendor",
               chunks: "all",
               reuseExistingChunk: true,
            },
         },
      },
   },
};

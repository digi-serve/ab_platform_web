const path = require("path");
const APP = path.resolve(__dirname);
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
   context: APP,
   entry: {
      app: path.join(APP, "index.js"),
      "pdf.worker": "pdfjs-dist/build/pdf.worker.entry",
   },
   output: {
      path: path.join(APP, "..", "web", "assets"),
      filename: "[name].[contenthash].js",
   },
   module: {
      rules: [
         {
            test: /\.css$/,
            use: ["style-loader", "css-loader?url=false"],
         },
         {
            test: /\.(eot|woff|woff2|svg|ttf)([?]?.*)$/,
            use: ["url-loader?limit=10000000"],
         },
      ],
   },
   plugins: [
      new HtmlWebpackPlugin({
         template: "./webpack/index.ejs",
         filename: "../../../web/assets/index.html",
         inject: "body",
         publicPath: "/assets",
      }),
      new CleanWebpackPlugin({
         cleanOnceBeforeBuildPatterns: [
            "!dependencies/*",
            "!font/*",
            "!fonts/*",
            "!images/*",
            "!plugins/*",
            "!skins/*",
            "!tenant/*",
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
               test: /[\\/]node_modules[\\/]/,
               name: "vendors",
               chunks: "all",
            },
         },
      },
   },
};

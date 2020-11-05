const webpack = require("webpack"); //to access built-in plugins
var path = require("path");
var APP = path.resolve(__dirname);

module.exports = {
   mode: "development", // "production", "none"
   context: APP,
   entry: {
      app: path.join(APP, "index.js"),
   },
   output: {
      path: path.join(APP, "..", "..", "assets"),
      filename: "[name].js",
   },
   module: {
      rules: [
         // {
         //     test: /\.(js|jsx)$/,
         //     loader: "babel-loader"
         // },
         {
            test: /\.css$/,
            use: ["style-loader", "css-loader?url=false"],
         },
         {
            test: /\.(eot|woff|woff2|svg|ttf)([\?]?.*)$/,
            use: ["url-loader?limit=10000000"],
         },
      ],
   },
   devtool: "source-map",
   plugins: [],
   resolve: {
      alias: {
         assets: path.resolve(__dirname, "..", "..", "assets"),
      },
   },
};

const path = require("path");
const APP = path.resolve(__dirname);

module.exports = {
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
   plugins: [],
   resolve: {
      alias: {
         assets: path.resolve(__dirname, "..", "..", "assets"),
      },
   },
};

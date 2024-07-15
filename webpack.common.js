const path = require("path");
const APP = path.resolve(__dirname);
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
   context: APP,
   entry: {
      app: path.join(APP, "index.js"),
      sailsio: path.join(APP, "init", "sailsIo.js"),
   },
   output: {
      path: path.join(APP, "..", "web", "assets"),
      filename: "[name].[contenthash].js",
      publicPath: "/assets/",
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
            vendors: false,
            default: false,
            pdfjs: {
               test: /[\\/]node_modules[\\/]pdfjs-dist|[\\/]init[\\/]pdfjs/,
               filename: "pdfjs.[name].[contenthash].mjs",
               chunks: "all",
               reuseExistingChunk: true,
               priority: 10,
            },
            formio: {
               test: /[\\/]node_modules[\\/](?:formiojs|bootstrap)|[\\/]init[\\/]formio/,
               filename: "formio.[name].[contenthash].js",
               chunks: "all",
               reuseExistingChunk: true,
               priority: 10,
            },
            tinymce: {
               test: /[\\/]node_modules[\\/]tinymce|[\\/]js[\\/]webix[\\/]extras[\\/]tinymce/,
               filename: "tinymce.[name].[contenthash].js",
               chunks: "all",
               reuseExistingChunk: true,
               priority: 10,
            },
            vendor: {
               test: /[\\/]node_modules[\\/](?!pdfjs-dist)(?!formiojs)(?!bootstrap)(?!tinymce)/,
               filename: "vendor.[name].[contenthash].js",
               chunks: "all",
               reuseExistingChunk: true,
            },
            orgchart: {
               test: /[\\/]js[\\/]orgchart-webcomponents.js/,
               filename: "orgchart.[name].[contenthash].js",
               chunks: "all",
               reuseExistingChunk: true,
               priority: 10,
            },
         },
      },
   },
   experiments: {
      topLevelAwait: true,
   },
};

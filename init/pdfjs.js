/**
 * pdfJS - load the pdfjs dependcies including the web worker. This is a
 * seperate file so we dynamically import it where needed, reducing the inital
 * size of the app.
 */

import "pdfjs-dist/build/pdf.worker.mjs";
// import pdfjs from "pdfjs-dist/webpack";
const pdfjs = require("pdfjs-dist/webpack.mjs");

export default pdfjs;

// import * as pdfjsLib from "pdfjs-dist";
// import * as pdfWorker from "pdfjs-dist/build/pdf.worker.mjs";

// // Setting worker path to worker bundle.
// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// export { pdfjsLib };

/**
 * pdfJS - load the pdfjs dependcies including the web worker. This is a
 * seperate file so we dynamically import it where needed, reducing the inital
 * size of the app.
 */

import "pdfjs-dist/build/pdf.worker";
// import pdfjs from "pdfjs-dist/webpack";
const pdfjs = require("pdfjs-dist/webpack");

export default pdfjs;

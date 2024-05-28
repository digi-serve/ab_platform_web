/**
 * pdfJS - load the pdfjs dependcies including the web worker. This is a
 * seperate file so we dynamically import it where needed, reducing the inital
 * size of the app.
 */

import * as pdfjs from "pdfjs-dist/webpack.mjs";

export default pdfjs;

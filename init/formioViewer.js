/**
 * formioViewer - load the formio dependcy (not inculding formio builder). This is a
 * seperate file so that we dynamically import it where needed, reducing the inital
 * size of the app.
 *
 * Note: As of formio@v4 cannot exclued the builder so this code is quite large.
 * Watch for v5 where we can render with a much smaller library (@formio/core).
 */
import "bootstrap/dist/css/bootstrap.css";
import "formiojs/dist/formio.form.css";
import { Form } from "formiojs/formio.form.js";
console.log("importing fo");
export default Form;

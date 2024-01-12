/**
 * formio- load the formio dependency. This is a seperate file so that we can
 * dynamically import it where needed, reducing the inital size of the app.
 *
 * Note: As of formio@v4 cannot exclued the builder so this code is quite large.
 * Watch for v5 where we can render with a much smaller library (@formio/core).
 */
import "bootstrap/dist/css/bootstrap.css";
import "formiojs/dist/formio.form.css";
import { Form, FormBuilder } from "formiojs";
export { Form, FormBuilder };

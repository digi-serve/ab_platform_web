/*
 * initAttach.js
 * attach our UI to the DIV we found earlier.
 */

import UI from "../ui/ui.js";

export default {
   init: (AB) => {
      return new Promise((resolve, reject) => {
         var div = AB.div();

         UI.attach(div.id);
         AB.ui(UI);
         AB.ui().init(AB);

         resolve();
      });
   },
};

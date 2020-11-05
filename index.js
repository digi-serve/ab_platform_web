import loaderCSS from "./styles/loader.css";

import AB from "./AppBuilder/ABFactory.js";

AB.bootstrap().catch((err) => {
   var errorMSG = err.toString();

   AB.alert({
      type: "alert-error",
      title: "Error initializing Portal:",
      text: errorMSG,
   });

   AB.error(err);
});

/*
 * initDiv.js
 * find or create an initial <div> for our Appbuilder portal
 */
export default {
   init: (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"

      return new Promise((resolve, reject) => {
         // find our initial <div appbuilder-portal="default" /> tag
         var div = document.querySelector("div[appbuilder-portal]");
         if (!div) {
            div = document.createElement("Div");
            div.setAttribute("appbuilder-portal-autoenter", "true");
            div.setAttribute("appbuilder-portal-fullscreen", "true");
            document.getElementsByTagName("body")[0].appendChild(div);
            let loading = document.createElement("Div");
            loading.style.justifyContent = "center";
            loading.style.alignItems = "center";
            loading.style.display = "flex";
            loading.style.height = "100vh";
            // loading.style.animation = "spinning 1s ease infinite";

            loading.innerHTML = `<svg style="opacity: 0.6; animation: spinning 1s ease infinite; width: 25px; height: 25px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M304 48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zm0 416c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM48 304c26.5 0 48-21.5 48-48s-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48zm464-48c0-26.5-21.5-48-48-48s-48 21.5-48 48s21.5 48 48 48s48-21.5 48-48zM142.9 437c18.7-18.7 18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zm0-294.2c18.7-18.7 18.7-49.1 0-67.9S93.7 56.2 75 75s-18.7 49.1 0 67.9s49.1 18.7 67.9 0zM369.1 437c18.7 18.7 49.1 18.7 67.9 0s18.7-49.1 0-67.9s-49.1-18.7-67.9 0s-18.7 49.1 0 67.9z"/></svg>`;
            document.getElementsByTagName("body")[0].appendChild(loading);
            const css = window.document.styleSheets[0];
            css.insertRule(
               `@keyframes spinning {
                     0%   { transform: rotate(0deg); }
                     100% { transform: rotate(360deg); }
               }`,
               css.cssRules.length
            );
         }
         // make sure there is a div.id set:
         if (!div.id) {
            div.id = "AppBuilder";
         }
         BS.div(div);
         BS.Config.settingsFromDiv(div); // set the autoEnter config
         resolve();
      });
   },
};

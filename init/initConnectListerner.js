/*
 * initConnectListerner.js
 * listen disconnect event of WebSocket and display message when disconnect
 */
export default {
   init: (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"

      return new Promise((resolve, reject) => {
         const L = (...params) => BS.AB.Multilingual.label(...params);

         io.socket.on("disconnect", function () {
            const body = document.querySelector("body");
            body.insertAdjacentHTML(
               "afterbegin",
               `<div id='connectionPrompt' style='height: 0px;'>
                  ${L("*Oops, we cannot communicate with the site.")}
               </div>`
            );
         });

         resolve();
      });
   },
};

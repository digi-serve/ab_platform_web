import { nanoid } from "nanoid";
export default {
   init: async (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"
      let updated;
      try {
         if (BS.AB) {
            updated = await BS.AB.Network.get(
               { url: "/definition/check-update" },
               { key: "def_check_update" }
            );
         } else {
            const headers = new Headers();
            const token = BS.Config.setting("tenant");
            if (token) {
               headers.append("tenant-token", token);
            }

            const response = await fetch("/definition/check-update", {
               headers,
               credentials: "include",
            });
            if (!response.ok) {
               BS.error(`Error communicating with Server: ${response.status}`);
            }
            const res = await response.json();
            updated = res.data;
         }
      } catch (err) {
         BS.error("initDefinitions: GET /definition/check-update", err);
         return;
      }

      // if we are Switcherood to another user, we need to ignore our current
      // cached definition.  Current way to do that is to simply give a random
      // hash for our 'updated' value.
      if (BS.Config?.userReal()) {
         updated = nanoid();
      }
      await new Promise((resolve, reject) => {
         var cb = () => resolve();
         // Adding the script tag to the head as suggested before
         const head = document.head;
         const script = document.createElement("script");
         script.type = "text/javascript";
         script.src = `/definition/myapps?v=${updated}`;

         // Then bind the event to the callback function.
         // There are several events for cross browser compatibility.
         script.onreadystatechange = cb;
         script.onload = cb;
         script.onerror = () => {
            reject(
               new Error(
                  `initDefinitions: Error loading definitions (/definition/myapps?v=${updated})`
               )
            );
         };
         // Fire the loading
         head.appendChild(script);
      });
   },
};

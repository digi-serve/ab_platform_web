export default {
   init: async (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"
      const headers = new Headers();
      const token = BS.Config.setting("tenant");
      if (token) {
         headers.append("tenant-token", token);
      }

      const response = await fetch("/definition/check-update", { headers });
      if (!response.ok) {
         BS.error(`Error communicating with Server: ${response.status}`);
      }
      const res = await response.json();
      const updated = res.data;

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
            reject(new Error(`Error defs`));
         };
         // Fire the loading
         head.appendChild(script);
      });
   },
};

async function ScriptLoad(url) {
   await new Promise((resolve, reject) => {
      var cb = () => resolve();
      // Adding the script tag to the head as suggested before
      const head = document.head;
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = url;

      // Then bind the event to the callback function.
      // There are several events for cross browser compatibility.
      script.onreadystatechange = cb;
      script.onload = cb;
      script.onerror = () => {
         reject(
            new Error(`Preloader:ScriptLoad(): Error loading script (${url})`)
         );
      };
      // Fire the loading
      head.appendChild(script);
   });
}

async function Preload() {
   let allScripts = [];

   allScripts.push(ScriptLoad("/config/site"));

   await Promise.all(allScripts);
}

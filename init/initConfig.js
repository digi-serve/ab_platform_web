export default {
   init: async (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"
      try {
         let configData;
         // Use `AB.Network` if available
         if (BS.AB) {
            configData = await BS.AB.Network.get(
               { url: "/config" },
               { key: "init_config" }
            );
         } else {
            const headers = new Headers();
            const token = BS.Config.setting("tenant");
            if (token) {
               headers.append("tenant-token", token);
            }

            //// DEV TESTING:
            //// uncomment the api_sails/authTenant.js && index.ejs entries for these values
            //// to test url prefix route resolutions:
            // var prefix = AB.setting("prefix");
            // if (prefix) {
            //    headers.append("Tenant-Test-Prefix", prefix);
            // }
            //// DEV TESTING

            const response = await fetch("/config", { headers });
            if (response.ok) {
               const { data } = await response.json();
               configData = data;
            } else {
               BS.error(`Error communicating with Server: ${response.status}`);
            }
         }
         // Hotfix 11/30/22, Since we no longer send settings on the div including in config.
         BS.Config.settings(configData.settings);
         delete configData.settings;
         BS.Config.config(configData);
      } catch (err) {
         BS.error("initConfig: GET /config:", err);
         // HOTFIX: (12/15/2022) If the user visits /home directly /config is
         // the first request made to sails and if we're not authenticated but
         // using OKTA or CAS, we get a CORS error when trying to authenticate.
         // Send the user to / to get authenticated correctly.
         if (err.message == "Failed to fetch")
            window.location.replace(window.location.origin);
      }
   },
};

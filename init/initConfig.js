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
         console.log({ configData });
         BS.Config.config(configData);
      } catch (err) {
         BS.error("initConfig: GET /config:", err);
      }
   },
};

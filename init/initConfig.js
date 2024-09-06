export default {
   init: async (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"
      try {
         BS.Config.settings(window.__AB_Settings);
         let configData = window.__AB_Config;
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

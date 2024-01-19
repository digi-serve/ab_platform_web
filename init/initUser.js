export default {
   init: async (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"
      try {
         let configData = {
            user: window.__AB_Config_User,
            userReal: window.__AB_Config_User_real,
         };
         BS.Config.configUser(configData);
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

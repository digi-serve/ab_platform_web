export default {
   init: (BS) => {
      // BS {Bootstrap}
      // The initial Bootstrap object found in "./Bootstrap.js"

      return new Promise((resolve, reject) => {
         var headers = new Headers();
         var token = BS.Config.setting("tenant");
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

         fetch("/config", { headers })
            .then((response) => {
               if (response.ok) {
                  // wait for .json()
                  response.json().then((res) => {
                     console.log(res);
                     BS.Config.config(res.data);
                     resolve();
                  });
               } else {
                  BS.error(
                     `Error communicating with Server: ${response.status}`
                  );
                  reject(response.status);
               }
            })
            .catch((err) => {
               console.error("initConfig:fetch(/config):", err);
            });
      });
   },
};

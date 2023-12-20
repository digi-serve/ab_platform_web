/**
 * @param {puppeteer.Browser} browser
 * @param {{url: string, options: LHCI.CollectCommand.Options}} context
 */
module.exports = async (browser) => {
   // launch browser for LHCI
   console.log("AppBuilder Auth - Start");
   const page = await browser.newPage();
   page.on("console", (message) => {
      console.log(`Console: ${message.text()}`);
   });
   page.on("error", (error) => {
      console.log("Error in page context:", error);
   });
   try {
      await page.setDefaultNavigationTimeout(90000);
      await page.goto("http://127.0.0.1");
      await page.waitForSelector('[data-cy="portal_auth_login_form_email"]');
      await page.type(
         '[data-cy="portal_auth_login_form_email"]',
         "neo@thematrix.com"
      );
      await page.type('[data-cy="portal_auth_login_form_password"]', "admin");
      await page.click('[data-cy="portal_auth_login_form_submit"]');
      await page.waitForNavigation();
   } catch (err) {
      console.log("Error in puppeteer auth script:", err);
   }

   // close session for next run
   await page.close();
   console.log("AppBuilder Auth - Finished");
};

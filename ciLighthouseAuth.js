/**
 * This is a puppeteer script to login to AppBuilder
 * It is used in our Lighthouse CI test
 * @param {puppeteer.Browser} browser
 */
module.exports = async (browser) => {
   // launch browser for LHCI
   console.log("AppBuilder Auth - Start");
   const page = await browser.newPage();
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
